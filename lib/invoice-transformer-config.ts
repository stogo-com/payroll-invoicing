// Invoice Transformer Configuration
// Based on "FLEX Invoice Main.transform" XML workflow

import type { TransformationRule } from "@/types/transformation-types"

export interface InvoiceTransformerConfig {
  flexFeeRate: number
  defaultFlexFeeRate: number
  invoiceNumberPrefix: string
  microInvoiceNumberPrefix: string
}

export const DEFAULT_INVOICE_CONFIG: InvoiceTransformerConfig = {
  flexFeeRate: 25.00,
  defaultFlexFeeRate: 25.00,
  invoiceNumberPrefix: "LVFLEX",
  microInvoiceNumberPrefix: "MICFLEX",
}

// Default transformation rules for LVHN invoicing
// Based on the FLEX Invoice Main.transform XML file
export function getDefaultInvoiceTransformationRules(): TransformationRule[] {
  return [
    {
      id: "1",
      name: "Stack",
      category: "Row",
      purpose: "Stack all payroll files together",
      ruleLogic: "Combine previous and current payroll files into a single dataset",
      dataPointsReferenced: ["Previous Payroll Period", "Current Payroll Period"],
      inputFields: ["All columns from both payroll files"],
      outputFields: ["All columns from both payroll files"],
      parameters: {
        alignCols: "Header name",
        onlyFirstCols: true,
        addSeparators: false,
      },
    },
    {
      id: "2",
      name: "Remove",
      category: "Column",
      purpose: "Remove unnecessary columns",
      ruleLogic: "Remove Blank, Facility ID, Adjusted Pay Rate Date Start, Adjusted Pay Rate Date End, Meta Info columns",
      dataPointsReferenced: [],
      inputFields: ["Blank", "Facility ID", "Adjusted Pay Rate Date Start", "Adjusted Pay Rate Date End", "Meta Info"],
      outputFields: [],
      parameters: {
        columnsToRemove: ["Blank", "Facility ID", "Adjusted Pay Rate Date Start", "Adjusted Pay Rate Date End", "Meta Info"],
      },
    },
    {
      id: "3",
      name: "Rename",
      category: "Column",
      purpose: "Rename columns to invoice format",
      ruleLogic: "Rename columns to match invoice output format",
      dataPointsReferenced: [],
      inputFields: [
        "Stogo EID",
        "Pay Hours",
        "Blank",
        "Lookup TNAA",
        "Meta Info",
        "Lookup Shift ID",
        "Lookup Person Name",
        "In-Clocking Date",
        "In-Clocking Time",
        "Out-Clocking Date",
        "Out-Clocking Time",
        "Approver",
        "Company",
        "Company Description",
        "Cost Center",
        "Cost Center Description",
      ],
      outputFields: [
        "Employee ID",
        "Hours Worked",
        "Total Pay for Shift",
        "Facility ID (TNAA)",
        "Date of Payroll",
        "Shift ID",
        "Employee Name",
        "Start Date of Shift",
        "First Punch",
        "End Date of Shift",
        "Last Punch",
        "Shift Approver",
        "Stogo Fac ID",
        "Fac Name",
        "Dept #",
        "Dept Name",
      ],
      parameters: {
        renameMap: {
          "Stogo EID": "Employee ID",
          "Pay Hours": "Hours Worked",
          "Blank": "Total Pay for Shift",
          "Lookup TNAA": "Facility ID (TNAA)",
          "Meta Info": "Date of Payroll",
          "Lookup Shift ID": "Shift ID",
          "Lookup Person Name": "Employee Name",
          "In-Clocking Date": "Start Date of Shift",
          "In-Clocking Time": "First Punch",
          "Out-Clocking Date": "End Date of Shift",
          "Out-Clocking Time": "Last Punch",
          "Approver": "Shift Approver",
          "Company": "Stogo Fac ID",
          "Company Description": "Fac Name",
          "Cost Center": "Dept #",
          "Cost Center Description": "Dept Name",
        },
      },
    },
    {
      id: "4",
      name: "Calculate",
      category: "Column",
      purpose: "Calculate Total Staff Pay",
      ruleLogic: "Multiply Hours Worked by Pay Rate",
      dataPointsReferenced: ["Hours Worked", "Pay Rate"],
      inputFields: ["Hours Worked", "Pay Rate"],
      outputFields: ["Total Staff Pay"],
      parameters: {
        operation: "Multiply",
        column1: "Hours Worked",
        column2: "Pay Rate",
        resultColumn: "Total Staff Pay",
      },
    },
    {
      id: "5",
      name: "New Column",
      category: "Column",
      purpose: "Add Flex Fee Per Hour",
      ruleLogic: "Add Flex Fee Per Hour column with default value of 25.00",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: ["Flex Fee Per Hour"],
      parameters: {
        columnName: "Flex Fee Per Hour",
        defaultValue: 25.00,
      },
    },
    {
      id: "6",
      name: "Calculate",
      category: "Column",
      purpose: "Calculate Total Flex Fee",
      ruleLogic: "Multiply Hours Worked by Flex Fee Per Hour",
      dataPointsReferenced: ["Hours Worked", "Flex Fee Per Hour"],
      inputFields: ["Hours Worked", "Flex Fee Per Hour"],
      outputFields: ["Total Flex Fee"],
      parameters: {
        operation: "Multiply",
        column1: "Hours Worked",
        column2: "Flex Fee Per Hour",
        resultColumn: "Total Flex Fee",
      },
    },
    {
      id: "7",
      name: "Calculate",
      category: "Column",
      purpose: "Calculate Total Shift Fee",
      ruleLogic: "Add Total Staff Pay and Total Flex Fee",
      dataPointsReferenced: ["Total Staff Pay", "Total Flex Fee"],
      inputFields: ["Total Staff Pay", "Total Flex Fee"],
      outputFields: ["Total Shift Fee"],
      parameters: {
        operation: "Add",
        column1: "Total Staff Pay",
        column2: "Total Flex Fee",
        resultColumn: "Total Shift Fee",
      },
    },
    {
      id: "8",
      name: "Replace",
      category: "Column",
      purpose: "Replace pay codes with descriptive names",
      ruleLogic: "Replace FXDY with Day Rate, FXNT with Night Rate, OT40 with OT Rate, FXHI with Incentive Rate, FXSA with Adjustment Rate, ORIEN with Orientation Rate",
      dataPointsReferenced: ["Pay Code"],
      inputFields: ["Pay Code"],
      outputFields: ["Pay Type"],
      parameters: {
        replacements: {
          FXDY: "Day Rate",
          FXNT: "Night Rate",
          OT40: "OT Rate",
          FXHI: "Incentive Rate",
          FXSA: "Adjustment Rate",
          ORIEN: "Orientation Rate",
        },
        caseSensitive: true,
      },
    },
    {
      id: "9",
      name: "Format Date",
      category: "Format",
      purpose: "Format date fields",
      ruleLogic: "Format Start Date of Shift and End Date of Shift from M/d/yyyy to yyyy-MM-dd",
      dataPointsReferenced: ["Start Date of Shift", "End Date of Shift"],
      inputFields: ["Start Date of Shift", "End Date of Shift"],
      outputFields: ["Start Date of Shift", "End Date of Shift"],
      parameters: {
        inputFormat: "M/d/yyyy",
        outputFormat: "yyyy-MM-dd",
        columns: ["Start Date of Shift", "End Date of Shift"],
      },
    },
    {
      id: "10",
      name: "New Column",
      category: "Column",
      purpose: "Add Date of Invoice",
      ruleLogic: "Add Date of Invoice column with current date in yyyy-MM-dd format",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: ["Date of Invoice"],
      parameters: {
        columnName: "Date of Invoice",
        format: "yyyy-MM-dd",
        useCurrentDate: true,
      },
    },
    {
      id: "11",
      name: "Lookup",
      category: "Row",
      purpose: "Lookup invoice numbers from Stogo Timekeeping",
      ruleLogic: "Lookup Invoice Number from invoice history using Shift ID",
      dataPointsReferenced: ["Shift ID", "Invoice History"],
      inputFields: ["Shift ID"],
      outputFields: ["Invoiced Already Check Stogo Timekeeping"],
      parameters: {
        lookupColumn: "Shift ID",
        lookupTable: "Invoice History",
        lookupKeyColumn: "Shift ID",
        lookupValueColumn: "Invoice Number",
        matchType: "Exact",
      },
    },
    {
      id: "12",
      name: "Lookup",
      category: "Row",
      purpose: "Lookup invoice numbers from Client Timekeeping",
      ruleLogic: "Lookup Invoice Number from invoice history using Shift ID",
      dataPointsReferenced: ["Shift ID", "Invoice History"],
      inputFields: ["Shift ID"],
      outputFields: ["Invoice Already Check Client Timekeeping"],
      parameters: {
        lookupColumn: "Shift ID",
        lookupTable: "Invoice History",
        lookupKeyColumn: "Shift ID",
        lookupValueColumn: "Invoice Number",
        matchType: "Exact",
      },
    },
    {
      id: "13",
      name: "Filter",
      category: "Row",
      purpose: "Filter already invoiced records",
      ruleLogic: "Remove records that have an Invoice Number from lookup",
      dataPointsReferenced: ["Invoiced Already Check Stogo Timekeeping", "Invoice Already Check Client Timekeeping"],
      inputFields: ["Invoiced Already Check Stogo Timekeeping", "Invoice Already Check Client Timekeeping"],
      outputFields: [],
      parameters: {
        filterType: "Remove",
        condition: "Invoice Number is not empty",
      },
    },
    {
      id: "14",
      name: "Conditional",
      category: "Row",
      purpose: "Update Shift Approver",
      ruleLogic: "If Shift Approver contains 'Stogo', replace with Updated Approver, else keep Shift Approver",
      dataPointsReferenced: ["Shift Approver", "Updated Approver"],
      inputFields: ["Shift Approver", "Updated Approver"],
      outputFields: ["Shift Approver"],
      parameters: {
        condition: "Shift Approver contains 'Stogo'",
        ifTrue: "Use Updated Approver",
        ifFalse: "Keep Shift Approver",
      },
    },
    {
      id: "15",
      name: "Filter",
      category: "Row",
      purpose: "Filter out Stogo admin approvals",
      ruleLogic: "Remove records where Shift Approver contains 'stogo'",
      dataPointsReferenced: ["Shift Approver"],
      inputFields: ["Shift Approver"],
      outputFields: [],
      parameters: {
        filterType: "Remove",
        condition: "Shift Approver contains 'stogo'",
        caseSensitive: false,
      },
    },
    {
      id: "16",
      name: "Apply Flex Fee Rates",
      category: "Column",
      purpose: "Apply facility-specific flex fee rates",
      ruleLogic: "Set Flex Fee Per Hour based on facility: LVHN facilities = 25.00, Dosher = 30.00, BHA = 20.00",
      dataPointsReferenced: ["Stogo Fac ID", "Fac Name"],
      inputFields: ["Stogo Fac ID", "Fac Name"],
      outputFields: ["Flex Fee Per Hour"],
      parameters: {
        feeRates: {
          "100402": 25.00, // LEHIGH VALLEY HOSPITAL
          "101751": 25.00, // LVH HAZLETON
          "102970": 25.00, // LVH POCONO
          "102462": 25.00, // LVH SCHUYLKILL
          "Dosher Memorial Hospital": 30.00,
          "BHA": 20.00,
        },
        defaultRate: 25.00,
      },
    },
    {
      id: "17",
      name: "Generate Invoice Number",
      category: "Column",
      purpose: "Generate invoice number",
      ruleLogic: "Generate invoice number with prefix and sequential number",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: ["Invoice Number"],
      parameters: {
        prefix: "LVFLEX",
        sequenceStart: 1112,
        format: "{prefix}{number}",
      },
    },
    {
      id: "18",
      name: "Split Microhospitals",
      category: "Row",
      purpose: "Split records into main and microhospital",
      ruleLogic: "Split records based on Stogo Fac ID: 1567, 1571, 1576, 1548 are microhospitals (Macungie and Gilbertsville)",
      dataPointsReferenced: ["Stogo Fac ID"],
      inputFields: ["Stogo Fac ID"],
      outputFields: [],
      parameters: {
        microhospitalFacIds: ["1567", "1571", "1576", "1548"],
        microhospitalFacNames: ["Macungie", "Gilbertsville"],
      },
    },
    {
      id: "19",
      name: "Generate Micro Invoice Number",
      category: "Column",
      purpose: "Generate microhospital invoice number",
      ruleLogic: "Generate microhospital invoice number with prefix and sequential number",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: ["Invoice Number"],
      parameters: {
        prefix: "MICFLEX",
        sequenceStart: 1012,
        format: "{prefix}{number}",
      },
    },
    {
      id: "20",
      name: "Map to Internal Invoice Detail",
      category: "Format",
      purpose: "Map to internal invoice detail Excel format",
      ruleLogic: "Reorder and format columns for internal invoice detail Excel output",
      dataPointsReferenced: [],
      inputFields: ["All invoice fields"],
      outputFields: ["All invoice detail fields"],
      parameters: {
        columnOrder: [
          "Timecard ID",
          "Shift ID",
          "Employee ID",
          "Employee Name",
          "Start Date of Shift",
          "First Punch",
          "End Date of Shift",
          "Last Punch",
          "Fac ID",
          "Fac Name",
          "Dept #",
          "Dept Name",
          "Shift Approver",
          "Hours Worked",
          "Pay Rate",
          "Pay Type",
          "Total Staff Pay",
          "Flex Fee Per Hour",
          "Total Flex Fee",
          "Total Shift Fee",
          "Date of Invoice",
        ],
      },
    },
    {
      id: "21",
      name: "Map to Workday Invoice CSV",
      category: "Format",
      purpose: "Map to Workday supplier invoice CSV format",
      ruleLogic: "Transform to Workday-ingestible CSV format with required columns",
      dataPointsReferenced: [],
      inputFields: ["All invoice fields"],
      outputFields: ["Workday invoice CSV columns"],
      parameters: {
        format: "Workday CSV",
        requiredColumns: [
          "Supplier_Invoice_ID",
          "Invoice_Date",
          "Supplier_Invoice_Internal_Number",
          "Supplier_Invoice_Line_ID",
          "Line_Company_ID",
          "Item_Description",
          "Line_Quantity",
          "Unit_Cost",
          "Extended_Amount",
          "Cost_Center",
          "Spend_Category",
        ],
      },
    },
    {
      id: "22",
      name: "Map to Productivity CSV",
      category: "Format",
      purpose: "Map to productivity CSV format",
      ruleLogic: "Transform to productivity CSV format with required columns",
      dataPointsReferenced: [],
      inputFields: ["All invoice fields"],
      outputFields: ["Productivity CSV columns"],
      parameters: {
        format: "Productivity CSV",
        requiredColumns: [
          "JournalKey",
          "CompanyReferenceID",
          "AccountingDate",
          "DebitAmount",
          "CreditAmount",
          "LineMemo",
          "JournalEntryMemo",
        ],
      },
    },
  ]
}

export function parseInvoiceTransformationRulesToConfig(
  transformations: TransformationRule[],
  defaultConfig: InvoiceTransformerConfig = DEFAULT_INVOICE_CONFIG
): InvoiceTransformerConfig {
  const config = { ...defaultConfig }

  // Extract flex fee rate from transformation rules
  const flexFeeRule = transformations.find((rule) => rule.id === "16")
  if (flexFeeRule?.parameters?.defaultRate) {
    config.defaultFlexFeeRate = flexFeeRule.parameters.defaultRate as number
  }

  // Extract invoice number prefixes
  const invoiceNumberRule = transformations.find((rule) => rule.id === "17")
  if (invoiceNumberRule?.parameters?.prefix) {
    config.invoiceNumberPrefix = invoiceNumberRule.parameters.prefix as string
  }

  const microInvoiceNumberRule = transformations.find((rule) => rule.id === "19")
  if (microInvoiceNumberRule?.parameters?.prefix) {
    config.microInvoiceNumberPrefix = microInvoiceNumberRule.parameters.prefix as string
  }

  return config
}

