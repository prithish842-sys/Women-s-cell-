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
} from 'lucide-react';

import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import {
  PortalHero,
  SectionHeading,
} from '../../components/common/ReferenceChrome.js';
import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';

import {
  getMemberPhoto,
  memberFallbackPhoto,
} from '../../utils/memberDirectory.js';
import { SchemeCardSkeleton, Skeleton } from '../../components/common/Skeleton.js';
import { ProgressiveImage } from '../../components/common/ProgressiveImage.js';

export const Home: React.FC = () => {
  const [featuredSchemes, setFeaturedSchemes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [emergencyResources, setEmergencyResources] = useState<any[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSchemes = api
      .get('/public/schemes')
      .then((response) => {
        if (!active || !response.data?.success) return;

        const schemeData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setFeaturedSchemes(schemeData.slice(0, 4));
      })
      .catch((error) => {
        console.error('Unable to load home page schemes:', error);
      })
      .finally(() => {
        if (active) setSchemesLoading(false);
      });

    const loadMembers = api
      .get('/public/members')
      .then((response) => {
        if (!active || !response.data?.success) return;

        const memberData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setMembers(memberData.slice(0, 3));
      })
      .catch((error) => {
        console.error('Unable to load home page members:', error);
      })
      .finally(() => {
        if (active) setMembersLoading(false);
      });

    const loadEmergencyResources = api
      .get('/safety/resources')
      .then((response) => {
        if (!active || !response.data?.success) return;

        const emergencyData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setEmergencyResources(emergencyData.slice(0, 5));
      })
      .catch((error) => {
        console.error('Unable to load home page safety resources:', error);
      })
      .finally(() => {
        if (active) setResourcesLoading(false);
      });

    void Promise.allSettled([
      loadSchemes,
      loadMembers,
      loadEmergencyResources,
    ]);

    return () => {
      active = false;
    };
  }, []);

  const emergencyContacts =
    emergencyResources.length > 0
      ? emergencyResources
      : [
          { name: 'Police', phone: '100' },
          { name: 'Fire', phone: '101' },
          { name: 'Ambulance', phone: '102' },
          { name: 'Women Helpline', phone: '181' },
          { name: 'Child Helpline', phone: '1098' },
        ];

  return (
    <PageWrapper>
      <div className="reference-shell">
        {/* ================================================================ */}
        {/* HERO                                                             */}
        {/* ================================================================ */}

        <PortalHero
          image={pageHeroImages.home}
                    mobileImage={mobilePageHeroImages.home}
mobileImagePosition="54% center"
          mobileImageWidth="100%"
          title="Power. Safety."
          subtitle="Wellbeing."
          copy="Singa Pen Portal is your all-in-one digital platform for opportunities, skills, safety and wellbeing."
          showText={false}
        >
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 rounded-md bg-[#075cff] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0648d9]"
            >
              Explore Platform
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-md bg-[#e91670] px-6 py-3 text-sm font-black text-white transition hover:bg-[#c71260]"
            >
              Join Singa Pen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PortalHero>

        <main className="reference-container -mt-3 space-y-8 pb-10">
          {/* ================================================================ */}
          {/* MAIN FEATURE CARDS + SINGA PEN                                  */}
          {/* ================================================================ */}

          <section className="relative z-10 grid gap-4 md:grid-cols-3 xl:grid-cols-[0.8fr_0.8fr_0.8fr_2.4fr] xl:gap-5">
            {[
              {
                title: 'Opportunities',
                copy:
                  'Discover scholarships, jobs, internships and grants curated for you.',
                Icon: Landmark,
                path: '/schemes',
                color: 'text-[#075cff]',
              },
              {
                title: 'Skills',
                copy:
                  'Learn, upskill and grow with courses, workshops and certifications.',
                Icon: Award,
                path: '/skills',
                color: 'text-[#7c3aed]',
              },
              {
                title: 'Safety',
                copy:
                  'Access safety tools, helplines and support whenever you need.',
                Icon: Shield,
                path: '/safety',
                color: 'text-[#e91670]',
              },
            ].map(({ title, copy, Icon, path, color }) => (
              <Link
                key={title}
                to={path}
                className="reference-card flex min-h-[170px] flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full bg-[#f1f5ff] ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <h2 className={`mt-4 text-lg font-black ${color}`}>
                  {title}
                </h2>

                <p className="mt-2 text-xs font-semibold leading-5 text-[#52617f]">
                  {copy}
                </p>

                <ArrowRight className={`mt-auto h-4 w-4 pt-5 box-content ${color}`} />
              </Link>
            ))}

            {/* ============================================================ */}
            {/* SINGA PEN CLUB                                              */}
            {/* ============================================================ */}

            <section className="reference-panel overflow-hidden rounded-xl p-5 md:col-span-3 sm:p-6 xl:col-span-1">
              <div className="grid gap-6 lg:grid-cols-[minmax(210px,0.8fr)_minmax(0,1.8fr)] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5">
                    <Crown className="h-4 w-4 fill-[#075cff] text-[#075cff]" />

                    <span className="text-[10px] font-black uppercase tracking-wide text-[#075cff] sm:text-[11px]">
                      Women's Empowerment
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-black text-[#06123a]">
                    Singa Pen Club
                  </h2>

                  <p className="mt-3 max-w-[24rem] text-sm font-semibold leading-6 text-[#52617f]">
                    Meet members supporting student confidence, participation
                    and meaningful Women Empowerment Cell initiatives at
                    Sankara College of Science and Commerce.
                  </p>

                  <Link
                    to="/members"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#075cff] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#0648d9]"
                  >
                    View All Members
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {membersLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <MiniMemberSkeleton key={index} />
                    ))
                  ) : members.length > 0 ? (
                    members.map((member) => (
                      <MiniMember
                        key={member._id}
                        member={member}
                      />
                    ))
                  ) : (
                    <div className="col-span-full rounded-xl border border-dashed border-[#dbe4f4] bg-[#f8fbff] p-6 text-center">
                      <Crown className="mx-auto h-7 w-7 text-[#7e96ca]" />

                      <p className="mt-3 text-xs font-bold text-[#52617f]">
                        Member information is currently unavailable.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </section>

          {/* ================================================================ */}
          {/* GOVERNMENT SCHEMES + SKILLS                                    */}
          {/* ================================================================ */}

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)] xl:gap-7">
            {/* ============================================================ */}
            {/* GOVERNMENT SCHEMES                                          */}
            {/* ============================================================ */}

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

              {schemesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SchemeCardSkeleton key={index} />
                  ))}
                </div>
              ) : featuredSchemes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {featuredSchemes.map((scheme) => (
                    <Link
                      key={scheme._id}
                      to={`/schemes/${scheme.slug}`}
                      className="reference-card group flex min-h-[205px] flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff0f6] text-[#e91670]">
                        <Landmark className="h-5 w-5" />
                      </span>

                      <strong className="mt-4 block text-sm font-black leading-5 text-[#06123a]">
                        {scheme.title}
                      </strong>

                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#52617f]">
                        {scheme.shortDescription ||
                          'Open this scheme to view complete information.'}
                      </p>

                      <div className="mt-auto pt-4">
                        {scheme.category ? (
                          <span className="inline-flex rounded-full bg-[#fff0f6] px-2.5 py-1 text-[0.65rem] font-black text-[#e91670]">
                            {scheme.category}
                          </span>
                        ) : null}

                        <span className="mt-3 flex items-center gap-1 text-[11px] font-black text-[#075cff]">
                          View Scheme
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#dbe4f4] bg-[#f8fbff] px-5 py-10 text-center">
                  <Landmark className="mx-auto h-8 w-8 text-[#8ca3d7]" />

                  <p className="mt-3 text-sm font-bold text-[#52617f]">
                    No schemes are available right now.
                  </p>

                  <Link
                    to="/schemes"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#075cff]"
                  >
                    Browse All Schemes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>

            {/* ============================================================ */}
            {/* SKILLS & TALENT                                             */}
            {/* ============================================================ */}

            <section className="reference-panel rounded-xl p-5 sm:p-6 lg:p-7">
              <SectionHeading
                icon={
                  <Star className="h-5 w-5 fill-[#7c3aed] text-[#7c3aed]" />
                }
                title="Skills & Talent"
                caption="Understand, showcase and improve student skills."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {[
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
                ].map(({ title, copy }) => (
                  <article
                    key={title}
                    className="min-h-[145px] rounded-xl border border-[#edf2fb] bg-[#f7faff] p-5 transition hover:border-[#d9e3ff] hover:bg-[#f3f7ff]"
                  >
                    <strong className="block text-sm font-black text-[#06123a]">
                      {title}
                    </strong>

                    <p className="mt-2 text-xs font-semibold leading-5 text-[#52617f]">
                      {copy}
                    </p>
                  </article>
                ))}
              </div>

              <Link
                to="/skills"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#075cff] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0648d9]"
              >
                Explore Skills
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </div>

          {/* ================================================================ */}
          {/* SAFETY & SUPPORT                                               */}
          {/* ================================================================ */}

          <section className="overflow-hidden rounded-xl bg-[#031039] px-5 py-6 text-white sm:px-6">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(235px,0.28fr)]">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black">
                  <Shield className="h-6 w-6" />
                  Safety & Support
                </h2>

                <p className="mt-1 text-sm font-semibold text-white/70">
                  We're here for you. Access help and support resources.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      title: 'Emergency SOS',
                      copy:
                        'Need immediate help? Access emergency assistance quickly.',
                      Icon: Phone,
                      action: 'View Help',
                      path: '/safety/emergency',
                      tone: 'from-[#ff245d] to-[#ef0f5f]',
                    },
                    {
                      title: 'Women Helpline',
                      copy:
                        'Access verified women support and helpline information.',
                      Icon: Shield,
                      action: 'View Helplines',
                      path: '/safety/emergency',
                      tone: 'from-[#0647b8] to-[#075cff]',
                    },
                    {
                      title: 'Support',
                      copy:
                        'Find confidential support and wellbeing resources.',
                      Icon: MessageCircle,
                      action: 'Get Support',
                      path: '/safety',
                      tone: 'from-[#5b1bc9] to-[#7c3aed]',
                    },
                    {
                      title: 'Safety Resources',
                      copy:
                        'Find safety information and important support resources.',
                      Icon: MapPin,
                      action: 'Explore',
                      path: '/safety',
                      tone: 'from-[#087b8b] to-[#0891b2]',
                    },
                  ].map(
                    ({
                      title,
                      copy,
                      Icon,
                      action,
                      path,
                      tone,
                    }) => (
                      <Link
                        key={title}
                        to={path}
                        className={`flex min-h-[145px] flex-col rounded-xl bg-gradient-to-br ${tone} p-5 transition duration-200 hover:-translate-y-1`}
                      >
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
                          <Icon className="h-6 w-6" />
                        </span>

                        <strong className="mt-4 block text-base font-black">
                          {title}
                        </strong>

                        <small className="mt-1 block font-semibold leading-5 text-white/80">
                          {copy}
                        </small>

                        <span className="mt-auto pt-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-black text-[#075cff]">
                            {action}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </div>

              {/* Emergency Contacts */}

              <aside className="pt-1 lg:border-l lg:border-white/15 lg:pl-6">
                <h3 className="text-xl font-black">
                  Emergency Contacts
                </h3>

                <p className="mt-1 text-xs font-semibold text-white/70">
                  Important numbers at your fingertips.
                </p>

                <div className="mt-4 space-y-2">
                  {resourcesLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="rounded-lg bg-white/10 px-3 py-2.5">
                        <Skeleton className="h-8 w-full bg-white/20" />
                      </div>
                    ))
                  ) : emergencyContacts.slice(0, 5).map((item, index) => (
                    <div
                      key={`${item.name}-${item.phone}`}
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

          {/* ================================================================ */}
          {/* HOW SINGA PEN HELPS STUDENTS                                   */}
          {/* ================================================================ */}

          <section className="reference-panel rounded-xl p-5 sm:p-6">
            <SectionHeading
              icon={
                <HeartPulse className="h-6 w-6 text-[#0891b2]" />
              }
              title="How Singa Pen Portal Helps Students"
              caption="Real modules, practical support, and safer participation."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: 'Government Schemes',
                  copy:
                    'Find relevant schemes, scholarships and support opportunities from one place.',
                  Icon: Landmark,
                  path: '/schemes',
                },
                {
                  title: 'Skills',
                  copy:
                    'Showcase abilities, identify areas to improve and become discoverable for suitable opportunities.',
                  Icon: Award,
                  path: '/skills',
                },
                {
                  title: 'Singa Pen Club',
                  copy:
                    'Participate in the Women Empowerment Cell community and take leadership roles.',
                  Icon: Crown,
                  path: '/members',
                },
                {
                  title: 'Safety & Support',
                  copy:
                    'Access verified safety information, helplines and support routes when help is needed.',
                  Icon: Shield,
                  path: '/safety',
                },
                {
                  title: 'Workshops & Activities',
                  copy:
                    'Follow learning, awareness and community activities supported through the portal.',
                  Icon: Star,
                  path: '/student/workshops',
                },
                {
                  title: 'Wellbeing',
                  copy:
                    'Use wellbeing support as one part of the broader student care ecosystem after signing in.',
                  Icon: HeartPulse,
                  path: '/student/wellbeing',
                },
              ].map(({ title, copy, Icon, path }) => (
                <Link
                  key={title}
                  to={path}
                  className="reference-card flex min-h-[130px] gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f1f5ff] text-[#075cff]">
                    <Icon className="h-5 w-5" />
                  </span>

                  <span>
                    <strong className="block text-sm font-black text-[#06123a]">
                      {title}
                    </strong>

                    <small className="mt-2 block text-xs font-semibold leading-5 text-[#52617f]">
                      {copy}
                    </small>

                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075cff]">
                      Explore
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

/* ========================================================================== */
/* MINI MEMBER                                                               */
/* ========================================================================== */

const MiniMember: React.FC<{ member: any }> = ({ member }) => {
  const imageUrl = getMemberPhoto(member);

  const role =
    member?.clubRole ||
    member?.designation ||
    member?.department ||
    'Singa Pen Member';

  return (
    <Link
      to={`/members/${member._id}`}
      className="reference-card group flex min-h-[155px] flex-col items-center justify-center p-4 text-center transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <ProgressiveImage
        src={imageUrl}
        fallbackSrc={memberFallbackPhoto}
        resolveSrc={false}
        alt={member?.name || 'Singa Pen member'}
        width={72}
        height={72}
        loading="lazy"
        decoding="async"
        wrapperClassName="h-16 w-16 rounded-xl border border-[#e4eaff] shadow-sm sm:h-[72px] sm:w-[72px]"
        imageClassName="h-full w-full object-cover object-center"
      />

      <strong className="mt-3 line-clamp-2 text-xs font-black leading-4 text-[#06123a]">
        {member?.name || 'Member'}
      </strong>

      <small className="mt-1 line-clamp-2 text-[0.68rem] font-bold leading-4 text-[#52617f]">
        {role}
      </small>

      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-[#075cff]">
        View Profile
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
};

const MiniMemberSkeleton: React.FC = () => (
  <div className="reference-card flex min-h-[155px] flex-col items-center justify-center p-4 text-center" aria-hidden="true">
    <Skeleton className="h-16 w-16 rounded-xl bg-rose-100 sm:h-[72px] sm:w-[72px]" />
    <Skeleton className="mt-3 h-4 w-24" />
    <Skeleton className="mt-2 h-3 w-20" />
    <Skeleton className="mt-4 h-3 w-16" />
  </div>
);

export default Home;
