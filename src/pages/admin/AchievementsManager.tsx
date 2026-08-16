import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api.js';
import { 
  PlusCircle, Edit2, Trash2, Award, Upload, FileText, Calendar, 
  MapPin, CheckCircle, AlertCircle, X, ArrowLeft, Search, Sparkles, Eye 
} from 'lucide-react';

interface StudentUser {
  _id: string;
  name: string;
  email: string;
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  achievementType: string;
  studentId?: string;
  memberName?: string;
  department?: string;
  eventName?: string;
  achievementDate?: string;
  level: string;
  position?: string;
  image?: string;
  certificate?: string;
  isFeatured: boolean;
  isPublic: boolean;
  studentName: string;
}

export const AchievementsManager: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Form State
  const [viewState, setViewState] = useState<'LIST' | 'FORM'>('LIST');
  const [isEditing, setIsEditing] = useState(false);
  const [achievementIdToEdit, setAchievementIdToEdit] = useState<string | null>(null);

  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [achievementType, setAchievementType] = useState('COMPETITION');
  const [studentAssociationMode, setStudentAssociationMode] = useState<'LINKED' | 'MANUAL'>('LINKED');
  const [studentId, setStudentId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [department, setDepartment] = useState('');
  const [eventName, setEventName] = useState('');
  const [achievementDate, setAchievementDate] = useState('');
  const [level, setLevel] = useState('COLLEGE');
  const [position, setPosition] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certFileName, setCertFileName] = useState<string | null>(null);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const types = [
    { value: 'COMPETITION', label: 'Competition Winner' },
    { value: 'ACADEMIC', label: 'Academic Distinction' },
    { value: 'SPORTS', label: 'Sports Medalist' },
    { value: 'CULTURAL', label: 'Cultural Champion' },
    { value: 'ENTREPRENEURSHIP', label: 'Campus Entrepreneurship' },
    { value: 'SKILL', label: 'Skill Certification' },
    { value: 'COMMUNITY_SERVICE', label: 'Community Service Award' },
    { value: 'LEADERSHIP', label: 'Student Leadership/Club Award' },
    { value: 'OTHER', label: 'Other Distinction' }
  ];

  const levels = [
    { value: 'COLLEGE', label: 'College Level' },
    { value: 'INTER_COLLEGE', label: 'Inter-Collegiate' },
    { value: 'DISTRICT', label: 'District Level' },
    { value: 'STATE', label: 'State Level' },
    { value: 'NATIONAL', label: 'National Level' },
    { value: 'INTERNATIONAL', label: 'International Level' },
    { value: 'OTHER', label: 'Other Level' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch achievements list
      const resAch = await api.get('/admin/achievements');
      if (resAch.data.success) {
        setAchievements(resAch.data.data);
      }

      // Fetch students list for dropdown mapping
      const resStud = await api.get('/admin/students');
      if (resStud.data.success) {
        // Extract student details from response format
        // Usually resides in resStud.data.data or nested
        const list = resStud.data.data?.map((p: any) => ({
          _id: p.userId || p._id,
          name: p.name || (p.userId ? p.userId.name : 'Unknown student'),
          email: p.email || (p.userId ? p.userId.email : '')
        })) || [];
        setStudents(list);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch achievements or student accounts list from server.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setAchievementIdToEdit(null);
    setTitle('');
    setDescription('');
    setAchievementType('COMPETITION');
    setStudentAssociationMode('LINKED');
    setStudentId(students[0]?._id || '');
    setMemberName('');
    setDepartment('Computer Science');
    setEventName('');
    setAchievementDate('');
    setLevel('COLLEGE');
    setPosition('');
    setIsFeatured(false);
    setIsPublic(true);
    setImageFile(null);
    setImagePreview(null);
    setCertFile(null);
    setCertFileName(null);
    setViewState('FORM');
  };

  const handleOpenEdit = (ach: Achievement) => {
    setIsEditing(true);
    setAchievementIdToEdit(ach._id);
    setTitle(ach.title);
    setDescription(ach.description);
    setAchievementType(ach.achievementType);
    
    if (ach.studentId) {
      setStudentAssociationMode('LINKED');
      setStudentId(ach.studentId);
    } else {
      setStudentAssociationMode('MANUAL');
      setMemberName(ach.memberName || '');
    }

    setDepartment(ach.department || 'Computer Science');
    setEventName(ach.eventName || '');
    setAchievementDate(ach.achievementDate ? ach.achievementDate.split('T')[0] : '');
    setLevel(ach.level);
    setPosition(ach.position || '');
    setIsFeatured(ach.isFeatured);
    setIsPublic(ach.isPublic);
    setImageFile(null);
    setImagePreview(ach.image || null);
    setCertFile(null);
    setCertFileName(ach.certificate ? 'Existing Document Attached' : null);
    setViewState('FORM');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Achievement photo size exceeds the allowed limit of 5MB.', true);
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Official certificate file size exceeds the allowed limit of 10MB.', true);
        return;
      }
      setCertFile(file);
      setCertFileName(file.name);
    }
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showNotification('Please provide achievement title and core description.', true);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('achievementType', achievementType);
      
      if (studentAssociationMode === 'LINKED') {
        if (!studentId) {
          showNotification('Please select a registered student user.', true);
          setLoading(false);
          return;
        }
        formData.append('studentId', studentId);
      } else {
        if (!memberName.trim()) {
          showNotification('Please provide the achiever name manually.', true);
          setLoading(false);
          return;
        }
        formData.append('memberName', memberName);
        formData.append('department', department);
      }

      if (eventName) formData.append('eventName', eventName);
      if (achievementDate) formData.append('achievementDate', achievementDate);
      formData.append('level', level);
      if (position) formData.append('position', position);
      formData.append('isFeatured', String(isFeatured));
      formData.append('isPublic', String(isPublic));

      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (certFile) {
        formData.append('certificate', certFile);
      }

      let res;
      if (isEditing && achievementIdToEdit) {
        res = await api.put(`/admin/achievements/${achievementIdToEdit}`, formData);
      } else {
        res = await api.post('/admin/achievements', formData);
      }

      if (res.data.success) {
        showNotification(isEditing ? 'Achievement updated successfully!' : 'New Achievement created successfully!');
        fetchData();
        setViewState('LIST');
      } else {
        showNotification(res.data.message || 'Error saving achievement details.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Error communicating with the database.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAchievement = async (id: string, name: string) => {
    if (!window.confirm(`Delete the achievement entry for "${name}" permanently? This will remove all files on disk.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.delete(`/admin/achievements/${id}`);
      if (res.data.success) {
        showNotification('Achievement entry successfully deleted from directory.');
        fetchData();
      } else {
        showNotification(res.data.message || 'Error during delete.', true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Error during delete request.', true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = achievements.filter(ach => {
    const matchesSearch = ach.title.toLowerCase().includes(search.toLowerCase()) ||
      ach.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (ach.eventName && ach.eventName.toLowerCase().includes(search.toLowerCase()));
    
    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && ach.achievementType === filterType;
  });

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header Block */}
      <section className="border-b border-matte-beige pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-matte-maroon">
            {viewState === 'LIST' ? 'Achievements Registry' : (isEditing ? 'Modify Merit Record' : 'Record New Achievement')}
          </h1>
          <p className="text-xs text-matte-charcoal/60 mt-0.5">
            {viewState === 'LIST' ? 'Track, approve, and display award-winning milestones and entrepreneur plans.' : 'Add or edit achievement particulars, certificates, and student profiles.'}
          </p>
        </div>

        <div className="flex gap-2">
          {viewState !== 'LIST' && (
            <button
              onClick={() => setViewState('LIST')}
              className="px-4 py-2 bg-matte-cream hover:bg-matte-beige/40 border border-matte-beige text-matte-maroon rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Registry</span>
            </button>
          )}
          {viewState === 'LIST' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-matte-maroon hover:bg-matte-maroon/90 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Achievement</span>
            </button>
          )}
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-matte-rose/30 text-matte-maroon p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-matte-rose shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium">{success}</p>
        </div>
      )}

      {/* VIEW 1: REGISTRY TABLE LIST */}
      {viewState === 'LIST' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-matte-cream rounded-2xl p-4 border border-matte-beige flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by student, award title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-matte-beige rounded-xl text-xs text-matte-charcoal placeholder-matte-charcoal/40 focus:outline-none"
              />
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-matte-charcoal/40" />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-56 bg-white border border-matte-beige rounded-xl p-2 text-xs text-matte-charcoal focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Achievement Types</option>
              {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-maroon"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-matte-cream border border-dashed border-matte-beige rounded-2xl p-8 space-y-3 max-w-lg mx-auto">
              <Award className="w-10 h-10 text-matte-charcoal/30 mx-auto" />
              <p className="font-serif text-base font-semibold text-matte-charcoal">No achievement records mapped</p>
              <p className="text-xs text-matte-charcoal/50">Record student hackathon wins, leadership milestones, and publications.</p>
            </div>
          ) : (
            <div className="bg-white border border-matte-beige rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-matte-cream border-b border-matte-beige text-xs font-bold text-matte-maroon uppercase tracking-wider">
                      <th className="p-4">Achiever / Student</th>
                      <th className="p-4">Award Title / Context</th>
                      <th className="p-4">Category / Level</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status Flags</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-matte-beige text-xs text-matte-charcoal">
                    {filtered.map((ach) => (
                      <tr key={ach._id} className="hover:bg-matte-cream/20 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-matte-maroon">{ach.studentName}</div>
                          <div className="text-[10px] text-matte-charcoal/50">{ach.department}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="font-medium text-matte-charcoal/90 truncate">{ach.title}</div>
                          <div className="text-[10px] text-matte-charcoal/50 truncate">{ach.eventName || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 bg-matte-cream border border-matte-beige rounded text-[9px] font-bold text-matte-maroon uppercase font-mono mr-1">
                            {ach.achievementType}
                          </span>
                          <span className="inline-block px-2 py-0.5 bg-rose-50 border border-matte-rose/20 rounded text-[9px] font-medium text-matte-maroon uppercase">
                            {ach.level}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {ach.achievementDate ? new Date(ach.achievementDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'No date'}
                        </td>
                        <td className="p-4 whitespace-nowrap space-x-1.5">
                          {ach.isFeatured && (
                            <span className="px-2 py-0.5 bg-matte-gold/20 text-matte-gold border border-matte-gold/40 rounded text-[9px] font-bold">Featured</span>
                          )}
                          {ach.isPublic ? (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px]">Public</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded text-[9px]">Private</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(ach)}
                            className="p-1.5 text-matte-charcoal hover:text-matte-maroon hover:bg-matte-cream rounded transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAchievement(ach._id, ach.studentName)}
                            className="p-1.5 text-matte-charcoal hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* VIEW 2: FORM */}
      {viewState === 'FORM' && (
        <form onSubmit={handleSaveAchievement} className="bg-white rounded-2xl border border-matte-beige p-6 sm:p-8 space-y-6 max-w-4xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Merit Award Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 1st Place, State Level hackathon 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-matte-charcoal/80">Category Type *</label>
                  <select
                    value={achievementType}
                    onChange={(e) => setAchievementType(e.target.value)}
                    className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none"
                  >
                    {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-matte-charcoal/80">Competition Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none"
                  >
                    {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Student Association Block */}
              <div className="space-y-2 p-4 bg-matte-cream/50 border border-matte-beige rounded-xl">
                <label className="text-xs font-bold text-matte-maroon block">Student Achiever Mapping</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="association"
                      checked={studentAssociationMode === 'LINKED'}
                      onChange={() => setStudentAssociationMode('LINKED')}
                      className="text-matte-maroon"
                    />
                    <span>Select Registered Student</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="association"
                      checked={studentAssociationMode === 'MANUAL'}
                      onChange={() => setStudentAssociationMode('MANUAL')}
                      className="text-matte-maroon"
                    />
                    <span>Type Name Manually</span>
                  </label>
                </div>

                {studentAssociationMode === 'LINKED' ? (
                  <div className="space-y-1">
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full bg-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Registered Student Profile --</option>
                      {students.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                    {students.length === 0 && (
                      <p className="text-[10px] text-matte-rose font-medium mt-1">No active student profiles loaded. Use Manual mode to type name.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-matte-charcoal/60">Full Achiever Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Keerthana Selvaraj"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full bg-white border border-matte-beige rounded-lg p-2 text-xs text-matte-charcoal focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-matte-charcoal/60">Department/Branch</label>
                      <input
                        type="text"
                        placeholder="e.g., Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white border border-matte-beige rounded-lg p-2 text-xs text-matte-charcoal focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-matte-charcoal/80">Date of Achievement</label>
                  <input
                    type="date"
                    value={achievementDate}
                    onChange={(e) => setAchievementDate(e.target.value)}
                    className="w-full bg-matte-white border border-matte-beige rounded-xl p-2 text-xs text-matte-charcoal focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-matte-charcoal/80">Position/Prize (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Gold Medal (1st Prize)"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Host Event Name</label>
                <input
                  type="text"
                  placeholder="e.g., IIT Madras Technical Symposium 2025"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-matte-charcoal/80">Achievement Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide brief outline of the winning submission, tech stack used, or business plan presented..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-matte-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none resize-none"
                />
              </div>

              {/* Event Photo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-matte-charcoal/80">Honor/Event Photo (Max 5MB)</label>
                <div className="flex gap-4 items-center">
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="w-28 h-20 bg-matte-cream rounded-xl border border-dashed border-matte-beige flex flex-col items-center justify-center cursor-pointer hover:bg-matte-blush/15 overflow-hidden shrink-0"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="w-4 h-4 text-matte-maroon mx-auto" />
                        <span className="text-[9px] text-matte-charcoal/50 block mt-1">Select File</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-xs text-matte-charcoal/60">
                    <p className="font-semibold text-matte-maroon">Event Banner / Portrait</p>
                    <p className="text-[10px] text-matte-charcoal/40">Provide custom file for gallery listing.</p>
                  </div>
                </div>
              </div>

              {/* PDF Certificate Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-matte-charcoal/80">Official PDF Certificate (Max 10MB)</label>
                <div className="flex gap-4 items-center">
                  <div 
                    onClick={() => certInputRef.current?.click()}
                    className="w-28 h-20 bg-matte-cream rounded-xl border border-dashed border-matte-beige flex flex-col items-center justify-center cursor-pointer hover:bg-matte-blush/15 overflow-hidden shrink-0"
                  >
                    <div className="text-center p-2">
                      <FileText className={`w-5 h-5 mx-auto ${certFileName ? 'text-green-600' : 'text-matte-maroon/60'}`} />
                      <span className="text-[9px] text-matte-charcoal/50 block mt-1 truncate max-w-[100px]">
                        {certFileName || 'Upload PDF'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={certInputRef}
                    accept=".pdf,image/*"
                    onChange={handleCertChange}
                    className="hidden"
                  />
                  <div className="text-xs text-matte-charcoal/60">
                    <p className="font-semibold text-matte-maroon">Verification Attachment</p>
                    <p className="text-[10px] text-matte-charcoal/40">Only valid PDF and high-res image files are allowed.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center space-x-2 text-xs text-matte-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-matte-beige text-matte-maroon focus:ring-0"
                  />
                  <span className="font-semibold text-matte-maroon">Feature this Merit on Home</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-matte-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-matte-beige text-matte-maroon focus:ring-0"
                  />
                  <span className="font-semibold text-green-700">Display Publicly</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-matte-beige flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setViewState('LIST')}
              className="px-5 py-2.5 bg-matte-cream hover:bg-matte-beige/40 border border-matte-beige text-matte-maroon rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-matte-maroon hover:bg-matte-maroon/90 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Saving Merit Profile...' : (isEditing ? 'Save Changes' : 'Record Merit Entry')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default AchievementsManager;
