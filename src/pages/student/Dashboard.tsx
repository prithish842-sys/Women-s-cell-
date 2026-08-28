import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  Award,
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  Crown,
  FileText,
  HeartPulse,
  Landmark,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton.js';
import { DailyWellbeingCheckIn } from '../../components/wellbeing/DailyWellbeingCheckIn.js';
import { StudentProfileHero } from '../../components/student/StudentProfileHero.js';
import heroArtwork from '../../assets/images/hero/singa-pen-hero.png';

type LoadState = {
  metrics: any;
  progress: any;
  savedSchemes: any[];
  workshops: any[];
  notifications: any[];
  skills: any[];
  skillRequests: any[];
  wellbeingToday: any;
};

const emptyState: LoadState = {
  metrics: null,
  progress: null,
  savedSchemes: [],
  workshops: [],
  notifications: [],
  skills: [],
  skillRequests: [],
  wellbeingToday: null,
};

export const StudentDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [state, setState] = useState<LoadState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, progressRes, savedRes, workshopsRes, notificationsRes, skillsRes, requestsRes, wellbeingRes] = await Promise.allSettled([
        api.get('/students/me/dashboard'),
        api.get('/students/me/progress'),
        api.get('/students/me/saved-schemes'),
        api.get('/students/me/workshops'),
        api.get('/students/me/notifications?limit=4'),
        api.get('/students/me/skills'),
        api.get('/students/me/skill-requests?limit=4'),
        api.get('/wellbeing/me/today'),
      ]);

      const next: LoadState = {
        metrics: dashboardRes.status === 'fulfilled' && dashboardRes.value.data.success ? dashboardRes.value.data.data : null,
        progress: progressRes.status === 'fulfilled' && progressRes.value.data.success ? progressRes.value.data.data : null,
        savedSchemes: savedRes.status === 'fulfilled' && savedRes.value.data.success ? savedRes.value.data.data || [] : [],
        workshops: workshopsRes.status === 'fulfilled' && workshopsRes.value.data.success ? workshopsRes.value.data.data || [] : [],
        notifications: notificationsRes.status === 'fulfilled' && notificationsRes.value.data.success ? notificationsRes.value.data.data || [] : [],
        skills: skillsRes.status === 'fulfilled' && skillsRes.value.data.success ? skillsRes.value.data.data || [] : [],
        skillRequests: requestsRes.status === 'fulfilled' && requestsRes.value.data.success ? requestsRes.value.data.data || [] : [],
        wellbeingToday: wellbeingRes.status === 'fulfilled' && wellbeingRes.value.data.success ? wellbeingRes.value.data.data : null,
      };

      if (!next.metrics) {
        setError('Could not load your dashboard.');
      }
      setState(next);
    } catch {
      setError('Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const profileCompletion = state.progress?.profileCompletionPercentage ?? state.metrics?.completionPercentage ?? 0;
  const upcomingWorkshops = useMemo(
    () => state.workshops.filter(workshop => !workshop.isCompleted && !workshop.isCancelled).slice(0, 3),
    [state.workshops],
  );
  const primarySkills = state.skills.filter(skill => skill.isPrimary).slice(0, 5);
  const shownSkills = (primarySkills.length ? primarySkills : state.skills).slice(0, 5);
  const profileImage = resolveUploadUrl((profile as any)?.profileImage);
  const dashboardHeroImage = resolveUploadUrl((profile as any)?.dashboardHeroImage);

  if (loading) return <DashboardSkeleton />;

  if (error || !state.metrics) {
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

  const summary = [
    { label: 'Profile', value: `${profileCompletion}%`, icon: UserRound },
    { label: 'Skills', value: state.metrics.skillCount || state.skills.length || 0, icon: Award },
    { label: 'Saved Schemes', value: state.savedSchemes.length, icon: Bookmark },
    { label: 'Notifications', value: state.progress?.unreadNotificationsCount || state.notifications.filter(n => !n.isRead).length || 0, icon: Bell },
  ];

  const quickActions = [
    { label: 'Browse Schemes', path: '/student/schemes', icon: Landmark },
    { label: 'Find Workshops', path: '/student/workshops', icon: CalendarDays },
    { label: 'Manage Skills', path: '/student/skills', icon: Award },
    { label: 'Public Members', path: '/members', icon: Crown },
    { label: 'Wellbeing', path: '/student/wellbeing', icon: HeartPulse },
    { label: 'Safety Resources', path: '/student/safety', icon: Shield },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <section className="grid gap-5 xl:grid-cols-[1.38fr_0.82fr]">
        <StudentProfileHero
          name={user?.name}
          email={user?.email}
          department={(profile as any)?.department}
          course={(profile as any)?.course}
          bio={(profile as any)?.bio}
          status={state.metrics.academicStatus || 'ACTIVE'}
          profileImage={profileImage}
          backgroundImage={dashboardHeroImage}
          stats={summary}
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <Panel title="Quick Actions" caption="Move to the real tools you use most.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.path} to={action.path} className="grid min-h-20 place-items-center gap-2 rounded-xl border border-[#e6ebf7] bg-[#f9fbff] px-2 py-3 text-center text-[11px] font-black text-[#06123a] transition hover:border-[#9bb7ff] hover:bg-blue-50 hover:text-[#2563eb]">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-white shadow-[0_8px_18px_rgba(49,102,224,0.2)]"><Icon className="h-5 w-5" /></span>
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </Panel>
          <Panel title="Wellbeing Snapshot" caption="Your optional daily check-in state.">
            <div className="grid gap-5 md:grid-cols-[112px_minmax(0,1fr)] md:items-center">
              <div className="mx-auto grid h-28 w-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(#2563eb_0deg,#15a8b3_210deg,#edf2fb_210deg)] p-[10px] shadow-[0_10px_24px_rgba(37,99,235,0.12)] md:mx-0">
                <div className="grid h-full w-full place-items-center rounded-full bg-white px-2 text-center shadow-[inset_0_0_0_1px_rgba(230,235,247,0.8)]">
                  <span className="min-w-0">
                    <strong className="block max-w-[78px] break-normal text-[clamp(1rem,4vw,1.35rem)] font-black capitalize leading-tight tracking-[-0.02em] text-[#06123a] md:text-lg">
                      {state.wellbeingToday?.mood?.replaceAll('_', ' ') || 'Not set'}
                    </strong>
                    <span className="mt-1 block text-[11px] font-bold text-[#6b7894]">today</span>
                  </span>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-[#edf2fb] bg-[#fbfcff] p-3.5 sm:p-4">
                <div className="grid min-w-0 gap-2.5 text-xs font-bold text-[#52617f]">
                  <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#edf2fb]">
                    <span className="whitespace-nowrap text-[#6b7894]">Stress</span>
                    <strong className="min-w-0 text-right font-black leading-4 text-[#06123a]">
                      {state.wellbeingToday?.stressLevel ? `${state.wellbeingToday.stressLevel}/5` : 'Not checked in'}
                    </strong>
                  </div>

                  <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#edf2fb]">
                    <span className="whitespace-nowrap text-[#6b7894]">Energy</span>
                    <strong className="min-w-0 text-right font-black leading-4 text-[#06123a]">
                      {state.wellbeingToday?.energyLevel ? `${state.wellbeingToday.energyLevel}/5` : 'Not checked in'}
                    </strong>
                  </div>
                </div>

                <Link
                  to="/student/wellbeing"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-black text-[#2563eb] transition hover:bg-blue-100 md:w-auto"
                >
                  Go to Wellbeing
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <Panel title="Saved Schemes" caption="Opportunities you saved for later." action={<Link to="/student/schemes?saved=true">View All</Link>}>
          <PreviewList empty="No saved schemes yet." items={state.savedSchemes.slice(0, 3).map(row => ({
            id: row._id || row.id,
            icon: Landmark,
            title: row.scheme?.title,
            meta: row.scheme?.category,
            copy: row.scheme?.shortDescription,
            to: `/schemes/${row.scheme?.slug}`,
          }))} />
        </Panel>

        <Panel title="Skills Overview" caption="Your real skill portfolio." action={<Link to="/student/skills">View All Skills</Link>}>
          <PreviewList empty="Add skills to build your portfolio." items={shownSkills.map(skill => ({
            id: skill._id,
            icon: Award,
            title: skill.skillName,
            meta: skill.skillLevel,
            copy: skill.description || skill.category,
            to: '/student/skills',
          }))} />
        </Panel>

        <Panel title="Notifications" caption="Latest alerts from the portal." action={<Link to="/student/notifications">View All</Link>}>
          <PreviewList empty="No notifications yet." items={state.notifications.slice(0, 4).map(notification => ({
            id: notification._id,
            icon: Bell,
            title: notification.title,
            meta: notification.isRead ? 'Read' : 'Unread',
            copy: notification.message,
            to: notification.link || '/student/notifications',
          }))} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr_1fr]">
        <Panel title="Upcoming Workshops & Events" caption="Real published sessions and your registrations." action={<Link to="/student/workshops">View All</Link>}>
          <PreviewList empty="No upcoming workshops yet." items={upcomingWorkshops.map(workshop => ({
            id: workshop._id,
            icon: CalendarDays,
            title: workshop.title,
            meta: workshop.participations?.[0]?.status || workshop.status,
            copy: `${new Date(workshop.startDateTime).toLocaleString()} · ${workshop.venue || 'Venue pending'}`,
            to: '/student/workshops',
          }))} />
        </Panel>

        <Panel title="Skill Requests" caption="Admin-created opportunities matched to you." action={<Link to="/student/skill-requests">Open Requests</Link>}>
          <PreviewList empty="No skill requests assigned yet." items={state.skillRequests.slice(0, 3).map(row => ({
            id: row._id,
            icon: Megaphone,
            title: row.skillRequest?.title,
            meta: row.responseStatus || (row.isRead ? 'Read' : 'Unread'),
            copy: row.skillRequest?.organization || row.skillRequest?.summary,
            to: '/student/skill-requests',
          }))} />
        </Panel>

        <Panel title="Safety & Support Shortcuts" caption="Quick access when you need help.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Emergency Help', copy: 'Tap for urgent contacts.', path: '/safety/emergency', icon: LifeBuoy },
              { label: 'Safety Guide', copy: 'Read practical safety guidance.', path: '/safety', icon: Shield },
              { label: 'ICC Complaint', copy: 'Confidential reporting path.', path: '/icc-complaint', icon: FileText },
              { label: 'Wellbeing Support', copy: 'Request human support.', path: '/student/wellbeing/support', icon: MessageCircle },
            ].map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} className="rounded-lg border border-[#e1e9f6] bg-white p-3 transition hover:border-[#9bb7ff] hover:bg-blue-50">
                  <Icon className="h-5 w-5 text-[#e91670]" />
                  <p className="mt-2 text-sm font-black">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#52617f]">{item.copy}</p>
                </Link>
              );
            })}
          </div>
        </Panel>
      </section>

      {state.metrics.roleActivity && (
        <Panel title={state.metrics.roleActivity.role.officialPosition} caption={state.metrics.roleActivity.role.primaryResponsibility} action={<Link to="/student/role-updates">Submit Update</Link>}>
          <PreviewList empty="No role updates submitted yet." items={(state.metrics.roleActivity.recentUpdates || []).map((update: any) => ({
            id: update._id,
            icon: FileText,
            title: update.title,
            meta: update.status,
            copy: update.description,
            to: '/student/role-updates',
          }))} />
        </Panel>
      )}

      <DailyWellbeingCheckIn compact onSaved={fetchDashboardMetrics} />

      <section className="relative overflow-hidden rounded-xl bg-[#06175b] p-6 text-white shadow-[0_20px_45px_rgba(7,20,38,0.16)]">
        <img src={heroArtwork} alt="" aria-hidden="true" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,16,62,0.96),rgba(7,20,70,0.76)_48%,rgba(233,22,112,0.44))]" />
        <div className="relative max-w-md">
          <Sparkles className="h-6 w-6 text-[#72e8ef]" />
          <h2 className="mt-3 text-2xl font-black tracking-[-0.02em]">Be part of a community that empowers you.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/82">Join Singa Pen Club to connect, learn and grow with inspiring women.</p>
          <Link to="/members" className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#075cff] px-5 py-3 text-sm font-black text-white">Join Singa Pen Club</Link>
        </div>
      </section>
    </div>
  );
};

