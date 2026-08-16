import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api.js';
import { Briefcase, Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';

const emptyForm = {
  title: '',
  organization: '',
  opportunityType: 'INTERNSHIP',
  location: '',
  description: '',
  eligibility: '',
  requiredSkills: '',
  officialUrl: '',
  applicationDeadline: '',
  isFeatured: false,
  status: 'DRAFT',
};

export const AdminOpportunities: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const requiredSkills = useMemo(() => form.requiredSkills.split(',').map((skill: string) => skill.trim()).filter(Boolean), [form.requiredSkills]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/opportunities');
      setRows(res.data.data || []);
    } catch {
      setError('Could not load jobs and internships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const payload = { ...form, requiredSkills, applicationDeadline: form.applicationDeadline || null };
    try {
      if (editingId) await api.put(`/admin/opportunities/${editingId}`, payload);
      else await api.post('/admin/opportunities', payload);
      setForm(emptyForm);
      setEditingId(null);
      setMessage('Opportunity saved.');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save opportunity.');
    }
  };

  const edit = (row: any) => {
    setEditingId(row._id);
    setForm({ ...emptyForm, ...row, requiredSkills: (row.requiredSkills || []).join(', '), applicationDeadline: row.applicationDeadline?.slice(0, 10) || '' });
  };

  const remove = async (id: string) => {
    await api.delete(`/admin/opportunities/${id}`);
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-matte-beige pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-matte-maroon">Jobs & Internships</h1>
          <p className="text-xs text-matte-charcoal/60">Persist official opportunities entered by authorized admins.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold text-matte-maroon"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </section>

      {(error || message) && <div className={`rounded-xl border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-matte-beige bg-matte-cream text-matte-maroon'}`}>{error || message}</div>}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-matte-maroon"><Plus className="h-4 w-4" /> {editingId ? 'Edit Opportunity' : 'Add Opportunity'}</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input required placeholder="Role title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input required placeholder="Organization" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <select value={form.opportunityType} onChange={e => setForm({ ...form, opportunityType: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm"><option>INTERNSHIP</option><option>JOB</option></select>
          <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="date" value={form.applicationDeadline} onChange={e => setForm({ ...form, applicationDeadline: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>
          <input required type="url" placeholder="Official application link" value={form.officialUrl} onChange={e => setForm({ ...form, officialUrl: e.target.value })} className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="Required skills, comma separated" value={form.requiredSkills} onChange={e => setForm({ ...form, requiredSkills: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
          <textarea required placeholder="Eligibility" value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-matte-charcoal/70"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label>
        <button className="ml-3 rounded-md bg-matte-maroon px-4 py-2 text-xs font-bold text-white">Save</button>
      </form>

      {loading ? <div className="h-36 animate-pulse rounded-xl border bg-white" /> : rows.length === 0 ? <div className="rounded-xl border bg-white p-10 text-center text-sm text-matte-charcoal/60">No opportunities added yet.</div> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map(row => (
            <article key={row._id} className="rounded-xl border border-matte-beige bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-serif text-lg font-bold text-matte-maroon"><Briefcase className="mr-1 inline h-4 w-4" />{row.title}</h3><p className="text-xs text-matte-charcoal/60">{row.organization} · {row.opportunityType} · {row.status}</p></div>
                <div className="flex gap-1"><button onClick={() => edit(row)} className="rounded p-2 hover:bg-matte-cream" aria-label={`Edit ${row.title}`}><Edit2 className="h-4 w-4" /></button><button onClick={() => remove(row._id)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${row.title}`}><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <p className="mt-3 text-sm text-matte-charcoal/75">{row.description}</p>
              <a href={row.officialUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-matte-maroon underline">Official link</a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
