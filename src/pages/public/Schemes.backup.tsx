import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Bookmark,
  Building2,
  FileCheck2,
  Grid2X2,
  HeartPulse,
  HelpCircle,
  Home,
  Landmark,
  ExternalLink,
  LocateFixed,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Venus,
} from 'lucide-react';
import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { SchemeCardSkeleton } from '../../components/common/Skeleton.js';
import { PortalHero, SectionHeading } from '../../components/common/ReferenceChrome.js';
import { pageHeroImages } from '../../utils/pageHeroImages.js';

const schemeGroups = [
  { value: 'education', label: 'Education & Skill Development', categories: ['Scholarship', 'Education', 'Skill Development', 'Training'], icon: Venus, tone: 'from-pink-600 to-rose-500' },
  { value: 'entrepreneurship', label: 'Employment & Entrepreneurship', categories: ['Entrepreneurship', 'Startup Support', 'Employment'], icon: Building2, tone: 'from-[#b4235a] to-[#e14b6f]' },
  { value: 'financial', label: 'Financial Inclusion & Support', categories: ['Financial Assistance', 'Finance'], icon: Banknote, tone: 'from-blue-600 to-blue-500' },
  { value: 'health', label: 'Health & Wellbeing', categories: ['Health', 'Wellbeing'], icon: HeartPulse, tone: 'from-teal-600 to-cyan-500' },
  { value: 'safety', label: 'Safety & Legal Protection', categories: ['Safety', 'Legal', 'Protection'], icon: Shield, tone: 'from-orange-500 to-red-500' },
  { value: 'housing', label: 'Housing & Basic Amenities', categories: ['Housing', 'Rural Women'], icon: Home, tone: 'from-[#2f6f73] to-[#47a09b]' },
  { value: 'leadership', label: 'Leadership & Empowerment', categories: ['Other', 'Leadership'], icon: Sparkles, tone: 'from-blue-600 to-cyan-500' },
];

