-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STUDENT', 'FACULTY', 'ICC_ADMIN');

-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('ACTIVE', 'FINAL_YEAR', 'PASSING_OUT_SOON', 'PASSED_OUT');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "SchemeStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('EVENT', 'ACHIEVEMENT', 'WORKSHOP', 'AWARENESS_PROGRAM', 'COMPETITION', 'SINGA_PEN_ACTIVITY', 'ENTREPRENEURSHIP', 'SKILL_DEVELOPMENT', 'CELEBRATION', 'COMMUNITY_ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('ACADEMIC', 'SPORTS', 'CULTURAL', 'ENTREPRENEURSHIP', 'SKILL', 'COMPETITION', 'COMMUNITY_SERVICE', 'LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "AchievementLevel" AS ENUM ('COLLEGE', 'INTER_COLLEGE', 'DISTRICT', 'STATE', 'NATIONAL', 'INTERNATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintUrgency" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "SkillRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SkillRequestType" AS ENUM ('COLLEGE_PROJECT', 'EVENT', 'WORKSHOP', 'DESIGN', 'CONTENT', 'MEDIA', 'ENTREPRENEURSHIP', 'VOLUNTEERING', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SKILL_REQUEST', 'WORKSHOP', 'WORKSHOP_REGISTRATION', 'SCHEME', 'ACHIEVEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RoleUpdateStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'FOLLOW_UP_REQUIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WorkshopCategory" AS ENUM ('SKILL_DEVELOPMENT', 'AWARENESS', 'ENTREPRENEURSHIP', 'CAREER', 'SAFETY', 'HEALTH', 'COMPETITION', 'LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkshopParticipationStatus" AS ENUM ('INTERESTED', 'REGISTERED', 'ATTENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('JOB', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SupportContactCategory" AS ENUM ('WOMEN_HELPLINE', 'CAMPUS_SECURITY', 'ICC', 'COUNSELLING', 'MEDICAL_SUPPORT', 'LEGAL_AID', 'ONE_STOP_CENTRE', 'PROTECTION_OFFICER', 'WORKING_WOMEN_HOSTEL', 'EMERGENCY_SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyGuideCategory" AS ENUM ('EMERGENCY_SELF_PROTECTION', 'DIGITAL_SAFETY', 'SAFE_TRAVEL', 'HARASSMENT_RESPONSE', 'EVIDENCE_PRESERVATION', 'ONLINE_ACCOUNT_PROTECTION', 'CYBERSTALKING_AWARENESS', 'PUBLIC_TRANSPORT_SAFETY');

-- CreateEnum
CREATE TYPE "EmergencyResourceCategory" AS ENUM ('EMERGENCY', 'WOMEN_SUPPORT', 'POLICE', 'CYBER_CRIME', 'CHILD_PROTECTION', 'COLLEGE_SUPPORT', 'MEDICAL_SUPPORT', 'COUNSELLING_SUPPORT');

-- CreateEnum
CREATE TYPE "WellbeingMood" AS ENUM ('GREAT', 'GOOD', 'OKAY', 'LOW', 'OVERWHELMED');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('POOR', 'AVERAGE', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "SupportRequestType" AS ENUM ('COUNSELLOR_CALL', 'IN_PERSON_MEETING', 'SUPPORT_INFORMATION');

-- CreateEnum
CREATE TYPE "CounsellingRequestStatus" AS ENUM ('REQUESTED', 'ACKNOWLEDGED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiChatLanguagePreference" AS ENUM ('AUTO', 'ENGLISH', 'TAMIL', 'TANGLISH');

-- CreateEnum
CREATE TYPE "EmergencyContactType" AS ENUM ('FAMILY', 'FRIEND', 'STAFF', 'SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyEventTriggerSource" AS ENUM ('IN_APP_SOS', 'PRESS_AND_HOLD', 'MULTI_TAP', 'HARDWARE_BUTTON', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyEventStatus" AS ENUM ('TRIGGERED', 'LOCATION_RECEIVED', 'NOTIFYING', 'NOTIFIED', 'RESOLVED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "identifier" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registerNumber" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "dashboardHeroImage" TEXT,
    "department" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "bio" TEXT,
    "joiningAcademicYear" TEXT NOT NULL,
    "joiningYear" INTEGER NOT NULL,
    "expectedPassingYear" INTEGER NOT NULL,
    "expectedCompletionDate" TIMESTAMP(3) NOT NULL,
    "courseDurationYears" INTEGER NOT NULL,
    "currentStudyYear" INTEGER,
    "academicStatus" "AcademicStatus" NOT NULL DEFAULT 'ACTIVE',
    "isSingaPenMember" BOOLEAN NOT NULL DEFAULT false,
    "clubRole" TEXT,
    "clubJoinedAt" TIMESTAMP(3),
    "achievementsSummary" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactPhone" TEXT,
    "interestedInEntrepreneurship" BOOLEAN NOT NULL DEFAULT false,
    "businessIdea" TEXT,
    "existingBusiness" TEXT,
    "futurePlan" TEXT,
    "supportRequired" TEXT,
    "preferredIndustry" TEXT,
    "incubationSupportRequired" BOOLEAN NOT NULL DEFAULT false,
    "mentorshipSought" BOOLEAN NOT NULL DEFAULT false,
    "availableForProjects" BOOLEAN NOT NULL DEFAULT false,
    "availableDays" TEXT[],
    "preferredCollaborationType" TEXT,
    "availabilityNote" TEXT,
    "activities" JSONB,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyGuide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "SafetyGuideCategory" NOT NULL,
    "introduction" TEXT NOT NULL,
    "whatToKnow" TEXT[],
    "warningSigns" TEXT[],
    "immediateActions" TEXT[],
    "stepByStepGuidance" TEXT[],
    "dos" TEXT[],
    "donts" TEXT[],
    "whenToSeekHelp" TEXT[],
    "relatedContactCategories" "EmergencyResourceCategory"[],
    "officialResourceIds" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "category" "EmergencyResourceCategory" NOT NULL,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "sourceName" TEXT,
    "verifiedDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousConcern" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3),
    "location" TEXT,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousConcern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellbeingCheckIn" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mood" "WellbeingMood" NOT NULL,
    "stressLevel" INTEGER NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "sleepQuality" "SleepQuality" NOT NULL,
    "feelings" TEXT[],
    "reflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellbeingCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellbeingPrivacySetting" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "personalizeAiWithCheckIns" BOOLEAN NOT NULL DEFAULT false,
    "storeAiChatHistory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellbeingPrivacySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" "AiChatLanguagePreference" NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "ownerRole" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "contactType" "EmergencyContactType" NOT NULL DEFAULT 'OTHER',
    "isStaffContact" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentProfileId" TEXT,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggerSource" "EmergencyEventTriggerSource" NOT NULL DEFAULT 'IN_APP_SOS',
    "locationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationAccuracy" DOUBLE PRECISION,
    "locationLink" TEXT,
    "messageContent" TEXT,
    "notificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notificationDetail" JSONB,
    "perContactStatus" JSONB,
    "status" "EmergencyEventStatus" NOT NULL DEFAULT 'TRIGGERED',
    "resolvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentProfileId" TEXT,

    CONSTRAINT "EmergencyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "supportType" "SupportRequestType" NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "reasonCategory" TEXT NOT NULL,
    "note" TEXT,
    "status" "CounsellingRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "assignedCounsellor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounsellingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRoleUpdate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "officialPosition" TEXT NOT NULL,
    "functionalRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "activitySummary" TEXT NOT NULL,
    "studentsReached" INTEGER,
    "topics" TEXT,
    "feedback" TEXT,
    "followUp" TEXT,
    "notes" TEXT,
    "status" "RoleUpdateStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRoleUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "phone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "normalizedSkillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL,
    "yearsOfExperience" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "tools" TEXT[],
    "portfolioUrl" TEXT,
    "certificateUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentScheme" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "requiredDocuments" TEXT NOT NULL,
    "applicationProcess" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "contactInformation" TEXT,
    "status" "SchemeStatus" NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "preferredSkillLevel" "SkillLevel",
    "department" TEXT,
    "requestType" "SkillRequestType" NOT NULL,
    "eventOrProjectName" TEXT,
    "requiredStudentCount" INTEGER,
    "deadline" TIMESTAMP(3),
    "contactPerson" TEXT,
    "contactInformation" TEXT,
    "status" "SkillRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRequestRecipient" (
    "id" TEXT NOT NULL,
    "skillRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "matchedSkills" TEXT[],
    "matchReasons" TEXT[],
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "responseStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "responseMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillRequestRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "category" "WorkshopCategory" NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "targetAudience" TEXT,
    "posterImage" TEXT,
    "registrationUrl" TEXT,
    "maximumParticipants" INTEGER,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "galleryAlbumId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopParticipation" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "WorkshopParticipationStatus" NOT NULL DEFAULT 'INTERESTED',
    "learningExpectation" TEXT,
    "supportRequirement" TEXT,
    "attendanceMarkedAt" TIMESTAMP(3),
    "certificateIssuedAt" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "certificateRevokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "opportunityType" "OpportunityType" NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "officialUrl" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetySupportContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SupportContactCategory" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "district" TEXT,
    "availability" TEXT,
    "description" TEXT,
    "verifiedDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetySupportContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedScheme" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryAlbum" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "category" "GalleryCategory" NOT NULL,
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "organizedBy" TEXT,
    "coverImage" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "photographer" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "achievementType" "AchievementType" NOT NULL,
    "studentId" TEXT,
    "memberName" TEXT,
    "department" TEXT,
    "eventName" TEXT,
    "achievementDate" TIMESTAMP(3),
    "level" "AchievementLevel" NOT NULL,
    "position" TEXT,
    "image" TEXT,
    "certificate" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IccComplaint" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "assignedAdminId" TEXT,
    "complainantName" TEXT NOT NULL,
    "complainantEmail" TEXT NOT NULL,
    "complainantPhone" TEXT,
    "category" TEXT NOT NULL,
    "urgency" "ComplaintUrgency" NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3),
    "location" TEXT,
    "accusedDetails" TEXT,
    "witnesses" TEXT,
    "requestedAction" TEXT,
    "attachmentUrl" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IccComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_identifier_key" ON "User"("identifier");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_registerNumber_key" ON "StudentProfile"("registerNumber");

-- CreateIndex
CREATE INDEX "StudentProfile_department_idx" ON "StudentProfile"("department");

-- CreateIndex
CREATE INDEX "StudentProfile_course_idx" ON "StudentProfile"("course");

-- CreateIndex
CREATE INDEX "StudentProfile_academicStatus_idx" ON "StudentProfile"("academicStatus");

-- CreateIndex
CREATE INDEX "StudentProfile_isSingaPenMember_idx" ON "StudentProfile"("isSingaPenMember");

-- CreateIndex
CREATE INDEX "StudentProfile_expectedCompletionDate_idx" ON "StudentProfile"("expectedCompletionDate");

-- CreateIndex
CREATE INDEX "StudentProfile_deletedAt_idx" ON "StudentProfile"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyGuide_slug_key" ON "SafetyGuide"("slug");

-- CreateIndex
CREATE INDEX "SafetyGuide_category_idx" ON "SafetyGuide"("category");

-- CreateIndex
CREATE INDEX "SafetyGuide_isPublished_idx" ON "SafetyGuide"("isPublished");

-- CreateIndex
CREATE INDEX "SafetyGuide_lastVerifiedDate_idx" ON "SafetyGuide"("lastVerifiedDate");

-- CreateIndex
CREATE INDEX "EmergencyResource_category_idx" ON "EmergencyResource"("category");

-- CreateIndex
CREATE INDEX "EmergencyResource_isActive_idx" ON "EmergencyResource"("isActive");

-- CreateIndex
CREATE INDEX "EmergencyResource_verifiedDate_idx" ON "EmergencyResource"("verifiedDate");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousConcern_referenceNumber_key" ON "AnonymousConcern"("referenceNumber");

-- CreateIndex
CREATE INDEX "AnonymousConcern_category_idx" ON "AnonymousConcern"("category");

-- CreateIndex
CREATE INDEX "AnonymousConcern_status_idx" ON "AnonymousConcern"("status");

-- CreateIndex
CREATE INDEX "AnonymousConcern_createdAt_idx" ON "AnonymousConcern"("createdAt");

-- CreateIndex
CREATE INDEX "WellbeingCheckIn_studentId_date_idx" ON "WellbeingCheckIn"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WellbeingCheckIn_studentId_date_key" ON "WellbeingCheckIn"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WellbeingPrivacySetting_studentId_key" ON "WellbeingPrivacySetting"("studentId");

-- CreateIndex
CREATE INDEX "AiChatSession_studentId_updatedAt_idx" ON "AiChatSession"("studentId", "updatedAt");

-- CreateIndex
CREATE INDEX "AiChatMessage_sessionId_createdAt_idx" ON "AiChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "EmergencyContact_ownerUserId_idx" ON "EmergencyContact"("ownerUserId");

-- CreateIndex
CREATE INDEX "EmergencyContact_contactType_idx" ON "EmergencyContact"("contactType");

-- CreateIndex
CREATE INDEX "EmergencyEvent_userId_idx" ON "EmergencyEvent"("userId");

-- CreateIndex
CREATE INDEX "EmergencyEvent_status_idx" ON "EmergencyEvent"("status");

-- CreateIndex
CREATE INDEX "EmergencyEvent_triggeredAt_idx" ON "EmergencyEvent"("triggeredAt");

-- CreateIndex
CREATE INDEX "EmergencyEvent_createdAt_idx" ON "EmergencyEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CounsellingRequest_studentId_idx" ON "CounsellingRequest"("studentId");

-- CreateIndex
CREATE INDEX "CounsellingRequest_status_idx" ON "CounsellingRequest"("status");

-- CreateIndex
CREATE INDEX "CounsellingRequest_createdAt_idx" ON "CounsellingRequest"("createdAt");

-- CreateIndex
CREATE INDEX "StudentRoleUpdate_studentId_idx" ON "StudentRoleUpdate"("studentId");

-- CreateIndex
CREATE INDEX "StudentRoleUpdate_functionalRole_idx" ON "StudentRoleUpdate"("functionalRole");

-- CreateIndex
CREATE INDEX "StudentRoleUpdate_status_idx" ON "StudentRoleUpdate"("status");

-- CreateIndex
CREATE INDEX "StudentRoleUpdate_activityDate_idx" ON "StudentRoleUpdate"("activityDate");

-- CreateIndex
CREATE INDEX "StudentRoleUpdate_createdAt_idx" ON "StudentRoleUpdate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_staffId_key" ON "FacultyProfile"("staffId");

-- CreateIndex
CREATE INDEX "FacultyProfile_department_idx" ON "FacultyProfile"("department");

-- CreateIndex
CREATE INDEX "Skill_studentId_idx" ON "Skill"("studentId");

-- CreateIndex
CREATE INDEX "Skill_normalizedSkillName_idx" ON "Skill"("normalizedSkillName");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_skillLevel_idx" ON "Skill"("skillLevel");

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentScheme_slug_key" ON "GovernmentScheme"("slug");

-- CreateIndex
CREATE INDEX "GovernmentScheme_category_idx" ON "GovernmentScheme"("category");

-- CreateIndex
CREATE INDEX "GovernmentScheme_status_idx" ON "GovernmentScheme"("status");

-- CreateIndex
CREATE INDEX "GovernmentScheme_isFeatured_idx" ON "GovernmentScheme"("isFeatured");

-- CreateIndex
CREATE INDEX "GovernmentScheme_startDate_idx" ON "GovernmentScheme"("startDate");

-- CreateIndex
CREATE INDEX "GovernmentScheme_endDate_idx" ON "GovernmentScheme"("endDate");

-- CreateIndex
CREATE INDEX "GovernmentScheme_deletedAt_idx" ON "GovernmentScheme"("deletedAt");

-- CreateIndex
CREATE INDEX "SkillRequest_status_idx" ON "SkillRequest"("status");

-- CreateIndex
CREATE INDEX "SkillRequest_isPublished_idx" ON "SkillRequest"("isPublished");

-- CreateIndex
CREATE INDEX "SkillRequest_deadline_idx" ON "SkillRequest"("deadline");

-- CreateIndex
CREATE INDEX "SkillRequest_createdAt_idx" ON "SkillRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SkillRequestRecipient_studentId_idx" ON "SkillRequestRecipient"("studentId");

-- CreateIndex
CREATE INDEX "SkillRequestRecipient_skillRequestId_idx" ON "SkillRequestRecipient"("skillRequestId");

-- CreateIndex
CREATE INDEX "SkillRequestRecipient_isRead_idx" ON "SkillRequestRecipient"("isRead");

-- CreateIndex
CREATE INDEX "SkillRequestRecipient_responseStatus_idx" ON "SkillRequestRecipient"("responseStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SkillRequestRecipient_skillRequestId_studentId_key" ON "SkillRequestRecipient"("skillRequestId", "studentId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workshop_slug_key" ON "Workshop"("slug");

-- CreateIndex
CREATE INDEX "Workshop_category_idx" ON "Workshop"("category");

-- CreateIndex
CREATE INDEX "Workshop_isPublished_idx" ON "Workshop"("isPublished");

-- CreateIndex
CREATE INDEX "Workshop_isFeatured_idx" ON "Workshop"("isFeatured");

-- CreateIndex
CREATE INDEX "Workshop_startDateTime_idx" ON "Workshop"("startDateTime");

-- CreateIndex
CREATE INDEX "WorkshopParticipation_studentId_status_idx" ON "WorkshopParticipation"("studentId", "status");

-- CreateIndex
CREATE INDEX "WorkshopParticipation_workshopId_status_idx" ON "WorkshopParticipation"("workshopId", "status");

-- CreateIndex
CREATE INDEX "WorkshopParticipation_certificateIssuedAt_idx" ON "WorkshopParticipation"("certificateIssuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopParticipation_workshopId_studentId_key" ON "WorkshopParticipation"("workshopId", "studentId");

-- CreateIndex
CREATE INDEX "JobOpportunity_status_idx" ON "JobOpportunity"("status");

-- CreateIndex
CREATE INDEX "JobOpportunity_opportunityType_idx" ON "JobOpportunity"("opportunityType");

-- CreateIndex
CREATE INDEX "JobOpportunity_applicationDeadline_idx" ON "JobOpportunity"("applicationDeadline");

-- CreateIndex
CREATE INDEX "JobOpportunity_isFeatured_idx" ON "JobOpportunity"("isFeatured");

-- CreateIndex
CREATE INDEX "SafetySupportContact_category_idx" ON "SafetySupportContact"("category");

-- CreateIndex
CREATE INDEX "SafetySupportContact_isActive_idx" ON "SafetySupportContact"("isActive");

-- CreateIndex
CREATE INDEX "SafetySupportContact_verifiedDate_idx" ON "SafetySupportContact"("verifiedDate");

-- CreateIndex
CREATE INDEX "SavedScheme_studentId_idx" ON "SavedScheme"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedScheme_studentId_schemeId_key" ON "SavedScheme"("studentId", "schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_sectionKey_key" ON "SiteContent"("sectionKey");

-- CreateIndex
CREATE INDEX "SiteContent_sectionKey_idx" ON "SiteContent"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryAlbum_slug_key" ON "GalleryAlbum"("slug");

-- CreateIndex
CREATE INDEX "GalleryAlbum_category_idx" ON "GalleryAlbum"("category");

-- CreateIndex
CREATE INDEX "GalleryAlbum_isPublished_idx" ON "GalleryAlbum"("isPublished");

-- CreateIndex
CREATE INDEX "GalleryAlbum_isFeatured_idx" ON "GalleryAlbum"("isFeatured");

-- CreateIndex
CREATE INDEX "GalleryAlbum_eventDate_idx" ON "GalleryAlbum"("eventDate");

-- CreateIndex
CREATE INDEX "GalleryAlbum_deletedAt_idx" ON "GalleryAlbum"("deletedAt");

-- CreateIndex
CREATE INDEX "GalleryImage_albumId_displayOrder_idx" ON "GalleryImage"("albumId", "displayOrder");

-- CreateIndex
CREATE INDEX "GalleryImage_isFeatured_idx" ON "GalleryImage"("isFeatured");

-- CreateIndex
CREATE INDEX "Achievement_studentId_idx" ON "Achievement"("studentId");

-- CreateIndex
CREATE INDEX "Achievement_achievementType_idx" ON "Achievement"("achievementType");

-- CreateIndex
CREATE INDEX "Achievement_level_idx" ON "Achievement"("level");

-- CreateIndex
CREATE INDEX "Achievement_achievementDate_idx" ON "Achievement"("achievementDate");

-- CreateIndex
CREATE INDEX "Achievement_isPublic_idx" ON "Achievement"("isPublic");

-- CreateIndex
CREATE INDEX "Achievement_isFeatured_idx" ON "Achievement"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "IccComplaint_referenceNumber_key" ON "IccComplaint"("referenceNumber");

-- CreateIndex
CREATE INDEX "IccComplaint_submittedById_idx" ON "IccComplaint"("submittedById");

-- CreateIndex
CREATE INDEX "IccComplaint_assignedAdminId_idx" ON "IccComplaint"("assignedAdminId");

-- CreateIndex
CREATE INDEX "IccComplaint_status_idx" ON "IccComplaint"("status");

-- CreateIndex
CREATE INDEX "IccComplaint_urgency_idx" ON "IccComplaint"("urgency");

-- CreateIndex
CREATE INDEX "IccComplaint_createdAt_idx" ON "IccComplaint"("createdAt");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyGuide" ADD CONSTRAINT "SafetyGuide_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyResource" ADD CONSTRAINT "EmergencyResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingCheckIn" ADD CONSTRAINT "WellbeingCheckIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingPrivacySetting" ADD CONSTRAINT "WellbeingPrivacySetting_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingRequest" ADD CONSTRAINT "CounsellingRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoleUpdate" ADD CONSTRAINT "StudentRoleUpdate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoleUpdate" ADD CONSTRAINT "StudentRoleUpdate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentScheme" ADD CONSTRAINT "GovernmentScheme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequest" ADD CONSTRAINT "SkillRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequestRecipient" ADD CONSTRAINT "SkillRequestRecipient_skillRequestId_fkey" FOREIGN KEY ("skillRequestId") REFERENCES "SkillRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequestRecipient" ADD CONSTRAINT "SkillRequestRecipient_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_galleryAlbumId_fkey" FOREIGN KEY ("galleryAlbumId") REFERENCES "GalleryAlbum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopParticipation" ADD CONSTRAINT "WorkshopParticipation_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopParticipation" ADD CONSTRAINT "WorkshopParticipation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpportunity" ADD CONSTRAINT "JobOpportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetySupportContact" ADD CONSTRAINT "SafetySupportContact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedScheme" ADD CONSTRAINT "SavedScheme_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedScheme" ADD CONSTRAINT "SavedScheme_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GovernmentScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IccComplaint" ADD CONSTRAINT "IccComplaint_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IccComplaint" ADD CONSTRAINT "IccComplaint_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

