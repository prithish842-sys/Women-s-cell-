import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { BookOpenCheck, HeartPulse, Phone, Save, ShieldCheck } from 'lucide-react';
import { AdminNotice, AdminPageHeader, AdminSkeletonBlock, AdminStatCard, adminButton, adminCard, formatNumber } from '../../components/admin/AdminUI.js';

const emptyGuide = {
  slug: '',
  title: '',
  category: 'EMERGENCY_SELF_PROTECTION',
  introduction: '',
  whatToKnow: [''],
  warningSigns: [''],
  immediateActions: [''],
  stepByStepGuidance: [''],
  dos: [''],
  donts: [''],
  whenToSeekHelp: [''],
  relatedContactCategories: [],
  officialResourceIds: [],
  isPublished: false,
  lastVerifiedDate: '',
};

const emptyResource = {
  name: '',
  purpose: '',
  phone: '',
  alternatePhone: '',
  email: '',
  address: '',
  website: '',
  category: 'COLLEGE_SUPPORT',
  isEmergency: false,
  isOfficial: false,
  sourceName: '',
  verifiedDate: '',
  isActive: true,
};

const splitLines = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean);

export const AdminSafetyWellbeing: React.FC = () => {
  const [guides, setGuides] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [guideForm, setGuideForm] = useState<any>(emptyGuide);
  const [resourceForm, setResourceForm] = useState<any>(emptyResource);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
    const [guideRes, resourceRes, analyticsRes, requestsRes] = await Promise.all([
      api.get('/admin/safety/guides'),
      api.get('/admin/safety/resources'),
      api.get('/admin/safety/wellbeing/analytics'),
      api.get('/admin/safety/wellbeing/counselling-requests'),
    ]);
    setGuides(guideRes.data.data || []);
    setResources(resourceRes.data.data || []);
    setAnalytics(analyticsRes.data.data);
    setRequests(requestsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load safety management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveGuide = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...guideForm,
      whatToKnow: splitLines(String(guideForm.whatToKnowText || '')),
      warningSigns: splitLines(String(guideForm.warningSignsText || '')),
      immediateActions: splitLines(String(guideForm.immediateActionsText || '')),
      stepByStepGuidance: splitLines(String(guideForm.stepByStepGuidanceText || '')),
      dos: splitLines(String(guideForm.dosText || '')),
      donts: splitLines(String(guideForm.dontsText || '')),
      whenToSeekHelp: splitLines(String(guideForm.whenToSeekHelpText || '')),
      relatedContactCategories: [],
      officialResourceIds: splitLines(String(guideForm.officialResourceIdsText || '')),
    };
    await api.post('/admin/safety/guides', payload);
    setGuideForm(emptyGuide);
    setMessage('Safety guide saved.');
    load();
  };

  const saveResource = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.post('/admin/safety/resources', resourceForm);
    setResourceForm(emptyResource);
    setMessage('Emergency resource saved.');
    load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <AdminPageHeader title="Safety" description="Manage safety guidance, helplines, and aggregate wellbeing support without exposing private ICC or AI chat details." />
      {message && <AdminNotice type="success">{message}</AdminNotice>}
      {error && <AdminNotice type="error" onRetry={load}>{error}</AdminNotice>}

      {loading ? <AdminSkeletonBlock rows={5} /> : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Safety Guides" value={formatNumber(guides.length)} icon={BookOpenCheck} tone="blue" footer={`${formatNumber(guides.filter(g => g.isPublished).length)} published`} />
          <AdminStatCard label="Support Resources" value={formatNumber(resources.length)} icon={Phone} tone="teal" footer={`${formatNumber(resources.filter(r => r.isActive).length)} active`} />
          <AdminStatCard label="7-day Check-ins" value={formatNumber(analytics?.sevenDay?.total ?? 0)} icon={HeartPulse} tone="purple" footer={`Today: ${formatNumber(analytics?.checkInsToday ?? 0)}`} />
          <AdminStatCard label="Counselling Queue" value={formatNumber(requests.length)} icon={ShieldCheck} tone="orange" footer="Support requests only" />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={saveGuide} className={`${adminCard} p-5`}>
          <h2 className="font-serif text-xl font-bold text-maroon-700">Create Safety Guide</h2>
          <div className="mt-4 grid gap-3">
            <input required placeholder="slug-for-guide" value={guideForm.slug} onChange={e => setGuideForm({ ...guideForm, slug: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            <input required placeholder="Title" value={guideForm.title} onChange={e => setGuideForm({ ...guideForm, title: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            <select value={guideForm.category} onChange={e => setGuideForm({ ...guideForm, category: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              {['EMERGENCY_SELF_PROTECTION', 'DIGITAL_SAFETY', 'SAFE_TRAVEL', 'HARASSMENT_RESPONSE', 'EVIDENCE_PRESERVATION', 'ONLINE_ACCOUNT_PROTECTION', 'CYBERSTALKING_AWARENESS', 'PUBLIC_TRANSPORT_SAFETY'].map(item => <option key={item}>{item}</option>)}
            </select>
            <textarea required rows={3} placeholder="Introduction" value={guideForm.introduction} onChange={e => setGuideForm({ ...guideForm, introduction: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            {['whatToKnow', 'warningSigns', 'immediateActions', 'stepByStepGuidance', 'dos', 'donts', 'whenToSeekHelp', 'officialResourceIds'].map(field => (
              <textarea key={field} rows={2} placeholder={`${field} - one item per line`} value={guideForm[`${field}Text`] || ''} onChange={e => setGuideForm({ ...guideForm, [`${field}Text`]: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            ))}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={guideForm.isPublished} onChange={e => setGuideForm({ ...guideForm, isPublished: e.target.checked })} />Published</label>
            <input type="date" value={guideForm.lastVerifiedDate} onChange={e => setGuideForm({ ...guideForm, lastVerifiedDate: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            <button className={adminButton}><Save className="h-4 w-4" />Save Guide</button>
          </div>
        </form>

        <form onSubmit={saveResource} className={`${adminCard} p-5`}>
          <h2 className="font-serif text-xl font-bold text-maroon-700">Create Emergency / College Contact</h2>
          <div className="mt-4 grid gap-3">
            <input required placeholder="Name" value={resourceForm.name} onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            <textarea required rows={3} placeholder="Purpose" value={resourceForm.purpose} onChange={e => setResourceForm({ ...resourceForm, purpose: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            <select value={resourceForm.category} onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              {['EMERGENCY', 'WOMEN_SUPPORT', 'POLICE', 'CYBER_CRIME', 'CHILD_PROTECTION', 'COLLEGE_SUPPORT', 'MEDICAL_SUPPORT', 'COUNSELLING_SUPPORT'].map(item => <option key={item}>{item}</option>)}
            </select>
            {['phone', 'alternatePhone', 'email', 'address', 'website', 'sourceName'].map(field => (
              <input key={field} placeholder={field} value={resourceForm[field] || ''} onChange={e => setResourceForm({ ...resourceForm, [field]: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            ))}
            <div className="flex flex-wrap gap-4 text-sm">
              <label><input type="checkbox" checked={resourceForm.isEmergency} onChange={e => setResourceForm({ ...resourceForm, isEmergency: e.target.checked })} /> Emergency</label>
              <label><input type="checkbox" checked={resourceForm.isOfficial} onChange={e => setResourceForm({ ...resourceForm, isOfficial: e.target.checked })} /> Official</label>
              <label><input type="checkbox" checked={resourceForm.isActive} onChange={e => setResourceForm({ ...resourceForm, isActive: e.target.checked })} /> Active</label>
            </div>
            <input type="date" value={resourceForm.verifiedDate} onChange={e => setResourceForm({ ...resourceForm, verifiedDate: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
            <button className={adminButton}><Save className="h-4 w-4" />Save Resource</button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className={`${adminCard} p-5`}>
          <h2 className="font-serif text-xl font-bold text-maroon-700">Guides</h2>
          <p className="mt-2 text-sm text-gray-500">{guides.length ? `${guides.length} database guides configured.` : 'No admin-managed guides yet.'}</p>
        </div>
        <div className={`${adminCard} p-5`}>
          <h2 className="font-serif text-xl font-bold text-maroon-700">Resources</h2>
          <p className="mt-2 text-sm text-gray-500">{resources.length ? `${resources.length} database resources configured.` : 'No admin-managed resources yet.'}</p>
        </div>
        <div className={`${adminCard} p-5`}>
          <h2 className="font-serif text-xl font-bold text-maroon-700">Counselling Requests</h2>
          <p className="mt-2 text-sm text-gray-500">{requests.length ? `${requests.length} requests in queue.` : 'No counselling support requests yet.'}</p>
        </div>
      </section>
    </div>
  );
};