const tamilNaduSchemeDiscoveryUrl = 'https://www.myscheme.gov.in/search?state=Tamil%20Nadu';

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
  const [featuredOffset, setFeaturedOffset] = useState(0);

  const getSchemeGroup = (category: string) => (
    schemeGroups.find((group) => group.categories.some((item) => item.toLowerCase() === String(category).toLowerCase())) || schemeGroups[schemeGroups.length - 1]
  );

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/public/schemes');
      if (res.data.success) {
        setSchemes(res.data.data);
        setFiltered(res.data.data);
      } else {
        setError('Failed to fetch government schemes catalog.');
      }
      if (user?.role === 'STUDENT') {
        const savedRes = await api.get('/students/me/saved-schemes');
        if (savedRes.data.success) setSavedIds(new Set(savedRes.data.data.map((row: any) => row.scheme.id || row.scheme._id)));
      }
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('College database server is temporarily offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []);

  const toggleSave = async (schemeId: string) => {
    const wasSaved = savedIds.has(schemeId);
    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(schemeId);
      else next.add(schemeId);
      return next;
    });
    try {
      if (wasSaved) await api.delete(`/students/me/saved-schemes/${schemeId}`);
      else await api.post(`/students/me/saved-schemes/${schemeId}`);
    } catch (err) {
      setSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(schemeId);
        else next.delete(schemeId);
        return next;
      });
      console.error('Could not update saved scheme:', err);
    }
  };

  useEffect(() => {
    let result = [...schemes];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((scheme) =>
        scheme.title.toLowerCase().includes(term) ||
        scheme.shortDescription.toLowerCase().includes(term) ||
        scheme.provider.toLowerCase().includes(term)
      );
    }
    if (selectedCategory) {
      const group = schemeGroups.find((item) => item.value === selectedCategory);
      if (group) result = result.filter((scheme) => group.categories.some((category) => category.toLowerCase() === String(scheme.category).toLowerCase()));
    }
    if (selectedStatus) result = result.filter((scheme) => scheme.status === selectedStatus);
    setFiltered(result);
  }, [searchTerm, selectedCategory, selectedStatus, schemes]);

  const featuredPool = useMemo(() => filtered.filter((scheme) => scheme.isFeatured).concat(filtered.filter((scheme) => !scheme.isFeatured)), [filtered]);
  const featured = useMemo(() => {
    if (featuredPool.length <= 4) return featuredPool;
    const ordered = featuredPool.map((_, index) => featuredPool[(featuredOffset + index) % featuredPool.length]);
    const categories = new Set<string>();
    const chosen: any[] = [];
    ordered.forEach((scheme) => {
      const category = String(scheme.category || '');
      if (chosen.length < 4 && !categories.has(category)) {
        chosen.push(scheme);
        categories.add(category);
      }
    });
    ordered.forEach((scheme) => {
      if (chosen.length < 4 && !chosen.some((item) => item._id === scheme._id)) chosen.push(scheme);
    });
    return chosen.slice(0, 4);
  }, [featuredOffset, featuredPool]);
  const groupCounts = useMemo(() => schemeGroups.map((group) => ({
    ...group,
    count: schemes.filter((scheme) => group.categories.some((category) => category.toLowerCase() === String(scheme.category).toLowerCase())).length,
  })), [schemes]);

  useEffect(() => {
    setFeaturedOffset(0);
  }, [selectedCategory, selectedStatus, searchTerm, schemes.length]);

  useEffect(() => {
    if (featuredPool.length <= 4) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setFeaturedOffset((offset) => (offset + 1) % featuredPool.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [featuredPool.length]);

  return (
    <PageWrapper>
      <div className="reference-shell">
        <PortalHero
          image={pageHeroImages.schemes}
          title="Schemes for Her."
          subtitle="Support for Every Step."
          copy="Explore government initiatives designed to empower women through education, entrepreneurship, safety, health and more."
          showText={false}
        >
          <div className="mt-5 max-w-xl">
            <label className="relative">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7d9d]" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search schemes by name, keyword or ministry..." className="h-11 w-full rounded-md border border-white/30 bg-white px-4 pr-11 text-sm font-semibold text-[#06123a]" />
            </label>
          </div>
        </PortalHero>

        <main className="reference-container space-y-6 py-5">
          <section>
            <SectionHeading title="Browse by Category" actionLabel="View All Categories" actionTo="/schemes" />
            <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
              <button type="button" onClick={() => setSelectedCategory('')} className={`reference-card flex min-h-[76px] items-center gap-3 p-3 text-left ${selectedCategory === '' ? 'ring-2 ring-blue-500' : ''}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white"><Grid2X2 className="h-6 w-6" /></span>
                <span><strong className="block text-xs font-black text-[#06123a]">All Categories</strong><small className="mt-1 block text-[0.68rem] font-bold text-[#657391]">{schemes.length} Schemes</small></span>
              </button>
              {groupCounts.map((group) => {
                const Icon = group.icon;
                return (
                  <button key={group.value} type="button" onClick={() => setSelectedCategory(group.value)} className={`reference-card flex min-h-[76px] items-center gap-3 p-3 text-left ${selectedCategory === group.value ? 'ring-2 ring-blue-500' : ''}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${group.tone} text-white`}><Icon className="h-6 w-6" /></span>
                    <span><strong className="block text-xs font-black text-[#06123a]">{group.label}</strong><small className="mt-1 block text-[0.68rem] font-bold text-[#657391]">{group.count} Schemes</small></span>
                  </button>
                );
              })}
            </div>
          </section>

          {error && <ErrorPanel error={error} onRetry={fetchSchemes} />}

          <section>
            <SectionHeading icon={<Sparkles className="h-5 w-5 fill-[#4936e8] text-[#4936e8]" />} title="Featured Schemes" caption="Handpicked schemes making a real impact" actionLabel="View All Schemes" actionTo="/schemes" />
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, n) => <SchemeCardSkeleton key={n} />)}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {featured.map((scheme) => <FeaturedSchemeCard key={scheme._id} scheme={scheme} saved={savedIds.has(scheme._id)} canSave={user?.role === 'STUDENT'} onSave={() => toggleSave(scheme._id)} />)}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.85fr_2fr]">
            <div className="rounded-lg bg-[linear-gradient(135deg,#075cff,#7c3aed_50%,#e91670)] p-6 text-white shadow-[0_14px_35px_rgba(71,54,232,0.22)]">
              <FileCheck2 className="h-16 w-16 opacity-90" />
              <h2 className="mt-3 text-xl font-black">Check Your Eligibility</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/82">Answer a few simple questions and find schemes you may be eligible for.</p>
              <Link to="/schemes" className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-black text-[#075cff]">Check Now <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="reference-panel rounded-lg p-5">
              <h2 className="text-xl font-black text-[#06123a]">Need Help Understanding Schemes?</h2>
              <p className="mt-1 text-sm font-semibold text-[#52617f]">We're here to guide you at every step.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  ['How to Apply', 'Step-by-step application guide for schemes.', HelpCircle, 'Read Guide'],
                  ['Find Nearby Help', 'Locate assistance centres near you.', LocateFixed, 'Find Now'],
                  ['Track Application', 'Check status of your applications.', FileCheck2, 'Track Now'],
                  ['Contact Support', 'Get help from our support team.', Phone, 'Contact Us'],
                ].map(([title, copy, Icon, action]) => (
                  <Link key={title as string} to="/safety" className="reference-card flex min-h-[86px] items-center gap-3 p-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f1f5ff] text-[#075cff]"><Icon className="h-5 w-5" /></span>
                    <span><strong className="block text-sm font-black text-[#06123a]">{title as string}</strong><small className="mt-1 line-clamp-2 block text-[0.68rem] font-semibold text-[#52617f]">{copy as string}</small><span className="mt-1 inline-flex text-[0.68rem] font-black text-[#075cff]">{action as string} <ArrowRight className="ml-1 h-3 w-3" /></span></span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#06123a]">All Schemes</h2>
                <p className="mt-1 text-sm font-semibold text-[#52617f]">Showing {filtered.length} of {schemes.length} schemes</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select className="h-10 rounded-md border border-[#dbe4f2] bg-white px-4 text-sm font-bold text-[#52617f]"><option>All Ministries</option></select>
                <select className="h-10 rounded-md border border-[#dbe4f2] bg-white px-4 text-sm font-bold text-[#52617f]"><option>All States</option></select>
                <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="h-10 rounded-md border border-[#dbe4f2] bg-white px-4 text-sm font-bold text-[#52617f]">
                  <option value="">Sort by: Latest</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="EXPIRED">Closed</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="grid gap-3">{Array.from({ length: 4 }).map((_, n) => <SchemeCardSkeleton key={n} />)}</div>
            ) : filtered.length === 0 ? (
              <div className="reference-card py-12 text-center"><p className="font-black text-[#06123a]">No government schemes match these search filters</p></div>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, 12).map((scheme) => (
                  <article key={scheme._id} className="reference-card grid gap-4 p-4 md:grid-cols-[minmax(0,1.6fr)_0.55fr_0.55fr_0.5fr_auto] md:items-center">
                    <div className="flex items-center gap-4">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${getSchemeGroup(scheme.category).tone} text-white`}><Venus className="h-6 w-6" /></span>
                      <div><h3 className="text-sm font-black text-[#06123a]">{scheme.title}</h3><span className="mt-1 inline-flex rounded-full bg-[#eaffff] px-2 py-0.5 text-[0.65rem] font-black text-[#00879a]">{scheme.category}</span><p className="mt-2 line-clamp-1 text-xs font-semibold text-[#52617f]">{scheme.shortDescription}</p></div>
                    </div>
                    <Fact label="Eligibility" value={scheme.eligibility || 'Women applicants'} />
                    <Fact label="Benefit" value={scheme.benefit || scheme.provider} />
                    <Fact label="Status" value={scheme.status || 'Open'} />
                    <div className="flex items-center gap-3">
                      <Link to={`/schemes/${scheme.slug}`} className="inline-flex items-center gap-2 text-sm font-black text-[#075cff]">View Details <ArrowRight className="h-4 w-4" /></Link>
                      {user?.role === 'STUDENT' && <button type="button" onClick={() => toggleSave(scheme._id)} className={savedIds.has(scheme._id) ? 'text-[#075cff]' : 'text-[#8a97b4]'} aria-label="Save scheme"><Bookmark className="h-5 w-5" /></button>}
                    </div>
                  </article>
                ))}
                <div className="flex justify-center pt-2">
                  <a href={tamilNaduSchemeDiscoveryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-[#075cff] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(7,92,255,0.18)]">
                    Check Out All Schemes <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

const ErrorPanel: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="reference-card flex items-center justify-between gap-3 p-4 text-sm font-bold text-[#b91c1c]">
    <span>{error}</span>
    <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-md bg-[#e91670] px-3 py-2 text-xs font-black text-white"><RefreshCw className="h-4 w-4" /> Retry</button>
  </div>
);

const FeaturedSchemeCard: React.FC<{ scheme: any; saved: boolean; canSave: boolean; onSave: () => void }> = ({ scheme, saved, canSave, onSave }) => (
  <article className="reference-card flex min-h-[168px] flex-col justify-between p-5">
    <div className="flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff1f7] text-[#e91670]"><Landmark className="h-7 w-7" /></span>
      <div className="min-w-0"><h3 className="line-clamp-1 text-sm font-black text-[#06123a]">{scheme.title}</h3><span className="mt-2 inline-flex rounded-full bg-[#fff0f6] px-2 py-0.5 text-[0.65rem] font-black text-[#e91670]">{scheme.category}</span><p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-[#52617f]">{scheme.shortDescription}</p><p className="mt-2 text-[0.7rem] font-bold text-[#657391]">{scheme.provider}</p></div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-[#edf2fb] pt-3">
      <Link to={`/schemes/${scheme.slug}`} className="inline-flex items-center gap-1 text-sm font-black text-[#075cff]">View Details <ArrowRight className="h-4 w-4" /></Link>
      {canSave && <button type="button" onClick={onSave} className={saved ? 'text-[#075cff]' : 'text-[#8a97b4]'} aria-label="Save scheme"><Bookmark className="h-5 w-5" /></button>}
    </div>
  </article>
);

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border-l border-[#edf2fb] pl-4">
    <strong className="block text-[0.68rem] font-black text-[#06123a]">{label}</strong>
    <span className="mt-1 line-clamp-1 block text-[0.72rem] font-semibold text-[#52617f]">{value}</span>
  </div>
);
