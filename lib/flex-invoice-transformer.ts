// FLEX Invoice Transformer
// Based on "FLEX Invoice Main.transform" workflow

import type { TransformationRule } from "@/types/transformation-types"
import type { InvoiceTransformerConfig } from "./invoice-transformer-config"

// LVHN Facility Numbers
const LVHN_FACILITIES = [
  "100402", // LEHIGH VALLEY HOSPITAL
  "101751", // LVH HAZLETON
  "102970", // LVH POCONO
  "102462", // LVH SCHUYLKILL
]

// Microhospital Facility IDs (Macungie and Gilbertsville)
const MICROHOSPITAL_FACILITIES = ["1567", "1571", "1576", "1548"] // These are Stogo Fac ID values

// Default FLEX Fee Rates by Facility
const DEFAULT_FLEX_FEE_RATES: Record<string, number> = {
  "100402": 25.00, // LEHIGH VALLEY HOSPITAL
  "101751": 25.00, // LVH HAZLETON
  "102970": 25.00, // LVH POCONO
  "102462": 25.00, // LVH SCHUYLKILL
  // Default rate
  "default": 25.00,
}

export interface InvoiceOutput {
  "Employee Name": string
  "Stogo EID": string
  "Start Date of Shift": string
  "End Date of Shift": string
  "Hours Worked": string
  "Pay Type": string
  "Pay Rate": string
  "Total Staff Pay": string
  "Flex Fee Per Hour": string
  "Total Flex Fee": string
  "Total Shift Fee": string
  "Dept #": string
  "Dept Name": string
  "Fac ID": string
  "Fac Name": string
  "Stogo Fac ID": string
  "Invoice Number": string
  "Date of Invoice": string
  [key: string]: any
}

export interface InvoiceGenerationResult {
  mainInvoiceDetail: InvoiceOutput[]
  microInvoiceDetail: InvoiceOutput[]
  mainInvoiceCSV: any[]
  microInvoiceCSV: any[]
  mainProductivityCSV: any[]
  microProductivityCSV: any[]
  hasMicrohospitals: boolean
  invoiceNumber: string
}

export class FLEXInvoiceTransformer {
  private previousPayroll: any[]
  private currentPayroll: any[]
  private invoiceDetails: any[]
  private network: string
  private transformationRules: TransformationRule[]
  private config: InvoiceTransformerConfig
  private flexFeeRates: Record<string, number>

  constructor(
    previousPayroll: any[],
    currentPayroll: any[],
    invoiceDetails: any[],
    network: string = "LVHN",
    transformationRules: TransformationRule[] = [],
    config?: InvoiceTransformerConfig
  ) {
    this.previousPayroll = previousPayroll
    this.currentPayroll = currentPayroll
    this.invoiceDetails = invoiceDetails
    this.network = network
    this.transformationRules = transformationRules
    this.config = config || {
      flexFeeRate: 25.00,
      defaultFlexFeeRate: 25.00,
      invoiceNumberPrefix: "LVFLEX",
      microInvoiceNumberPrefix: "MICFLEX",
    }

    // Build flex fee rates from config and rules
    this.flexFeeRates = { ...DEFAULT_FLEX_FEE_RATES }
    this.flexFeeRates.default = this.config.defaultFlexFeeRate

    // Extract fee rates from transformation rules if available
    const feeRateRule = transformationRules.find((r) => r.id === "16")
    if (feeRateRule?.parameters?.feeRates) {
      Object.assign(this.flexFeeRates, feeRateRule.parameters.feeRates)
    }
  }

