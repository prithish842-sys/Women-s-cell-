import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { LifeBuoy } from 'lucide-react';

export const StudentWellbeingSupport: React.FC = () => {
  const [form, setForm] = useState({ supportType: 'COUNSELLOR_CALL', preferredDate: '', preferredTime: '', reasonCategory: '', note: '' });
  const [requests, setRequests] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/wellbeing/me/counselling-requests');
    setRequests(res.data.data || []);
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      await api.post('/wellbeing/me/counselling-requests', form);
      setMessage('Support request submitted.');
      setForm({ supportType: 'COUNSELLOR_CALL', preferredDate: '', preferredTime: '', reasonCategory: '', note: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not submit support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 fade-in-up lg:grid-cols-[1fr_360px]">
      <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-maroon-700">Need to talk to someone?</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Request human support. Your AI chat is not attached automatically.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-bold uppercase text-gray-500">Support Type
            <select value={form.supportType} onChange={e => setForm({ ...form, supportType: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
              <option value="COUNSELLOR_CALL">Counsellor Call</option>
              <option value="IN_PERSON_MEETING">In-Person Meeting</option>
              <option value="SUPPORT_INFORMATION">Support Information</option>
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase text-gray-500">Preferred Day
              <input type="date" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800" />
            </label>
            <label className="block text-xs font-bold uppercase text-gray-500">Preferred Time
              <input value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} placeholder="Morning, after class..." className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800" />
            </label>
          </div>
          <label className="block text-xs font-bold uppercase text-gray-500">Reason Category
            <input required value={form.reasonCategory} onChange={e => setForm({ ...form, reasonCategory: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800" />
          </label>
          <label className="block text-xs font-bold uppercase text-gray-500">Optional Short Note
            <textarea rows={5} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800" />
          </label>
          {message && <p className="text-sm font-semibold text-success-green">{message}</p>}
          {error && <p className="text-sm font-semibold text-error-red">{error}</p>}
          <button disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><LifeBuoy className="h-4 w-4" />{submitting ? 'Submitting...' : 'Request Support'}</button>
        </div>
      </form>
      <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-maroon-700">My Requests</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No counselling support requests yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map(row => (
              <div key={row._id} className="rounded-md border border-gray-200 p-3">
                <p className="text-sm font-bold text-maroon-700">{row.reasonCategory}</p>
                <p className="text-xs text-gray-500">{row.supportType.replaceAll('_', ' ')} · {row.status}</p>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};
