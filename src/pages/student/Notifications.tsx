import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { NotificationListSkeleton } from '../../components/common/Skeleton.js';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students/me/notifications');
      setNotifications(res.data.data || []);
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const read = async (id: string) => {
    await api.patch(`/students/me/notifications/${id}/read`);
    await load();
  };

  const readAll = async () => {
    await api.patch('/students/me/notifications/read-all');
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Notifications</h1>
          <p className="text-xs text-gray-500">Your in-app alerts from Singa Pen portal.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={readAll} className="inline-flex items-center gap-2 px-3 py-2 bg-maroon-700 text-white rounded-md text-xs font-bold"><CheckCheck className="w-4 h-4" /> Mark All Read</button>
          <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 border bg-white rounded-md text-xs font-bold"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </section>
      {loading ? <NotificationListSkeleton /> : error ? <p className="text-red-600">{error}</p> : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl text-gray-500 text-sm">No notifications yet.</div>
      ) : (
        <div className="bg-white border rounded-xl divide-y shadow-sm">
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
                {notification.link && <Link to={notification.link} className="px-3 py-1.5 border rounded text-xs font-bold">Open</Link>}
                {!notification.isRead && <button onClick={() => read(notification._id)} className="px-3 py-1.5 bg-maroon-700 text-white rounded text-xs font-bold">Read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
