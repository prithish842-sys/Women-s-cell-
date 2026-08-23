import React from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Mail,
} from 'lucide-react';

import defaultHeroArtwork from '../../assets/images/hero/singa-pen-hero.png';

interface FacultyProfileHeroProps {
  name?: string;
  email?: string;
  staffId?: string;
  department?: string;
  designation?: string;
  profileImage?: string;
  isActive?: boolean;
}

export const FacultyProfileHero: React.FC<FacultyProfileHeroProps> = ({
  name,
  email,
  staffId,
  department,
  designation,
  profileImage,
  isActive = true,
}) => {
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#06175b] p-5 text-white shadow-[0_24px_50px_rgba(7,20,38,0.18)] sm:p-7">
      <img
        src={defaultHeroArtwork}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-50"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,16,62,0.97),rgba(7,20,70,0.86)_48%,rgba(83,22,124,0.62))]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        {profileImage ? (
          <img
            src={profileImage}
            alt={`${name || 'Faculty'} profile`}
            className="h-24 w-24 shrink-0 rounded-full border-4 border-white/90 object-cover shadow-xl ring-4 ring-white/15"
          />
        ) : (
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-white/80 bg-white/10 text-3xl font-black">
            {name?.slice(0, 1) || 'F'}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-[-0.03em]">
              {name || 'Faculty Member'}
            </h1>

            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">
              <BadgeCheck className="h-3.5 w-3.5" />
              Faculty
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                isActive
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'bg-rose-400/20 text-rose-100'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/85">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>{department || 'Department not set'}</span>
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/80">
            <BriefcaseBusiness className="h-4 w-4 shrink-0" />
            <span>{designation || 'Faculty member'}</span>
          </p>

          {email ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/70">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{email}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-white/60">Staff ID</p>
          <p className="mt-1 truncate text-sm font-black">{staffId || 'Protected'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-white/60">Department</p>
          <p className="mt-1 truncate text-sm font-black">{department || 'Not set'}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-white/60">Designation</p>
          <p className="mt-1 truncate text-sm font-black">{designation || 'Not set'}</p>
        </div>
      </div>
    </section>
  );
};

export default FacultyProfileHero;
