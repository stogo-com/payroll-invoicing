import { PayrollTransformerConfig, DEFAULT_PAYROLL_CONFIG } from "./payroll-transformer-config"

export interface TimecardRecord {
  EmployeeID: string
  FirstName: string
  LastName: string
  "In-Clocking GUID": string
  Hours: string
  Paycode: string
  "In-Clocking Date": string
  "In-Clocking Time": string
  "Out-Clocking Date": string
  "Out-Clocking Time": string
  "UserShiftAnswer-OutClocking": string
  Company: string
  "Company Description": string
  "Cost Center": string
  "Cost Center Description": string
  "Last Time Approved"?: string
  [key: string]: any
}

export interface CrosswalkRecord {
  EEID: string
  "Employee Number": string
  [key: string]: any
}

export interface PayrollOutput {
  "Stogo EID": string
  "Pay Code": string
  "Pay Hours": string
  "Pay Rate": string
  Blank: string
  "Lookup TNAA": string
  "Adjusted Pay Rate Date Start": string
  "Adjusted Pay Rate Date End": string
  "Timecard ID": string
  "Meta Info": string
  "Lookup Shift ID": string
  "Lookup Person Name": string
  "In-Clocking Date": string
  "In-Clocking Time": string
  "Out-Clocking Date": string
  "Out-Clocking Time": string
  Approver: string
  Company: string
  "Company Description": string
  "Cost Center": string
  "Cost Center Description": string
  hasIncentive?: boolean // Flag to mark incentive rows
  isOutsidePayPeriod?: boolean // Add flag for outside pay period
}

export class LVHNPayrollTransformer {
  private rawTimecards: TimecardRecord[] = []
  private manualAdds: TimecardRecord[] = []
  private crosswalk: CrosswalkRecord[] = []
  private facilityCrosswalk: any[] = []
  private shiftsFile: any[] = []
  private config: PayrollTransformerConfig
  private payPeriodStart?: Date
  private payPeriodEnd?: Date

  constructor(
    rawTimecards: TimecardRecord[], 
    manualAdds: TimecardRecord[], 
    crosswalk: CrosswalkRecord[],
    facilityCrosswalk: any[] = [],
    shiftsFile: any[] = [],
    config: PayrollTransformerConfig = DEFAULT_PAYROLL_CONFIG,
    payPeriodStart?: Date,
    payPeriodEnd?: Date
  ) {
    this.rawTimecards = rawTimecards
    this.manualAdds = manualAdds
    this.crosswalk = crosswalk
    this.facilityCrosswalk = facilityCrosswalk
    this.shiftsFile = shiftsFile
    this.config = config
    this.payPeriodStart = payPeriodStart
    this.payPeriodEnd = payPeriodEnd
  }

  transform(): PayrollOutput[] {
    let records: any[] = []
    
    // Step 1: Stack raw timecards with manual adds
    if (this.config.steps.stack) {
      records = [...this.rawTimecards, ...this.manualAdds]
      console.log("[v0] Step 1 - Stacked records:", records.length)
    } else {
      records = [...this.rawTimecards]
    }

    // Step 2: Lookup Stogo EID from crosswalk
    if (this.config.steps.lookupStogoEID) {
      records = this.lookupStogoEID(records)
      console.log("[v0] Step 2 - Records with StogoEID:", records.filter(r => r.StogoEID && r.StogoEID.trim() !== "").length)
    }

    // Step 3: Filter out records without Stogo EID
    if (this.config.steps.filterByStogoEID) {
      const beforeFilter = records.length
      records = records.filter((r) => r.StogoEID && r.StogoEID.trim() !== "")
      console.log("[v0] Step 3 - Filtered from", beforeFilter, "to", records.length)
      
      if (records.length === 0) {
        console.error("[v0] ERROR: All records filtered out at Step 3!")
        return []
      }
    }

    // Step 4: Handle lunch time calculation
    if (this.config.steps.calculateLunchTime) {
      records = this.calculateLunchTime(records)
      console.log("[v0] Step 4 - After lunch calculation:", records.length)
    }

    // Step 5: Calculate pay hours (Hours - Lunch Time)
    if (this.config.steps.calculatePayHours) {
      records = this.calculatePayHours(records)
      console.log("[v0] Step 5 - After pay hours calculation:", records.length)
    }

    // Step 6: Create Timecard ID
    if (this.config.steps.createTimecardID) {
      records = this.createTimecardID(records)
      console.log("[v0] Step 6 - After timecard ID:", records.length)
    }

    // Step 7: Determine day/night shift
    if (this.config.steps.determineDayNightShift) {
      records = this.determineDayNightShift(records)
      console.log("[v0] Step 7 - After day/night shift:", records.length)
    }

    // Step 8: Assign pay rates
    if (this.config.steps.assignPayRates) {
      records = this.assignPayRates(records)
      console.log("[v0] Step 8 - After pay rates:", records.length)
    }

    // Step 9: Assign pay codes
    if (this.config.steps.assignPayCodes) {
      records = this.assignPayCodes(records)
      console.log("[v0] Step 9 - After pay codes:", records.length)
    }

    // Step 10: Add blank column
    if (this.config.steps.addBlankColumn) {
      records = records.map((r) => ({ ...r, Blank: " " }))
      console.log("[v0] Step 10 - After blank column:", records.length)
    }

    // Step 10.5: Lookup TNAA
    if (this.config.steps.lookupTNAA) {
      records = this.lookupTNAA(records)
      console.log("[v0] Step 10.5 - After TNAA lookup:", records.length)
    }

    // Step 11: Assign approver
    if (this.config.steps.assignApprover) {
      records = this.assignApprover(records)
      console.log("[v0] Step 11 - After approver:", records.length)
    }

    // Step 12: Format times
    if (this.config.steps.formatTimes) {
      records = this.formatTimes(records)
      console.log("[v0] Step 12 - After format times:", records.length)
    }

    // Step 13: Create shift ID
    if (this.config.steps.createShiftID) {
      records = this.createShiftID(records)
      console.log("[v0] Step 13 - After shift ID:", records.length)
    }

    // Step 13.5: Lookup Shift ID
    if (this.config.steps.lookupShiftID) {
      records = this.lookupShiftID(records)
      console.log("[v0] Step 13.5 - After lookup shift ID:", records.length)
    }

    // Step 13.6: Lookup Person Name
    if (this.config.steps.lookupPersonName) {
      records = this.lookupPersonName(records)
      console.log("[v0] Step 13.6 - After lookup person name:", records.length)
    }

    // Step 14: Map to final output format
    if (this.config.steps.mapToOutputFormat) {
      const output = this.mapToOutputFormat(records)
      console.log("[v0] Step 14 - Final output:", output.length)
      return output
    }
    
    return this.mapToOutputFormat(records)
  }

