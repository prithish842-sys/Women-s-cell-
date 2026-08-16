import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { assignImageFallback, galleryFallbackImage } from '../../utils/imageFallback.js';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference.js';

interface LightboxImage {
  _id: string;
  imageUrl: string;
  caption?: string;
  altText?: string;
}

interface GalleryImageLightboxProps {
  images: LightboxImage[];
  index: number | null;
  albumTitle: string;
  onClose: () => void;
  onChange: (index: number) => void;
}

export const GalleryImageLightbox: React.FC<GalleryImageLightboxProps> = ({
  images,
  index,
  albumTitle,
  onClose,
  onChange,
}) => {
  const reduceMotion = useReducedMotionPreference();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = index !== null && images.length > 0;
  const activeImage = isOpen ? images[index] : null;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || index === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>('[data-lightbox-control="true"]'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, index, isOpen, onChange, onClose]);

  return (
    <AnimatePresence>
      {isOpen && activeImage && index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${albumTitle} image viewer`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-matte-charcoal/95 text-matte-white backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-matte-beige/80">{albumTitle}</p>
              <p className="mt-1 text-xs text-matte-white/70">Photo {index + 1} of {images.length}</p>
            </div>
            <button
              ref={closeRef}
              data-lightbox-control="true"
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              className="rounded-full bg-matte-white/10 p-2 text-matte-white outline-none transition-colors hover:bg-matte-white/20 focus-visible:ring-2 focus-visible:ring-matte-rose"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-14 py-4 sm:px-20">
            <button
              data-lightbox-control="true"
              type="button"
              onClick={() => onChange((index - 1 + images.length) % images.length)}
              aria-label="Show previous image"
              className="absolute left-3 rounded-full bg-matte-white/10 p-2 outline-none transition-colors hover:bg-matte-white/20 focus-visible:ring-2 focus-visible:ring-matte-rose sm:left-6"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <motion.img
              key={activeImage._id}
              src={activeImage.imageUrl}
              alt={activeImage.altText || activeImage.caption || `${albumTitle} photo ${index + 1}`}
              onError={(event) => assignImageFallback(event, galleryFallbackImage)}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
              className="max-h-[68vh] max-w-full rounded-lg border border-matte-white/10 object-contain shadow-2xl"
            />
            <button
              data-lightbox-control="true"
              type="button"
              onClick={() => onChange((index + 1) % images.length)}
              aria-label="Show next image"
              className="absolute right-3 rounded-full bg-matte-white/10 p-2 outline-none transition-colors hover:bg-matte-white/20 focus-visible:ring-2 focus-visible:ring-matte-rose sm:right-6"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-3 border-t border-matte-white/10 bg-matte-charcoal/70 p-4 text-center sm:p-6">
            <p className="mx-auto max-w-3xl font-serif text-sm text-matte-white/95">
              {activeImage.caption || activeImage.altText || 'Captured moment from this album.'}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {images.map((image, imageIndex) => (
                <button
                  data-lightbox-control="true"
                  type="button"
                  key={image._id}
                  onClick={() => onChange(imageIndex)}
                  aria-label={`Show image ${imageIndex + 1}`}
                  className={`h-2 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-matte-rose ${
                    imageIndex === index ? 'w-5 bg-matte-rose' : 'w-2 bg-matte-white/35 hover:bg-matte-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
