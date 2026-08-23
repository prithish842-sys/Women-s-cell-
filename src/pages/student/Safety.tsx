import React, { useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, LifeBuoy, Phone, RefreshCw, Shield, Siren } from 'lucide-react';
import api from '../../utils/api.js';

type Guide = { slug: string; title: string; introduction?: string; category?: string };
type Resource = { _id?: string; title?: string; name?: string; description?: string; phone?: string; category?: string; url?: string };

export const StudentSafety: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [guidesResponse, resourcesResponse] = await Promise.all([api.get('/safety/guides'), api.get('/safety/resources')]);
      setGuides(guidesResponse.data.data || []);
      setResources(resourcesResponse.data.data || []);
    } catch {
      setError('Could not load Safety & Support resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5 fade-in-up">
      <section className="flex flex-col gap-4 rounded-[20px] bg-[linear-gradient(110deg,#06123a,#2026a8_56%,#ed0877)] p-5 text-white shadow-[0_18px_38px_rgba(23,24,104,0.2)] sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/10"><Shield className="h-6 w-6" /></span><div><h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Safety & Support</h1><p className="mt-1 text-sm font-semibold text-white/75">Access verified guidance and support when you need it.</p></div></div></div>
        <a href="tel:112" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff176b] px-5 py-3 text-sm font-black text-white"><Siren className="h-5 w-5" /> Emergency SOS</a>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_1fr_1fr]">
        <article className="rounded-xl border border-[#ffd1df] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff0f5] text-[#ed1265]"><Phone className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-[#ed1265]">Emergency Help</h2><p className="mt-1 text-xs font-semibold text-[#64748b]">Use official emergency services for immediate danger.</p></div></div><a href="tel:112" className="mt-5 flex items-center justify-between rounded-lg bg-[#ff176b] px-4 py-3 text-sm font-black text-white"><span>Call 112</span><ArrowRight className="h-4 w-4" /></a></article>
        <article className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef3ff] text-[#2563eb]"><LifeBuoy className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-[#071426]">Human Support</h2><p className="mt-1 text-xs font-semibold text-[#64748b]">Request counselling support through the real wellbeing flow.</p></div></div><a href="/student/wellbeing/support" className="mt-5 flex items-center justify-between rounded-lg border border-[#c9d6ff] bg-[#f6f8ff] px-4 py-3 text-sm font-black text-[#2563eb]"><span>Request support</span><ArrowRight className="h-4 w-4" /></a></article>
        <article className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#f4ecff] text-[#6d28d9]"><Shield className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-[#071426]">ICC Complaint</h2><p className="mt-1 text-xs font-semibold text-[#64748b]">Use the existing confidential complaint workflow.</p></div></div><a href="/icc-complaint" className="mt-5 flex items-center justify-between rounded-lg border border-[#d8c7ff] bg-[#faf7ff] px-4 py-3 text-sm font-black text-[#6d28d9]"><span>Open complaint form</span><ArrowRight className="h-4 w-4" /></a></article>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-[#e6ebf7] bg-white" />)}</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700"><p>{error}</p><button type="button" onClick={load} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-black"><RefreshCw className="h-4 w-4" /> Retry</button></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[#071426]">Safety Guides</h2><p className="mt-1 text-xs font-semibold text-[#64748b]">Verified guidance published by the portal.</p></div><Shield className="h-5 w-5 text-[#4f46e5]" /></div><div className="mt-4 divide-y divide-[#eef2fb]">{guides.length === 0 ? <p className="py-5 text-sm text-[#64748b]">No published guides are available.</p> : guides.map((guide) => <a key={guide.slug} href={`/safety/guides/${guide.slug}`} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef3ff] text-[#2563eb]"><Shield className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black text-[#071426]">{guide.title}</strong><span className="mt-1 block line-clamp-2 text-xs font-semibold text-[#64748b]">{guide.introduction || guide.category || 'Safety guidance'}</span></span><ArrowRight className="h-4 w-4 text-[#2563eb]" /></a>)}</div></section>
          <section className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[#071426]">Support Directory</h2><p className="mt-1 text-xs font-semibold text-[#64748b]">Contacts and resources currently published by the portal.</p></div><LifeBuoy className="h-5 w-5 text-[#ec0b76]" /></div><div className="mt-4 divide-y divide-[#eef2fb]">{resources.length === 0 ? <p className="py-5 text-sm text-[#64748b]">No support contacts are available.</p> : resources.map((resource, index) => { const label = resource.title || resource.name || resource.category || 'Support resource'; return <div key={resource._id || `${label}-${index}`} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff0f5] text-[#ec0b76]"><LifeBuoy className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-black text-[#071426]">{label}</strong><span className="mt-1 block text-xs font-semibold text-[#64748b]">{resource.description || resource.category || 'Verified support resource'}</span></span>{resource.phone ? <a href={`tel:${resource.phone}`} className="text-xs font-black text-[#2563eb]">{resource.phone}</a> : resource.url ? <a href={resource.url} target="_blank" rel="noreferrer" aria-label={`Open ${label}`} className="text-[#2563eb]"><ExternalLink className="h-4 w-4" /></a> : null}</div>; })}</div></section>
        </div>
      )}
    </div>
  );
};
