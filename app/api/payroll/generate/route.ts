import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { LVHNPayrollTransformer, parseCSV } from "@/lib/lvhn-payroll-transformer"
import { parseTransformationRulesToConfig } from "@/lib/payroll-transformer-config"
import * as XLSX from "xlsx"

// Helper function to parse both CSV and Excel files
async function parseFile(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase()
  
  // First, read the file to check content (magic bytes)
  // Excel files (XLSX) start with "PK" (they're ZIP archives)
  const arrayBuffer = await file.arrayBuffer()
  const firstBytes = new Uint8Array(arrayBuffer.slice(0, 2))
  const isExcelByContent = firstBytes[0] === 0x50 && firstBytes[1] === 0x4B // "PK" signature
  
  // Check extension OR content
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || isExcelByContent
  
  if (isExcel) {
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    return jsonData
  } else {
    // Parse CSV file
    const text = await file.text()
    return parseCSV(text)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "manager"])

    const formData = await request.formData()
    const rawTimecard = formData.get("rawTimecard") as File
    const manualAdds = formData.get("manualAdds") as File
    const crosswalk = formData.get("crosswalk") as File
    const facilityCrosswalk = formData.get("facilityCrosswalk") as File | null
    const shiftsFile = formData.get("shiftsFile") as File | null
    const network = formData.get("network") as string
    const transformationsJson = formData.get("transformations") as string | null
    const incentiveRulesJson = formData.get("incentiveRules") as string | null
    const incentivesEnabledJson = formData.get("incentivesEnabled") as string | null
    const incentiveValidThrough = formData.get("incentiveValidThrough") as string | null
    const payPeriodStart = formData.get("payPeriodStart") as string | null
    const payPeriodEnd = formData.get("payPeriodEnd") as string | null

    if (!rawTimecard || !manualAdds || !crosswalk) {
      return NextResponse.json({ error: "Missing required files" }, { status: 400 })
    }

    console.log("[v0] Processing payroll files for network:", network)
    
    // Parse transformations and incentive rules
    let transformerConfig
    if (transformationsJson || incentiveRulesJson) {
      try {
        const transformations = transformationsJson ? JSON.parse(transformationsJson) : []
        const incentiveRules = incentiveRulesJson ? JSON.parse(incentiveRulesJson) : null
        const incentivesEnabled = incentivesEnabledJson ? JSON.parse(incentivesEnabledJson) : true
        
        console.log("[v0] Received", transformations.length, "transformation rules")
        if (incentiveRules) {
          console.log("[v0] Received", incentiveRules.length, "incentive rules")
        }
        
        transformerConfig = parseTransformationRulesToConfig(
          transformations,
          undefined, // Will use default
          incentiveRules,
          incentivesEnabled,
          incentiveValidThrough || undefined
        )
        console.log("[v0] Using custom transformer configuration")
      } catch (error) {
        console.warn("[v0] Failed to parse rules, using defaults:", error)
        transformerConfig = undefined
      }
    }

    console.log("[v0] Files received:", {
      rawTimecard: rawTimecard.name,
      manualAdds: manualAdds.name,
      crosswalk: crosswalk.name,
      facilityCrosswalk: facilityCrosswalk?.name || "Not provided",
      shiftsFile: shiftsFile?.name || "Not provided",
    })

    // Parse files (handles both CSV and Excel)
    const wdData = await parseFile(rawTimecard)
    const manualData = await parseFile(manualAdds)
    const crosswalkData = await parseFile(crosswalk)
    const facilityCrosswalkData = facilityCrosswalk ? await parseFile(facilityCrosswalk) : []
    const shiftsFileData = shiftsFile ? await parseFile(shiftsFile) : []

    console.log("[v0] Parsed data counts:", {
      wdData: wdData.length,
      manualData: manualData.length,
      crosswalkData: crosswalkData.length,
      facilityCrosswalkData: facilityCrosswalkData.length,
      shiftsFileData: shiftsFileData.length,
    })

    // CRITICAL DEBUGGING - Shows actual column names
    if (wdData.length > 0) {
      console.log("[v0] ===== WD DATA COLUMNS =====")
      console.log("[v0] Column names:", Object.keys(wdData[0]))
      console.log("[v0] Sample EmployeeID:", wdData[0].EmployeeID || wdData[0]["EmployeeID"] || "NOT FOUND")
      console.log("[v0] Sample row:", JSON.stringify(wdData[0], null, 2))
    }
    if (crosswalkData.length > 0) {
      console.log("[v0] ===== CROSSWALK COLUMNS =====")
      console.log("[v0] Column names:", Object.keys(crosswalkData[0]))
      console.log("[v0] Sample EEID:", crosswalkData[0].EEID || crosswalkData[0]["EEID"] || "NOT FOUND")
      console.log("[v0] Sample crosswalk row:", JSON.stringify(crosswalkData[0], null, 2))
    }
    if (facilityCrosswalkData.length > 0) {
      console.log("[v0] ===== FACILITY CROSSWALK COLUMNS =====")
      console.log("[v0] Column names:", Object.keys(facilityCrosswalkData[0]))
      console.log("[v0] Sample row:", JSON.stringify(facilityCrosswalkData[0], null, 2))
    }
    if (shiftsFileData.length > 0) {
      console.log("[v0] ===== SHIFTS FILE COLUMNS =====")
      console.log("[v0] Column names:", Object.keys(shiftsFileData[0]))
      console.log("[v0] Sample row:", JSON.stringify(shiftsFileData[0], null, 2))
      console.log("[v0] Total shifts file records:", shiftsFileData.length)
      // Show a few sample values for key columns
      if (shiftsFileData.length > 0) {
        const sample = shiftsFileData[0]
        console.log("[v0] Sample 'New Shift ID':", sample["New Shift ID"] || "NOT FOUND")
        console.log("[v0] Sample 'Shift ID':", sample["Shift ID"] || "NOT FOUND")
        console.log("[v0] Sample 'Lookup Shift ID':", sample["Lookup Shift ID"] || "NOT FOUND")
        console.log("[v0] Sample 'Timecard ID':", sample["Timecard ID"] || "NOT FOUND")
        console.log("[v0] Sample 'Stogo EID':", sample["Stogo EID"] || "NOT FOUND")
        console.log("[v0] Sample 'Person ID':", sample["Person ID"] || "NOT FOUND")
      }
    }
    console.log("[v0] ================================")

    let payrollOutput: any[] = []
    try {
      const transformer = new LVHNPayrollTransformer(
        wdData, 
        manualData, 
        crosswalkData, 
        facilityCrosswalkData, 
        shiftsFileData,
        transformerConfig,
        payPeriodStart ? new Date(payPeriodStart) : undefined,
        payPeriodEnd ? new Date(payPeriodEnd) : undefined
      )
      console.log("[v0] Transformer created, starting transform...")
      payrollOutput = transformer.transform()
      console.log("[v0] Transform completed, output length:", payrollOutput.length)
    } catch (error) {
      console.error("[v0] Transformer error:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : String(error))
      throw error
    }

    console.log("[v0] Generated payroll output:", payrollOutput.length, "records")

    return NextResponse.json({
      success: true,
      data: payrollOutput,
      recordCount: payrollOutput.length,
      network,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error generating payroll:", error)
    return NextResponse.json(
      {
        error: "Failed to generate payroll file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
