import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { NotificationListSkeleton } from '../../components/common/Skeleton.js';

export const FacultyNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/faculty/notifications');
      setNotifications(res.data.data || []);
    } catch {
      setError('Could not load faculty notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const read = async (id: string) => {
    await api.patch(`/faculty/notifications/${id}/read`);
    await load();
  };

  const readAll = async () => {
    await api.patch('/faculty/notifications/read-all');
    await load();
  };

  const openNotification = async (notification: any) => {
    if (!notification.isRead) await api.patch(`/faculty/notifications/${notification._id}/read`);
    if (notification.link) navigate(notification.link);
    else await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Faculty Notifications</h1>
          <p className="text-xs text-gray-500">Student in-charge updates and internal alerts for faculty reviewers.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={readAll} className="inline-flex items-center gap-2 rounded-md bg-maroon-700 px-3 py-2 text-xs font-bold text-white"><CheckCheck className="h-4 w-4" /> Mark All Read</button>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-bold"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
      </section>
      {loading ? <NotificationListSkeleton /> : error ? <p className="text-red-600">{error}</p> : notifications.length === 0 ? (
        <div className="rounded-xl border bg-white py-12 text-center text-sm text-gray-500">No faculty notifications yet.</div>
      ) : (
        <div className="divide-y rounded-xl border bg-white shadow-sm">
          {notifications.map(notification => (
            <div key={notification._id} className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${notification.isRead ? '' : 'bg-rose-50/30'}`}>
              <div className="flex items-start gap-3">
                <Bell className="mt-1 h-4 w-4 text-maroon-700" />
                <div>
                  <div className="text-sm font-bold text-maroon-700">{notification.title}</div>
                  <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{notification.type} · {new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {notification.link && <button onClick={() => openNotification(notification)} className="rounded border px-3 py-1.5 text-xs font-bold">Open</button>}
                {!notification.isRead && <button onClick={() => read(notification._id)} className="rounded bg-maroon-700 px-3 py-1.5 text-xs font-bold text-white">Read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
