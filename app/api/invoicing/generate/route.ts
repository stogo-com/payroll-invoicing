import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { FLEXInvoiceTransformer, parseCSV } from "@/lib/flex-invoice-transformer"
import { prisma } from "@/lib/prisma"
import { getDefaultInvoiceTransformationRules, parseInvoiceTransformationRulesToConfig, DEFAULT_INVOICE_CONFIG } from "@/lib/invoice-transformer-config"
import * as XLSX from "xlsx"

async function parseFile(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase()
  const arrayBuffer = await file.arrayBuffer()
  const firstBytes = new Uint8Array(arrayBuffer.slice(0, 2))
  const isExcelByContent = firstBytes[0] === 0x50 && firstBytes[1] === 0x4B
  
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || isExcelByContent
  
  if (isExcel) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    return jsonData
  } else {
    const text = await file.text()
    return parseCSV(text)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "manager"])

    const formData = await request.formData()
    const previousPayrollPeriod = formData.get("previousPayrollPeriod") as File
    const currentPayrollPeriod = formData.get("currentPayrollPeriod") as File
    const invoiceDetailPeriod1 = formData.get("invoiceDetailPeriod1") as File
    const invoiceDetailPeriod2 = formData.get("invoiceDetailPeriod2") as File
    const invoiceDetailPeriod3 = formData.get("invoiceDetailPeriod3") as File
    const invoiceDetailPeriod4 = formData.get("invoiceDetailPeriod4") as File
    const network = formData.get("network") as string

    // Map network to client ID (LVHN -> 1)
    const networkToClientId: Record<string, string> = {
      LVHN: "1",
      Arkansas: "2",
      Louisville: "3",
      DMH: "4",
    }
    const clientId = networkToClientId[network] || "1"

    if (!previousPayrollPeriod || !currentPayrollPeriod) {
      return NextResponse.json({ error: "Missing required payroll files" }, { status: 400 })
    }

    if (!invoiceDetailPeriod1 || !invoiceDetailPeriod2 || !invoiceDetailPeriod3 || !invoiceDetailPeriod4) {
      return NextResponse.json({ error: "Missing required FLEX Invoice Detail files" }, { status: 400 })
    }

    console.log("[Invoice] Processing invoice files for network:", network)

    // Parse payroll files
    const previousPayrollData = await parseFile(previousPayrollPeriod)
    const currentPayrollData = await parseFile(currentPayrollPeriod)
    
    // Parse FLEX Invoice Detail files
    const invoiceDetailData1 = await parseFile(invoiceDetailPeriod1)
    const invoiceDetailData2 = await parseFile(invoiceDetailPeriod2)
    const invoiceDetailData3 = await parseFile(invoiceDetailPeriod3)
    const invoiceDetailData4 = await parseFile(invoiceDetailPeriod4)

    // Combine all invoice detail files for lookup
    const allInvoiceDetails = [
      ...invoiceDetailData1,
      ...invoiceDetailData2,
      ...invoiceDetailData3,
      ...invoiceDetailData4,
    ]

    console.log("[Invoice] Parsed data counts:", {
      previousPayrollData: previousPayrollData.length,
      currentPayrollData: currentPayrollData.length,
      invoiceDetailRecords: allInvoiceDetails.length,
    })

    // Load transformation rules from database
    let transformationRules = getDefaultInvoiceTransformationRules()
    let transformerConfig = DEFAULT_INVOICE_CONFIG

    try {
      const rulesResponse = await prisma.invoiceTransformationRule.findMany({
        where: {
          clientId,
          active: true,
        },
        orderBy: {
          order: "asc",
        },
      })

      if (rulesResponse.length > 0) {
        transformationRules = rulesResponse.map((rule) => ({
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
        console.log("[Invoice] Loaded", transformationRules.length, "transformation rules from database")
      } else {
        console.log("[Invoice] No rules in database, using defaults")
      }

      // Load transformer config
      const configResponse = await prisma.invoiceTransformerConfig.findUnique({
        where: { clientId },
      })

      if (configResponse) {
        transformerConfig = {
          flexFeeRate: Number(configResponse.flexFeeRate),
          defaultFlexFeeRate: Number(configResponse.defaultFlexFeeRate),
          invoiceNumberPrefix: configResponse.invoiceNumberPrefix,
          microInvoiceNumberPrefix: configResponse.microInvoiceNumberPrefix,
        }
        console.log("[Invoice] Loaded transformer config from database")
      } else {
        // Parse config from rules
        transformerConfig = parseInvoiceTransformationRulesToConfig(transformationRules)
        console.log("[Invoice] Using config parsed from rules")
      }
    } catch (error) {
      console.error("[Invoice] Error loading transformation rules/config:", error)
      console.log("[Invoice] Using default rules and config")
    }

    let invoiceOutput: any
    try {
      const transformer = new FLEXInvoiceTransformer(
        previousPayrollData,
        currentPayrollData,
        allInvoiceDetails,
        network,
        transformationRules,
        transformerConfig
      )
      console.log("[Invoice] Transformer created, starting transform...")
      invoiceOutput = transformer.transform()
      console.log("[Invoice] Transform completed")
      console.log("[Invoice] Main records:", invoiceOutput.mainInvoiceDetail.length)
      console.log("[Invoice] Micro records:", invoiceOutput.microInvoiceDetail.length)
      console.log("[Invoice] Has microhospitals:", invoiceOutput.hasMicrohospitals)
    } catch (error) {
      console.error("[Invoice] Transformer error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: invoiceOutput.mainInvoiceDetail,
      recordCount: invoiceOutput.mainInvoiceDetail.length,
      network,
      timestamp: new Date().toISOString(),
      outputs: {
        mainInvoiceDetail: invoiceOutput.mainInvoiceDetail,
        microInvoiceDetail: invoiceOutput.microInvoiceDetail,
        mainInvoiceCSV: invoiceOutput.mainInvoiceCSV,
        microInvoiceCSV: invoiceOutput.microInvoiceCSV,
        mainProductivityCSV: invoiceOutput.mainProductivityCSV,
        microProductivityCSV: invoiceOutput.microProductivityCSV,
      },
      hasMicrohospitals: invoiceOutput.hasMicrohospitals,
      invoiceNumber: invoiceOutput.invoiceNumber,
    })
  } catch (error) {
    console.error("[Invoice] Error generating invoice:", error)
    return NextResponse.json(
      {
        error: "Failed to generate invoice file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

