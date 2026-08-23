import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api.js';
import { CheckCircle2, FileText, RefreshCw, Search } from 'lucide-react';

type ReviewMode = 'faculty' | 'admin';

const statuses = ['ALL', 'SUBMITTED', 'REVIEWED', 'FOLLOW_UP_REQUIRED', 'COMPLETED'];

const statusClass = (status: string) => {
  switch (status) {
    case 'REVIEWED': return 'bg-green-50 text-green-700 border-green-200';
    case 'FOLLOW_UP_REQUIRED': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-rose-50 text-maroon-700 border-rose-200';
  }
};

export const RoleUpdatesReviewPanel: React.FC<{ mode: ReviewMode }> = ({ mode }) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ALL');
  const [student, setStudent] = useState('ALL');
  const [functionalRole, setFunctionalRole] = useState('ALL');
  const [activeId, setActiveId] = useState('');

  const base = mode === 'admin' ? '/admin/role-updates' : '/faculty/role-updates';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.set('status', status);
      if (student !== 'ALL') params.set('studentId', student);
      if (functionalRole !== 'ALL') params.set('functionalRole', functionalRole);
      const res = await api.get(`${base}${params.toString() ? `?${params.toString()}` : ''}`);
      setUpdates(res.data.data.updates || []);
      setSummary(res.data.data.summary || {});
    } catch {
      setError('Could not load student in-charge updates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, student, functionalRole]);

  const students = useMemo(() => {
    const map = new Map<string, string>();
    updates.forEach(update => {
      if (update.student?._id) map.set(update.student._id, update.student.name);
    });
    return [...map.entries()];
  }, [updates]);

  const roles = useMemo(() => [...new Set(updates.map(update => update.functionalRole).filter(Boolean))], [updates]);

  const markStatus = async (id: string, nextStatus: 'REVIEWED' | 'FOLLOW_UP_REQUIRED' | 'COMPLETED') => {
    setActiveId(id);
    try {
      await api.patch(`${base}/${id}/status`, { status: nextStatus });
      await load();
    } finally {
      setActiveId('');
    }
  };

  return (
    <div className="space-y-5 fade-in-up">
      <section className="flex flex-col gap-4 rounded-[20px] bg-[linear-gradient(110deg,#eef3ff,#f4f1ff)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-[#071426]">{mode === 'faculty' ? 'Student In-Charges & Approvals' : 'Student In-Charge Updates'}</h1>
          <p className="mt-1 text-xs font-semibold text-[#52617f]">Review responsibility updates submitted by Women Empowerment Cell student office bearers.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Submitted', summary?.submitted || 0],
          ['Reviewed', summary?.reviewed || 0],
          ['Follow-up', summary?.followUpRequired || 0],
          ['Completed', summary?.completed || 0],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-maroon-700">{value as number}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-[#e4eaff] bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Status</span>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            {statuses.map(item => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Student In-Charge</span>
          <select value={student} onChange={e => setStudent(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="ALL">All students</option>
            {students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Functional Role</span>
          <select value={functionalRole} onChange={e => setFunctionalRole(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="ALL">All roles</option>
            {roles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </label>
      </section>

      {loading ? <div className="h-64 animate-pulse rounded-xl border bg-white" /> : error ? <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p> : (
        <section className="space-y-4">
          {updates.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
              <Search className="mx-auto mb-3 h-7 w-7 text-gray-400" /> No role updates found.
            </div>
          ) : updates.map(update => (
            <article key={update._id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{update.student?.name} · {update.officialPosition}</p>
                  <h2 className="font-serif text-xl font-bold text-maroon-700">{update.title}</h2>
                  <p className="text-sm font-semibold text-gray-700">{update.functionalRole}</p>
                  <p className="text-xs text-gray-500">Activity date: {new Date(update.activityDate).toLocaleDateString()} · Submitted: {new Date(update.createdAt).toLocaleString()}</p>
                </div>
                <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(update.status)}`}>{update.status.replace(/_/g, ' ')}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3 md:col-span-2">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Activity Summary</p>
                  <p className="mt-1 text-gray-700">{update.activitySummary}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Students Reached</p>
                  <p className="mt-1 font-bold text-maroon-700">{update.studentsReached ?? 'Not specified'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Topics / Focus Areas</p>
                  <p className="mt-1 text-gray-700">{update.topics || 'Not specified'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Student Feedback / Outcome</p>
                  <p className="mt-1 text-gray-700">{update.feedback || 'Not specified'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Follow-up</p>
                  <p className="mt-1 text-gray-700">{update.followUp || 'Not specified'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <button disabled={activeId === update._id} onClick={() => markStatus(update._id, 'REVIEWED')} className="inline-flex items-center gap-1.5 rounded-md bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" /> Mark Reviewed
                </button>
                <button disabled={activeId === update._id} onClick={() => markStatus(update._id, 'FOLLOW_UP_REQUIRED')} className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                  <FileText className="h-4 w-4" /> Follow-up Required
                </button>
                <button disabled={activeId === update._id} onClick={() => markStatus(update._id, 'COMPLETED')} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold disabled:opacity-60">
                  Completed
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};
