import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { Edit2, Phone, Plus, RefreshCw, Trash2 } from 'lucide-react';

const categories = ['WOMEN_HELPLINE','CAMPUS_SECURITY','ICC','COUNSELLING','MEDICAL_SUPPORT','LEGAL_AID','ONE_STOP_CENTRE','PROTECTION_OFFICER','WORKING_WOMEN_HOSTEL','EMERGENCY_SERVICES','OTHER'];
const emptyForm = { name: '', category: 'WOMEN_HELPLINE', phone: '', email: '', address: '', district: '', availability: '', description: '', verifiedDate: '', isActive: true };

export const AdminSafetyDirectory: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/safety-directory');
      setContacts(res.data.data || []);
    } catch {
      setError('Could not load support contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, verifiedDate: form.verifiedDate || null };
    if (editingId) await api.put(`/admin/safety-directory/${editingId}`, payload);
    else await api.post('/admin/safety-directory', payload);
    setForm(emptyForm);
    setEditingId(null);
    await load();
  };

  const edit = (contact: any) => {
    setEditingId(contact._id);
    setForm({ ...emptyForm, ...contact, verifiedDate: contact.verifiedDate?.slice(0, 10) || '' });
  };

  const remove = async (id: string) => {
    await api.delete(`/admin/safety-directory/${id}`);
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-matte-beige pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-serif text-2xl font-bold text-matte-maroon">Safety & Support Directory</h1><p className="text-xs text-matte-charcoal/60">Verified public support contacts, without storing private case information.</p></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold text-matte-maroon"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </section>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-matte-maroon"><Plus className="h-4 w-4" /> {editingId ? 'Edit Contact' : 'Add Contact'}</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm">{categories.map(item => <option key={item}>{item}</option>)}</select>
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="date" value={form.verifiedDate} onChange={e => setForm({ ...form, verifiedDate: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="Availability" value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-md border px-3 py-2 text-sm md:col-span-3" />
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-matte-charcoal/70"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active and publishable</label>
        <button className="ml-3 rounded-md bg-matte-maroon px-4 py-2 text-xs font-bold text-white">Save</button>
      </form>
      {loading ? <div className="h-36 animate-pulse rounded-xl border bg-white" /> : contacts.length === 0 ? <div className="rounded-xl border bg-white p-10 text-center text-sm text-matte-charcoal/60">No support contacts added yet.</div> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {contacts.map(contact => (
            <article key={contact._id} className="rounded-xl border border-matte-beige bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-serif text-lg font-bold text-matte-maroon">{contact.name}</h3><p className="text-xs font-bold text-matte-charcoal/55">{contact.category} · {contact.isActive ? 'Active' : 'Inactive'}</p></div>
                <div className="flex gap-1"><button onClick={() => edit(contact)} className="rounded p-2 hover:bg-matte-cream" aria-label={`Edit ${contact.name}`}><Edit2 className="h-4 w-4" /></button><button onClick={() => remove(contact._id)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${contact.name}`}><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <p className="mt-2 text-sm text-matte-charcoal/70">{contact.description || 'No description'}</p>
              <p className="mt-3 text-xs text-matte-charcoal/60"><Phone className="mr-1 inline h-3.5 w-3.5 text-matte-rose" />{contact.phone || 'Phone not listed'} · {contact.availability || 'Availability not listed'}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
