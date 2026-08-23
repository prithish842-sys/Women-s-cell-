import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { generateWellnessReply } from '../services/aiWellness.js';

const router = Router();

const moods = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'OVERWHELMED'] as const;
const sleepQualities = ['POOR', 'AVERAGE', 'GOOD', 'VERY_GOOD'] as const;
const feelings = ['Happy', 'Calm', 'Motivated', 'Tired', 'Anxious', 'Stressed', 'Lonely', 'Sad', 'Angry', 'Confused', 'Overwhelmed'] as const;

const CheckInSchema = z.object({
  mood: z.enum(moods),
  stressLevel: z.coerce.number().int().min(1).max(5),
  energyLevel: z.coerce.number().int().min(1).max(5),
  sleepQuality: z.enum(sleepQualities),
  feelings: z.array(z.enum(feelings)).max(8).default([]),
  reflection: z.string().max(1200).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const PrivacySchema = z.object({
  personalizeAiWithCheckIns: z.coerce.boolean().default(false),
  storeAiChatHistory: z.coerce.boolean().default(false),
});

const ChatSchema = z.object({
  message: z.string().min(1).max(1600),
  languagePreference: z.enum(['AUTO', 'ENGLISH', 'TAMIL', 'TANGLISH']).default('AUTO'),
  sessionId: z.string().optional().nullable(),
});

const CounsellingRequestSchema = z.object({
  supportType: z.enum(['COUNSELLOR_CALL', 'IN_PERSON_MEETING', 'SUPPORT_INFORMATION']),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  preferredTime: z.string().max(40).optional().nullable(),
  reasonCategory: z.string().min(2).max(80),
  note: z.string().max(1200).optional().nullable(),
});

function todayDateOnly() {
  return new Date(new Date().toISOString().slice(0, 10));
}

function dateOnly(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : todayDateOnly();
}

function serializeCheckIn(checkIn: any) {
  if (!checkIn) return checkIn;
  return {
    ...checkIn,
    _id: checkIn.id,
    date: checkIn.date instanceof Date ? checkIn.date.toISOString().slice(0, 10) : checkIn.date,
  };
}

async function requireStudentProfile(req: AuthenticatedRequest, res: Response) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!._id! } });
  if (!profile) {
    res.status(404).json({ success: false, message: 'Student profile not found.' });
    return null;
  }
  return profile;
}

function summarizeTrends(checkIns: any[]) {
  const moodCounts: Record<string, number> = {};
  const feelingCounts: Record<string, number> = {};
  let stressTotal = 0;
  let energyTotal = 0;
  for (const item of checkIns) {
    moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
    stressTotal += item.stressLevel;
    energyTotal += item.energyLevel;
    for (const feeling of item.feelings || []) {
      feelingCounts[feeling] = (feelingCounts[feeling] || 0) + 1;
    }
  }
  const count = checkIns.length || 1;
  return {
    checkIns: checkIns.length,
    moodDistribution: moodCounts,
    averageStress: checkIns.length ? Number((stressTotal / count).toFixed(1)) : null,
    averageEnergy: checkIns.length ? Number((energyTotal / count).toFixed(1)) : null,
    commonFeelings: Object.entries(feelingCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count })),
  };
}

router.get('/me/privacy', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const settings = await prisma.wellbeingPrivacySetting.upsert({
      where: { studentId: profile.id },
      update: {},
      create: { studentId: profile.id },
    });
    return res.json({ success: true, data: { ...settings, _id: settings.id } });
  } catch (error) {
    next(error);
  }
});

router.put('/me/privacy', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = PrivacySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const settings = await prisma.wellbeingPrivacySetting.upsert({
      where: { studentId: profile.id },
      update: parsed.data,
      create: { studentId: profile.id, ...parsed.data },
    });
    return res.json({ success: true, data: { ...settings, _id: settings.id } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/check-ins', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const days = Math.min(Math.max(parseInt(String(req.query.days || '30'), 10), 1), 90);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days + 1);
    since.setUTCHours(0, 0, 0, 0);
    const rows = await prisma.wellbeingCheckIn.findMany({
      where: { studentId: profile.id, date: { gte: since } },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: rows.map(serializeCheckIn), meta: { trends: summarizeTrends(rows) } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/today', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const checkIn = await prisma.wellbeingCheckIn.findUnique({
      where: { studentId_date: { studentId: profile.id, date: todayDateOnly() } },
    });
    return res.json({ success: true, data: serializeCheckIn(checkIn) });
  } catch (error) {
    next(error);
  }
});