  transform(): InvoiceGenerationResult {
    console.log("[Invoice] Starting transformation...")
    
    // Step 1: Stack both payroll files
    let records = this.stackBothPayrollFiles()
    console.log("[Invoice] Stacked payroll records:", records.length)

    // Step 2: Remove columns
    records = this.removeColumns(records)
    console.log("[Invoice] After removing columns:", records.length)

    // Step 3: Rename columns
    records = this.renameColumns(records)
    console.log("[Invoice] After renaming columns:", records.length)

    // Step 4: Calculate financial fields
    records = this.calculateFinancialFields(records)
    console.log("[Invoice] After calculating financial fields:", records.length)

    // Step 5: Replace pay codes
    records = this.replacePayCodes(records)
    console.log("[Invoice] After replacing pay codes:", records.length)

    // Step 6: Format dates
    records = this.formatDates(records)
    console.log("[Invoice] After formatting dates:", records.length)

    // Step 7: Lookup invoice numbers from historical files
    records = this.lookupInvoiceNumbers(records)
    console.log("[Invoice] After looking up invoice numbers:", records.length)

    // Step 8: Filter out already invoiced shifts
    records = this.filterAlreadyInvoiced(records)
    console.log("[Invoice] After filtering already invoiced:", records.length)

    // Step 9: Apply FLEX fee rates
    records = this.applyFlexFeeRates(records)
    console.log("[Invoice] After applying FLEX fee rates:", records.length)

    // Step 10: Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber()
    console.log("[Invoice] Generated invoice number:", invoiceNumber)

    // Step 11: Split microhospitals
    const { mainRecords, microRecords } = this.splitMicrohospitals(records)
    console.log("[Invoice] Main records:", mainRecords.length, "Micro records:", microRecords.length)

    // Step 12: Map to invoice detail format (Excel output)
    const mainInvoiceDetail = this.mapToInvoiceDetailFormat(mainRecords, invoiceNumber)
    const microInvoiceDetail = this.mapToInvoiceDetailFormat(microRecords, this.generateMicroInvoiceNumber())

    // Step 13: Map to Workday invoice format (CSV output)
    const mainInvoiceCSV = this.mapToWorkdayInvoiceFormat(mainRecords, invoiceNumber)
    const microInvoiceCSV = this.mapToWorkdayInvoiceFormat(microRecords, this.generateMicroInvoiceNumber())

    // Step 14: Map to productivity format (CSV output)
    const mainProductivityCSV = this.mapToProductivityFormat(mainRecords)
    const microProductivityCSV = this.mapToProductivityFormat(microRecords)

    return {
      mainInvoiceDetail,
      microInvoiceDetail,
      mainInvoiceCSV,
      microInvoiceCSV,
      mainProductivityCSV,
      microProductivityCSV,
      hasMicrohospitals: microRecords.length > 0,
      invoiceNumber,
    }
  }

  private stackBothPayrollFiles(): any[] {
    return [...this.previousPayroll, ...this.currentPayroll]
  }

  private removeColumns(records: any[]): any[] {
    // Remove: Blank, Adjusted Pay Rate Date Start, Adjusted Pay Rate Date End, Meta Info
    return records.map((record) => {
      const { Blank, "Adjusted Pay Rate Date Start": _, "Adjusted Pay Rate Date End": __, "Meta Info": ___, ...rest } = record
      return rest
    })
  }

  private renameColumns(records: any[]): any[] {
    return records.map((record) => {
      const renamed: any = {}
      
      // Map payroll columns to invoice columns
      renamed["Employee Name"] = record["Lookup Person Name"] || ""
      renamed["Stogo EID"] = record["Stogo EID"] || ""
      renamed["Start Date of Shift"] = record["In-Clocking Date"] || ""
      renamed["End Date of Shift"] = record["Out-Clocking Date"] || ""
      renamed["Hours Worked"] = record["Pay Hours"] || ""
      renamed["Pay Type"] = record["Pay Code"] || ""
      renamed["Pay Rate"] = record["Pay Rate"] || ""
      renamed["Dept #"] = record["Cost Center"] || ""
      renamed["Dept Name"] = record["Cost Center Description"] || ""
      renamed["Fac ID"] = record["Company"] || ""
      renamed["Fac Name"] = record["Company Description"] || ""
      renamed["Stogo Fac ID"] = record["Lookup TNAA"] || ""
      
      // Keep other fields that might be needed
      Object.keys(record).forEach((key) => {
        if (!renamed[key]) {
          renamed[key] = record[key]
        }
      })
      
      return renamed
    })
  }

