import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { EmergencyContactCard } from '../../components/safety/EmergencyContactCard.js';
import { SkillCardSkeleton } from '../../components/common/Skeleton.js';

const categories = ['ALL', 'EMERGENCY', 'WOMEN_SUPPORT', 'POLICE', 'CYBER_CRIME', 'CHILD_PROTECTION', 'COLLEGE_SUPPORT', 'MEDICAL_SUPPORT', 'COUNSELLING_SUPPORT'];

export const EmergencyHelp: React.FC = () => {
  const [category, setCategory] = useState('ALL');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/safety/resources', { params: { category: category === 'ALL' ? undefined : category } })
      .then(res => active && setResources(res.data.data || []))
      .catch(() => active && setError('Emergency resources unavailable.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category]);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream-50">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="font-serif text-4xl font-bold text-maroon-700">Emergency Help</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">Verified official resources and admin-configured college support contacts. Use immediate emergency services when there is active danger.</p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-maroon-700">
            {categories.map(item => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
          </select>
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkillCardSkeleton key={i} />)}</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
          ) : resources.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">No verified contact has been configured for this category yet.</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resources.map(resource => <EmergencyContactCard key={resource._id} resource={resource} />)}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
};
