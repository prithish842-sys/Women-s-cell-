import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { AdminNotice, AdminPageHeader, AdminSkeletonBlock, AdminStatCard, adminButton, adminCard } from '../../components/admin/AdminUI.js';
import { Activity, Database, RefreshCw, Settings, ShieldCheck, User } from 'lucide-react';
import { AdminUsers } from './Users.js';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load backend health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 fade-in-up">
      <AdminPageHeader
        title="System Settings"
        description="Operational settings available in the current Singa Pen architecture."
        action={<button onClick={load} className={adminButton}><RefreshCw className="h-4 w-4" /> Check Health</button>}
      />
      {error && <AdminNotice type="error" onRetry={load}>{error}</AdminNotice>}
      {loading ? <AdminSkeletonBlock rows={4} /> : (
        <section className="grid gap-4 md:grid-cols-3">
          <AdminStatCard label="Backend Health" value={health?.status || 'Unknown'} icon={Activity} tone={health?.status === 'ok' ? 'green' : 'orange'} footer="GET /api/v1/health" />
          <AdminStatCard label="Database" value={health?.database || 'Checked by API'} icon={Database} tone="teal" footer="No fabricated storage or backup metrics shown" />
          <AdminStatCard label="Signed In As" value={user?.role || 'Admin'} icon={ShieldCheck} tone="purple" footer={user?.email || user?.name || 'Current account'} />
        </section>
      )}
      <section className={`${adminCard} p-5`}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-blue-700"><Settings className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-black text-[#071247]">Configuration Scope</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#415176]">
              The current project exposes account session state, notification access, and backend health. Platform-wide settings such as backup status, SSL certificates, and storage quotas are not displayed because they are not backed by existing APIs.
            </p>
          </div>
        </div>
      </section>
      <section className={`${adminCard} p-5`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-violet-700"><User className="h-5 w-5" /></span>
          <div>
            <h2 className="font-black text-[#071247]">{user?.name || 'Admin'}</h2>
            <p className="text-xs font-semibold text-[#63708f]">{user?.email || 'Authenticated administrator'}</p>
          </div>
        </div>
      </section>
      <section className="border-t border-[#edf2fb] pt-5">
        <AdminUsers />
      </section>
    </div>
  );
};
