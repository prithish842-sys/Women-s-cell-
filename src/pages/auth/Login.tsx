import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'motion/react';

import { useAuth } from '../../contexts/AuthContext.js';
import {
  InteractiveButton,
  PageWrapper,
} from '../../components/common/PageWrapper.js';


export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMsg, setErrorMsg] =
    useState('');

  const redirectUser = (role: string) => {
    const state = location.state as
      | {
          returnTo?: string;
          registerWorkshopId?: string;
        }
      | null;

    if (
      state?.returnTo &&
      state.returnTo.startsWith('/') &&
      !state.returnTo.startsWith('//')
    ) {
      navigate(state.returnTo, {
        replace: true,
        state: state.registerWorkshopId
          ? {
              registerWorkshopId:
                state.registerWorkshopId,
            }
          : null,
      });

      return;
    }

    if (role === 'ADMIN') {
      navigate('/admin/dashboard', {
        replace: true,
      });

      return;
    }

    if (role === 'FACULTY') {
      navigate('/faculty/dashboard', {
        replace: true,
      });

      return;
    }

    if (role === 'STUDENT') {
      navigate('/student/dashboard', {
        replace: true,
      });

      return;
    }

    navigate('/', {
      replace: true,
    });
  };

  useEffect(() => {
    if (user) {
      redirectUser(user.role);
    }
    // redirectUser depends on the current location state and navigate instance.
    // We intentionally run this when the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setErrorMsg('');

    if (
      !identifier.trim() ||
      !password.trim()
    ) {
      setErrorMsg(
        'Please supply both your Identifier and Password.',
      );

      return;
    }

    setSubmitting(true);

    try {
      const result = await login(
        identifier.trim(),
        password,
      );

      if (!result.success) {
        setErrorMsg(result.message);
      }
    } catch (error) {
      console.error(
        'Login action failed:',
        error,
      );

      setErrorMsg(
        'Connection to campus authentication server timed out.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f6f8fc] px-4 py-8 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[500px] rounded-[24px] border border-[#dce4f2] bg-white p-6 text-[#06123a] shadow-[0_24px_70px_rgba(7,20,38,0.12)] sm:p-8 lg:p-10"
        >
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7c3aed]">
              Sankara College of Science and Commerce
            </p>
            <p className="text-sm font-bold tracking-[0.1em] text-[#52617f] mt-1">
              Singa Pen Portal
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#06123a] sm:text-4xl">
              Welcome Back
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-[#52617f]">
              Sign in to continue to your account.
            </p>
          </div>

          {errorMsg ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#06123a]">
                Email or Mobile Number
              </span>

              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a97b4]" />

                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  placeholder="Enter your email or mobile number"
                  className="h-14 w-full rounded-xl border border-[#cfd8ea] bg-white pl-12 pr-4 text-sm font-semibold text-[#06123a] outline-none transition placeholder:text-[#8a97b4] focus:border-[#075cff] focus:ring-4 focus:ring-blue-100"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-[#06123a]">
                <span>Password</span>

                <Link
                  to="/safety"
                  className="text-xs font-bold text-[#e91670] hover:underline"
                >
                  Forgot Password?
                </Link>
              </span>

              <span className="relative block">
                <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a97b4]" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-14 w-full rounded-xl border border-[#cfd8ea] bg-white pl-12 pr-12 text-sm font-semibold text-[#06123a] outline-none transition placeholder:text-[#8a97b4] focus:border-[#075cff] focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#8a97b4] transition hover:bg-blue-50 hover:text-[#075cff]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-[#52617f]">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-[#cfd8ea] accent-[#075cff]"
              />
              <span>Remember me</span>
            </label>

            <InteractiveButton
              type="submit"
              disabled={submitting}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[linear-gradient(100deg,#075cff,#7c3aed_48%,#e91670)] text-sm font-black text-white shadow-[0_12px_28px_rgba(64,61,224,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Verifying...' : 'Sign In'}
              <ArrowRight className="h-5 w-5" />
            </InteractiveButton>
          </form>

          <div className="mt-7 border-t border-[#e8edf6] pt-5 text-center">
            <p className="text-sm font-semibold text-[#52617f]">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-black text-[#075cff] hover:underline"
              >
                Register now
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </PageWrapper>
  );
};

export default Login;