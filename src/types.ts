export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'FACULTY' | 'ICC_ADMIN';
  identifier: string;
  registerNumber?: string;
  staffId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfile {
  _id: string;
  userId: string;
  registerNumber: string;
  phone: string;
  profileImage?: string;
  dashboardHeroImage?: string;
  department: string;
  course: string;
  bio?: string;
  joiningAcademicYear: string;
  joiningYear: number;
  expectedPassingYear: number;
  expectedCompletionDate: string;
  courseDurationYears: number;
  currentStudyYear?: number | string; // 1, 2, 3 or 'Passed Out'
  academicStatus?: 'ACTIVE' | 'FINAL_YEAR' | 'PASSING_OUT_SOON' | 'PASSED_OUT';
  isSingaPenMember: boolean;
  clubRole?: 'President' | 'Vice President' | 'Secretary' | 'Joint Secretary' | 'Treasurer' | 'Coordinator' | 'Member' | 'Volunteer';
  clubJoinedAt?: string;
  achievements?: string[];
  entrepreneurship?: {
    interestedInEntrepreneurship: boolean;
    businessIdea?: string;
    existingBusinessOrProject?: string;
    futurePlan?: string;
    supportRequired?: string;
    preferredIndustry?: string;
  };
  availability?: {
    availableForProjects: boolean;
    availableDays?: string[];
    preferredCollaboration?: string;
    availabilityNote?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Skill {
  _id: string;
  studentId: string;
  skillName: string;
  normalizedSkillName: string;
  category: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience: number;
  description?: string;
  tools?: string[];
  portfolioUrl?: string;
  certificateUrl?: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacultyProfile {
  _id: string;
  userId: string;
  staffId: string;
  department: string;
  designation: string;
  phone: string;
  name?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GovernmentScheme {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  provider: string;
  category: 'Scholarship' | 'Education' | 'Entrepreneurship' | 'Skill Development' | 'Financial Assistance' | 'Startup Support' | 'Rural Women' | 'Employment' | 'Training' | 'Other';
  eligibility: string;
  benefits: string;
  requiredDocuments: string[];
  applicationProcess: string;
  officialUrl: string;
  startDate: string;
  endDate: string;
  contactInformation?: string;
  status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED';
  isFeatured: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSection {
  title: string;
  content: string;
  metadata?: any;
}
export type SiteContentMap = Record<string, SiteSection>;
