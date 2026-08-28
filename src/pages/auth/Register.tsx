import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldAlert,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';

import { useAuth } from '../../contexts/AuthContext.js';

import {
  InteractiveButton,
  PageWrapper,
} from '../../components/common/PageWrapper.js';

import { RegistrationWelcomeOverlay } from '../../components/auth/RegistrationWelcomeOverlay.js';


type RegistrationState =
  | 'IDLE'
  | 'REGISTERING'
  | 'SUCCESS_ANIMATION'
  | 'REDIRECTING'
  | 'ERROR';

export const Register: React.FC = () => {
  const { registerStudent, user } =
    useAuth();

  const navigate = useNavigate();

  const [
    registrationState,
    setRegistrationState,
  ] = useState<RegistrationState>(
    'IDLE',
  );

  const [welcomeName, setWelcomeName] =
    useState('');

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [
    registerNumber,
    setRegisterNumber,
  ] = useState('');

  const [phone, setPhone] =
    useState('');

  const [department, setDepartment] =
    useState('');

  const [course, setCourse] =
    useState('');

  const [
    joiningAcademicYear,
    setJoiningAcademicYear,
  ] = useState('2024-2025');

  const [
    courseDurationYears,
    setCourseDurationYears,
  ] = useState(3);

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState('');

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (
      user &&
      registrationState !==
        'SUCCESS_ANIMATION' &&
      registrationState !==
        'REDIRECTING'
    ) {
      navigate(
        '/student/dashboard',
        {
          replace: true,
        },
      );
    }
  }, [
    navigate,
    registrationState,
    user,
  ]);

  const validateForm = () => {
    const errors: Record<
      string,
      string
    > = {};

    if (password.length < 8) {
      errors.password =
        'Password must be at least 8 characters.';
    } else if (
      !/^(?=.*[a-zA-Z])(?=.*\d)/.test(
        password,
      )
    ) {
      errors.password =
        'Password must contain both letters and numbers.';
    }

    if (
      password !== confirmPassword
    ) {
      errors.confirmPassword =
        'Passwords do not match.';
    }

    if (
      !/^\+?[0-9]{10,14}$/.test(
        phone,
      )
    ) {
      errors.phone =
        'Please provide a valid phone number (10-14 digits).';
    }

    if (
      !email
        .toLowerCase()
        .endsWith('@college.edu') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      errors.email =
        'Must be a valid college email address.';
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length ===
      0
    );
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setErrorMsg('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    setRegistrationState(
      'REGISTERING',
    );

    const joiningStartYear =
      Number(
        joiningAcademicYear.split(
          '-',
        )[0],
      ) ||
      new Date().getFullYear();

    const durationYears =
      Number(courseDurationYears) ||
      3;

    const derivedPassingYear =
      joiningStartYear +
      durationYears;

    const registerPayload = {
      name,
      email: email
        .toLowerCase()
        .trim(),
      registerNumber:
        registerNumber
          .toUpperCase()
          .trim(),
      phone,
      department,
      course,
      joiningAcademicYear,
      expectedPassingYear:
        derivedPassingYear,
      expectedCompletionDate: `${derivedPassingYear}-04-30`,
      courseDurationYears:
        durationYears,
      password,
      confirmPassword,
    };

    try {
      const res =
        await registerStudent(
          registerPayload,
        );

      if (res.success) {
        setWelcomeName(name.trim());

        setRegistrationState('SUCCESS_ANIMATION');
      } else {
        setRegistrationState(
          'ERROR',
        );

        setErrorMsg(
          res.message,
        );
      }
    } catch (error) {
      console.error(
        'Registration failed:',
        error,
      );

      setRegistrationState(
        'ERROR',
      );

      setErrorMsg(
        'A network error occurred. Please verify your data and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const finishWelcome = () => {
    setRegistrationState(
      'REDIRECTING',
    );

    navigate('/student/dashboard', { replace: true });
  };

  return (
    <PageWrapper>
      {registrationState === 'SUCCESS_ANIMATION' ? (
        <RegistrationWelcomeOverlay
          studentName={welcomeName}
          onComplete={finishWelcome}
        />
      ) : null}

      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f6f8fc] px-4 py-8 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[860px] rounded-[24px] border border-[#dce4f2] bg-white p-6 text-[#06123a] shadow-[0_24px_70px_rgba(7,20,38,0.12)] sm:p-8 lg:p-10"
        >
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7c3aed]">
              Sankara College of Science and Commerce
            </p>
            <p className="text-sm font-bold tracking-[0.1em] text-[#52617f] mt-1">
              Singa Pen Portal
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#06123a] sm:text-4xl">
              Create your account
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#52617f] sm:text-base">
              Complete your student details to join the Women's Empowerment Cell portal.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-[#075cff]">
              <GraduationCap className="h-5 w-5" />
              Student Registration
            </div>
          </div>

          {errorMsg ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                icon={User}
                label="Full Name"
                value={name}
                setValue={setName}
                placeholder="Enter your full name"
                autoComplete="name"
              />

              <Field
                icon={Mail}
                label="Email Address"
                value={email}
                setValue={setEmail}
                placeholder="Enter your email address"
                type="email"
                error={fieldErrors.email}
                autoComplete="email"
              />

              <Field
                icon={Phone}
                label="Mobile Number"
                value={phone}
                setValue={setPhone}
                placeholder="Enter mobile number"
                type="tel"
                error={fieldErrors.phone}
                prefix="+91"
                autoComplete="tel"
              />

              <Field
                icon={School}
                label="Register Number"
                value={registerNumber}
                setValue={setRegisterNumber}
                placeholder="Enter register number"
              />

              <Field
                icon={KeyRound}
                label="Password"
                value={password}
                setValue={setPassword}
                placeholder="Create a strong password"
                type={showPassword ? 'text' : 'password'}
                error={fieldErrors.password}
                autoComplete="new-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="grid h-8 w-8 place-items-center rounded-md text-[#8a97b4] transition hover:bg-blue-50 hover:text-[#075cff]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <Field
                icon={KeyRound}
                label="Confirm Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                placeholder="Confirm your password"
                type={showConfirmPassword ? 'text' : 'password'}
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="grid h-8 w-8 place-items-center rounded-md text-[#8a97b4] transition hover:bg-blue-50 hover:text-[#075cff]"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <Field
                icon={MapPin}
                label="Department"
                value={department}
                setValue={setDepartment}
                placeholder="Enter your department"
              />

              <Field
                icon={BookOpen}
                label="Course"
                value={course}
                setValue={setCourse}
                placeholder="Enter your course"
              />

              <Field
                icon={Calendar}
                label="Joining Academic Year"
                value={joiningAcademicYear}
                setValue={setJoiningAcademicYear}
                placeholder="2024-2025"
              />

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-[#33456e]">
                  Course Duration
                </span>

                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={courseDurationYears}
                  onChange={(event) =>
                    setCourseDurationYears(Number(event.target.value))
                  }
                  className="h-12 w-full rounded-xl border border-[#cfd8ea] bg-white px-3 text-sm font-semibold text-[#06123a] outline-none transition focus:border-[#075cff] focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#52617f]">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#cfd8ea] accent-[#e91670]"
              />

              <span>
                I agree to the{' '}
                <Link
                  to="/safety"
                  className="font-black text-[#075cff] hover:underline"
                >
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/safety"
                  className="font-black text-[#075cff] hover:underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            <InteractiveButton
              type="submit"
              disabled={submitting}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(100deg,#075cff,#7c3aed_48%,#e91670)] text-sm font-black text-white shadow-[0_12px_28px_rgba(64,61,224,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registrationState === 'REDIRECTING'
                ? 'Opening Dashboard...'
                : submitting
                  ? 'Creating Profile...'
                  : 'Create Account'}

              <ArrowRight className="h-4 w-4" />
            </InteractiveButton>
          </form>

          <div className="mt-6 border-t border-[#e8edf6] pt-5 text-center">
            <p className="text-sm font-semibold text-[#52617f]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-black text-[#075cff] hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </PageWrapper>
  );
};

interface FieldProps {
  label: string;
  value: string;
  setValue: (
    value: string,
  ) => void;
  placeholder: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  type?: string;
  error?: string;
  prefix?: string;
  suffix?: React.ReactNode;
  autoComplete?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  setValue,
  placeholder,
  icon: Icon,
  type = 'text',
  error,
  prefix,
  suffix,
  autoComplete,
}) => {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-[#33456e]">
        {label}
      </span>

      <span
        className={`relative flex h-12 items-center rounded-lg border bg-white transition ${
          error
            ? 'border-red-300 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-100'
            : 'border-[#cfd8ea] focus-within:border-[#075cff] focus-within:ring-4 focus-within:ring-blue-100'
        }`}
      >
        <Icon className="ml-3 h-4 w-4 shrink-0 text-[#8a97b4]" />

        {prefix ? (
          <span className="ml-2 border-r border-[#dbe4f2] pr-2 text-sm font-bold text-[#06123a]">
            {prefix}
          </span>
        ) : null}

        <input
          type={type}
          required
          value={value}
          onChange={(event) =>
            setValue(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-semibold text-[#06123a] outline-none placeholder:text-[#8a97b4]"
        />

        {suffix ? (
          <span className="mr-2 text-[#8a97b4]">
            {suffix}
          </span>
        ) : null}
      </span>

      {error ? (
        <p className="mt-1 text-[0.68rem] font-bold text-red-600">
          {error}
        </p>
      ) : null}
    </label>
  );
};

export default Register;
