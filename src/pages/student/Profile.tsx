import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Save, AlertTriangle, CheckCircle, RefreshCw, BookOpen, Phone, User, Briefcase, Award, ExternalLink } from 'lucide-react';

interface SkillRecord {
  _id: string;
  skillName: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category: string;
  description?: string;
  isPrimary: boolean;
  tools?: string[];
  yearsOfExperience?: number;
  portfolioUrl?: string;
  certificateUrl?: string;
}

export const StudentProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields State
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [joiningAcademicYear, setJoiningAcademicYear] = useState('');
  const [expectedPassingYear, setExpectedPassingYear] = useState(2027);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [courseDurationYears, setCourseDurationYears] = useState(3);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [futurePlan, setFuturePlan] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [portfolioSkillId, setPortfolioSkillId] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [originalPortfolioUrl, setOriginalPortfolioUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.get('/students/me');
      if (res.data.success) {
        const data = res.data.data?.profile || res.data.data;
        setPhone(data.phone || '');
        setBio(data.bio || '');
        setDepartment(data.department || '');
        setCourse(data.course || '');
        setJoiningAcademicYear(data.joiningAcademicYear || '');
        setExpectedPassingYear(data.expectedPassingYear || 2027);
        setExpectedCompletionDate(data.expectedCompletionDate || '');
        setCourseDurationYears(data.courseDurationYears || 3);
      } else {
        setErrorMsg('Failed to fetch profile details.');
      }

      const [skillsRes, futurePlanRes, progressRes] = await Promise.allSettled([
        api.get('/students/me/skills'),
        api.get('/students/me/future-plan'),
        api.get('/students/me/progress')
      ]);

      if (skillsRes.status === 'fulfilled' && skillsRes.value.data.success) {
        const skillRows = skillsRes.value.data.data || [];
        setSkills(skillRows);
        const portfolioSkill = skillRows.find((skill: SkillRecord) => skill.isPrimary) || skillRows[0];
        setPortfolioSkillId(portfolioSkill?._id || '');
        setPortfolioUrl(portfolioSkill?.portfolioUrl || '');
        setOriginalPortfolioUrl(portfolioSkill?.portfolioUrl || '');
      }

      if (futurePlanRes.status === 'fulfilled' && futurePlanRes.value.data.success) {
        setFuturePlan(futurePlanRes.value.data.data || null);
      }

      if (progressRes.status === 'fulfilled' && progressRes.value.data.success) {
        setProgress(progressRes.value.data.data || null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setErrorMsg('Could not fetch student records from academic database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    setSaving(true);
    const updatedPayload = {
      name: user?.name || '',
      phone,
      bio,
      department,
      course,
      joiningAcademicYear,
      expectedPassingYear: Number(expectedPassingYear),
      expectedCompletionDate,
      courseDurationYears: Number(courseDurationYears)
    };

    try {
      const res = await api.put('/students/me', updatedPayload);
      if (res.data.success) {
        if (portfolioSkillId && portfolioUrl.trim() !== originalPortfolioUrl) {
          const skill = skills.find(item => item._id === portfolioSkillId);
          if (skill) {
            const skillPayload = new FormData();
            skillPayload.append('skillName', skill.skillName);
            skillPayload.append('skillLevel', skill.skillLevel);
            skillPayload.append('category', skill.category);
            skillPayload.append('description', skill.description || '');
            skillPayload.append('isPrimary', String(skill.isPrimary));
            skillPayload.append('tools', (skill.tools || []).join(','));
            skillPayload.append('yearsOfExperience', String(skill.yearsOfExperience || 0));
            skillPayload.append('portfolioUrl', portfolioUrl.trim());
            skillPayload.append('certificateUrl', skill.certificateUrl || '');
            await api.put(`/students/me/skills/${portfolioSkillId}`, skillPayload);
            setOriginalPortfolioUrl(portfolioUrl.trim());
          }
        }
        setSuccessMsg('Academic profile updated successfully!');
        await refreshUser(); // refresh AuthContext state
      } else {
        setErrorMsg(res.data.message || 'Failed to apply profile changes.');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.response?.data?.message || 'Server error applying updates.');
    } finally {
      setSaving(false);
    }
  };

  const targetCareer = futurePlan?.preferredIndustry || futurePlan?.businessIdea || 'Not added yet';
  const primarySkill = skills.find(skill => skill.isPrimary) || skills[0];
  const skillLevelScores = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
  const averageSkillScore = skills.length
    ? skills.reduce((total, skill) => total + skillLevelScores[skill.skillLevel], 0) / skills.length
    : 0;
  const averageSkillLabel = averageSkillScore >= 3.5 ? 'Advanced to Expert'
    : averageSkillScore >= 2.5 ? 'Intermediate to Advanced'
      : averageSkillScore >= 1.5 ? 'Beginner to Intermediate'
        : skills.length ? 'Beginner' : 'No skills logged';

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-serif">Syncing core student record...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in-up">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-2xl font-bold text-maroon-700">My Profile Details</h1>
        <p className="text-xs text-gray-500">Edit your college academic tracking parameters and public Bio introduction.</p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-150 p-6 sm:p-8 space-y-8 shadow-sm">
        {/* Row 1: Biographical metadata */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-700 pb-1.5 border-b border-gray-100 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Biographical Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Register Number (Locked)</span>
              <span className="font-mono font-semibold text-gray-800 text-sm block mt-1.5 bg-gray-50 px-3 py-2 rounded border">
                {user?.registerNumber}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Official Email (Locked)</span>
              <span className="font-mono text-gray-500 text-sm block mt-1.5 bg-gray-50 px-3 py-2 rounded border">
                {user?.email}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Bio (Publicly visible)</label>
            <textarea
              rows={3}
              placeholder="Tell other students or professors about your academic specialties and development focus..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Portfolio URL</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder={portfolioSkillId ? 'https://...' : 'Add a skill first to attach a portfolio link'}
                value={portfolioUrl}
                disabled={!portfolioSkillId}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              />
              {portfolioUrl && (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded text-maroon-700 hover:bg-rose-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {portfolioSkillId
                ? `This link is stored with ${primarySkill?.skillName || 'your primary skill'} and edited here from now on.`
                : 'Portfolio links need an existing skill record so the data remains tied to real student skills.'}
            </p>
          </div>
        </div>

        {/* Row 2: Course / Timeline */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-700 pb-1.5 border-b border-gray-100 flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Academic Program Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Course / Degree</label>
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Joining Academic Year</label>
              <input
                type="text"
                required
                placeholder="2024-2025"
                value={joiningAcademicYear}
                onChange={(e) => setJoiningAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Course Duration (Years)</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={courseDurationYears}
                onChange={(e) => setCourseDurationYears(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Expected Passing Year</label>
              <input
                type="number"
                min="2020"
                max="2040"
                required
                value={expectedPassingYear}
                onChange={(e) => setExpectedPassingYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Expected Completion Date</label>
              <input
                type="date"
                required
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-250 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={fetchProfile}
            className="px-4 py-2 text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-600 rounded transition-colors inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Fields</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold shadow-sm transition-colors inline-flex items-center space-x-1 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving changes...' : 'Save Academic Record'}</span>
          </button>
        </div>
      </form>

      <section className="bg-white rounded-xl border border-gray-150 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-700 flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Career Skill Readiness</span>
          </h3>
          {progress?.profileCompletionPercentage !== undefined && (
            <span className="text-xs font-serif font-bold text-maroon-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded">
              {progress.profileCompletionPercentage}% profile complete
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-150 bg-gray-50 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">Career / Industry Target</span>
            <p className="mt-2 text-sm font-bold text-gray-800">{targetCareer}</p>
          </div>
          <div className="rounded-lg border border-gray-150 bg-gray-50 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">Current Skills Logged</span>
            <p className="mt-2 text-sm font-bold text-gray-800">{skills.length} skills</p>
            <p className="mt-1 text-[11px] text-gray-500">{averageSkillLabel}</p>
          </div>
          <div className="rounded-lg border border-gray-150 bg-gray-50 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">Primary Skill</span>
            <p className="mt-2 text-sm font-bold text-gray-800">{primarySkill?.skillName || 'Not selected'}</p>
            <p className="mt-1 text-[11px] text-gray-500">{primarySkill?.skillLevel || 'Mark a primary skill in My Skills'}</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Career skill requirements are not configured yet.</p>
            <p className="text-xs text-amber-800/75 mt-1">
              Your profile shows real skills and future-plan data, but the portal does not currently define required skill mappings for each career path.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
