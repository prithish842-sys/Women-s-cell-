import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { ArrowLeft, UserCheck, Award, Briefcase, Calendar, Sparkles, AlertTriangle } from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMemberDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/public/members/${id}`);
        if (res.data.success) {
          setMember(res.data.data);
        } else {
          setError('We could not load this member details.');
        }
      } catch (err) {
        console.error('Error fetching member details:', err);
        setError('Connection lost or member does not exist in the active club roster.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMemberDetail();
  }, [id]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'FACULTY': return 'Faculty';
      case 'PASSED_OUT': return 'Passed Out / Alumni';
      case 'PASSING_OUT_SOON': return 'Passing Out Soon';
      case 'FINAL_YEAR': return 'Final Year';
      default: return 'Active Enrolled Student';
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-12 h-12 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-500 font-serif">Loading complete portfolio...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-xl font-bold text-gray-800">Portfolio Not Found</h2>
        <p className="text-sm text-gray-500">{error || 'This student profile has either been deactivated or removed from the Singa Pen Club.'}</p>
        <button onClick={() => navigate('/members')} className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold transition-all">
          Back to Directory
        </button>
      </div>
    );
  }

  const isFaculty = member.memberType === 'FACULTY';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Back button */}
      <Link to="/members" className="inline-flex items-center space-x-1 text-sm font-bold text-maroon-700 hover:text-rose-600 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Singa Pen Directory</span>
      </Link>

      {/* Main Profile Header Card */}
      <section className="bg-white rounded-2xl border-2 border-gold-600 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-gray-100 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Visual Icon Avatar representing student */}
            <div className="w-20 h-20 rounded-full bg-rose-50 text-maroon-700 border-4 border-gold-600 flex items-center justify-center font-serif font-bold text-3xl shrink-0 shadow-sm">
              {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="space-y-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-700">{member.name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                {(member.clubRole || member.designation) && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-maroon-900 text-gold-500 rounded-md text-xs font-serif font-bold tracking-wide border border-gold-500/20">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{member.clubRole || member.designation}</span>
                  </span>
                )}
                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold">
                  {isFaculty ? member.designation : `Class Year: ${member.joiningAcademicYear}`}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs shrink-0 text-gray-500 flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-150">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Joined Club: {new Date(member.clubJoinedAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Bio description */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-serif">
            {isFaculty ? 'Faculty Profile' : 'Student Biography'}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            "{member.bio || (isFaculty ? 'This faculty profile has not completed a public bio statement yet.' : 'This club executive has not completed her bio statement yet.')}"
          </p>
        </div>

        {/* Course details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 bg-gray-50 p-4 rounded-xl border border-gray-150 text-sm text-gray-700">
          <div>
            <span className="block font-semibold text-gray-500 text-xs">Department</span>
            <span className="font-medium text-maroon-700">{member.department}</span>
          </div>
          <div>
            <span className="block font-semibold text-gray-500 text-xs">{isFaculty ? 'Designation' : 'Course'}</span>
            <span className="font-medium text-maroon-700">{isFaculty ? member.designation : member.course}</span>
          </div>
          <div>
            <span className="block font-semibold text-gray-500 text-xs">{isFaculty ? 'Member Type' : 'Academic Status'}</span>
            <span className="font-bold text-rose-600">{getStatusLabel(member.academicStatus)}</span>
          </div>
        </div>
      </section>

      {/* Two column detail block: Skills & Entrepreneurship details */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skills Column */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Award className="w-5 h-5 text-rose-600" />
            <h3 className="font-serif text-lg font-bold text-maroon-700">Verified Skillset</h3>
          </div>

          {member.skills && member.skills.length > 0 ? (
            <div className="space-y-3.5">
              {member.skills.map((sk: any, i: number) => (
                <div key={i} className="p-3.5 rounded-lg bg-gray-50 border border-gray-200/75 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-800">{sk.skillName}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-maroon-700 text-cream-100 rounded">
                      {sk.skillLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium"><span className="text-gray-400">Category:</span> {sk.category}</p>
                  {sk.description && (
                    <p className="text-xs text-gray-500 leading-relaxed italic">"{sk.description}"</p>
                  )}
                  {sk.tools && sk.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sk.tools.map((t: string, ti: number) => (
                        <span key={ti} className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-4">No verified technical skills logged in public portal yet.</p>
          )}
        </div>

        {/* Entrepreneurship & Achievements Column */}
        <div className="space-y-8">
          {/* Incubation Details */}
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <Briefcase className="w-5 h-5 text-rose-600" />
              <h3 className="font-serif text-lg font-bold text-maroon-700">Incubation Interests</h3>
            </div>

            {member.entrepreneurship?.interestedInEntrepreneurship ? (
              <div className="space-y-3 text-xs text-gray-700">
                <p className="inline-flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 font-semibold uppercase text-[10px]">
                  <span>Incubator Candidate</span>
                </p>
                {member.entrepreneurship.businessIdea && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Business Proposal Idea</span>
                    <p className="text-sm text-gray-800 leading-relaxed font-serif font-medium italic">
                      "{member.entrepreneurship.businessIdea}"
                    </p>
                  </div>
                )}
                {member.entrepreneurship.preferredIndustry && (
                  <p><span className="font-semibold text-gray-500 text-xs">Target Industry:</span> <strong className="text-maroon-700">{member.entrepreneurship.preferredIndustry}</strong></p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-4">Focused primarily on corporate career recruitments and academic research.</p>
            )}
          </div>

          {/* Club Achievements List */}
          {member.achievements && member.achievements.length > 0 && (
            <div className="bg-gradient-to-br from-cream-100 to-rose-50 p-6 rounded-xl border-2 border-gold-600 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-rose-200">
                <Sparkles className="w-5 h-5 text-gold-600 fill-gold-600" />
                <h3 className="font-serif text-lg font-bold text-maroon-700">Verified Achievements</h3>
              </div>
              <ul className="space-y-3 text-xs text-gray-700">
                {member.achievements.map((ach: string, i: number) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-gold-600 font-bold shrink-0 text-base">★</span>
                    <span className="leading-relaxed font-medium">{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
