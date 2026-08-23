import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Bookmark,
  Building2,
  ExternalLink,
  FileCheck2,
  Grid2X2,
  HeartPulse,
  HelpCircle,
  Home,
  Landmark,
  LocateFixed,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Venus,
  type LucideIcon,
} from 'lucide-react';

import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { SchemeCardSkeleton } from '../../components/common/Skeleton.js';
import {
  PortalHero,
  SectionHeading,
} from '../../components/common/ReferenceChrome.js';
import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';

type SchemeGroup = {
  value: string;
  label: string;
  categories: string[];
  icon: LucideIcon;
  tone: string;
  surface: string;
  border: string;
  text: string;
};

const schemeGroups: SchemeGroup[] = [
  {
    value: 'education',
    label: 'Education & Skill Development',
    categories: ['Scholarship', 'Education', 'Skill Development', 'Training'],
    icon: Venus,
    tone: 'from-pink-600 to-rose-500',
    surface: 'from-pink-50 via-white to-rose-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
  },
  {
    value: 'entrepreneurship',
    label: 'Employment & Entrepreneurship',
    categories: ['Entrepreneurship', 'Startup Support', 'Employment'],
    icon: Building2,
    tone: 'from-fuchsia-700 to-pink-500',
    surface: 'from-fuchsia-50 via-white to-pink-50',
    border: 'border-fuchsia-200',
    text: 'text-fuchsia-700',
  },
  {
    value: 'financial',
    label: 'Financial Inclusion & Support',
    categories: ['Financial Assistance', 'Finance'],
    icon: Banknote,
    tone: 'from-blue-700 to-sky-500',
    surface: 'from-blue-50 via-white to-sky-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  {
    value: 'health',
    label: 'Health & Wellbeing',
    categories: ['Health', 'Wellbeing'],
    icon: HeartPulse,
    tone: 'from-teal-700 to-cyan-500',
    surface: 'from-teal-50 via-white to-cyan-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
  },
  {
    value: 'safety',
    label: 'Safety & Legal Protection',
    categories: ['Safety', 'Legal', 'Protection'],
    icon: Shield,
    tone: 'from-orange-600 to-red-500',
    surface: 'from-orange-50 via-white to-red-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
  },
  {
    value: 'housing',
    label: 'Housing & Basic Amenities',
    categories: ['Housing', 'Rural Women'],
    icon: Home,
    tone: 'from-emerald-700 to-teal-500',
    surface: 'from-emerald-50 via-white to-teal-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  {
    value: 'leadership',
    label: 'Leadership & Empowerment',
    categories: ['Other', 'Leadership'],
    icon: Sparkles,
    tone: 'from-violet-700 to-indigo-500',
    surface: 'from-violet-50 via-white to-indigo-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
  },
];

/*
 * This official discovery URL already existed in the current project.
 * It opens the Tamil Nadu results on the Government of India myScheme portal.
 */
const tamilNaduSchemeDiscoveryUrl =
  'https://www.myscheme.gov.in/search?state=Tamil%20Nadu';

const FEATURED_ROTATION_MS = 10_000;
const FEATURED_COUNT = 4;

