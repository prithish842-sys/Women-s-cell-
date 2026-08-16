import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Image, MapPin, Search, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { assignImageFallback, galleryFallbackImage, withResolvedImage } from '../../utils/imageFallback.js';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference.js';

export interface GalleryFolderAlbum {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  category: string;
  coverImage?: string;
  eventDate?: string;
  venue?: string;
  organizedBy?: string;
  isFeatured?: boolean;
  photoCount: number;
  previewImages?: { _id: string; imageUrl: string; thumbnailUrl?: string; caption?: string; altText?: string }[];
}

interface AnimatedGalleryFolderProps {
  album: GalleryFolderAlbum;
  index?: number;
  expanded: boolean;
  onExpand: (albumId: string) => void;
}

const folderCss = `
.singa-gallery-folder .folder-card {
  width: 190px;
  height: 145px;
  perspective: 1200px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.singa-gallery-folder .folder-toggle {
  display: none;
}
.singa-gallery-folder .hint-wrapper {
  position: absolute;
  top: -34px;
  right: -44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
  z-index: 100;
  animation: singaFloatHint 2.5s ease-in-out infinite;
}
.singa-gallery-folder .hint-text {
  color: #5A1838;
  font-size: 10px;
  font-weight: 900;
  text-decoration: underline;
  letter-spacing: 0.5px;
  white-space: nowrap;
  position: relative;
  right: -25px;
  top: 10px;
  transform: rotate(45deg);
}
.singa-gallery-folder .hint-arrow {
  height: 35px;
  width: 35px;
}
@keyframes singaFloatHint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
.singa-gallery-folder .folder-toggle:checked ~ .hint-wrapper {
  opacity: 0;
  transform: translateY(-10px);
}
.singa-gallery-folder .folder-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  backface-visibility: hidden;
  will-change: transform;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container {
  transform: rotateX(10deg) rotateY(-5deg);
}
.singa-gallery-folder .folder-back {
  position: absolute;
  bottom: 0;
  width: 100%;
  filter: drop-shadow(0 10px 20px rgba(90, 24, 56, 0.18));
}
.singa-gallery-folder .folder-front-wrapper {
  position: absolute;
  bottom: -7px;
  width: 100%;
  z-index: 90;
  transform-origin: bottom;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 12px;
}
.singa-gallery-folder .folder-label {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 30px;
  height: 4px;
  background: rgba(255, 255, 255, 0.62);
  border-radius: 10px;
}
.singa-gallery-folder .counter {
  position: absolute;
  top: -95px;
  right: -75px;
  background-color: #5A1838;
  padding: 4px 8px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 20px rgba(90,24,56,0.22), inset 0 1px 1px rgba(255,255,255,0.2);
  transform: scale(0) translateY(20px);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 100;
  pointer-events: auto;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .counter {
  transform: scale(1) translateY(0);
  opacity: 1;
  transition-delay: 0.2s;
}
.singa-gallery-folder .status-dot {
  width: 6px;
  height: 6px;
  background: #B75D7A;
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 10px #B75D7A;
}
.singa-gallery-folder .status-dot::after {
  content: "";
  position: absolute;
  inset: 0;
  background: #B75D7A;
  border-radius: 50%;
  animation: singaPulse 2s infinite;
}
@keyframes singaPulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}
.singa-gallery-folder .counter-label {
  font-size: 8px;
  font-weight: 800;
  color: #FFF8F3;
  text-transform: capitalize;
}
.singa-gallery-folder .counter-number {
  font-size: 12px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}
.singa-gallery-folder .counter:hover {
  background: rgba(90, 24, 56, 0.88);
  transform: scale(1.1) translateY(-5px) !important;
}
.singa-gallery-folder .file {
  position: absolute;
  bottom: 5px;
  left: 10%;
  width: 80%;
  height: 85px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.3), 0 4px 12px rgba(90,24,56,0.24);
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 0;
  border: 1px solid rgba(255,255,255,0.55);
}
.singa-gallery-folder .file-1 { z-index: 25; transition-delay: 0.15s; }
.singa-gallery-folder .file-2 { z-index: 24; transition-delay: 0.1s; }
.singa-gallery-folder .file-3 { z-index: 23; transition-delay: 0.05s; }
.singa-gallery-folder .file-4 { z-index: 22; transition-delay: 0.02s; }
.singa-gallery-folder .file-5 { z-index: 21; transition-delay: 0s; }
.singa-gallery-folder .shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-20deg);
  transition: none;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .shine {
  left: 150%;
  transition: left 0.8s ease-in-out;
  transition-delay: 0.3s;
}
.singa-gallery-folder .file-text {
  position: absolute;
  left: 8px;
  top: 8px;
  max-width: calc(100% - 16px);
  font-size: 9px;
  color: white;
  font-weight: 800;
  text-shadow: 0 1px 3px rgba(0,0,0,0.35);
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.3s ease 0.4s;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-text {
  opacity: 1;
  transform: translateY(0);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .folder-front-wrapper {
  transform: rotateX(-50deg);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-1 {
  transform: translateY(-70px) rotate(-10deg) translateX(-15px) translateZ(20px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-2 {
  transform: translateY(-55px) rotate(8deg) translateX(18px) translateZ(10px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-3 {
  transform: translateY(-40px) rotate(-15deg) translateX(-8px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-4 {
  transform: translateY(-25px) rotate(12deg) translateX(12px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-5 {
  transform: translateY(-10px) rotate(-5deg);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file:hover {
  cursor: pointer;
  filter: brightness(1.1);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-1:hover {
  transform: translateY(-80px) rotate(-10deg) translateX(-15px) translateZ(20px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-2:hover {
  transform: translateY(-65px) rotate(8deg) translateX(18px) translateZ(10px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-3:hover {
  transform: translateY(-50px) rotate(-15deg) translateX(-8px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-4:hover {
  transform: translateY(-35px) rotate(12deg) translateX(12px);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-5:hover {
  transform: translateY(-20px) rotate(-5deg);
}
.singa-gallery-folder .file-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 14px;
  height: 14px;
  color: rgba(255,255,255,0.72);
  transition: color 0.3s ease;
}
.singa-gallery-folder .file-tag {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(90,24,56,0.72);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: rgba(255,255,255,0.95);
  font-size: 7px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file:hover .file-icon {
  color: rgba(255,255,255,0.95);
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .file-tag {
  opacity: 1;
  transform: translateX(0);
}
.singa-gallery-folder .folder-search {
  position: absolute;
  top: -40px;
  left: 10%;
  width: 30px;
  height: 25px;
  background-color: #5A1838;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  opacity: 0;
  z-index: 100;
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
}
.singa-gallery-folder .search-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.singa-gallery-folder .search-input {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 9px;
  margin-left: 8px;
  outline: none;
  min-width: 0;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .folder-search {
  opacity: 1;
  top: -80px;
  width: 80%;
}
.singa-gallery-folder .folder-toggle:checked ~ .folder-container .folder-search:focus-within {
  width: 90%;
  background-color: #7E294D;
}
@media (prefers-reduced-motion: reduce) {
  .singa-gallery-folder .hint-wrapper,
  .singa-gallery-folder .status-dot::after {
    animation: none;
  }
  .singa-gallery-folder * {
    transition-duration: 0s !important;
  }
}
`;

