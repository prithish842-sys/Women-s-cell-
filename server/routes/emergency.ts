import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { emergencyNotificationService, EmergencyRecipient } from '../services/notificationService.js';

const router = Router();

const CONTACT_TYPE_VALUES = ['FAMILY', 'FRIEND', 'STAFF', 'SUPPORT', 'OTHER'] as const;
const TRIGGER_SOURCE_VALUES = ['IN_APP_SOS', 'PRESS_AND_HOLD', 'MULTI_TAP', 'OTHER'] as const;
const MIN_CONTACTS = 2;
const MAX_CONTACTS = 3;
const LATEST_EVENT_WINDOW_MS = 30 * 1000;

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  relationship: z.string().trim().min(2).max(80),
  contactType: z.enum(CONTACT_TYPE_VALUES).default('OTHER'),
  isStaffContact: z.coerce.boolean().default(false),
  isVerified: z.coerce.boolean().default(false),
});

const TriggerSchema = z.object({
  triggerSource: z.enum(TRIGGER_SOURCE_VALUES).default('IN_APP_SOS'),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  locationAccuracy: z.coerce.number().positive().optional().nullable(),
  message: z.string().trim().max(500).optional().nullable(),
  notifyStaffContactsOnly: z.coerce.boolean().default(false),
});

function serializeContact(contact: any) {
  return {
    ...contact,
    _id: contact.id,
    createdAt: contact.createdAt instanceof Date ? contact.createdAt.toISOString() : contact.createdAt,
    updatedAt: contact.updatedAt instanceof Date ? contact.updatedAt.toISOString() : contact.updatedAt,
  };
}

function serializeEvent(event: any) {
  return {
    ...event,
    _id: event.id,
    triggeredAt: event.triggeredAt instanceof Date ? event.triggeredAt.toISOString() : event.triggeredAt,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
    resolvedAt: event.resolvedAt instanceof Date ? event.resolvedAt.toISOString() : null,
  };
}

function isValidCoordinatePair(latitude?: number | null, longitude?: number | null) {
  return typeof latitude === 'number' && typeof longitude === 'number';
}

/**
 * User-owned emergency contacts (minimum 2, maximum 3).
 */
router.get('/me/contacts', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { ownerUserId: req.user!._id! },
      orderBy: [{ isStaffContact: 'desc' }, { createdAt: 'asc' }],
    });
    return res.json({ success: true, data: contacts.map(serializeContact) });
  } catch (error) {
    next(error);
  }
});

router.post('/me/contacts', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    }
    const existing = await prisma.emergencyContact.count({ where: { ownerUserId: req.user!._id! } });
    if (existing >= MAX_CONTACTS) {
      return res.status(400).json({
        success: false,
        message: `You can save up to ${MAX_CONTACTS} emergency contacts. Remove one before adding another.`,
      });
    }
    const contact = await prisma.emergencyContact.create({
      data: {
        ownerUserId: req.user!._id!,
        ownerRole: req.user!.role,
        name: parsed.data.name,
        phone: parsed.data.phone,
        relationship: parsed.data.relationship,
        contactType: parsed.data.contactType,
        isStaffContact: parsed.data.isStaffContact,
        isVerified: parsed.data.isVerified,
      },
    });
    return res.status(201).json({ success: true, message: 'Emergency contact saved.', data: serializeContact(contact) });
  } catch (error) {
    next(error);
  }
});

router.put('/me/contacts/:contactId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    }
    const existing = await prisma.emergencyContact.findFirst({
      where: { id: req.params.contactId, ownerUserId: req.user!._id! },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Emergency contact not found.' });
    const contact = await prisma.emergencyContact.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        relationship: parsed.data.relationship,
        contactType: parsed.data.contactType,
        isStaffContact: parsed.data.isStaffContact,
        isVerified: parsed.data.isVerified,
      },
    });
    return res.json({ success: true, message: 'Emergency contact updated.', data: serializeContact(contact) });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/contacts/:contactId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const existing = await prisma.emergencyContact.findFirst({
      where: { id: req.params.contactId, ownerUserId: req.user!._id! },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Emergency contact not found.' });
    await prisma.emergencyContact.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Emergency contact removed.' });
  } catch (error) {
    next(error);
  }
});

/**
 * Trigger an emergency alert. Persists an EmergencyEvent, dispatches
 * notifications through configured channels, and returns the live outcome.
 */
