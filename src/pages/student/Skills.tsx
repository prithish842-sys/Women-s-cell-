import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { Award, Plus, Trash2, Edit3, CheckCircle, AlertTriangle, Save, X, Sparkles, FileText } from 'lucide-react';

interface Skill {
  _id: string;
  skillName: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category: string;
  description?: string;
  isPrimary: boolean;
  tools: string[];
  yearsOfExperience: number;
  portfolioUrl?: string;
  certificateUrl?: string;
}

export const StudentSkillsView: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Management
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [toolsInput, setToolsInput] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const categories = [
    'Technical', 'Vocational', 'Creative', 'Fine Arts', 'Fine Arts/Crafts', 
    'Entrepreneurial', 'Other'
  ];

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/students/me/skills');
      if (res.data.success) {
        setSkills(res.data.data);
      } else {
        setErrorMsg('Failed to load your skills portfolio.');
      }
    } catch (err) {
      console.error('Error fetching student skills:', err);
      setErrorMsg('Could not fetch skills database record.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSkillName('');
    setSkillLevel('INTERMEDIATE');
    setCategory('Technical');
    setDescription('');
    setIsPrimary(false);
    setToolsInput('');
    setYearsOfExperience(0);
    setCertificateFile(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (skill: Skill) => {
    setIsEditing(true);
    setEditingId(skill._id);
    setSkillName(skill.skillName);
    setSkillLevel(skill.skillLevel);
    setCategory(skill.category);
    setDescription(skill.description || '');
    setIsPrimary(skill.isPrimary);
    setToolsInput(skill.tools ? skill.tools.join(', ') : '');
    setYearsOfExperience(skill.yearsOfExperience || 0);
    setCertificateFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!skillName.trim()) {
      setErrorMsg('Please specify a unique skill name.');
      return;
    }

    const parsedTools = toolsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = new FormData();
    payload.append('skillName', skillName.trim());
    payload.append('skillLevel', skillLevel);
    payload.append('category', category);
    payload.append('description', description.trim());
    payload.append('isPrimary', String(isPrimary));
    payload.append('tools', parsedTools.join(','));
    payload.append('yearsOfExperience', String(yearsOfExperience));
    const existingSkill = editingId ? skills.find(skill => skill._id === editingId) : null;
    payload.append('portfolioUrl', existingSkill?.portfolioUrl || '');
    payload.append('certificateUrl', existingSkill?.certificateUrl || '');
    if (certificateFile) payload.append('certificate', certificateFile);

    try {
      if (editingId) {
        // Update Skill
        const res = await api.put(`/students/me/skills/${editingId}`, payload);
        if (res.data.success) {
          setSuccessMsg(`Skill "${skillName}" updated successfully!`);
          fetchSkills();
          resetForm();
        } else {
          setErrorMsg(res.data.message || 'Failed to update skill parameters.');
        }
      } else {
        // Create Skill
        const res = await api.post('/students/me/skills', payload);
        if (res.data.success) {
          setSuccessMsg(`Skill "${skillName}" successfully logged to portfolio!`);
          fetchSkills();
          resetForm();
        } else {
          setErrorMsg(res.data.message || 'Failed to register skill.');
        }
      }
    } catch (err: any) {
      console.error('Error saving skill:', err);
      setErrorMsg(err.response?.data?.message || 'Server error saving competency.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the skill "${name}" from your portfolio?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/students/me/skills/${id}`);
      if (res.data.success) {
        setSuccessMsg(`Skill "${name}" deleted from your roster.`);
        fetchSkills();
      } else {
        setErrorMsg('Failed to delete skill.');
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      setErrorMsg('Could not process skill deletion on the server.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">My Skills Portfolio</h1>
          <p className="text-xs text-gray-500">Log technical, fine arts, vocational, and creative skills.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold inline-flex items-center space-x-1 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Skill</span>
          </button>
        )}
      </div>

      {/* Message banners */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start space-x-2">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editing or Adding Form Block */}
      {isEditing && (
        <section className="bg-white p-6 rounded-xl border-2 border-gold-600/60 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150">
            <h3 className="font-serif text-base font-bold text-maroon-700 flex items-center space-x-1.5">
              <Award className="w-5 h-5 text-rose-600" />
              <span>{editingId ? 'Edit Skill Parameters' : 'Add New Portfolio Skill'}</span>
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Skill Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Figma UI Design, Python Coding, Canvas Oil Painting"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Skill Level */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none bg-white"
                >
                  <option value="BEGINNER">Beginner (Basic Awareness)</option>
                  <option value="INTERMEDIATE">Intermediate (Competent)</option>
                  <option value="ADVANCED">Advanced (Independent)</option>
                  <option value="EXPERT">Expert (Highly Proficient)</option>
                </select>
              </div>

              {/* Tools Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Tools & Sub-skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Illustrator, Photoshop, Figma Pen Tool"
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Short Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Mention specific projects or certification scopes where this skill was utilized..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none font-sans"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="space-y-1">
                <span className="block text-xs font-bold text-gray-500 uppercase">Certificate PDF</span>
                <span className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded bg-white cursor-pointer">
                  <FileText className="w-4 h-4 text-maroon-700" />
                  <span className="truncate">{certificateFile ? certificateFile.name : 'Choose PDF file'}</span>
                  <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} />
                </span>
              </label>
            </div>

            {/* Is Primary */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700"
              />
              <label htmlFor="isPrimary" className="text-xs font-bold text-gray-700 cursor-pointer">
                Highlight as a Primary Skill (Renders prominently on dashboard)
              </label>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-bold border border-gray-200 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold shadow inline-flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Skill</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Skills list cards layout */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-white rounded border"></div>
          <div className="h-20 bg-white rounded border"></div>
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-150 rounded-xl text-gray-500 space-y-3">
          <p className="font-semibold text-base">Your skills portfolio is currently empty</p>
          <p className="text-xs max-w-sm mx-auto">Create robust competency vectors so faculty members can easily match you for upcoming college events and projects!</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded text-xs font-bold inline-flex items-center space-x-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add My First Skill</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((sk) => (
            <div
              key={sk._id}
              className={`bg-white rounded-xl p-5 border shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md ${
                sk.isPrimary ? 'border-l-4 border-l-gold-600 border-gray-250' : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-50 text-rose-600 rounded">
                      {sk.category}
                    </span>
                    {sk.isPrimary && (
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded ml-1.5 inline-flex items-center space-x-0.5">
                        <Sparkles className="w-3 h-3 text-gold-500 fill-gold-500" />
                        <span>Primary</span>
                      </span>
                    )}
                    <h3 className="text-base font-bold text-maroon-700 mt-2">{sk.skillName}</h3>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-maroon-700 text-cream-100 rounded uppercase">
                    {sk.skillLevel}
                  </span>
                </div>

                {sk.description && (
                  <p className="text-xs text-gray-600 mt-3.5 leading-relaxed italic">
                    "{sk.description}"
                  </p>
                )}

                {sk.tools && sk.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {sk.tools.map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 mt-5 flex items-center justify-end space-x-2 text-xs">
                <button
                  onClick={() => handleEditClick(sk)}
                  className="p-1.5 text-gray-500 hover:text-maroon-700 hover:bg-rose-50/55 rounded transition-all inline-flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(sk._id, sk.skillName)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all inline-flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
