import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Ambulance,
  ArrowRight,
  CheckCircle,
  Crown,
  Flame,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  LifeBuoy,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

import api from '../../utils/api.js';

import {
  getMemberPhoto,
  memberFallbackPhoto,
  type PublicMember,
} from '../../utils/memberDirectory.js';

import { PageWrapper } from '../../components/common/PageWrapper.js';

import {
  PortalHero,
  SectionHeading,
} from '../../components/common/ReferenceChrome.js';

import { MemberCardSkeleton } from '../../components/common/Skeleton.js';

import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';

/* ==========================================================================
   MEMBERS PAGE
   ========================================================================== */

export const Members: React.FC = () => {
  const [members, setMembers] = useState<PublicMember[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [expandedMemberId, setExpandedMemberId] =
    useState<string | null>(null);

  const [helplines, setHelplines] = useState<any[]>([]);

  /* =========================================================================
     FETCH PUBLIC MEMBERS
     ========================================================================= */

  const fetchMembers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/public/members');

      if (response.data?.success) {
        const memberData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setMembers(memberData);
      } else {
        setMembers([]);

        setError(
          'Failed to fetch the club directory.',
        );
      }
    } catch (err) {
      console.error(
        'Error fetching members:',
        err,
      );

      setMembers([]);

      setError(
        'Could not establish connection to college records.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
  }, []);

  /* =========================================================================
     FETCH EMERGENCY HELPLINES
     ========================================================================= */

  useEffect(() => {
    let active = true;

    const fetchHelplines = async () => {
      try {
        const response = await api.get(
          '/safety/official-resources',
        );

        if (
          !active ||
          !response.data?.success
        ) {
          return;
        }

        const resources = Array.isArray(
          response.data.data,
        )
          ? response.data.data
          : [];

        const validHelplines = resources
          .filter(
            (resource: any) =>
              resource?.phone,
          )
          .slice(0, 5);

        setHelplines(validHelplines);
      } catch (error) {
        console.error(
          'Unable to load member-page helplines:',
          error,
        );
      }
    };

    void fetchHelplines();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================================
     CLOSE EXPANDED MEMBER CARD ON OUTSIDE CLICK
     ========================================================================= */

  useEffect(() => {
    if (!expandedMemberId) {
      return;
    }

    const handleDocumentClick = (
      event: MouseEvent,
    ) => {
      const target =
        event.target as HTMLElement;

      if (
        !target.closest(
          '[data-singa-member-card="true"]',
        )
      ) {
        setExpandedMemberId(null);
      }
    };

    document.addEventListener(
      'click',
      handleDocumentClick,
    );

    return () => {
      document.removeEventListener(
        'click',
        handleDocumentClick,
      );
    };
  }, [expandedMemberId]);

  return (
    <PageWrapper>
      <div className="reference-shell">
        {/* =================================================================
            HERO
            ================================================================= */}

        <PortalHero
          image={pageHeroImages.club}
                    mobileImage={mobilePageHeroImages.club}
mobileImagePosition="53% center"
          mobileImageWidth="100%"
          title={
            <>
              Singa Pen{' '}
              <span className="text-[#e91670]">
                Club
              </span>
            </>
          }
          copy="Singa Pen Club brings together students and faculty to learn, lead and uplift each other through the Women's Empowerment Cell."
          showText={false}
        />

        <main className="reference-container -mt-6 space-y-7 pb-10">
          {/* ===============================================================
              CLUB HIGHLIGHTS
              =============================================================== */}

          <section className="reference-panel relative z-10 grid overflow-hidden rounded-xl sm:grid-cols-2 xl:grid-cols-[repeat(4,1fr)_1.25fr]">
            {[
              [
                'A Community',
                'Connect with members and build meaningful relationships.',
                Users,
                'text-[#075cff]',
              ],

              [
                'Learn & Grow',
                'Access workshops, mentoring and development opportunities.',
                GraduationCap,
                'text-[#7c3aed]',
              ],

              [
                'Lead Initiatives',
                'Take part in activities that create meaningful impact.',
                Sparkles,
                'text-[#e91670]',
              ],

              [
                'Support & Empower',
                'Support, inspire and empower every member.',
                HeartHandshake,
                'text-[#0891b2]',
              ],
            ].map(
              ([
                title,
                copy,
                Icon,
                color,
              ]) => (
                <div
                  key={title as string}
                  className="flex min-h-[105px] items-center gap-4 border-b border-[#dbe4f2] p-5 sm:border-r xl:border-b-0"
                >
                  <Icon
                    className={`h-9 w-9 shrink-0 ${
                      color as string
                    }`}
                  />

                  <span>
                    <strong
                      className={`block text-sm font-black ${
                        color as string
                      }`}
                    >
                      {title as string}
                    </strong>

                    <small className="mt-1 block text-xs font-semibold leading-5 text-[#52617f]">
                      {copy as string}
                    </small>
                  </span>
                </div>
              ),
            )}

            <div className="bg-[#06123a] p-5 text-white sm:col-span-2 xl:col-span-1">
              <strong className="block text-lg font-black">
                Singa Pen Club
              </strong>

              <p className="mt-2 text-xs font-semibold leading-5 text-white/70">
                Be part of a community that
                celebrates leadership,
                empowerment and responsible
                participation.
              </p>

              <Link
                to="/register"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#e91670] px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-[#c71260]"
              >
                Join Singa Pen Club

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          {/* ===============================================================
              ERROR
              =============================================================== */}

          {error ? (
            <div className="reference-card flex flex-col items-start justify-between gap-3 p-5 text-red-700 sm:flex-row sm:items-center">
              <p className="font-semibold">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void fetchMembers();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-xs font-black"
              >
                <RefreshCw className="h-4 w-4" />

                Retry
              </button>
            </div>
          ) : null}

          {/* ===============================================================
              OUR COMMITTEE
              =============================================================== */}

          <section>
            <SectionHeading
              icon={
                <Crown className="h-5 w-5 fill-[#075cff] text-[#075cff]" />
              }
              title="Our Committee"
              caption="Women's Empowerment Cell and Singa Pen members."
            />

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
                {Array.from({
                  length: 10,
                }).map((_, index) => (
                  <MemberCardSkeleton
                    key={index}
                  />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="reference-card py-12 text-center">
                <Crown className="mx-auto h-9 w-9 text-[#8ba0cc]" />

                <p className="mt-3 font-black text-[#06123a]">
                  No public members are
                  available right now.
                </p>
              </div>
            ) : (
              <div className="grid items-stretch gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
                {members.map((member) => (
                  <CommitteeCard
                    key={member._id}
                    member={member}
                    expanded={
                      expandedMemberId ===
                      member._id
                    }
                    onToggle={() => {
                      setExpandedMemberId(
                        (currentId) =>
                          currentId ===
                          member._id
                            ? null
                            : member._id,
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ===============================================================
              WHAT WE DO + RESPONSIBILITIES
              =============================================================== */}

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            {/* WHAT WE DO */}

            <section className="reference-panel rounded-xl p-5 sm:p-6">
              <SectionHeading
                title="What We Do"
                caption="Empower. Educate. Elevate."
              />

              <div className="space-y-4">
                {[
                  [
                    'Student Engagement',
                    'Create pathways for students to participate in cell activities and college initiatives.',
                  ],

                  [
                    'Skills Development',
                    'Encourage skill discovery, showcase, learning and collaboration.',
                  ],

                  [
                    'Schemes & Opportunities',
                    'Help students explore relevant government schemes and support opportunities.',
                  ],

                  [
                    'Events & Community',
                    'Support awareness programmes, workshops and community participation.',
                  ],

                  [
                    'Awareness & Safety',
                    'Connect students to safety resources, support contacts and responsible reporting routes.',
                  ],

                  [
                    'Leadership Coordination',
                    'Build responsible participation through club roles and shared responsibilities.',
                  ],
                ].map(([title, copy]) => (
                  <div
                    key={title}
                    className="flex gap-3"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f3eeff]">
                      <Shield className="h-4 w-4 text-[#7c3aed]" />
                    </span>

                    <span>
                      <strong className="block text-sm font-black text-[#06123a]">
                        {title}
                      </strong>

                      <small className="mt-1 block text-xs font-semibold leading-5 text-[#52617f]">
                        {copy}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* MEMBER RESPONSIBILITIES */}

            <section className="reference-panel rounded-xl p-5 sm:p-6">
              <SectionHeading
                title="Member Responsibilities"
                caption="Be an active part of our journey."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Respect and support every member.',
                  'Participate in events and initiatives.',
                  'Share knowledge and inspire others.',
                  'Uphold the values of the club.',
                  'Coordinate with faculty and peers responsibly.',
                  'Use portal resources ethically and safely.',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex min-h-[70px] items-start gap-3 rounded-xl border border-[#e8eef8] bg-[#f8fbff] p-4"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#14a56d]" />

                    <p className="text-sm font-semibold leading-5 text-[#33456e]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ===============================================================
              EMERGENCY CONTACTS
              =============================================================== */}

          <section className="overflow-hidden rounded-xl bg-[#031039] px-4 py-5 text-white sm:px-6">
            <div className="grid items-center gap-5 lg:grid-cols-[minmax(240px,1.1fr)_minmax(0,4fr)]">
              {/* HEADING */}

              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#075cff] shadow-lg">
                  <Phone className="h-5 w-5" />
                </span>

                <span>
                  <strong className="block text-lg font-black">
                    Emergency Contacts
                  </strong>

                  <small className="mt-1 block font-semibold text-white/70">
                    Important numbers at your
                    fingertips.
                  </small>
                </span>
              </div>

              {/* CONTACTS */}

              {helplines.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {helplines.map(
                    (item) => {
                      const Icon =
                        getHelplineIcon(
                          item.category,
                          item.name,
                        );

                      return (
                        <a
                          key={`${item.name}-${item.phone}`}
                          href={`tel:${item.phone}`}
                          className="group flex min-h-[72px] items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/10"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 ring-1 ring-white/15 transition-transform group-hover:scale-105">
                            <Icon className="h-5 w-5 text-cyan-200" />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-[0.68rem] font-semibold text-white/65">
                              {item.name}
                            </span>

                            <strong className="mt-0.5 block text-sm font-black text-white">
                              {item.phone}
                            </strong>
                          </span>
                        </a>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white/65">
                  Emergency contacts are
                  currently unavailable.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

/* ==========================================================================
   COMMITTEE MEMBER CARD
   ========================================================================== */

const CommitteeCard: React.FC<{
  member: PublicMember;
  expanded: boolean;
  onToggle: () => void;
}> = ({
  member,
  expanded,
  onToggle,
}) => {
  const displayRole =
    member.clubRole ||
    member.designation ||
    member.department ||
    'Member';

  const displayType =
    member.memberType === 'FACULTY'
      ? 'Faculty'
      : member.memberType ===
            'STUDENT'
        ? 'Student Member'
        : member.memberType ||
          'Member';

  return (
    <article
      data-singa-member-card="true"
      className={`reference-card flex h-full flex-col overflow-hidden rounded-xl p-3 transition duration-200 sm:p-4 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_36px_rgba(7,20,38,0.12)] ${
        expanded
          ? 'ring-2 ring-[#075cff]'
          : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-1 items-center gap-4 text-left sm:block"
      >
        {/* =============================================================
            MOBILE IMAGE
            compact portrait

            DESKTOP/TABLET
            large card image
            ============================================================= */}

        <div className="relative h-[118px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-[#eef3ff] sm:mx-auto sm:h-44 sm:w-full">
          <img
            src={getMemberPhoto(member)}
            alt={`${member.name} profile`}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror =
                null;

              event.currentTarget.src =
                memberFallbackPhoto;
            }}
            className="h-full w-full object-cover object-[center_20%] transition-transform duration-300 sm:object-top sm:hover:scale-[1.03]"
          />
        </div>

        {/* DETAILS */}

        <div className="min-w-0 flex-1 sm:mt-4">
          <strong className="block text-[15px] font-black leading-5 text-[#06123a] sm:text-sm">
            {member.name}
          </strong>

          <small className="mt-1 block text-xs font-black leading-5 text-[#075cff]">
            {displayRole}
          </small>

          {member.department ? (
            <small className="mt-1 block line-clamp-2 text-[0.7rem] font-semibold leading-4 text-[#657391]">
              {member.department}
            </small>
          ) : null}

          <span className="mt-3 inline-flex rounded-full bg-[#f2f4ff] px-3 py-1.5 text-[0.65rem] font-black text-[#3153d8] sm:mt-4 sm:px-4 sm:text-[0.68rem]">
            {displayType}
          </span>

          <span className="mt-3 flex items-center gap-1 text-[10px] font-black text-[#075cff] sm:hidden">
            Tap for details

            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </button>

      {/* EXPANDED DETAILS */}

      {expanded ? (
        <div className="mt-4 border-t border-[#edf2fb] pt-4">
          <p className="line-clamp-3 text-xs font-semibold leading-5 text-[#52617f]">
            {member.bio ||
              `${member.name} is part of the Singa Pen public member directory.`}
          </p>

          <Link
            to={`/members/${member._id}`}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#eef4ff] px-3 py-2 text-xs font-black text-[#075cff] transition hover:bg-[#e2ebff]"
          >
            View Profile

            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </article>
  );
};

/* ==========================================================================
   EMERGENCY CONTACT ICON
   ========================================================================== */

const getHelplineIcon = (
  category: string = '',
  name: string = '',
) => {
  const value =
    `${category} ${name}`.toLowerCase();

  if (value.includes('fire')) {
    return Flame;
  }

  if (
    value.includes('ambulance') ||
    value.includes('health') ||
    value.includes('medical')
  ) {
    return Ambulance;
  }

  if (
    value.includes('women') ||
    value.includes('woman')
  ) {
    return LifeBuoy;
  }

  if (
    value.includes('child') ||
    value.includes('counselling') ||
    value.includes('counseling')
  ) {
    return HelpCircle;
  }

  if (
    value.includes('police') ||
    value.includes('emergency')
  ) {
    return Shield;
  }

  return Phone;
};

export default Members;