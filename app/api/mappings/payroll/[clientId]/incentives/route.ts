import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import type { IncentiveRule } from "@/lib/payroll-transformer-config"

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireRole(["admin", "manager", "coordinator"])

    const clientId = params.clientId

    const rules = await prisma.payrollIncentiveRule.findMany({
      where: {
        clientId,
        active: true,
      },
    })

    const config = await prisma.payrollTransformerConfig.findUnique({
      where: { clientId },
    })

    // Convert database format to IncentiveRule format
    const incentiveRules: IncentiveRule[] = rules.map((rule) => ({
      company: rule.company,
      costCenters: rule.costCenters as string[],
      dayOfWeek: rule.dayOfWeek as number[] | undefined,
      shiftType: (rule.shiftType as "Day" | "Night" | "Both" | null) || undefined,
      timeRange: rule.timeRangeStart !== null && rule.timeRangeEnd !== null
        ? {
            start: rule.timeRangeStart,
            end: rule.timeRangeEnd,
          }
        : undefined,
      amount: Number(rule.amount),
      description: rule.description,
    }))

    return NextResponse.json({
      rules: incentiveRules,
      enabled: config?.incentivesEnabled ?? true,
      validThrough: config?.incentiveValidThrough?.toISOString() || null,
    })
  } catch (error) {
    console.error("[v0] Error fetching incentive rules:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch incentive rules",
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
    const { rules, enabled, validThrough } = body as {
      rules: IncentiveRule[]
      enabled: boolean
      validThrough: string | null
    }

    // Delete all existing rules for this client
    await prisma.payrollIncentiveRule.deleteMany({
      where: { clientId },
    })

    // Insert new rules
    const createdRules = await Promise.all(
      rules.map((rule) =>
        prisma.payrollIncentiveRule.create({
          data: {
            clientId,
            company: rule.company,
            costCenters: rule.costCenters,
            dayOfWeek: rule.dayOfWeek || null,
            shiftType: rule.shiftType || null,
            timeRangeStart: rule.timeRange?.start ?? null,
            timeRangeEnd: rule.timeRange?.end ?? null,
            amount: rule.amount,
            description: rule.description,
            active: true,
          },
        })
      )
    )

    // Update or create config
    await prisma.payrollTransformerConfig.upsert({
      where: { clientId },
      update: {
        incentivesEnabled: enabled,
        incentiveValidThrough: validThrough ? new Date(validThrough) : null,
      },
      create: {
        clientId,
        incentivesEnabled: enabled,
        incentiveValidThrough: validThrough ? new Date(validThrough) : null,
      },
    })

    return NextResponse.json({
      success: true,
      count: createdRules.length,
    })
  } catch (error) {
    console.error("[v0] Error saving incentive rules:", error)
    return NextResponse.json(
      {
        error: "Failed to save incentive rules",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
