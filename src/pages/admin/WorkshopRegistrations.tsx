import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { CheckCircle2, RefreshCw, Search } from 'lucide-react';

const statuses = ['', 'REGISTERED', 'ATTENDED', 'CANCELLED'];

export const AdminWorkshopRegistrations: React.FC = () => {
  const { workshopId } = useParams();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = workshopId ? `/admin/workshops/${workshopId}/registrations` : '/admin/workshop-registrations';
      const res = await api.get(endpoint, {
        params: { page, search, status, department },
      });
      setRegistrations(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch {
      setError('Could not load workshop registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [workshopId, page, status, department]);

  const updateStatus = async (registrationId: string, nextStatus: string) => {
    if (!workshopId) return;
    await api.patch(`/admin/workshops/${workshopId}/registrations/${registrationId}`, { status: nextStatus });
    await load();
  };

  const updateGlobalStatus = async (row: any, nextStatus: string) => {
    await api.patch(`/admin/workshops/${row.workshop._id}/registrations/${row._id}`, { status: nextStatus });
    await load();
  };

  const updateCertificate = async (row: any, action: 'ISSUE' | 'REVOKE') => {
    const targetWorkshopId = workshopId || row.workshop?._id;
    if (!targetWorkshopId) return;
    await api.patch(`/admin/workshops/${targetWorkshopId}/registrations/${row._id}/certificate`, { action, certificateUrl: '' });
    await load();
  };

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">{meta?.workshop?.title || 'Workshop Registrations'}</h1>
          <p className="text-xs text-gray-500">
            {meta?.total || 0} registrations{meta?.workshop ? ` · Capacity ${meta.workshop.maximumParticipants || 'Open'}` : ' across all workshops'}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border rounded-md text-xs font-bold text-maroon-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </section>

      <form onSubmit={applySearch} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email, register no..." className="w-full rounded-md border px-9 py-2 text-sm" />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="rounded-md border bg-white px-3 py-2 text-sm">
          {statuses.map(item => <option key={item} value={item}>{item || 'All statuses'}</option>)}
        </select>
        <select value={department} onChange={event => { setDepartment(event.target.value); setPage(1); }} className="rounded-md border bg-white px-3 py-2 text-sm">
          <option value="">All departments</option>
          {(meta?.departments || []).map((dept: string) => <option key={dept}>{dept}</option>)}
        </select>
        <button className="md:col-span-4 inline-flex items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-xs font-bold text-white">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      {loading ? <div className="h-48 bg-white border rounded-xl animate-pulse" /> : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl text-gray-500 text-sm">No registrations found.</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-cream-100 text-maroon-700">
              <tr>
                {['Student', 'Workshop', 'Register No', 'Department', 'Course / Year', 'Registered At', 'Status', 'Expectation', 'Support', 'Certificate', 'Action'].map(head => (
                  <th key={head} className="px-4 py-3 font-bold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {registrations.map(row => (
                <tr key={row._id}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-maroon-700">{row.student.name}</div>
                    <div className="text-gray-500">{row.student.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {row.workshop ? <Link to={`/admin/workshops/${row.workshop._id}/registrations`} className="font-bold text-maroon-700 underline">{row.workshop.title}</Link> : (meta?.workshop?.title || '-')}
                  </td>
                  <td className="px-4 py-3">{row.student.registerNumber}</td>
                  <td className="px-4 py-3">{row.student.department}</td>
                  <td className="px-4 py-3">{row.student.course} · Year {row.student.currentStudyYear || '-'}</td>
                  <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-rose-50 px-2 py-1 font-bold text-rose-700">{row.status}</span></td>
                  <td className="px-4 py-3 max-w-xs">{row.learningExpectation || '-'}</td>
                  <td className="px-4 py-3 max-w-xs">{row.supportRequirement || '-'}</td>
                  <td className="px-4 py-3">
                    {row.certificateIssuedAt ? (
                      <button onClick={() => updateCertificate(row, 'REVOKE')} className="rounded border border-red-200 px-2 py-1 text-[10px] font-bold text-red-600">Revoke</button>
                    ) : (
                      <button disabled={row.status !== 'ATTENDED'} onClick={() => updateCertificate(row, 'ISSUE')} className="rounded bg-maroon-700 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-40">Issue</button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select value={row.status} onChange={event => workshopId ? updateStatus(row._id, event.target.value) : updateGlobalStatus(row, event.target.value)} className="rounded border bg-white px-2 py-1">
                      {statuses.filter(Boolean).map(item => <option key={item}>{item}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
          <span className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="rounded border bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
        </div>
      )}

      {!loading && registrations.some(row => row.status === 'ATTENDED') && (
        <div className="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Attendance updates saved.
        </div>
      )}
    </div>
  );
};