const Panel: React.FC<{ title: string; caption?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, caption, action, children }) => (
  <section className="rounded-[22px] border border-[#e6ebf7] bg-white p-4 shadow-[0_16px_30px_rgba(7,20,38,0.05)] sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-black tracking-[-0.01em] text-[#06123a]">{title}</h2>
        {caption && <p className="mt-1 text-xs font-semibold leading-5 text-[#52617f]">{caption}</p>}
      </div>
      {action && <div className="shrink-0 text-xs font-black text-[#2563eb]">{action}</div>}
    </div>
    {children}
  </section>
);

const PreviewList: React.FC<{ empty: string; items: Array<{ id: string; icon: React.ComponentType<{ className?: string }>; title?: string; meta?: string; copy?: string; to: string }> }> = ({ empty, items }) => {
  if (!items.length) {
    return <div className="rounded-lg border border-dashed border-[#cfd8ea] bg-[#f8fbff] px-4 py-8 text-center text-sm font-semibold text-[#52617f]">{empty}</div>;
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <Link key={item.id} to={item.to} className="flex gap-3 rounded-lg border border-[#edf2fb] bg-white p-3 transition hover:border-[#9bb7ff] hover:bg-blue-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf3ff] text-[#2563eb]"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-sm font-black text-[#06123a]">{item.title || 'Untitled'}</strong>
                {item.meta && <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-[10px] font-black text-[#2563eb]">{item.meta}</span>}
              </span>
              {item.copy && <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-5 text-[#52617f]">{item.copy}</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
