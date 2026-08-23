import React, { useState } from 'react';
import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { Upload } from 'lucide-react';

export const AnonymousConcern: React.FC = () => {
  const [form, setForm] = useState({ category: '', description: '', incidentDate: '', location: '' });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setReference('');
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append('attachment', file);
      const res = await api.post('/safety/anonymous-concerns', payload);
      setReference(res.data.data.referenceNumber);
      setForm({ category: '', description: '', incidentDate: '', location: '' });
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not submit anonymous concern.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="font-serif text-3xl font-bold text-maroon-700">Anonymous Concern</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">Share a safety or wellbeing concern without providing your name, register number, email, or phone.</p>
            <div className="mt-6 space-y-4">
              <label className="block text-xs font-bold uppercase text-gray-500">Category *
                <input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800" />
              </label>
              <label className="block text-xs font-bold uppercase text-gray-500">Concern / Description *
                <textarea required minLength={20} rows={7} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase text-gray-500">Incident Date
                  <input type="date" value={form.incidentDate} onChange={e => setForm({ ...form, incidentDate: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800" />
                </label>
                <label className="block text-xs font-bold uppercase text-gray-500">Location
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800" />
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-gray-300 bg-cream-50 p-4 text-sm font-bold text-maroon-700">
                <Upload className="h-4 w-4" />
                <span>{file ? file.name : 'Optional attachment: JPG, PNG, WEBP, or PDF'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="sr-only" />
              </label>
              {error && <p className="text-sm font-semibold text-error-red">{error}</p>}
              {reference && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-success-green">Concern submitted. Reference: {reference}</p>}
              <button disabled={submitting} className="rounded-md bg-maroon-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit Anonymous Concern'}</button>
            </div>
          </form>
          <aside className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-maroon-700">Privacy Notice</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">This form does not ask for your name, register number, email, or phone, and the app does not attach your logged-in user ID to the submission.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-maroon-700">Important Disclaimer</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">Anonymous concern reporting is intended for awareness, guidance, or safety concerns. Formal complaints may require identifiable information depending on the applicable process.</p>
            </div>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
};
