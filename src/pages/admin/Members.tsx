import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { AdminNotice, AdminPageHeader, AdminSkeletonBlock, AdminStatCard, adminButton, adminCard, adminField, formatNumber } from '../../components/admin/AdminUI.js';
import { Mail, Phone, Plus, RefreshCw, Search, ShieldCheck, Star, UserPlus, Users } from 'lucide-react';

const emptyFacultyForm = {
  name: '',
  email: '',
  password: '',
  staffId: '',
  department: '',
  designation: '',
  phone: '',
};

export const AdminMembers: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState('');
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberType, setNewMemberType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentMemberRole, setStudentMemberRole] = useState('Member');
  const [facultyForm, setFacultyForm] = useState(emptyFacultyForm);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentRes, facultyRes] = await Promise.all([
        api.get('/admin/students', { params: { limit: 500 } }),
        api.get('/admin/faculty'),
      ]);
      setStudents(studentRes.data.data || []);
      setFaculty(facultyRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load member records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const linkStudentMember = async () => {
    const student = students.find(row => row._id === selectedStudentId);
    if (!student) {
      setError('Select an existing registered student first.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/admin/students/${student._id}/membership`, {
        isSingaPenMember: true,
        clubRole: studentMemberRole.trim() || 'Member',
      });
      if (!res.data.success) throw new Error(res.data.message || 'Could not link student membership.');
      setSuccess(`${student.name} is now linked as a Singa Pen student member.`);
      setSelectedStudentId('');
      setStudentMemberRole('Member');
      setShowNewMember(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not link student membership.');
    } finally {
      setSaving(false);
    }
  };

  const createFacultyMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...facultyForm,
        name: facultyForm.name.trim(),
        email: facultyForm.email.trim(),
        staffId: facultyForm.staffId.trim(),
        department: facultyForm.department.trim(),
        designation: facultyForm.designation.trim(),
        phone: facultyForm.phone.trim() || undefined,
      };
      const res = await api.post('/admin/faculty', payload);
      if (!res.data.success) throw new Error(res.data.message || 'Could not add faculty member.');
      setSuccess(`${payload.name} was added as a faculty member.`);
      setFacultyForm(emptyFacultyForm);
      setShowNewMember(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not add faculty member.');
    } finally {
      setSaving(false);
    }
  };

  const members = useMemo(() => {
    const studentMembers = students
      .filter(st => st.isSingaPenMember)
      .map(st => ({
        ...st,
        memberRole: st.clubRole || 'Member',
        accountRole: 'Student',
        facultyYear: `${st.department} / Year ${st.currentStudyYear || '-'}`,
      }));

    const facultyMembers = faculty.map(f => ({
      ...f,
      memberRole: f.designation || 'Faculty',
      accountRole: 'Faculty',
      facultyYear: f.department,
    }));

    return [...studentMembers, ...facultyMembers].filter(member => {
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || [
        member.name,
        member.email,
        member.registerNumber,
        member.staffId,
        member.department,
        member.memberRole,
      ].filter(Boolean).some(value => String(value).toLowerCase().includes(term));
      const matchesRole = !role || member.accountRole === role;
      return matchesSearch && matchesRole;
    });
  }, [students, faculty, search, role]);

  return (
    <div className="space-y-5 fade-in-up">
      <AdminPageHeader
        title="Member Management"
        description="Faculty and Singa Pen student members are managed together from live portal records."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowNewMember(current => !current)} className={adminButton}>
              <UserPlus className="h-4 w-4" /> New Member
            </button>
            <button type="button" onClick={load} className={adminButton}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        }
      />

      {error && <AdminNotice type="error" onRetry={load}>{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      {showNewMember && (
        <section className={`${adminCard} p-5`}>
          <div className="flex flex-col gap-3 border-b border-[#edf2fb] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#071247]">Add New Member</h2>
              <p className="mt-1 text-xs font-semibold text-[#63708f]">
                Choose Student or Faculty first. Registered students are linked without creating duplicate accounts.
              </p>
            </div>
            <button type="button" onClick={() => setShowNewMember(false)} className="rounded-lg border border-[#dfe7f6] px-3 py-2 text-xs font-black text-[#415176]">
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="grid content-start gap-2">
              {(['STUDENT', 'FACULTY'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewMemberType(type)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-black ${
                    newMemberType === type
                      ? 'border-[#2563eb] bg-[#eef3ff] text-[#1d4ed8]'
                      : 'border-[#edf2fb] bg-white text-[#415176]'
                  }`}
                >
                  {type === 'STUDENT' ? 'Student Member' : 'Faculty Member'}
                </button>
              ))}
            </div>

            {newMemberType === 'STUDENT' ? (
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className={`${adminField} w-full`}>
                  <option value="">Select registered student</option>
                  {students.filter(student => !student.isSingaPenMember).map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} · {student.registerNumber} · {student.department}
                    </option>
                  ))}
                </select>
                <input
                  value={studentMemberRole}
                  onChange={e => setStudentMemberRole(e.target.value)}
                  className={`${adminField} w-full`}
                  placeholder="Club role"
                />
                <button type="button" disabled={saving} onClick={linkStudentMember} className={adminButton}>
                  <Plus className="h-4 w-4" /> {saving ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            ) : (
              <form onSubmit={createFacultyMember} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input required value={facultyForm.name} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })} className={adminField} placeholder="Faculty name" />
                <input required type="email" value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} className={adminField} placeholder="Official email" />
                <input required minLength={8} type="password" value={facultyForm.password} onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })} className={adminField} placeholder="Temporary password" />
                <input required value={facultyForm.staffId} onChange={e => setFacultyForm({ ...facultyForm, staffId: e.target.value })} className={adminField} placeholder="Staff ID" />
                <input required value={facultyForm.department} onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })} className={adminField} placeholder="Department" />
                <input required value={facultyForm.designation} onChange={e => setFacultyForm({ ...facultyForm, designation: e.target.value })} className={adminField} placeholder="Designation" />
                <input value={facultyForm.phone} onChange={e => setFacultyForm({ ...facultyForm, phone: e.target.value })} className={adminField} placeholder="Phone (optional)" />
                <button disabled={saving} className={`${adminButton} md:col-span-2 xl:col-span-2`}>
                  <Plus className="h-4 w-4" /> {saving ? 'Creating...' : 'Create Faculty Member'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Directory Members" value={formatNumber(members.length)} icon={Users} tone="purple" footer="Student + faculty records" />
        <AdminStatCard label="Student Members" value={formatNumber(students.filter(st => st.isSingaPenMember).length)} icon={Star} tone="blue" footer="Singa Pen students" />
        <AdminStatCard label="Faculty Members" value={formatNumber(faculty.length)} icon={ShieldCheck} tone="teal" footer="Faculty accounts" />
      </section>

      <section className={`${adminCard} p-4`}>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#40528a]" />
            <input value={search} onChange={e => setSearch(e.target.value)} className={`${adminField} w-full pr-9`} placeholder="Search name, email, ID, department, role..." />
          </label>
          <select value={role} onChange={e => setRole(e.target.value)} className={`${adminField} w-full`}>
            <option value="">All Member Types</option>
            <option value="Student">Students</option>
            <option value="Faculty">Faculty</option>
          </select>
        </div>
      </section>

      {loading ? <AdminSkeletonBlock rows={8} /> : members.length === 0 ? (
        <div className={`${adminCard} p-10 text-center text-sm font-semibold text-[#415176]`}>No members match the selected filters.</div>
      ) : (
        <section className={`${adminCard} overflow-hidden`}>
          <div className="px-4 py-4">
            <h2 className="text-lg font-black text-[#071247]">Members Directory</h2>
            <p className="text-xs font-semibold text-[#63708f]">Cards and actions adapt to Student / Faculty type.</p>
          </div>
          <div className="grid gap-4 border-t border-[#edf2fb] p-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map(member => {
              const image = resolveUploadUrl(member.profileImage);
              const isStudent = member.accountRole === 'Student';
              return (
                <article key={`${member.accountRole}-${member._id}`} className="rounded-2xl border border-[#e3eaf8] bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {image ? (
                      <img src={image} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-xl bg-[#eef3ff] text-lg font-black text-[#2563eb]">
                        {String(member.name || 'M').slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-black text-[#071247]">{member.name}</h3>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${isStudent ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {member.accountRole}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-[#40528a]">{member.memberRole}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#63708f]">{member.facultyYear}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs">
                    {isStudent && member.registerNumber && <div className="rounded-lg bg-[#f7faff] px-3 py-2"><b>Register No:</b> {member.registerNumber}</div>}
                    {!isStudent && member.staffId && <div className="rounded-lg bg-[#f7faff] px-3 py-2"><b>Staff ID:</b> {member.staffId}</div>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe7f6] px-3 py-2 text-[11px] font-black text-[#1d4ed8]">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe7f6] px-3 py-2 text-[11px] font-black text-[#1d4ed8]">
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
