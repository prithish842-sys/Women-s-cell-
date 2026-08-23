import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { uploadAnonymousConcernAttachment } from '../middleware/upload.js';
import { baselineSafetyGuides, officialEmergencyResources } from '../data/verifiedSafetyResources.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const AnonymousConcernSchema = z.object({
  category: z.string().min(2).max(80),
  description: z.string().min(20).max(4000),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  location: z.string().max(160).optional().nullable(),
});

const serializeGuide = (guide: any) => ({
  ...guide,
  _id: guide.id,
  lastVerifiedDate: guide.lastVerifiedDate instanceof Date ? guide.lastVerifiedDate.toISOString().slice(0, 10) : guide.lastVerifiedDate,
});

const serializeResource = (resource: any) => ({
  ...resource,
  _id: resource.id,
  verifiedDate: resource.verifiedDate instanceof Date ? resource.verifiedDate.toISOString().slice(0, 10) : resource.verifiedDate,
});

async function makeAnonymousReference() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const referenceNumber = `AC-${crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`;
    const existing = await prisma.anonymousConcern.findUnique({ where: { referenceNumber } });
    if (!existing) return referenceNumber;
  }
  return `AC-${Date.now().toString(36).toUpperCase()}`;
}

async function publishedDatabaseGuides() {
  return prisma.safetyGuide.findMany({
    where: { isPublished: true },
    orderBy: [{ lastVerifiedDate: 'desc' }, { updatedAt: 'desc' }],
  });
}

async function activeDatabaseResources(category?: string) {
  return prisma.emergencyResource.findMany({
    where: {
      isActive: true,
      ...(category ? { category: category as any } : {}),
    },
    orderBy: [{ isEmergency: 'desc' }, { verifiedDate: 'desc' }, { name: 'asc' }],
  });
}

router.get('/guides', async (_req, res, next) => {
  try {
    const dbGuides = await publishedDatabaseGuides();
    return res.json({
      success: true,
      data: [...baselineSafetyGuides.map(serializeGuide), ...dbGuides.map(serializeGuide)],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/guides/:slug', async (req, res, next) => {
  try {
    const baseline = baselineSafetyGuides.find(guide => guide.slug === req.params.slug || guide.id === req.params.slug);
    if (baseline) {
      return res.json({ success: true, data: serializeGuide(baseline) });
    }
    const guide = await prisma.safetyGuide.findFirst({
      where: { OR: [{ slug: req.params.slug }, { id: req.params.slug }], isPublished: true },
    });
    if (!guide) return res.status(404).json({ success: false, message: 'Safety guide not found.' });
    return res.json({ success: true, data: serializeGuide(guide) });
  } catch (error) {
    next(error);
  }
});

router.get('/resources', async (req, res, next) => {
  try {
    const category = String(req.query.category || '');
    const dbResources = await activeDatabaseResources(category);
    const official = officialEmergencyResources.filter(resource => !category || resource.category === category);
    return res.json({
      success: true,
      data: [...official.map(serializeResource), ...dbResources.map(serializeResource)],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/official-resources', async (_req, res) => {
  return res.json({ success: true, data: officialEmergencyResources.map(serializeResource) });
});

router.post('/anonymous-concerns', uploadAnonymousConcernAttachment.single('attachment'), async (req, res, next) => {
  try {
    const parseResult = AnonymousConcernSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message })),
      });
    }
    const data = parseResult.data;
    const referenceNumber = await makeAnonymousReference();
    await prisma.anonymousConcern.create({
      data: {
        referenceNumber,
        category: data.category,
        description: data.description,
        incidentDate: data.incidentDate ? new Date(`${data.incidentDate}T00:00:00.000Z`) : null,
        location: data.location || null,
        attachmentUrl: req.file ? `/private/anonymous-concerns/${req.file.filename}` : null,
      },
    });
    return res.status(201).json({
      success: true,
      message: 'Anonymous concern submitted.',
      data: { referenceNumber },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/anonymous-concerns', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const concerns = await prisma.anonymousConcern.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        referenceNumber: true,
        category: true,
        incidentDate: true,
        location: true,
        status: true,
        createdAt: true,
      },
    });
    return res.json({ success: true, data: concerns.map(row => ({ ...row, _id: row.id })) });
  } catch (error) {
    next(error);
  }
});

export default router;
