import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { UserPlus, ShieldAlert, BookOpen, User, Key, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PageWrapper, InteractiveButton } from '../../components/common/PageWrapper.js';
import { RegistrationWelcomeOverlay } from '../../components/auth/RegistrationWelcomeOverlay.js';

type RegistrationState = 'IDLE' | 'REGISTERING' | 'SUCCESS_ANIMATION' | 'REDIRECTING' | 'ERROR';

export const Register: React.FC = () => {
  const { registerStudent, user } = useAuth();
  const navigate = useNavigate();
  const [registrationState, setRegistrationState] = useState<RegistrationState>('IDLE');
  const [welcomeName, setWelcomeName] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && registrationState !== 'SUCCESS_ANIMATION' && registrationState !== 'REDIRECTING') {
      navigate('/student/dashboard');
    }
  }, [navigate, registrationState, user]);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [joiningAcademicYear, setJoiningAcademicYear] = useState('2024-2025');
  const [courseDurationYears, setCourseDurationYears] = useState(3);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain both letters and numbers.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!/^\+?[0-9]{10,14}$/.test(phone)) {
      errors.phone = 'Please provide a valid phone number (10-14 digits).';
    }

    if (!email.toLowerCase().endsWith('@college.edu') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Must be a valid college email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');
    setFieldErrors({});

    if (!validateForm()) return;

    setSubmitting(true);
    setRegistrationState('REGISTERING');
    const joiningStartYear = Number(joiningAcademicYear.split('-')[0]) || new Date().getFullYear();
    const durationYears = Number(courseDurationYears) || 3;
    const derivedPassingYear = joiningStartYear + durationYears;
    const registerPayload = {
      name,
      email: email.toLowerCase().trim(),
      registerNumber: registerNumber.toUpperCase().trim(),
      phone,
      department,
      course,
      joiningAcademicYear,
      expectedPassingYear: derivedPassingYear,
      expectedCompletionDate: `${derivedPassingYear}-04-30`,
      courseDurationYears: durationYears,
      password,
      confirmPassword
    };

    try {
      const res = await registerStudent(registerPayload);
      if (res.success) {
        setWelcomeName(name.trim());
        setRegistrationState('SUCCESS_ANIMATION');
      } else {
        setRegistrationState('ERROR');
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setRegistrationState('ERROR');
      setErrorMsg('A network error occurred. Please verify your data and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const finishWelcome = () => {
    setRegistrationState('REDIRECTING');
    navigate('/student/dashboard', { replace: true });
  };

  return (
    <PageWrapper>
      {registrationState === 'SUCCESS_ANIMATION' && (
        <RegistrationWelcomeOverlay studentName={welcomeName} onComplete={finishWelcome} />
      )}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-2xl border-2 border-gold-600 shadow-xl p-6 sm:p-8 space-y-6"
        >
          {/* Banner */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-rose-50 text-maroon-700 border border-gold-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-maroon-700">Student Self-Registration</h1>
            <p className="text-xs text-gray-500">
              Create your Singa Pen skill profile instantly. No admin activation wait required.
            </p>
          </div>

          {/* Global Error message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex items-start space-x-2 animate-pulse">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-maroon-700 border-b border-gray-150 pb-1.5 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Priyanka Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Register Number (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="REG401"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">College Email</label>
                <input
                  type="email"
                  required
                  placeholder="priyanka@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
                {fieldErrors.email && <p className="text-[10px] text-red-600">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  required
                  placeholder="9840123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
                {fieldErrors.phone && <p className="text-[10px] text-red-600">{fieldErrors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program Details */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-maroon-700 border-b border-gray-150 pb-1.5 flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Academic Course & Timeline</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Department</label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Course / Degree</label>
                <input
                  type="text"
                  required
                  placeholder="B.Sc Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Joining Academic Year</label>
                <input
                  type="text"
                  required
                  placeholder="2024-2025"
                  value={joiningAcademicYear}
                  onChange={(e) => setJoiningAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Course Duration (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={courseDurationYears}
                  onChange={(e) => setCourseDurationYears(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <p className="sm:col-span-2 rounded-md border border-gray-150 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Passing year and course completion date are calculated from joining year and course duration.
              </p>
            </div>
          </div>

          {/* Section 3: Password Credentials */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-maroon-700 border-b border-gray-150 pb-1.5 flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Security Password</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
                {fieldErrors.password ? (
                  <p className="text-[10px] text-red-600">{fieldErrors.password}</p>
                ) : (
                  <p className="text-[9px] text-gray-400">At least 8 characters, containing both letters and numbers.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-[10px] text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          <InteractiveButton
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center space-x-2 w-full py-3.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-md text-sm font-bold shadow-md transition-colors disabled:opacity-50 pt-3"
          >
            <CheckCircle className="w-4.5 h-4.5" />
            <span>{registrationState === 'REDIRECTING' ? 'Opening Dashboard...' : submitting ? 'Creating Profile...' : 'Complete Registration'}</span>
          </InteractiveButton>
        </form>

        <div className="pt-6 border-t border-gray-100 text-center text-xs">
          <p className="text-gray-500">
            Already registered?{' '}
            <Link to="/login" className="text-rose-600 hover:text-maroon-700 font-bold underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  </PageWrapper>
);
};
