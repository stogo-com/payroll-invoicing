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
    const client = searchParams.get("client")
    const department = searchParams.get("department")
    const active = searchParams.get("active")

    const where: any = {}

    if (client) where.client = client
    if (department) where.department = department
    if (active === "true") {
      const now = new Date()
      where.AND = [{ effectiveFrom: { lte: now } }, { OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }]
    }

    const incentives = await prisma.incentive.findMany({
      where,
      orderBy: [{ client: "asc" }, { department: "asc" }, { effectiveFrom: "desc" }],
    })

    return NextResponse.json(incentives)
  } catch (error) {
    console.error("Error fetching incentives:", error)
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

    const incentive = await prisma.incentive.create({
      data: {
        ...body,
        effectiveFrom: new Date(body.effectiveFrom),
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "CREATE_INCENTIVE",
      resourceType: "INCENTIVE",
      resourceId: incentive.id,
      details: { incentiveData: body },
    })

    return NextResponse.json(incentive, { status: 201 })
  } catch (error) {
    console.error("Error creating incentive:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
