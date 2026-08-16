import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, CalendarDays, CheckCircle2, MapPin, X } from 'lucide-react';
import { z } from 'zod';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';

const registrationSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  registerNumber: z.string().trim().min(1, 'Register number is required.'),
  email: z.string().trim().email('Valid college email is required.'),
  phone: z.string().trim().min(7, 'Phone number is too short.').max(20, 'Phone number is too long.'),
  department: z.string().trim().min(1, 'Department is required.'),
  course: z.string().trim().min(1, 'Course is required.'),
  currentStudyYear: z.union([z.string(), z.number()]).optional(),
  learningExpectation: z.string().trim().max(600, 'Learning expectation must be 600 characters or fewer.').optional(),
  supportRequirement: z.string().trim().max(600, 'Support requirement must be 600 characters or fewer.').optional(),
  agreement: z.literal(true, { error: 'Please confirm that the submitted details are correct.' }),
});

interface WorkshopRegistrationModalProps {
  workshop: any | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptyForm = {
  fullName: '',
  registerNumber: '',
  email: '',
  phone: '',
  department: '',
  course: '',
  currentStudyYear: '',
  learningExpectation: '',
  supportRequirement: '',
  agreement: false,
};

const formatDateTime = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const WorkshopRegistrationModal: React.FC<WorkshopRegistrationModalProps> = ({
  workshop,
  open,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      fullName: user?.name || '',
      registerNumber: profile?.registerNumber || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      course: profile?.course || '',
      currentStudyYear: profile?.currentStudyYear ? String(profile.currentStudyYear) : '',
      learningExpectation: '',
      supportRequirement: '',
      agreement: false,
    });
    setErrors({});
    setServerMessage('');
    setSuccessMessage('');
  }, [open, profile, user]);

  const workshopId = workshop?._id || workshop?.id;
  const titleId = useMemo(() => `workshop-register-${workshopId || 'modal'}-title`, [workshopId]);

  const setValue = (key: keyof typeof emptyForm, value: string | boolean) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerMessage('');
    setSuccessMessage('');

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        const key = issue.path.join('.');
        if (key) nextErrors[key] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    if (!workshopId) {
      setServerMessage('Workshop details are missing. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/students/me/workshops/${workshopId}/register`, parsed.data);
      setSuccessMessage(res.data.message || 'Workshop registration completed.');
      onSuccess?.();
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      const issues = error.response?.data?.errors;
      if (Array.isArray(issues)) {
        issues.forEach((issue: any) => {
          if (issue.field) fieldErrors[issue.field] = issue.message;
        });
      }
      setErrors(fieldErrors);
      setServerMessage(error.response?.data?.message || 'Could not complete workshop registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = 'w-full rounded-md border border-matte-beige bg-white px-3 py-2 text-sm text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon disabled:bg-matte-cream disabled:text-matte-charcoal/70';
  const errorText = (key: string) => errors[key] ? <p className="text-[11px] font-medium text-red-600">{errors[key]}</p> : null;

  return (
    <AnimatePresence>
      {open && workshop && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(46,32,39,0.42)] px-3 py-3 sm:items-center sm:px-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-matte-beige bg-white shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-amethyst/30 bg-[linear-gradient(135deg,#5A1838_0%,#7E294D_58%,#B75D7A_100%)] p-5 text-white backdrop-blur">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orchid/80">{workshop.category?.replace(/_/g, ' ')}</p>
                <h2 id={titleId} className="mt-1 font-serif text-2xl font-bold text-white">{workshop.title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-white/25 p-2 text-white hover:bg-white/15 disabled:opacity-50"
                aria-label="Close registration form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-matte-beige bg-matte-cream/55 p-4 text-xs text-matte-charcoal/75 sm:grid-cols-3">
                <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-matte-maroon" /><span>{formatDateTime(workshop.startDateTime)}</span></div>
                <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-matte-maroon" /><span>{formatDateTime(workshop.endDateTime)}</span></div>
                <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-matte-maroon" /><span>{workshop.venue}</span></div>
              </div>

              {serverMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{serverMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    Full name
                    <input value={form.fullName} disabled className={fieldClass} />
                    {errorText('fullName')}
                  </label>
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    Register number
                    <input value={form.registerNumber} disabled className={fieldClass} />
                    {errorText('registerNumber')}
                  </label>
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    College email
                    <input value={form.email} disabled className={fieldClass} />
                    {errorText('email')}
                  </label>
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    Phone number
                    <input value={form.phone} onChange={event => setValue('phone', event.target.value)} className={fieldClass} />
                    {errorText('phone')}
                  </label>
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    Department
                    <input value={form.department} onChange={event => setValue('department', event.target.value)} className={fieldClass} />
                    {errorText('department')}
                  </label>
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    Course
                    <input value={form.course} onChange={event => setValue('course', event.target.value)} className={fieldClass} />
                    {errorText('course')}
                  </label>
                  <label className="space-y-1 text-xs font-bold text-matte-charcoal/70">
                    Current study year
                    <input value={form.currentStudyYear} disabled className={fieldClass} />
                  </label>
                </div>

                <label className="block space-y-1 text-xs font-bold text-matte-charcoal/70">
                  Reason for joining or learning expectation
                  <textarea value={form.learningExpectation} onChange={event => setValue('learningExpectation', event.target.value)} className={`${fieldClass} min-h-24 resize-y`} />
                  {errorText('learningExpectation')}
                </label>
                <label className="block space-y-1 text-xs font-bold text-matte-charcoal/70">
                  Accessibility or support requirement
                  <textarea value={form.supportRequirement} onChange={event => setValue('supportRequirement', event.target.value)} className={`${fieldClass} min-h-20 resize-y`} />
                  {errorText('supportRequirement')}
                </label>

                <label className="flex items-start gap-2 rounded-lg border border-matte-beige bg-matte-cream/45 p-3 text-xs text-matte-charcoal/75">
                  <input
                    type="checkbox"
                    checked={form.agreement}
                    onChange={event => setValue('agreement', event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>I confirm that the submitted workshop registration details are correct.</span>
                </label>
                {errorText('agreement')}

                <div className="flex flex-col-reverse gap-2 border-t border-matte-beige pt-4 sm:flex-row sm:justify-end">
                  <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-matte-beige px-4 py-2 text-xs font-bold text-matte-maroon hover:bg-matte-cream disabled:opacity-50">
                    Close
                  </button>
                  <button type="submit" disabled={submitting || !!successMessage} className="inline-flex items-center justify-center gap-2 rounded-md bg-matte-maroon px-5 py-2 text-xs font-bold text-white hover:bg-maroon-800 disabled:opacity-60">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{submitting ? 'Submitting...' : successMessage ? 'Registered' : 'Submit Registration'}</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
