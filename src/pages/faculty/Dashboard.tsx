import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Award, CalendarDays, FileText, GraduationCap, Landmark, RefreshCw, Search, Shield, Users } from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton.js';

const quickAccess = [
  { label: 'Student Overview', path: '/faculty/students', icon: Users },
  { label: 'Review Updates', path: '/faculty/students', icon: FileText },
  { label: 'Workshops', path: '/faculty/workshops', icon: CalendarDays },
  { label: 'Event Reports', path: '/faculty/workshops', icon: FileText },
  { label: 'Schemes', path: '/faculty/schemes', icon: Landmark },
  { label: 'Safety', path: '/faculty/safety', icon: Shield },
];

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFacultyData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/faculty/dashboard');
      if (res.data.success) {
        const dashboardData = res.data.data;
        setMetrics(dashboardData.metrics || dashboardData);
        setRecentStudents(dashboardData.recentStudents || dashboardData.recentlyUpdated || []);
      } else {
        setError('Could not load the faculty dashboard.');
      }
    } catch {
      setError('Could not load the faculty dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !metrics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p className="font-semibold">{error || 'Dashboard data unavailable.'}</p>
        <button onClick={fetchFacultyData} className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-xs font-bold text-red-800">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    ['Students', metrics.totalStudents || 0, Users],
    ['Active students', metrics.activeStudents || 0, Users],
    ['Singa Pen members', metrics.singaPenMembers || 0, Award],
    ['UG students', metrics.programLevelSummary?.UG || 0, GraduationCap],
    ['PG students', metrics.programLevelSummary?.PG || 0, GraduationCap],
    ['Live departments', metrics.departmentBreakdown?.length || 0, Users],
  ];

  return (
    <div className="space-y-5 fade-in-up">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(110deg,#06123a,#2026a8_58%,#ec0875)] p-5 text-white shadow-[0_18px_38px_rgba(23,24,104,0.2)] sm:p-7"><div className="flex items-center gap-4"><span className="grid h-20 w-20 place-items-center rounded-full border-4 border-white/80 bg-white/10 text-2xl font-black">{user?.name?.slice(0, 1) || 'F'}</span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black tracking-[-0.03em]">{user?.name}</h1><span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black">Faculty</span></div><p className="mt-2 text-sm font-semibold text-white/75">{user?.staffId || 'Faculty account'} · Empowering students through the Singa Pen portal.</p></div></div><div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-5 sm:grid-cols-3 xl:grid-cols-6">{stats.map(([label, value]) => <div key={label as string}><p className="text-[10px] font-bold uppercase text-white/60">{label as string}</p><p className="mt-1 text-2xl font-black">{Number(value || 0)}</p></div>)}</div></div>
        <div className="rounded-[20px] border border-[#e4eaff] bg-white p-5 shadow-sm"><h2 className="text-lg font-black text-[#071426]">Faculty snapshot</h2><p className="mt-1 text-xs font-semibold text-[#64748b]">Current authorized dashboard metrics.</p><div className="mt-5 space-y-3 text-sm font-bold text-[#52617f]"><p className="flex justify-between"><span>Active students</span><span className="text-[#2563eb]">{metrics.activeStudents || 0}</span></p><p className="flex justify-between"><span>Club members</span><span className="text-[#7c3aed]">{metrics.singaPenMembers || 0}</span></p><p className="flex justify-between"><span>Collaboration ready</span><span className="text-[#059669]">{metrics.availableForCollaboration || 0}</span></p></div><Search className="mt-5 h-5 w-5 text-[#2563eb]" /></div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-xl border border-gray-150 bg-white p-4 shadow-sm">
            {React.createElement(Icon as typeof Users, { className: 'h-5 w-5 text-maroon-700' })}
            <p className="mt-3 text-[10px] font-bold uppercase text-gray-500">{label as string}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-maroon-700">{Number(value || 0)}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickAccess.map(item => (
          <Link key={item.path} to={item.path} className="grid min-h-24 place-items-center gap-2 rounded-xl border border-[#e4eaff] bg-white p-3 text-center text-xs font-black text-[#071426] shadow-sm hover:border-[#9bb7ff]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-white">
              <item.icon className="h-5 w-5" />
            </span>
            {item.label}
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-gray-150 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-maroon-700">Student Skill Matching</h2>
            <p className="mt-1 text-sm text-gray-500">Find students by real submitted skills, department, and project readiness.</p>
          </div>
          <Link to="/faculty/students" className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white">
            <Search className="h-4 w-4" />
            Search Students
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-gray-150 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-maroon-700">Recent Student Updates</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {recentStudents.slice(0, 5).map(student => (
            <Link key={student._id} to={`/faculty/students?search=${encodeURIComponent(student.name)}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-maroon-700">
              <span className="font-bold text-gray-800">{student.name}</span>
              <span className="text-xs text-gray-500">{student.department}</span>
            </Link>
          ))}
          {recentStudents.length === 0 && <p className="py-4 text-sm text-gray-500">No recent student updates.</p>}
        </div>
      </section>
    </div>
  );
};
