import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { Award, CalendarDays, CheckCircle2, RefreshCw } from 'lucide-react';

export const StudentSkillRequests: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students/me/skill-requests', { params: { filter: filter === 'unread' ? 'unread' : undefined, status: filter === 'open' ? 'OPEN' : filter === 'closed' ? 'CLOSED' : undefined } });
      setRows(res.data.data || []);
    } catch {
      setError('Could not load skill opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const markRead = async (id: string) => {
    await api.patch(`/students/me/skill-requests/${id}/read`);
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Skill Opportunities</h1>
          <p className="text-xs text-gray-500">Requests sent to you based on your saved skills.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 border bg-white rounded-md text-xs font-bold"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </section>
      <div className="flex flex-wrap gap-2">
        {['all','unread','open','closed'].map(item => <button key={item} onClick={() => setFilter(item)} className={`px-3 py-1.5 rounded-md text-xs font-bold border ${filter === item ? 'bg-maroon-700 text-white border-maroon-700' : 'bg-white text-gray-600'}`}>{item.toUpperCase()}</button>)}
      </div>
      {loading ? <div className="h-40 bg-white border rounded-xl animate-pulse" /> : error ? <p className="text-red-600">{error}</p> : rows.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl text-gray-500 text-sm">No matching requests are assigned to you yet.</div>
      ) : (
        <div className="space-y-4">
          {rows.map(row => (
            <article key={row._id} className={`bg-white border rounded-xl p-5 shadow-sm ${row.isRead ? 'border-gray-150' : 'border-gold-600'}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Award className="w-4 h-4 text-maroon-700" />
                    <h3 className="font-serif font-bold text-maroon-700">{row.skillRequest.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100">{row.skillRequest.status}</span>
                    {!row.isRead && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">UNREAD</span>}
                  </div>
                  <p className="text-xs text-gray-600">{row.skillRequest.description}</p>
                  <div className="flex flex-wrap gap-1">{row.matchedSkills.map((skill: string) => <span key={skill} className="px-2 py-0.5 rounded bg-cream-100 text-maroon-700 text-[10px] font-bold">{skill}</span>)}</div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Deadline: {row.skillRequest.deadline ? new Date(row.skillRequest.deadline).toLocaleDateString() : 'Flexible'}</p>
                  <p className="text-xs text-gray-500">Contact: {row.skillRequest.contactPerson || "Women's Empowerment Cell"} {row.skillRequest.contactInformation ? `· ${row.skillRequest.contactInformation}` : ''}</p>
                </div>
                {!row.isRead && <button onClick={() => markRead(row._id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-maroon-700 text-white rounded text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Mark Read</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
