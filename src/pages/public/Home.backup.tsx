import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Crown,
  HeartPulse,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Star,
  type LucideIcon,
} from 'lucide-react';

import api, { resolveUploadUrl } from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import {
  PortalHero,
  SectionHeading,
} from '../../components/common/ReferenceChrome.js';
import { pageHeroImages } from '../../utils/pageHeroImages.js';

import fallbackProfile from '../../assets/images/placeholders/default-profile.webp';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Scheme {
  _id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  category?: string | null;
}

interface Member {
  _id: string;
  name: string;
  profileImage?: string | null;
  clubRole?: string | null;
  designation?: string | null;
  department?: string | null;
}

interface EmergencyResource {
  _id?: string;
  name: string;
  phone: string;
}

interface FeatureCard {
  title: string;
  copy: string;
  icon: LucideIcon;
  path: string;
  colorClass: string;
}

interface SafetyCard {
  title: string;
  copy: string;
  icon: LucideIcon;
  action: string;
  path: string;
  toneClass: string;
}

interface HelpCard {
  title: string;
  copy: string;
  icon: LucideIcon;
  path: string;
}

/* -------------------------------------------------------------------------- */
/* Static presentation configuration                                          */
/* -------------------------------------------------------------------------- */

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: 'Opportunities',
    copy: 'Discover scholarships, jobs, internships and grants curated for you.',
    icon: Landmark,
    path: '/schemes',
    colorClass: 'text-[#075cff]',
  },
  {
    title: 'Skills',
    copy: 'Learn, upskill and grow with courses, workshops and certifications.',
    icon: Award,
    path: '/skills',
    colorClass: 'text-[#7c3aed]',
  },
  {
    title: 'Safety',
    copy: 'Access safety tools, helplines and support whenever you need.',
    icon: Shield,
    path: '/safety',
    colorClass: 'text-[#e91670]',
  },
];

const SKILL_INFORMATION = [
  {
    title: 'Identify strengths',
    copy:
      'Students can record skills, levels, tools and areas of interest so their strengths are easier to understand.',
  },
  {
    title: 'Showcase growth',
    copy:
      'Skill profiles help students present learning progress, project readiness and collaboration interests.',
  },
  {
    title: 'Discover talent',
    copy:
      'Faculty and administrators can discover relevant talent where role permissions allow it.',
  },
  {
    title: 'Improve skills',
    copy:
      'The Skills page connects students to the wider directory and future learning opportunities.',
  },
];

const SAFETY_CARDS: SafetyCard[] = [
  {
    title: 'Emergency SOS',
    copy: 'Need immediate help? Access emergency assistance quickly.',
    icon: Phone,
    action: 'View Help',
    path: '/safety/emergency',
    toneClass: 'from-[#ff245d] to-[#ef0f5f]',
  },
  {
    title: 'Women Helpline',
    copy: 'Access verified women support and helpline information.',
    icon: Shield,
    action: 'View Helplines',
    path: '/safety/emergency',
    toneClass: 'from-[#0647b8] to-[#075cff]',
  },
  {
    title: 'Support',
    copy: 'Find confidential support and wellbeing resources.',
    icon: MessageCircle,
    action: 'Get Support',
    path: '/safety',
    toneClass: 'from-[#5b1bc9] to-[#7c3aed]',
  },
  {
    title: 'Safety Resources',
    copy: 'Find useful safety information and important support resources.',
    icon: MapPin,
    action: 'Explore',
    path: '/safety',
    toneClass: 'from-[#087b8b] to-[#0891b2]',
  },
];

const HELP_CARDS: HelpCard[] = [
  {
    title: 'Government Schemes',
    copy:
      'Find relevant schemes, scholarships and support opportunities from one searchable place.',
    icon: Landmark,
    path: '/schemes',
  },
  {
    title: 'Skills',
    copy:
      'Showcase abilities, identify areas to improve and become discoverable for suitable opportunities.',
    icon: Award,
    path: '/skills',
  },
  {
    title: 'Singa Pen Club',
    copy:
      'Participate in the Women Empowerment Cell community and take leadership roles.',
    icon: Crown,
    path: '/members',
  },
  {
    title: 'Safety & Support',
    copy:
      'Access verified safety information, helplines and support routes when help is needed.',
    icon: Shield,
    path: '/safety',
  },
  {
    title: 'Workshops & Activities',
    copy:
      'Follow learning, awareness and community activities supported through the portal.',
    icon: Star,
    path: '/student/workshops',
  },
  {
    title: 'Wellbeing',
    copy:
      'Use wellbeing support as one part of the broader student care ecosystem after signing in.',
    icon: HeartPulse,
    path: '/student/wellbeing',
  },
];

