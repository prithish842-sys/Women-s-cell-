import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const list = z.array(z.string().max(500)).max(20).default([]);
const httpUrl = (message = 'URL must start with http:// or https://') =>
  z.string().trim().url(message).refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, message);
const SafetyGuideSchema = z.object({
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  category: z.enum(['EMERGENCY_SELF_PROTECTION', 'DIGITAL_SAFETY', 'SAFE_TRAVEL', 'HARASSMENT_RESPONSE', 'EVIDENCE_PRESERVATION', 'ONLINE_ACCOUNT_PROTECTION', 'CYBERSTALKING_AWARENESS', 'PUBLIC_TRANSPORT_SAFETY']),
  introduction: z.string().min(20).max(1200),
  whatToKnow: list,
  warningSigns: list,
  immediateActions: list,
  stepByStepGuidance: list,
  dos: list,
  donts: list,
  whenToSeekHelp: list,
  relatedContactCategories: z.array(z.enum(['EMERGENCY', 'WOMEN_SUPPORT', 'POLICE', 'CYBER_CRIME', 'CHILD_PROTECTION', 'COLLEGE_SUPPORT', 'MEDICAL_SUPPORT', 'COUNSELLING_SUPPORT'])).max(8).default([]),
  officialResourceIds: z.array(z.string().max(120)).max(20).default([]),
  isPublished: z.coerce.boolean().default(false),
  lastVerifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

const EmergencyResourceSchema = z.object({
  name: z.string().min(2).max(160),
  purpose: z.string().min(5).max(800),
  phone: z.string().max(30).optional().nullable(),
  alternatePhone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  website: httpUrl('Website must start with http:// or https://').optional().nullable().or(z.literal('')),
  category: z.enum(['EMERGENCY', 'WOMEN_SUPPORT', 'POLICE', 'CYBER_CRIME', 'CHILD_PROTECTION', 'COLLEGE_SUPPORT', 'MEDICAL_SUPPORT', 'COUNSELLING_SUPPORT']),
  isEmergency: z.coerce.boolean().default(false),
  isOfficial: z.coerce.boolean().default(false),
  sourceName: z.string().max(160).optional().nullable(),
  verifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  isActive: z.coerce.boolean().default(true),
});

const statusSchema = z.object({
  status: z.enum(['REQUESTED', 'ACKNOWLEDGED', 'SCHEDULED', 'COMPLETED', 'CANCELLED']),
  assignedCounsellor: z.string().max(160).optional().nullable(),
});

const serialize = (row: any) => ({ ...row, _id: row.id });
const parseDate = (value?: string | null) => value ? new Date(`${value}T00:00:00.000Z`) : null;

router.get('/guides', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const rows = await prisma.safetyGuide.findMany({ orderBy: { updatedAt: 'desc' } });
    return res.json({ success: true, data: rows.map(serialize) });
  } catch (error) {
    next(error);
  }
});

router.post('/guides', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = SafetyGuideSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const created = await prisma.safetyGuide.create({
      data: { ...parsed.data, lastVerifiedDate: parseDate(parsed.data.lastVerifiedDate), createdById: req.user!._id! },
    });
    return res.status(201).json({ success: true, message: 'Safety guide created.', data: serialize(created) });
  } catch (error) {
    next(error);
  }
});

router.put('/guides/:guideId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = SafetyGuideSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const updated = await prisma.safetyGuide.update({
      where: { id: req.params.guideId },
      data: { ...parsed.data, lastVerifiedDate: parseDate(parsed.data.lastVerifiedDate) },
    });
    return res.json({ success: true, message: 'Safety guide updated.', data: serialize(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch('/guides/:guideId/publish', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const updated = await prisma.safetyGuide.update({
      where: { id: req.params.guideId },
      data: { isPublished: !!req.body.isPublished },
    });
    return res.json({ success: true, data: serialize(updated) });
  } catch (error) {
    next(error);
  }
});

router.get('/resources', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const rows = await prisma.emergencyResource.findMany({ orderBy: [{ isActive: 'desc' }, { category: 'asc' }, { name: 'asc' }] });
    return res.json({ success: true, data: rows.map(serialize) });
  } catch (error) {
    next(error);
  }
});

router.post('/resources', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = EmergencyResourceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const created = await prisma.emergencyResource.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        verifiedDate: parseDate(parsed.data.verifiedDate),
        createdById: req.user!._id!,
      },
    });
    return res.status(201).json({ success: true, message: 'Emergency resource created.', data: serialize(created) });
  } catch (error) {
    next(error);
  }
});

router.put('/resources/:resourceId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = EmergencyResourceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const updated = await prisma.emergencyResource.update({
      where: { id: req.params.resourceId },
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        verifiedDate: parseDate(parsed.data.verifiedDate),
      },
    });
    return res.json({ success: true, message: 'Emergency resource updated.', data: serialize(updated) });
  } catch (error) {
    next(error);
  }
});

router.get('/wellbeing/analytics', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

    const [todayCount, sevenDayRows, thirtyDayRows, counsellingSummary] = await Promise.all([
      prisma.wellbeingCheckIn.count({ where: { date: today } }),
      prisma.wellbeingCheckIn.findMany({ where: { date: { gte: sevenDaysAgo } }, select: { mood: true, stressLevel: true, energyLevel: true, feelings: true } }),
      prisma.wellbeingCheckIn.findMany({ where: { date: { gte: thirtyDaysAgo } }, select: { mood: true, stressLevel: true, energyLevel: true, feelings: true } }),
      prisma.counsellingRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const summarize = (rows: typeof sevenDayRows) => {
      const moodDistribution: Record<string, number> = {};
      const feelingCounts: Record<string, number> = {};
      let stress = 0;
      let energy = 0;
      for (const row of rows) {
        moodDistribution[row.mood] = (moodDistribution[row.mood] || 0) + 1;
        stress += row.stressLevel;
        energy += row.energyLevel;
        for (const feeling of row.feelings || []) feelingCounts[feeling] = (feelingCounts[feeling] || 0) + 1;
      }
      return {
        total: rows.length,
        moodDistribution,
        averageStress: rows.length ? Number((stress / rows.length).toFixed(1)) : null,
        averageEnergy: rows.length ? Number((energy / rows.length).toFixed(1)) : null,
        commonFeelings: Object.entries(feelingCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count })),
      };
    };

    return res.json({
      success: true,
      data: {
        checkInsToday: todayCount,
        sevenDay: summarize(sevenDayRows),
        thirtyDay: summarize(thirtyDayRows),
        counsellingRequests: counsellingSummary.reduce<Record<string, number>>((acc, row) => {
          acc[row.status] = row._count._all;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wellbeing/counselling-requests', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const rows = await prisma.counsellingRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { student: { include: { user: { select: { name: true } } } } },
    });
    return res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        _id: row.id,
        student: { _id: row.student.id, name: row.student.user.name, department: row.student.department, course: row.student.course },
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/wellbeing/counselling-requests/:requestId/status', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const updated = await prisma.counsellingRequest.update({
      where: { id: req.params.requestId },
      data: parsed.data,
    });
    return res.json({ success: true, message: 'Support request updated.', data: serialize(updated) });
  } catch (error) {
    next(error);
  }
});

export default router;
