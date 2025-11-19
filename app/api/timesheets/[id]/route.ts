import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: {
        shift: {
          include: {
            incentives: true,
          },
        },
        crosswalkMapping: true,
      },
    })

    if (!timesheet) {
      return NextResponse.json({ error: "Timesheet not found" }, { status: 404 })
    }

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error("Error fetching timesheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const timesheet = await prisma.timesheet.update({
      where: { id: params.id },
      data: body,
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "UPDATE_TIMESHEET",
      resourceType: "TIMESHEET",
      resourceId: timesheet.id,
      details: { updates: body },
    })

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error("Error updating timesheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
