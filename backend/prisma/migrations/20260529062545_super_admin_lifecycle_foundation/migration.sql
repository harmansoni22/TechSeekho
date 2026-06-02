-- Super Admin lifecycle governance foundation (Phase 2).
--
-- Additive only. No data loss, no hard deletes. Introduces:
--   * UserStatus.TERMINATED          — permanent, login-blocked lifecycle state
--   * InstitutionStatus enum         — governed institution lifecycle
--   * Institution.status (+ reason / changedBy / changedAt) with isActive kept
--     as a compatibility mirror (status == ACTIVE) until all readers migrate
--   * User.statusReason / statusChangedAt / statusChangedById
--   * AuditLog.reason                — first-class governance justification
--
-- NOTE: unrelated migration<->schema drift detected by `prisma migrate diff`
-- (institutionId NOT NULL on Announcement/Assessment/Assignment/Submission,
-- several FK redefinitions, an index rename, passwordHash nullability) is
-- intentionally NOT included here — it predates this change and is tracked
-- separately so this migration stays scoped and safe on existing data.

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING_APPROVAL');

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'TERMINATED';

-- AlterTable: Institution lifecycle
ALTER TABLE "Institution"
    ADD COLUMN "status" "InstitutionStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "statusReason" TEXT,
    ADD COLUMN "statusChangedAt" TIMESTAMP(3),
    ADD COLUMN "statusChangedById" TEXT;

-- Backfill status from the legacy isActive boolean so the mirror is consistent
-- at migration time (active -> ACTIVE, inactive -> SUSPENDED).
UPDATE "Institution" SET "status" = 'SUSPENDED' WHERE "isActive" = false;

-- AlterTable: User lifecycle metadata
ALTER TABLE "User"
    ADD COLUMN "statusReason" TEXT,
    ADD COLUMN "statusChangedAt" TIMESTAMP(3),
    ADD COLUMN "statusChangedById" TEXT;

-- AlterTable: AuditLog governance reason
ALTER TABLE "AuditLog" ADD COLUMN "reason" TEXT;
