import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Save, UserCheck } from 'lucide-react';
import api from '../../utils/api.js';
import { AdminSkeletonBlock } from '../../components/admin/AdminUI.js';

interface IccComplaint {
  _id: string;
  referenceNumber: string;
  complainantName: string;
  complainantEmail: string;
  complainantPhone?: string;
  category: string;
  urgency: string;
  status: string;
  subject: string;
  description: string;
  incidentDate?: string;
  location?: string;
  accusedDetails?: string;
  witnesses?: string;
  requestedAction?: string;
  attachmentUrl?: string;
  adminNotes?: string;
  assignedAdmin?: { name: string; email: string };
  createdAt: string;
}

const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED', 'CLOSED'];

export const AdminIccComplaintDetail: React.FC = () => {
  const { complaintId } = useParams();
  const [complaint, setComplaint] = useState<IccComplaint | null>(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchComplaint = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/icc/complaints/${complaintId}`);
      setComplaint(res.data.data);
      setStatus(res.data.data.status);
      setNotes(res.data.data.adminNotes || '');
    } catch (err) {
      setError('Could not load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const updateStatus = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.patch(`/admin/icc/complaints/${complaintId}/status`, { status });
      setMessage('Status updated.');
      fetchComplaint();
    } catch (err) {
      setError('Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  const assignToSelf = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.patch(`/admin/icc/complaints/${complaintId}/assign`, {});
      setMessage('Complaint assigned.');
      fetchComplaint();
    } catch (err) {
      setError('Could not assign complaint.');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/admin/icc/complaints/${complaintId}/notes`, { adminNotes: notes });
      setMessage('Notes saved.');
      fetchComplaint();
    } catch (err) {
      setError('Could not save notes.');
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = async () => {
    if (!complaintId) return;
    try {
      const res = await api.get(`/icc/complaints/${complaintId}/attachment`, { responseType: 'blob' });
      const contentDisposition = String(res.headers['content-disposition'] || '');
      const filename = contentDisposition.match(/filename="([^"]+)"/)?.[1] || `${complaint.referenceNumber}-attachment`;
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Could not download attachment.');
    }
  };

  if (loading) return <AdminSkeletonBlock rows={7} />;
  if (!complaint) return <div className="p-8 text-sm text-maroon-700">{error || 'Complaint not found.'}</div>;

  return (
    <div className="space-y-6 fade-in-up max-w-5xl">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Link to="/admin/icc-complaints" className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-maroon-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to complaints
          </Link>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">{complaint.referenceNumber}</h1>
          <p className="text-xs text-gray-500">{new Date(complaint.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={assignToSelf} disabled={saving} className="inline-flex items-center gap-2 px-3 py-2 bg-maroon-700 text-white rounded-md text-xs font-bold disabled:opacity-60">
          <UserCheck className="w-4 h-4" />
          Assign To Me
        </button>
      </div>

      {message && <div className="bg-cream-100 border border-gold-600 rounded-lg p-3 text-sm text-maroon-700">{message}</div>}
      {error && <div className="bg-rose-50 border border-gold-600 rounded-lg p-3 text-sm text-maroon-700">{error}</div>}

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Subject</p>
            <h2 className="font-serif text-xl font-bold text-maroon-700">{complaint.subject}</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs uppercase font-bold text-gray-500">Student</dt><dd>{complaint.complainantName}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-gray-500">Email</dt><dd>{complaint.complainantEmail}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-gray-500">Phone</dt><dd>{complaint.complainantPhone || 'Not provided'}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-gray-500">Category</dt><dd>{complaint.category}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-gray-500">Urgency</dt><dd>{complaint.urgency}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-gray-500">Location</dt><dd>{complaint.location || 'Not provided'}</dd></div>
          </dl>
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6 mt-1">{complaint.description}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs uppercase font-bold text-gray-500">Respondent Details</p><p className="whitespace-pre-wrap">{complaint.accusedDetails || 'Not provided'}</p></div>
            <div><p className="text-xs uppercase font-bold text-gray-500">Witnesses</p><p className="whitespace-pre-wrap">{complaint.witnesses || 'Not provided'}</p></div>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Requested Action</p>
            <p className="text-sm whitespace-pre-wrap">{complaint.requestedAction || 'Not provided'}</p>
          </div>
          {complaint.attachmentUrl && (
            <button type="button" onClick={downloadAttachment} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-maroon-700">
              <FileText className="w-4 h-4" />
              Download Attachment
            </button>
          )}
        </div>

        <aside className="bg-white border border-gray-200 rounded-lg p-5 space-y-5 h-fit">
          <label className="block space-y-1">
            <span className="text-xs uppercase font-bold text-gray-500">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white">
              {statuses.map(item => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <button onClick={updateStatus} disabled={saving} className="w-full px-3 py-2 bg-maroon-700 text-white rounded-md text-xs font-bold disabled:opacity-60">Update Status</button>
          <div className="text-xs text-gray-500">
            Assigned: <span className="font-bold text-gray-700">{complaint.assignedAdmin?.name || 'Unassigned'}</span>
          </div>
          <label className="block space-y-1">
            <span className="text-xs uppercase font-bold text-gray-500">Internal Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
          </label>
          <button onClick={saveNotes} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-md text-xs font-bold disabled:opacity-60">
            <Save className="w-4 h-4" />
            Save Notes
          </button>
        </aside>
      </section>
    </div>
  );
};
