import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileUp, LockKeyhole, Send } from 'lucide-react';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';

const initialForm = {
  complainantPhone: '',
  category: 'Harassment',
  urgency: 'NORMAL',
  subject: '',
  description: '',
  incidentDate: '',
  location: '',
  accusedDetails: '',
  witnesses: '',
  requestedAction: '',
  confidentialityConfirmation: false,
};

export const IccComplaint: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  const updateField = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setReference('');
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, String(value)));
      if (attachment) payload.append('attachment', attachment);
      const res = await api.post('/icc/complaints', payload);
      setReference(res.data.data.referenceNumber);
      setForm(initialForm);
      setAttachment(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not submit the complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream-50">
        <section className="bg-maroon-700 text-cream-100 border-b border-gold-600">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cream-100/85">
                <LockKeyhole className="w-4 h-4" />
                Internal Complaints Committee
              </div>
              <h1 className="font-serif text-4xl font-bold">Submit a Complaint</h1>
              <p className="text-sm leading-6 text-cream-100/85">
                Send your complaint directly to the Internal Complaints Committee for secure review.
              </p>
            </div>
          </div>
        </section>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!user ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-4">
              <LockKeyhole className="w-10 h-10 text-maroon-700 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-maroon-700">Student sign-in required</h2>
              <Link to="/login" className="inline-flex px-4 py-2 bg-maroon-700 text-white rounded-md text-sm font-bold">
                Sign In
              </Link>
            </div>
          ) : user.role !== 'STUDENT' ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-maroon-700 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-maroon-700">Student access only</h2>
              <p className="text-sm text-gray-500">This form accepts submissions only from verified student accounts.</p>
            </div>
          ) : reference ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-maroon-700 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-maroon-700">Complaint Submitted</h2>
              <p className="text-sm text-gray-500">Reference number</p>
              <p className="font-mono text-xl font-bold text-dark-bg">{reference}</p>
              <button onClick={() => setReference('')} className="px-4 py-2 bg-maroon-700 text-white rounded-md text-sm font-bold">
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 space-y-6">
              {error && <div className="p-3 bg-rose-50 border border-gold-600 text-maroon-700 rounded-md text-sm">{error}</div>}

              <div className="rounded-lg border border-gray-150 bg-gray-50 p-4 text-sm text-gray-600">
                Your name and college email are attached from your student login. Only authorized ICC administrators can view complaint details.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold uppercase text-gray-500">Category</span>
                  <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white">
                    <option>Harassment</option>
                    <option>Discrimination</option>
                    <option>Safety Concern</option>
                    <option>Cyber Misconduct</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold uppercase text-gray-500">Urgency</span>
                  <select value={form.urgency} onChange={(e) => updateField('urgency', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white">
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold uppercase text-gray-500">Contact Phone</span>
                  <input value={form.complainantPhone} onChange={(e) => updateField('complainantPhone', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase text-gray-500">Complaint Summary</span>
                <input required minLength={5} value={form.subject} onChange={(e) => updateField('subject', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase text-gray-500">What happened?</span>
                <textarea required minLength={20} rows={6} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold uppercase text-gray-500">Incident Date</span>
                  <input type="date" value={form.incidentDate} onChange={(e) => updateField('incidentDate', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold uppercase text-gray-500">Location</span>
                  <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <textarea rows={3} placeholder="Person or people involved, if known" value={form.accusedDetails} onChange={(e) => updateField('accusedDetails', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                <textarea rows={3} placeholder="Witnesses or supporting context, if any" value={form.witnesses} onChange={(e) => updateField('witnesses', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
              </div>

              <textarea rows={3} placeholder="What support or action are you requesting?" value={form.requestedAction} onChange={(e) => updateField('requestedAction', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />

              <label className="flex items-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-md p-3 cursor-pointer">
                <FileUp className="w-4 h-4 text-maroon-700" />
                <span className="truncate">{attachment ? attachment.name : 'Attach PDF or image evidence'}</span>
                <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              </label>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={form.confidentialityConfirmation} onChange={(e) => updateField('confidentialityConfirmation', e.target.checked)} className="mt-1" required />
                <span>I confirm that the information submitted is true to the best of my knowledge.</span>
              </label>

              <button disabled={submitting} type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-md text-sm font-bold disabled:opacity-60">
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting' : 'Submit Complaint'}
              </button>
            </form>
          )}
        </main>
      </div>
    </PageWrapper>
  );
};
