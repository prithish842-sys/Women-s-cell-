import { Router, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { PRIVATE_ICC_UPLOAD_ROOT, PUBLIC_UPLOAD_ROOT, uploadIccAttachment } from '../middleware/upload.js';

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

function safeStoredAttachmentName(attachmentUrl?: string | null) {
  if (!attachmentUrl) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(attachmentUrl)) return null;
  if (path.isAbsolute(attachmentUrl)) return null;
  const normalized = attachmentUrl.replace(/\\/g, '/');
  if (normalized.split('/').some(part => part === '..')) return null;
  const filename = path.basename(normalized);
  return filename && filename !== '.' && filename !== '..' ? filename : null;
}

function resolveInside(rootPath: string, filename: string) {
  const resolved = path.resolve(rootPath, filename);
  const root = path.resolve(rootPath);
  return resolved !== root && resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

function resolveIccAttachmentPath(attachmentUrl?: string | null) {
  const filename = safeStoredAttachmentName(attachmentUrl);
  if (!filename) return null;
  const privatePath = resolveInside(PRIVATE_ICC_UPLOAD_ROOT, filename);
  if (privatePath && fs.existsSync(privatePath)) return privatePath;
  const legacyPath = resolveInside(path.join(PUBLIC_UPLOAD_ROOT, 'icc'), filename);
  if (legacyPath && fs.existsSync(legacyPath)) return legacyPath;
  return null;
}

function attachmentContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (['.jpg', '.jpeg'].includes(extension)) return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
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
    const attachmentUrl = req.file ? `/private/icc/${req.file.filename}` : '';

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

router.get('/complaints/:complaintId/attachment', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const complaint = await prisma.iccComplaint.findUnique({
      where: { id: req.params.complaintId },
      select: { id: true, submittedById: true, attachmentUrl: true },
    });
    if (!complaint || !complaint.attachmentUrl) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    const isOwner = complaint.submittedById === req.user!._id;
    const isIccAdmin = req.user!.role === 'ICC_ADMIN';
    if (!isOwner && !isIccAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const attachmentPath = resolveIccAttachmentPath(complaint.attachmentUrl);
    if (!attachmentPath) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    res.setHeader('Content-Type', attachmentContentType(attachmentPath));
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(attachmentPath).replace(/"/g, '')}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(attachmentPath);
  } catch (error) {
    next(error);
  }
});

export default router;
