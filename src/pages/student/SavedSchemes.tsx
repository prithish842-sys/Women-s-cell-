import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { BookmarkX, CalendarDays, Landmark, RefreshCw } from 'lucide-react';

export const StudentSavedSchemes: React.FC = () => {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students/me/saved-schemes');
      setSaved(res.data.data || []);
    } catch {
      setError('Could not load saved schemes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unsave = async (schemeId: string) => {
    await api.delete(`/students/me/saved-schemes/${schemeId}`);
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Saved Schemes</h1>
          <p className="text-xs text-gray-500">Bookmarked government schemes persist here, including expired records.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 border bg-white rounded-md text-xs font-bold"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </section>
      {loading ? <div className="h-40 bg-white border rounded-xl animate-pulse" /> : error ? <p className="text-red-600">{error}</p> : saved.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl text-gray-500 text-sm">
          No saved schemes yet. <Link to="/student/schemes" className="font-bold text-maroon-700">Browse schemes</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {saved.map(row => (
            <article key={row._id} className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Landmark className="w-5 h-5 text-maroon-700" />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${row.scheme.status === 'EXPIRED' ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>{row.scheme.status}</span>
              </div>
              <h3 className="font-serif font-bold text-maroon-700">{row.scheme.title}</h3>
              <p className="text-xs text-gray-600">{row.scheme.shortDescription}</p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Saved {new Date(row.createdAt).toLocaleDateString()}</p>
              <div className="flex gap-2">
                <Link to={`/schemes/${row.scheme.slug}`} className="px-3 py-1.5 border rounded text-xs font-bold">Guidelines</Link>
                <button onClick={() => unsave(row.scheme.id || row.scheme._id)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs font-bold inline-flex items-center gap-1"><BookmarkX className="w-3.5 h-3.5" /> Unsave</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
