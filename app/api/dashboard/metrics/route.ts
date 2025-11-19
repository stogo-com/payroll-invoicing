import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

// Helper to get Sunday of week (pay period start)
function getSundayOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = date.getDate() - day
  const sunday = new Date(date)
  sunday.setDate(diff)
  sunday.setHours(0, 0, 0, 0)
  return sunday
}

// Helper to get Saturday of week (pay period end)
function getSaturdayOfWeek(date: Date): Date {
  const sunday = getSundayOfWeek(date)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  saturday.setHours(23, 59, 59, 999)
  return saturday
}

// Format pay period as "MM/DD/YY - MM/DD/YY"
function formatPayPeriod(start: Date, end: Date): string {
  const formatDate = (d: Date) => {
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    const day = d.getDate().toString().padStart(2, "0")
    const year = d.getFullYear().toString().slice(-2)
    return `${month}/${day}/${year}`
  }
  return `${formatDate(start)} - ${formatDate(end)}`
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      )
    }

    // Build date filter for the selected pay period
    const dateFilter: any = {
      shiftDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }

    // Get all time entry records for the selected pay period (all networks)
    // We need to get facility info from the raw ingest data
    const timeEntries = await prisma.timeEntryRecord.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        timesheetId: true,
        networkId: true,
        recordedHours: true,
        computedHours: true,
        shiftDate: true,
        unitOrDepartment: true,
        costCenter: true,
        rawId: true,
        rawIngest: {
          select: {
            rawRow: true, // This contains the original data with Company/Company Description
          },
        },
      },
    })

    // Group by pay period and facility
    const payPeriodMap = new Map<string, Map<string, { count: number; hours: number }>>()

    timeEntries.forEach((entry) => {
      if (!entry.shiftDate) return

      const shiftDate = new Date(entry.shiftDate)
      const payPeriodStart = getSundayOfWeek(shiftDate)
      const payPeriodEnd = getSaturdayOfWeek(shiftDate)
      const payPeriodKey = formatPayPeriod(payPeriodStart, payPeriodEnd)

      // Extract facility from raw data (Company Description) or use costCenter as fallback
      let facility = "Unknown"
      if (entry.rawIngest?.rawRow) {
        const rawRow = entry.rawIngest.rawRow as any
        // Try to get Company Description first (facility name), then Company (facility ID)
        facility = rawRow["Company Description"] || rawRow["Company"] || entry.costCenter || entry.unitOrDepartment || "Unknown"
      } else {
        facility = entry.costCenter || entry.unitOrDepartment || "Unknown"
      }

      // Use networkId from the entry
      const networkId = entry.networkId || "Unknown"

      // Create a key that includes both pay period and network
      const periodNetworkKey = `${payPeriodKey}|${networkId}`

      if (!payPeriodMap.has(periodNetworkKey)) {
        payPeriodMap.set(periodNetworkKey, new Map())
      }

      const facilityMap = payPeriodMap.get(periodNetworkKey)!
      if (!facilityMap.has(facility)) {
        facilityMap.set(facility, { count: 0, hours: 0 })
      }

      const facilityData = facilityMap.get(facility)!
      facilityData.count += 1
      const hours = Number(entry.computedHours || entry.recordedHours || 0)
      facilityData.hours += hours
    })

    // Convert to response format - extract pay period and network from the key
    const timesheetMetrics = Array.from(payPeriodMap.entries()).map(([periodNetworkKey, facilities]) => {
      const [payPeriod, network] = periodNetworkKey.split("|")
      
      const facilityData = Array.from(facilities.entries())
        .map(([facility, data]) => ({
          facility,
          count: data.count,
          hours: Math.round(data.hours * 100) / 100, // Round to 2 decimals
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending

      return {
        payPeriod,
        network: network || "Unknown",
        facilities: facilityData,
        totalCount: facilityData.reduce((sum, f) => sum + f.count, 0),
        totalHours: Math.round(facilityData.reduce((sum, f) => sum + f.hours, 0) * 100) / 100,
      }
    })

    // Sort by pay period (most recent first), then by network
    timesheetMetrics.sort((a, b) => {
      const aStart = a.payPeriod.split(" - ")[0]
      const bStart = b.payPeriod.split(" - ")[0]
      const dateCompare = bStart.localeCompare(aStart)
      if (dateCompare !== 0) return dateCompare
      return a.network.localeCompare(b.network)
    })

    // Payroll metrics - for now, we'll use the same data since payroll is generated from timesheets
    // In the future, you might want to store payroll generation history separately
    const payrollMetrics = timesheetMetrics.map((metric) => ({
      ...metric,
      // Payroll records are essentially the same as timesheet records
      // You can adjust this if payroll has different logic
    }))

    // Calculate summaries
    const timesheetSummary = {
      totalRecords: timesheetMetrics.reduce((sum, m) => sum + m.totalCount, 0),
      totalHours: Math.round(timesheetMetrics.reduce((sum, m) => sum + m.totalHours, 0) * 100) / 100,
      payPeriods: timesheetMetrics.length,
    }

    const payrollSummary = {
      totalRecords: payrollMetrics.reduce((sum, m) => sum + m.totalCount, 0),
      totalHours: Math.round(payrollMetrics.reduce((sum, m) => sum + m.totalHours, 0) * 100) / 100,
      payPeriods: payrollMetrics.length,
    }

    return NextResponse.json({
      timesheets: {
        metrics: timesheetMetrics,
        summary: timesheetSummary,
      },
      payroll: {
        metrics: payrollMetrics,
        summary: payrollSummary,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

