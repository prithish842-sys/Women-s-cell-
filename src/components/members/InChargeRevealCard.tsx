import React, { useState } from 'react';
import { Mail, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { assignImageFallback, profileFallbackImage, withResolvedImage } from '../../utils/imageFallback.js';

export interface InChargeProfile {
  _id: string;
  name: string;
  department: string;
  designation: string;
  email?: string;
  profileImage?: string;
  responsibility?: string;
  biography?: string;
  serviceYear?: string;
  achievements?: string[];
}

interface InChargeRevealCardProps {
  profile: InChargeProfile;
}

const splitCardCss = `
.singa-split-incharge {
  --card-width: min(100%, 330px);
  position: relative;
  width: 100%;
  max-width: 360px;
  min-height: 168px;
  margin-inline: auto;
}
.singa-split-incharge.is-expanded {
  min-height: 348px;
}
.singa-split-incharge .split-stage {
  position: relative;
  width: var(--card-width);
  min-height: inherit;
  margin-inline: auto;
}
.singa-split-incharge .split-panel {
  position: absolute;
  left: 0;
  width: 100%;
  min-height: 154px;
  border-radius: 25px;
  border: 1px solid rgba(126, 41, 77, 0.20);
  background: #FFFFFF;
  box-shadow: 0 14px 32px rgba(90, 24, 56, 0.08);
  transition: transform 0.42s ease-in-out, border-color 0.42s ease-in-out, box-shadow 0.42s ease-in-out, background 0.42s ease-in-out;
  overflow: hidden;
}
.singa-split-incharge .dept-card {
  top: 0;
  z-index: 3;
}
.singa-split-incharge .posting-card {
  top: 0;
  z-index: 2;
  background: #FFF8F3;
}
.singa-split-incharge.is-expanded .dept-card {
  transform: translateY(-8px);
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F3 55%, #F0DCE3 100%);
  border-color: rgba(126, 41, 77, 0.38);
  box-shadow: 0 18px 38px rgba(90, 24, 56, 0.14);
}
.singa-split-incharge.is-expanded .posting-card {
  transform: translateY(188px);
  background: linear-gradient(135deg, #5A1838 0%, #7E294D 52%, #B75D7A 100%);
  border-color: rgba(126, 41, 77, 0.38);
  color: #FFFFFF;
  box-shadow: 0 18px 38px rgba(90, 24, 56, 0.18);
}
.singa-split-incharge .avatar {
  position: absolute;
  left: 1rem;
  top: 1rem;
  width: 82px;
  height: 82px;
  border-radius: 22px;
  overflow: hidden;
  background: #E7C8D3;
  border: 4px solid #FFF8F3;
  color: #5A1838;
}
.singa-split-incharge .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.singa-split-incharge .top-content,
.singa-split-incharge .bottom-content {
  min-height: 154px;
  padding: 1.1rem 1rem 1rem 7rem;
}
.singa-split-incharge .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: #E7C8D3;
  color: #5A1838;
  padding: 0.18rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.singa-split-incharge .name {
  margin-top: 0.7rem;
  font-family: Georgia, serif;
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.15;
  color: #5A1838;
}
.singa-split-incharge .dept-value {
  margin-top: 0.45rem;
  font-size: 0.74rem;
  font-weight: 900;
  line-height: 1.3;
  color: #2E2027;
  text-transform: uppercase;
}
.singa-split-incharge .posting-card .eyebrow {
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
}
.singa-split-incharge .posting-card .name,
.singa-split-incharge .posting-card .dept-value {
  color: #FFFFFF;
}
.singa-split-incharge .posting-card .dept-value {
  text-transform: none;
}
.singa-split-incharge .middle-details {
  position: absolute;
  top: 132px;
  left: 12px;
  right: 12px;
  z-index: 1;
  min-height: 152px;
  border-radius: 24px;
  border: 1px solid rgba(126, 41, 77, 0.20);
  background: #FFFFFF;
  padding: 1rem;
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
  pointer-events: none;
  transition: opacity 0.28s ease-in-out 0.08s, transform 0.38s ease-in-out;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
}
.singa-split-incharge.is-expanded .middle-details {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.singa-split-incharge .metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  text-align: center;
}
.singa-split-incharge .metric-title {
  margin-top: 0.2rem;
  color: #5A1838;
  font-size: 0.57rem;
  font-weight: 900;
  text-transform: uppercase;
}
.singa-split-incharge .metric-value {
  margin-top: 0.18rem;
  color: #74616A;
  font-size: 0.63rem;
  font-weight: 700;
  line-height: 1.25;
}
.singa-split-incharge .bio-strip {
  margin-top: 0.8rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #5A1838 0%, #7E294D 52%, #B75D7A 100%);
  color: #FFFFFF;
  padding: 0.65rem 0.85rem;
  font-size: 0.7rem;
  line-height: 1.35;
}
.singa-split-incharge .mail-link {
  position: absolute;
  right: 0.9rem;
  bottom: 0.85rem;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: #FFFFFF;
  color: #5A1838;
  padding: 0.45rem 0.65rem;
  font-size: 0.65rem;
  font-weight: 900;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.28s ease-in-out 0.12s, transform 0.28s ease-in-out 0.12s;
}
.singa-split-incharge.is-expanded .mail-link {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
@media (max-width: 420px) {
  .singa-split-incharge .top-content,
  .singa-split-incharge .bottom-content {
    padding-left: 6.55rem;
  }
  .singa-split-incharge .avatar {
    width: 74px;
    height: 74px;
  }
  .singa-split-incharge .name {
    font-size: 1.05rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .singa-split-incharge,
  .singa-split-incharge * {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
`;

export const InChargeRevealCard: React.FC<InChargeRevealCardProps> = ({ profile }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = profile.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const primaryAchievement = profile.achievements?.[0] || 'Leadership support';

  return (
    <article
      className={`singa-split-incharge ${expanded ? 'is-expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setExpanded(false);
      }}
    >
      <style>{splitCardCss}</style>
      <div className="split-stage">
        <div className="split-panel dept-card" tabIndex={0} aria-expanded={expanded} aria-label={`${profile.name}, department ${profile.department}`}>
          <div className="avatar">
            {profile.profileImage ? (
              <img
                src={withResolvedImage(profile.profileImage, profileFallbackImage)}
                alt={`${profile.name} profile`}
                loading="lazy"
                decoding="async"
                onError={(event) => assignImageFallback(event, profileFallbackImage)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-xl font-bold">{initials}</div>
            )}
          </div>
          <div className="top-content">
            <span className="eyebrow"><ShieldCheck className="h-3 w-3" /> Department</span>
            <div className="name">{profile.name}</div>
            <div className="dept-value line-clamp-2">{profile.department || "Women's Empowerment Cell"}</div>
          </div>
        </div>

        <div className="middle-details" aria-hidden={!expanded}>
          <div className="metric-grid">
            <div>
              <Sparkles className="mx-auto h-5 w-5 text-matte-rose" />
              <div className="metric-title">Role</div>
              <div className="metric-value line-clamp-2">{profile.responsibility || 'Programme coordination'}</div>
            </div>
            <div>
              <ShieldCheck className="mx-auto h-5 w-5 text-matte-rose" />
              <div className="metric-title">Service</div>
              <div className="metric-value line-clamp-2">{profile.serviceYear || 'Active'}</div>
            </div>
            <div>
              <UserCheck className="mx-auto h-5 w-5 text-matte-rose" />
              <div className="metric-title">Focus</div>
              <div className="metric-value line-clamp-2">{primaryAchievement}</div>
            </div>
          </div>
          <div className="bio-strip">
            <span className="line-clamp-2">{profile.biography || 'Supports student safety initiatives, programme planning, and Singa Pen community development.'}</span>
          </div>
        </div>

        <div className="split-panel posting-card" aria-hidden={!expanded}>
          <div className="bottom-content">
            <span className="eyebrow"><UserCheck className="h-3 w-3" /> Posting</span>
            <div className="name">{profile.name}</div>
            <div className="dept-value line-clamp-3">{profile.designation || 'Faculty In-Charge'}</div>
          </div>
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="mail-link"
              onClick={(event) => event.stopPropagation()}
            >
              <Mail className="h-3.5 w-3.5" />
              Contact
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
