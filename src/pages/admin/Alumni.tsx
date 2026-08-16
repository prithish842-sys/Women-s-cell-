import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { GraduationCap, RefreshCw, Search } from 'lucide-react';

export const AdminAlumni: React.FC = () => {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/alumni', { params: { search } });
      setAlumni(res.data.data || []);
    } catch {
      setError('Could not load alumni records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-matte-beige pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-matte-maroon">Alumni Directory</h1>
          <p className="text-xs text-matte-charcoal/60">Passed-out Singa Pen student records from real student profiles.</p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold text-matte-maroon">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </section>

      <form onSubmit={(event) => { event.preventDefault(); load(); }} className="grid grid-cols-1 gap-3 rounded-xl border border-matte-beige bg-white p-4 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-matte-charcoal/40" />
          <input value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-md border border-matte-beige py-2 pl-9 pr-3 text-sm" placeholder="Search name, register number, department" />
        </label>
        <button className="rounded-md bg-matte-maroon px-4 py-2 text-xs font-bold text-white">Search</button>
      </form>

      {loading ? <div className="h-36 animate-pulse rounded-xl border bg-white" /> : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : alumni.length === 0 ? (
        <div className="rounded-xl border border-dashed border-matte-beige bg-white p-10 text-center text-sm text-matte-charcoal/60">No alumni profiles found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-matte-beige bg-white shadow-sm">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-matte-cream text-matte-maroon">
              <tr>{['Name', 'Register No', 'Department', 'Course', 'Passing Year', 'Club Role'].map(head => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-matte-beige">
              {alumni.map(row => (
                <tr key={row._id}>
                  <td className="px-4 py-3"><div className="font-bold text-matte-maroon">{row.name}</div><div className="text-matte-charcoal/55">{row.email}</div></td>
                  <td className="px-4 py-3">{row.registerNumber}</td>
                  <td className="px-4 py-3">{row.department}</td>
                  <td className="px-4 py-3">{row.course}</td>
                  <td className="px-4 py-3">{row.expectedPassingYear}</td>
                  <td className="px-4 py-3"><GraduationCap className="mr-1 inline h-3.5 w-3.5 text-matte-rose" />{row.clubRole || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
