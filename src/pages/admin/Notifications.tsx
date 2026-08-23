import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { Bell, CheckCheck, MailOpen, RefreshCw, Send, Users } from 'lucide-react';
import { NotificationListSkeleton } from '../../components/common/Skeleton.js';
import { AdminNotice, AdminPageHeader, AdminStatCard, adminButton, adminCard, adminGhostButton, formatNumber } from '../../components/admin/AdminUI.js';

export const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.data || []);
    } catch {
      setError('Could not load admin notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const read = async (id: string) => {
    await api.patch(`/admin/notifications/${id}/read`);
    await load();
  };

  const readAll = async () => {
    await api.patch('/admin/notifications/read-all');
    await load();
  };

  const openNotification = async (notification: any) => {
    if (!notification.isRead) await api.patch(`/admin/notifications/${notification._id}/read`);
    if (notification.link) navigate(notification.link);
    else await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <AdminPageHeader
        title="Notifications"
        description="Communicate with your community effectively through existing portal notifications."
        action={
        <div className="flex gap-2">
          <button onClick={readAll} className={adminButton}><CheckCheck className="w-4 h-4" /> Mark All Read</button>
          <button onClick={load} className={adminGhostButton}><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
        }
      />
      <section className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Total Notifications" value={formatNumber(notifications.length)} icon={Bell} tone="purple" footer={`Unread: ${formatNumber(notifications.filter(n => !n.isRead).length)}`} />
        <AdminStatCard label="Read" value={formatNumber(notifications.filter(n => n.isRead).length)} icon={MailOpen} tone="green" footer="Marked as read" />
        <AdminStatCard label="Linked Alerts" value={formatNumber(notifications.filter(n => n.link).length)} icon={Send} tone="blue" footer="Openable workflow links" />
        <AdminStatCard label="Audience" value="Admin" icon={Users} tone="teal" footer="Current notification stream" />
      </section>
      {loading ? <NotificationListSkeleton /> : error ? <AdminNotice type="error" onRetry={load}>{error}</AdminNotice> : notifications.length === 0 ? (
        <div className={`${adminCard} text-center py-12 text-gray-500 text-sm`}>No admin notifications yet.</div>
      ) : (
        <div className={`${adminCard} divide-y divide-[#edf2fb] overflow-hidden`}>
          {notifications.map(notification => (
            <div key={notification._id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${notification.isRead ? '' : 'bg-rose-50/30'}`}>
              <div className="flex items-start gap-3">
                <Bell className="w-4 h-4 text-maroon-700 mt-1" />
                <div>
                  <div className="font-bold text-sm text-maroon-700">{notification.title}</div>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{notification.type} · {new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {notification.link && <button onClick={() => openNotification(notification)} className="px-3 py-1.5 border rounded text-xs font-bold">Open</button>}
                {!notification.isRead && <button onClick={() => read(notification._id)} className="px-3 py-1.5 bg-maroon-700 text-white rounded text-xs font-bold">Read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
