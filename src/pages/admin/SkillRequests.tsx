import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api.js';
import { Award, Eye, Plus, RefreshCw, Search, Send, Trash2, XCircle } from 'lucide-react';

const emptyForm = {
  title: '',
  description: '',
  requiredSkills: '',
  preferredSkillLevel: '',
  department: '',
  requestType: 'EVENT',
  eventOrProjectName: '',
  requiredStudentCount: 1,
  deadline: '',
  contactPerson: '',
  contactInformation: '',
};

export const AdminSkillRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const requiredSkills = useMemo(() => form.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean), [form.requiredSkills]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/skill-requests', { params: { search, status } });
      setRequests(res.data.data || []);
    } catch {
      setError('Could not load skill requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const preview = async () => {
    if (requiredSkills.length === 0) return;
    const res = await api.post('/admin/skill-requests/preview-matches', {
      requiredSkills,
      preferredSkillLevel: form.preferredSkillLevel || undefined,
      department: form.department || undefined,
      limit: 10,
    });
    setMatches(res.data.data || []);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/skill-requests', {
        ...form,
        requiredSkills,
        preferredSkillLevel: form.preferredSkillLevel || null,
        department: form.department || null,
        eventOrProjectName: form.eventOrProjectName || null,
        deadline: form.deadline || null,
        contactPerson: form.contactPerson || null,
        contactInformation: form.contactInformation || null,
        requiredStudentCount: Number(form.requiredStudentCount) || null,
      });
      setForm(emptyForm);
      setMatches([]);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const mutate = async (path: string) => {
    await api.patch(path);
    await load();
  };

  const remove = async (id: string) => {
    await api.delete(`/admin/skill-requests/${id}`);
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Skill Request Board</h1>
          <p className="text-xs text-gray-500">Create real skill opportunities and notify matched students.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-xs font-bold text-maroon-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </section>

      <form onSubmit={submit} className="bg-white border border-gray-150 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-maroon-700">
          <Plus className="w-4 h-4" /> Create Draft Request
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input required placeholder="Required skills, comma separated" value={form.requiredSkills} onChange={e => setForm({ ...form, requiredSkills: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <select value={form.requestType} onChange={e => setForm({ ...form, requestType: e.target.value })} className="px-3 py-2 border rounded-md text-sm bg-white">
            {['COLLEGE_PROJECT','EVENT','WORKSHOP','DESIGN','CONTENT','MEDIA','ENTREPRENEURSHIP','VOLUNTEERING','OTHER'].map(type => <option key={type}>{type}</option>)}
          </select>
          <select value={form.preferredSkillLevel} onChange={e => setForm({ ...form, preferredSkillLevel: e.target.value })} className="px-3 py-2 border rounded-md text-sm bg-white">
            <option value="">Any level</option>
            {['BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'].map(level => <option key={level}>{level}</option>)}
          </select>
          <input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input placeholder="Event or project" value={form.eventOrProjectName} onChange={e => setForm({ ...form, eventOrProjectName: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input type="number" min={1} placeholder="Students needed" value={form.requiredStudentCount} onChange={e => setForm({ ...form, requiredStudentCount: Number(e.target.value) })} className="px-3 py-2 border rounded-md text-sm" />
          <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <input placeholder="Contact person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="px-3 py-2 border rounded-md text-sm" />
          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2 px-3 py-2 border rounded-md text-sm min-h-20" />
          <textarea placeholder="Contact information visible to matched students" value={form.contactInformation} onChange={e => setForm({ ...form, contactInformation: e.target.value })} className="px-3 py-2 border rounded-md text-sm min-h-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={preview} className="inline-flex items-center gap-2 px-4 py-2 border border-maroon-700 text-maroon-700 rounded-md text-xs font-bold">
            <Eye className="w-4 h-4" /> Preview Matches
          </button>
          <button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-700 text-white rounded-md text-xs font-bold">
            <Plus className="w-4 h-4" /> Save Draft
          </button>
        </div>
        {matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matches.map(student => (
              <div key={student.id} className="border rounded-lg p-3 bg-cream-50 text-xs">
                <div className="font-bold text-maroon-700">{student.name} <span className="text-gray-400">Score {student.matchScore}</span></div>
                <div className="text-gray-500">{student.department} · {student.course} · {student.academicStatus}</div>
                <div className="mt-2 flex flex-wrap gap-1">{student.matchedSkills.map((skill: string) => <span key={skill} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded">{skill}</span>)}</div>
              </div>
            ))}
          </div>
        )}
      </form>

      <section className="bg-white border border-gray-150 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input placeholder="Search requests" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-md text-sm" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-white">
            <option value="">All statuses</option>
            {['DRAFT','OPEN','CLOSED','CANCELLED'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={load} className="px-4 py-2 bg-gray-900 text-white rounded-md text-xs font-bold">Apply Filters</button>
        </div>
        {loading ? <div className="h-32 bg-gray-50 border rounded-xl animate-pulse" /> : error ? <p className="text-red-600 text-sm">{error}</p> : requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No skill requests found.</div>
        ) : (
          <div className="divide-y">
            {requests.map(request => (
              <div key={request._id} className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif font-bold text-maroon-700">{request.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100">{request.status}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">{request.matchingStudentCount} matched</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{request.description}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{request.requiredSkills.join(', ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.status !== 'OPEN' && <button onClick={() => mutate(`/admin/skill-requests/${request._id}/publish`)} className="px-3 py-1.5 bg-maroon-700 text-white rounded text-xs font-bold inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Publish</button>}
                  {request.status === 'OPEN' && <button onClick={() => mutate(`/admin/skill-requests/${request._id}/close`)} className="px-3 py-1.5 border rounded text-xs font-bold">Close</button>}
                  {request.status !== 'CANCELLED' && <button onClick={() => mutate(`/admin/skill-requests/${request._id}/cancel`)} className="px-3 py-1.5 border rounded text-xs font-bold inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cancel</button>}
                  {request.status === 'DRAFT' && <button onClick={() => remove(request._id)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
