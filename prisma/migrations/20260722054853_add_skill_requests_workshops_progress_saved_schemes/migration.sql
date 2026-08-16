-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintUrgency" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "SkillRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SkillRequestType" AS ENUM ('COLLEGE_PROJECT', 'EVENT', 'WORKSHOP', 'DESIGN', 'CONTENT', 'MEDIA', 'ENTREPRENEURSHIP', 'VOLUNTEERING', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SKILL_REQUEST', 'WORKSHOP', 'SCHEME', 'ACHIEVEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WorkshopCategory" AS ENUM ('SKILL_DEVELOPMENT', 'AWARENESS', 'ENTREPRENEURSHIP', 'CAREER', 'SAFETY', 'HEALTH', 'COMPETITION', 'LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkshopParticipationStatus" AS ENUM ('INTERESTED', 'REGISTERED', 'ATTENDED', 'CANCELLED');

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopParticipation_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "WorkshopParticipation_workshopId_studentId_key" ON "WorkshopParticipation"("workshopId", "studentId");

-- CreateIndex
CREATE INDEX "SavedScheme_studentId_idx" ON "SavedScheme"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedScheme_studentId_schemeId_key" ON "SavedScheme"("studentId", "schemeId");

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
ALTER TABLE "SavedScheme" ADD CONSTRAINT "SavedScheme_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedScheme" ADD CONSTRAINT "SavedScheme_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GovernmentScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IccComplaint" ADD CONSTRAINT "IccComplaint_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IccComplaint" ADD CONSTRAINT "IccComplaint_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
