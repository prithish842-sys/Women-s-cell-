import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => path === '/' ? location.pathname === path : location.pathname.startsWith(path);

  const publicLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Singa Pen Club', path: '/members' },
    { label: 'Govt Schemes', path: '/schemes' },
    { label: 'Skills', path: '/skills' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'ICC Complaint', path: '/icc-complaint' },
  ];

  const getDashboardRedirect = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
      case 'ICC_ADMIN':
        return '/admin/dashboard';
      case 'FACULTY':
        return '/faculty/dashboard';
      case 'STUDENT':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amethyst/20 bg-white/90 shadow-sm backdrop-blur">
      {/* College Identity Bar */}
      <div className="bg-dark-purple text-orchid py-1.5 px-4 text-center text-xs tracking-wider font-serif border-b border-amethyst/35">
        SANKARA COLLEGE OF SCIENCE AND COMMERCE • WOMEN'S EMPOWERMENT CELL HUB
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 justify-between">
          {/* Logo & Portal Branding */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-dark-purple to-amethyst flex items-center justify-center text-white font-serif font-bold text-lg shadow-inner border border-thistle">
                SP
              </div>
              <div>
                <span className="block font-serif text-lg font-bold text-dark-purple leading-tight">
                  Singa Pen Portal
                </span>
                <span className="block text-xs font-sans tracking-wide text-dark-purple/65 leading-none">
                  Women's Empowerment Cell Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-amethyst/14 bg-orchid/55 px-1.5 py-1">
            {publicLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive(link.path) ? 'page' : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'bg-white text-dark-purple shadow-sm'
                    : 'text-dark-purple/68 hover:bg-white/70 hover:text-amethyst'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Portal Action / Profile Actions */}
            <div className="ml-3 flex items-center space-x-2 pl-3">
              {user ? (
                <>
                  <Link
                    to={getDashboardRedirect()}
                    className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-dark-purple to-amethyst px-4 py-2 text-sm font-semibold text-white shadow transition-[filter] hover:brightness-105"
                  >
                    <span>Go to Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="rounded-full p-2 text-dark-purple/60 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm font-semibold text-dark-purple/72 transition-colors hover:text-amethyst"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full border border-amethyst/40 bg-gradient-to-r from-dark-purple to-amethyst px-4 py-2 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-105"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile hamburger menu */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open public navigation"
              className="rounded-full p-2 text-dark-purple/70 hover:bg-thistle/55 hover:text-amethyst focus:outline-none focus:ring-2 focus:ring-amethyst/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden border-t border-amethyst/20 bg-white px-4 pb-4 pt-2 shadow-inner"
          >
            {publicLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive(link.path) ? 'page' : undefined}
                className={`block rounded-xl px-3 py-2.5 text-base font-semibold ${
                  isActive(link.path)
                    ? 'bg-thistle/70 text-dark-purple'
                    : 'text-dark-purple/75 hover:text-amethyst hover:bg-thistle/55'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-amethyst/20 space-y-2">
              {user ? (
                <>
                  <Link
                    to={getDashboardRedirect()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center w-full px-4 py-2.5 bg-gradient-to-r from-dark-purple to-amethyst hover:brightness-105 text-white rounded-md text-base font-medium shadow"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center space-x-1.5 w-full px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-base font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center px-4 py-2.5 border border-amethyst/30 text-dark-purple rounded-md text-base font-medium hover:bg-thistle/55"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center px-4 py-2.5 bg-gradient-to-r from-dark-purple to-amethyst text-white rounded-md text-base font-medium hover:brightness-105"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
