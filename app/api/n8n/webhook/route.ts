import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case "timesheet_processed":
        await handleTimesheetProcessed(data)
        break
      case "csv_imported":
        await handleCsvImported(data)
        break
      case "matching_completed":
        await handleMatchingCompleted(data)
        break
      default:
        console.warn("Unknown webhook type:", type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing n8n webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleTimesheetProcessed(data: any) {
  const { timesheetId, status, matchedShiftId, errors } = data

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      status,
      shiftId: matchedShiftId,
      processingErrors: errors,
    },
  })

  await logAuditEvent({
    userId: "system",
    action: "TIMESHEET_PROCESSED",
    resourceType: "TIMESHEET",
    resourceId: timesheetId,
    details: { status, matchedShiftId, errors },
  })
}

async function handleCsvImported(data: any) {
  const { batchId, successCount, errorCount, errors } = data

  await logAuditEvent({
    userId: "system",
    action: "CSV_IMPORTED",
    resourceType: "BATCH",
    resourceId: batchId,
    details: { successCount, errorCount, errors },
  })
}

async function handleMatchingCompleted(data: any) {
  const { batchId, matchedCount, unmatchedCount } = data

  await logAuditEvent({
    userId: "system",
    action: "MATCHING_COMPLETED",
    resourceType: "BATCH",
    resourceId: batchId,
    details: { matchedCount, unmatchedCount },
  })
}
