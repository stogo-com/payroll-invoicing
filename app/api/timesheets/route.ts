import { type NextRequest, NextResponse } from "next/server"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { z } from "zod"

const mockSession = {
  user: {
    id: "1",
    email: "admin@stogo.com",
    name: "Demo Admin",
    role: "admin",
  },
}

const timesheetQuerySchema = z.object({
  payrollPeriod: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  network: z.string().optional(), // Changed from client to network
  status: z.enum(["PENDING", "MATCHED", "UNMATCHED", "REVIEW", "APPROVED", "REJECTED"]).optional(),
  page: z.string().default("1"),
  limit: z.string().default("50"),
})

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions)
    const session = mockSession
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = timesheetQuerySchema.parse(Object.fromEntries(searchParams))

    const page = Number.parseInt(query.page)
    const limit = Number.parseInt(query.limit)
    const skip = (page - 1) * limit

    const where: any = {}

    if (query.payrollPeriod) {
      where.payrollPeriod = query.payrollPeriod
    }

    if (query.startDate && query.endDate) {
      where.workDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      }
    }

    if (query.network) {
      where.networkId = query.network
    }

    if (query.status) {
      where.status = query.status
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: {
          shift: {
            include: {
              incentives: true,
            },
          },
          crosswalkMapping: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.timesheet.count({ where }),
    ])

    return NextResponse.json({
      timesheets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching timesheets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions)
    const session = mockSession
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const timesheet = await prisma.timesheet.create({
      data: {
        ...body,
        status: "PENDING",
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "CREATE_TIMESHEET",
      resourceType: "TIMESHEET",
      resourceId: timesheet.id,
      details: { timesheetData: body },
    })

    return NextResponse.json(timesheet, { status: 201 })
  } catch (error) {
    console.error("Error creating timesheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
