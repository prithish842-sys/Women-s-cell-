import { z } from 'zod';

const httpUrl = (message = 'URL must start with http:// or https://') =>
  z.string().trim().url(message).refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, message);

export const StudentRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').endsWith('@college.edu', 'Must be a valid college email ending with @college.edu').or(z.string().email('Invalid email address')), // Fallback to general email if needed, but validate properly
  registerNumber: z.string().min(3, 'Register number must be at least 3 characters'),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number format'),
  department: z.string().min(2, 'Department is required'),
  course: z.string().min(2, 'Course is required'),
  joiningAcademicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  expectedPassingYear: z.number().int().min(2020).max(2040),
  expectedCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
  courseDurationYears: z.number().int().min(1).max(6),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain both letters and numbers'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  identifier: z.string().min(3, 'Identifier (Email/Register No/Staff ID) is required'),
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain both letters and numbers'),
});

export const StudentProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number format'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().nullable(),
  department: z.string().min(2, 'Department is required'),
  course: z.string().min(2, 'Course is required'),
  entrepreneurship: z.object({
    interestedInEntrepreneurship: z.boolean(),
    businessIdea: z.string().optional().nullable(),
    existingBusinessOrProject: z.string().optional().nullable(),
    futurePlan: z.string().optional().nullable(),
    supportRequired: z.string().optional().nullable(),
    preferredIndustry: z.string().optional().nullable(),
  }).optional(),
  availability: z.object({
    availableForProjects: z.boolean(),
    availableDays: z.array(z.string()).optional(),
    preferredCollaboration: z.string().optional().nullable(),
    availabilityNote: z.string().optional().nullable(),
  }).optional(),
});

export const SkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required'),
  category: z.string().min(1, 'Category is required'),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  yearsOfExperience: z.number().min(0, 'Experience cannot be negative'),
  description: z.string().max(300, 'Description cannot exceed 300 characters').optional().nullable(),
  tools: z.array(z.string()).optional(),
  portfolioUrl: httpUrl('Portfolio URL must start with http:// or https://').or(z.string().length(0)).optional().nullable(),
  certificateUrl: httpUrl('Certificate URL must start with http:// or https://').or(z.string().length(0)).optional().nullable(),
  isPrimary: z.boolean(),
});

export const FacultyAccountSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  staffId: z.string().min(3, 'Staff ID must be at least 3 characters'),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required').optional().nullable(),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number').optional().nullable(),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain both letters and numbers'),
});

export const GovernmentSchemeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  fullDescription: z.string().min(20, 'Full description must be at least 20 characters'),
  provider: z.string().min(2, 'Provider is required'),
  category: z.enum(['Scholarship', 'Education', 'Entrepreneurship', 'Skill Development', 'Financial Assistance', 'Startup Support', 'Rural Women', 'Employment', 'Training', 'Other']),
  eligibility: z.string().min(5, 'Eligibility criteria is required'),
  benefits: z.string().min(5, 'Benefits description is required'),
  requiredDocuments: z.array(z.string()).min(1, 'At least one required document is required'),
  applicationProcess: z.string().min(10, 'Application process description is required'),
  officialUrl: httpUrl('Official website URL must start with http:// or https://'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  contactInformation: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be earlier than start date",
  path: ["endDate"],
});

export const SkillRequestSchema = z.object({
  title: z.string().min(5).max(160),
  description: z.string().min(10).max(3000),
  requiredSkills: z.array(z.string().min(1).max(80)).min(1).max(12),
  preferredSkillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  requestType: z.enum(['COLLEGE_PROJECT', 'EVENT', 'WORKSHOP', 'DESIGN', 'CONTENT', 'MEDIA', 'ENTREPRENEURSHIP', 'VOLUNTEERING', 'OTHER']),
  eventOrProjectName: z.string().max(180).optional().nullable(),
  requiredStudentCount: z.number().int().min(1).max(500).optional().nullable(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  contactPerson: z.string().max(140).optional().nullable(),
  contactInformation: z.string().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED']).optional(),
  isPublished: z.boolean().optional(),
});

export const StudentRoleUpdateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(160, 'Title cannot exceed 160 characters'),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Activity date must be YYYY-MM-DD'),
  activitySummary: z.string().min(20, 'Activity summary must be at least 20 characters').max(4000, 'Activity summary cannot exceed 4000 characters'),
  studentsReached: z.coerce.number().int().min(0, 'Students reached cannot be negative').max(10000, 'Students reached is too large').optional().nullable(),
  topics: z.string().max(1000, 'Topics cannot exceed 1000 characters').optional().nullable(),
  feedback: z.string().max(2000, 'Feedback cannot exceed 2000 characters').optional().nullable(),
  followUp: z.string().max(2000, 'Follow-up cannot exceed 2000 characters').optional().nullable(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
}).refine(data => new Date(`${data.activityDate}T00:00:00.000Z`).toString() !== 'Invalid Date', {
  message: 'Activity date is invalid',
  path: ['activityDate'],
});