  private calculateFinancialFields(records: any[]): any[] {
    return records.map((record) => {
      const hoursWorked = parseFloat(String(record["Hours Worked"] || "0").replace(/[^0-9.-]/g, "")) || 0
      const payRate = parseFloat(String(record["Pay Rate"] || "0").replace(/[^0-9.-]/g, "")) || 0
      const totalStaffPay = hoursWorked * payRate
      
      return {
        ...record,
        "Total Staff Pay": totalStaffPay.toFixed(2),
      }
    })
  }

  private replacePayCodes(records: any[]): any[] {
    const payCodeMap: Record<string, string> = {
      "FXNT": "Night",
      "FXDY": "Day",
    }
    
    return records.map((record) => {
      const payCode = record["Pay Type"] || ""
      return {
        ...record,
        "Pay Type": payCodeMap[payCode] || payCode,
      }
    })
  }

  private formatDates(records: any[]): any[] {
    const today = new Date()
    const dateOfInvoice = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear().toString().slice(-2)}`
    
    return records.map((record) => {
      return {
        ...record,
        "Date of Invoice": dateOfInvoice,
      }
    })
  }

  private lookupInvoiceNumbers(records: any[]): any[] {
    // Create lookup map from invoice details
    // Match on: Employee Name, Start Date, Hours Worked, Pay Type
    const lookupMap = new Map<string, string>()
    
    this.invoiceDetails.forEach((detail) => {
      const key = this.createInvoiceLookupKey(detail)
      const invoiceNum = detail["Invoice Number"] || ""
      if (invoiceNum && !lookupMap.has(key)) {
        lookupMap.set(key, invoiceNum)
      }
    })
    
    return records.map((record) => {
      const key = this.createInvoiceLookupKey(record)
      const invoiceNumber = lookupMap.get(key) || ""
      return {
        ...record,
        "Invoice Number": invoiceNumber,
      }
    })
  }

  private createInvoiceLookupKey(record: any): string {
    const employeeName = String(record["Employee Name"] || "").trim()
    const startDate = String(record["Start Date of Shift"] || "").trim()
    const hoursWorked = String(record["Hours Worked"] || "").trim()
    const payType = String(record["Pay Type"] || "").trim()
    return `${employeeName}|${startDate}|${hoursWorked}|${payType}`
  }

  private filterAlreadyInvoiced(records: any[]): any[] {
    // Remove records that have an Invoice Number (already invoiced)
    return records.filter((record) => {
      const invoiceNum = String(record["Invoice Number"] || "").trim()
      return !invoiceNum || invoiceNum === ""
    })
  }

  private applyFlexFeeRates(records: any[]): any[] {
    return records.map((record) => {
      const facId = String(record["Fac ID"] || "").trim()
      const flexFeePerHour = this.flexFeeRates[facId] || this.flexFeeRates["default"]
      const hoursWorked = parseFloat(String(record["Hours Worked"] || "0").replace(/[^0-9.-]/g, "")) || 0
      const totalFlexFee = hoursWorked * flexFeePerHour
      const totalStaffPay = parseFloat(String(record["Total Staff Pay"] || "0")) || 0
      const totalShiftFee = totalStaffPay + totalFlexFee
      
      return {
        ...record,
        "Flex Fee Per Hour": flexFeePerHour.toFixed(2),
        "Total Flex Fee": totalFlexFee.toFixed(2),
        "Total Shift Fee": totalShiftFee.toFixed(2),
      }
    })
  }

  private generateInvoiceNumber(): string {
    // Use prefix from config
    const prefix = this.config.invoiceNumberPrefix || "LVFLEX"
    // Generate invoice number based on network and date
    // Format: {prefix} + sequence (e.g., LVFLEX1112)
    // TODO: Look up last invoice number from historical files to determine sequence
    // For now, using a simple format based on date
    const today = new Date()
    const month = (today.getMonth() + 1).toString().padStart(2, "0")
    const day = today.getDate().toString().padStart(2, "0")
    const year = today.getFullYear().toString().slice(-2)
    
    // Extract sequence from transformation rules if available
    const invoiceNumberRule = this.transformationRules.find((r) => r.id === "17")
    if (invoiceNumberRule?.parameters?.sequenceStart) {
      const sequence = invoiceNumberRule.parameters.sequenceStart as number
      return `${prefix}${sequence}`
    }
    
    // Fallback to date-based format
    return `${prefix}${month}${day}${year}`
  }

  private generateMicroInvoiceNumber(): string {
    // Use prefix from config
    const prefix = this.config.microInvoiceNumberPrefix || "MICFLEX"
    // Format: {prefix} + sequence (static for microhospitals for now)
    // TODO: Look up last micro invoice number from historical files
    return `${prefix}1012`
  }

  private splitMicrohospitals(records: any[]): { mainRecords: any[]; microRecords: any[] } {
    const mainRecords: any[] = []
    const microRecords: any[] = []

    records.forEach((record) => {
      const facId = String(record["Stogo Fac ID"] || record["Fac ID"] || "").trim()
      const isMicro = MICROHOSPITAL_FACILITIES.includes(facId)

      if (isMicro) {
        microRecords.push(record)
      } else {
        mainRecords.push(record)
      }
    })

    return { mainRecords, microRecords }
  }

  private mapToInvoiceDetailFormat(records: any[], invoiceNumber: string): InvoiceOutput[] {
    return records.map((record) => {
      return {
        "Employee Name": record["Employee Name"] || "",
        "Stogo EID": record["Stogo EID"] || "",
        "Start Date of Shift": record["Start Date of Shift"] || "",
        "End Date of Shift": record["End Date of Shift"] || "",
        "Hours Worked": record["Hours Worked"] || "",
        "Pay Type": record["Pay Type"] || "",
        "Pay Rate": record["Pay Rate"] || "",
        "Total Staff Pay": record["Total Staff Pay"] || "",
        "Flex Fee Per Hour": record["Flex Fee Per Hour"] || "",
        "Total Flex Fee": record["Total Flex Fee"] || "",
        "Total Shift Fee": record["Total Shift Fee"] || "",
        "Dept #": record["Dept #"] || "",
        "Dept Name": record["Dept Name"] || "",
        "Fac ID": record["Fac ID"] || "",
        "Fac Name": record["Fac Name"] || "",
        "Stogo Fac ID": record["Stogo Fac ID"] || "",
        "Invoice Number": invoiceNumber,
        "Date of Invoice": record["Date of Invoice"] || "",
      }
    })
  }

  private mapToWorkdayInvoiceFormat(records: any[], invoiceNumber: string): any[] {
    return records.map((record, index) => {
      const unitCost = this.calculateUnitCost(record)
      return {
        "Supplier Invoice Number": invoiceNumber,
        "Invoice Date": record["Date of Invoice"] || "",
        "Line Item Number": (index + 1).toString(),
        "Unit Cost": unitCost,
        "Quantity": record["Hours Worked"] || "",
        "Cost Center": record["Dept #"] || "",
        "Spend Category": "", // May need mapping
        "Memo": `${record["Employee Name"]} - ${record["Start Date of Shift"]} - ${record["Pay Type"]}`,
        "Employee Name": record["Employee Name"] || "",
        "Shift Date": record["Start Date of Shift"] || "",
        "Pay Type": record["Pay Type"] || "",
      }
    })
  }

  private mapToProductivityFormat(records: any[]): any[] {
    return records.map((record, index) => {
      return {
        "Journal Key": "", // May need to generate
        "Cost Center Worktag": record["Dept #"] || "",
        "Statistical Account Code": "", // May need mapping
        "Hours": record["Hours Worked"] || "",
        "Line Memo": `${record["Employee Name"]} - ${record["Start Date of Shift"]}`,
        "Employee Name": record["Employee Name"] || "",
        "Shift Date": record["Start Date of Shift"] || "",
        "Facility": record["Fac Name"] || "",
      }
    })
  }

  private calculateUnitCost(record: any): string {
    // Unit cost = Total Shift Fee / Hours Worked
    const totalShiftFee = parseFloat(String(record["Total Shift Fee"] || "0")) || 0
    const hoursWorked = parseFloat(String(record["Hours Worked"] || "0").replace(/[^0-9.-]/g, "")) || 0
    
    if (hoursWorked === 0) return "0.00"
    const unitCost = totalShiftFee / hoursWorked
    return unitCost.toFixed(2)
  }
}

// Helper function to parse CSV
export function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split("\n")
  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      rows.push(row)
    }
  }

  return rows
}

