import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { 
  Edit, SlidersHorizontal, CheckCircle, 
  AlertTriangle, Star, UserX, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { AdminNotice, AdminPageHeader, AdminStatCard, adminButton, adminCard, adminField, formatNumber } from '../../components/admin/AdminUI.js';
import { GraduationCap, Search, UserPlus, Users } from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{
    page: number;
    totalPages: number;
    total: number;
    departments: string[];
    programLevels: { ug: number; pg: number };
  }>({
    page: 1,
    totalPages: 1,
    total: 0,
    departments: [],
    programLevels: { ug: 0, pg: 0 },
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClub, setSelectedClub] = useState(''); // 'all', 'yes', 'no'

  // Edit Panel State
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [clubRole, setClubRole] = useState('');
  const [isSingaPenMember, setIsSingaPenMember] = useState(false);
  const [academicStatus, setAcademicStatus] = useState('ACTIVE');
  const [currentStudyYear, setCurrentStudyYear] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [page, search, selectedDept]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedDept]);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/admin/students', {
        params: {
          page,
          limit: 25,
          search: search.trim() || undefined,
          department: selectedDept || undefined,
        },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setFiltered(res.data.data);
        setMeta({
          page: res.data.meta?.page || page,
          totalPages: res.data.meta?.totalPages || 1,
          total: res.data.meta?.total ?? res.data.data.length,
          departments: Array.isArray(res.data.meta?.departments) ? res.data.meta.departments : [],
          programLevels: res.data.meta?.programLevels || { ug: 0, pg: 0 },
        });
      } else {
        setErrorMsg('Failed to query system student records.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setErrorMsg('Could not fetch student directory database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...students];

    if (selectedClub === 'yes') {
      result = result.filter(st => st.isSingaPenMember === true);
    } else if (selectedClub === 'no') {
      result = result.filter(st => st.isSingaPenMember !== true);
    }

    setFiltered(result);
  }, [selectedClub, students]);

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    setClubRole(student.clubRole || '');
    setIsSingaPenMember(student.isSingaPenMember || false);
    setAcademicStatus(student.academicStatus || 'ACTIVE');
    setCurrentStudyYear(student.currentStudyYear || 1);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        isSingaPenMember,
        clubRole: isSingaPenMember ? clubRole.trim() : '',
        academicStatus,
        currentStudyYear: Number(currentStudyYear)
      };

      const res = await api.put(`/admin/students/${editingStudent._id}`, payload);
      if (res.data.success) {
        setSuccessMsg(`Student "${editingStudent.name}" updated successfully!`);
        setEditingStudent(null);
        fetchStudents();
      } else {
        setErrorMsg(res.data.message || 'Failed to apply student changes.');
      }
    } catch (err) {
      console.error('Error updating student parameters:', err);
      setErrorMsg('Lost connection to academic server database.');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete student "${name}"? This will erase her complete portfolio and cannot be undone.`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/admin/students/${id}`);
      if (res.data.success) {
        setSuccessMsg(`Student profile for "${name}" has been permanently purged.`);
        fetchStudents();
      } else {
        setErrorMsg('Failed to purge student.');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      setErrorMsg('Lost connection to server during deletion.');
    }
  };

  const handleToggleAccount = async (student: any) => {
    const nextActive = student.isActive === false;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/admin/students/${student._id}/account-status`, { isActive: nextActive });
      if (!res.data.success) throw new Error(res.data.message || 'Could not update account status.');
      setSuccessMsg(`${student.name}'s linked account is now ${nextActive ? 'active' : 'suspended'}.`);
      setStudents(current => current.map(row => row._id === student._id ? { ...row, isActive: nextActive } : row));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Could not update linked account status.');
    }
  };

  const uniqueDepts = meta.departments;
  const activeCount = students.filter(st => st.academicStatus !== 'PASSED_OUT' && st.isActive !== false).length;
  const memberCount = students.filter(st => st.isSingaPenMember).length;
  const newCount = students.filter(st => {
    const created = st.createdAt ? new Date(st.createdAt).getTime() : 0;
    return created && Date.now() - created < 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <PageWrapper>
      <div className="space-y-5">
        <AdminPageHeader
          title="Student Management"
          description="Users + Students are merged here: manage registered student profiles, linked account status, academic details, UG/PG departments, and Singa Pen participation."
          action={<button onClick={fetchStudents} className={adminButton}><UserPlus className="h-4 w-4" /> Refresh Students</button>}
        />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Total Students" value={formatNumber(meta.total || students.length)} icon={Users} tone="purple" footer={`UG ${formatNumber(meta.programLevels.ug)} · PG ${formatNumber(meta.programLevels.pg)}`} />
          <AdminStatCard label="Active Students" value={formatNumber(activeCount)} icon={GraduationCap} tone="blue" footer={`Inactive / alumni: ${formatNumber(Math.max(students.length - activeCount, 0))}`} />
          <AdminStatCard label="New This Month" value={formatNumber(newCount)} icon={UserPlus} tone="orange" footer="Based on profile creation date" />
          <AdminStatCard label="Singa Pen Members" value={formatNumber(memberCount)} icon={CheckCircle} tone="teal" footer="Participation enabled" />
        </section>

        {/* Notifications */}
        {errorMsg && (
          <AdminNotice type="error">{errorMsg}</AdminNotice>
        )}

        {successMsg && (
          <AdminNotice type="success">{successMsg}</AdminNotice>
        )}

        {/* Edit Overlay Sheet */}
        <AnimatePresence mode="wait">
          {editingStudent && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-xl border-2 border-gold-600 shadow-md space-y-4 overflow-hidden"
            >
              <h3 className="font-serif text-base font-bold text-maroon-700 pb-2 border-b">
                Modify Parameters: {editingStudent.name} (Reg: {editingStudent.registerNumber})
              </h3>

              <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Academic Status</label>
                  <select
                    value={academicStatus}
                    onChange={(e) => setAcademicStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="FINAL_YEAR">FINAL_YEAR</option>
                    <option value="PASSING_OUT_SOON">PASSING_OUT_SOON</option>
                    <option value="PASSED_OUT">PASSED_OUT (Alumni)</option>
                  </select>
                </div>

                {/* Study Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Study Year Level</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={currentStudyYear}
                    onChange={(e) => setCurrentStudyYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                  />
                </div>

                {/* Singa Pen Club Member Toggle */}
                <div className="p-3 bg-rose-50/25 border rounded-lg flex items-start space-x-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="isSingaPenMember"
                    checked={isSingaPenMember}
                    onChange={(e) => setIsSingaPenMember(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700 mt-0.5"
                  />
                  <div className="space-y-1">
                    <label htmlFor="isSingaPenMember" className="block text-xs font-bold text-maroon-900 cursor-pointer">
                      Co-opt into Singa Pen Executive Club
                    </label>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Renders her portfolio in the public website Singa Pen club directory.
                    </p>
                  </div>
                </div>

                {/* Club Role Title (only if member) */}
                {isSingaPenMember && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Singa Pen Club Role Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Club Secretary, Lead Volunteer, Tech Coordinator"
                      value={clubRole}
                      onChange={(e) => setClubRole(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-3 sm:col-span-2 border-t flex justify-end space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-maroon-700 text-white rounded font-bold hover:bg-maroon-800 transition-colors"
                  >
                    Save Member Details
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Filter search block */}
        <section className={`${adminCard} p-4 space-y-4`}>
          <div className="flex items-center space-x-1.5 text-xs font-black text-[#10205a] pb-2 border-b border-[#edf2fb]">
            <SlidersHorizontal className="w-4 h-4 text-gold-600" />
            <span>Filters</span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#40528a]" />
              <input type="text" placeholder="Search by name, register number..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${adminField} w-full pr-9`} />
            </label>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`${adminField} w-full`}
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className={`${adminField} w-full`}
            >
              <option value="">All Club Toggles</option>
              <option value="yes">Singa Pen Executives Only</option>
              <option value="no">Unassigned Students</option>
            </select>
          </div>
        </section>

        {/* Table list */}
        {loading ? (
          <div className="bg-white rounded-xl border p-8 text-center text-xs text-gray-500 animate-pulse">
            Querying complete active list...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border text-gray-500 text-xs">
            No students match search filters.
          </div>
        ) : (
          <div className={`${adminCard} overflow-hidden`}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-lg font-black text-[#071247]">All Students ({formatNumber(filtered.length)})</h2>
              <span className="text-xs font-bold text-[#63708f]">Page {formatNumber(meta.page)} of {formatNumber(meta.totalPages)} · {formatNumber(meta.total)} real records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f7faff] border-b border-[#edf2fb] text-[10px] font-black text-[#17235c] uppercase tracking-normal">
                    <th className="px-6 py-3">Register Number</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Department & Course</th>
                    <th className="px-6 py-3">Study Year</th>
                    <th className="px-6 py-3">Academic / Account Status</th>
                    <th className="px-6 py-3">Singa Pen Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2fb] text-[#1b2b61]">
                  {filtered.map((st) => (
                    <tr key={st._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">{st.registerNumber}</td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold block text-gray-800">{st.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{st.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-medium">{st.course}</span>
                        <span className="text-[10px] text-gray-400">Dept of {st.department}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-maroon-700">Year {st.currentStudyYear}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                            st.academicStatus === 'PASSED_OUT'
                              ? 'bg-white text-slate-700 border border-slate-200'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {st.academicStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${st.isActive === false ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                            {st.isActive === false ? 'ACCOUNT SUSPENDED' : 'ACCOUNT ACTIVE'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {st.isSingaPenMember ? (
                          <span className="inline-flex items-center space-x-1 text-gold-600 font-bold bg-maroon-900 text-[9px] px-2 py-0.5 rounded border border-gold-500/10">
                            <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                            <span>{st.clubRole || 'Executive'}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => handleEditClick(st)}
                          title="Update Parameters"
                          className="p-1.5 hover:bg-rose-50 text-[#1b2b61] hover:text-maroon-700 rounded transition-all inline-flex items-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleAccount(st)}
                          title={st.isActive === false ? 'Activate linked account' : 'Suspend linked account'}
                          className={`p-1.5 rounded transition-all inline-flex items-center ${st.isActive === false ? 'text-emerald-700 hover:bg-emerald-50' : 'text-[#1b2b61] hover:bg-orange-50 hover:text-orange-700'}`}
                        >
                          {st.isActive === false ? <UserCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st._id, st.name)}
                          title="Purge Profile"
                          className="p-1.5 hover:bg-red-50 text-[#1b2b61] hover:text-red-700 rounded transition-all inline-flex items-center"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#edf2fb] px-4 py-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage(current => Math.max(current - 1, 1))} className="rounded-lg border border-[#dfe7f6] px-3 py-2 text-xs font-black text-[#415176] disabled:opacity-40">Previous</button>
              <span className="text-xs font-bold text-[#63708f]">Showing up to 25 records per page</span>
              <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-[#dfe7f6] px-3 py-2 text-xs font-black text-[#415176] disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
