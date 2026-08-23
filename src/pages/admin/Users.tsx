import React, { useEffect, useMemo, useState } from 'react';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { AdminNotice, AdminPageHeader, AdminSkeletonBlock, AdminStatCard, adminButton, adminCard, adminField, adminGhostButton, formatNumber } from '../../components/admin/AdminUI.js';
import { Ban, CheckCircle2, Filter, RefreshCw, Search, Shield, Users } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users', { params: { search, role, status, page, limit: 10 } });
      setRows(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: any) => {
    await api.patch(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
    await load();
  };

  useEffect(() => { load(); }, [page]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, role, status]);

  const roleTotal = useMemo(() => (name: string) => (meta.roleDistribution || []).find((row: any) => row.role === name)?.count || 0, [meta.roleDistribution]);

  return (
    <div className="space-y-5 fade-in-up">
      <AdminPageHeader
        title="Users"
        description="Manage and monitor platform accounts and role access."
        action={<button onClick={load} className={adminButton}><RefreshCw className="h-4 w-4" /> Refresh Users</button>}
      />
      {error && <AdminNotice type="error" onRetry={load}>{error}</AdminNotice>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total Users" value={formatNumber(meta.total)} icon={Users} tone="purple" footer={<>Active: {formatNumber(meta.activeCount)} <span className="ml-4">Inactive: {formatNumber(meta.inactiveCount)}</span></>} />
        <AdminStatCard label="Student Users" value={formatNumber(roleTotal('STUDENT'))} icon={Users} tone="blue" footer="Primary learner accounts" />
        <AdminStatCard label="Faculty Users" value={formatNumber(roleTotal('FACULTY'))} icon={Shield} tone="teal" footer="Advisor accounts" />
        <AdminStatCard label="Admin Users" value={formatNumber(roleTotal('ADMIN') + roleTotal('ICC_ADMIN'))} icon={CheckCircle2} tone="green" footer="Privileged accounts" />
      </section>

      <section className={`${adminCard} p-4`}>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#40528a]" />
            <input value={search} onChange={e => setSearch(e.target.value)} className={`${adminField} w-full pr-9`} placeholder="Search by name, email or identifier..." />
          </label>
          <select value={role} onChange={e => setRole(e.target.value)} className={`${adminField} w-full`}>
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admin</option>
            <option value="ICC_ADMIN">ICC Admin</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className={`${adminField} w-full`}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={() => { setSearch(''); setRole(''); setStatus(''); }} className={adminGhostButton}><Filter className="h-4 w-4" /> Clear Filters</button>
        </div>
      </section>

      {loading ? <AdminSkeletonBlock rows={8} /> : rows.length === 0 ? (
        <div className={`${adminCard} p-10 text-center text-sm font-semibold text-[#415176]`}>No users match the selected filters.</div>
      ) : (
        <section className={`${adminCard} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="bg-[#f7faff] text-[#17235c]">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(head => <th key={head} className="px-4 py-4 font-black">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2fb]">
                {rows.map(user => (
                  <tr key={user._id} className="hover:bg-[#f9fbff]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? <img src={resolveUploadUrl(user.profileImage)} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 font-black text-blue-700">{user.name?.slice(0, 1)}</span>}
                        <div><p className="font-black text-[#071247]">{user.name}</p><p className="text-[11px] font-semibold text-[#63708f]">{user.identifier}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1b2b61]">{user.email}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-violet-50 px-2 py-1 font-black text-violet-700">{user.role.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 font-black ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 font-semibold text-[#415176]">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not recorded'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleStatus(user)} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 font-black ${user.isActive ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'}`}>
                          {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#edf2fb] px-4 py-4 text-xs font-bold text-[#415176] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing page {meta.page || page} of {meta.totalPages || 1} for {formatNumber(meta.total)} users</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={adminGhostButton}>Previous</button>
              <button disabled={page >= (meta.totalPages || 1)} onClick={() => setPage(page + 1)} className={adminGhostButton}>Next</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
