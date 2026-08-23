import React, { useEffect, useState } from 'react';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { StudentProfileHero } from '../../components/student/StudentProfileHero.js';
import { Save, AlertTriangle, CheckCircle, RefreshCw, BookOpen, User, Briefcase, Award, ExternalLink, ImagePlus, KeyRound, Languages, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react';

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
  const { user, profile, refreshUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroMessage, setHeroMessage] = useState('');
  const [heroError, setHeroError] = useState('');
  const [themeChoice, setThemeChoice] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('singa-dashboard-theme') || 'light';
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.dataset.dashboardTheme = themeChoice;
    window.localStorage.setItem('singa-dashboard-theme', themeChoice);
  }, [themeChoice]);

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

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.put('/auth/change-password', { oldPassword, newPassword });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Could not update password.');
      }
      setPasswordMessage('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || (err as Error).message || 'Could not update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const uploadDashboardHero = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setHeroMessage('');
    setHeroError('');

    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);

    if (!allowedTypes.has(file.type)) {
      setHeroError('Choose a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setHeroError('Dashboard background must be 3 MB or smaller.');
      return;
    }

    setHeroUploading(true);

    try {
      const formData = new FormData();
      formData.append('heroImage', file);

      const res = await api.put(
        '/students/me/dashboard-hero',
        formData,
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message ||
            'Could not update dashboard background.',
        );
      }

      await refreshUser();
      setHeroMessage('Dashboard background updated.');
    } catch (err: any) {
      setHeroError(
        err.response?.data?.message ||
          err.message ||
          'Could not update dashboard background.',
      );
    } finally {
      setHeroUploading(false);
    }
  };

  const resetDashboardHero = async () => {
    setHeroMessage('');
    setHeroError('');
    setHeroUploading(true);

    try {
      const res = await api.delete(
        '/students/me/dashboard-hero',
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message ||
            'Could not reset dashboard background.',
        );
      }

      await refreshUser();
      setHeroMessage('Default dashboard background restored.');
    } catch (err: any) {
      setHeroError(
        err.response?.data?.message ||
          err.message ||
          'Could not reset dashboard background.',
      );
    } finally {
      setHeroUploading(false);
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
        const profileImage = resolveUploadUrl((profile as any)?.profileImage);
        const dashboardHeroImage = resolveUploadUrl((profile as any)?.dashboardHeroImage);
        const profileCompletion = progress?.profileCompletionPercentage ?? 0;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-serif">Syncing core student record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in-up">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <StudentProfileHero
          name={user?.name}
          email={user?.email}
          department={department}
          course={course}
          bio={bio}
          status={(profile as any)?.academicStatus || 'ACTIVE'}
          profileImage={profileImage}
          backgroundImage={dashboardHeroImage}
          stats={[
            { label: 'Profile completion', value: `${profileCompletion}%` },
            { label: 'Skills logged', value: skills.length },
            { label: 'Primary skill', value: primarySkill?.skillName || 'Not set' },
            { label: 'Future plan', value: targetCareer },
          ]}
        />
        <div className="rounded-[20px] border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6"><h2 className="text-lg font-black text-[#071426]">Profile Completion</h2><div className="mt-4 flex items-center gap-5"><div className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(#2563eb_0deg,#7c3aed_calc(var(--completion)*1deg),#e9eefb_calc(var(--completion)*1deg))] p-3" style={{ '--completion': `${Math.min(profileCompletion, 100) * 3.6}` } as React.CSSProperties}><div className="grid h-full w-full place-items-center rounded-full bg-white text-center"><strong className="text-2xl font-black text-[#071426]">{profileCompletion}%</strong></div></div><div className="space-y-2 text-xs font-bold text-[#52617f]"><p>{phone ? '✓' : '○'} Contact details</p><p>{department && course ? '✓' : '○'} Academic information</p><p>{skills.length ? '✓' : '○'} Skills & interests</p><p>{futurePlan ? '✓' : '○'} Future plan</p></div></div><button type="button" onClick={() => document.getElementById('profile-editor')?.scrollIntoView({ behavior: 'smooth' })} className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-[#c9d6ff] bg-[#f6f8ff] px-4 py-2.5 text-xs font-black text-[#2563eb]">Complete profile <span className="ml-2">→</span></button></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><h2 className="text-base font-black text-[#071426]">Personal Information</h2><dl className="mt-3 divide-y divide-[#eef2fb] text-xs"><div className="flex justify-between gap-3 py-2"><dt className="font-bold text-[#64748b]">Phone</dt><dd className="text-right font-black text-[#071426]">{phone || 'Not added'}</dd></div><div className="flex justify-between gap-3 py-2"><dt className="font-bold text-[#64748b]">Register number</dt><dd className="text-right font-black text-[#071426]">{user?.registerNumber || 'Protected'}</dd></div></dl></div>
        <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><h2 className="text-base font-black text-[#071426]">Academic Information</h2><dl className="mt-3 divide-y divide-[#eef2fb] text-xs"><div className="flex justify-between gap-3 py-2"><dt className="font-bold text-[#64748b]">Department</dt><dd className="text-right font-black text-[#071426]">{department || 'Not added'}</dd></div><div className="flex justify-between gap-3 py-2"><dt className="font-bold text-[#64748b]">Course</dt><dd className="text-right font-black text-[#071426]">{course || 'Not added'}</dd></div></dl></div>
        <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><h2 className="text-base font-black text-[#071426]">Skills & Interests</h2><div className="mt-3 flex flex-wrap gap-2">{skills.length ? skills.slice(0, 6).map((skill) => <span key={skill._id} className="rounded-lg bg-[#f4f1ff] px-2.5 py-1.5 text-[11px] font-black text-[#4f46e5]">{skill.skillName}</span>) : <p className="text-xs font-semibold text-[#64748b]">Add skills to build your portfolio.</p>}</div></div>
      </section>

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
      <form id="profile-editor" onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#e4eaff] p-6 sm:p-8 space-y-8 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
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

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <form onSubmit={submitPassword} className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ff] text-[#2563eb]"><KeyRound className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black text-[#071426]">Password & Security</h2>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">Update your authenticated student account password.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-bold text-[#52617f]">Current password<input required type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]" /></label>
            <label className="block text-xs font-bold text-[#52617f]">New password<input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]" /></label>
            <label className="block text-xs font-bold text-[#52617f]">Confirm password<input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]" /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button disabled={passwordSaving} className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#2563eb,#1f8a8a)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"><Save className="h-4 w-4" />{passwordSaving ? 'Updating...' : 'Update password'}</button>
            {passwordMessage && <p className="flex items-center gap-2 text-sm font-semibold text-[#059669]"><CheckCircle className="h-4 w-4" />{passwordMessage}</p>}
            {passwordError && <p className="flex items-center gap-2 text-sm font-semibold text-[#dc2626]"><AlertTriangle className="h-4 w-4" />{passwordError}</p>}
          </div>
        </form>

        <aside className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff3e6] text-[#b45309]"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black text-[#071426]">Account Preferences</h2>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">Personal display preferences for this browser.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#edf2fb] p-3">
              <span className="inline-flex items-center gap-2 text-xs font-black text-[#52617f]"><Languages className="h-4 w-4 text-[#2563eb]" />Language</span>
              <div className="inline-flex rounded-lg border border-[#dfe7fb] bg-[#f8fbff] p-1">
                <button type="button" onClick={() => setLanguage('en')} className={`rounded-md px-3 py-1.5 text-xs font-black ${language === 'en' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#64748b]'}`}>EN</button>
                <button type="button" onClick={() => setLanguage('ta')} className={`rounded-md px-3 py-1.5 text-xs font-black ${language === 'ta' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#64748b]'}`}>TA</button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#edf2fb] p-3">
              <span className="inline-flex items-center gap-2 text-xs font-black text-[#52617f]">{themeChoice === 'dark' ? <Moon className="h-4 w-4 text-[#2563eb]" /> : <Sun className="h-4 w-4 text-[#b45309]" />}Theme</span>
              <div className="inline-flex rounded-lg border border-[#dfe7fb] bg-[#f8fbff] p-1">
                <button type="button" onClick={() => setThemeChoice('light')} className={`rounded-md px-3 py-1.5 text-xs font-black ${themeChoice === 'light' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#64748b]'}`}>Light</button>
                <button type="button" onClick={() => setThemeChoice('dark')} className={`rounded-md px-3 py-1.5 text-xs font-black ${themeChoice === 'dark' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#64748b]'}`}>Dark</button>
              </div>
            </div>
            <div className="rounded-lg border border-[#edf2fb] p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-black text-[#52617f]">
                  <ImagePlus className="h-4 w-4 text-[#7c3aed]" />
                  Dashboard hero background
                </span>

                <div className="flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-3 py-2 text-xs font-black text-white ${heroUploading ? 'pointer-events-none opacity-60' : ''}`}>
                    <ImagePlus className="h-4 w-4" />
                    {heroUploading ? 'Uploading...' : 'Choose Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={heroUploading}
                      onChange={uploadDashboardHero}
                    />
                  </label>

                  {dashboardHeroImage ? (
                    <button
                      type="button"
                      disabled={heroUploading}
                      onClick={resetDashboardHero}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#f5c9d7] bg-white px-3 py-2 text-xs font-black text-[#e91670] disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="mt-2 text-[11px] font-semibold leading-5 text-[#64748b]">
                JPG, PNG or WEBP · up to 3 MB. The same image is used on your Profile and Dashboard hero.
              </p>

              {heroMessage ? (
                <p className="mt-2 text-xs font-bold text-[#059669]">{heroMessage}</p>
              ) : null}

              {heroError ? (
                <p className="mt-2 text-xs font-bold text-[#dc2626]">{heroError}</p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
