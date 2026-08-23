import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import {
  Award,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';

type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

interface Skill {
  _id: string;
  skillName: string;
  skillLevel: SkillLevel;
  category: string;
  description?: string;
  isPrimary: boolean;
  tools: string[];
  yearsOfExperience: number;
  portfolioUrl?: string;
  certificateUrl?: string;
}

const categories = [
  'Technical',
  'Vocational',
  'Creative',
  'Fine Arts',
  'Fine Arts/Crafts',
  'Entrepreneurial',
  'Other',
];

export const StudentSkillsView: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('INTERMEDIATE');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [toolsInput, setToolsInput] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  useEffect(() => {
    void fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/students/me/skills');
      if (res.data.success) {
        setSkills(res.data.data ?? []);
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
      .map((tool) => tool.trim())
      .filter((tool) => tool.length > 0);

    const payload = new FormData();
    payload.append('skillName', skillName.trim());
    payload.append('skillLevel', skillLevel);
    payload.append('category', category);
    payload.append('description', description.trim());
    payload.append('isPrimary', String(isPrimary));
    payload.append('tools', parsedTools.join(','));
    payload.append('yearsOfExperience', String(yearsOfExperience));

    const existingSkill = editingId ? skills.find((skill) => skill._id === editingId) : null;
    payload.append('portfolioUrl', existingSkill?.portfolioUrl || '');
    payload.append('certificateUrl', existingSkill?.certificateUrl || '');

    if (certificateFile) {
      payload.append('certificate', certificateFile);
    }

    try {
      const request = editingId
        ? api.put(`/students/me/skills/${editingId}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : api.post('/students/me/skills', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

      const res = await request;

      if (res.data.success) {
        setSuccessMsg(
          editingId
            ? `Skill "${skillName}" updated successfully.`
            : `Skill "${skillName}" successfully added to your portfolio.`
        );
        await fetchSkills();
        resetForm();
      } else {
        setErrorMsg(res.data.message || 'Failed to save the skill.');
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
        setSuccessMsg(`Skill "${name}" deleted from your portfolio.`);
        await fetchSkills();
      } else {
        setErrorMsg('Failed to delete skill.');
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      setErrorMsg('Could not process skill deletion on the server.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in-up">
      <div className="rounded-[26px] bg-[linear-gradient(135deg,#eef3ff,#f4f1ff)] p-5 sm:p-6 shadow-[0_10px_28px_rgba(7,20,38,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Portfolio growth</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071426]">My Skills</h1>
            <p className="mt-2 text-sm font-semibold text-[#475569]">Build your real skills portfolio and keep your strengths ready for opportunities.</p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#7c3aed)] px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(49,102,224,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Skill</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs text-green-700">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {isEditing ? (
        <section className="space-y-6 rounded-xl border-2 border-gold-600/60 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-gray-150 pb-3">
            <h3 className="flex items-center gap-1.5 text-base font-bold text-maroon-700">
              <Award className="h-5 w-5 text-rose-600" />
              <span>{editingId ? 'Edit Skill Parameters' : 'Add New Portfolio Skill'}</span>
            </h3>
            <button type="button" onClick={resetForm} className="rounded p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Figma UI Design, Python Coding, Canvas Oil Painting"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-700"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-700"
                >
                  <option value="BEGINNER">Beginner (Basic Awareness)</option>
                  <option value="INTERMEDIATE">Intermediate (Competent)</option>
                  <option value="ADVANCED">Advanced (Independent)</option>
                  <option value="EXPERT">Expert (Highly Proficient)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Tools & Sub-skills</label>
                <input
                  type="text"
                  placeholder="e.g. Illustrator, Photoshop, Figma Pen Tool"
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Short Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Mention specific projects or certification scopes where this skill was utilized..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="space-y-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">Certificate PDF</span>
                <span className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-maroon-700" />
                  <span className="truncate">{certificateFile ? certificateFile.name : 'Choose PDF file'}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  />
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700"
              />
              <label htmlFor="isPrimary" className="cursor-pointer text-xs font-bold text-gray-700">
                Highlight as a Primary Skill (Renders prominently on dashboard)
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-gray-200 px-4 py-2 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded bg-maroon-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-maroon-800"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Skill</span>
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 rounded border bg-white"></div>
              <div className="h-20 rounded border bg-white"></div>
            </div>
          ) : skills.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-gray-150 bg-white py-12 text-center text-gray-500">
              <p className="text-base font-semibold">Your skills portfolio is currently empty</p>
              <p className="mx-auto max-w-sm text-xs">
                Create robust competency vectors so faculty members can easily match you for upcoming college events
                and projects!
              </p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add My First Skill</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {skills.map((sk) => (
                <div
                  key={sk._id}
                  className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                    sk.isPrimary ? 'border-amber-200' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-600">
                          {sk.category}
                        </span>
                        {sk.isPrimary && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700">
                            <Sparkles className="h-3 w-3 fill-gold-500 text-gold-500" />
                            <span>Primary</span>
                          </span>
                        )}
                        <h3 className="mt-2 text-base font-bold text-maroon-700">{sk.skillName}</h3>
                      </div>

                      <span className="rounded bg-maroon-700 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cream-100">
                        {sk.skillLevel}
                      </span>
                    </div>

                    {sk.description && (
                      <p className="mt-3.5 text-xs italic leading-relaxed text-gray-600">"{sk.description}"</p>
                    )}

                    {sk.tools && sk.tools.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {sk.tools.map((tool, idx) => (
                          <span
                            key={`${sk._id}-${idx}`}
                            className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-[#52617f]"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4 text-xs">
                    <button
                      type="button"
                      onClick={() => handleEditClick(sk)}
                      className="inline-flex items-center gap-1 rounded p-1.5 text-[#52617f] transition-all hover:bg-rose-50 hover:text-maroon-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sk._id, sk.skillName)}
                      className="inline-flex items-center gap-1 rounded p-1.5 text-[#64748b] transition-all hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
