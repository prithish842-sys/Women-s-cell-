import { prisma } from '../config/prisma.js';

export async function getStudentProgress(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { skills: true },
  });
  if (!profile) return null;

  const [
    achievementsCount,
    workshopsAttendedCount,
    upcomingWorkshopsCount,
    savedSchemesCount,
    skillRequestsReceivedCount,
    unreadNotificationsCount,
  ] = await Promise.all([
    prisma.achievement.count({ where: { studentId: profile.id } }),
    prisma.workshopParticipation.count({ where: { studentId: profile.id, status: 'ATTENDED' } }),
    prisma.workshopParticipation.count({
      where: {
        studentId: profile.id,
        status: { in: ['INTERESTED', 'REGISTERED'] },
        workshop: { isPublished: true, isCancelled: false, startDateTime: { gte: new Date() } },
      },
    }),
    prisma.savedScheme.count({ where: { studentId: profile.id } }),
    prisma.skillRequestRecipient.count({ where: { studentId: profile.id } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const certificatesCount = profile.skills.filter(skill => !!skill.certificateUrl).length;
  const fields = [
    !!profile.profileImage,
    !!profile.bio,
    !!profile.phone,
    !!profile.department,
    !!profile.course,
    !!profile.joiningAcademicYear && !!profile.expectedPassingYear && !!profile.expectedCompletionDate,
    profile.skills.length > 0,
    !!profile.futurePlan,
    profile.availableForProjects || profile.availableDays.length > 0,
    !profile.interestedInEntrepreneurship || !!profile.businessIdea || !!profile.preferredIndustry,
  ];
  const profileCompletionPercentage = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  let recommendedNextStep = { title: 'Explore upcoming workshops', link: '/student/workshops' };
  if (profile.skills.length === 0) recommendedNextStep = { title: 'Add your first skill', link: '/student/skills' };
  else if (certificatesCount === 0) recommendedNextStep = { title: 'Upload a skill certificate', link: '/student/skills' };
  else if (!profile.bio) recommendedNextStep = { title: 'Complete your bio', link: '/student/profile' };
  else if (!profile.futurePlan) recommendedNextStep = { title: 'Add a future plan', link: '/student/future-plan' };
  else if (savedSchemesCount === 0) recommendedNextStep = { title: 'Review saved schemes', link: '/student/schemes' };

  return {
    profileCompletionPercentage,
    skillsCount: profile.skills.length,
    primarySkillsCount: profile.skills.filter(skill => skill.isPrimary).length,
    certificatesCount,
    achievementsCount,
    workshopsAttendedCount,
    upcomingWorkshopsCount,
    savedSchemesCount,
    skillRequestsReceivedCount,
    unreadNotificationsCount,
    recommendedNextStep,
  };
}
