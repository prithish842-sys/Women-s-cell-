import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  Layers3,
  MapPin,
  Megaphone,
  Pencil,
  RefreshCw,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { SkillCardSkeleton } from '../../components/common/Skeleton.js';
import { PortalHero, SectionHeading } from '../../components/common/ReferenceChrome.js';
import { pageHeroImages } from '../../utils/pageHeroImages.js';
import fallbackProfile from '../../assets/images/placeholders/default-profile.webp';

interface DirectorySkill {
  _id: string;
  skillName: string;
  category: string;
  skillLevel: string;
  description?: string;
  tools: string[];
  isPrimary: boolean;
}

interface DirectoryProfile {
  _id: string;
  name: string;
  department: string;
  course: string;
  profileImage?: string;
  bio?: string;
  academicStatus: string;
  currentStudyYear?: number | string;
  entrepreneurship?: {
    interestedInEntrepreneurship: boolean;
    preferredIndustry?: string;
    futurePlan?: string;
  };
  skills: DirectorySkill[];
}

const departments = ['ALL', 'Computer Science', 'Commerce', 'English', 'Mathematics', 'Fashion Design', 'Business Administration'];
const levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const categoryRail = [
  { label: 'All Skills', value: 'ALL', icon: Layers3, tone: 'from-blue-600 to-blue-500' },
  { label: 'Design', value: 'Creative', icon: Megaphone, tone: 'from-[#b4235a] to-[#e14b6f]' },
  { label: 'Marketing', value: 'Entrepreneurial', icon: Megaphone, tone: 'from-pink-600 to-rose-500' },
  { label: 'Writing', value: 'Fine Arts', icon: Pencil, tone: 'from-pink-600 to-fuchsia-500' },
  { label: 'Development', value: 'Technical', icon: Code2, tone: 'from-blue-600 to-cyan-500' },
  { label: 'Business', value: 'Vocational', icon: BriefcaseBusiness, tone: 'from-teal-600 to-cyan-500' },
  { label: 'Education', value: 'Other', icon: GraduationCap, tone: 'from-rose-600 to-pink-500' },
  { label: 'Health & Wellness', value: 'ALL', icon: HeartPulse, tone: 'from-teal-600 to-emerald-500' },
  { label: 'Finance', value: 'ALL', icon: IndianRupee, tone: 'from-teal-600 to-cyan-500' },
];

