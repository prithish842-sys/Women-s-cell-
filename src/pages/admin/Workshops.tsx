import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { CalendarDays, CheckCircle2, Plus, RefreshCw, Send, Trash2, Users, XCircle } from 'lucide-react';

const emptyWorkshop = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  category: 'SKILL_DEVELOPMENT',
  startDateTime: '',
  endDateTime: '',
  venue: '',
  organizer: '',
  targetAudience: '',
  posterImage: '',
  registrationUrl: '',
  maximumParticipants: '',
  isFeatured: false,
  isPublished: false,
};

export const AdminWorkshops: React.FC = () => {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyWorkshop);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/workshops');
      setWorkshops(res.data.data || []);
    } catch {
      setError('Could not load workshops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.post('/admin/workshops', {
      ...form,
      startDateTime: new Date(form.startDateTime).toISOString(),
      endDateTime: new Date(form.endDateTime).toISOString(),
      maximumParticipants: form.maximumParticipants ? Number(form.maximumParticipants) : null,
      registrationUrl: form.registrationUrl || '',
    });
    setForm(emptyWorkshop);
    await load();
  };

  const patch = async (id: string, action: string) => {
    await api.patch(`/admin/workshops/${id}/${action}`);
    await load();
  };

  const remove = async (id: string) => {
    await api.delete(`/admin/workshops/${id}`);
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Workshops</h1>
          <p className="text-xs text-gray-500">Manage workshop calendar entries and participation status.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-xs font-bold text-maroon-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <Link to="/admin/workshop-registrations" className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-xs font-bold text-maroon-700">
          <Users className="w-4 h-4" /> All Registrations
        </Link>
      </section>

      <form onSubmit={submit} className="bg-white border border-gray-150 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-maroon-700"><Plus className="w-4 h-4" /> Create Workshop</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border rounded-md text-sm bg-white">
            {['SKILL_DEVELOPMENT','AWARENESS','ENTREPRENEURSHIP','CAREER','SAFETY','HEALTH','COMPETITION','LEADERSHIP','OTHER'].map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <input required placeholder="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input required placeholder="Organizer" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input type="datetime-local" required value={form.startDateTime} onChange={e => setForm({ ...form, startDateTime: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input type="datetime-local" required value={form.endDateTime} onChange={e => setForm({ ...form, endDateTime: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input placeholder="Poster image URL" value={form.posterImage} onChange={e => setForm({ ...form, posterImage: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input placeholder="Registration URL" value={form.registrationUrl} onChange={e => setForm({ ...form, registrationUrl: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input type="number" min={1} placeholder="Max participants" value={form.maximumParticipants} onChange={e => setForm({ ...form, maximumParticipants: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <textarea required placeholder="Short description" value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} className="px-3 py-2 border rounded-md text-sm min-h-20" />
          <textarea required placeholder="Full description" value={form.fullDescription} onChange={e => setForm({ ...form, fullDescription: e.target.value })} className="md:col-span-2 px-3 py-2 border rounded-md text-sm min-h-20" />
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-600">
          <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
        </label>
        <button className="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-maroon-700 text-white rounded-md text-xs font-bold">
          <Plus className="w-4 h-4" /> Save Workshop
        </button>
      </form>

      <section className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
        {loading ? <div className="h-32 bg-gray-50 border rounded-xl animate-pulse" /> : error ? <p className="text-red-600 text-sm">{error}</p> : workshops.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No workshops created yet.</div>
        ) : (
          <div className="divide-y">
            {workshops.map(workshop => (
              <div key={workshop._id} className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-maroon-700" />
                    <h3 className="font-serif font-bold text-maroon-700">{workshop.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100">{workshop.status}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-maroon-50 text-maroon-700">{workshop.interestedCount || 0} registered/interested</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">{workshop.attendedCount || 0} attended</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{workshop.shortDescription}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{new Date(workshop.startDateTime).toLocaleString()} · {workshop.venue}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/workshops/${workshop._id}/registrations`} className="px-3 py-1.5 border rounded text-xs font-bold inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Registrations</Link>
                  {!workshop.isPublished && <button onClick={() => patch(workshop._id, 'publish')} className="px-3 py-1.5 bg-maroon-700 text-white rounded text-xs font-bold inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Publish</button>}
                  <button onClick={() => patch(workshop._id, 'complete')} className="px-3 py-1.5 border rounded text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</button>
                  <button onClick={() => patch(workshop._id, 'cancel')} className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs font-bold inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
                  <button onClick={() => remove(workshop._id)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
