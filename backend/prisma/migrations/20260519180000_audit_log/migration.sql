-- Audit log foundation. Minimal schema: who, what, where, when.
-- Indexed for the two access patterns we expect:
--   (1) "show me everything actor X did recently"
--   (2) "show me everything that happened to entity Y"
--   (3) "show me everything in institution Z over a date range"

CREATE TABLE "AuditLog" (
    "id"            TEXT NOT NULL,
    "actorId"       TEXT,
    "actorRole"     TEXT,
    "action"        TEXT NOT NULL,
    "entityType"    TEXT NOT NULL,
    "entityId"      TEXT,
    "institutionId" TEXT,
    "metadata"      JSONB,
    "ipAddress"     TEXT,
    "userAgent"     TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_createdAt_idx"
    ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_institutionId_createdAt_idx"
    ON "AuditLog"("institutionId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx"
    ON "AuditLog"("entityType", "entityId");