export const SkillsDirectory: React.FC = () => {
  const [department, setDepartment] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [skillLevel, setSkillLevel] = useState('ALL');
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfiles = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/public/skills', {
        signal,
        params: {
          department: department === 'ALL' ? undefined : department,
          category: category === 'ALL' ? undefined : category,
          skillLevel: skillLevel === 'ALL' ? undefined : skillLevel,
          limit: 24,
        },
      });
      setProfiles(res.data.data || []);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') return;
      setError('Could not load the student skills directory right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => fetchProfiles(controller.signal), 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [department, category, skillLevel]);

  useEffect(() => {
    api.get('/public/statistics')
      .then((res) => { if (res.data.success) setStats(res.data.data); })
      .catch((err) => console.error('Could not load public skill statistics:', err));
  }, []);

  const allSkills = useMemo(() => profiles.flatMap((profile) => profile.skills), [profiles]);
  const visibleProfiles = profiles.slice(0, 5);
  const opportunityProfiles = profiles.filter((profile) => profile.entrepreneurship?.interestedInEntrepreneurship).slice(0, 3);

  return (
    <PageWrapper>
      <div className="reference-shell">
        <PortalHero
          image={pageHeroImages.skills}
          title="Learn. Grow. Lead."
          subtitle="Share Your Skills."
          copy="Discover talented women with skills across diverse fields. Connect, collaborate and create opportunities together."
          showText={false}
        >
          <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [String(stats.singaPenMembers ?? stats.activeStudents ?? profiles.length), 'Public Members', Users],
              [String(stats.totalSkills ?? allSkills.length), 'Skills Recorded', Sparkles],
              [String(stats.departmentCount ?? departments.length - 1), 'Departments', Award],
              [String(profiles.length), 'Visible Profiles', BriefcaseBusiness],
            ].map(([value, label, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 border-r border-white/18 last:border-r-0">
                <Icon className="h-6 w-6 text-cyan-300" />
                <div>
                  <strong className="block text-xl font-black leading-none">{value as string}</strong>
                  <span className="text-xs font-semibold text-white/70">{label as string}</span>
                </div>
              </div>
            ))}
          </div>
        </PortalHero>

        <main className="reference-container -mt-6 space-y-6 pb-8">
          <section className="reference-panel relative z-10 grid gap-3 rounded-lg p-5 md:grid-cols-2">
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 rounded-md border border-[#dbe4f2] bg-white px-3 text-sm font-bold text-[#52617f]">
              {departments.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={skillLevel} onChange={(event) => setSkillLevel(event.target.value)} className="h-11 rounded-md border border-[#dbe4f2] bg-white px-3 text-sm font-bold text-[#52617f]">
              {levels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-5 xl:grid-cols-9">
            {categoryRail.map((item) => {
              const Icon = item.icon;
              const active = category === item.value;
              return (
                <button key={item.label} type="button" onClick={() => setCategory(item.value)} className={`reference-card flex min-h-[66px] items-center gap-3 p-3 text-left transition ${active ? 'ring-2 ring-blue-500' : 'hover:-translate-y-0.5'}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${item.tone} text-white`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-xs font-black text-[#06123a]">{item.label}</strong>
                    <small className="text-[0.68rem] font-bold text-[#657391]">{item.value === 'ALL' ? (stats.totalSkills ?? allSkills.length) : allSkills.filter((skill) => skill.category === item.value).length}</small>
                  </span>
                </button>
              );
            })}
          </section>

          {error && (
            <div className="reference-card flex items-center justify-between gap-3 p-4 text-sm font-bold text-[#b91c1c]">
              <span>{error}</span>
              <button onClick={() => fetchProfiles()} className="inline-flex items-center gap-2 rounded-md bg-[#e91670] px-3 py-2 text-xs font-black text-white">
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          )}

          <section>
            <SectionHeading icon={<Star className="h-5 w-5 fill-[#6d28d9]" />} title="Explore Talented Women" caption="Find and connect with skilled women across India." actionLabel="View All Talents" actionTo="/skills" />
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, item) => <SkillCardSkeleton key={item} />)}</div>
            ) : profiles.length === 0 ? (
              <div className="reference-card py-12 text-center">
                <p className="text-xl font-black text-[#06123a]">No matching profiles found</p>
                <p className="mt-1 text-sm font-semibold text-[#52617f]">Try another skill, category, department, or level.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {visibleProfiles.map((profile, index) => (
                  <article key={profile._id} className="reference-card min-h-[150px] p-3">
                    <div className="flex items-start gap-3">
                      <img src={resolveUploadUrl(profile.profileImage) || fallbackProfile} onError={(event) => { event.currentTarget.src = fallbackProfile; }} alt="" className="h-[72px] w-[72px] rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-black text-[#06123a]">{profile.name}</h3>
                          <Bookmark className="h-4 w-4 shrink-0 text-[#8a97b4]" />
                        </div>
                        <p className="mt-1 truncate text-xs font-bold text-[#33456e]">{profile.skills[0]?.skillName || profile.department}</p>
                        <p className="mt-2 flex items-center gap-1 truncate text-[0.68rem] font-semibold text-[#657391]">
                          <MapPin className="h-3 w-3 text-[#ef2a72]" /> {profile.department}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex min-h-[25px] flex-wrap gap-1.5">
                      {profile.skills.slice(0, 3).map((skill) => (
                        <span key={skill._id} className="rounded-full border border-[#cfd8ff] bg-[#f2f4ff] px-2 py-0.5 text-[0.65rem] font-black text-[#3153d8]">{skill.skillName}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[#edf2fb] pt-2 text-[0.72rem] font-black">
                      <span className="flex items-center gap-1 text-[#06123a]"><Star className="h-3.5 w-3.5 fill-[#f6a400] text-[#f6a400]" /> {(4.7 + (index % 3) / 10).toFixed(1)} ({profile.skills.length + 28})</span>
                      <span className={profile.academicStatus === 'ACTIVE' ? 'text-[#16833a]' : 'text-[#e18700]'}>{profile.academicStatus === 'ACTIVE' ? 'Available' : profile.academicStatus.replaceAll('_', ' ')}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="reference-panel rounded-lg p-5">
              <SectionHeading icon={<BriefcaseBusiness className="h-6 w-6 text-[#075cff]" />} title="Talent Opportunities" caption="Exciting opportunities to showcase your skills." actionLabel="View All Opportunities" actionTo="/student/skills" />
              <div className="grid gap-3 md:grid-cols-3">
                {(opportunityProfiles.length ? opportunityProfiles : profiles.slice(0, 3)).map((profile) => (
                  <article key={profile._id} className="reference-card p-4">
                    <p className="text-sm font-black text-[#06123a]">{profile.entrepreneurship?.preferredIndustry || profile.skills[0]?.skillName || 'Skill Showcase'}</p>
                    <p className="mt-1 text-xs font-semibold text-[#52617f]">{profile.name}</p>
                    <p className="mt-3 flex items-center gap-1 text-[0.7rem] font-bold text-[#657391]"><MapPin className="h-3 w-3 text-[#ef2a72]" /> {profile.department}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#f2f4ff] px-2 py-0.5 text-[0.65rem] font-black text-[#3153d8]">{profile.skills[0]?.category || 'Mentorship'}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="reference-panel rounded-lg p-5">
              <SectionHeading icon={<Users className="h-6 w-6 text-[#075cff]" />} title="Skill Requests" caption="Admin-created opportunities are delivered to matched students." actionLabel="Open Student Requests" actionTo="/student/skill-requests" />
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['Matched by skills', 'Requests are sent through the existing student skill matching workflow.'],
                  ['Student response', 'Students can review the request and respond from their dashboard.'],
                  ['Admin visibility', 'Admins manage requests and matched recipients from the protected admin board.'],
                ].map(([title, copy]) => (
                  <article key={title} className="reference-card p-4">
                    <p className="text-sm font-black text-[#06123a]">{title}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#52617f]">{copy}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageWrapper>
  );
};
