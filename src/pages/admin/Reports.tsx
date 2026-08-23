import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { BarChart3, CalendarDays, Download, FileUp, Image, RefreshCw, ShieldAlert, Trash2, Users } from 'lucide-react';
import { AdminNotice, AdminPageHeader, AdminSkeletonBlock, AdminStatCard, adminButton, adminCard, adminField, formatNumber } from '../../components/admin/AdminUI.js';

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportRes, documentRes] = await Promise.all([
        api.get('/admin/reports'),
        api.get('/admin/report-documents'),
      ]);
      setReport(reportRes.data.data);
      setDocuments(documentRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load admin reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const downloadCsv = () => {
    if (!report) return;
    const rows = [
      ['Section', 'Label', 'Count', 'UG', 'PG'],
      ...report.departments.map((row: any) => ['Department', row.label, row.count, row.ug || 0, row.pg || 0]),
      ['Summary', 'Workshops', report.workshops, '', ''],
      ['Summary', 'Registrations', report.registrations, '', ''],
      ['Summary', 'Attendance', report.attendance, '', ''],
      ['Summary', 'Gallery Albums', report.galleryAlbums, '', ''],
      ['Summary', 'Achievements', report.achievements, '', ''],
      ['Summary', 'Saved Schemes', report.savedSchemes, '', ''],
      ['Summary', 'Pending ICC Cases', report.pendingIccCases, '', ''],
      ...(report.skillRequests || []).map((row: any) => ['Skill Requests', row.label, row.count, '', '']),
      ...(report.schemes || []).map((row: any) => ['Schemes', row.label, row.count, '', '']),
    ];
    const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `singa-pen-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const uploadReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportFile) {
      setError('Select a PDF report first.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const body = new FormData();
      body.append('title', reportTitle.trim() || reportFile.name.replace(/\.pdf$/i, ''));
      body.append('report', reportFile);
      const res = await api.post('/admin/report-documents', body);
      if (!res.data.success) throw new Error(res.data.message || 'Upload failed.');
      setSuccess('Report PDF uploaded successfully.');
      setReportTitle('');
      setReportFile(null);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not upload report.');
    } finally {
      setUploading(false);
    }
  };


  const downloadUploadedReport = async (documentRow: any) => {
    setError('');
    try {
      const response = await api.get(`/admin/report-documents/${documentRow.id}/download`, { responseType: 'blob' });
      const href = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = documentRow.fileName || 'report.pdf';
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not download report.');
    }
  };

  const removeDocument = async (id: string) => {
    if (!window.confirm('Remove this uploaded report?')) return;
    try {
      await api.delete(`/admin/report-documents/${id}`);
      setDocuments(current => current.filter(item => item.id !== id));
      setSuccess('Report removed.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not remove report.');
    }
  };

  const maxDept = Math.max(...(report?.departments || []).map((row: any) => row.count), 1);

  return (
    <div className="space-y-6 fade-in-up">
      <AdminPageHeader
        title="Reports"
        description="Faculty-style live reporting with department UG/PG data, CSV export, and secure PDF report upload/download."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadCsv} disabled={!report} className={adminButton}><Download className="h-4 w-4" /> Download CSV</button>
            <button onClick={load} className={adminButton}><RefreshCw className="h-4 w-4" /> Refresh</button>
          </div>
        }
      />

      {error && <AdminNotice type="error" onRetry={load}>{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      {loading ? <AdminSkeletonBlock rows={6} /> : report && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Workshops', report.workshops, CalendarDays, 'blue'],
              ['Registrations', report.registrations, Users, 'purple'],
              ['Attendance', report.attendance, BarChart3, 'green'],
              ['Gallery Albums', report.galleryAlbums, Image, 'teal'],
              ['Pending ICC Cases', report.pendingIccCases, ShieldAlert, 'orange'],
            ].map(([label, value, Icon, tone]) => (
              <AdminStatCard key={label as string} label={label as string} value={formatNumber(value)} icon={Icon as any} tone={tone as any} footer="Live database aggregate" />
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className={`${adminCard} p-5`}>
              <h2 className="text-lg font-black text-[#071247]"><BarChart3 className="mr-1 inline h-4 w-4 text-[#2563eb]" /> Department-wise Students</h2>
              <p className="mt-1 text-xs font-semibold text-[#63708f]">Derived only from registered student profiles.</p>
              <div className="mt-4 space-y-3">
                {report.departments.map((row: any) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs"><span className="font-bold">{row.label}</span><strong>{row.count}</strong></div>
                    <div className="mt-1 flex gap-3 text-[10px] font-black text-[#64748b]"><span>UG {Number(row.ug || 0)}</span><span>PG {Number(row.pg || 0)}</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eef3ff]"><div className="h-full bg-[linear-gradient(90deg,#2563eb,#7c3aed)]" style={{ width: `${(row.count / maxDept) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${adminCard} p-5`}>
              <h2 className="text-lg font-black text-[#071247]">Module Status</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[...(report.skillRequests || []), ...(report.schemes || [])].map((row: any, index: number) => (
                  <div key={`${row.label}-${index}`} className="rounded-xl bg-[#f7faff] p-3 text-xs">
                    <span className="font-black text-[#10205a]">{String(row.label).replaceAll('_', ' ')}</span>
                    <span className="float-right font-black text-[#2563eb]">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className={`${adminCard} p-5`}>
        <div className="flex items-center gap-2">
          <FileUp className="h-5 w-5 text-[#2563eb]" />
          <h2 className="text-lg font-black text-[#071247]">Upload Report PDF</h2>
        </div>
        <p className="mt-1 text-xs font-semibold text-[#63708f]">PDF only. Stored using the existing protected upload validation rules.</p>
        <form onSubmit={uploadReport} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <input value={reportTitle} onChange={e => setReportTitle(e.target.value)} className={adminField} placeholder="Report title" />
          <input type="file" accept="application/pdf,.pdf" onChange={e => setReportFile(e.target.files?.[0] || null)} className={adminField} />
          <button disabled={uploading} className={adminButton}><FileUp className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload'}</button>
        </form>
      </section>

      <section className={`${adminCard} overflow-hidden`}>
        <div className="border-b border-[#edf2fb] px-5 py-4">
          <h2 className="text-lg font-black text-[#071247]">Uploaded Reports</h2>
          <p className="text-xs font-semibold text-[#63708f]">{documents.length} report document(s)</p>
        </div>
        {documents.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-[#63708f]">No report PDFs uploaded yet.</div>
        ) : (
          <div className="divide-y divide-[#edf2fb]">
            {documents.map(documentRow => (
              <div key={documentRow.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-[#071247]">{documentRow.title}</p>
                  <p className="mt-1 text-xs font-semibold text-[#63708f]">{documentRow.fileName} · {new Date(documentRow.uploadedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => downloadUploadedReport(documentRow)} className={adminButton}><Download className="h-4 w-4" /> Download</button>
                  <button type="button" onClick={() => removeDocument(documentRow.id)} className={adminButton}><Trash2 className="h-4 w-4" /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
