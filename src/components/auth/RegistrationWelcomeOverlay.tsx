import React, { useRef, useState } from 'react';
import { ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference.js';

interface RegistrationWelcomeOverlayProps {
  studentName?: string;
  onComplete: () => void;
}

export const RegistrationWelcomeOverlay: React.FC<RegistrationWelcomeOverlayProps> = ({ studentName, onComplete }) => {
  const reduceMotion = useReducedMotionPreference();
  const completedRef = useRef(false);
  const [phase, setPhase] = useState<'WELCOME' | 'LOADING'>('WELCOME');

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  const continueToPortal = () => {
    if (phase === 'LOADING') return;
    setPhase('LOADING');
    window.setTimeout(complete, reduceMotion ? 100 : 1100);
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-matte-cream/95 px-4 py-5 backdrop-blur-md sm:items-center sm:py-8"
    >
      <AnimatePresence mode="wait">
        {phase === 'WELCOME' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -16, scale: reduceMotion ? 1 : 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
            className="flex min-h-[calc(100vh-40px)] w-full max-w-lg flex-col justify-center text-center sm:min-h-0"
          >
            <div className="rounded-lg border border-matte-rose/35 bg-white px-5 py-5 shadow-xl sm:px-6 sm:py-6">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-matte-rose bg-matte-blush text-matte-maroon sm:mb-4 sm:h-12 sm:w-12">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-matte-rose sm:text-xs">Empower. Connect. Grow.</p>
              <h2 className="mt-2 font-serif text-[clamp(1.6rem,7vw,2rem)] font-bold leading-tight text-matte-maroon">Welcome to Singa Pen Club</h2>
              <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-matte-charcoal/70 sm:text-sm">
                {studentName ? `${studentName}, your student profile is ready.` : 'Your student profile is ready.'} Continue to open your student dashboard.
              </p>
              <button
                type="button"
                onClick={continueToPortal}
                className="mx-auto mt-6 inline-flex items-center gap-2 rounded-md bg-matte-maroon px-5 py-2.5 text-xs font-bold text-white shadow-md outline-none transition-colors hover:bg-maroon-800 focus-visible:ring-2 focus-visible:ring-matte-maroon focus-visible:ring-offset-2"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="w-full max-w-4xl rounded-lg border border-matte-rose/30 bg-white p-4 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-matte-rose">Opening Student Portal</p>
                <h2 className="mt-1 font-serif text-xl font-bold leading-tight text-matte-maroon sm:text-2xl">Preparing your dashboard</h2>
              </div>
              <Loader2 className="h-6 w-6 shrink-0 animate-spin text-matte-maroon" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="h-24 animate-pulse rounded-md bg-matte-blush sm:h-28" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 animate-pulse rounded-md bg-gray-100 sm:h-20" />
                  <div className="h-16 animate-pulse rounded-md bg-gray-100 sm:h-20" />
                  <div className="h-16 animate-pulse rounded-md bg-gray-100 sm:h-20" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
                <div className="mt-5 h-24 animate-pulse rounded-md bg-matte-cream" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
