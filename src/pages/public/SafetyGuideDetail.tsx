import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, LifeBuoy } from 'lucide-react';
import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { Skeleton } from '../../components/common/Skeleton.js';

const Section: React.FC<{ title: string; items?: string[] }> = ({ title, items = [] }) => {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="font-serif text-xl font-bold text-maroon-700">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
        {items.map((item, index) => <li key={index} className="rounded-md border border-gray-200 bg-white p-3">{item}</li>)}
      </ul>
    </section>
  );
};

export const SafetyGuideDetail: React.FC = () => {
  const { slug } = useParams();
  const [guide, setGuide] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/safety/guides/${slug}`), api.get('/safety/resources')])
      .then(([guideRes, resourceRes]) => {
        if (!active) return;
        setGuide(guideRes.data.data);
        setResources(resourceRes.data.data || []);
      })
      .catch(() => active && setError('Safety guide unavailable.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream-50">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/safety" className="inline-flex items-center gap-2 text-sm font-bold text-maroon-700"><ArrowLeft className="h-4 w-4" />Safety & Support</Link>
          {loading ? (
            <div className="rounded-lg border bg-white p-6"><Skeleton className="h-8 w-2/3" /><Skeleton className="mt-5 h-24 w-full" /></div>
          ) : error || !guide ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Safety guide not found.'}</div>
          ) : (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-gray-500">{guide.category?.replaceAll('_', ' ')}</p>
                <h1 className="mt-2 font-serif text-4xl font-bold text-maroon-700">{guide.title}</h1>
                <p className="mt-4 text-sm leading-7 text-gray-700">{guide.introduction}</p>
                {guide.lastVerifiedDate && <p className="mt-4 text-xs text-gray-500">Last verified: {guide.lastVerifiedDate}</p>}
              </section>
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-6">
                  <Section title="What You Should Know" items={guide.whatToKnow} />
                  <Section title="Warning Signs" items={guide.warningSigns} />
                  <Section title="Immediate Actions" items={guide.immediateActions} />
                  <Section title="Step-by-Step Guidance" items={guide.stepByStepGuidance} />
                  <Section title="Do's" items={guide.dos} />
                  <Section title="Don'ts" items={guide.donts} />
                  <Section title="When to Seek Help" items={guide.whenToSeekHelp} />
                </div>
                <aside className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h2 className="font-serif text-lg font-bold text-maroon-700">Related Emergency Contacts</h2>
                    <div className="mt-3 space-y-2">
                      {resources.filter(resource => guide.relatedContactCategories?.includes(resource.category)).slice(0, 5).map(resource => (
                        <Link key={resource._id} to="/safety/emergency" className="block rounded-md border border-gray-200 p-3 text-sm font-bold text-maroon-700">{resource.name}</Link>
                      ))}
                      {resources.filter(resource => guide.relatedContactCategories?.includes(resource.category)).length === 0 && <p className="text-sm text-gray-500">No related contact is configured yet.</p>}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h2 className="font-serif text-lg font-bold text-maroon-700">Official Resource Links</h2>
                    <div className="mt-3 space-y-2">
                      {resources.filter(resource => guide.officialResourceIds?.includes(resource._id || resource.id)).map(resource => (
                        <a key={resource._id} href={resource.website} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm font-bold text-maroon-700">
                          {resource.name}<ExternalLink className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                  <Link to="/safety/emergency" className="flex items-center gap-2 rounded-md bg-maroon-700 px-4 py-3 text-sm font-bold text-white"><LifeBuoy className="h-4 w-4" />Emergency Help</Link>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
