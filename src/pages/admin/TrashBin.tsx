import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api.js';
import {
  AlertTriangle,
  Archive,
  GraduationCap,
  Image,
  Landmark,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader, AdminNotice, AdminSkeletonBlock, adminButton, adminCard, adminGhostButton } from '../../components/admin/AdminUI.js';

interface TrashedScheme {
  _id: string;
  title: string;
  slug: string;
  provider?: string;
  category?: string;
  deletedAt?: string;
  deletedById?: string;
}

interface TrashedAlbum {
  _id: string;
  title: string;
  category?: string;
  deletedAt?: string;
  deletedById?: string;
}

interface TrashedStudent {
  _id: string;
  registerNumber: string;
  department?: string;
  course?: string;
  userId?: string;
  deletedAt?: string;
  deletedById?: string;
}

interface TrashData {
  schemes: TrashedScheme[];
  albums: TrashedAlbum[];
  students: TrashedStudent[];
  counts: { schemes: number; albums: number; students: number; total: number };
}

const EMPTY_TRASH: TrashData = {
  schemes: [],
  albums: [],
  students: [],
  counts: { schemes: 0, albums: 0, students: 0, total: 0 },
};

const formatDeletedAt = (value?: string) => {
  if (!value) return 'unknown time';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const AdminTrashBin: React.FC = () => {
  const [data, setData] = useState<TrashData>(EMPTY_TRASH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/trash');
      if (response.data.success) setData(response.data.data || EMPTY_TRASH);
      else setError('Could not load the Trash Bin.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load the Trash Bin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    window.setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const run = async (action: () => Promise<any>, onDone: (message: string) => void) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await action();
      onDone(response.data?.message || 'Done.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Action failed. Try again.', true);
    } finally {
      setBusy(false);
      void load();
    }
  };

  const restoreScheme = (scheme: TrashedScheme) => run(
    () => api.post(`/admin/trash/schemes/${scheme._id}/restore`),
    (message: string) => showToast(message),
  );

  const permanentDeleteScheme = (scheme: TrashedScheme) => {
    if (!window.confirm(`Permanently delete "${scheme.title}"? This cannot be undone.`)) return;
    void run(() => api.delete(`/admin/trash/schemes/${scheme._id}`), (message: string) => showToast(message));
  };

  const restoreAlbum = (album: TrashedAlbum) => run(
    () => api.post(`/admin/trash/gallery/${album._id}/restore`),
    (message: string) => showToast(message),
  );

  const permanentDeleteAlbum = (album: TrashedAlbum) => {
    if (!window.confirm(`Permanently delete "${album.title}" and all its photos? This cannot be undone.`)) return;
    void run(() => api.delete(`/admin/trash/gallery/${album._id}`), (message: string) => showToast(message));
  };

  const restoreStudent = (student: TrashedStudent) => run(
    () => api.post(`/admin/trash/students/${student._id}/restore`),
    (message: string) => showToast(message),
  );

  const permanentDeleteStudent = (student: TrashedStudent) => {
    if (!window.confirm(`Permanently delete student "${student.registerNumber}" and their account? This cannot be undone.`)) return;
    void run(() => api.delete(`/admin/trash/students/${student._id}`), (message: string) => showToast(message));
  };

  const emptyTrash = () => {
    if (confirmText !== 'DELETE ALL') {
      showToast('Type DELETE ALL to confirm emptying the Trash Bin.', true);
      return;
    }
    void run(() => api.delete('/admin/trash'), (message: string) => {
      showToast(message);
      setConfirmText('');
    });
  };

  const trashTotal = data.counts.total;

  return (
    <div className="space-y-5 fade-in-up">
      <AdminPageHeader
        title="Trash Bin"
        description="Soft-deleted records awaiting restore or permanent removal. Restoring brings a record fully back into use."
        action={<Archive className="h-6 w-6" />}
      />

      {error && <AdminNotice type="error">{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      {loading ? (
        <AdminSkeletonBlock rows={3} />
      ) : trashTotal === 0 ? (
        <div className={`${adminCard} flex flex-col items-center gap-3 p-10 text-center`}>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eef3ff] text-[#2563eb]"><Archive className="h-7 w-7" /></span>
          <h2 className="text-lg font-black text-[#071426]">The Trash Bin is empty</h2>
          <p className="max-w-sm text-sm font-semibold text-[#52617f]">Records you soft-delete (schemes, gallery albums, students) are listed here so they can always be recovered.</p>
        </div>
      ) : (
        <>
          {/* Students */}
          <section className={adminCard}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-[#2563eb]"><GraduationCap className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-black text-[#071426]">Students ({data.counts.students})</h2>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">Login is deactivated until restored.</p>
              </div>
            </div>
            {data.students.length === 0 ? <p className="mt-4 text-sm font-semibold text-[#64748b]">Nothing here.</p> : (
              <ul className="mt-4 divide-y divide-[#eef2fb]">
                {data.students.map(student => (
                  <li key={student._id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef3ff] text-[#2563eb]"><GraduationCap className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#071426]">{student.registerNumber}</p>
                      <p className="mt-0.5 text-xs font-semibold text-[#64748b]">{[student.course, student.department].filter(Boolean).join(' · ') || 'Student profile'} · deleted {formatDeletedAt(student.deletedAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busy} onClick={() => restoreStudent(student)} className={`${adminGhostButton} inline-flex items-center gap-1.5`}><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                      <button type="button" disabled={busy} onClick={() => permanentDeleteStudent(student)} className={`inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100`}><Trash2 className="h-3.5 w-3.5" /> Delete forever</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Schemes */}
          <section className={adminCard}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4ecff] text-[#7c3aed]"><Landmark className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-black text-[#071426]">Government Schemes ({data.counts.schemes})</h2>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">Hidden from public and admin listings until restored.</p>
              </div>
            </div>
            {data.schemes.length === 0 ? <p className="mt-4 text-sm font-semibold text-[#64748b]">Nothing here.</p> : (
              <ul className="mt-4 divide-y divide-[#eef2fb]">
                {data.schemes.map(scheme => (
                  <li key={scheme._id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f4ecff] text-[#7c3aed]"><Landmark className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#071426]">{scheme.title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-[#64748b]">{scheme.category || 'Scheme'} · deleted {formatDeletedAt(scheme.deletedAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busy} onClick={() => restoreScheme(scheme)} className={`${adminGhostButton} inline-flex items-center gap-1.5`}><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                      <button type="button" disabled={busy} onClick={() => permanentDeleteScheme(scheme)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /> Delete forever</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Gallery albums */}
          <section className={adminCard}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0f5] text-[#e91670]"><Image className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-black text-[#071426]">Gallery Albums ({data.counts.albums})</h2>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">Photos are kept on storage so a restore brings the album back intact.</p>
              </div>
            </div>
            {data.albums.length === 0 ? <p className="mt-4 text-sm font-semibold text-[#64748b]">Nothing here.</p> : (
              <ul className="mt-4 divide-y divide-[#eef2fb]">
                {data.albums.map(album => (
                  <li key={album._id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff0f5] text-[#e91670]"><Image className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#071426]">{album.title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-[#64748b]">{album.category || 'Album'} · deleted {formatDeletedAt(album.deletedAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busy} onClick={() => restoreAlbum(album)} className={`${adminGhostButton} inline-flex items-center gap-1.5`}><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                      <button type="button" disabled={busy} onClick={() => permanentDeleteAlbum(album)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /> Delete forever</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Empty trash */}
          <section className={`${adminCard} border-red-200`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-[#071426]">Empty the Trash Bin</h2>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">Permanently deletes every trashed record ({trashTotal}). This is irreversible.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="Type DELETE ALL to confirm"
                className="w-full max-w-xs rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-semibold text-[#071426] outline-none focus:border-red-400"
              />
              <button type="button" disabled={busy || confirmText !== 'DELETE ALL'} onClick={emptyTrash} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> Empty Trash Bin
              </button>
            </div>
          </section>
        </>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={() => void load()} className={`${adminButton}`}>Refresh</button>
      </div>
    </div>
  );
};