export const RoleUpdateStatusSchema = z.object({
  status: z.enum(['REVIEWED', 'FOLLOW_UP_REQUIRED', 'COMPLETED']),
});

export const SkillRequestPreviewSchema = z.object({
  requiredSkills: z.array(z.string().min(1).max(80)).min(1).max(12),
  preferredSkillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional().nullable(),
  department: z.string().optional().nullable(),
  search: z.string().optional(),
  skillKeyword: z.string().optional(),
  course: z.string().optional(),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  academicStatus: z.enum(['ACTIVE', 'FINAL_YEAR', 'PASSING_OUT_SOON', 'PASSED_OUT']).optional(),
  availability: z.boolean().optional(),
  isSingaPenMember: z.boolean().optional(),
  entrepreneurshipInterest: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const WorkshopSchema = z.object({
  title: z.string().min(5).max(180),
  shortDescription: z.string().min(10).max(300),
  fullDescription: z.string().min(20).max(5000),
  category: z.enum(['SKILL_DEVELOPMENT', 'AWARENESS', 'ENTREPRENEURSHIP', 'CAREER', 'SAFETY', 'HEALTH', 'COMPETITION', 'LEADERSHIP', 'OTHER']),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  venue: z.string().min(2).max(180),
  organizer: z.string().min(2).max(180),
  targetAudience: z.string().max(250).optional().nullable(),
  posterImage: z.string().max(500).optional().nullable(),
  registrationUrl: httpUrl('Registration URL must start with http:// or https://').or(z.string().length(0)).optional().nullable(),
  maximumParticipants: z.number().int().min(1).max(5000).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  galleryAlbumId: z.string().optional().nullable(),
}).refine((data) => new Date(data.endDateTime) >= new Date(data.startDateTime), {
  message: 'End date cannot be earlier than start date',
  path: ['endDateTime'],
});

export const WorkshopRegistrationSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(120),
  registerNumber: z.string().trim().min(1, 'Register number is required.').max(40),
  email: z.string().trim().email('Valid college email is required.').max(160),
  phone: z.string().trim().min(7, 'Phone number is too short.').max(20, 'Phone number is too long.'),
  department: z.string().trim().min(1, 'Department is required.').max(120),
  course: z.string().trim().min(1, 'Course is required.').max(120),
  currentStudyYear: z.union([z.string(), z.number()]).optional().nullable(),
  learningExpectation: z.string().trim().max(600, 'Learning expectation must be 600 characters or fewer.').optional().nullable(),
  supportRequirement: z.string().trim().max(600, 'Support requirement must be 600 characters or fewer.').optional().nullable(),
  agreement: z.literal(true, {
    error: 'Please confirm that the submitted details are correct.',
  }),
});

export const WorkshopParticipationAdminSchema = z.object({
  status: z.enum(['REGISTERED', 'ATTENDED', 'CANCELLED']),
});

export const WorkshopCertificateSchema = z.object({
  certificateUrl: httpUrl('Certificate URL must start with http:// or https://').or(z.string().length(0)).optional().nullable(),
  action: z.enum(['ISSUE', 'REVOKE']).default('ISSUE'),
});

export const JobOpportunitySchema = z.object({
  title: z.string().trim().min(3).max(180),
  organization: z.string().trim().min(2).max(180),
  opportunityType: z.enum(['JOB', 'INTERNSHIP']),
  location: z.string().trim().max(180).optional().nullable(),
  description: z.string().trim().min(10).max(4000),
  eligibility: z.string().trim().min(3).max(2000),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  officialUrl: httpUrl('Official application link must start with http:// or https://'),
  applicationDeadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  isFeatured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export const SafetySupportContactSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.enum([
    'WOMEN_HELPLINE',
    'CAMPUS_SECURITY',
    'ICC',
    'COUNSELLING',
    'MEDICAL_SUPPORT',
    'LEGAL_AID',
    'ONE_STOP_CENTRE',
    'PROTECTION_OFFICER',
    'WORKING_WOMEN_HOSTEL',
    'EMERGENCY_SERVICES',
    'OTHER',
  ]),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().or(z.string().length(0)).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  district: z.string().trim().max(120).optional().nullable(),
  availability: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  verifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  isActive: z.boolean().default(true),
});