const FALLBACK_EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'Police',
    phone: '100',
  },
  {
    name: 'Fire',
    phone: '101',
  },
  {
    name: 'Ambulance',
    phone: '102',
  },
  {
    name: 'Women Helpline',
    phone: '181',
  },
  {
    name: 'Child Helpline',
    phone: '1098',
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const toArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export const Home: React.FC = () => {
  const [featuredSchemes, setFeaturedSchemes] = useState<Scheme[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [emergencyResources, setEmergencyResources] = useState<
    EmergencyResource[]
  >([]);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      const [schemesResult, membersResult, emergencyResult] =
        await Promise.allSettled([
          api.get('/public/schemes'),
          api.get('/public/members'),
          api.get('/safety/resources'),
        ]);

      if (!isMounted) {
        return;
      }

      if (
        schemesResult.status === 'fulfilled' &&
        schemesResult.value.data?.success
      ) {
        setFeaturedSchemes(
          toArray<Scheme>(schemesResult.value.data.data),
        );
      }

      if (
        membersResult.status === 'fulfilled' &&
        membersResult.value.data?.success
      ) {
        setMembers(
          toArray<Member>(membersResult.value.data.data).slice(0, 3),
        );
      }

      if (
        emergencyResult.status === 'fulfilled' &&
        emergencyResult.value.data?.success
      ) {
        setEmergencyResources(
          toArray<EmergencyResource>(
            emergencyResult.value.data.data,
          ).slice(0, 5),
        );
      }
    };

    void fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleSchemes = featuredSchemes.slice(0, 4);

  const visibleEmergencyResources =
    emergencyResources.length > 0
      ? emergencyResources.slice(0, 5)
      : FALLBACK_EMERGENCY_RESOURCES;

  return (
    <PageWrapper>
      <div className="reference-shell">
        {/* ------------------------------------------------------------------ */}
        {/* Hero                                                               */}
        {/* ------------------------------------------------------------------ */}

        <PortalHero
          image={pageHeroImages.home}
          title="Power. Safety."
          subtitle="Wellbeing."
          copy="Singa Pen Portal is your all-in-one digital platform for opportunities, skills, safety and wellbeing. Empowered women. Empowering future."
          showText={false}
        >
          <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 rounded-lg bg-[#075cff] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#0647d8] sm:px-6"
            >
              Explore Platform
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[#e91670] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#c81060] sm:px-6"
            >
              Join Singa Pen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PortalHero>

        <main className="reference-container -mt-3 space-y-7 pb-10 sm:space-y-8">
          {/* ---------------------------------------------------------------- */}
          {/* Opportunities / Skills / Safety / Singa Pen Club                 */}
          {/* ---------------------------------------------------------------- */}

          <section className="relative z-10 grid gap-4 md:grid-cols-3 xl:grid-cols-[0.8fr_0.8fr_0.8fr_2.45fr] xl:gap-5">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  to={card.path}
                  className="reference-card flex min-h-[170px] flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(7,20,38,0.08)] sm:p-6"
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f1f5ff] ${card.colorClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>

                  <h2
                    className={`mt-4 text-lg font-black ${card.colorClass}`}
                  >
                    {card.title}
                  </h2>

                  <p className="mt-2 max-w-[15rem] text-xs font-semibold leading-5 text-[#52617f]">
                    {card.copy}
                  </p>

                  <ArrowRight
                    className={`mt-auto h-4 w-4 pt-4 box-content ${card.colorClass}`}
                  />
                </Link>
              );
            })}

            {/* Singa Pen Club */}

            <section className="reference-panel overflow-hidden rounded-xl p-5 md:col-span-3 sm:p-6 xl:col-span-1">
              <div className="grid gap-6 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.8fr)] lg:items-stretch xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.8fr)]">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5">
                    <Crown className="h-4 w-4 fill-[#075cff] text-[#075cff]" />

                    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#075cff] sm:text-[11px]">
                      Women's Empowerment
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-black tracking-[-0.02em] text-[#06123a]">
                    Singa Pen Club
                  </h2>

                  <p className="mt-3 max-w-[25rem] text-sm font-semibold leading-6 text-[#52617f]">
                    Meet inspiring members who are leading change, building
                    confidence and creating meaningful impact across the college
                    community.
                  </p>

                  <Link
                    to="/members"
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-[#075cff] px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-[#0647d8]"
                  >
                    View All Members
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <MiniMember
                        key={member._id || member.name}
                        member={member}
                      />
                    ))
                  ) : (
                    <div className="col-span-full flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-[#d9e1f2] bg-[#f8fbff] p-5 text-center">
                      <div>
                        <Crown className="mx-auto h-7 w-7 text-[#7892cc]" />

                        <p className="mt-3 text-xs font-bold leading-5 text-[#52617f]">
                          Member information will appear here when available.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Government Schemes + Skills & Talent                            */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)] xl:gap-7">
            {/* Government Schemes */}

            <section className="reference-panel rounded-xl p-5 sm:p-6 lg:p-7">
              <SectionHeading
                icon={
                  <Landmark className="h-5 w-5 text-[#075cff]" />
                }
                title="Government Schemes"
                caption="Explore schemes and benefits designed for women empowerment."
                actionLabel="View All Schemes"
                actionTo="/schemes"
              />

              {visibleSchemes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {visibleSchemes.map((scheme) => (
                    <Link
                      key={scheme._id}
                      to={`/schemes/${scheme.slug}`}
                      className="reference-card group flex min-h-[205px] flex-col p-5 transition duration-200 hover:-translate-y-1 hover:border-[#b9c9ff] hover:shadow-[0_16px_32px_rgba(7,20,38,0.08)]"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff0f6] text-[#e91670]">
                        <Landmark className="h-5 w-5" />
                      </span>

                      <strong className="mt-4 block text-sm font-black leading-5 text-[#06123a]">
                        {scheme.title}
                      </strong>

                      {scheme.shortDescription ? (
                        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#52617f]">
                          {scheme.shortDescription}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-semibold leading-5 text-[#7a879e]">
                          Open this scheme to view complete information.
                        </p>
                      )}

                      <div className="mt-auto pt-4">
                        {scheme.category ? (
                          <span className="inline-flex rounded-full bg-[#fff0f6] px-2.5 py-1 text-[0.65rem] font-black text-[#e91670]">
                            {scheme.category}
                          </span>
                        ) : null}

                        <span className="mt-3 flex items-center gap-1 text-[11px] font-black text-[#075cff] opacity-80 transition-opacity group-hover:opacity-100">
                          View scheme
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#d9e1f2] bg-[#f8fbff] px-5 py-10 text-center">
                  <Landmark className="mx-auto h-8 w-8 text-[#8ba3d9]" />

                  <p className="mt-3 text-sm font-bold text-[#52617f]">
                    No featured schemes are available right now.
                  </p>

                  <Link
                    to="/schemes"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#075cff]"
                  >
                    Browse all schemes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>

            {/* Skills & Talent */}

            <section className="reference-panel rounded-xl p-5 sm:p-6 lg:p-7">
              <SectionHeading
                icon={
                  <Star className="h-5 w-5 fill-[#7c3aed] text-[#7c3aed]" />
                }
                title="Skills & Talent"
                caption="Understand, showcase and improve student skills."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {SKILL_INFORMATION.map((item) => (
                  <article
                    key={item.title}
                    className="min-h-[145px] rounded-xl border border-[#edf2fb] bg-[#f7faff] p-5 transition duration-200 hover:border-[#d9e3ff] hover:bg-[#f3f7ff]"
                  >
                    <strong className="block text-sm font-black text-[#06123a]">
                      {item.title}
                    </strong>

                    <p className="mt-2 text-xs font-semibold leading-5 text-[#52617f]">
                      {item.copy}
                    </p>
                  </article>
                ))}
              </div>

              <Link
                to="/skills"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#075cff] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#0647d8]"
              >
                Explore Skills
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Safety & Support                                                 */}
          {/* ---------------------------------------------------------------- */}

          <section className="overflow-hidden bg-[#031039] px-5 py-6 text-white sm:px-6">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(230px,0.28fr)]">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black">
                  <Shield className="h-6 w-6" />
                  Safety & Support
                </h2>

                <p className="mt-1 text-sm font-semibold text-white/70">
                  We're here for you. Access help and verified support
                  resources.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {SAFETY_CARDS.map((card) => {
                    const Icon = card.icon;

                    return (
                      <Link
                        key={card.title}
                        to={card.path}
                        className={`flex min-h-[145px] flex-col rounded-xl bg-gradient-to-br ${card.toneClass} p-5 transition duration-200 hover:-translate-y-1`}
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
                          <Icon className="h-6 w-6" />
                        </span>

                        <strong className="mt-4 block text-base font-black">
                          {card.title}
                        </strong>

                        <small className="mt-1 block font-semibold leading-5 text-white/80">
                          {card.copy}
                        </small>

                        <span className="mt-auto pt-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-black text-[#075cff]">
                            {card.action}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Emergency Contacts */}

              <aside className="border-white/15 pt-1 lg:border-l lg:pl-6">
                <h3 className="text-xl font-black">
                  Emergency Contacts
                </h3>

                <p className="mt-1 text-xs font-semibold text-white/70">
                  Important numbers at your fingertips.
                </p>

                <div className="mt-4 space-y-2">
                  {visibleEmergencyResources.map((item, index) => (
                    <div
                      key={`${item._id ?? item.name}-${item.phone}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2.5"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                          {index === 0 ? (
                            <Shield className="h-4 w-4" />
                          ) : index === 1 ? (
                            <Phone className="h-4 w-4" />
                          ) : index === 2 ? (
                            <HeartPulse className="h-4 w-4" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </span>

                        <span className="truncate text-xs font-semibold text-white/80">
                          {item.name}
                        </span>
                      </span>

                      <strong className="shrink-0 text-sm">
                        {item.phone}
                      </strong>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* How Singa Pen helps students                                    */}
          {/* ---------------------------------------------------------------- */}

          <section className="reference-panel rounded-xl p-5 sm:p-6">
            <SectionHeading
              icon={
                <HeartPulse className="h-6 w-6 text-[#0891b2]" />
              }
              title="How Singa Pen Portal Helps Students"
              caption="Real modules, practical support, and safer participation."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {HELP_CARDS.map((card) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.title}
                    to={card.path}
                    className="reference-card group flex min-h-[135px] gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(7,20,38,0.07)]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f1f5ff] text-[#075cff]">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span>
                      <strong className="block text-sm font-black text-[#06123a]">
                        {card.title}
                      </strong>

                      <small className="mt-2 block text-xs font-semibold leading-5 text-[#52617f]">
                        {card.copy}
                      </small>

                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075cff]">
                        Explore
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

/* -------------------------------------------------------------------------- */
/* Mini Member Card                                                           */
/* -------------------------------------------------------------------------- */

const MiniMember: React.FC<{ member: Member }> = ({ member }) => {
  const resolvedImage = member.profileImage
    ? resolveUploadUrl(member.profileImage)
    : '';

  const memberImage = resolvedImage || fallbackProfile;

  const memberRole =
    member.clubRole ||
    member.designation ||
    member.department ||
    'Singa Pen Member';

  return (
    <Link
      to={`/members/${member._id}`}
      className="reference-card group flex min-h-[155px] flex-col items-center justify-center p-4 text-center transition duration-200 hover:-translate-y-1 hover:border-[#b8c9ff] hover:shadow-[0_14px_28px_rgba(7,20,38,0.08)]"
    >
      <img
        src={memberImage}
        alt={member.name || 'Singa Pen member'}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackProfile;
        }}
        className="h-16 w-16 rounded-xl border border-[#e4eaff] object-cover object-center shadow-sm sm:h-[72px] sm:w-[72px]"
      />

      <strong className="mt-3 line-clamp-2 text-xs font-black leading-4 text-[#06123a]">
        {member.name || 'Member'}
      </strong>

      <small className="mt-1 line-clamp-2 text-[0.68rem] font-bold leading-4 text-[#52617f]">
        {memberRole}
      </small>

      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-[#075cff] opacity-80 transition-opacity group-hover:opacity-100">
        View Profile
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
};

export default Home;