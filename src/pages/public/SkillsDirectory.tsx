import React, { useEffect, useState } from 'react';
import { Award, Briefcase, Search, RefreshCw } from 'lucide-react';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { SkillCardSkeleton } from '../../components/common/Skeleton.js';
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
const categories = ['ALL', 'Technical', 'Vocational', 'Creative', 'Fine Arts', 'Fine Arts/Crafts', 'Entrepreneurial', 'Other'];
const levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
export const SkillsDirectory: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [skillLevel, setSkillLevel] = useState('ALL');
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfiles = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/public/skills/search', {
        signal,
        params: {
          keyword,
          department: department === 'ALL' ? undefined : department,
          category: category === 'ALL' ? undefined : category,
          skillLevel: skillLevel === 'ALL' ? undefined : skillLevel,
          limit: 24,
        },
      });
      setProfiles(res.data.data || []);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') return;
      setError('Could not load the skills directory.');
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
  }, [keyword, department, category, skillLevel]);

  return (
    <PageWrapper>
      <div className="bg-cream-50 min-h-screen">
        <section className="bg-maroon-700 text-cream-100 border-b border-gold-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cream-100/80">
                <Award className="w-4 h-4" />
                Skills & Entrepreneurship
              </div>
              <h1 className="font-serif text-4xl font-bold">Student Talent Directory</h1>
              <p className="text-sm leading-6 text-cream-100/85">
                Search student skills, project readiness, creative practice, and entrepreneurship interests across the Singa Pen community.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3">
            <label className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search skills, tools, names, departments"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </label>
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white">
              {departments.map(item => <option key={item}>{item}</option>)}
            </select>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white">
              {categories.map(item => <option key={item}>{item}</option>)}
            </select>
            <select value={skillLevel} onChange={(event) => setSkillLevel(event.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white">
              {levels.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>

          {error && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-3 text-sm text-maroon-700">
              <span>{error}</span>
              <button onClick={() => fetchProfiles()} className="inline-flex items-center gap-2 px-3 py-2 bg-maroon-700 text-white rounded-md text-xs font-bold">
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, item) => <SkillCardSkeleton key={item} />)}
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg py-14 text-center text-gray-500">
              <p className="font-serif text-xl font-bold text-maroon-700">No matching profiles found</p>
              <p className="text-sm mt-1">Try another skill, category, department, or level.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {profiles.map(profile => (
                <article key={profile._id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex gap-3">
                    <img
                      src={resolveUploadUrl(profile.profileImage) || fallbackProfile}
                      onError={(event) => { event.currentTarget.src = fallbackProfile; }}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border border-gold-600"
                    />
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg font-bold text-maroon-700 truncate">{profile.name}</h2>
                      <p className="text-xs text-gray-500">{profile.department} • {profile.course}</p>
                      <p className="text-[11px] text-gray-400">{profile.academicStatus.replaceAll('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 5).map(skill => {
                      const badgeTone = skill.isPrimary
                        ? 'bg-rose-50 text-maroon-700 border-gold-600'
                        : 'bg-white text-gray-600 border-gray-200';
                      return (
                        <span key={skill._id} className={`text-[10px] font-bold px-2 py-1 rounded border ${badgeTone}`}>
                          {skill.skillName}
                        </span>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    {profile.skills.slice(0, 3).map(skill => (
                      <div key={skill._id} className="border-t border-gray-100 pt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-800">{skill.category}</span>
                          <span className="text-[10px] text-maroon-700 font-bold">{skill.skillLevel}</span>
                        </div>
                        {skill.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{skill.description}</p>}
                      </div>
                    ))}
                  </div>

                  {profile.entrepreneurship?.interestedInEntrepreneurship && (
                    <div className="flex items-start gap-2 bg-cream-100 border border-gray-200 rounded-md p-3 text-xs text-gray-600">
                      <Briefcase className="w-4 h-4 text-maroon-700 shrink-0" />
                      <span>{profile.entrepreneurship.preferredIndustry || 'Entrepreneurship'} interest registered</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
};
