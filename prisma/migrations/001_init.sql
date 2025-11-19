-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'coordinator', 'viewer');

-- CreateEnum
CREATE TYPE "TimeEntryRecordStatus" AS ENUM ('normalized', 'matched', 'needs_review', 'posted', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry_raw_ingest" (
    "rawId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "sourceRowNumber" INTEGER NOT NULL,
    "receivedAtUtc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawRow" JSONB NOT NULL,
    "rowHash" TEXT NOT NULL,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAtUtc" TIMESTAMP(3),
    "processingErrors" TEXT,

    CONSTRAINT "time_entry_raw_ingest_pkey" PRIMARY KEY ("rawId")
);

-- CreateTable
CREATE TABLE "time_entry_records" (
    "timesheetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "recordVersion" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "status" "TimeEntryRecordStatus" NOT NULL DEFAULT 'normalized',
    "validationFlags" TEXT[],
    "employeeClientId" TEXT,
    "employeeInternalId" TEXT,
    "employeeName" TEXT,
    "shiftDate" TIMESTAMP(3),
    "timezone" TEXT,
    "clockInAt" TIMESTAMP(3),
    "clockOutAt" TIMESTAMP(3),
    "breakMinutes" INTEGER,
    "recordedHours" DECIMAL(65,30),
    "computedHours" DECIMAL(65,30),
    "payCode" TEXT,
    "unitOrDepartment" TEXT,
    "costCenter" TEXT,
    "matchedShiftId" INTEGER,
    "timesheetDepartment" TEXT,
    "shiftDepartment" TEXT,
    "incentiveFlag" BOOLEAN NOT NULL DEFAULT false,
    "incentiveNote" TEXT,
    "rawId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entry_records_pkey" PRIMARY KEY ("timesheetId")
);

-- CreateTable
CREATE TABLE "employee_crosswalk" (
    "clientId" TEXT NOT NULL,
    "clientEmployeeId" TEXT NOT NULL,
    "internalEmployeeId" TEXT NOT NULL,
    "activeFlag" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "employee_crosswalk_pkey" PRIMARY KEY ("clientId","clientEmployeeId")
);

-- CreateTable
CREATE TABLE "client_mappings" (
    "clientId" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "activeFlag" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_mappings_pkey" PRIMARY KEY ("clientId")
);

-- CreateTable
CREATE TABLE "incentive_catalog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "incentive_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "shiftId" INTEGER NOT NULL,
    "employeeInternalId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "department" TEXT NOT NULL,
    "facility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "hasIncentives" BOOLEAN NOT NULL DEFAULT false,
    "incentives" JSONB,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("shiftId")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" SERIAL NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "hoursWorked" DECIMAL(65,30),
    "breakMinutes" INTEGER,
    "punches" JSONB,
    "payCode" TEXT,
    "timeclockStatus" TEXT,
    "internalStatus" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "time_entry_raw_ingest_clientId_fileId_rowHash_key" ON "time_entry_raw_ingest"("clientId", "fileId", "rowHash");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry_records" ADD CONSTRAINT "time_entry_records_rawId_fkey" FOREIGN KEY ("rawId") REFERENCES "time_entry_raw_ingest"("rawId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("shiftId") ON DELETE RESTRICT ON UPDATE CASCADE;
