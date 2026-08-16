import { prisma } from '../config/prisma.js';
import { enrichStudentAcademicDetails } from './academic.js';

const normalize = (value: string) => value.trim().toLowerCase();

export type SkillMatchInput = {
  requiredSkills: string[];
  preferredSkillLevel?: string | null;
  department?: string | null;
  search?: string;
  skillKeyword?: string;
  course?: string;
  skillLevel?: string;
  academicStatus?: string;
  availability?: boolean;
  isSingaPenMember?: boolean;
  entrepreneurshipInterest?: boolean;
  page?: number;
  limit?: number;
};

export async function findMatchingStudents(input: SkillMatchInput) {
  const required = (input.requiredSkills || []).map(normalize).filter(Boolean);
  const page = Math.max(Number(input.page || 1), 1);
  const limit = Math.min(Math.max(Number(input.limit || 20), 1), 50);

  const where: any = {
    user: { is: { role: 'STUDENT', isActive: true } },
  };
  if (input.department) where.department = { equals: input.department, mode: 'insensitive' };
  if (input.course) where.course = { equals: input.course, mode: 'insensitive' };
  if (input.academicStatus) where.academicStatus = input.academicStatus;
  if (input.availability !== undefined) where.availableForProjects = input.availability;
  if (input.isSingaPenMember !== undefined) where.isSingaPenMember = input.isSingaPenMember;
  if (input.entrepreneurshipInterest !== undefined) where.interestedInEntrepreneurship = input.entrepreneurshipInterest;
  if (input.skillLevel) where.skills = { some: { skillLevel: input.skillLevel } };

  const profiles = await prisma.studentProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      skills: { orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }] },
    },
    take: 500,
  });

  const search = normalize(input.search || '');
  const skillKeyword = normalize(input.skillKeyword || '');
  const scored = profiles
    .map((profile) => {
      const enriched = enrichStudentAcademicDetails({
        ...profile,
        _id: profile.id,
        expectedCompletionDate: profile.expectedCompletionDate.toISOString(),
      } as any) as any;
      const matchedSkills = new Set<string>();
      const matchReasons = new Set<string>();
      let matchScore = 0;

      for (const reqSkill of required) {
        for (const skill of profile.skills) {
          const skillName = normalize(skill.skillName);
          const tools = (skill.tools || []).map(normalize);
          const desc = normalize(skill.description || '');
          if (skill.isPrimary && skillName === reqSkill) {
            matchScore += 100;
            matchedSkills.add(skill.skillName);
            matchReasons.add(`Primary skill exactly matches "${reqSkill}"`);
          } else if (skillName === reqSkill) {
            matchScore += 85;
            matchedSkills.add(skill.skillName);
            matchReasons.add(`Skill exactly matches "${reqSkill}"`);
          } else if (skillName.startsWith(reqSkill)) {
            matchScore += 55;
            matchedSkills.add(skill.skillName);
            matchReasons.add(`Skill starts with "${reqSkill}"`);
          } else if (tools.some(tool => tool.includes(reqSkill) || reqSkill.includes(tool))) {
            matchScore += 35;
            matchedSkills.add(skill.skillName);
            matchReasons.add(`Tool match for "${reqSkill}"`);
          } else if (desc.includes(reqSkill)) {
            matchScore += 20;
            matchedSkills.add(skill.skillName);
            matchReasons.add(`Description mentions "${reqSkill}"`);
          }
        }
      }

      if (matchedSkills.size > 1) {
        matchScore += matchedSkills.size * 15;
        matchReasons.add('Multiple required skills matched');
      }
      if (input.preferredSkillLevel && profile.skills.some(skill => matchedSkills.has(skill.skillName) && skill.skillLevel === input.preferredSkillLevel)) {
        matchScore += 10;
        matchReasons.add(`Preferred level ${input.preferredSkillLevel} matched`);
      }

      return {
        _id: profile.id,
        id: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        email: profile.user.email,
        profileImage: profile.profileImage || '',
        department: profile.department,
        course: profile.course,
        currentStudyYear: enriched.currentStudyYear,
        academicStatus: enriched.academicStatus,
        isSingaPenMember: profile.isSingaPenMember,
        availability: {
          availableForProjects: profile.availableForProjects,
          availableDays: profile.availableDays,
          preferredCollaboration: profile.preferredCollaborationType || '',
          availabilityNote: profile.availabilityNote || '',
        },
        entrepreneurship: {
          interestedInEntrepreneurship: profile.interestedInEntrepreneurship,
          businessIdea: profile.businessIdea || '',
          futurePlan: profile.futurePlan || '',
          preferredIndustry: profile.preferredIndustry || '',
        },
        skills: profile.skills,
        matchedSkills: Array.from(matchedSkills),
        matchReasons: Array.from(matchReasons),
        matchScore,
      };
    })
    .filter(student => {
      if (required.length && student.matchScore <= 0) return false;
      if (skillKeyword && !student.skills.some(skill =>
        normalize(skill.skillName).includes(skillKeyword) ||
        normalize(skill.category).includes(skillKeyword) ||
        (skill.tools || []).some(tool => normalize(tool).includes(skillKeyword))
      )) return false;
      if (search && ![
        student.name,
        student.department,
        student.course,
        student.academicStatus,
      ].some(value => normalize(String(value || '')).includes(search))) return false;
      return true;
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));

  const total = scored.length;
  return {
    students: scored.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
