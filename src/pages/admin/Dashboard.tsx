import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Award, Bell, CalendarDays, FileText, Image, Landmark, RefreshCw, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton.js';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data || {});
      } else {
        setError(res.data.message || 'Could not load the admin dashboard.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  if (loading) {
    return <DashboardSkeleton cards={8} />;
  }

  if (error || !metrics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p className="font-semibold">{error || 'Dashboard data unavailable.'}</p>
        <button onClick={fetchAdminMetrics} className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-xs font-bold text-red-800">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const summary = [
    ['Students', metrics.totalStudents, Users],
    ['Faculty', metrics.facultyCount, Users],
    ['Workshops', metrics.upcomingWorkshops, CalendarDays],
    ['Schemes', metrics.publishedSchemes, Landmark],
    ['Skill requests', metrics.pendingSkillRequests, Award],
    ['Gallery albums', metrics.galleryAlbumCount, Image],
    ['Notifications', metrics.unreadNotifications, Bell],
    ['ICC cases', metrics.pendingIccCaseCount, ShieldAlert],
  ];

  const quickActions = user?.role === 'ICC_ADMIN'
    ? [
        { label: 'ICC Cases', path: '/admin/icc-complaints', icon: ShieldAlert },
        { label: 'Notifications', path: '/admin/notifications', icon: Bell },
      ]
    : [
        { label: 'Students', path: '/admin/students', icon: Users },
        { label: 'Role Updates', path: '/admin/role-updates', icon: FileText },
        { label: 'Workshops', path: '/admin/workshops', icon: CalendarDays },
        { label: 'Schemes', path: '/admin/schemes', icon: Landmark },
      ];

  return (
    <div className="space-y-7 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-matte-beige pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-matte-maroon">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-matte-charcoal/60">Signed in as {user?.name}. Department counts and UG/PG splits come from registered student profiles in PostgreSQL.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md bg-matte-maroon px-4 py-2 text-xs font-bold text-white">
          <Sparkles className="h-4 w-4" />
          {user?.role === 'ICC_ADMIN' ? 'ICC Admin' : 'Portal Admin'}
        </span>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-xl border border-matte-beige bg-white p-4 shadow-sm">
            {React.createElement(Icon as typeof Users, { className: 'h-5 w-5 text-matte-rose' })}
            <p className="mt-3 text-[10px] font-bold uppercase text-matte-charcoal/50">{label as string}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-matte-maroon">{Number(value || 0)}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map(action => (
          <Link key={action.path} to={action.path} className="flex min-h-20 items-center gap-3 rounded-lg border border-matte-beige bg-white p-4 text-sm font-bold text-matte-maroon shadow-sm hover:border-matte-maroon">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-matte-cream">
              <action.icon className="h-5 w-5 text-matte-rose" />
            </span>
            {action.label}
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-matte-maroon">Pending Admin Actions</h2>
          <div className="mt-4 space-y-3">
            {(metrics.pendingActions || []).slice(0, 5).map((action: any) => (
              <div key={action.label} className="flex items-center justify-between gap-3 rounded-lg bg-matte-cream p-3 text-sm">
                <span className="font-semibold text-matte-charcoal">{action.label}</span>
                {action.link ? <Link to={action.link} className="font-bold text-matte-maroon underline">{action.count}</Link> : <span className="font-bold text-matte-maroon">{action.count}</span>}
              </div>
            ))}
            {(metrics.pendingActions || []).length === 0 && <p className="text-sm text-matte-charcoal/55">No pending actions.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-matte-maroon">Student In-Charge Updates</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Submitted', metrics.roleUpdateActivity?.submitted || 0],
              ['Reviewed', metrics.roleUpdateActivity?.reviewed || 0],
              ['Follow-up', metrics.roleUpdateActivity?.followUpRequired || 0],
              ['Completed', metrics.roleUpdateActivity?.completed || 0],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-matte-cream p-3">
                <p className="text-[10px] font-bold uppercase text-matte-charcoal/50">{label}</p>
                <p className="mt-1 font-serif text-2xl font-bold text-matte-maroon">{value as number}</p>
              </div>
            ))}
          </div>
          {user?.role !== 'ICC_ADMIN' && (
            <Link to="/admin/role-updates" className="mt-4 inline-flex rounded-md bg-matte-maroon px-4 py-2 text-sm font-bold text-white">
              Review Updates
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-matte-maroon">Recent Registrations</h2>
          <div className="mt-4 space-y-3">
            {(metrics.recentRegistrations || []).slice(0, 5).map((row: any) => (
              <div key={row._id} className="rounded-lg border border-matte-beige p-3 text-sm">
                <p className="font-bold text-matte-maroon">{row.student?.name || 'Student'}</p>
                <p className="mt-1 text-xs text-matte-charcoal/60">{row.workshop?.title || 'Workshop'} · {row.status}</p>
              </div>
            ))}
            {(metrics.recentRegistrations || []).length === 0 && <p className="text-sm text-matte-charcoal/55">No recent registrations.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-matte-maroon">Live Department-wise Students</h2>
          <div className="mt-4 space-y-3">
            {(metrics.topDepartments || []).slice(0, 6).map((item: any) => {
              const maxCount = Math.max(...(metrics.topDepartments || []).map((row: any) => row.count), 1);
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs"><span>{item.name}</span><strong>{item.count}</strong></div>
                  <div className="mt-1 flex gap-2 text-[10px] font-bold text-matte-charcoal/50">
                    <span>UG {Number(item.ug || 0)}</span>
                    <span>PG {Number(item.pg || 0)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-matte-cream">
                    <div className="h-full bg-matte-maroon" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {(metrics.topDepartments || []).length === 0 && <p className="text-sm text-matte-charcoal/55">No department data yet.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-matte-maroon">ICC Privacy Guard</h2>
        <p className="mt-2 text-sm leading-6 text-matte-charcoal/70">
          General administrators see aggregate ICC counts only. Complaint descriptions, evidence, and internal notes stay restricted to ICC_ADMIN routes.
        </p>
      </section>
    </div>
  );
};
