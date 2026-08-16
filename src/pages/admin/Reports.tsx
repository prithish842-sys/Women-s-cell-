import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { BarChart3, RefreshCw } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports');
      setReport(res.data.data);
    } catch {
      setError('Could not load admin reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const maxDept = Math.max(...(report?.departments || []).map((row: any) => row.count), 1);

  return (
    <div className="space-y-6 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-matte-beige pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-serif text-2xl font-bold text-matte-maroon">Reports & Analytics</h1><p className="text-xs text-matte-charcoal/60">Aggregate-only operational reports using database data.</p></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold text-matte-maroon"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </section>
      {loading ? <div className="h-52 animate-pulse rounded-xl border bg-white" /> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Workshops', report.workshops],
              ['Registrations', report.registrations],
              ['Attendance', report.attendance],
              ['Achievements', report.achievements],
              ['Gallery Albums', report.galleryAlbums],
              ['Saved Schemes', report.savedSchemes],
              ['Pending ICC Cases', report.pendingIccCases],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-matte-beige bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-matte-charcoal/50">{label}</p>
                <p className="mt-2 font-serif text-3xl font-bold text-matte-maroon">{value as number}</p>
              </div>
            ))}
          </section>
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-matte-maroon"><BarChart3 className="mr-1 inline h-4 w-4" /> Department Participation</h2>
              <div className="mt-4 space-y-3">
                {report.departments.map((row: any) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs"><span>{row.label}</span><strong>{row.count}</strong></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-matte-cream"><div className="h-full bg-matte-rose" style={{ width: `${(row.count / maxDept) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-matte-beige bg-white p-5 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-matte-maroon">Module Status</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[...(report.skillRequests || []), ...(report.schemes || [])].map((row: any, index: number) => (
                  <div key={`${row.label}-${index}`} className="rounded-lg bg-matte-cream p-3 text-xs"><span className="font-bold text-matte-maroon">{row.label}</span><span className="float-right">{row.count}</span></div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
