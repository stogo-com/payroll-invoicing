import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireRole(["admin", "manager", "coordinator"])

    const clientId = params.clientId

    const config = await prisma.payrollTransformerConfig.findUnique({
      where: { clientId },
    })

    if (!config) {
      // Return defaults
      return NextResponse.json({
        dayPayRate: 58,
        nightPayRate: 63,
        dayPayCode: "FXDY",
        nightPayCode: "FXNT",
        approverName: "Jennifer Devine",
        lunchTimeHours: 0.5,
        incentivesEnabled: true,
        incentiveValidThrough: null,
      })
    }

    return NextResponse.json({
      dayPayRate: Number(config.dayPayRate),
      nightPayRate: Number(config.nightPayRate),
      dayPayCode: config.dayPayCode,
      nightPayCode: config.nightPayCode,
      approverName: config.approverName,
      lunchTimeHours: Number(config.lunchTimeHours),
      incentivesEnabled: config.incentivesEnabled,
      incentiveValidThrough: config.incentiveValidThrough?.toISOString() || null,
    })
  } catch (error) {
    console.error("[v0] Error fetching config:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireRole(["admin", "manager", "coordinator"])

    const clientId = params.clientId
    const body = await request.json()

    await prisma.payrollTransformerConfig.upsert({
      where: { clientId },
      update: {
        dayPayRate: body.dayPayRate,
        nightPayRate: body.nightPayRate,
        dayPayCode: body.dayPayCode,
        nightPayCode: body.nightPayCode,
        approverName: body.approverName,
        lunchTimeHours: body.lunchTimeHours,
        incentivesEnabled: body.incentivesEnabled,
        incentiveValidThrough: body.incentiveValidThrough
          ? new Date(body.incentiveValidThrough)
          : null,
      },
      create: {
        clientId,
        dayPayRate: body.dayPayRate || 58,
        nightPayRate: body.nightPayRate || 63,
        dayPayCode: body.dayPayCode || "FXDY",
        nightPayCode: body.nightPayCode || "FXNT",
        approverName: body.approverName || "Jennifer Devine",
        lunchTimeHours: body.lunchTimeHours || 0.5,
        incentivesEnabled: body.incentivesEnabled ?? true,
        incentiveValidThrough: body.incentiveValidThrough
          ? new Date(body.incentiveValidThrough)
          : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving config:", error)
    return NextResponse.json(
      {
        error: "Failed to save config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
