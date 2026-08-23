-- Additive Safety, Wellbeing, and AI support models.

CREATE TYPE "SafetyGuideCategory" AS ENUM (
  'EMERGENCY_SELF_PROTECTION',
  'DIGITAL_SAFETY',
  'SAFE_TRAVEL',
  'HARASSMENT_RESPONSE',
  'EVIDENCE_PRESERVATION',
  'ONLINE_ACCOUNT_PROTECTION',
  'CYBERSTALKING_AWARENESS',
  'PUBLIC_TRANSPORT_SAFETY'
);

CREATE TYPE "EmergencyResourceCategory" AS ENUM (
  'EMERGENCY',
  'WOMEN_SUPPORT',
  'POLICE',
  'CYBER_CRIME',
  'CHILD_PROTECTION',
  'COLLEGE_SUPPORT',
  'MEDICAL_SUPPORT',
  'COUNSELLING_SUPPORT'
);

CREATE TYPE "WellbeingMood" AS ENUM (
  'GREAT',
  'GOOD',
  'OKAY',
  'LOW',
  'OVERWHELMED'
);

CREATE TYPE "SleepQuality" AS ENUM (
  'POOR',
  'AVERAGE',
  'GOOD',
  'VERY_GOOD'
);

CREATE TYPE "SupportRequestType" AS ENUM (
  'COUNSELLOR_CALL',
  'IN_PERSON_MEETING',
  'SUPPORT_INFORMATION'
);

CREATE TYPE "CounsellingRequestStatus" AS ENUM (
  'REQUESTED',
  'ACKNOWLEDGED',
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "AiChatLanguagePreference" AS ENUM (
  'AUTO',
  'ENGLISH',
  'TAMIL',
  'TANGLISH'
);

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

CREATE TABLE "WellbeingPrivacySetting" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "personalizeAiWithCheckIns" BOOLEAN NOT NULL DEFAULT false,
  "storeAiChatHistory" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WellbeingPrivacySetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiChatSession" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "language" "AiChatLanguagePreference" NOT NULL DEFAULT 'AUTO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "SafetyGuide_slug_key" ON "SafetyGuide"("slug");
CREATE INDEX "SafetyGuide_category_idx" ON "SafetyGuide"("category");
CREATE INDEX "SafetyGuide_isPublished_idx" ON "SafetyGuide"("isPublished");
CREATE INDEX "SafetyGuide_lastVerifiedDate_idx" ON "SafetyGuide"("lastVerifiedDate");

CREATE INDEX "EmergencyResource_category_idx" ON "EmergencyResource"("category");
CREATE INDEX "EmergencyResource_isActive_idx" ON "EmergencyResource"("isActive");
CREATE INDEX "EmergencyResource_verifiedDate_idx" ON "EmergencyResource"("verifiedDate");

CREATE UNIQUE INDEX "AnonymousConcern_referenceNumber_key" ON "AnonymousConcern"("referenceNumber");
CREATE INDEX "AnonymousConcern_category_idx" ON "AnonymousConcern"("category");
CREATE INDEX "AnonymousConcern_status_idx" ON "AnonymousConcern"("status");
CREATE INDEX "AnonymousConcern_createdAt_idx" ON "AnonymousConcern"("createdAt");

CREATE UNIQUE INDEX "WellbeingCheckIn_studentId_date_key" ON "WellbeingCheckIn"("studentId", "date");
CREATE INDEX "WellbeingCheckIn_studentId_date_idx" ON "WellbeingCheckIn"("studentId", "date");

CREATE UNIQUE INDEX "WellbeingPrivacySetting_studentId_key" ON "WellbeingPrivacySetting"("studentId");

CREATE INDEX "AiChatSession_studentId_updatedAt_idx" ON "AiChatSession"("studentId", "updatedAt");
CREATE INDEX "AiChatMessage_sessionId_createdAt_idx" ON "AiChatMessage"("sessionId", "createdAt");

CREATE INDEX "CounsellingRequest_studentId_idx" ON "CounsellingRequest"("studentId");
CREATE INDEX "CounsellingRequest_status_idx" ON "CounsellingRequest"("status");
CREATE INDEX "CounsellingRequest_createdAt_idx" ON "CounsellingRequest"("createdAt");

ALTER TABLE "SafetyGuide" ADD CONSTRAINT "SafetyGuide_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmergencyResource" ADD CONSTRAINT "EmergencyResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WellbeingCheckIn" ADD CONSTRAINT "WellbeingCheckIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WellbeingPrivacySetting" ADD CONSTRAINT "WellbeingPrivacySetting_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CounsellingRequest" ADD CONSTRAINT "CounsellingRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