  private lookupStogoEID(records: TimecardRecord[]): any[] {
    return records.map((record) => {
      const crosswalkMatch = this.crosswalk.find((c) => c.EEID === record.EmployeeID)
      // Try both column name variations (with and without "Lookup *" prefix)
      const employeeNumber = crosswalkMatch?.["Lookup *Employee Number"] || 
                             crosswalkMatch?.["Employee Number"] || 
                             ""
      return {
        ...record,
        StogoEID: employeeNumber,
      }
    })
  }

  private lookupTNAA(records: any[]): any[] {
    if (this.facilityCrosswalk.length === 0) {
      // If no facility crosswalk provided, use Company as TNAA
      return records.map((record) => ({
        ...record,
        LookupTNAA: record.Company || "",
      }))
    }

    return records.map((record) => {
      // Lookup: Company (from timecard) matches Stogo Code (from facility crosswalk) -> get TNAA
      const company = record.Company || ""
      const facilityMatch = this.facilityCrosswalk.find(
        (fc) => {
          const stogoCode = String(fc["Stogo Code"] || "").trim()
          const companyStr = String(company).trim()
          return stogoCode === companyStr || stogoCode === company
        }
      )
      return {
        ...record,
        LookupTNAA: facilityMatch?.["TNAA"] || company || "",
      }
    })
  }

