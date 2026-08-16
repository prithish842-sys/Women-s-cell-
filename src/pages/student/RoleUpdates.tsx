import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { CalendarDays, CheckCircle2, FileText, RefreshCw, Send, ShieldCheck } from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  title: '',
  activityDate: today,
  activitySummary: '',
  studentsReached: '',
  topics: '',
  feedback: '',
  followUp: '',
  notes: '',
};

const statusClass = (status: string) => {
  switch (status) {
    case 'REVIEWED': return 'bg-green-50 text-green-700 border-green-200';
    case 'FOLLOW_UP_REQUIRED': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-rose-50 text-maroon-700 border-rose-200';
  }
};

export const StudentRoleUpdates: React.FC = () => {
  const [roleInfo, setRoleInfo] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students/me/role-updates');
      setRoleInfo(res.data.data.role);
      setUpdates(res.data.data.updates || []);
    } catch (err: any) {
      setError(err.response?.status === 403 ? 'Student in-charge access required.' : 'Could not load role updates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateField = (field: keyof typeof initialForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/students/me/role-updates', {
        ...form,
        studentsReached: form.studentsReached ? Number(form.studentsReached) : undefined,
      });
      setSuccess('Role update submitted successfully.');
      setForm(initialForm);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not submit role update.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-56 animate-pulse rounded-xl border bg-white" />;

  if (!roleInfo) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800">
        <p className="font-bold">{error || 'Student in-charge access required.'}</p>
        <Link to="/student/dashboard" className="mt-4 inline-flex rounded-md bg-maroon-700 px-4 py-2 text-xs font-bold text-white">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      <section className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">My Role Updates</h1>
          <p className="mt-1 text-xs text-gray-500">Submit activity reports for your Women Empowerment Cell responsibility.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </section>

      <section className="rounded-xl border border-gold-600/60 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gold-600/40 bg-rose-50 text-maroon-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">My Women Empowerment Cell Role</p>
            <h2 className="font-serif text-xl font-bold text-maroon-700">{roleInfo.officialPosition}</h2>
            <p className="text-sm font-semibold text-gray-700">{roleInfo.functionalRole}</p>
            <p className="text-xs text-gray-500">{roleInfo.primaryResponsibility}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {roleInfo.guidance.map((item: string) => (
                <span key={item} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-2">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 md:col-span-2">{error}</div>}
        {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700 md:col-span-2">{success}</div>}
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-gray-500">Update Title *</span>
          <input required minLength={5} maxLength={160} value={form.title} onChange={e => updateField('title', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Activity Date *</span>
          <input required type="date" value={form.activityDate} onChange={e => updateField('activityDate', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-gray-500">Students Reached / Participants</span>
          <input type="number" min={0} value={form.studentsReached} onChange={e => updateField('studentsReached', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-gray-500">Activity / Work Completed *</span>
          <textarea required minLength={20} rows={5} value={form.activitySummary} onChange={e => updateField('activitySummary', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </label>
        <textarea placeholder="Topics / focus areas" value={form.topics} onChange={e => updateField('topics', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <textarea placeholder="Student feedback / outcome" value={form.feedback} onChange={e => updateField('feedback', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <textarea placeholder="Follow-up required" value={form.followUp} onChange={e => updateField('followUp', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <textarea placeholder="Additional notes" value={form.notes} onChange={e => updateField('notes', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <div className="md:col-span-2 flex justify-end">
          <button disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-maroon-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Role Update'}
          </button>
        </div>
      </form>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-maroon-700">Recent Updates</h2>
        <div className="mt-4 divide-y">
          {updates.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No role updates submitted yet.</p>
          ) : updates.map(update => (
            <div key={update._id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-maroon-700" />
                  <h3 className="text-sm font-bold text-maroon-700">{update.title}</h3>
                </div>
                <p className="text-xs text-gray-500"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{new Date(update.activityDate).toLocaleDateString()}</p>
                <p className="line-clamp-2 text-xs text-gray-600">{update.activitySummary}</p>
              </div>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(update.status)}`}>
                {update.status.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
