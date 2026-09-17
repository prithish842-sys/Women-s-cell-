-- This migration is deliberately idempotent so that `prisma migrate deploy`
-- succeeds even on databases where parts of this schema were applied out-of-
-- band (e.g. ad-hoc production repair SQL). Every statement is guarded.

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmergencyContactType') THEN
    CREATE TYPE "EmergencyContactType" AS ENUM ('FAMILY', 'FRIEND', 'STAFF', 'SUPPORT', 'OTHER');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmergencyEventTriggerSource') THEN
    CREATE TYPE "EmergencyEventTriggerSource" AS ENUM ('IN_APP_SOS', 'PRESS_AND_HOLD', 'MULTI_TAP', 'HARDWARE_BUTTON', 'OTHER');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmergencyEventStatus') THEN
    CREATE TYPE "EmergencyEventStatus" AS ENUM ('TRIGGERED', 'LOCATION_RECEIVED', 'NOTIFYING', 'NOTIFIED', 'RESOLVED', 'FAILED');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "deletedById" TEXT;

-- AlterTable
ALTER TABLE "GovernmentScheme" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "deletedById" TEXT;

-- AlterTable
ALTER TABLE "GalleryAlbum" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "deletedById" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmergencyContact" (
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
CREATE TABLE IF NOT EXISTS "EmergencyEvent" (
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmergencyContact_ownerUserId_idx" ON "EmergencyContact" ("ownerUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmergencyContact_contactType_idx" ON "EmergencyContact" ("contactType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmergencyEvent_userId_idx" ON "EmergencyEvent" ("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmergencyEvent_status_idx" ON "EmergencyEvent" ("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmergencyEvent_triggeredAt_idx" ON "EmergencyEvent" ("triggeredAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmergencyEvent_createdAt_idx" ON "EmergencyEvent" ("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StudentProfile_deletedAt_idx" ON "StudentProfile" ("deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GovernmentScheme_deletedAt_idx" ON "GovernmentScheme" ("deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GalleryAlbum_deletedAt_idx" ON "GalleryAlbum" ("deletedAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmergencyContact_ownerUserId_fkey') THEN
    ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmergencyContact_studentProfileId_fkey') THEN
    ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmergencyEvent_userId_fkey') THEN
    ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmergencyEvent_createdById_fkey') THEN
    ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmergencyEvent_studentProfileId_fkey') THEN
    ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;