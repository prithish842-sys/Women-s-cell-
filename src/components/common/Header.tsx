import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Languages, Menu, X, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLanguage } from '../../contexts/LanguageContext.js';

const publicLinks = [
  { labelKey: 'home', path: '/' },
  { labelKey: 'about', path: '/about' },
  { labelKey: 'singaPenClub', path: '/members' },
  { labelKey: 'schemes', path: '/schemes' },
  { labelKey: 'skills', path: '/skills' },
  { labelKey: 'safety', path: '/safety' },
  { labelKey: 'gallery', path: '/gallery' },
] as const;

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  const dashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN' || user.role === 'ICC_ADMIN') return '/admin/dashboard';
    if (user.role === 'FACULTY') return '/faculty/dashboard';
    if (user.role === 'STUDENT') return '/student/dashboard';
    return '/';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe5f5] bg-white">
      <div className="reference-container flex h-[56px] items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Singa Pen Portal home">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#0b63ff,#7b2cff_52%,#ed1472)] text-[14px] font-black text-white shadow-[0_8px_18px_rgba(30,80,210,0.25)]">
            SP
          </span>
          <div className="flex flex-col">
            <span className="text-[1.3rem] font-black leading-none tracking-[-0.02em] text-[#06123a]">
              Singa Pen <span className="font-semibold text-[#0b63ff]">Portal</span>
            </span>
            <span className="text-[0.65rem] font-bold text-[#5c6d8a] uppercase tracking-wider mt-1">
              Sankara College of Science and Commerce
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              aria-current={isActive(link.path) ? 'page' : undefined}
              className={`relative py-5 text-[0.78rem] font-black text-[#06123a] transition-colors hover:text-[#075cff] ${
                isActive(link.path) ? 'text-[#075cff] after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:rounded-full after:bg-[#075cff]' : ''
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button type="button" onClick={toggleLanguage} className="inline-flex items-center gap-2 rounded-md border border-[#cfd8ea] px-4 py-2.5 text-[0.82rem] font-black text-[#06123a]" aria-label="Switch language">
            <Languages className="h-4 w-4" /> {language === 'en' ? t('languageEnglish') : t('languageTamil')}
          </button>
          {user ? (
            <>
              <Link to={dashboardPath()} className="rounded-md border border-[#cfd8ea] px-5 py-2.5 text-[0.82rem] font-black text-[#06123a]">
                {t('dashboard')}
              </Link>
              <button onClick={handleLogout} className="grid h-10 w-10 place-items-center rounded-md border border-[#ffd4df] text-[#e41165]" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md border border-[#cfd8ea] px-5 py-2.5 text-[0.82rem] font-black text-[#06123a]">
                {t('signIn')}
              </Link>
              <Link to="/register" className="rounded-md bg-[#e91670] px-5 py-2.5 text-[0.82rem] font-black text-white shadow-[0_10px_22px_rgba(233,22,112,0.18)]">
                {t('register')}
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-md border border-[#cfd8ea] text-[#06123a] lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#dbe5f5] bg-white lg:hidden"
          >
            <div className="grid gap-1 px-4 py-3">
              {publicLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-black ${isActive(link.path) ? 'bg-blue-50 text-[#075cff]' : 'text-[#06123a]'}`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#edf2fb] pt-3">
                <button type="button" onClick={toggleLanguage} className="col-span-2 rounded-md border border-[#cfd8ea] px-4 py-2 text-center text-sm font-black">
                  {language === 'en' ? t('languageEnglish') : t('languageTamil')}
                </button>
                {user ? (
                  <>
                    <Link to={dashboardPath()} onClick={() => setMobileMenuOpen(false)} className="rounded-md border border-[#cfd8ea] px-4 py-2 text-center text-sm font-black">
                      {t('dashboard')}
                    </Link>
                    <button onClick={handleLogout} className="rounded-md bg-[#e91670] px-4 py-2 text-sm font-black text-white">{t('signOut')}</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-md border border-[#cfd8ea] px-4 py-2 text-center text-sm font-black">
                      {t('signIn')}
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-md bg-[#e91670] px-4 py-2 text-center text-sm font-black text-white">
                      {t('register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