  private lookupShiftID(records: any[]): any[] {
    if (this.shiftsFile.length === 0) {
      console.log("[v0] ⚠️ No shifts file provided, Lookup Shift ID will be empty")
      return records.map((record) => ({
        ...record,
        LookupShiftID: "",
      }))
    }

    // Helper function to parse date from start_date_time
    const parseDateFromStartTime = (startDateTime: string): string => {
      if (!startDateTime) return ""
      
      // Format: "02/28/26  18:30 PM CST - February"
      // Extract date part (first 8 characters: MM/DD/YY)
      const dateMatch = startDateTime.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})/)
      if (dateMatch) {
        const [, month, day, year] = dateMatch
        // Format as YYYYMMDD (assuming 20XX for 2-digit year)
        const fullYear = `20${year}`
        return `${fullYear}${month.padStart(2, "0")}${day.padStart(2, "0")}`
      }
      
      // Try other date formats
      const dateStr = String(startDateTime).split(" ")[0] // Get first part before space
      return dateStr.replace(/\//g, "").replace(/-/g, "")
    }

    // Get date range from timecards to filter shifts
    const timecardDates = new Set<string>()
    records.forEach((record) => {
      let dateStr = record["In-Clocking Date"]
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split("T")[0].replace(/-/g, "")
      } else if (typeof dateStr === "number" && dateStr > 0 && dateStr < 1000000) {
        const excelEpoch = new Date(1899, 11, 30)
        const jsDate = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
        dateStr = jsDate.toISOString().split("T")[0].replace(/-/g, "")
      } else if (dateStr) {
        const dateMatch = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
        if (dateMatch) {
          const [, month, day, year] = dateMatch
          const fullYear = `20${year}`
          dateStr = `${fullYear}${month.padStart(2, "0")}${day.padStart(2, "0")}`
        } else {
          dateStr = String(dateStr).replace(/\//g, "").replace(/-/g, "")
        }
      }
      if (dateStr) timecardDates.add(dateStr)
    })
    
    console.log(`[v0] Timecard date range: ${Array.from(timecardDates).sort().join(", ")}`)
    
    // Filter shifts to only those matching timecard dates
    const relevantShifts = this.shiftsFile.filter((shift) => {
      const startDateTime = String(shift["start_date_time"] || "")
      const shiftDateStr = parseDateFromStartTime(startDateTime)
      return shiftDateStr && timecardDates.has(shiftDateStr)
    })
    
    console.log(`[v0] Relevant shifts (matching date range): ${relevantShifts.length} out of ${this.shiftsFile.length}`)
    
    // Check if any relevant shifts have Person ID or Person Name
    const shiftsWithPersonID = relevantShifts.filter(s => String(s["Person ID"] || "").trim())
    const shiftsWithPersonName = relevantShifts.filter(s => String(s["Person Name"] || "").trim())
    console.log(`[v0] Shifts with Person ID: ${shiftsWithPersonID.length}, with Person Name: ${shiftsWithPersonName.length}`)
    
    // Debug: Check if any Person IDs match our timecard Stogo EIDs (check entire file, not just date-filtered)
    const allShiftsWithPersonID = this.shiftsFile.filter(s => String(s["Person ID"] || "").trim())
    const allUniquePersonIDs = [...new Set(allShiftsWithPersonID.map(s => String(s["Person ID"] || "").trim()))]
    console.log(`[v0] Total unique Person IDs in entire shifts file: ${allUniquePersonIDs.length}`)
    
    // Check if any of our Stogo EIDs exist in the shifts file
    const timecardStogoEIDs = [...new Set(records.map(r => r.StogoEID || "").filter(eid => eid))]
    console.log(`[v0] Timecard Stogo EIDs to match: ${timecardStogoEIDs.slice(0, 5).join(", ")}...`)
    
    timecardStogoEIDs.slice(0, 5).forEach(eid => {
      const eidClean = eid.replace(/^NU|^HS/i, "").trim()
      const found = allUniquePersonIDs.some(pid => {
        const pidClean = pid.replace(/^NU|^HS/i, "").trim()
        return pid === eid || pidClean === eidClean
      })
      console.log(`[v0]   Stogo EID ${eid} exists in shifts file: ${found ? "YES" : "NO"}`)
    })

    let matchCount = 0
    const result = records.map((record, index) => {
      // Get timecard date
      let dateStr = record["In-Clocking Date"]
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split("T")[0].replace(/-/g, "")
      } else if (typeof dateStr === "number" && dateStr > 0 && dateStr < 1000000) {
        // Excel serial number - convert to date string
        const excelEpoch = new Date(1899, 11, 30)
        const jsDate = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
        dateStr = jsDate.toISOString().split("T")[0].replace(/-/g, "")
      } else if (dateStr) {
        // Handle M/D/YY format -> YYYYMMDD
        const dateMatch = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
        if (dateMatch) {
          const [, month, day, year] = dateMatch
          const fullYear = `20${year}`
          dateStr = `${fullYear}${month.padStart(2, "0")}${day.padStart(2, "0")}`
        } else {
          dateStr = String(dateStr).replace(/\//g, "").replace(/-/g, "")
        }
      } else {
        dateStr = ""
      }
      
      // Get Stogo EID from record (already looked up from crosswalk)
      const stogoEID = record.StogoEID || ""
      if (!stogoEID) {
        if (index < 3) {
          console.log(`[v0] ⚠️ Record ${index} has no StogoEID, cannot match`)
        }
        return {
          ...record,
          LookupShiftID: "",
        }
      }
      
      // Match: Person ID (from shifts) = Stogo EID (from record) AND date matches
      const shiftMatch = relevantShifts.find(
        (shift) => {
          const startDateTime = String(shift["start_date_time"] || "")
          const personID = String(shift["Person ID"] || "").trim()
          
          if (!startDateTime || !personID) return false
          
          // Parse date from start_date_time
          const shiftDateStr = parseDateFromStartTime(startDateTime)
          if (!shiftDateStr) return false
          
          // Must match date first
          if (shiftDateStr !== dateStr) return false
          
          // Match Person ID against Stogo EID (handle with/without NU/HS prefix)
          // Normalize both by removing whitespace and converting to uppercase for comparison
          const personIDNorm = personID.replace(/^NU|^HS/i, "").trim().toUpperCase()
          const stogoEIDNorm = stogoEID.replace(/^NU|^HS/i, "").trim().toUpperCase()
          
          // Also get the original values normalized
          const personIDOrig = personID.trim().toUpperCase()
          const stogoEIDOrig = stogoEID.trim().toUpperCase()
          
          // Try multiple matching strategies:
          // 1. Exact match (with or without prefix)
          if (personIDOrig === stogoEIDOrig) return true
          
          // 2. Match numeric parts only
          if (personIDNorm === stogoEIDNorm && personIDNorm) return true
          
          // 3. Match with NU prefix variations
          if (personIDNorm && stogoEIDNorm && 
              (`NU${personIDNorm}` === stogoEIDOrig || 
               `NU${stogoEIDNorm}` === personIDOrig)) return true
          
          // 4. Match with HS prefix variations
          if (personIDNorm && stogoEIDNorm && 
              (`HS${personIDNorm}` === stogoEIDOrig || 
               `HS${stogoEIDNorm}` === personIDOrig)) return true
          
          return false
        }
      )
      
      if (shiftMatch) {
        matchCount++
        if (index < 3) {
          const personID = String(shiftMatch["Person ID"] || "")
          const shiftID = String(shiftMatch["Shift ID"] || "")
          console.log(`[v0] ✓ Match found for record ${index}:`)
          console.log(`[v0]   Timecard Stogo EID: ${stogoEID}`)
          console.log(`[v0]   Shift Person ID: ${personID}`)
          console.log(`[v0]   Shift Date: ${parseDateFromStartTime(String(shiftMatch["start_date_time"] || ""))}`)
          console.log(`[v0]   Returned Shift ID: ${shiftID}`)
        }
      } else if (index < 3) {
        // Debug first few non-matches
        const shiftsForDate = relevantShifts.filter(s => {
          const shiftDateStr = parseDateFromStartTime(String(s["start_date_time"] || ""))
          return shiftDateStr === dateStr
        })
        console.log(`[v0] ✗ No match for record ${index}:`)
        console.log(`[v0]   Timecard date: ${record["In-Clocking Date"]}, dateStr: ${dateStr}`)
        console.log(`[v0]   Timecard Stogo EID: ${stogoEID}`)
        console.log(`[v0]   Shifts found for this date: ${shiftsForDate.length}`)
        
        if (shiftsForDate.length > 0) {
          // Check if the Person ID exists in shifts for this date
          const matchingPersonIDs = shiftsForDate.filter(s => {
            const personID = String(s["Person ID"] || "").trim()
            const personIDClean = personID.replace(/^NU|^HS/i, "").trim()
            const stogoEIDClean = stogoEID.replace(/^NU|^HS/i, "").trim()
            return personID === stogoEID || 
                   personIDClean === stogoEIDClean ||
                   personID === `NU${stogoEIDClean}` ||
                   personID === `HS${stogoEIDClean}` ||
                   `NU${personIDClean}` === stogoEID ||
                   `HS${personIDClean}` === stogoEID
          })
          
          console.log(`[v0]   Shifts with matching Person ID: ${matchingPersonIDs.length}`)
          if (matchingPersonIDs.length > 0) {
            console.log(`[v0]   ⚠️ FOUND MATCHING Person IDs but date matching failed!`)
            matchingPersonIDs.forEach((shift, i) => {
              const shiftDateStr = parseDateFromStartTime(String(shift["start_date_time"] || ""))
              console.log(`[v0]     Match ${i}: Person ID="${shift["Person ID"]}", Shift Date="${shiftDateStr}", Shift ID="${shift["Shift ID"]}"`)
            })
          }
          
          // Show all unique Person IDs for this date
          const allPersonIDs = [...new Set(shiftsForDate.map(s => String(s["Person ID"] || "").trim()).filter(id => id))]
          console.log(`[v0]   All Person IDs for this date (${allPersonIDs.length} unique): ${allPersonIDs.slice(0, 10).join(", ")}${allPersonIDs.length > 10 ? "..." : ""}`)
          
          // Check if our Stogo EID is in the list
          const stogoEIDClean = stogoEID.replace(/^NU|^HS/i, "").trim()
          const foundInList = allPersonIDs.some(pid => {
            const pidClean = pid.replace(/^NU|^HS/i, "").trim()
            return pid === stogoEID || pidClean === stogoEIDClean
          })
          console.log(`[v0]   Stogo EID ${stogoEID} found in Person IDs: ${foundInList ? "YES" : "NO"}`)
        }
      }
      
      return {
        ...record,
        LookupShiftID: shiftMatch?.["Shift ID"] || "",
      }
    })
    
    console.log(`[v0] Lookup Shift ID: ${matchCount} matches out of ${records.length} records`)
    return result
  }

  private lookupPersonName(records: any[]): any[] {
    if (this.shiftsFile.length === 0) {
      // If no shifts file, use FirstName/LastName as fallback
      return records.map((record) => ({
        ...record,
        LookupPersonName: `${record.FirstName || ""} ${record.LastName || ""}`.trim(),
      }))
    }

    return records.map((record) => {
      // Lookup: Stogo EID (from timecard) matches Person ID (from shifts file) -> get Person Name
      const stogoEID = record.StogoEID || ""
      const personMatch = this.shiftsFile.find(
        (shift) => {
          const personID = String(shift["Person ID"] || "").trim()
          return personID === stogoEID || personID === `NU${stogoEID}` || personID === `HS${stogoEID}`
        }
      )
      
      return {
        ...record,
        LookupPersonName: personMatch?.["Person Name"] || `${record.FirstName || ""} ${record.LastName || ""}`.trim(),
      }
    })
  }

  private calculateLunchTime(records: any[]): any[] {
    return records.map((record) => {
      const lunchTaken = record["UserShiftAnswer-OutClocking"]?.toLowerCase() === "yes"
      return {
        ...record,
        LunchTime: lunchTaken ? this.config.lunchTimeHours : 0,
      }
    })
  }

  private calculatePayHours(records: any[]): any[] {
    return records.map((record) => {
      const hours = Number.parseFloat(record.Hours) || 0
      const lunchTime = record.LunchTime || 0
      return {
        ...record,
        PayHours: (hours - lunchTime).toFixed(2),
      }
    })
  }

  private createTimecardID(records: any[]): any[] {
    return records.map((record) => {
      // Use In-Clocking GUID if available, otherwise create from date+time+EID
      let timecardID = record["In-Clocking GUID"]

      if (!timecardID || (typeof timecardID === "string" && timecardID.trim() === "")) {
        // Convert date to string if it's a Date object or Excel serial number
        let dateStr = record["In-Clocking Date"]
        if (dateStr instanceof Date) {
          dateStr = dateStr.toISOString().split("T")[0].replace(/-/g, "")
        } else if (typeof dateStr === "number" && dateStr > 0 && dateStr < 1000000) {
          // Excel serial number - convert to date string
          const excelEpoch = new Date(1899, 11, 30)
          const jsDate = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
          dateStr = jsDate.toISOString().split("T")[0].replace(/-/g, "")
        } else if (dateStr) {
          dateStr = String(dateStr).replace(/\//g, "").replace(/-/g, "")
        } else {
          dateStr = ""
        }
        
        // Convert time to string if needed
        let timeStr = record["In-Clocking Time"]
        if (timeStr instanceof Date) {
          timeStr = timeStr.toTimeString().slice(0, 5).replace(/:/g, "")
        } else if (typeof timeStr === "number") {
          // Excel time - convert to HHMM format
          if (timeStr > 1 && timeStr < 1000000) {
            // Excel date serial with time
            const days = Math.floor(timeStr)
            const timeDecimal = timeStr - days
            const totalMinutes = Math.round(timeDecimal * 24 * 60)
            const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
            const minutes = (totalMinutes % 60).toString().padStart(2, "0")
            timeStr = `${hours}${minutes}`
          } else {
            // Excel time decimal
            const totalMinutes = Math.round(timeStr * 24 * 60)
            const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
            const minutes = (totalMinutes % 60).toString().padStart(2, "0")
            timeStr = `${hours}${minutes}`
          }
        } else if (timeStr) {
          timeStr = String(timeStr).replace(/:/g, "").replace(/ /g, "")
        } else {
          timeStr = ""
        }
        
        const eid = record.StogoEID || ""
        timecardID = `${dateStr}${timeStr}${eid}`.replace(/\s/g, "")
      }

      return {
        ...record,
        TimecardID: timecardID,
      }
    })
  }

  private determineDayNightShift(records: any[]): any[] {
    return records.map((record) => {
      const inDate = record["In-Clocking Date"]
      const outDate = record["Out-Clocking Date"]

      // Convert to strings if they're Date objects
      const inDateStr = inDate instanceof Date 
        ? inDate.toISOString().split("T")[0] 
        : String(inDate || "")
      const outDateStr = outDate instanceof Date 
        ? outDate.toISOString().split("T")[0] 
        : String(outDate || "")

      // If out date > in date, it's a night shift
      const isNight = outDateStr && inDateStr && outDateStr !== inDateStr

      return {
        ...record,
        ShiftType: isNight ? "Night" : "Day",
      }
    })
  }

  private assignPayRates(records: any[]): any[] {
    return records.map((record) => {
      // Use config pay rates
      let baseRate = record.ShiftType === "Night" ? this.config.nightPayRate : this.config.dayPayRate
      let hasIncentive = false
      let incentiveAmount = 0

      // Apply incentives if enabled
      if (this.config.incentives.enabled) {
        const inClockingDate = this.parseDate(record["In-Clocking Date"])
        const incentiveEndDate = new Date(this.config.incentives.validThrough)
        
        if (inClockingDate && inClockingDate <= incentiveEndDate) {
          const company = String(record.Company || "").trim()
          const costCenter = String(record["Cost Center"] || "").trim().replace(/^0+/, "")
          const shiftType = record.ShiftType
          const dayOfWeek = inClockingDate.getDay()
          const inTime = this.parseTime(record["In-Clocking Time"])
          const outTime = this.parseTime(record["Out-Clocking Time"])
          
          // Debug logging for incentive matching
          if (company === "100402" || company === "102970" || company === "102462") {
            console.log(`[Incentive Check] Company: ${company}, CostCenter: ${costCenter}, ShiftType: ${shiftType}, Day: ${dayOfWeek}, Time: ${inTime}-${outTime}, Date: ${inClockingDate.toISOString()}`)
          }

          // Check each incentive rule
          for (const incentiveRule of this.config.incentives.rules) {
            if (incentiveRule.company !== company) continue
            if (!incentiveRule.costCenters.includes(costCenter)) continue
            
            // Check shift type
            if (incentiveRule.shiftType && incentiveRule.shiftType !== "Both") {
              if (incentiveRule.shiftType !== shiftType) continue
            }
            
            // Check day of week
            if (incentiveRule.dayOfWeek && !incentiveRule.dayOfWeek.includes(dayOfWeek)) continue
            
            // Check time range
            if (incentiveRule.timeRange) {
              const { start, end } = incentiveRule.timeRange
              if (end > start) {
                // Normal range (e.g., 7-19 for 7a-7p)
                // Shift overlaps if: shift starts before range ends AND shift ends after range starts
                if (inTime > end || outTime < start) continue
              } else {
                // Wraps midnight (e.g., 19-7 for 7p-7a)
                // Shift overlaps if: shift starts before midnight end OR shift ends after midnight start
                if (inTime <= end && outTime >= start) continue
                // Also check if shift is entirely within the night range
                if (inTime >= start || outTime <= end) {
                  // Shift overlaps with night range
                } else {
                  continue
                }
              }
            }
            
            // All conditions met - apply incentive
            incentiveAmount = incentiveRule.amount
            hasIncentive = true
            break
          }
        }
      }

      const finalRate = baseRate + incentiveAmount

      return {
        ...record,
        PayRate: finalRate.toString(),
        hasIncentive,
      }
    })
  }

  // Helper method to parse date
  private parseDate(dateStr: any): Date | null {
    if (!dateStr) return null
    
    if (dateStr instanceof Date) return dateStr
    
    if (typeof dateStr === "number" && dateStr > 0 && dateStr < 1000000) {
      // Excel serial number
      const excelEpoch = new Date(1899, 11, 30)
      return new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
    }

    const str = String(dateStr)
    // Try M/D/YY format
    const mdMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
    if (mdMatch) {
      const [, month, day, year] = mdMatch
      return new Date(2000 + parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
    }

    // Try YYYY-MM-DD format
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      const [, year, month, day] = isoMatch
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
    }

    return null
  }

  // Helper method to parse time to hour (0-23)
  private parseTime(timeStr: any): number {
    if (!timeStr) return 0
    
    if (typeof timeStr === "number") {
      // Excel time decimal (0.5 = noon)
      return Math.floor(timeStr * 24) % 24
    }

    const str = String(timeStr)
    // Try HH:MM format
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      return parseInt(timeMatch[1], 10)
    }

    return 0
  }

  private assignPayCodes(records: any[]): any[] {
    return records.map((record) => {
      const code = record.ShiftType === "Night" ? this.config.nightPayCode : this.config.dayPayCode
      return {
        ...record,
        PayCode: code,
      }
    })
  }

  private assignApprover(records: any[]): any[] {
    return records.map((record) => ({
      ...record,
      Approver: this.config.approverName,
    }))
  }

  private formatTimes(records: any[]): any[] {
    return records.map((record) => {
      const formatTime = (time: any) => {
        if (!time) return ""
        
        // Convert to string if it's a Date object or number
        let timeStr: string
        if (time instanceof Date) {
          // Format Date object to HH:MM
          const hours = time.getHours().toString().padStart(2, "0")
          const minutes = time.getMinutes().toString().padStart(2, "0")
          return `${hours}:${minutes}`
        } else if (typeof time === "number") {
          // Excel time is often a decimal (0.5 = noon, 0.25 = 6am)
          // Convert to HH:MM format
          const totalMinutes = Math.round(time * 24 * 60)
          const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
          const minutes = (totalMinutes % 60).toString().padStart(2, "0")
          return `${hours}:${minutes}`
        } else {
          timeStr = String(time)
        }
        
        // Remove seconds and ensure HH:MM format
        const parts = timeStr.split(":")
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, "0")
          const minutes = parts[1].padStart(2, "0")
          return `${hours}:${minutes}`
        }
        return timeStr
      }

      return {
        ...record,
        "In-Clocking Time": formatTime(record["In-Clocking Time"]),
        "Out-Clocking Time": formatTime(record["Out-Clocking Time"]),
      }
    })
  }

  private createShiftID(records: any[]): any[] {
    return records.map((record) => {
      // Convert date to string if it's a Date object or Excel serial number
      let dateStr = record["In-Clocking Date"]
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split("T")[0].replace(/-/g, "")
      } else if (typeof dateStr === "number" && dateStr > 0 && dateStr < 1000000) {
        // Excel serial number - convert to date string
        const excelEpoch = new Date(1899, 11, 30)
        const jsDate = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
        dateStr = jsDate.toISOString().split("T")[0].replace(/-/g, "")
      } else if (dateStr) {
        dateStr = String(dateStr).replace(/\//g, "").replace(/-/g, "")
      } else {
        dateStr = ""
      }
      
      const eid = record.StogoEID || ""
      const shiftID = `${dateStr}${eid}`.replace(/\s/g, "")

      return {
        ...record,
        ShiftID: shiftID,
        LookupShiftID: shiftID,
      }
    })
  }

  private mapToOutputFormat(records: any[]): PayrollOutput[] {
    return records.map((record) => {
      // Remove NU/HS prefix from Stogo EID
      let stogoEID = record.StogoEID || ""
      stogoEID = stogoEID.replace(/^NU|^HS/i, "").trim()
      
      // Format date as M/D/YY (not MM/DD/YYYY)
      const formatDate = (date: any): string => {
        if (!date) return ""
        
        // Handle Excel serial number (days since 1900-01-01)
        if (typeof date === "number" && date > 0 && date < 1000000) {
          // Excel epoch starts Jan 1, 1900
          const excelEpoch = new Date(1899, 11, 30) // Dec 30, 1899 (Excel's epoch)
          const jsDate = new Date(excelEpoch.getTime() + date * 24 * 60 * 60 * 1000)
          const month = (jsDate.getMonth() + 1).toString()
          const day = jsDate.getDate().toString()
          const year = jsDate.getFullYear().toString().slice(-2)
          return `${month}/${day}/${year}`
        }
        
        if (date instanceof Date) {
          const month = (date.getMonth() + 1).toString() // No padding
          const day = date.getDate().toString() // No padding
          const year = date.getFullYear().toString().slice(-2) // Last 2 digits
          return `${month}/${day}/${year}`
        }
        // If it's already a string, try to convert
        const dateStr = String(date)
        // Handle ISO format (2025-11-03) -> M/D/YY
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [year, month, day] = dateStr.split("-")
          const yearShort = year.slice(-2)
          // Remove leading zeros
          const monthNum = parseInt(month, 10)
          const dayNum = parseInt(day, 10)
          return `${monthNum}/${dayNum}/${yearShort}`
        }
        // Handle MM/DD/YYYY -> M/D/YY
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const [month, day, year] = dateStr.split("/")
          const yearShort = year.slice(-2)
          const monthNum = parseInt(month, 10)
          const dayNum = parseInt(day, 10)
          return `${monthNum}/${dayNum}/${yearShort}`
        }
        // If already M/D/YY, return as is
        return dateStr
      }
      
      // Format time as HH:MM (with colon and minutes)
      const formatTime = (time: any): string => {
        if (!time) return ""
        
        // If it's a Date object
        if (time instanceof Date) {
          const hours = time.getHours().toString().padStart(2, "0")
          const minutes = time.getMinutes().toString().padStart(2, "0")
          return `${hours}:${minutes}`
        }
        
        // If it's a number (Excel time decimal or serial number)
        if (typeof time === "number") {
          // If it's a large number, it might be an Excel date serial number
          if (time > 1 && time < 1000000) {
            // This is likely an Excel date serial number, extract time portion
            const days = Math.floor(time)
            const timeDecimal = time - days
            const totalMinutes = Math.round(timeDecimal * 24 * 60)
            const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
            const minutes = (totalMinutes % 60).toString().padStart(2, "0")
            return `${hours}:${minutes}`
          } else {
            // Regular Excel time decimal (0.5 = noon, 0.25 = 6am)
            const totalMinutes = Math.round(time * 24 * 60)
            const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
            const minutes = (totalMinutes % 60).toString().padStart(2, "0")
            return `${hours}:${minutes}`
          }
        }
        
        let timeStr = String(time)
        
        // If it already has a colon, ensure HH:MM format
        if (timeStr.includes(":")) {
          const parts = timeStr.split(":")
          const hours = parts[0].padStart(2, "0")
          const minutes = parts[1] ? parts[1].padStart(2, "0") : "00"
          return `${hours}:${minutes}`
        }
        
        // If it's just a number (hour), add :00
        const hour = parseInt(timeStr, 10)
        if (!isNaN(hour)) {
          return `${hour.toString().padStart(2, "0")}:00`
        }
        
        return timeStr
      }
      
      // Remove leading zeros from Cost Center
      const costCenter = record["Cost Center"]
      const costCenterStr = costCenter != null ? String(costCenter) : ""
      const costCenterFormatted = costCenterStr.replace(/^0+/, "") || costCenterStr
      
      // Get Timecard ID from In-Clocking GUID if available
      const timecardID = record["In-Clocking GUID"] || record.TimecardID || ""
      
      // Format Meta Info as M/D/YY (generation date)
      const today = new Date()
      const metaInfoMonth = (today.getMonth() + 1).toString()
      const metaInfoDay = today.getDate().toString()
      const metaInfoYear = today.getFullYear().toString().slice(-2)
      const metaInfo = `${metaInfoMonth}/${metaInfoDay}/${metaInfoYear}`
      
      // Get Lookup Shift ID from shifts file lookup
      const lookupShiftID = record.LookupShiftID || ""
      
      // Get Lookup Person Name from shifts file lookup (or fallback to FirstName/LastName)
      const lookupPersonName = record.LookupPersonName || `${record.FirstName || ""} ${record.LastName || ""}`.trim()
      
      // Remove HS prefix from TNAA if present
      let lookupTNAA = record.LookupTNAA || record.Company || ""
      lookupTNAA = String(lookupTNAA).replace(/^HS/i, "").trim()
      
      // Pay Rate should be just the number, no "$/hr" suffix
      const payRate = String(record.PayRate || "").replace(/\$/g, "").replace(/\/hr/gi, "").trim()
      
      // Check if shift is outside pay period
      let adjustedPayRateDateStart = ""
      let adjustedPayRateDateEnd = ""
      let isOutsidePayPeriod = false
      
      if (this.payPeriodStart && this.payPeriodEnd) {
        const inClockingDate = this.parseDate(record["In-Clocking Date"])
        
        if (inClockingDate) {
          // Helper function to get Sunday of the week for a given date
          const getSundayOfWeek = (date: Date): Date => {
            const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
            const diff = date.getDate() - day // Subtract days to get to Sunday
            const sunday = new Date(date)
            sunday.setDate(diff)
            sunday.setHours(0, 0, 0, 0) // Reset time to midnight
            return sunday
          }
          
          // Helper function to get Saturday of the week for a given date
          const getSaturdayOfWeek = (date: Date): Date => {
            const sunday = getSundayOfWeek(date)
            const saturday = new Date(sunday)
            saturday.setDate(sunday.getDate() + 6) // Add 6 days to get Saturday
            saturday.setHours(23, 59, 59, 999) // Set to end of day
            return saturday
          }
          
          // Calculate the pay period (Sunday-Saturday) for this shift's In-Clocking Date
          const shiftPayPeriodStart = getSundayOfWeek(inClockingDate)
          const shiftPayPeriodEnd = getSaturdayOfWeek(inClockingDate)
          
          // Normalize dates for comparison (set time to midnight)
          const selectedStart = new Date(this.payPeriodStart)
          selectedStart.setHours(0, 0, 0, 0)
          const selectedEnd = new Date(this.payPeriodEnd)
          selectedEnd.setHours(23, 59, 59, 999)
          
          const shiftStart = new Date(shiftPayPeriodStart)
          shiftStart.setHours(0, 0, 0, 0)
          const shiftEnd = new Date(shiftPayPeriodEnd)
          shiftEnd.setHours(23, 59, 59, 999)
          
          // Check if the shift's pay period is different from the selected pay period
          const isDifferent = 
            shiftStart.getTime() !== selectedStart.getTime() || 
            shiftEnd.getTime() !== selectedEnd.getTime()
          
          if (isDifferent) {
            isOutsidePayPeriod = true
            // Format date as MM/DD/YY
            const formatDateForOutput = (date: Date): string => {
              const month = (date.getMonth() + 1).toString().padStart(2, "0")
              const day = date.getDate().toString().padStart(2, "0")
              const year = date.getFullYear().toString().slice(-2)
              return `${month}/${day}/${year}`
            }
            // Use the shift's calculated pay period dates
            adjustedPayRateDateStart = formatDateForOutput(shiftPayPeriodStart)
            adjustedPayRateDateEnd = formatDateForOutput(shiftPayPeriodEnd)
          }
        }
      }
      
      return {
        "Stogo EID": stogoEID,
        "Pay Code": record.PayCode || "",
        "Pay Hours": record.PayHours || "",
        "Pay Rate": payRate,
        Blank: " ",
        "Lookup TNAA": lookupTNAA,
        "Adjusted Pay Rate Date Start": adjustedPayRateDateStart,
        "Adjusted Pay Rate Date End": adjustedPayRateDateEnd,
        "Timecard ID": timecardID,
        "Meta Info": metaInfo,
        "Lookup Shift ID": lookupShiftID,
        "Lookup Person Name": lookupPersonName,
        "In-Clocking Date": formatDate(record["In-Clocking Date"]),
        "In-Clocking Time": formatTime(record["In-Clocking Time"]),
        "Out-Clocking Date": formatDate(record["Out-Clocking Date"]),
        "Out-Clocking Time": formatTime(record["Out-Clocking Time"]),
        Approver: record.Approver || "",
        Company: record.Company || "",
        "Company Description": record["Company Description"] || "",
        "Cost Center": costCenterFormatted,
        "Cost Center Description": record["Cost Center Description"] || "",
        hasIncentive: record.hasIncentive || false,
        isOutsidePayPeriod: isOutsidePayPeriod, // Add flag for UI highlighting
      }
    })
  }
}

// Helper function to parse CSV
export function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split("\n")
  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const records: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const record: any = {}
    headers.forEach((header, index) => {
      record[header] = values[index] || ""
    })
    records.push(record)
  }

  return records
}