router.put('/me/today', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = CheckInSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const checkInDate = dateOnly(parsed.data.date);
    const checkIn = await prisma.wellbeingCheckIn.upsert({
      where: { studentId_date: { studentId: profile.id, date: checkInDate } },
      update: {
        mood: parsed.data.mood,
        stressLevel: parsed.data.stressLevel,
        energyLevel: parsed.data.energyLevel,
        sleepQuality: parsed.data.sleepQuality,
        feelings: parsed.data.feelings,
        reflection: parsed.data.reflection || null,
      },
      create: {
        studentId: profile.id,
        date: checkInDate,
        mood: parsed.data.mood,
        stressLevel: parsed.data.stressLevel,
        energyLevel: parsed.data.energyLevel,
        sleepQuality: parsed.data.sleepQuality,
        feelings: parsed.data.feelings,
        reflection: parsed.data.reflection || null,
      },
    });
    return res.json({ success: true, message: 'Wellbeing check-in saved.', data: serializeCheckIn(checkIn) });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/check-ins/:checkInId', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const existing = await prisma.wellbeingCheckIn.findFirst({ where: { id: req.params.checkInId, studentId: profile.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Check-in not found.' });
    await prisma.wellbeingCheckIn.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Check-in deleted.' });
  } catch (error) {
    next(error);
  }
});

router.post('/me/chat', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const settings = await prisma.wellbeingPrivacySetting.upsert({
      where: { studentId: profile.id },
      update: {},
      create: { studentId: profile.id },
    });

    let context;
    if (settings.personalizeAiWithCheckIns) {
      const recent = await prisma.wellbeingCheckIn.findMany({
        where: { studentId: profile.id },
        orderBy: { date: 'desc' },
        take: 7,
      });
      const today = recent.find(row => row.date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10));
      context = {
        mood: today?.mood,
        stressLevel: today?.stressLevel,
        energyLevel: today?.energyLevel,
        sleepQuality: today?.sleepQuality,
        feelings: today?.feelings || [],
        trend: summarizeTrends(recent),
      };
    }

    const reply = await generateWellnessReply({
      message: parsed.data.message,
      languagePreference: parsed.data.languagePreference,
      context,
    });

    let sessionId = parsed.data.sessionId || null;
    if (settings.storeAiChatHistory) {
      const session = sessionId
        ? await prisma.aiChatSession.findFirst({ where: { id: sessionId, studentId: profile.id } })
        : await prisma.aiChatSession.create({ data: { studentId: profile.id, title: parsed.data.message.slice(0, 80) } });
      if (!session) return res.status(404).json({ success: false, message: 'Chat session not found.' });
      sessionId = session.id;
      await prisma.aiChatMessage.createMany({
        data: [
          { sessionId, role: 'USER', content: parsed.data.message, language: reply.language },
          { sessionId, role: 'ASSISTANT', content: reply.content, language: reply.language },
        ],
      });
      await prisma.aiChatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    }

    return res.json({
      success: true,
      data: {
        sessionId,
        message: reply.content,
        language: reply.language,
        providerAvailable: reply.providerAvailable,
        safetyRisk: reply.safetyRisk,
        usedCheckInContext: !!context,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/counselling-requests', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = CounsellingRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.counsellingRequest.create({
        data: {
          studentId: profile.id,
          supportType: parsed.data.supportType,
          preferredDate: parsed.data.preferredDate ? new Date(`${parsed.data.preferredDate}T00:00:00.000Z`) : null,
          preferredTime: parsed.data.preferredTime || null,
          reasonCategory: parsed.data.reasonCategory,
          note: parsed.data.note || null,
        },
      });
      const admins = await tx.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'SYSTEM',
            title: 'Counsellor support requested',
            message: 'A student requested wellbeing support. Review the aggregate support queue.',
            link: '/admin/safety/wellbeing',
          })),
        });
      }
      return created;
    });
    return res.status(201).json({ success: true, message: 'Support request submitted.', data: { ...request, _id: request.id } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/counselling-requests', auth, authorize(['STUDENT']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireStudentProfile(req, res);
    if (!profile) return;
    const requests = await prisma.counsellingRequest.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, data: requests.map(row => ({ ...row, _id: row.id })) });
  } catch (error) {
    next(error);
  }
});

export default router;
