import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const client = searchParams.get("client")
    const department = searchParams.get("department")

    const where: any = {}

    if (search) {
      where.OR = [
        { shiftCode: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { unit: { contains: search, mode: "insensitive" } },
      ]
    }

    if (client) where.client = client
    if (department) where.department = department

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        incentives: true,
        _count: {
          select: { timesheets: true },
        },
      },
      orderBy: { shiftCode: "asc" },
      take: 100,
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error("Error fetching shifts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const shift = await prisma.shift.create({
      data: body,
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "CREATE_SHIFT",
      resourceType: "SHIFT",
      resourceId: shift.id,
      details: { shiftData: body },
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error("Error creating shift:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
