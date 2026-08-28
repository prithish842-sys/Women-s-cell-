import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { ArrowLeft, FileText, CheckCircle, ExternalLink, Calendar, PhoneCall, ShieldAlert, Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { DetailPageSkeleton } from '../../components/common/Skeleton.js';

export const SchemeDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scheme, setScheme] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchemeDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/public/schemes/${slug}`);
        if (res.data.success) {
          setScheme(res.data.data);
          if (user?.role === 'STUDENT') {
            const savedRes = await api.get('/students/me/saved-schemes');
            setSaved((savedRes.data.data || []).some((row: any) => (row.scheme.id || row.scheme._id) === res.data.data._id));
          }
        } else {
          setError('We could not retrieve this scheme guidelines.');
        }
      } catch (err) {
        console.error('Error fetching scheme:', err);
        setError('Connection failure or scheme does not exist on our servers.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchSchemeDetail();
  }, [slug, user?.role]);

  const toggleSave = async () => {
    if (!scheme?._id) return;
    if (saved) await api.delete(`/students/me/saved-schemes/${scheme._id}`);
    else await api.post(`/students/me/saved-schemes/${scheme._id}`);
    setSaved(!saved);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'EXPIRED': return 'bg-gray-150 text-gray-700 border border-gray-200';
      default: return 'bg-green-50 text-green-700 border border-green-200'; // ACTIVE
    }
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !scheme) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-xl font-bold text-gray-800">Scheme Guidelines Not Found</h2>
        <p className="text-sm text-gray-500">{error || 'This scheme guidelines record has been deactivated or removed by the admin.'}</p>
        <button onClick={() => navigate('/schemes')} className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold transition-all">
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Back link */}
      <Link to="/schemes" className="inline-flex items-center space-x-1 text-sm font-bold text-maroon-700 hover:text-rose-600 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Schemes Catalog</span>
      </Link>

      {/* Hero Scheme details header */}
      <section className="bg-white rounded-2xl border-2 border-gold-600 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded">
              {scheme.category}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-700">{scheme.title}</h1>
            <p className="text-xs text-gray-400 font-medium">Offered by: {scheme.provider}</p>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(scheme.status)}`}>
            {scheme.status}
          </span>
        </div>

        <p className="text-sm text-maroon-900 leading-relaxed font-serif text-base italic bg-rose-50/30 p-4 rounded-xl border border-rose-100">
          "{scheme.shortDescription}"
        </p>
      </section>

      {/* Multi Section Detail Blocks */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Specific steps/Procedures */}
        <div className="md:col-span-2 space-y-8">
          {/* 1. Full Description */}
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-maroon-700 pb-1.5 border-b border-gray-100">
              Scheme Description & Scope
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {scheme.fullDescription}
            </p>
          </div>

          {/* 2. Eligibility Criteria */}
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-maroon-700 pb-1.5 border-b border-gray-100">
              Eligibility Benchmark Criteria
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {scheme.eligibility}
            </p>
          </div>

          {/* 3. Benefits */}
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-maroon-700 pb-1.5 border-b border-gray-100">
              Funding / Scholarship Benefits
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {scheme.benefits}
            </p>
          </div>

          {/* 4. Application Process */}
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-maroon-700 pb-1.5 border-b border-gray-100">
              Application filing Procedure
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {scheme.applicationProcess}
            </p>
          </div>
        </div>

        {/* Right Side: Key Metadata and actions */}
        <div className="space-y-6">
          {/* Action Button: Apply */}
          <a
            href={scheme.officialUrl}
            target="_blank"
            referrerPolicy="no-referrer"
            className="flex items-center justify-center space-x-2 w-full py-4 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
          >
            <span>Visit Government Portal</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          {user?.role === 'STUDENT' && (
            <button
              onClick={toggleSave}
              className={`flex items-center justify-center space-x-2 w-full py-3 rounded-xl text-sm font-bold border ${saved ? 'bg-rose-50 text-maroon-700 border-maroon-700' : 'bg-white text-matte-charcoal border-gray-200 hover:bg-gray-50'}`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{saved ? 'Saved Scheme' : 'Save Scheme'}</span>
            </button>
          )}

          {/* Dates Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-maroon-700 border-b border-gray-100 pb-2">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>Key Filing Deadlines</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-gray-400 font-semibold uppercase text-[10px]">Start Date</span>
                <span className="font-semibold text-gray-800">{new Date(scheme.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-semibold uppercase text-[10px]">Deadline Date</span>
                <span className="font-bold text-red-600">{new Date(scheme.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-maroon-700 border-b border-gray-100 pb-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Required Documents</span>
            </div>
            {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 ? (
              <ul className="space-y-2.5 text-xs text-gray-700">
                {scheme.requiredDocuments.map((doc: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="leading-tight font-medium">{doc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No specific documents specified.</p>
            )}
          </div>

          {/* Contacts Card */}
          {scheme.contactInformation && (
            <div className="bg-gradient-to-br from-cream-100 to-rose-50 p-5 rounded-xl border-2 border-gold-600 shadow-sm space-y-3.5">
              <div className="flex items-center space-x-2 text-sm font-bold text-maroon-700 border-b border-rose-200 pb-2">
                <PhoneCall className="w-4 h-4 text-gold-600" />
                <span>Need Support?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-600 italic">
                Contact the Women's Empowerment Cell office or call this official helpdesk number:
              </p>
              <p className="text-xs font-bold text-maroon-900 leading-snug">
                {scheme.contactInformation}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
