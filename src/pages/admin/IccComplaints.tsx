import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import api from '../../utils/api.js';

interface IccComplaintRow {
  _id: string;
  referenceNumber: string;
  category: string;
  urgency: string;
  status: string;
  subject: string;
  createdAt: string;
  assignedAdmin?: { name: string };
}

const statuses = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED', 'CLOSED'];

export const AdminIccComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<IccComplaintRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/icc/complaints', {
        params: { search, status: status === 'ALL' ? undefined : status, limit: 50 },
      });
      setComplaints(res.data.data || []);
    } catch (err) {
      setError('Could not load ICC complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchComplaints, 200);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">ICC Complaints</h1>
          <p className="text-xs text-gray-500">Administrative review queue for confidential student submissions.</p>
        </div>
        <button onClick={fetchComplaints} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-bold text-maroon-700">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
        <label className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, category, subject" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white">
          {statuses.map(item => <option key={item}>{item}</option>)}
        </select>
      </div>

      {error && <div className="bg-rose-50 border border-gold-600 text-maroon-700 rounded-lg p-4 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-10 text-center space-y-2 text-gray-500">
            <ShieldAlert className="w-9 h-9 mx-auto text-maroon-700" />
            <p className="font-serif text-lg font-bold text-maroon-700">No complaints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-cream-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Urgency</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Assigned</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map(complaint => (
                  <tr key={complaint._id} className="hover:bg-cream-100/60">
                    <td className="px-4 py-3 font-mono text-xs text-maroon-700">{complaint.referenceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800">{complaint.subject}</p>
                      <p className="text-xs text-gray-500">{complaint.category}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold">{complaint.urgency}</td>
                    <td className="px-4 py-3 text-xs font-bold text-maroon-700">{complaint.status.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{complaint.assignedAdmin?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/icc-complaints/${complaint._id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-maroon-700 text-white rounded-md text-xs font-bold">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
