-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('JOB', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SupportContactCategory" AS ENUM ('WOMEN_HELPLINE', 'CAMPUS_SECURITY', 'ICC', 'COUNSELLING', 'MEDICAL_SUPPORT', 'LEGAL_AID', 'ONE_STOP_CENTRE', 'PROTECTION_OFFICER', 'WORKING_WOMEN_HOSTEL', 'EMERGENCY_SERVICES', 'OTHER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ICC_ADMIN';

-- AlterTable
ALTER TABLE "WorkshopParticipation" ADD COLUMN     "attendanceMarkedAt" TIMESTAMP(3),
ADD COLUMN     "certificateIssuedAt" TIMESTAMP(3),
ADD COLUMN     "certificateRevokedAt" TIMESTAMP(3),
ADD COLUMN     "certificateUrl" TEXT;

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
CREATE INDEX "WorkshopParticipation_workshopId_status_idx" ON "WorkshopParticipation"("workshopId", "status");

-- CreateIndex
CREATE INDEX "WorkshopParticipation_certificateIssuedAt_idx" ON "WorkshopParticipation"("certificateIssuedAt");

-- AddForeignKey
ALTER TABLE "JobOpportunity" ADD CONSTRAINT "JobOpportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetySupportContact" ADD CONSTRAINT "SafetySupportContact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
