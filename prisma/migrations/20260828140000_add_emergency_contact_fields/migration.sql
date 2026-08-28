ALTER TABLE "StudentProfile"
ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactRelationship" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;

ALTER TABLE "FacultyProfile"
ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactRelationship" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
