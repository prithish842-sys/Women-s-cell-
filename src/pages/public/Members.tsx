import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../../utils/api.js';
import { RefreshCw, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import AnimatedMemberCard from '../../components/members/AnimatedMemberCard.js';
import { MemberCardSkeleton } from '../../components/common/Skeleton.js';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleToggleMember = (memberId: string) => {
    setExpandedMemberId(currentMemberId =>
      currentMemberId === memberId ? null : memberId,
    );
  };

  const handleViewProfile = (memberId: string) => {
    navigate(`/members/${memberId}`);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/public/members');
      if (res.data.success) {
        setMembers(res.data.data);
      } else {
        setError('Failed to fetch the club directory.');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Could not establish connection to college records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expandedMemberId && !members.some(member => member._id === expandedMemberId)) {
      setExpandedMemberId(null);
    }
  }, [expandedMemberId, members]);

  useEffect(() => {
    if (!expandedMemberId) return;
    const handleDocumentClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('[data-singa-member-card="true"]')) {
        setExpandedMemberId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [expandedMemberId]);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Page Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-bold text-rose-600 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Executive Committee & Members</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-maroon-700">Singa Pen Club Directory</h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Meet the student-led action wing driving college technology, fine arts, design crafts, and empowerment campaigns.
          </p>
          <div className="w-24 h-1 bg-gold-600 mx-auto rounded"></div>
        </div>

        {/* Directory Grid Display */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8" aria-busy="true">
            {Array.from({ length: 6 }).map((_, n) => <MemberCardSkeleton key={n} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 border border-red-100 bg-red-50 rounded-xl space-y-3">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchMembers} className="inline-flex items-center space-x-1 text-xs font-bold text-red-800 bg-red-100 px-3 py-1.5 rounded hover:bg-red-200">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl text-gray-500 space-y-2">
            <p className="font-semibold text-base">No members available.</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 items-stretch"
          >
            {members.map((member) => (
              <div key={member._id} data-singa-member-card="true" className="min-w-0">
                <AnimatedMemberCard
                  member={{
                    id: member._id,
                    fullName: member.name,
                    profileImage: member.profileImage,
                    memberType: member.memberType,
                    clubRole: member.clubRole,
                    department: member.department,
                    course: member.course,
                    designation: member.designation,
                    currentStudyYear: member.currentStudyYear,
                    serviceSince: member.clubJoinedAt
                      ? new Date(member.clubJoinedAt).getFullYear()
                      : undefined,
                    academicStatus: member.academicStatus,
                    primarySkills: member.skills
                      ?.filter((skill: { isPrimary?: boolean }) => skill.isPrimary)
                      .map((skill: { skillName: string }) => skill.skillName),
                    achievementsCount: member.achievements?.length || 0,
                  }}
                  imageUrl={member.profileImage}
                  isExpanded={expandedMemberId === member._id}
                  onToggle={() => setExpandedMemberId(currentId => currentId === member._id ? null : member._id)}
                  onViewProfile={handleViewProfile}
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};
