import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import type { TransformationRule } from "@/types/transformation-types"

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireRole(["admin", "manager", "coordinator"])

    const clientId = params.clientId

    const rules = await prisma.invoiceTransformationRule.findMany({
      where: {
        clientId,
        active: true,
      },
      orderBy: {
        order: "asc",
      },
    })

    // Convert database format to TransformationRule format
    const transformationRules: TransformationRule[] = rules.map((rule) => ({
      id: rule.ruleId,
      name: rule.name as any,
      category: rule.category as any,
      purpose: rule.purpose,
      ruleLogic: rule.ruleLogic,
      dataPointsReferenced: rule.dataPointsReferenced as string[],
      inputFields: rule.inputFields as string[],
      outputFields: rule.outputFields as string[],
      parameters: rule.parameters as Record<string, any> | undefined,
    }))

    return NextResponse.json({ rules: transformationRules })
  } catch (error) {
    console.error("[Invoice] Error fetching transformation rules:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transformation rules",
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
    const { rules } = body as { rules: TransformationRule[] }

    // Delete all existing rules for this client
    await prisma.invoiceTransformationRule.deleteMany({
      where: { clientId },
    })

    // Insert new rules
    const createdRules = await Promise.all(
      rules.map((rule, index) =>
        prisma.invoiceTransformationRule.create({
          data: {
            clientId,
            ruleId: rule.id,
            name: rule.name,
            category: rule.category,
            purpose: rule.purpose,
            ruleLogic: rule.ruleLogic,
            dataPointsReferenced: rule.dataPointsReferenced,
            inputFields: rule.inputFields,
            outputFields: rule.outputFields,
            parameters: rule.parameters || null,
            order: index,
            active: true,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: createdRules.length,
    })
  } catch (error) {
    console.error("[Invoice] Error saving transformation rules:", error)
    return NextResponse.json(
      {
        error: "Failed to save transformation rules",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

