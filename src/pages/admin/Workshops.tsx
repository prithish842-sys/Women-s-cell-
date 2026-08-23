import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, Plus, RefreshCw, Send, Trash2, Users, XCircle } from 'lucide-react';
import { AdminNotice, AdminPageHeader, adminButton, adminCard, adminField } from '../../components/admin/AdminUI.js';

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
  registrationUrl: '',
  maximumParticipants: '',
  isFeatured: false,
  isPublished: false,
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminWorkshops: React.FC = () => {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyWorkshop);
  const [entryType, setEntryType] = useState<'Workshop' | 'Event'>('Workshop');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/workshops');
      setWorkshops(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load workshops and events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: first.getDay() }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)),
    ];
  }, [calendarMonth]);

  const workshopsByDate = useMemo(() => workshops.reduce<Record<string, any[]>>((map, workshop) => {
    const key = dateKey(new Date(workshop.startDateTime));
    map[key] = [...(map[key] || []), workshop];
    return map;
  }, {}), [workshops]);

  const selectCalendarDate = (date: Date) => {
    const key = dateKey(date);
    setSelectedDate(key);
    setForm((current: any) => ({
      ...current,
      startDateTime: `${key}T10:00`,
      endDateTime: `${key}T11:00`,
    }));
    window.setTimeout(() => document.getElementById('admin-workshop-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = new FormData();
      const targetAudience = form.targetAudience || (entryType === 'Event' ? 'Campus event participants' : 'Workshop participants');
      Object.entries({
        ...form,
        shortDescription: form.shortDescription || `${entryType}: ${form.title}`,
        fullDescription: form.fullDescription || form.shortDescription || `${entryType}: ${form.title}`,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: new Date(form.endDateTime).toISOString(),
        maximumParticipants: form.maximumParticipants ? Number(form.maximumParticipants) : '',
        registrationUrl: form.registrationUrl || '',
        targetAudience,
      }).forEach(([key, value]) => payload.append(key, String(value ?? '')));
      if (posterFile) payload.append('poster', posterFile);

      const res = await api.post('/admin/workshops', payload);
      if (!res.data.success) throw new Error(res.data.message || 'Could not save workshop.');
      setSuccess(`${entryType} saved to the shared calendar.`);
      setForm(emptyWorkshop);
      setPosterFile(null);
      setSelectedDate('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not save workshop.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, action: string) => {
    setError('');
    try {
      await api.patch(`/admin/workshops/${id}/${action}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || `Could not ${action} workshop.`);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this workshop/event and its registrations?')) return;
    try {
      await api.delete(`/admin/workshops/${id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not delete workshop.');
    }
  };

  const selectedItems = selectedDate ? (workshopsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-6 fade-in-up">
      <AdminPageHeader
        title="Workshops & Events"
        description="Use the live calendar to select a date, add an event/workshop, upload a poster, and manage registrations."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={load} className={adminButton}><RefreshCw className="h-4 w-4" /> Refresh</button>
            <Link to="/admin/workshop-registrations" className={adminButton}><Users className="h-4 w-4" /> Registrations</Link>
          </div>
        }
      />

      {error && <AdminNotice type="error" onRetry={load}>{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      <section className={`${adminCard} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-[#dfe7f6] text-[#1d4ed8]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-[#071247]">{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
            <p className="mt-1 text-xs font-semibold text-[#63708f]">Click a date to prefill the workshop/event form.</p>
          </div>
          <button type="button" onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-[#dfe7f6] text-[#1d4ed8]">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-[#63708f]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day} className="py-2">{day}</span>)}
          {calendarDays.map((day, index) => {
            if (!day) return <span key={`blank-${index}`} className="h-16" />;
            const key = dateKey(day);
            const active = selectedDate === key;
            const items = workshopsByDate[key] || [];
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectCalendarDate(day)}
                className={`relative min-h-16 rounded-xl border p-2 text-left transition ${
                  active
                    ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white'
                    : items.length
                      ? 'border-[#cbd8ff] bg-[#f2f5ff] text-[#10205a]'
                      : 'border-[#edf2fb] bg-white text-[#415176] hover:border-[#b7c8f4]'
                }`}
              >
                <span className="text-sm font-black">{day.getDate()}</span>
                {items.length > 0 && (
                  <span className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-black ${active ? 'bg-white/20 text-white' : 'bg-[#dbe6ff] text-[#1d4ed8]'}`}>
                    {items.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-4 rounded-xl border border-[#e4ebfb] bg-[#f7faff] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#2563eb]">Selected Date</p>
                <p className="mt-1 font-black text-[#071247]">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#415176]">{selectedItems.length} scheduled</span>
            </div>
            {selectedItems.length > 0 && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {selectedItems.map(item => (
                  <div key={item._id} className="rounded-lg bg-white p-3 text-xs">
                    <p className="font-black text-[#071247]">{item.title}</p>
                    <p className="mt-1 font-semibold text-[#63708f]">{item.category} · {item.venue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <form id="admin-workshop-form" onSubmit={submit} className={`${adminCard} scroll-mt-24 p-5`}>
        <div className="flex items-center gap-2 text-sm font-black text-[#071247]"><Plus className="h-4 w-4 text-[#2563eb]" /> Add Event / Workshop</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select value={entryType} onChange={e => setEntryType(e.target.value as 'Workshop' | 'Event')} className={adminField}>
            <option value="Workshop">Workshop</option>
            <option value="Event">Event</option>
          </select>
          <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={adminField} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={adminField}>
            {['SKILL_DEVELOPMENT','AWARENESS','ENTREPRENEURSHIP','CAREER','SAFETY','HEALTH','COMPETITION','LEADERSHIP','OTHER'].map(cat => <option key={cat} value={cat}>{cat.replaceAll('_', ' ')}</option>)}
          </select>
          <input required placeholder="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className={adminField} />
          <input required placeholder="Organizer" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} className={adminField} />
          <input type="datetime-local" required value={form.startDateTime} onChange={e => setForm({ ...form, startDateTime: e.target.value })} className={adminField} />
          <input type="datetime-local" required value={form.endDateTime} onChange={e => setForm({ ...form, endDateTime: e.target.value })} className={adminField} />
          <label className={`${adminField} flex cursor-pointer items-center gap-2`}>
            <ImagePlus className="h-4 w-4 text-[#2563eb]" />
            <span className="truncate">{posterFile?.name || 'Choose poster image'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <input placeholder="Target audience" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} className={adminField} />
          <input type="number" min={1} placeholder="Maximum participants" value={form.maximumParticipants} onChange={e => setForm({ ...form, maximumParticipants: e.target.value })} className={adminField} />
          <textarea required placeholder="Short description" value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} className={`${adminField} min-h-24`} />
          <textarea required placeholder="Full description" value={form.fullDescription} onChange={e => setForm({ ...form, fullDescription: e.target.value })} className={`${adminField} min-h-24 md:col-span-2`} />
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#415176]">
          <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
        </label>
        <button disabled={saving} className={`${adminButton} ml-3`}>
          <Plus className="h-4 w-4" /> {saving ? 'Saving...' : `Save ${entryType}`}
        </button>
      </form>

      <section className={`${adminCard} overflow-hidden`}>
        <div className="border-b border-[#edf2fb] px-5 py-4">
          <h2 className="text-lg font-black text-[#071247]">All Workshops & Events</h2>
          <p className="text-xs font-semibold text-[#63708f]">Shared records used by Admin, Faculty and Student workshop views.</p>
        </div>
        {loading ? (
          <div className="m-5 h-32 animate-pulse rounded-xl bg-[#f7faff]" />
        ) : workshops.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-[#63708f]">No workshops or events created yet.</div>
        ) : (
          <div className="divide-y divide-[#edf2fb]">
            {workshops.map(workshop => {
              const poster = resolveUploadUrl(workshop.posterImage);
              return (
                <article key={workshop._id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  {poster && <img src={poster} alt="" className="h-24 w-full rounded-xl object-cover lg:w-36" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#2563eb]" />
                      <h3 className="font-black text-[#071247]">{workshop.title}</h3>
                      <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-black text-[#1d4ed8]">{workshop.status}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#63708f]">{workshop.shortDescription}</p>
                    <p className="mt-1 text-[11px] font-bold text-[#40528a]">{new Date(workshop.startDateTime).toLocaleString()} · {workshop.venue}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black text-[#63708f]">
                      <span>{workshop.interestedCount || 0} registered/interested</span>
                      <span>{workshop.attendedCount || 0} attended</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/workshops/${workshop._id}/registrations`} className={adminButton}><Users className="h-3.5 w-3.5" /> Registrations</Link>
                    {!workshop.isPublished && <button type="button" onClick={() => patch(workshop._id, 'publish')} className={adminButton}><Send className="h-3.5 w-3.5" /> Publish</button>}
                    <button type="button" onClick={() => patch(workshop._id, 'complete')} className={adminButton}><CheckCircle2 className="h-3.5 w-3.5" /> Complete</button>
                    <button type="button" onClick={() => patch(workshop._id, 'cancel')} className={adminButton}><XCircle className="h-3.5 w-3.5" /> Cancel</button>
                    <button type="button" onClick={() => remove(workshop._id)} className={adminButton}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
