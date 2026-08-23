import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { Landmark, Search, ExternalLink, Calendar, Bookmark, CheckCircle2, Sparkles } from 'lucide-react';

export const StudentSchemesView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedSchemes, setSavedSchemes] = useState<any[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [savingId, setSavingId] = useState('');
  const [savedMeta, setSavedMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingMoreSaved, setLoadingMoreSaved] = useState(false);
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
      await loadSavedSchemes(1, false);
    } catch (err) {
      console.error('Error fetching student portal schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSchemes = async (page = 1, append = false) => {
    if (append) setLoadingMoreSaved(true);
    try {
      const savedRes = await api.get('/students/me/saved-schemes', { params: { page, limit: 20 } });
      if (savedRes.data.success) {
        setSavedSchemes((current) => append ? [...current, ...savedRes.data.data] : savedRes.data.data);
        setSavedIds((current) => {
          const next = append ? new Set(current) : new Set<string>();
          savedRes.data.data.forEach((row: any) => next.add(row.scheme.id || row.scheme._id));
          return next;
        });
        setSavedMeta(savedRes.data.meta || { page, totalPages: 1, total: savedRes.data.data.length });
      }
    } finally {
      if (append) setLoadingMoreSaved(false);
    }
  };

  const setActiveTab = (tab: 'explore' | 'saved') => {
    setSearchParams(tab === 'saved' ? { saved: 'true' } : {});
  };

  const toggleSave = async (schemeId: string) => {
    const wasSaved = savedIds.has(schemeId);
    const targetScheme = schemes.find((scheme) => scheme._id === schemeId) || savedSchemes.find((row) => (row.scheme.id || row.scheme._id) === schemeId)?.scheme;
    setSavingId(schemeId);
    setSaveMessage('');
    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(schemeId);
      else next.add(schemeId);
      return next;
    });
    if (wasSaved) {
      setSavedSchemes((current) => current.filter((row) => (row.scheme.id || row.scheme._id) !== schemeId));
    } else if (targetScheme) {
      setSavedSchemes((current) => current.some((row) => (row.scheme.id || row.scheme._id) === schemeId) ? current : [{ _id: `local-${schemeId}`, scheme: targetScheme }, ...current]);
    }
    try {
      if (wasSaved) {
        await api.delete(`/students/me/saved-schemes/${schemeId}`);
        setSaveMessage('Removed from saved schemes.');
      } else {
        await api.post(`/students/me/saved-schemes/${schemeId}`);
        setSaveMessage('Saved.');
      }
      window.setTimeout(() => setSaveMessage(''), 2200);
    } catch (err) {
      setSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(schemeId);
        else next.delete(schemeId);
        return next;
      });
      if (wasSaved && targetScheme) {
        setSavedSchemes((current) => current.some((row) => (row.scheme.id || row.scheme._id) === schemeId) ? current : [{ _id: `rollback-${schemeId}`, scheme: targetScheme }, ...current]);
      } else {
        setSavedSchemes((current) => current.filter((row) => (row.scheme.id || row.scheme._id) !== schemeId));
      }
      setSaveMessage('Could not update saved scheme. Please try again.');
    } finally {
      setSavingId('');
    }
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
      <div className="rounded-[26px] bg-[linear-gradient(135deg,#eef3ff,#f4f1ff)] p-5 sm:p-6 shadow-[0_10px_28px_rgba(7,20,38,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Scholars & support</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071426]">My Schemes</h1>
            <p className="mt-2 text-sm font-semibold text-[#475569]">Discover, save, and apply for schemes that help you learn, grow and achieve your goals.</p>
          </div>

          {activeTab === 'explore' && (
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search scholarships, grants, and programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-[#dfe9ff] bg-white pl-9 pr-3 py-2.5 text-sm text-[#071426] rounded-xl shadow-sm focus:border-[#a7b9ff] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-[#e6ebf7] bg-white p-1 text-xs font-bold shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'explore' ? 'bg-[linear-gradient(135deg,#1d4ed8,#7c3aed)] text-white shadow-[0_10px_20px_rgba(49,102,224,0.18)]' : 'text-[#475569] hover:bg-[#f4f7ff]'}`}
        >
          Explore Schemes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'saved' ? 'bg-[linear-gradient(135deg,#1d4ed8,#7c3aed)] text-white shadow-[0_10px_20px_rgba(49,102,224,0.18)]' : 'text-[#475569] hover:bg-[#f4f7ff]'}`}
        >
          Saved Schemes
        </button>
      </div>

      {saveMessage && (
        <div role="status" className="fixed right-4 top-20 z-50 rounded-xl border border-[#dbe7ff] bg-white px-4 py-3 text-sm font-black text-[#071426] shadow-[0_18px_34px_rgba(7,20,38,0.14)]">
          {saveMessage}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Available schemes', value: schemes.length, copy: 'Published opportunities', icon: Landmark, tone: 'bg-[#eef3ff] text-[#4f46e5]' },
          { label: 'Saved by you', value: savedSchemes.length, copy: 'Bookmarked for later', icon: Bookmark, tone: 'bg-[#fff0f5] text-[#ec0b76]' },
          { label: 'Active now', value: schemes.filter((scheme) => scheme.status === 'ACTIVE').length, copy: 'Open scheme records', icon: CheckCircle2, tone: 'bg-[#ecfdf5] text-[#059669]' },
          { label: 'Search results', value: filtered.length, copy: activeTab === 'saved' ? 'Saved records shown' : 'Matching this view', icon: Sparkles, tone: 'bg-[#f4f1ff] text-[#7c3aed]' },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]"><div className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}><Icon className="h-5 w-5" /></div><p className="mt-3 text-xs font-bold text-[#52617f]">{item.label}</p><p className="mt-1 text-2xl font-black text-[#071426]">{item.value}</p><p className="mt-1 text-[11px] font-semibold text-[#64748b]">{item.copy}</p></div>;
        })}
      </section>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-40 bg-white rounded-xl border"></div>
          <div className="h-40 bg-white rounded-xl border"></div>
        </div>
      ) : activeTab === 'saved' ? (
        savedSchemes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[22px] border border-[#edf2fb] text-gray-500 shadow-[0_10px_26px_rgba(7,20,38,0.03)]">
            <p className="font-semibold text-sm">No saved schemes yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedSchemes.map((row) => {
                const scheme = row.scheme;
                const schemeId = scheme.id || scheme._id;
                return (
                  <div key={row._id || schemeId} className="bg-white rounded-[22px] border border-[#edf2fb] p-5 shadow-[0_10px_26px_rgba(7,20,38,0.03)]">
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
                        disabled={savingId === schemeId}
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
            {savedMeta.page < savedMeta.totalPages && (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={loadingMoreSaved}
                  onClick={() => loadSavedSchemes(savedMeta.page + 1, true)}
                  className="rounded-xl border border-[#dfe7fb] bg-white px-4 py-2.5 text-xs font-black text-[#2563eb] shadow-sm disabled:opacity-60"
                >
                  {loadingMoreSaved ? 'Loading saved schemes...' : `Load More Saved (${savedSchemes.length}/${savedMeta.total})`}
                </button>
              </div>
            )}
          </>
        )
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[22px] border border-[#edf2fb] text-gray-500 shadow-[0_10px_26px_rgba(7,20,38,0.03)]">
          <p className="font-semibold text-sm">No schemes found matching search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((scheme) => (
            <div 
              key={scheme._id}
              className="bg-white rounded-[22px] border border-[#edf2fb] p-5 flex flex-col justify-between shadow-[0_10px_26px_rgba(7,20,38,0.03)] hover:shadow-[0_14px_30px_rgba(49,102,224,0.08)] transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#eef3ff] text-[#2563eb] rounded-full">
                    {scheme.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scheme.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' : 'bg-[#ebfff5] text-[#0a8f6f]'
                  }`}>
                    {scheme.status}
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-black tracking-[-0.02em] text-[#071426]">{scheme.title}</h3>
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
                    disabled={savingId === scheme._id}
                    className={`px-3 py-1.5 border rounded-xl text-xs font-bold inline-flex items-center space-x-1 disabled:opacity-60 ${savedIds.has(scheme._id) ? 'border-[#cfcfff] bg-[#f4f1ff] text-[#4f46e5]' : 'border-[#e6ebf7] text-[#475569] hover:bg-[#f4f7ff]'}`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savedIds.has(scheme._id) ? 'Saved' : 'Save'}</span>
                  </button>
                  <Link
                    to={`/schemes/${scheme.slug}`}
                    onClick={() => logActivity('scheme_view', `Viewed Guidelines: ${scheme.title}`, `Inspected eligibility and prerequisite documentation for the '${scheme.title}' program.`)}
                    className="px-3 py-1.5 border border-[#e6ebf7] text-[#475569] rounded-xl text-xs font-bold hover:bg-[#f4f7ff]"
                  >
                    Guidelines
                  </Link>
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    onClick={() => logActivity('scheme_apply', `Applied: ${scheme.title}`, `Initiated formal registration and redirected to official portal for '${scheme.title}'.`)}
                    className="px-3 py-1.5 bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1 shadow-[0_10px_20px_rgba(49,102,224,0.2)]"
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
