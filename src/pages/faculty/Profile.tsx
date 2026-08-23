import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  KeyRound,
  Languages,
  LockKeyhole,
  Moon,
  Save,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext.js';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { FacultyProfileHero } from '../../components/faculty/FacultyProfileHero.js';

export const FacultyProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const faculty = profile as any;
  const profileImage = resolveUploadUrl(faculty?.profileImage);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }

    setSaving(true);

    try {
      const response = await api.put('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not update password.');
      }

      setMessage('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (err as Error).message ||
          'Could not update password.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 fade-in-up">
      <FacultyProfileHero
        name={user?.name}
        email={user?.email}
        staffId={faculty?.staffId || user?.staffId}
        department={faculty?.department}
        designation={faculty?.designation}
        profileImage={profileImage}
        isActive={user?.isActive}
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <form
          onSubmit={submitPassword}
          className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ff] text-[#4f46e5]">
              <KeyRound className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-lg font-black text-[#071426]">
                Password & Security
              </h2>

              <p className="mt-1 text-xs font-semibold text-[#64748b]">
                Profile and Settings are merged here. Change your password without leaving the profile page.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-xs font-bold text-[#52617f]">
              Current password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm outline-none focus:border-[#6d5dfc]"
              />
            </label>

            <label className="block text-xs font-bold text-[#52617f]">
              New password
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm outline-none focus:border-[#6d5dfc]"
              />
            </label>

            <label className="block text-xs font-bold text-[#52617f]">
              Confirm new password
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm outline-none focus:border-[#6d5dfc]"
              />
            </label>

            {message ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-[#059669]">
                <CheckCircle className="h-4 w-4" />
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-[#dc2626]">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>

        <aside className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ecfdf5] text-[#059669]">
              <ShieldCheck className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-lg font-black text-[#071426]">
                Account Preferences
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">
                Faculty account controls now live in one place.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <PreferenceRow
              icon={<Languages className="h-4 w-4" />}
              title="Language"
              copy="Use the EN / TA switch in the dashboard header."
            />
            <PreferenceRow
              icon={<Moon className="h-4 w-4" />}
              title="Theme"
              copy="Use the light / dark theme button in the dashboard header."
            />
            <PreferenceRow
              icon={<Bell className="h-4 w-4" />}
              title="Notifications"
              copy="Open notifications from the bell beside your profile icon."
            />
            <PreferenceRow
              icon={<LockKeyhole className="h-4 w-4" />}
              title="Privacy"
              copy="Faculty access remains restricted to permitted academic, contact and review data."
            />
          </div>
        </aside>
      </section>
    </div>
  );
};

const PreferenceRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  copy: string;
}> = ({ icon, title, copy }) => (
  <div className="flex gap-3 rounded-xl border border-[#edf2fb] bg-[#fbfcff] p-4">
    <span className="mt-0.5 text-[#2563eb]">{icon}</span>
    <div>
      <p className="text-sm font-black text-[#071426]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#64748b]">{copy}</p>
    </div>
  </div>
);

export default FacultyProfile;
