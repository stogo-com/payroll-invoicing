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

    const where: any = {}

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    if (client) where.client = client

    const mappings = await prisma.crosswalkMapping.findMany({
      where,
      orderBy: [{ client: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    })

    return NextResponse.json(mappings)
  } catch (error) {
    console.error("Error fetching crosswalk mappings:", error)
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

    const mapping = await prisma.crosswalkMapping.create({
      data: body,
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "CREATE_CROSSWALK_MAPPING",
      resourceType: "CROSSWALK_MAPPING",
      resourceId: mapping.id,
      details: { mappingData: body },
    })

    // Trigger re-matching for affected timesheets
    await fetch(`${process.env.NEXTAUTH_URL}/api/n8n/rematch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappingId: mapping.id }),
    })

    return NextResponse.json(mapping, { status: 201 })
  } catch (error) {
    console.error("Error creating crosswalk mapping:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