router.post('/me/trigger', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parsed = TriggerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    }

    const user = req.user!;
    const contacts = await prisma.emergencyContact.findMany({
      where: {
        ownerUserId: user._id!,
        ...(parsed.data.notifyStaffContactsOnly ? { isStaffContact: true } : {}),
      },
      orderBy: [{ isStaffContact: 'desc' }, { createdAt: 'asc' }],
    });

    if (contacts.length < MIN_CONTACTS) {
      return res.status(400).json({
        success: false,
        message: `Add at least ${MIN_CONTACTS} emergency contacts before triggering the alert. Your safety circle is currently ${contacts.length}.`,
        code: 'CONTACTS_REQUIRED',
      });
    }

    const recentEvent = await prisma.emergencyEvent.findFirst({
      where: { userId: user._id!, createdAt: { gte: new Date(Date.now() - LATEST_EVENT_WINDOW_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recentEvent && recentEvent.status !== 'RESOLVED') {
      return res.json({
        success: false,
        message: 'An emergency alert was already raised moments ago. Wait briefly or resolve the existing alert first.',
        data: serializeEvent(recentEvent),
        alreadyActive: true,
      });
    }

    const locationLink = isValidCoordinatePair(parsed.data.latitude, parsed.data.longitude)
      ? `https://maps.google.com/maps?q=${parsed.data.latitude},${parsed.data.longitude}`
      : null;

    const event = await prisma.emergencyEvent.create({
      data: {
        userId: user._id!,
        userName: user.name,
        triggerSource: parsed.data.triggerSource,
        locationStatus: locationLink ? 'SHARED' : 'PENDING',
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        locationAccuracy: parsed.data.locationAccuracy ?? null,
        locationLink,
        messageContent: parsed.data.message ?? null,
        notificationStatus: 'NOTIFYING',
        status: 'TRIGGERED',
        createdById: user._id!,
      },
    });

    const recipients: EmergencyRecipient[] = contacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      contactType: contact.contactType,
      isStaffContact: contact.isStaffContact,
    }));

    const dispatch = await emergencyNotificationService.dispatch({
      contacts: recipients,
      userName: user.name,
      locationLink,
      message: parsed.data.message,
      requestId: event.id,
    });

    const delivered = dispatch.deliveredCount > 0;
    const updatedEvent = await prisma.emergencyEvent.update({
      where: { id: event.id },
      data: {
        notificationStatus: delivered ? 'DELIVERED' : (dispatch.failedCount > 0 ? 'PARTIAL' : 'NO_CHANNEL'),
        perContactStatus: JSON.parse(JSON.stringify(dispatch.results)),
        notificationDetail: JSON.parse(JSON.stringify({ delivered: dispatch.deliveredCount, notConfigured: dispatch.notConfiguredCount, failed: dispatch.failedCount, blocked: dispatch.blockedCount })),
        status: delivered ? 'NOTIFIED' : 'FAILED',
      },
    });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'SYSTEM',
          title: 'Emergency alert raised',
          message: `${user.name} raised an emergency alert. ${delivered ? 'Contacts were notified.' : 'No delivery channel was configured — review now.'}`,
          link: '/admin/safety/wellbeing',
        })),
      });
    }

    return res.status(delivered ? 201 : 200).json({
      success: delivered,
      message: delivered
        ? 'Emergency alert raised and your contacts have been notified.'
        : 'Emergency alert logged, but no delivery channel is configured; an administrator has been alerted.',
      data: serializeEvent({ ...updatedEvent, perContactStatus: dispatch.results, notificationDetail: dispatch }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * The current user's own emergency event history.
 */
router.get('/me/events', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const events = await prisma.emergencyEvent.findMany({
      where: { userId: req.user!._id! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: events.map(serializeEvent) });
  } catch (error) {
    next(error);
  }
});

router.get('/me/events/:eventId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const event = await prisma.emergencyEvent.findFirst({
      where: { id: req.params.eventId, userId: req.user!._id! },
    });
    if (!event) return res.status(404).json({ success: false, message: 'Emergency event not found.' });
    return res.json({ success: true, data: serializeEvent(event) });
  } catch (error) {
    next(error);
  }
});

/**
 * Administrative event queue for safety caretakers and ICC administrators.
 */
router.get('/admin/events', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const events = await prisma.emergencyEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json({
      success: true,
      data: events.map(serializeEvent),
      meta: {
        open: events.filter(event => event.status !== 'RESOLVED' && event.status !== 'FAILED').length,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/events/:eventId/resolve', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const event = await prisma.emergencyEvent.findUnique({ where: { id: req.params.eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'Emergency event not found.' });
    const updated = await prisma.emergencyEvent.update({
      where: { id: event.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
    return res.json({ success: true, message: 'Emergency event marked as resolved.', data: serializeEvent(updated) });
  } catch (error) {
    next(error);
  }
});

export default router;