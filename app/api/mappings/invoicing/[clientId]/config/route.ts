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

    const config = await prisma.invoiceTransformerConfig.findUnique({
      where: { clientId },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error("[Invoice] Error fetching transformer config:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transformer config",
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
    const { config } = body

    const updatedConfig = await prisma.invoiceTransformerConfig.upsert({
      where: { clientId },
      update: {
        flexFeeRate: config.flexFeeRate,
        defaultFlexFeeRate: config.defaultFlexFeeRate,
        invoiceNumberPrefix: config.invoiceNumberPrefix,
        microInvoiceNumberPrefix: config.microInvoiceNumberPrefix,
      },
      create: {
        clientId,
        flexFeeRate: config.flexFeeRate || 25.00,
        defaultFlexFeeRate: config.defaultFlexFeeRate || 25.00,
        invoiceNumberPrefix: config.invoiceNumberPrefix || "LVFLEX",
        microInvoiceNumberPrefix: config.microInvoiceNumberPrefix || "MICFLEX",
      },
    })

    return NextResponse.json({ config: updatedConfig })
  } catch (error) {
    console.error("[Invoice] Error saving transformer config:", error)
    return NextResponse.json(
      {
        error: "Failed to save transformer config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

