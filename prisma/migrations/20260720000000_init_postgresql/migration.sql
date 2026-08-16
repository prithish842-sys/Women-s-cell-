-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STUDENT', 'FACULTY');

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "phone" TEXT,
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
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentScheme_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentScheme" ADD CONSTRAINT "GovernmentScheme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