export const Schemes: React.FC = () => {
  const { user } = useAuth();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [featuredStep, setFeaturedStep] = useState(0);

  const getSchemeGroup = (category: string): SchemeGroup => {
    const normalizedCategory = String(category || '').toLowerCase();

    return (
      schemeGroups.find((group) =>
        group.categories.some(
          (item) => item.toLowerCase() === normalizedCategory,
        ),
      ) || schemeGroups[schemeGroups.length - 1]
    );
  };

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/public/schemes');

      if (response.data?.success) {
        const rows = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setSchemes(rows);
        setFiltered(rows);
      } else {
        setSchemes([]);
        setFiltered([]);
        setError('Failed to fetch government schemes catalog.');
      }

      if (user?.role === 'STUDENT') {
        const savedResponse = await api.get('/students/me/saved-schemes');

        if (savedResponse.data?.success) {
          const savedRows = Array.isArray(savedResponse.data.data)
            ? savedResponse.data.data
            : [];

          setSavedIds(
            new Set(
              savedRows
                .map((row: any) => row.scheme?.id || row.scheme?._id)
                .filter(Boolean),
            ),
          );
        }
      }
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('College database server is temporarily offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSchemes();
    // Existing page loads its catalog once. Featured rotation below reuses this data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = async (schemeId: string) => {
    const wasSaved = savedIds.has(schemeId);

    setSavedIds((current) => {
      const next = new Set(current);

      if (wasSaved) {
        next.delete(schemeId);
      } else {
        next.add(schemeId);
      }

      return next;
    });

    try {
      if (wasSaved) {
        await api.delete(`/students/me/saved-schemes/${schemeId}`);
      } else {
        await api.post(`/students/me/saved-schemes/${schemeId}`);
      }
    } catch (err) {
      setSavedIds((current) => {
        const next = new Set(current);

        if (wasSaved) {
          next.add(schemeId);
        } else {
          next.delete(schemeId);
        }

        return next;
      });

      console.error('Could not update saved scheme:', err);
    }
  };

  useEffect(() => {
    let result = [...schemes];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      result = result.filter((scheme) => {
        const title = String(scheme.title || '').toLowerCase();
        const description = String(
          scheme.shortDescription || '',
        ).toLowerCase();
        const provider = String(scheme.provider || '').toLowerCase();

        return (
          title.includes(term) ||
          description.includes(term) ||
          provider.includes(term)
        );
      });
    }

    if (selectedCategory) {
      const group = schemeGroups.find(
        (item) => item.value === selectedCategory,
      );

      if (group) {
        result = result.filter((scheme) =>
          group.categories.some(
            (category) =>
              category.toLowerCase() ===
              String(scheme.category || '').toLowerCase(),
          ),
        );
      }
    }

    if (selectedStatus) {
      result = result.filter(
        (scheme) => scheme.status === selectedStatus,
      );
    }

    setFiltered(result);
  }, [searchTerm, selectedCategory, selectedStatus, schemes]);

  /* ---------------------------------------------------------------------- */
  /* Featured scheme rotation                                                */
  /* ---------------------------------------------------------------------- */

  const featuredPool = useMemo(() => {
    const featuredRows = filtered.filter((scheme) => scheme.isFeatured);
    const regularRows = filtered.filter((scheme) => !scheme.isFeatured);

    return [...featuredRows, ...regularRows];
  }, [filtered]);

  const featured = useMemo(() => {
    if (featuredPool.length <= FEATURED_COUNT) {
      return featuredPool;
    }

    const ordered = featuredPool.map(
      (_, index) =>
        featuredPool[(featuredStep + index) % featuredPool.length],
    );

    const chosen: any[] = [];
    const usedGroups = new Set<string>();

    /*
     * Pass 1: choose from different high-level categories first.
     * This gives Featured Schemes visible category variety.
     */
    for (const scheme of ordered) {
      if (chosen.length >= FEATURED_COUNT) {
        break;
      }

      const groupKey = getSchemeGroup(scheme.category).value;

      if (!usedGroups.has(groupKey)) {
        chosen.push(scheme);
        usedGroups.add(groupKey);
      }
    }

    /* Pass 2: fill any remaining slots without duplicate schemes. */
    for (const scheme of ordered) {
      if (chosen.length >= FEATURED_COUNT) {
        break;
      }

      if (!chosen.some((item) => item._id === scheme._id)) {
        chosen.push(scheme);
      }
    }

    return chosen.slice(0, FEATURED_COUNT);
  }, [featuredPool, featuredStep]);

  useEffect(() => {
    setFeaturedStep(0);
  }, [selectedCategory, selectedStatus, searchTerm, schemes.length]);

  useEffect(() => {
    if (featuredPool.length <= FEATURED_COUNT) {
      return undefined;
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFeaturedStep(
        (current) => (current + 1) % featuredPool.length,
      );
    }, FEATURED_ROTATION_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [featuredPool.length]);

  const groupCounts = useMemo(
    () =>
      schemeGroups.map((group) => ({
        ...group,
        count: schemes.filter((scheme) =>
          group.categories.some(
            (category) =>
              category.toLowerCase() ===
              String(scheme.category || '').toLowerCase(),
          ),
        ).length,
      })),
    [schemes],
  );

  return (
    <PageWrapper>
      <div className="reference-shell">
        <PortalHero
          image={pageHeroImages.schemes}
                    mobileImage={mobilePageHeroImages.schemes}
mobileImagePosition="59% center"
          mobileImageWidth="100%"
          title="Schemes for Her."
          subtitle="Support for Every Step."
          copy="Explore government initiatives designed to empower women through education, entrepreneurship, safety, health and more."
          showText={false}
        >
          <div className="mt-5 max-w-xl">
            <label className="relative block">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7d9d]" />

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search schemes by name, keyword or ministry..."
                className="h-11 w-full rounded-md border border-white/30 bg-white px-4 pr-11 text-sm font-semibold text-[#06123a]"
              />
            </label>
          </div>
        </PortalHero>

        <main className="reference-container space-y-7 py-5 pb-10">
          {/* ---------------------------------------------------------------- */}
          {/* Browse by Category                                               */}
          {/* ---------------------------------------------------------------- */}

          <section>
            <SectionHeading
              title="Browse by Category"
              actionLabel="View All Categories"
              actionTo="/schemes"
            />

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`relative isolate flex min-h-[108px] overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                  selectedCategory === ''
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-indigo-200'
                }`}
              >
                <span className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-indigo-200/35 blur-xl" />

                <span className="relative z-10 flex w-full items-center gap-3 xl:block">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-violet-600 text-white shadow-md">
                    <Grid2X2 className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 xl:mt-3 xl:block">
                    <strong className="block text-xs font-black leading-4 text-indigo-800">
                      All Categories
                    </strong>

                    <small className="mt-1 block text-[0.68rem] font-bold text-[#657391]">
                      {schemes.length} Schemes
                    </small>
                  </span>
                </span>
              </button>

              {groupCounts.map((group) => {
                const Icon = group.icon;
                const isSelected = selectedCategory === group.value;

                return (
                  <button
                    key={group.value}
                    type="button"
                    onClick={() => setSelectedCategory(group.value)}
                    className={`relative isolate flex min-h-[108px] overflow-hidden rounded-xl border bg-gradient-to-br ${group.surface} p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-blue-500/35'
                        : ''
                    } ${group.border}`}
                  >
                    <span
                      className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${group.tone} opacity-10 blur-lg`}
                    />

                    <span className="relative z-10 flex w-full items-center gap-3 xl:block">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${group.tone} text-white shadow-md`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 xl:mt-3 xl:block">
                        <strong
                          className={`block text-xs font-black leading-4 ${group.text}`}
                        >
                          {group.label}
                        </strong>

                        <small className="mt-1 block text-[0.68rem] font-bold text-[#657391]">
                          {group.count} Schemes
                        </small>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {error ? (
            <ErrorPanel error={error} onRetry={fetchSchemes} />
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* Featured Schemes - automatically rotates every 10 seconds         */}
          {/* ---------------------------------------------------------------- */}

          <section>
            <SectionHeading
              icon={
                <Sparkles className="h-5 w-5 fill-[#4936e8] text-[#4936e8]" />
              }
              title="Featured Schemes"
              caption="Suggestions automatically refresh every 10 seconds with schemes from different categories."
              actionLabel="View All Schemes"
              actionTo="/schemes"
            />

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: FEATURED_COUNT }).map((_, index) => (
                  <SchemeCardSkeleton key={index} />
                ))}
              </div>
            ) : featured.length === 0 ? (
              <div className="reference-card py-10 text-center">
                <p className="font-black text-[#06123a]">
                  No featured schemes are available right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {featured.map((scheme) => (
                  <FeaturedSchemeCard
                    key={`${featuredStep}-${scheme._id}`}
                    scheme={scheme}
                    group={getSchemeGroup(scheme.category)}
                    saved={savedIds.has(scheme._id)}
                    canSave={user?.role === 'STUDENT'}
                    onSave={() => toggleSave(scheme._id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Eligibility / Help                                               */}
          {/* ---------------------------------------------------------------- */}

          <section className="grid gap-4 lg:grid-cols-[0.85fr_2fr]">
            <div className="rounded-xl bg-[linear-gradient(135deg,#075cff,#7c3aed_50%,#e91670)] p-6 text-white shadow-[0_14px_35px_rgba(71,54,232,0.22)]">
              <FileCheck2 className="h-16 w-16 opacity-90" />

              <h2 className="mt-3 text-xl font-black">
                Check Your Eligibility
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
                Answer a few simple questions and find schemes you may be
                eligible for.
              </p>

              <Link
                to="/schemes"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-black text-[#075cff]"
              >
                Check Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="reference-panel rounded-xl p-5">
              <h2 className="text-xl font-black text-[#06123a]">
                Need Help Understanding Schemes?
              </h2>

              <p className="mt-1 text-sm font-semibold text-[#52617f]">
                We're here to guide you at every step.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  [
                    'How to Apply',
                    'Step-by-step application guide for schemes.',
                    HelpCircle,
                    'Read Guide',
                  ],
                  [
                    'Find Nearby Help',
                    'Locate assistance centres near you.',
                    LocateFixed,
                    'Find Now',
                  ],
                  [
                    'Track Application',
                    'Check status of your applications.',
                    FileCheck2,
                    'Track Now',
                  ],
                  [
                    'Contact Support',
                    'Get help from our support team.',
                    Phone,
                    'Contact Us',
                  ],
                ].map(([title, copy, Icon, action]) => (
                  <Link
                    key={title as string}
                    to="/safety"
                    className="reference-card flex min-h-[96px] items-center gap-3 p-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f1f5ff] text-[#075cff]">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span>
                      <strong className="block text-sm font-black text-[#06123a]">
                        {title as string}
                      </strong>

                      <small className="mt-1 line-clamp-2 block text-[0.68rem] font-semibold text-[#52617f]">
                        {copy as string}
                      </small>

                      <span className="mt-1 inline-flex text-[0.68rem] font-black text-[#075cff]">
                        {action as string}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* All Schemes                                                      */}
          {/* ---------------------------------------------------------------- */}

          <section>
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#06123a]">
                  All Schemes
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#52617f]">
                  Showing {filtered.length} of {schemes.length} schemes
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  aria-label="Ministry filter"
                  className="h-10 rounded-md border border-[#dbe4f2] bg-white px-4 text-sm font-bold text-[#52617f]"
                  defaultValue="all"
                >
                  <option value="all">All Ministries</option>
                </select>

                <select
                  aria-label="State filter"
                  className="h-10 rounded-md border border-[#dbe4f2] bg-white px-4 text-sm font-bold text-[#52617f]"
                  defaultValue="all"
                >
                  <option value="all">All States</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-10 rounded-md border border-[#dbe4f2] bg-white px-4 text-sm font-bold text-[#52617f]"
                  aria-label="Scheme status filter"
                >
                  <option value="">Sort by: Latest</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="EXPIRED">Closed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SchemeCardSkeleton key={index} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="reference-card py-12 text-center">
                <p className="font-black text-[#06123a]">
                  No government schemes match these search filters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, 12).map((scheme) => {
                  const group = getSchemeGroup(scheme.category);
                  const Icon = group.icon;

                  return (
                    <article
                      key={scheme._id}
                      className={`reference-card grid gap-4 overflow-hidden border ${group.border} bg-gradient-to-r ${group.surface} p-4 md:grid-cols-[minmax(0,1.6fr)_0.55fr_0.55fr_0.5fr_auto] md:items-center`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${group.tone} text-white shadow-sm`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>

                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-[#06123a]">
                            {scheme.title}
                          </h3>

                          <span
                            className={`mt-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[0.65rem] font-black ${group.text}`}
                          >
                            {scheme.category}
                          </span>

                          <p className="mt-2 line-clamp-1 text-xs font-semibold text-[#52617f]">
                            {scheme.shortDescription}
                          </p>
                        </div>
                      </div>

                      <Fact
                        label="Eligibility"
                        value={scheme.eligibility || 'Women applicants'}
                      />

                      <Fact
                        label="Benefit"
                        value={scheme.benefit || scheme.provider}
                      />

                      <Fact
                        label="Status"
                        value={scheme.status || 'Open'}
                      />

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/schemes/${scheme.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-black text-[#075cff]"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        {user?.role === 'STUDENT' ? (
                          <button
                            type="button"
                            onClick={() => toggleSave(scheme._id)}
                            className={
                              savedIds.has(scheme._id)
                                ? 'text-[#075cff]'
                                : 'text-[#8a97b4]'
                            }
                            aria-label={
                              savedIds.has(scheme._id)
                                ? 'Remove saved scheme'
                                : 'Save scheme'
                            }
                          >
                            <Bookmark className="h-5 w-5" />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* External complete official scheme catalog                    */}
            {/* ------------------------------------------------------------ */}

            <div className="mt-6 overflow-hidden rounded-xl border border-[#c9d9ff] bg-[linear-gradient(135deg,#f7faff,#eef3ff_55%,#fff1f7)] p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#075cff] via-[#7c3aed] to-[#e91670] text-white shadow-md">
                    <Landmark className="h-6 w-6" />
                  </span>

                  <div>
                    <h3 className="text-base font-black text-[#06123a] sm:text-lg">
                      Looking for more government schemes?
                    </h3>

                    <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[#52617f] sm:text-sm">
                      Open the official Government of India myScheme portal to
                      explore the complete Tamil Nadu scheme catalog and check
                      current official information.
                    </p>
                  </div>
                </div>

                <a
                  href={tamilNaduSchemeDiscoveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#075cff] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(7,92,255,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0648d9]"
                >
                  Check Out All Schemes
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

const ErrorPanel: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="reference-card flex items-center justify-between gap-3 p-4 text-sm font-bold text-[#b91c1c]">
    <span>{error}</span>

    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-2 rounded-md bg-[#e91670] px-3 py-2 text-xs font-black text-white"
    >
      <RefreshCw className="h-4 w-4" />
      Retry
    </button>
  </div>
);

const FeaturedSchemeCard: React.FC<{
  scheme: any;
  group: SchemeGroup;
  saved: boolean;
  canSave: boolean;
  onSave: () => void;
}> = ({ scheme, group, saved, canSave, onSave }) => {
  const Icon = group.icon;

  return (
    <article
      className={`reference-card flex min-h-[190px] flex-col justify-between overflow-hidden border ${group.border} bg-gradient-to-br ${group.surface} p-5 transition duration-500 hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${group.tone} text-white shadow-md`}
        >
          <Icon className="h-6 w-6" />
        </span>

        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-black leading-5 text-[#06123a]">
            {scheme.title}
          </h3>

          <span
            className={`mt-2 inline-flex rounded-full bg-white/85 px-2 py-0.5 text-[0.65rem] font-black ${group.text}`}
          >
            {scheme.category}
          </span>

          <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-[#52617f]">
            {scheme.shortDescription}
          </p>

          <p className="mt-2 line-clamp-1 text-[0.7rem] font-bold text-[#657391]">
            {scheme.provider}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <Link
          to={`/schemes/${scheme.slug}`}
          className="inline-flex items-center gap-1 text-sm font-black text-[#075cff]"
        >
          View Details
          <ArrowRight className="h-4 w-4" />
        </Link>

        {canSave ? (
          <button
            type="button"
            onClick={onSave}
            className={saved ? 'text-[#075cff]' : 'text-[#8a97b4]'}
            aria-label={saved ? 'Remove saved scheme' : 'Save scheme'}
          >
            <Bookmark className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </article>
  );
};

const Fact: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="border-l border-[#edf2fb] pl-4">
    <strong className="block text-[0.68rem] font-black text-[#06123a]">
      {label}
    </strong>

    <span className="mt-1 line-clamp-1 block text-[0.72rem] font-semibold text-[#52617f]">
      {value}
    </span>
  </div>
);

export default Schemes;
