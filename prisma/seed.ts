import { PrismaClient, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@stogo.com" },
    update: {},
    create: {
      email: "admin@stogo.com",
      name: "Admin User",
      role: UserRole.admin,
    },
  })

  const coordinatorUser = await prisma.user.upsert({
    where: { email: "coordinator@stogo.com" },
    update: {},
    create: {
      email: "coordinator@stogo.com",
      name: "Coordinator User",
      role: UserRole.coordinator,
    },
  })

  // Create shifts with the exact example from spec
  const exampleShift = await prisma.shift.upsert({
    where: { shiftId: 14372456 },
    update: {},
    create: {
      shiftId: 14372456,
      employeeInternalId: "INT-204275",
      start: new Date("2025-12-31T18:45:00-06:00"),
      end: new Date("2026-01-01T07:15:00-06:00"),
      department: "603 Safety Attendants",
      facility: "OU Children's Hospital",
      status: "Assigned",
      shiftType: "Night",
      requiresApproval: true,
      source: "Manual",
      hasIncentives: true,
      incentives: [{ name: "Night Diff", value: 1.5 }],
    },
  })

  // Create additional shifts
  const additionalShifts = [
    {
      shiftId: 14372457,
      employeeInternalId: "INT-204276",
      start: new Date("2025-12-31T07:00:00-06:00"),
      end: new Date("2025-12-31T19:00:00-06:00"),
      department: "Emergency Department",
      facility: "OU Children's Hospital",
      status: "Assigned",
      shiftType: "Day",
      requiresApproval: false,
      source: "Auto",
      hasIncentives: false,
      incentives: null,
    },
    {
      shiftId: 14372458,
      employeeInternalId: "INT-204277",
      start: new Date("2025-12-31T19:00:00-06:00"),
      end: new Date("2026-01-01T07:00:00-06:00"),
      department: "ICU",
      facility: "OU Children's Hospital",
      status: "Assigned",
      shiftType: "Night",
      requiresApproval: true,
      source: "Manual",
      hasIncentives: true,
      incentives: [
        { name: "Night Diff", value: 1.5 },
        { name: "ICU Premium", value: 2.0 },
      ],
    },
  ]

  for (const shift of additionalShifts) {
    await prisma.shift.upsert({
      where: { shiftId: shift.shiftId },
      update: {},
      create: shift,
    })
  }

  // Create employee crosswalk mappings
  const crosswalkMappings = [
    {
      clientId: "UofL",
      clientEmployeeId: "204275",
      internalEmployeeId: "INT-204275",
    },
    {
      clientId: "UofL",
      clientEmployeeId: "204276",
      internalEmployeeId: "INT-204276",
    },
    {
      clientId: "Willis Knight",
      clientEmployeeId: "WK001",
      internalEmployeeId: "INT-204277",
    },
  ]

  for (const mapping of crosswalkMappings) {
    await prisma.employeeCrosswalk.upsert({
      where: {
        clientId_clientEmployeeId: {
          clientId: mapping.clientId,
          clientEmployeeId: mapping.clientEmployeeId,
        },
      },
      update: {},
      create: mapping,
    })
  }

  // Create client mappings
  const clientMappings = [
    {
      clientId: "UofL",
      mapping: {
        client_employee_id: "Employee ID",
        employee_first_name: "First Name",
        employee_last_name: "Last Name",
        shift_date: "Date",
        clock_in_at: "Start Time",
        clock_out_at: "End Time",
        break_minutes: "Break Minutes",
        recorded_hours: "Hours",
        unit_or_department: "Department",
        pay_code: "Pay Code",
        timezone: "America/Chicago",
      },
    },
    {
      clientId: "Willis Knight",
      mapping: {
        client_employee_id: "EMP_ID",
        employee_full_name: "Employee Name",
        shift_date: "Work Date",
        clock_in_at: "Clock In",
        clock_out_at: "Clock Out",
        break_minutes: "Break",
        recorded_hours: "Total Hours",
        unit_or_department: "Unit",
        pay_code: "Code",
        timezone: "America/New_York",
      },
    },
  ]

  for (const mapping of clientMappings) {
    await prisma.clientMapping.upsert({
      where: { clientId: mapping.clientId },
      update: {},
      create: mapping,
    })
  }

  // Create incentive catalog
  await prisma.incentiveCatalog.upsert({
    where: { id: "incentive-1" },
    update: {},
    create: {
      id: "incentive-1",
      clientId: "UofL",
      departmentCode: "603 Safety Attendants",
      rules: {
        nightDifferential: {
          rate: 1.5,
          conditions: ["shiftType === 'Night'"],
        },
        floatingNurse: {
          rate: 2.0,
          conditions: ["timesheetDepartment !== shiftDepartment"],
        },
      },
      effectiveFrom: new Date("2025-01-01"),
    },
  })

  // Create sample raw ingest data
  const rawIngestId = "raw-sample-1"
  await prisma.timeEntryRawIngest.upsert({
    where: { rawId: rawIngestId },
    update: {},
    create: {
      rawId: rawIngestId,
      clientId: "UofL",
      fileId: "file-001",
      sourceFilename: "uofl_timesheets_20251231.csv",
      sourceRowNumber: 1,
      rawRow: {
        "Employee ID": "204275",
        "First Name": "John",
        "Last Name": "Doe",
        Date: "2025-12-31",
        "Start Time": "18:45",
        "End Time": "07:15",
        "Break Minutes": "30",
        Hours: "12.5",
        Department: "603 Safety Attendants",
        "Pay Code": "REG",
      },
      rowHash: "hash-001",
      processed: true,
      processedAtUtc: new Date(),
    },
  })

  // Create corresponding time entry record
  await prisma.timeEntryRecord.upsert({
    where: { timesheetId: "timesheet-sample-1" },
    update: {},
    create: {
      timesheetId: "timesheet-sample-1",
      clientId: "UofL",
      businessKey: "UofL-204275-20251231",
      status: "matched",
      employeeClientId: "204275",
      employeeInternalId: "INT-204275",
      employeeName: "John Doe",
      shiftDate: new Date("2025-12-31"),
      timezone: "America/Chicago",
      clockInAt: new Date("2025-12-31T18:45:00-06:00"),
      clockOutAt: new Date("2026-01-01T07:15:00-06:00"),
      breakMinutes: 30,
      recordedHours: 12.5,
      computedHours: 12.5,
      payCode: "REG",
      unitOrDepartment: "603 Safety Attendants",
      matchedShiftId: 14372456,
      timesheetDepartment: "603 Safety Attendants",
      shiftDepartment: "603 Safety Attendants",
      incentiveFlag: true,
      incentiveNote: "Night differential applied",
      rawId: rawIngestId,
    },
  })

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
