import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  Sparkles,
  UserCheck,
} from 'lucide-react';

import api from '../../utils/api.js';
import {
  getMemberPhoto,
  memberFallbackPhoto,
  type PublicMember,
} from '../../utils/memberDirectory.js';
import { DetailPageSkeleton } from '../../components/common/Skeleton.js';
import { ProgressiveImage } from '../../components/common/ProgressiveImage.js';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<PublicMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchMemberDetail = async () => {
      if (!id) {
        if (active) {
          setLoading(false);
          setError('Member identifier is missing.');
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/public/members/${id}`);
        if (response.data?.success && response.data?.data) {
          if (active) setMember(response.data.data);
        } else if (active) {
          setMember(null);
          setError('We could not load this member profile.');
        }
      } catch (err) {
        console.error('Error fetching member details:', err);
        if (active) {
          setMember(null);
          setError('Connection lost or this member is not available in the public directory.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchMemberDetail();
    return () => {
      active = false;
    };
  }, [id]);

  const getStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'FACULTY': return 'Faculty';
      case 'PASSED_OUT': return 'Passed Out / Alumni';
      case 'PASSING_OUT_SOON': return 'Passing Out Soon';
      case 'FINAL_YEAR': return 'Final Year';
      case 'ACTIVE': return 'Active Student';
      default: return 'Member';
    }
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !member) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-[#06123a]">Profile Not Found</h2>
        <p className="text-sm font-semibold leading-6 text-[#657391]">{error || 'This member profile is currently unavailable.'}</p>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="rounded-lg bg-[#075cff] px-5 py-2.5 text-xs font-black text-white"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isFaculty = member.memberType === 'FACULTY' || member.academicStatus === 'FACULTY';
  const displayRole = member.clubRole || member.designation || (isFaculty ? 'Faculty' : 'Singa Pen Member');
  const statusLabel = isFaculty ? 'Faculty Member' : getStatusLabel(member.academicStatus);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/members"
        className="inline-flex items-center gap-2 text-sm font-black text-[#075cff] transition-colors hover:text-[#7c3aed]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Singa Pen Directory
      </Link>

      <section className="overflow-hidden rounded-2xl border border-[#dfe7f6] bg-white shadow-[0_18px_50px_rgba(7,20,38,0.08)]">
        <div className="bg-gradient-to-r from-[#071426] via-[#123b8d] to-[#7c3aed] px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <div
  className="
    shrink-0
    rounded-2xl
    bg-white/10
    p-1.5
    shadow-xl
    ring-1
    ring-white/20
  "
>
  <div
    className="
      relative
      h-[190px]
      w-[150px]
      overflow-hidden
      rounded-xl
      bg-[#eaf0ff]

      min-[390px]:h-[205px]
      min-[390px]:w-[160px]

      sm:h-48
      sm:w-48

      lg:h-56
      lg:w-56
    "
  >
    <ProgressiveImage
      src={getMemberPhoto(member)}
      fallbackSrc={memberFallbackPhoto}
      resolveSrc={false}
      alt={`${member.name} profile`}
      loading="eager"
      decoding="async"
      wrapperClassName="h-full w-full"
      imageClassName="
        h-full
        w-full
        object-cover
        object-[center_18%]

        sm:object-top
      "
    />
  </div>
</div>

            <div className="min-w-0 flex-1 text-center text-white sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black text-white/90 ring-1 ring-white/15">
                <UserCheck className="h-4 w-4" />
                {displayRole}
              </div>

              <h1 className="mt-3 text-[1.35rem] font-black leading-tight tracking-[-0.02em] sm:mt-4 sm:text-3xl lg:text-4xl">{member.name}</h1>

              {member.department ? (
                <p className="mx-auto mt-2 max-w-[280px] text-sm font-semibold leading-5 text-white/80 sm:mx-0 sm:max-w-none sm:text-base">{member.department}</p>
              ) : null}

              {!isFaculty && member.course ? (
                <p className="mt-1 text-xs font-semibold text-white/65">{member.course}</p>
              ) : null}

              <div className="mt-3 flex max-w-[290px] flex-wrap justify-center gap-2 sm:mt-4 sm:max-w-none sm:justify-start">
                <span className="rounded-full bg-[#e91670] px-3 py-1.5 text-xs font-black text-white">{displayRole}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white ring-1 ring-white/15">{statusLabel}</span>
              </div>
            </div>

            {member.clubJoinedAt ? (
              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                <Calendar className="h-4 w-4" />
                Joined: {new Date(member.clubJoinedAt).toLocaleDateString()}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#7c3aed]">
              {isFaculty ? 'Faculty Profile' : 'Member Profile'}
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#52617f]">
              {member.bio || `${member.name} is a member of the Women's Empowerment Cell and Singa Pen community.`}
            </p>
          </div>

          <div className="grid gap-3 rounded-xl border border-[#e6edf8] bg-[#f8fbff] p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
            <ProfileInfo label="Department" value={member.department || 'Not specified'} />
            <ProfileInfo label={isFaculty ? 'Role' : 'Course'} value={isFaculty ? displayRole : member.course || displayRole} />
            <ProfileInfo label={isFaculty ? 'Member Type' : 'Status'} value={statusLabel} />
          </div>
        </div>
      </section>

      <section className={`grid gap-6 ${isFaculty ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
        <div className="rounded-xl border border-[#e3e9f5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#edf2fb] pb-3">
            <Award className="h-5 w-5 text-[#7c3aed]" />
            <h3 className="text-lg font-black text-[#06123a]">Skills</h3>
          </div>

          {Array.isArray(member.skills) && member.skills.length > 0 ? (
            <div className="mt-4 space-y-3">
              {member.skills.map((skill: any, index: number) => (
                <div
                  key={skill._id || `${skill.skillName}-${index}`}
                  className="rounded-xl border border-[#edf2fb] bg-[#f8fbff] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm font-black text-[#06123a]">{skill.skillName}</strong>
                    {skill.skillLevel ? (
                      <span className="rounded-full bg-[#075cff] px-2.5 py-1 text-[10px] font-black uppercase text-white">{skill.skillLevel}</span>
                    ) : null}
                  </div>
                  {skill.category ? <p className="mt-2 text-xs font-semibold text-[#657391]">Category: {skill.category}</p> : null}
                  {skill.description ? <p className="mt-2 text-xs font-semibold leading-5 text-[#52617f]">{skill.description}</p> : null}
                  {Array.isArray(skill.tools) && skill.tools.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {skill.tools.map((tool: string, toolIndex: number) => (
                        <span key={`${tool}-${toolIndex}`} className="rounded-full bg-[#f0eaff] px-2 py-1 text-[10px] font-bold text-[#7c3aed]">{tool}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#dce4f2] bg-[#fafcff] p-5 text-center">
              <p className="text-xs font-semibold italic text-[#7a879d]">No public skills are currently available for this member.</p>
            </div>
          )}
        </div>

        {!isFaculty ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#e3e9f5] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#edf2fb] pb-3">
                <Briefcase className="h-5 w-5 text-[#e91670]" />
                <h3 className="text-lg font-black text-[#06123a]">Entrepreneurship Interests</h3>
              </div>

              {member.entrepreneurship?.interestedInEntrepreneurship ? (
                <div className="mt-4 space-y-4">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">Entrepreneurship Candidate</span>
                  {member.entrepreneurship.businessIdea ? (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wide text-[#7a879d]">Business Idea</span>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#52617f]">{member.entrepreneurship.businessIdea}</p>
                    </div>
                  ) : null}
                  {member.entrepreneurship.preferredIndustry ? (
                    <p className="text-xs font-semibold text-[#52617f]"><strong className="text-[#06123a]">Preferred Industry:</strong> {member.entrepreneurship.preferredIndustry}</p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#dce4f2] bg-[#fafcff] p-5 text-center">
                  <p className="text-xs font-semibold italic text-[#7a879d]">No public entrepreneurship information is available.</p>
                </div>
              )}
            </div>

            {Array.isArray(member.achievements) && member.achievements.length > 0 ? (
              <div className="rounded-xl border border-[#eadfff] bg-gradient-to-br from-[#fbf9ff] to-[#fff4fa] p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#eadfff] pb-3">
                  <Sparkles className="h-5 w-5 fill-[#db2777] text-[#db2777]" />
                  <h3 className="text-lg font-black text-[#06123a]">Achievements</h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {member.achievements.map((achievement: string, index: number) => (
                    <li key={`${achievement}-${index}`} className="flex items-start gap-2 text-xs font-semibold leading-5 text-[#52617f]">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#db2777]" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
};

const ProfileInfo: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <span className="block text-[11px] font-black uppercase tracking-wide text-[#7a879d]">{label}</span>
    <span className="mt-1 block text-sm font-black leading-5 text-[#06123a]">{value}</span>
  </div>
);

export default MemberDetail;
