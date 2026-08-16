import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Award, FileText, Landmark, RefreshCw, Search, Users } from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton.js';

const quickAccess = [
  { label: 'Skill Search', path: '/faculty/search', icon: Search },
  { label: 'Role Updates', path: '/faculty/role-updates', icon: FileText },
  { label: 'Members', path: '/members', icon: Users },
  { label: 'Schemes', path: '/schemes', icon: Landmark },
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
    ['Skill categories', metrics.skillCategoriesCount || 0, Search],
  ];

  return (
    <div className="space-y-7 fade-in-up">
      <section className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-maroon-700">Faculty Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">{user?.name} · {user?.staffId || 'Staff account'}</p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          <Link key={item.path} to={item.path} className="flex min-h-20 items-center gap-3 rounded-lg border border-gray-150 bg-white p-4 text-sm font-bold text-maroon-700 shadow-sm hover:border-maroon-700">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-50">
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
          <Link to="/faculty/search" className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white">
            <Search className="h-4 w-4" />
            Search Students
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-gray-150 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-maroon-700">Recent Student Updates</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {recentStudents.slice(0, 5).map(student => (
            <Link key={student._id} to={`/faculty/search?search=${student.name}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-maroon-700">
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
