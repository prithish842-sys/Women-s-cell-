import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, RefreshCw, Search, Users } from 'lucide-react';
import api, { resolveUploadUrl } from '../../utils/api.js';

type Member = {
  _id: string;
  name: string;
  department?: string;
  course?: string;
  clubRole?: string;
  academicStatus?: string;
  profileImage?: string;
};

export const StudentClub: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/public/members');
      if (!response.data.success) throw new Error('Unable to load club members.');
      setMembers(response.data.data || []);
    } catch {
      setError('Could not load the Singa Pen Club directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) => [member.name, member.department, member.course, member.clubRole]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term)));
  }, [members, search]);

  return (
    <div className="space-y-5 fade-in-up">
      <section className="overflow-hidden rounded-[20px] bg-[linear-gradient(110deg,#06123a,#2420a2_58%,#ec0875)] p-5 text-white shadow-[0_18px_38px_rgba(23,24,104,0.2)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-white/50 bg-white/10"><Crown className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Singa Pen Club</h1>
                <p className="mt-1 text-sm font-semibold text-white/75">A real student-led community for leadership, service and shared growth.</p>
              </div>
            </div>
          </div>
          <Link to="/members" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-black text-[#3120a6]">Open Full Directory <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-5 sm:grid-cols-4">
          <div><p className="text-xs font-bold text-white/60">Visible members</p><p className="mt-1 text-2xl font-black">{members.length}</p></div>
          <div><p className="text-xs font-bold text-white/60">Active roles</p><p className="mt-1 text-2xl font-black">{new Set(members.map((member) => member.clubRole).filter(Boolean)).size}</p></div>
          <div><p className="text-xs font-bold text-white/60">Current students</p><p className="mt-1 text-2xl font-black">{members.filter((member) => member.academicStatus !== 'PASSED_OUT').length}</p></div>
          <div><p className="text-xs font-bold text-white/60">Community link</p><p className="mt-1 text-sm font-black">Public directory</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-black text-[#071426]">Committee & Members</h2><p className="mt-1 text-xs font-semibold text-[#52617f]">Search the current records published by Singa Pen.</p></div>
          <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748b]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members..." className="w-full rounded-lg border border-[#dfe7fb] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#6d5dfc]" /></div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-[#e6ebf7] bg-white" />)}</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700"><p>{error}</p><button type="button" onClick={load} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-black"><RefreshCw className="h-4 w-4" /> Retry</button></div>
      ) : visibleMembers.length === 0 ? (
        <div className="rounded-xl border border-[#e6ebf7] bg-white p-10 text-center text-sm font-semibold text-[#64748b]">No members match this search.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMembers.map((member) => (
            <article key={member._id} className="flex items-center gap-3 rounded-xl border border-[#e6ebf7] bg-white p-4 shadow-[0_10px_22px_rgba(7,20,38,0.04)]">
              {member.profileImage ? <img src={resolveUploadUrl(member.profileImage)} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-[#eef3ff]" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#eef3ff] text-lg font-black text-[#4f46e5]">{member.name.slice(0, 1)}</span>}
              <div className="min-w-0"><h3 className="truncate text-sm font-black text-[#071426]">{member.name}</h3><p className="mt-1 text-xs font-bold text-[#4f46e5]">{member.clubRole || 'Club member'}</p><p className="mt-1 truncate text-[11px] font-semibold text-[#64748b]">{member.department || member.course || 'Singa Pen community'}</p></div>
              <Users className="ml-auto h-4 w-4 shrink-0 text-[#a5b4fc]" />
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
