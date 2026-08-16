import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { LogIn, ShieldAlert, Key, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { PageWrapper, InteractiveButton } from '../../components/common/PageWrapper.js';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle auto redirect if user already logged in
  React.useEffect(() => {
    if (user) {
      redirectUser(user.role);
    }
  }, [user]);

  const redirectUser = (role: string) => {
    const state = location.state as { returnTo?: string; registerWorkshopId?: string } | null;
    if (state?.returnTo && state.returnTo.startsWith('/') && !state.returnTo.startsWith('//')) {
      navigate(state.returnTo, {
        replace: true,
        state: state.registerWorkshopId ? { registerWorkshopId: state.registerWorkshopId } : null,
      });
      return;
    }

    switch (role) {
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      case 'FACULTY':
        navigate('/faculty/dashboard');
        break;
      case 'STUDENT':
        navigate('/student/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please supply both your Identifier and Password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (res.success) {
        // User state will update and useEffect redirect will handle it, 
        // but let's fetch role directly or wait
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      console.error('Login action failed:', err);
      setErrorMsg('Connection to campus authentication server timed out.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-2xl border-2 border-gold-600 shadow-xl p-8 space-y-6"
        >
          {/* Banner */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-rose-50 text-maroon-700 border border-gold-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-maroon-700">Member Sign In</h1>
            <p className="text-xs text-gray-500">
              Women's Empowerment Cell & Singa Pen executive club management console.
            </p>
          </div>

          {/* Display Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex items-start space-x-2 animate-pulse">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                Identifier Key
              </label>
              <input
                type="text"
                required
                placeholder="Email, Register No, or Staff ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-maroon-700 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-gray-400">
                Students use register number. Faculty and admins may use issued email or ID.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-maroon-700 focus:outline-none transition-all"
              />
            </div>

            <InteractiveButton
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center space-x-2 w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-white rounded-md text-sm font-bold shadow-md transition-colors disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Verifying...' : 'Sign In'}</span>
            </InteractiveButton>
          </form>

          {/* Helpful account access details */}
          <div className="pt-6 border-t border-gray-100 text-center text-xs space-y-3.5">
            <p className="text-gray-500">
              Don't have a student profile?{' '}
              <Link to="/register" className="text-rose-600 hover:text-maroon-700 font-bold underline">
                Self-Register Now
              </Link>
            </p>

            <div className="bg-cream-100/50 p-3 rounded-lg border border-gold-600/30 text-[10px] text-gray-600 leading-normal space-y-1">
              <p className="font-bold uppercase tracking-wider text-maroon-700 text-[9px]">Secure Account Access</p>
              <p>Use only credentials issued by the Women's Empowerment Cell portal administrator.</p>
              <p>Faculty login accounts are provisioned from the admin faculty registry.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};
