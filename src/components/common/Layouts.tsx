import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import Header from './Header.js';
import Footer from './Footer.js';
import {
  User, Award, LayoutDashboard, Search, Users, Landmark,
  LogOut, ShieldAlert, Bell, CalendarDays
} from 'lucide-react';
import api from '../../utils/api.js';

// 1. Public Layout (Header + Content + Footer)
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-dark-bg">
      <Header />
      <main className="flex-grow">
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
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-serif text-maroon-700 tracking-wide">Authenticating Session...</p>
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  if (!user) return <Navigate to="/login" replace />;

  const isSelected = (path: string) => location.pathname === path;

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

  const studentLinks = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Skills', path: '/student/skills', icon: Award },
    { label: 'Schemes', path: '/student/schemes', icon: Landmark },
    { label: 'Workshops', path: '/student/workshops', icon: CalendarDays },
  ];

  const facultyLinks = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Search', path: '/faculty/search', icon: Search },
    { label: 'Members', path: '/members', icon: Users },
    { label: 'Schemes', path: '/schemes', icon: Landmark },
  ];

  const adminLinks = user.role === 'ICC_ADMIN' ? [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Cases', path: '/admin/icc-complaints', icon: ShieldAlert },
    { label: 'Alerts', path: '/admin/notifications', icon: Bell },
  ] : [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Workshops', path: '/admin/workshops', icon: CalendarDays },
    { label: 'Schemes', path: '/admin/schemes', icon: Landmark },
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-orchid text-dark-purple font-sans">
      <header className="sticky top-0 z-30 border-b border-amethyst/20 bg-white/92 backdrop-blur px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-dark-purple to-amethyst text-xs font-bold text-white">
              SP
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-sm font-bold text-dark-purple">Singa Pen Portal</span>
              <span className="block truncate text-[10px] uppercase tracking-wide text-dark-purple/55">{user.role} console</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {user.role === 'STUDENT' && (
              <Link to="/student/profile" aria-label="Open profile" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amethyst/18 bg-thistle/45 text-dark-purple hover:text-amethyst focus:outline-none focus:ring-2 focus:ring-amethyst/35">
                <User className="h-4 w-4" />
              </Link>
            )}
            {['STUDENT', 'FACULTY', 'ADMIN', 'ICC_ADMIN'].includes(user.role) && (
              <Link to={user.role === 'STUDENT' ? '/student/notifications' : user.role === 'FACULTY' ? '/faculty/notifications' : '/admin/notifications'} aria-label="Notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-amethyst/18 bg-thistle/45 text-dark-purple hover:text-amethyst focus:outline-none focus:ring-2 focus:ring-amethyst/35">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={handleLogout} className="inline-flex h-10 items-center gap-2 rounded-full border border-red-100 bg-white px-3 text-xs font-bold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-8">
        <Outlet />
      </main>

      <nav aria-label={`${user.role} primary navigation`} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div
          className="mx-auto grid max-w-xl gap-1 rounded-2xl border border-amethyst/18 bg-white/95 p-2 shadow-[0_-10px_30px_rgba(90,24,56,0.14)] backdrop-blur"
          style={{ gridTemplateColumns: `repeat(${Math.max(links.length, 1)}, minmax(0, 1fr))` }}
        >
          {links.map((link) => {
            const selected = isSelected(link.path) || location.pathname.startsWith(`${link.path}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-label={link.label}
                aria-current={selected ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amethyst/35 ${
                  selected ? 'bg-thistle text-dark-purple' : 'text-dark-purple/50 hover:bg-orchid hover:text-amethyst'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
