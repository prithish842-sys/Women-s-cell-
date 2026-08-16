import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { 
  Search, SlidersHorizontal, Eye, X, Award, Briefcase, 
  User, CheckCircle, HelpCircle, ArrowRight, BookOpen, Sparkles 
} from 'lucide-react';

export const FacultySearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Student for detailed Modal view
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStudyYear, setSelectedStudyYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStartup, setSelectedStartup] = useState(''); // 'all', 'interested', 'not_interested'

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/faculty/students/search');
      if (res.data.success) {
        setStudents(res.data.data);
        setFiltered(res.data.data);
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

  // Run filtering logic whenever filter state changes
  useEffect(() => {
    let result = [...students];

    // Search term checks Name, Course, Department, or skills array elements
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(st => {
        const matchesName = st.name.toLowerCase().includes(term);
        const matchesCourse = st.course.toLowerCase().includes(term);
        const matchesDept = st.department.toLowerCase().includes(term);
        const matchesSkills = st.skills?.some((sk: any) => 
          sk.skillName.toLowerCase().includes(term) || 
          sk.tools?.some((t: string) => t.toLowerCase().includes(term))
        );
        return matchesName || matchesCourse || matchesDept || matchesSkills;
      });
    }

    if (selectedDept) {
      result = result.filter(st => st.department === selectedDept);
    }

    if (selectedStudyYear) {
      result = result.filter(st => st.currentStudyYear === Number(selectedStudyYear));
    }

    if (selectedStatus) {
      result = result.filter(st => st.academicStatus === selectedStatus);
    }

    if (selectedStartup === 'interested') {
      result = result.filter(st => st.entrepreneurship?.interestedInEntrepreneurship === true);
    } else if (selectedStartup === 'not_interested') {
      result = result.filter(st => st.entrepreneurship?.interestedInEntrepreneurship !== true);
    }

    setFiltered(result);
  }, [searchTerm, selectedDept, selectedStudyYear, selectedStatus, selectedStartup, students]);

  const viewStudentDetails = async (id: string) => {
    setLoadingDetail(true);
    setSelectedStudent(null);
    try {
      // Use public/members endpoint or custom faculty view
      const res = await api.get(`/public/members/${id}`);
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

  // Find unique departments list for filter
  const uniqueDepts = Array.from(new Set(students.map(st => st.department).filter(Boolean)));

  return (
    <div className="space-y-6 fade-in-up relative">
      {/* Title */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-2xl font-bold text-maroon-700">Student Talent Matching Engine</h1>
        <p className="text-xs text-gray-500">Query complete student directories, examine verified skill logs, and match project positions.</p>
      </div>

      {/* Filter Options */}
      <section className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-maroon-700 pb-2 border-b border-gray-100">
          <SlidersHorizontal className="w-4 h-4 text-gold-600" />
          <span>Configure Search Matrices</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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

          {/* Startup Ambition */}
          <select
            value={selectedStartup}
            onChange={(e) => setSelectedStartup(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
          >
            <option value="">Startup Interest (Any)</option>
            <option value="interested">Interested in Startup</option>
            <option value="not_interested">Job Seek Profiles Only</option>
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
                      {st.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
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
                  {st.course} • Dept of {st.department}
                </p>

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
      )}

      {/* Portfolio modal Overlay */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border-t-8 border-gold-600 border-x border-b border-gray-250 p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl">
            {/* Close */}
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-rose-50 text-gray-400 hover:text-maroon-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header detail */}
            <div className="flex items-center space-x-4 border-b border-gray-100 pb-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-maroon-700 border-2 border-gold-600 flex items-center justify-center font-serif font-bold text-xl shrink-0">
                {selectedStudent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-serif text-xl font-bold text-maroon-700 leading-tight">{selectedStudent.name}</h3>
                <p className="text-xs text-rose-600 font-semibold">{selectedStudent.course} • Dept of {selectedStudent.department}</p>
                <div className="flex items-center space-x-2 pt-1 text-[10px] text-gray-400">
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
              <span className="block font-bold text-gray-400 uppercase tracking-wide">Incubation Interest</span>
              {selectedStudent.entrepreneurship?.interestedInEntrepreneurship ? (
                <div className="p-4 bg-amber-50/20 border border-amber-200 rounded-xl space-y-2.5">
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    ★ Incubation Candidate
                  </span>
                  <p className="font-serif font-medium text-sm text-maroon-900 italic">
                    "{selectedStudent.entrepreneurship.businessIdea}"
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Industry Domain: <strong>{selectedStudent.entrepreneurship.preferredIndustry || 'Vocational Handicrafts / Fine Arts'}</strong>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Focused primarily on corporate recruitment tracks.</p>
              )}
            </div>

            {/* Footer triggers */}
            <div className="pt-4 border-t border-gray-150 flex justify-between items-center text-xs">
              <div className="space-y-0.5 text-gray-500">
                <p>Email: <span className="font-mono bg-gray-50 px-1 border select-all">{selectedStudent.email}</span></p>
                <p>Phone: <span className="font-mono bg-gray-50 px-1 border select-all">{selectedStudent.phone}</span></p>
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
    </div>
  );
};
