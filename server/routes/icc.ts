import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadIccAttachment } from '../middleware/upload.js';

const router = Router();

const IccComplaintSchema = z.object({
  complainantPhone: z.string().max(20).optional().nullable(),
  category: z.string().min(2).max(80),
  urgency: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  subject: z.string().min(5).max(160),
  description: z.string().min(20).max(4000),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  location: z.string().max(160).optional().nullable(),
  accusedDetails: z.string().max(1000).optional().nullable(),
  witnesses: z.string().max(1000).optional().nullable(),
  requestedAction: z.string().max(1000).optional().nullable(),
  confidentialityConfirmation: z.coerce.boolean().refine(Boolean, 'Confirmation is required.'),
});

async function makeReferenceNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
    const referenceNumber = `ICC-${suffix}`;
    const existing = await prisma.iccComplaint.findUnique({ where: { referenceNumber } });
    if (!existing) return referenceNumber;
  }
  return `ICC-${Date.now().toString(36).toUpperCase()}`;
}

router.post('/complaints', auth, authorize(['STUDENT']), uploadIccAttachment.single('attachment'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = IccComplaintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message })),
      });
    }

    const referenceNumber = await makeReferenceNumber();
    const data = parseResult.data;
    const attachmentUrl = req.file ? `/uploads/icc/${req.file.filename}` : '';

    await prisma.iccComplaint.create({
      data: {
        referenceNumber,
        submittedById: req.user!._id!,
        complainantName: req.user!.name,
        complainantEmail: req.user!.email,
        complainantPhone: data.complainantPhone || null,
        category: data.category,
        urgency: data.urgency,
        subject: data.subject,
        description: data.description,
        incidentDate: data.incidentDate ? new Date(`${data.incidentDate}T00:00:00.000Z`) : null,
        location: data.location || null,
        accusedDetails: data.accusedDetails || null,
        witnesses: data.witnesses || null,
        requestedAction: data.requestedAction || null,
        attachmentUrl: attachmentUrl || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Your complaint has been submitted confidentially.',
      data: { referenceNumber },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