export const AnimatedGalleryFolder: React.FC<AnimatedGalleryFolderProps> = ({
  album,
  index = 0,
  expanded,
  onExpand,
}) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotionPreference();
  const [leaving, setLeaving] = useState(false);
  const rawPreviews = album.previewImages?.length ? album.previewImages : [{ _id: `${album._id}-cover`, imageUrl: album.coverImage || '' }];
  const previews = rawPreviews.slice(0, 5);
  const paddedPreviews = Array.from({ length: 5 }, (_, previewIndex) => previews[previewIndex] || previews[previews.length - 1] || { _id: `${album._id}-empty-${previewIndex}`, imageUrl: album.coverImage || '' });

  const goToAlbum = useCallback((delayNavigation = true) => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      navigate(`/gallery/${album.slug}`, { state: { fromGalleryFolder: album._id }, replace: false });
    }, reduceMotion || !delayNavigation ? 0 : 620);
  }, [album._id, album.slug, leaving, navigate, reduceMotion]);

  const openFolder = useCallback(() => {
    onExpand(album._id);
  }, [album._id, onExpand]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      goToAlbum(true);
    }
    if (event.key === ' ') {
      event.preventDefault();
      openFolder();
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{
        opacity: 1,
        y: leaving && !reduceMotion ? -12 : expanded && !reduceMotion ? -4 : 0,
        scale: leaving && !reduceMotion ? 0.98 : 1,
        boxShadow: expanded && !reduceMotion ? '0 18px 42px rgba(90, 24, 56, 0.14)' : '0 1px 2px rgba(90, 24, 56, 0.06)',
      }}
      transition={{ duration: reduceMotion ? 0 : 0.34, delay: Math.min(index * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      aria-label={`${expanded ? 'View' : 'Open'} ${album.title} gallery folder`}
      onFocus={() => onExpand(album._id)}
      onClick={openFolder}
      onDoubleClick={() => goToAlbum(true)}
      onKeyDown={handleKeyDown}
      className={`singa-gallery-folder group relative min-h-[444px] cursor-pointer rounded-2xl border bg-white p-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-matte-maroon focus-visible:ring-offset-2 ${
        expanded ? 'border-[rgba(126,41,77,0.38)]' : 'border-matte-beige hover:border-matte-rose/40'
      }`}
    >
      <style>{folderCss}</style>
      <div className="relative h-[238px] overflow-visible rounded-xl pt-20">
        <label className="folder-card mx-auto" aria-label={`${expanded ? 'Opened' : 'Closed'} ${album.title} folder`}>
          <input type="checkbox" className="folder-toggle" checked={expanded} readOnly />

          <div className="hint-wrapper">
            <span className="hint-text">Click to open</span>
            <svg className="hint-arrow" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 35 5 C 35 5, 15 5, 10 25 M 10 25 L 3 18 M 10 25 L 18 22" stroke="#5A1838" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="folder-container">
            <svg className="folder-back" viewBox="0 0 50 40" fill="none">
              <path d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z" fill="#7E294D" />
            </svg>

            <div className="folder-search">
              <Search className="search-icon" />
              <span className="search-input truncate">{album.category.replace(/_/g, ' ')}</span>
            </div>

            {paddedPreviews.map((preview, previewIndex) => {
              const visualIndex = 5 - previewIndex;
              const src = withResolvedImage(preview.thumbnailUrl || preview.imageUrl || album.coverImage, galleryFallbackImage);
              return (
                <div
                  key={preview._id || `${album._id}-${previewIndex}`}
                  role="button"
                  tabIndex={-1}
                  className={`file file-${visualIndex}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    openFolder();
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    goToAlbum(true);
                  }}
                >
                  <div className="shine" />
                  <img
                    src={src}
                    alt={preview.altText || preview.caption || `${album.title} preview ${previewIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => assignImageFallback(event, galleryFallbackImage)}
                    className="h-full w-full object-cover"
                  />
                  <Image className="file-icon" />
                  <div className="file-text line-clamp-2">{preview.caption || album.title}</div>
                  <div className="file-tag">PHOTO • {String(previewIndex + 1).padStart(2, '0')}</div>
                </div>
              );
            })}

            <div className="folder-front-wrapper">
              <svg className="folder-front" viewBox="0 0 50 34" fill="none">
                <path d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z" fill="url(#singa-gallery-folder-front)" />
                <defs>
                  <linearGradient id="singa-gallery-folder-front" x1="0" y1="0" x2="50" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E7C8D3" />
                    <stop offset="0.55" stopColor="#B75D7A" />
                    <stop offset="1" stopColor="#7E294D" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="folder-label" />
              <div className="counter">
                <div className="status-dot" />
                <span className="counter-label">Photos</span>
                <span className="counter-number">{String(album.photoCount).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </label>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openFolder();
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            goToAlbum(true);
          }}
          className="absolute bottom-2 right-3 z-30 inline-flex items-center gap-1 rounded-md bg-matte-charcoal/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-matte-white outline-none transition-colors hover:bg-matte-maroon focus-visible:ring-2 focus-visible:ring-matte-rose"
        >
          <Image className="h-3 w-3 text-matte-rose" />
          <span>{album.photoCount} photos</span>
        </button>

        {album.isFeatured && (
          <div className="absolute left-3 top-3 z-30 inline-flex items-center gap-1 rounded-md bg-white/92 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-matte-maroon">
            <Sparkles className="h-3 w-3 text-matte-rose" />
            <span>Featured</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex min-h-40 flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-matte-charcoal/60">
            {album.eventDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-matte-rose" />
                {new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {album.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-matte-rose" />
                {album.venue}
              </span>
            )}
          </div>
          <h3 className="font-serif text-xl font-bold leading-snug text-matte-maroon">{album.title}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-matte-charcoal/70">{album.shortDescription}</p>
        </div>
        <div className="flex items-center justify-between border-t border-matte-beige pt-4">
          <span className="text-[10px] uppercase tracking-wide text-matte-charcoal/50">{album.category.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </motion.article>
  );
};
