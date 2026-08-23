import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileCheck, LockKeyhole, LifeBuoy } from 'lucide-react';
import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';

export const CyberGuidance: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    api.get('/safety/resources', { params: { category: 'CYBER_CRIME' } })
      .then(res => setResources(res.data.data || []))
      .catch(() => setResources([]));
  }, []);

  const portal = resources.find(resource => resource.website?.includes('cybercrime.gov.in'));

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream-50">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="font-serif text-4xl font-bold text-maroon-700">Cyber Crime Guidance</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">This page helps you prepare. It does not replace the official Government of India cybercrime reporting portal.</p>
          </section>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ['What happened?', 'Write a short timeline with dates, usernames, phone numbers, links, and what changed.'],
              ['Secure your account', 'Change passwords, turn on multi-factor authentication, review recovery email/phone, and sign out unknown sessions.'],
              ['Preserve evidence', 'Save screenshots, URLs, account handles, payment references, and abusive messages before blocking.'],
              ['Prepare for reporting', 'Keep documents private and use official portals or campus support routes for sensitive information.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-serif text-xl font-bold text-maroon-700">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {portal?.website && <a href={portal.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white"><ExternalLink className="h-4 w-4" />Report on Official Cyber Crime Portal</a>}
            <Link to="/safety/guides/evidence-preservation-basics" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-maroon-700"><FileCheck className="h-4 w-4" />Evidence Checklist</Link>
            <Link to="/safety/guides/digital-safety-for-women" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-maroon-700"><LockKeyhole className="h-4 w-4" />Digital Safety Guide</Link>
            <Link to="/safety/emergency" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-maroon-700"><LifeBuoy className="h-4 w-4" />Emergency Help</Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
