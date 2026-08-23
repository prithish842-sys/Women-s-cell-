import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLanguage } from '../../contexts/LanguageContext.js';
import Header from './Header.js';
import Footer from './Footer.js';
import {
  User, Award, LayoutDashboard, Search, Users, Landmark,
  ShieldAlert, Bell, CalendarDays, HeartPulse, Shield, BookMarked,
  BarChart3, Settings, Images, LogOut, GraduationCap,
  Languages, Moon, Sun, Home
} from 'lucide-react';
import api, { resolveUploadUrl } from '../../utils/api.js';

// 1. Public Layout (Header + Content + Footer)
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-[#06123a]">
      <Header />
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// 2. Protected Route Guard
export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-serif text-slate-800 tracking-wide">Authenticating Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

// 3. Role-Based Route Guard
export const RoleRoute: React.FC<{ allowedRoles: ('ADMIN' | 'STUDENT' | 'FACULTY' | 'ICC_ADMIN')[]; children?: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

// 4. Dashboard Layout (Modular Sidebar depending on user role)
export const DashboardLayout: React.FC = () => {
  const { user, logout, profile } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState<any[]>([]);
  const [adminSearchLoading, setAdminSearchLoading] = useState(false);
  const [adminSearchOpen, setAdminSearchOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('singa-dashboard-theme') || 'light';
  });

  const isSelected = (path: string) => location.pathname === path;
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'ICC_ADMIN';

  useEffect(() => {
    if (!['STUDENT', 'FACULTY', 'ADMIN', 'ICC_ADMIN'].includes(user?.role || '')) return;
    let active = true;
    const loadUnread = async () => {
      try {
        const endpoint = user?.role === 'ADMIN' || user?.role === 'ICC_ADMIN'
          ? '/admin/notifications/unread-count'
          : user?.role === 'FACULTY'
            ? '/faculty/notifications/unread-count'
          : '/students/me/notifications/unread-count';
        const res = await api.get(endpoint);
        if (active) setUnreadCount(res.data.data?.count || 0);
      } catch {
        if (active) setUnreadCount(0);
      }
    };
    loadUnread();
    const timer = window.setInterval(loadUnread, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.role]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.dataset.dashboardTheme = theme;
    window.localStorage.setItem('singa-dashboard-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAdminRole) return;
    const query = adminSearch.trim();
    if (query.length < 2) {
      setAdminSearchResults([]);
      setAdminSearchLoading(false);
      return;
    }
    let active = true;
    setAdminSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get('/admin/search', { params: { q: query } });
        if (active) setAdminSearchResults(res.data.data || []);
      } catch {
        if (active) setAdminSearchResults([]);
      } finally {
        if (active) setAdminSearchLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [adminSearch, isAdminRole]);

  if (!user) return <Navigate to="/login" replace />;

  const studentLinks = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Schemes', path: '/student/schemes', icon: Landmark },
    { label: 'My Learning', path: '/student/skills', icon: Award },
    { label: 'Workshops & Events', path: '/student/workshops', icon: CalendarDays },
    { label: 'Wellbeing', path: '/student/wellbeing', icon: HeartPulse },
    { label: 'Safety & Support', path: '/student/safety', icon: Shield },
  ];

  const facultyLinks = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/faculty/students', icon: Users },
    { label: 'Workshop & Reports', path: '/faculty/workshops', icon: CalendarDays },
    { label: 'Schemes', path: '/faculty/schemes', icon: Landmark },
    { label: 'Safety', path: '/faculty/safety', icon: Shield },
  ];

  const adminLinks = user.role === 'ICC_ADMIN' ? [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Cases', path: '/admin/icc-complaints', icon: ShieldAlert },
  ] : [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Student Management', path: '/admin/students', icon: GraduationCap },
    { label: 'Member Management', path: '/admin/members', icon: Users },
    { label: 'Workshops', path: '/admin/workshops', icon: CalendarDays },
    { label: 'Govt Schemes', path: '/admin/schemes', icon: Landmark },
    { label: 'Gallery', path: '/admin/gallery', icon: Images },
    { label: 'Safety', path: '/admin/safety/wellbeing', icon: Shield },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const getLinks = () => {
    switch (user.role) {
      case 'STUDENT': return studentLinks;
      case 'FACULTY': return facultyLinks;
      case 'ADMIN':
      case 'ICC_ADMIN':
        return adminLinks;
      default: return [];
    }
  };

  const links = getLinks();
  const mobileLinks = user.role === 'STUDENT' ? [
    { label: 'Workshop', path: '/student/workshops', icon: CalendarDays },
    { label: 'Wellbeing', path: '/student/wellbeing', icon: HeartPulse },
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Safety', path: '/student/safety', icon: Shield },
    { label: 'Schemes', path: '/student/schemes', icon: Landmark },
  ] : user.role === 'FACULTY' ? [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/faculty/students', icon: Users },
    { label: 'Workshop', path: '/faculty/workshops', icon: CalendarDays },
    { label: 'Schemes', path: '/faculty/schemes', icon: Landmark },
    { label: 'Safety', path: '/faculty/safety', icon: Shield },
  ] : user.role === 'ICC_ADMIN' ? [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Cases', path: '/admin/icc-complaints', icon: ShieldAlert },
  ] : [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Workshops', path: '/admin/workshops', icon: CalendarDays },
    { label: 'Schemes', path: '/admin/schemes', icon: Landmark },
    { label: 'Gallery', path: '/admin/gallery', icon: Images },
    { label: 'Safety', path: '/admin/safety/wellbeing', icon: Shield },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  ];
  const profileImage = resolveUploadUrl((profile as any)?.profileImage);
  const profilePath = user.role === 'STUDENT' ? '/student/profile' : user.role === 'FACULTY' ? '/faculty/profile' : '/admin/settings';
  const settingsPath = user.role === 'FACULTY' ? '/faculty/profile' : user.role === 'ADMIN' ? '/admin/settings' : '/student/profile';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const currentLink = links.find(link => isSelected(link.path) || location.pathname.startsWith(`${link.path}/`));
  const isAdmin = isAdminRole;

  const openAdminSearchResult = (path: string) => {
    setAdminSearchOpen(false);
    setAdminSearch('');
    setAdminSearchResults([]);
    navigate(path);
  };

  return (
    <div className="dashboard-layout min-h-screen bg-[#f5f7ff] text-[#06123a] font-sans lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#e6ebf7] bg-white px-3 py-4 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-2 pb-3" aria-label="Singa Pen Portal home">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#071426,#2563eb_42%,#7c3aed_72%,#db2777)] text-[12px] font-black text-white shadow-[0_8px_18px_rgba(30,80,210,0.25)]">
            <svg viewBox="0 0 64 64" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M32 8c-9 0-16 7-16 16 0 5 3 9 6 12l3 2-10 9 9-3 2 3c3 3 7 6 12 6 9 0 16-7 16-16S41 8 32 8zm-7 14a7 7 0 0 1 14 0 7 7 0 0 1-14 0zm16 16c-4 0-7 3-7 7v2h14v-2c0-4-3-7-7-7z" /></svg>
          </span>
          <span className="text-[1.2rem] font-black leading-none tracking-[-0.02em] text-[#0d2344]">Singa Pen <span className="font-bold text-[#2563eb]">Portal</span></span>
        </Link>

        <nav aria-label={`${user.role} sidebar navigation`} className="mt-5 grid gap-1.5">
          {links.map((link) => {
            const selected = isSelected(link.path) || location.pathname.startsWith(`${link.path}/`);
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path} aria-current={selected ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition ${selected ? 'bg-[linear-gradient(135deg,#1d4ed8,#7c3aed)] text-white shadow-[0_12px_24px_rgba(49,102,224,0.18)]' : 'text-[#1d3557] hover:bg-white hover:text-[#1d4ed8]'}`}>
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{link.label}</span>
                {link.path.includes('notifications') && unreadCount > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#e91670] px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
              </Link>
            );
          })}
        </nav>

        {(user.role === 'STUDENT' || isAdmin) && (
          <div className="mt-auto rounded-xl bg-[linear-gradient(135deg,#eef2ff,#f7faff_54%,#fce7f3)] p-4 text-sm shadow-[0_12px_30px_rgba(7,20,38,0.06)]">
            <BookMarked className="h-5 w-5 text-[#1d4ed8]" />
            <p className="mt-3 font-black text-[#0d2344]">{isAdmin ? 'Empower Women. Transform Communities.' : 'Explore more opportunities'}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#475569]">{isAdmin ? 'Manage, monitor, and make a meaningful impact.' : 'Schemes, skills and support tailored for you.'}</p>
            <Link to={isAdmin ? '/' : '/student/schemes'} className="mt-4 inline-flex items-center rounded-lg border border-[#c7d7ff] bg-white px-3 py-2 text-xs font-black text-[#2563eb]">{isAdmin ? 'Explore Portal' : 'Explore Now'}</Link>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-[#edf2fb] pt-4">
          <Link to={profilePath} aria-label="Open profile">
            {profileImage ? <img src={profileImage} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-sm font-black text-[#2563eb]">{user.name?.slice(0, 1) || 'S'}</span>}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#071426]">{user.name}</p>
            <p className="truncate text-xs font-semibold text-[#475569]">{user.role === 'STUDENT' ? 'Student' : user.role}</p>
          </div>
          <button type="button" onClick={handleLogout} aria-label="Logout" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#f7dfe7] bg-white text-[#e91670] hover:bg-rose-50">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className={`mt-3 grid gap-2 ${user.role === 'FACULTY' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <Link to="/" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe7f6] bg-white text-[11px] font-black text-[#1d4ed8]">
            <Home className="h-3.5 w-3.5" /> {t('backToWebsite')}
          </Link>
          {user.role !== 'FACULTY' && (
            <Link to={settingsPath} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe7f6] bg-white text-[11px] font-black text-[#1d4ed8]">
              <Settings className="h-3.5 w-3.5" /> {t('settings')}
            </Link>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#e6ebf7] bg-white/92 px-4 py-3 shadow-[0_10px_30px_rgba(7,20,38,0.04)] backdrop-blur-xl">
            <div className="mx-auto grid max-w-[1440px] gap-3 sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[1.15rem] font-black tracking-normal text-[#071426] sm:text-[1.35rem]">{isAdmin ? (currentLink?.label || 'Admin') : `Welcome back, ${user.name}!`}</h1>
              <p className="mt-0.5 text-xs font-semibold text-[#475569]">{isAdmin ? 'Manage and monitor your Singa Pen platform.' : 'Here’s what’s happening with your Singa Pen journey today.'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <label className="relative hidden min-w-[22rem] md:block">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#40528a]" />
                  <input
                    value={adminSearch}
                    onChange={(event) => {
                      setAdminSearch(event.target.value);
                      setAdminSearchOpen(true);
                    }}
                    onFocus={() => setAdminSearchOpen(true)}
                    className="h-10 w-full rounded-lg border border-[#dfe7f6] bg-white pl-4 pr-10 text-xs font-semibold text-[#10205a] outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Search students, members, schemes, workshops, gallery..."
                  />
                  {adminSearchOpen && adminSearch.trim().length >= 2 && (
                    <div className="absolute right-0 top-12 z-50 w-full overflow-hidden rounded-xl border border-[#dfe7f6] bg-white shadow-[0_18px_45px_rgba(7,20,38,0.16)]">
                      <div className="border-b border-[#edf2fb] px-3 py-2 text-[10px] font-black uppercase text-[#64748b]">
                        {adminSearchLoading ? 'Searching...' : `${adminSearchResults.length} result${adminSearchResults.length === 1 ? '' : 's'}`}
                      </div>
                      {adminSearchResults.length === 0 && !adminSearchLoading ? (
                        <p className="px-3 py-4 text-xs font-semibold text-[#64748b]">No permitted records match this search.</p>
                      ) : (
                        <div className="max-h-80 overflow-y-auto py-1">
                          {adminSearchResults.map((result) => (
                            <button
                              key={`${result.type}-${result.id}`}
                              type="button"
                              onClick={() => openAdminSearchResult(result.path)}
                              className="block w-full px-3 py-2.5 text-left hover:bg-[#f7faff]"
                            >
                              <span className="block text-[10px] font-black uppercase text-[#2563eb]">{result.type}</span>
                              <span className="mt-0.5 block truncate text-sm font-black text-[#071426]">{result.title}</span>
                              <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#64748b]">{result.subtitle}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </label>
              )}
              {['STUDENT', 'FACULTY', 'ADMIN', 'ICC_ADMIN'].includes(user.role) && (
                <Link to={user.role === 'STUDENT' ? '/student/notifications' : user.role === 'FACULTY' ? '/faculty/notifications' : '/admin/notifications'} aria-label="Notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe9ff] bg-[#f3f7ff] text-[#163b8f] hover:text-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
                </Link>
              )}
              <button type="button" onClick={toggleLanguage} aria-label="Switch dashboard language" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dfe9ff] bg-white px-3 text-xs font-black text-[#163b8f]">
                <Languages className="h-4 w-4" /> {language === 'en' ? 'EN' : 'TA'}
              </button>
              <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dashboard theme" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe9ff] bg-white text-[#163b8f] hover:text-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-200">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link
                to="/"
                aria-label="Back to public website"
                title={t('backToWebsite')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe9ff] bg-white text-[#163b8f] hover:text-[#2563eb] focus:outline-none focus:ring-2 focus:ring-blue-200 lg:hidden"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Link to={profilePath} aria-label="Open profile" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe9ff] bg-white text-slate-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
                {profileImage ? <img src={profileImage} alt="" className="h-full w-full rounded-full object-cover" /> : <User className="h-4 w-4" />}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
                title={t('signOut')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f7dfe7] bg-white text-[#e91670] hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav aria-label={`${user.role} primary navigation`} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        {isAdminRole ? (
          <div className="mx-auto max-w-full overflow-hidden rounded-2xl border border-blue-100 bg-white/95 shadow-[0_-10px_30px_rgba(7,20,38,0.12)] backdrop-blur">
            <div className="flex min-w-0 gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mobileLinks.map((link) => {
                const selected = isSelected(link.path) || location.pathname.startsWith(`${link.path}/`);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    aria-label={link.label}
                    aria-current={selected ? 'page' : undefined}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-[0.72rem] font-extrabold tracking-[-0.01em] transition-colors ${
                      selected
                        ? 'bg-[linear-gradient(135deg,#071426,#1d4ed8_45%,#7c3aed)] text-white shadow-[0_6px_14px_rgba(29,78,216,0.18)]'
                        : 'bg-transparent text-[#33456e] hover:bg-blue-50 hover:text-[#071426]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="mx-auto grid max-w-xl gap-1 rounded-2xl border border-blue-100 bg-white/95 p-2.5 shadow-[0_-10px_30px_rgba(7,20,38,0.12)] backdrop-blur"
            style={{ gridTemplateColumns: `repeat(${Math.max(mobileLinks.length, 1)}, minmax(0, 1fr))` }}
          >
            {mobileLinks.map((link) => {
              const selected = isSelected(link.path) || location.pathname.startsWith(`${link.path}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-label={link.label}
                  aria-current={selected ? 'page' : undefined}
                  className={`singa-dock-item group ${
                    link.path.endsWith('/dashboard') ? 'singa-dock-item-center ' : ''
                  }${
                    selected ? 'singa-dock-item-active' : 'singa-dock-item-idle'
                  }`}
                >
                  <span className="singa-dock-icon-shell">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="singa-dock-label">{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
};
