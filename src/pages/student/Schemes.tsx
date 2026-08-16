import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { Landmark, Search, ExternalLink, Calendar, Bookmark } from 'lucide-react';

export const StudentSchemesView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedSchemes, setSavedSchemes] = useState<any[]>([]);
  const activeTab = searchParams.get('saved') === 'true' ? 'saved' : 'explore';

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/schemes');
      if (res.data.success) {
        setSchemes(res.data.data);
        setFiltered(res.data.data);
      }
      const savedRes = await api.get('/students/me/saved-schemes');
      if (savedRes.data.success) {
        setSavedSchemes(savedRes.data.data);
        setSavedIds(new Set(savedRes.data.data.map((row: any) => row.scheme.id || row.scheme._id)));
      }
    } catch (err) {
      console.error('Error fetching student portal schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const setActiveTab = (tab: 'explore' | 'saved') => {
    setSearchParams(tab === 'saved' ? { saved: 'true' } : {});
  };

  const toggleSave = async (schemeId: string) => {
    if (savedIds.has(schemeId)) {
      await api.delete(`/students/me/saved-schemes/${schemeId}`);
    } else {
      await api.post(`/students/me/saved-schemes/${schemeId}`);
    }
    await fetchSchemes();
  };

  const logActivity = async (type: string, title: string, description: string) => {
    try {
      await api.post('/students/me/activities/log', { type, title, description });
    } catch (err) {
      console.error('Error logging user interaction:', err);
    }
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      setFiltered(schemes.filter(s => 
        s.title.toLowerCase().includes(term) || 
        s.category.toLowerCase().includes(term) || 
        s.provider.toLowerCase().includes(term)
      ));
    } else {
      setFiltered(schemes);
    }
  }, [searchTerm, schemes]);

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Welfare & Empowerment Schemes</h1>
          <p className="text-xs text-gray-500">View college and government scholarship programs matching girl students.</p>
        </div>
        {activeTab === 'explore' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search active schemes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none bg-white"
            />
          </div>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-xs font-bold shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2 rounded-md ${activeTab === 'explore' ? 'bg-maroon-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Explore Schemes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-md ${activeTab === 'saved' ? 'bg-maroon-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Saved Schemes
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-40 bg-white rounded-xl border"></div>
          <div className="h-40 bg-white rounded-xl border"></div>
        </div>
      ) : activeTab === 'saved' ? (
        savedSchemes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
            <p className="font-semibold text-sm">No saved schemes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedSchemes.map((row) => {
              const scheme = row.scheme;
              const schemeId = scheme.id || scheme._id;
              return (
                <div key={row._id || schemeId} className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-maroon-700 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-50 text-rose-600 rounded">
                      {scheme.category}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Saved</span>
                  </div>
                  <h3 className="text-base font-bold text-maroon-700 mt-2">{scheme.title}</h3>
                  <p className="text-xs text-gray-600 mt-3 line-clamp-3 leading-relaxed">{scheme.shortDescription}</p>
                  <div className="pt-4 border-t border-gray-100 mt-5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <Link to={`/schemes/${scheme.slug}`} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">
                      Guidelines
                    </Link>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSave(schemeId)}
                        className="px-3 py-1.5 border border-maroon-700 text-maroon-700 bg-rose-50 rounded text-xs font-bold inline-flex items-center space-x-1"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Unsave</span>
                      </button>
                      {scheme.officialUrl && (
                        <a href={scheme.officialUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold inline-flex items-center space-x-1">
                          <span>Apply</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
          <p className="font-semibold text-sm">No schemes found matching search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((scheme) => (
            <div 
              key={scheme._id}
              className="bg-white rounded-xl border-t-4 border-gold-600 border-x border-b border-gray-250 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-50 text-rose-600 rounded">
                    {scheme.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scheme.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {scheme.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-maroon-700 mt-2">{scheme.title}</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">By {scheme.provider}</p>
                <p className="text-xs text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                  {scheme.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-5 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ends: {scheme.endDate}</span>
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleSave(scheme._id)}
                    className={`px-3 py-1.5 border rounded text-xs font-bold inline-flex items-center space-x-1 ${savedIds.has(scheme._id) ? 'border-maroon-700 text-maroon-700 bg-rose-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savedIds.has(scheme._id) ? 'Saved' : 'Save'}</span>
                  </button>
                  <Link
                    to={`/schemes/${scheme.slug}`}
                    onClick={() => logActivity('scheme_view', `Viewed Guidelines: ${scheme.title}`, `Inspected eligibility and prerequisite documentation for the '${scheme.title}' program.`)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-50"
                  >
                    Guidelines
                  </Link>
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    onClick={() => logActivity('scheme_apply', `Applied: ${scheme.title}`, `Initiated formal registration and redirected to official portal for '${scheme.title}'.`)}
                    className="px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold inline-flex items-center space-x-1"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
