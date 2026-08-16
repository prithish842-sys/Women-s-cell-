-- CreateEnum
CREATE TYPE "RoleUpdateStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'FOLLOW_UP_REQUIRED', 'COMPLETED');

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

-- AddForeignKey
ALTER TABLE "StudentRoleUpdate" ADD CONSTRAINT "StudentRoleUpdate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoleUpdate" ADD CONSTRAINT "StudentRoleUpdate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
