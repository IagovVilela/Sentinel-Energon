-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'viewer');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('production', 'staging');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('operational', 'degraded', 'down', 'unknown');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('frontend', 'backend', 'database', 'payment', 'email', 'meta', 'whatsapp', 'hosting', 'domain', 'storage', 'other');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('login', 'api_key', 'token', 'secret', 'connection_string', 'other');

-- CreateEnum
CREATE TYPE "HealthCheckType" AS ENUM ('http', 'tcp', 'ssl_expiry', 'domain_expiry', 'db_ping');

-- CreateEnum
CREATE TYPE "CheckResultStatus" AS ENUM ('ok', 'fail');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('view', 'copy', 'create', 'update', 'delete', 'export', 'import', 'reveal');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "reauthAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "environment" "Environment" NOT NULL DEFAULT 'production',
    "status" "ProjectStatus" NOT NULL DEFAULT 'unknown',
    "publicUrl" TEXT,
    "logoUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "statusPageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "statusPageSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "provider" TEXT,
    "adminUrl" TEXT,
    "hostingUrl" TEXT,
    "gitUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "label" TEXT NOT NULL,
    "username" TEXT,
    "ciphertext" TEXT NOT NULL,
    "dekEncrypted" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiryNotified30" BOOLEAN NOT NULL DEFAULT false,
    "expiryNotified7" BOOLEAN NOT NULL DEFAULT false,
    "expiryNotified1" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HealthCheckType" NOT NULL,
    "url" TEXT,
    "host" TEXT,
    "port" INTEGER,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "headersJson" TEXT,
    "expectedStatus" INTEGER NOT NULL DEFAULT 200,
    "expectedBody" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "intervalSec" INTEGER NOT NULL DEFAULT 60,
    "failureThreshold" INTEGER NOT NULL DEFAULT 2,
    "consecutiveFails" INTEGER NOT NULL DEFAULT 0,
    "lastStatus" "CheckResultStatus",
    "lastCheckedAt" TIMESTAMP(3),
    "lastLatencyMs" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckResult" (
    "id" TEXT NOT NULL,
    "healthCheckId" TEXT NOT NULL,
    "status" "CheckResultStatus" NOT NULL,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckResultDaily" (
    "id" TEXT NOT NULL,
    "healthCheckId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "okCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "avgLatencyMs" DOUBLE PRECISION,
    "uptimePct" DOUBLE PRECISION,

    CONSTRAINT "CheckResultDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "healthCheckId" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "cause" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "notifyDown" BOOLEAN NOT NULL DEFAULT true,
    "notifyRecovery" BOOLEAN NOT NULL DEFAULT true,
    "notifyExpiry" BOOLEAN NOT NULL DEFAULT true,
    "reminderHours" INTEGER NOT NULL DEFAULT 4,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "alertRuleId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "eventType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyPreview" TEXT,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "metadata" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "credentialId" TEXT,
    "action" "AuditAction" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_statusPageSlug_key" ON "Project"("statusPageSlug");

-- CreateIndex
CREATE INDEX "Service_projectId_idx" ON "Service"("projectId");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Credential_serviceId_idx" ON "Credential"("serviceId");

-- CreateIndex
CREATE INDEX "Credential_expiresAt_idx" ON "Credential"("expiresAt");

-- CreateIndex
CREATE INDEX "HealthCheck_serviceId_idx" ON "HealthCheck"("serviceId");

-- CreateIndex
CREATE INDEX "HealthCheck_enabled_idx" ON "HealthCheck"("enabled");

-- CreateIndex
CREATE INDEX "CheckResult_healthCheckId_checkedAt_idx" ON "CheckResult"("healthCheckId", "checkedAt");

-- CreateIndex
CREATE INDEX "CheckResult_checkedAt_idx" ON "CheckResult"("checkedAt");

-- CreateIndex
CREATE INDEX "CheckResultDaily_day_idx" ON "CheckResultDaily"("day");

-- CreateIndex
CREATE UNIQUE INDEX "CheckResultDaily_healthCheckId_day_key" ON "CheckResultDaily"("healthCheckId", "day");

-- CreateIndex
CREATE INDEX "Incident_projectId_status_idx" ON "Incident"("projectId", "status");

-- CreateIndex
CREATE INDEX "Incident_serviceId_idx" ON "Incident"("serviceId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "MaintenanceWindow_projectId_startsAt_endsAt_idx" ON "MaintenanceWindow"("projectId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_eventType_idx" ON "NotificationLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_credentialId_idx" ON "AuditLog"("credentialId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckResult" ADD CONSTRAINT "CheckResult_healthCheckId_fkey" FOREIGN KEY ("healthCheckId") REFERENCES "HealthCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_healthCheckId_fkey" FOREIGN KEY ("healthCheckId") REFERENCES "HealthCheck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWindow" ADD CONSTRAINT "MaintenanceWindow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
