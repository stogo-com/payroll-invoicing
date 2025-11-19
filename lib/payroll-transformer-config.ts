export interface PayrollTransformerConfig {
  // Pay Rates
  dayPayRate: number
  nightPayRate: number
  
  // Pay Codes
  dayPayCode: string
  nightPayCode: string
  
  // Approver
  approverName: string
  
  // Lunch Time
  lunchTimeHours: number
  
  // Incentive Rules
  incentives: {
    enabled: boolean
    validThrough: string // Date string YYYY-MM-DD
    rules: IncentiveRule[]
  }
  
  // Transformation Steps (which steps to execute)
  steps: {
    stack: boolean
    lookupStogoEID: boolean
    filterByStogoEID: boolean
    calculateLunchTime: boolean
    calculatePayHours: boolean
    createTimecardID: boolean
    determineDayNightShift: boolean
    assignPayRates: boolean
    assignPayCodes: boolean
    addBlankColumn: boolean
    lookupTNAA: boolean
    assignApprover: boolean
    formatTimes: boolean
    createShiftID: boolean
    lookupShiftID: boolean
    lookupPersonName: boolean
    mapToOutputFormat: boolean
  }
}

export interface IncentiveRule {
  company: string
  costCenters: string[]
  dayOfWeek?: number[] // 0=Sunday, 1=Monday, etc.
  shiftType?: "Day" | "Night" | "Both"
  timeRange?: {
    start: number // Hour (0-23)
    end: number // Hour (0-23)
  }
  amount: number // Extra dollars per hour
  description: string
}

// Default configuration matching current implementation
export const DEFAULT_PAYROLL_CONFIG: PayrollTransformerConfig = {
  dayPayRate: 58,
  nightPayRate: 63,
  dayPayCode: "FXDY",
  nightPayCode: "FXNT",
  approverName: "Jennifer Devine",
  lunchTimeHours: 0.5,
  incentives: {
    enabled: true,
    validThrough: "2025-11-08",
    rules: [
      // Cedar Crest - Weekend Day Shifts
      {
        company: "100402",
        costCenters: ["9343", "9353", "9358", "9363", "9359", "9345", "9366", "9357", "9356", "9350", "9440", "9354", "9386", "9387", "9352", "9349", "9417", "9362", "9361", "9360", "9370", "9364", "9375", "9372", "9373", "9369"],
        dayOfWeek: [0, 6], // Sat/Sun
        shiftType: "Day",
        timeRange: { start: 7, end: 19 },
        amount: 5,
        description: "Cedar Crest: Sat/Sun days 7a-7p - $5 extra per hour"
      },
      // Cedar Crest - Weekend Night Shifts
      {
        company: "100402",
        costCenters: ["9343", "9353", "9358", "9363", "9359", "9345", "9366", "9357", "9356", "9350", "9440", "9354", "9386", "9387", "9352", "9349", "9417", "9362", "9361", "9360", "9370", "9364", "9375", "9372", "9373", "9369"],
        dayOfWeek: [5, 6, 0], // Fri/Sat/Sun
        shiftType: "Night",
        timeRange: { start: 19, end: 7 },
        amount: 10,
        description: "Cedar Crest: Fri/Sat/Sun eve/nights 7p-7a - $10 extra per hour"
      },
      // Carbon - Night Shifts
      {
        company: "102970",
        costCenters: ["4055", "4006"],
        shiftType: "Night",
        amount: 10,
        description: "Carbon: $10 extra per hour for eve/nights"
      },
      // Schuylkill - Night Shifts
      {
        company: "102462",
        costCenters: ["13", "15", "29", "33"],
        shiftType: "Night",
        amount: 10,
        description: "Schuylkill: $10 extra per hour for eve/nights - All BH units"
      }
    ]
  },
  steps: {
    stack: true,
    lookupStogoEID: true,
    filterByStogoEID: true,
    calculateLunchTime: true,
    calculatePayHours: true,
    createTimecardID: true,
    determineDayNightShift: true,
    assignPayRates: true,
    assignPayCodes: true,
    addBlankColumn: true,
    lookupTNAA: true,
    assignApprover: true,
    formatTimes: true,
    createShiftID: true,
    lookupShiftID: true,
    lookupPersonName: true,
    mapToOutputFormat: true
  }
}

