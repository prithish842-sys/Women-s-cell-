import { PrismaRepository } from './base.js';

export interface User {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'STUDENT' | 'FACULTY' | 'ICC_ADMIN';
  identifier: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfile {
  _id?: string;
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
  currentStudyYear?: number | string;
  academicStatus?: 'ACTIVE' | 'FINAL_YEAR' | 'PASSING_OUT_SOON' | 'PASSED_OUT';
  isSingaPenMember: boolean;
  clubRole?: 'President' | 'Vice President' | 'Secretary' | 'Joint Secretary' | 'Treasurer' | 'Coordinator' | 'Member' | 'Volunteer';
  clubJoinedAt?: string;
  achievements?: string[];
  entrepreneurship?: Record<string, any>;
  availability?: Record<string, any>;
  activities?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Skill {
  _id?: string;
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
  _id?: string;
  userId: string;
  staffId: string;
  department: string;
  designation: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GovernmentScheme {
  _id?: string;
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

export interface SiteContent {
  _id?: string;
  sectionKey: string;
  title: string;
  content: string;
  metadata?: any;
  updatedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryAlbum {
  _id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: 'EVENT' | 'ACHIEVEMENT' | 'WORKSHOP' | 'AWARENESS_PROGRAM' | 'COMPETITION' | 'SINGA_PEN_ACTIVITY' | 'ENTREPRENEURSHIP' | 'SKILL_DEVELOPMENT' | 'CELEBRATION' | 'OTHER';
  coverImage?: string;
  eventDate?: string;
  venue?: string;
  organizedBy?: string;
  isFeatured: boolean;
  isPublished: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryImage {
  _id?: string;
  albumId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  photographer?: string;
  displayOrder: number;
  isFeatured: boolean;
  uploadedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Achievement {
  _id?: string;
  title: string;
  description: string;
  achievementType: 'ACADEMIC' | 'SPORTS' | 'CULTURAL' | 'ENTREPRENEURSHIP' | 'SKILL' | 'COMPETITION' | 'COMMUNITY_SERVICE' | 'LEADERSHIP' | 'OTHER';
  studentId?: string;
  memberName?: string;
  department?: string;
  eventName?: string;
  achievementDate?: string;
  level: 'COLLEGE' | 'INTER_COLLEGE' | 'DISTRICT' | 'STATE' | 'NATIONAL' | 'INTERNATIONAL' | 'OTHER';
  position?: string;
  image?: string;
  certificate?: string;
  isFeatured: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export const Users = new PrismaRepository<User>('user');
export const StudentProfiles = new PrismaRepository<StudentProfile>('studentProfile');
export const Skills = new PrismaRepository<Skill>('skill');
export const FacultyProfiles = new PrismaRepository<FacultyProfile>('facultyProfile');
export const GovernmentSchemes = new PrismaRepository<GovernmentScheme>('governmentScheme');
export const SiteContents = new PrismaRepository<SiteContent>('siteContent');
export const GalleryAlbums = new PrismaRepository<GalleryAlbum>('galleryAlbum');
export const GalleryImages = new PrismaRepository<GalleryImage>('galleryImage');
export const Achievements = new PrismaRepository<Achievement>('achievement');
