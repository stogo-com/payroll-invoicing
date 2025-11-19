import { type NextRequest, NextResponse } from "next/server"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockSession = {
  user: {
    id: "1",
    email: "admin@stogo.com",
    name: "Demo Admin",
    role: "admin",
  },
}

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions)
    const session = mockSession
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const payrollPeriod = searchParams.get("payrollPeriod")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const network = searchParams.get("network") // Changed from client to network

    const where: any = {}

    if (payrollPeriod) where.payrollPeriod = payrollPeriod
    if (network) where.networkId = network // Updated to use networkId field
    if (startDate && endDate) {
      where.workDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get KPI data
    const [totalTimesheets, matchedTimesheets, pendingReview, errorTimesheets, postedTimesheets] = await Promise.all([
      prisma.timesheet.count({ where }),
      prisma.timesheet.count({ where: { ...where, status: "MATCHED" } }),
      prisma.timesheet.count({ where: { ...where, status: "REVIEW" } }),
      prisma.timesheet.count({ where: { ...where, status: "UNMATCHED" } }),
      prisma.timesheet.count({ where: { ...where, status: "APPROVED" } }),
    ])

    const autoMatchRate = totalTimesheets > 0 ? (matchedTimesheets / totalTimesheets) * 100 : 0
    const postedRate = totalTimesheets > 0 ? (postedTimesheets / totalTimesheets) * 100 : 0

    // Get processing volume data for chart
    const processingData = await prisma.timesheet.groupBy({
      by: ["status"],
      where,
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      kpis: {
        autoMatchRate: Math.round(autoMatchRate * 100) / 100,
        postedRate: Math.round(postedRate * 100) / 100,
        pendingReview,
        errorCount: errorTimesheets,
        totalTimesheets,
      },
      processingData: processingData.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    })
  } catch (error) {
    console.error("Error fetching dashboard KPIs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
