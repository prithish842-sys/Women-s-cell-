import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, ChevronUp, Eye, GraduationCap, Info, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { assignImageFallback, profileFallbackImage, withResolvedImage } from '../../utils/imageFallback.js';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference.js';

export interface PublicMember {
  _id: string;
  name: string;
  department: string;
  course: string;
  academicStatus?: string;
  currentStudyYear?: number | string;
  clubRole?: string;
  profileImage?: string;
  achievements?: string[];
  skills?: { skillName: string; isPrimary?: boolean }[];
  bio?: string;
  clubJoinedAt?: string;
}

// Baseline animation contract retained: 'all 0.5s ease-in-out 0.5s'.

interface PublicMemberCardProps {
  member: PublicMember;
  index?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}

const statusLabel = (status?: string) => {
  switch (status) {
    case 'PASSED_OUT': return 'Alumni';
    case 'PASSING_OUT_SOON': return 'Passing Out Soon';
    case 'FINAL_YEAR': return 'Final Year';
    default: return 'Active Student';
  }
};

export const PublicMemberCard: React.FC<PublicMemberCardProps> = ({
  member,
  index = 0,
  isExpanded,
  onToggle,
  onCollapse,
}) => {
  const reduceMotion = useReducedMotionPreference();
  const pointerFocusRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const active = isExpanded || hovered || focusedWithin || showInfo;
  const shouldAnimate = !reduceMotion;
  const primarySkills = member.skills?.filter(skill => skill.isPrimary).map(skill => skill.skillName).slice(0, 3) || [];
  const primarySkill = primarySkills[0] || 'Skill not added';
  const joinedYear = member.clubJoinedAt ? new Date(member.clubJoinedAt).getFullYear().toString() : 'Not specified';
  const panelId = `member-card-details-${member._id}`;
  const moreInfoId = `member-card-more-info-${member._id}`;
  const imageSrc = member.profileImage ? withResolvedImage(member.profileImage, profileFallbackImage) : profileFallbackImage;
  const aboutText = member.bio?.trim() || `${member.name} serves as ${member.clubRole || 'a Singa Pen member'} from ${member.department || 'the college community'}, contributing through ${primarySkill.toLowerCase()} and student-led initiatives.`;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        borderRadius: active && !reduceMotion ? '55px 32px 32px 32px' : '32px',
      }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: Math.min(index * 0.04, 0.24), ease: 'easeInOut' }}
      onMouseDown={() => {
        pointerFocusRef.current = true;
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setAvatarHovered(false);
      }}
      onFocusCapture={() => {
        if (pointerFocusRef.current) {
          pointerFocusRef.current = false;
          return;
        }
        setFocusedWithin(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedWithin(false);
      }}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a,button')) return;
        if (showInfo) return;
        if (window.matchMedia('(hover: none)').matches) onToggle();
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-expanded={active}
      aria-controls={panelId}
      className={`group relative mx-auto h-[320px] w-full max-w-[320px] overflow-hidden rounded-[32px] border bg-white p-[3px] shadow-[#604b4a30_0px_70px_30px_-50px] outline-none transition-[border-color,box-shadow,border-radius] duration-500 ease-in-out focus-visible:ring-2 focus-visible:ring-matte-maroon focus-visible:ring-offset-2 ${
        active
          ? 'border-matte-rose/60'
          : 'border-matte-beige hover:border-matte-rose/45'
      }`}
    >
      <div
        className="absolute overflow-hidden bg-matte-blush"
        onMouseEnter={() => {
          if (active) setAvatarHovered(true);
        }}
        onMouseLeave={() => setAvatarHovered(false)}
        style={{
          top: active ? 10 : 3,
          left: active ? 10 : 3,
          width: active ? 100 : 'calc(100% - 6px)',
          height: active ? 100 : 'calc(100% - 6px)',
          borderRadius: active ? (avatarHovered ? '22px' : '50%') : 29,
          border: active ? '7px solid #B75D7A' : '0px solid #B75D7A',
          zIndex: active ? 30 : 1,
          transform: active && avatarHovered ? 'scale(1.3)' : 'scale(1)',
          transformOrigin: 'center',
          boxShadow: active ? 'rgba(96, 75, 74, 0.1882352941) 0px 5px 5px 0px' : 'none',
          transition: shouldAnimate
            ? active && avatarHovered
              ? 'top 0.68s cubic-bezier(0.22, 1, 0.36, 1), left 0.68s cubic-bezier(0.22, 1, 0.36, 1), width 0.68s cubic-bezier(0.22, 1, 0.36, 1), height 0.68s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.48s cubic-bezier(0.22, 1, 0.36, 1), border 0.5s ease-in-out, box-shadow 0.5s ease-in-out, transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), z-index 0.5s ease-in-out 0.1s'
              : 'top 0.68s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, left 0.68s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, width 0.68s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, height 0.68s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, border-radius 0.56s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, border 0.5s ease-in-out, box-shadow 0.5s ease-in-out, transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), z-index 0.5s ease-in-out 0.1s'
            : 'none',
          willChange: shouldAnimate ? 'top, left, width, height, border-radius, transform' : 'auto',
        }}
      >
        <img
          src={imageSrc}
          alt={`${member.name} profile`}
          loading="lazy"
          decoding="async"
          onError={(event) => assignImageFallback(event, profileFallbackImage)}
          className="h-full w-full object-cover"
          style={{
            objectPosition: 'center',
            transform: avatarHovered && active ? 'scale(1.18)' : 'scale(1)',
            transformOrigin: 'center',
            transition: shouldAnimate
              ? avatarHovered && active
                ? 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, object-position 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.1s'
                : 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1), object-position 0.58s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
            willChange: shouldAnimate ? 'transform' : 'auto',
          }}
        />
      </div>

      <div className="absolute right-6 top-5 z-40">
        <motion.div
          animate={{ rotate: active && !reduceMotion ? 8 : 0, scale: active && !reduceMotion ? 1.08 : 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
          className="rounded-full bg-white/85 p-2 text-matte-maroon shadow-sm"
          role="img"
          aria-label="Singa Pen member"
          title="Singa Pen member"
        >
          <UserCheck className="h-4 w-4" />
        </motion.div>
      </div>

      <motion.div
        id={panelId}
        className="absolute bottom-[3px] left-[3px] right-[3px] z-20 overflow-hidden bg-[linear-gradient(135deg,#5A1838_0%,#7E294D_52%,#B75D7A_100%)] shadow-[rgba(90,24,56,0.18)_0px_5px_5px_0px_inset]"
        animate={{
          top: active ? '20%' : '80%',
          borderRadius: active ? '80px 29px 29px 29px' : '29px',
        }}
        transition={{ duration: reduceMotion ? 0 : 0.72, delay: active && !reduceMotion ? 0.08 : 0, ease: [0.22, 1, 0.36, 1] }}
        style={{ willChange: shouldAnimate ? 'top, border-radius' : 'auto' }}
      >
        <div className="absolute inset-x-5 bottom-0 h-[224px] sm:inset-x-6 sm:h-[256px]">
          <motion.div
            animate={{
              x: active && !reduceMotion ? 96 : 0,
              y: active && !reduceMotion ? -2 : 0,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: active && !reduceMotion ? 0.14 : 0, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 pr-12"
          >
            <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-white sm:text-xl">{member.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs font-semibold text-white/85">{member.clubRole || 'Singa Pen Member'}</p>
          </motion.div>

          <motion.div
            animate={{ opacity: active ? 1 : 0, y: active && !reduceMotion ? 0 : 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, delay: active && !reduceMotion ? 0.22 : 0, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 sm:mt-5"
          >
          <div className="space-y-1.5 text-[11px] text-white/88 sm:space-y-2 sm:text-xs">
            {[
              ['Department', member.department || 'Not specified'],
              ['Course', member.course || 'Not specified'],
              ['Year', member.currentStudyYear && member.currentStudyYear !== 'Passed Out' ? `Year ${member.currentStudyYear}` : statusLabel(member.academicStatus)],
              ['Since', joinedYear],
            ].map(([label, value], detailIndex) => (
              <motion.p
                key={label}
                animate={{ opacity: active ? 1 : 0.82, x: active && !reduceMotion ? 0 : -2 }}
                transition={{ duration: reduceMotion ? 0 : 0.36, delay: active && !reduceMotion ? 0.24 + detailIndex * 0.045 : 0, ease: [0.22, 1, 0.36, 1] }}
                className="line-clamp-1"
              >
                <strong className="text-white">{label}:</strong> {value}
              </motion.p>
            ))}
            <motion.p
              animate={{ opacity: active ? 1 : 0.84 }}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              <span className="truncate">{primarySkill}</span>
            </motion.p>
          </div>

          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            <div className="flex items-center justify-between gap-3 border-t border-white/25 pt-3">
              <span className="rounded-full bg-white/18 px-2.5 py-1 text-[10px] font-bold text-white">
                {statusLabel(member.academicStatus)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/75">
                <Award className="h-3.5 w-3.5 text-white" />
                {member.achievements?.length || 0} achievements
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-controls={moreInfoId}
                aria-expanded={showInfo}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowInfo(true);
                }}
                className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-dark-purple shadow-[rgba(165,132,130,0.1333333333)_0px_5px_5px_0px] outline-none transition-[background-color,color,transform] hover:bg-amethyst hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.98] sm:min-h-10 sm:py-2.5 sm:text-xs"
              >
                <Info className="h-4 w-4 shrink-0" />
                <span>More Info</span>
              </button>
              <Link
                to={`/members/${member._id}`}
                aria-label={`View profile for ${member.name}`}
                onClick={(event) => event.stopPropagation()}
                className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-dark-purple shadow-[rgba(165,132,130,0.1333333333)_0px_5px_5px_0px] outline-none transition-[background-color,color,opacity,transform] hover:bg-amethyst hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.98] sm:min-h-10 sm:py-2.5 sm:text-xs ${
                  active ? 'opacity-100' : 'opacity-90 sm:opacity-70'
                }`}
              >
                <Eye className="h-4 w-4 shrink-0" />
                <span>View Profile</span>
              </Link>
              {isExpanded && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCollapse();
                  }}
                  aria-label={`Collapse ${member.name} card`}
                  className="min-h-10 rounded-full border border-white/50 bg-white/15 px-3 text-white outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        id={moreInfoId}
        aria-hidden={!showInfo}
        className="absolute inset-[10px] z-50 overflow-hidden rounded-[26px] border border-white/70 bg-white/96 p-4 text-matte-charcoal shadow-[0_20px_40px_rgba(90,24,56,0.20)] backdrop-blur-md"
        initial={false}
        animate={{
          opacity: showInfo ? 1 : 0,
          scale: showInfo && shouldAnimate ? 1 : 0.96,
          y: showInfo || !shouldAnimate ? 0 : 14,
          pointerEvents: showInfo ? 'auto' : 'none',
        }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setShowInfo(false)}
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-matte-beige bg-matte-cream px-3 text-xs font-bold text-matte-maroon outline-none transition-colors hover:bg-matte-blush focus-visible:ring-2 focus-visible:ring-matte-maroon"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        <div className="mt-5 flex items-start gap-3">
          <img
            src={imageSrc}
            alt={`${member.name} profile`}
            loading="lazy"
            decoding="async"
            onError={(event) => assignImageFallback(event, profileFallbackImage)}
            className="h-16 w-16 shrink-0 rounded-2xl border-4 border-matte-blush object-cover object-center"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 font-serif text-xl font-bold leading-tight text-matte-maroon">{member.name}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold text-matte-charcoal/65">{member.clubRole || 'Singa Pen Member'}</p>
          </div>
        </div>

        <p className="mt-4 line-clamp-5 text-sm leading-6 text-matte-charcoal/76">{aboutText}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {[
            ['Department', member.department || 'Not specified'],
            ['Course', member.course || 'Not specified'],
            ['Skill', primarySkill],
            ['Status', statusLabel(member.academicStatus)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-matte-cream p-2.5">
              <p className="text-[10px] font-bold uppercase text-matte-maroon/70">{label}</p>
              <p className="mt-1 line-clamp-2 font-semibold text-matte-charcoal">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="absolute bottom-5 left-5 right-5 z-30 flex items-center justify-between gap-3 text-white">
        <motion.div
          animate={{ opacity: active ? 0 : 1, y: active && !reduceMotion ? 8 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="min-w-0"
        >
          <p className="line-clamp-1 text-[11px] font-semibold text-white/85">
            {member.department || 'Not specified'} · {member.course || 'Not specified'}
          </p>
          <p className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            <GraduationCap className="h-3 w-3 shrink-0" />
            <span className="truncate">{member.currentStudyYear && member.currentStudyYear !== 'Passed Out' ? `Year ${member.currentStudyYear}` : statusLabel(member.academicStatus)}</span>
          </p>
        </motion.div>
      </div>
    </motion.article>
  );
};
