import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { RoleUpdatesReviewPanel } from '../../components/roleUpdates/RoleUpdatesReviewPanel.js';
import { 
  Search, SlidersHorizontal, Eye, X, Award, Briefcase,
  User, CheckCircle, HelpCircle, ArrowRight, BookOpen, Sparkles,
  Mail, PhoneCall 
} from 'lucide-react';
import fallbackProfile from '../../assets/images/placeholders/default-profile.webp';

export const FacultySearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, departments: [] as string[], courses: [] as string[], programLevels: { UG: 0, PG: 0 } });

  // Selected Student for detailed Modal view
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudyYear, setSelectedStudyYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProgramLevel, setSelectedProgramLevel] = useState('');
  const [selectedStartup, setSelectedStartup] = useState(''); // 'all', 'interested', 'not_interested'

  useEffect(() => {
    fetchStudents();
  }, [page, searchTerm, selectedDept, selectedCourse, selectedStudyYear, selectedStatus, selectedProgramLevel, selectedStartup]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDept, selectedCourse, selectedStudyYear, selectedStatus, selectedProgramLevel, selectedStartup]);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/faculty/students/search', {
        params: {
          page,
          limit: 12,
          keyword: searchTerm.trim() || undefined,
          department: selectedDept || undefined,
          course: selectedCourse || undefined,
          academicStatus: selectedStatus || undefined,
          programLevel: selectedProgramLevel || undefined,
          studyYear: selectedStudyYear || undefined,
          entrepreneurshipInterest: selectedStartup === 'interested' ? 'true' : selectedStartup === 'not_interested' ? 'false' : undefined,
        },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setFiltered(res.data.data);
        setMeta(res.data.meta || { page, totalPages: 1, total: res.data.data.length, departments: [], courses: [], programLevels: { UG: 0, PG: 0 } });
      } else {
        setErrorMsg('Failed to query active student records.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setErrorMsg('Lost connection to student directory database.');
    } finally {
      setLoading(false);
    }
  };

  const viewStudentDetails = async (id: string) => {
    setLoadingDetail(true);
    setSelectedStudent(null);
    try {
      const res = await api.get(`/faculty/students/${id}`);
      if (res.data.success) {
        setSelectedStudent(res.data.data);
      }
    } catch (err) {
      console.error('Error retrieving details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED_OUT': return 'bg-gray-100 text-gray-700';
      case 'PASSING_OUT_SOON': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'FINAL_YEAR': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-green-50 text-green-700 border border-green-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PASSED_OUT': return 'Passed Out / Alumni';
      case 'PASSING_OUT_SOON': return 'Passing Out Soon';
      case 'FINAL_YEAR': return 'Final Year';
      default: return 'Active Student';
    }
  };

  const uniqueDepts = meta.departments.length ? meta.departments : Array.from(new Set(students.map(st => st.department).filter(Boolean)));
  const uniqueCourses = meta.courses.length ? meta.courses : Array.from(new Set(students.map(st => st.course).filter(Boolean)));

  return (
    <div className="space-y-5 fade-in-up relative">
      <section className="flex flex-col gap-4 rounded-[20px] bg-[linear-gradient(110deg,#eef3ff,#f4f1ff)] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Faculty student management</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071426]">Students</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-[#52617f]">
              Student Overview, Student In-Charges and approval review are combined here. Search live registered students, open permitted profiles and contact students directly.
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase text-[#64748b]">Matching students</p>
            <p className="mt-1 text-2xl font-black text-[#4f46e5]">{meta.total}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/70 bg-white/85 p-4">
            <p className="text-[10px] font-black uppercase text-[#64748b]">Live departments</p>
            <p className="mt-1 text-2xl font-black text-[#071426]">{meta.departments.length}</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/85 p-4">
            <p className="text-[10px] font-black uppercase text-[#64748b]">UG students</p>
            <p className="mt-1 text-2xl font-black text-[#2563eb]">{meta.programLevels?.UG || 0}</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/85 p-4">
            <p className="text-[10px] font-black uppercase text-[#64748b]">PG students</p>
            <p className="mt-1 text-2xl font-black text-[#7c3aed]">{meta.programLevels?.PG || 0}</p>
          </div>
        </div>
      </section>

      {/* Filter Options */}
      <section className="space-y-4 rounded-xl border border-[#e4eaff] bg-white p-5 shadow-sm">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-maroon-700 pb-2 border-b border-gray-100">
          <SlidersHorizontal className="w-4 h-4 text-gold-600" />
          <span>Configure Search Matrices</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
          {/* Keyword skill / name search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Figma, python, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none bg-white"
            />
          </div>

          {/* Department Filter */}
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
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
          >
            <option value="">All Courses</option>
            {uniqueCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          {/* Study Year */}
          <select
            value={selectedStudyYear}
            onChange={(e) => setSelectedStudyYear(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
          >
            <option value="">All Study Years</option>
            <option value="1">1st Year Student</option>
            <option value="2">2nd Year Student</option>
            <option value="3">3rd Year Student</option>
            <option value="4">4th Year Student</option>
          </select>

          {/* Academic Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
          >
            <option value="">All Academic Statuses</option>
            <option value="ACTIVE">Active Student</option>
            <option value="FINAL_YEAR">Final Year</option>
            <option value="PASSING_OUT_SOON">Passing Out Soon</option>
            <option value="PASSED_OUT">Passed Out Alumni</option>
          </select>

          {/* UG / PG is derived from the student's live course data. */}
          <select
            value={selectedProgramLevel}
            onChange={(e) => setSelectedProgramLevel(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
          >
            <option value="">UG & PG</option>
            <option value="UG">UG Students</option>
            <option value="PG">PG Students</option>
          </select>

          {/* Startup Ambition */}
          <select
            value={selectedStartup}
            onChange={(e) => setSelectedStartup(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
          >
            <option value="">Entrepreneurship Interest</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not marked</option>
          </select>
        </div>
      </section>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-44 bg-white border rounded-xl"></div>
          <div className="h-44 bg-white border rounded-xl"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
          <p className="font-semibold text-sm">No matching student profiles found.</p>
          <p className="text-xs mt-1">Refine your keyword search tags to display more students.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((st) => (
            <div 
              key={st._id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 border border-gold-500 text-maroon-700 font-serif font-bold flex items-center justify-center">
                      <img
                        src={resolveUploadUrl(st.profileImage) || fallbackProfile}
                        onError={(event) => { event.currentTarget.src = fallbackProfile; }}
                        alt={`${st.name} profile`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 leading-tight">{st.name}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Reg: {st.registerNumber}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(st.academicStatus)}`}>
                    {getStatusLabel(st.academicStatus)}
                  </span>
                </div>

                {/* Dept course info */}
                <p className="text-xs text-rose-600 font-medium mt-4">
                  {st.course} • Dept of {st.department} • {st.programLevel || 'UG'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-black uppercase text-[#2563eb]">
                    {st.programLevel || 'UG'}
                  </span>
                  {st.isSingaPenMember && (
                    <span className="rounded-full bg-[#fff0f6] px-2 py-1 text-[9px] font-black text-[#e91670]">
                      {st.clubRole || 'Singa Pen Member'}
                    </span>
                  )}
                </div>

                {/* Teaser Skills list */}
                {st.skills && st.skills.length > 0 && (
                  <div className="mt-3.5 space-y-1">
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Primary Skills</span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {st.skills.slice(0, 3).map((sk: any, i: number) => (
                        <span key={i} className="text-[9px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-semibold">
                          {sk.skillName} ({sk.skillLevel})
                        </span>
                      ))}
                      {st.skills.length > 3 && (
                        <span className="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold">
                          +{st.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* View Trigger */}
              <div className="pt-4 border-t border-gray-100 mt-5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400">Class Batch: {st.joiningAcademicYear}</span>
                <button
                  onClick={() => viewStudentDetails(st._id)}
                  className="text-xs font-bold text-maroon-700 hover:text-rose-600 inline-flex items-center space-x-1"
                >
                  <span>Verify Portfolio</span>
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
          <div className="flex items-center justify-between rounded-xl border border-[#e4eaff] bg-white px-4 py-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage(current => Math.max(current - 1, 1))} className="rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#415176] disabled:opacity-40">Previous</button>
            <span className="text-xs font-bold text-[#63708f]">Page {meta.page} of {meta.totalPages} · {meta.total} authorized records</span>
            <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#415176] disabled:opacity-40">Next</button>
          </div>
        </>
      )}

      {/* Portfolio modal Overlay */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="relative max-h-[85vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-2xl border border-gold-600 bg-white p-6 shadow-2xl sm:p-8">
            {/* Close */}
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-[#64748b] transition-colors hover:bg-rose-50 hover:text-maroon-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header detail */}
            <div className="flex items-center space-x-4 border-b border-gray-100 pb-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#d7e2ff] bg-[#eef3ff]">
                <img
                  src={resolveUploadUrl(selectedStudent.profileImage) || fallbackProfile}
                  onError={(event) => { event.currentTarget.src = fallbackProfile; }}
                  alt={`${selectedStudent.name} profile`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-serif text-xl font-bold text-maroon-700 leading-tight">{selectedStudent.name}</h3>
                <p className="text-xs text-rose-600 font-semibold">{selectedStudent.course} • Dept of {selectedStudent.department} • {selectedStudent.programLevel || 'UG'}</p>
                <div className="flex items-center space-x-2 pt-1 text-[10px] text-[#64748b]">
                  <span>Reg: {selectedStudent.registerNumber}</span>
                  <span>•</span>
                  <span>Batch: {selectedStudent.joiningAcademicYear}</span>
                </div>
              </div>
            </div>

            {/* Content row 1: Bio */}
            <div className="space-y-1 text-xs">
              <span className="block font-bold text-gray-400 uppercase tracking-wide">Public Biography</span>
              <p className="text-gray-700 leading-relaxed italic bg-gray-50 p-3.5 rounded border border-gray-150">
                "{selectedStudent.bio || 'This student has not written a personal bio description yet.'}"
              </p>
            </div>

            {/* Content row 2: Skills list */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Verified Technical Skillsets</span>
              {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedStudent.skills.map((sk: any, i: number) => (
                    <div key={i} className="p-3 bg-rose-50/15 border border-rose-200/50 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-maroon-700">{sk.skillName}</strong>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-maroon-700 text-cream-100 rounded">
                          {sk.skillLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">Category: {sk.category}</p>
                      {sk.tools && sk.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {sk.tools.map((t: string, ti: number) => (
                            <span key={ti} className="text-[9px] px-1.5 py-0.5 bg-white text-rose-600 border rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No skill tags registered yet.</p>
              )}
            </div>

            {/* Content row 3: Entrepreneurship interest */}
            <div className="space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-700">
              <span className="block font-bold text-gray-400 uppercase tracking-wide">Entrepreneurship Interest</span>
              {selectedStudent.entrepreneurship?.interestedInEntrepreneurship ? (
                <div className="p-4 bg-amber-50/20 border border-amber-200 rounded-xl space-y-2.5">
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Entrepreneurship Candidate
                  </span>
                  <p className="font-serif font-medium text-sm text-maroon-900 italic">
                    "{selectedStudent.entrepreneurship.businessIdea}"
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Industry Domain: <strong>{selectedStudent.entrepreneurship.preferredIndustry || 'Not specified'}</strong>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No entrepreneurship interest is currently recorded for this student.</p>
              )}
            </div>

            {/* Footer triggers */}
            <div className="flex flex-col gap-3 border-t border-gray-150 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {selectedStudent.email && (
                  <a
                    href={`mailto:${selectedStudent.email}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#eef3ff] px-3 py-2 text-xs font-black text-[#2563eb]"
                  >
                    <Mail className="h-4 w-4" /> Email Student
                  </a>
                )}
                {selectedStudent.phone && (
                  <a
                    href={`tel:${selectedStudent.phone}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#ecfdf5] px-3 py-2 text-xs font-black text-[#059669]"
                  >
                    <PhoneCall className="h-4 w-4" /> Call Student
                  </a>
                )}
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="space-y-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2563eb]">Student In-Charges & Approvals</p>
          <h2 className="mt-1 text-2xl font-black text-[#071426]">Review student responsibility updates</h2>
          <p className="mt-1 text-sm font-semibold text-[#64748b]">
            The former In-Charges and Approvals views are merged below. Review only the role-update records permitted to Faculty.
          </p>
        </div>
        <RoleUpdatesReviewPanel mode="faculty" />
      </section>
    </div>
  );
};
