ALTER TABLE "SkillRequestRecipient"
ADD COLUMN "responseStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "responseMessage" TEXT,
ADD COLUMN "respondedAt" TIMESTAMP(3);

CREATE INDEX "SkillRequestRecipient_responseStatus_idx" ON "SkillRequestRecipient"("responseStatus");