// Helper to parse transformation rules from UI into config
export function parseTransformationRulesToConfig(
  transformations: any[],
  defaultConfig: PayrollTransformerConfig = DEFAULT_PAYROLL_CONFIG,
  incentiveRules?: IncentiveRule[],
  incentivesEnabled?: boolean,
  incentiveValidThrough?: string
): PayrollTransformerConfig {
  const config = defaultConfig ? { ...defaultConfig } : { ...DEFAULT_PAYROLL_CONFIG }
  
  // Update incentive rules if provided
  if (incentiveRules) {
    config.incentives.rules = incentiveRules
  }
  
  if (incentivesEnabled !== undefined) {
    config.incentives.enabled = incentivesEnabled
  }
  
  if (incentiveValidThrough) {
    config.incentives.validThrough = incentiveValidThrough
  }
  
  // Parse rules and update config
  for (const rule of transformations) {
    const ruleId = rule.id
    const ruleName = rule.name
    
    // Update pay rates from rule 14 or 15 (both handle pay rates)
    if ((ruleId === "14" || ruleId === "15") && rule.ruleLogic) {
      const dayMatch = rule.ruleLogic.match(/Day\s*=\s*\$?(\d+)/i) || rule.ruleLogic.match(/['"]?Day['"]?\s*with\s*['"]?(\d+)/i)
      const nightMatch = rule.ruleLogic.match(/Night\s*=\s*\$?(\d+)/i) || rule.ruleLogic.match(/['"]?Night['"]?\s*with\s*['"]?(\d+)/i)
      if (dayMatch) config.dayPayRate = parseInt(dayMatch[1], 10)
      if (nightMatch) config.nightPayRate = parseInt(nightMatch[1], 10)
      
      // Also try parsing from parameters if available
      if (rule.parameters) {
        if (rule.parameters.dayRate) config.dayPayRate = parseInt(rule.parameters.dayRate, 10)
        if (rule.parameters.nightRate) config.nightPayRate = parseInt(rule.parameters.nightRate, 10)
      }
    }
    
    // Update pay codes from rule 16
    if (ruleId === "16" && rule.ruleLogic) {
      const dayCodeMatch = rule.ruleLogic.match(/Day\s*=\s*(\w+)/i) || rule.ruleLogic.match(/['"]?Day['"]?\s*with\s*['"]?(\w+)/i)
      const nightCodeMatch = rule.ruleLogic.match(/Night\s*=\s*(\w+)/i) || rule.ruleLogic.match(/['"]?Night['"]?\s*with\s*['"]?(\w+)/i)
      if (dayCodeMatch) config.dayPayCode = dayCodeMatch[1]
      if (nightCodeMatch) config.nightPayCode = nightCodeMatch[1]
      
      // Also try parsing from parameters if available
      if (rule.parameters) {
        if (rule.parameters.dayCode) config.dayPayCode = rule.parameters.dayCode
        if (rule.parameters.nightCode) config.nightPayCode = rule.parameters.nightCode
      }
    }
    
    // Update approver from rule 25
    if (ruleId === "25" && rule.ruleLogic) {
      // Try to extract approver name from IF/THEN logic
      const approverMatch = rule.ruleLogic.match(/THEN\s*['"]([^'"]+)['"]/i) || 
                           rule.ruleLogic.match(/=\s*['"]([^'"]+)['"]/i)
      if (approverMatch) {
        config.approverName = approverMatch[1]
      }
      
      // Also try parsing from parameters if available
      if (rule.parameters && rule.parameters.approverName) {
        config.approverName = rule.parameters.approverName
      }
    }
    
    // Map all rule IDs to their corresponding steps
    // This ensures that if a rule exists in the mappings, the corresponding step is enabled
    const stepMap: Record<string, keyof typeof config.steps> = {
      // Core steps
      "1": "stack",                    // Stack raw timecards with manual adds
      "2": "formatTimes",              // Extract time from datetime (HH:MM:SS → HH:MM)
      "3": "lookupStogoEID",           // Lookup Stogo EID from crosswalk
      "4": "filterByStogoEID",         // Filter records without Stogo EID
      "5": "calculateLunchTime",       // Calculate lunch time (If conditional)
      "6": "calculatePayHours",        // Calculate pay hours
      "7": "filterByStogoEID",         // Filter - separate records with/without GUID
      "8": "createTimecardID",         // Concat - Create Timecard ID when GUID missing
      "9": "createTimecardID",         // Replace - Remove special chars from Timecard ID
      "10": "stack",                    // Stack - Merge records back together
      "11": "createTimecardID",        // Rename - In-Clocking GUID to Timecard ID
      "12": "mapToOutputFormat",        // Remove - Clean up intermediate columns
      "13": "determineDayNightShift",   // If - Determine Day/Night shift
      "14": "assignPayRates",           // Replace - Assign base pay rates
      "15": "assignPayRates",           // Assign - Apply incentives
      "16": "assignPayCodes",           // Replace - Assign pay codes
      "17": "addBlankColumn",           // New Col - Add blank column
      "18": "lookupTNAA",               // Lookup TNAA
      "19": "createShiftID",            // Concat - Create Shift ID
      "20": "createShiftID",            // Replace - Remove special chars from Shift ID
      "21": "lookupShiftID",            // Lookup Shift ID
      "22": "lookupPersonName",        // Lookup Person Name
      "23": "mapToOutputFormat",        // Date Format - Format In-Clocking Date
      "24": "mapToOutputFormat",        // Replace - Remove NU/HS prefixes
      "25": "assignApprover",           // If - Assign approver based on network
      "26": "mapToOutputFormat",        // Reorder - Reorder columns
      "27": "mapToOutputFormat",        // Remove - Final cleanup
      "28": "mapToOutputFormat",        // Whitespace - Clean up whitespace
      
      // Legacy decimal IDs (for backward compatibility)
      "10.5": "lookupTNAA",
      "13.5": "lookupShiftID",
      "13.6": "lookupPersonName",
    }
    
    // Enable the corresponding step if rule exists
    if (stepMap[ruleId]) {
      config.steps[stepMap[ruleId]] = true
      console.log(`[v0] Rule ${ruleId} (${ruleName}) mapped to step: ${stepMap[ruleId]}`)
    } else {
      console.warn(`[v0] Rule ${ruleId} (${ruleName}) not mapped to any step`)
    }
  }
  
  // Log final configuration
  console.log("[v0] Final transformer config:", {
    dayPayRate: config.dayPayRate,
    nightPayRate: config.nightPayRate,
    dayPayCode: config.dayPayCode,
    nightPayCode: config.nightPayCode,
    approverName: config.approverName,
    enabledSteps: Object.entries(config.steps)
      .filter(([_, enabled]) => enabled)
      .map(([step, _]) => step),
    incentiveRulesCount: config.incentives.rules.length,
    incentivesEnabled: config.incentives.enabled,
  })
  
  return config
}
