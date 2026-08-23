import React from 'react';
import { MapPin } from 'lucide-react';

import defaultHeroArtwork from '../../assets/images/hero/singa-pen-hero.png';

export interface StudentHeroStat {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{
    className?: string;
  }>;
}

interface StudentProfileHeroProps {
  name?: string;
  email?: string;
  department?: string;
  course?: string;
  bio?: string;
  status?: string;
  profileImage?: string;
  backgroundImage?: string;
  stats?: StudentHeroStat[];
}

export const StudentProfileHero: React.FC<
  StudentProfileHeroProps
> = ({
  name,
  email,
  department,
  course,
  bio,
  status = 'ACTIVE',
  profileImage,
  backgroundImage,
  stats = [],
}) => {
  const heroImage =
    backgroundImage ||
    defaultHeroArtwork;

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#06175b] p-5 text-white shadow-[0_24px_50px_rgba(7,20,38,0.18)] sm:p-7">
      {/* Background image */}

      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
      />

      {/* Overlay */}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,16,62,0.96),rgba(7,20,70,0.84)_45%,rgba(83,22,124,0.58))]" />

      {/* Main profile details */}

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        {profileImage ? (
          <img
            src={profileImage}
            alt={`${name || 'Student'} profile`}
            className="h-24 w-24 shrink-0 rounded-full border-4 border-white/90 object-cover shadow-xl ring-4 ring-white/15"
          />
        ) : (
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-white/80 bg-white/10 text-3xl font-black">
            {name?.slice(0, 1) ||
              'S'}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-[-0.03em]">
              {name || 'Student'}
            </h1>

            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">
              {status.replaceAll(
                '_',
                ' ',
              )}
            </span>
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/85">
            <MapPin className="h-4 w-4 shrink-0" />

            <span>
              {department ||
                'Department'}{' '}
              ·{' '}
              {course ||
                'Academic programme'}
            </span>
          </p>

          {email ? (
            <p className="mt-2 text-sm font-semibold text-white/75">
              {email}
            </p>
          ) : null}

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            {bio ||
              'Keep your profile, skills and saved schemes current so the Women Empowerment Cell can match you to useful opportunities.'}
          </p>
        </div>
      </div>

      {/* Stats */}

      {stats.length > 0 ? (
        <div className="relative mt-5 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 sm:grid-cols-4">
          {stats.map((item) => {
            const Icon =
              item.icon;

            return (
              <div
                key={item.label}
                className="min-w-0"
              >
                <div className="flex items-center gap-2 text-white/65">
                  {Icon ? (
                    <Icon className="h-4 w-4 shrink-0" />
                  ) : null}

                  <span className="truncate text-[10px] font-black uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>

                <p className="mt-1 truncate text-xl font-black text-white">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default StudentProfileHero;