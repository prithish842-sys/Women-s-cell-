import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Award, CalendarDays, FileText, Landmark, RefreshCw, User } from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton.js';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, progressRes] = await Promise.allSettled([
        api.get('/students/me/dashboard'),
        api.get('/students/me/progress'),
      ]);

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.data.success) {
        setMetrics(dashboardRes.value.data.data);
      } else {
        setError('Could not load your dashboard.');
      }

      if (progressRes.status === 'fulfilled' && progressRes.value.data.success) {
        setProgress(progressRes.value.data.data);
      }
    } catch {
      setError('Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const quickAccess = [
    { label: 'Profile', path: '/student/profile', icon: User },
    { label: 'Skills', path: '/student/skills', icon: Award },
    { label: 'Schemes', path: '/student/schemes', icon: Landmark },
    { label: 'Workshops', path: '/student/workshops', icon: CalendarDays },
    ...(metrics?.roleActivity ? [{ label: 'Role Updates', path: '/student/role-updates', icon: FileText }] : []),
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !metrics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p className="font-semibold">{error || 'Dashboard data unavailable.'}</p>
        <button onClick={fetchDashboardMetrics} className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-xs font-bold text-red-800">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const profileCompletion = progress?.profileCompletionPercentage ?? metrics.completionPercentage ?? 0;
  const stats = [
    ['Profile completion', `${profileCompletion}%`],
    ['Skills saved', metrics.skillCount || 0],
    ['Saved schemes', progress?.savedSchemesCount || 0],
    ['Unread notifications', progress?.unreadNotificationsCount || 0],
  ];

  return (
    <div className="space-y-7 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-maroon-700">Welcome, {user?.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {metrics.academicStatus?.replaceAll('_', ' ') || 'ACTIVE'} · Academic Year {metrics.academicYear || 'current'}
          </p>
        </div>
        {metrics.isSingaPenMember && (
          <span className="w-fit rounded-full bg-maroon-700 px-3 py-1 text-xs font-bold text-white">
            {metrics.clubRole || 'Singa Pen Member'}
          </span>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-150 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-gray-500">{label}</p>
            <p className="mt-2 font-serif text-2xl font-bold text-maroon-700">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {quickAccess.map(item => (
          <Link key={item.path} to={item.path} className="flex min-h-20 items-center gap-3 rounded-lg border border-gray-150 bg-white p-4 text-sm font-bold text-maroon-700 shadow-sm hover:border-maroon-700">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-maroon-700">
              <item.icon className="h-5 w-5" />
            </span>
            {item.label}
          </Link>
        ))}
      </section>

      {metrics.roleActivity && (
        <section className="rounded-xl border border-gold-600/50 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-maroon-700">{metrics.roleActivity.role.officialPosition}</h2>
              <p className="mt-1 text-sm text-gray-600">{metrics.roleActivity.role.primaryResponsibility}</p>
            </div>
            <Link to="/student/role-updates" className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white">
              <FileText className="h-4 w-4" />
              Submit Update
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-150 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-maroon-700">Next Best Step</h2>
        <p className="mt-1 text-sm text-gray-500">
          Keep your profile, skills, and saved schemes current so faculty and the Women's Empowerment Cell can match you to the right opportunities.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/student/profile" className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold text-maroon-700 hover:bg-rose-50">Update Profile</Link>
          <Link to="/student/skills" className="rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white hover:bg-maroon-800">Manage Skills</Link>
        </div>
      </section>
    </div>
  );
};
