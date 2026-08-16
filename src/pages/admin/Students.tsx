import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { 
  Edit, SlidersHorizontal, CheckCircle, 
  AlertTriangle, Star, UserX 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '../../components/common/PageWrapper.js';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
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
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/admin/students');
      if (res.data.success) {
        setStudents(res.data.data);
        setFiltered(res.data.data);
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

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(st => 
        st.name.toLowerCase().includes(term) || 
        st.registerNumber.toLowerCase().includes(term) ||
        st.course.toLowerCase().includes(term)
      );
    }

    if (selectedDept) {
      result = result.filter(st => st.department === selectedDept);
    }

    if (selectedClub === 'yes') {
      result = result.filter(st => st.isSingaPenMember === true);
    } else if (selectedClub === 'no') {
      result = result.filter(st => st.isSingaPenMember !== true);
    }

    setFiltered(result);
  }, [search, selectedDept, selectedClub, students]);

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

  const uniqueDepts = Array.from(new Set(students.map(st => st.department).filter(Boolean)));

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Student Directory Management</h1>
          <p className="text-xs text-gray-500">Edit academic levels, promote Singa Pen executive club titles, or deactivate profiles.</p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
            <span>{successMsg}</span>
          </div>
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
        <section className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-maroon-700 pb-2 border-b border-gray-100">
            <SlidersHorizontal className="w-4 h-4 text-gold-600" />
            <span>Query Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search name, register number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
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
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Register Number</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Department & Course</th>
                    <th className="px-6 py-3">Study Year</th>
                    <th className="px-6 py-3">Academic Status</th>
                    <th className="px-6 py-3">Singa Pen Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
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
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          st.academicStatus === 'PASSED_OUT' ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {st.academicStatus}
                        </span>
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
                          className="p-1.5 hover:bg-rose-50 text-gray-700 hover:text-maroon-700 rounded transition-all inline-flex items-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st._id, st.name)}
                          title="Purge Profile"
                          className="p-1.5 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded transition-all inline-flex items-center"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
