// LVHN Payroll Transformation Logic
// Based on LVHN EDT.xml transformation pipeline

interface TimesheetRow {
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
  "Last Time Approved": string
}

interface CrosswalkRow {
  EEID: string
  "Employee Number": string
}

interface PayrollOutput {
  "Stogo EID": string
  "Pay Code": string
  "Pay Hours": string
  "Pay Rate": string
  Blank: string
  "Lookup TNAA": string
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
}

export class LVHNPayrollTransformer {
  // Step 1: Stack WD Contingent Worker and Manual Adds files
  stackTimesheets(wdData: TimesheetRow[], manualData: TimesheetRow[]): TimesheetRow[] {
    return [...wdData, ...manualData]
  }

  // Step 2: Lookup Stogo EID from crosswalk
  lookupStogoEID(timesheets: TimesheetRow[], crosswalk: CrosswalkRow[]): any[] {
    return timesheets.map((ts) => {
      const match = crosswalk.find((cw) => cw.EEID === ts.EmployeeID)
      return {
        ...ts,
        "Stogo EID": match?.["Employee Number"] || "",
      }
    })
  }

  // Step 3: Filter out rows without Stogo EID
  filterByStogoEID(data: any[]): any[] {
    return data.filter((row) => row["Stogo EID"] && row["Stogo EID"].trim() !== "")
  }

  // Step 4: Filter out rows without In-Clocking GUID
  filterByGUID(data: any[]): any[] {
    return data.filter((row) => row["In-Clocking GUID"] && row["In-Clocking GUID"].trim() !== "")
  }

  // Step 5: Calculate lunch time (0.5 if took lunch, 0 otherwise)
  calculateLunchTime(data: any[]): any[] {
    return data.map((row) => ({
      ...row,
      "Lunch Time": row["UserShiftAnswer-OutClocking"]?.toLowerCase() === "yes" ? 0.5 : 0,
    }))
  }

  // Step 6: Calculate Pay Hours (Hours - Lunch Time)
  calculatePayHours(data: any[]): any[] {
    return data.map((row) => {
      const hours = Number.parseFloat(row.Hours) || 0
      const lunchTime = row["Lunch Time"] || 0
      return {
        ...row,
        "Pay Hours": (hours - lunchTime).toFixed(2),
      }
    })
  }

  // Step 7: Determine Day/Night shift and assign pay rate
  assignPayRate(data: any[]): any[] {
    return data.map((row) => {
      const inDate = new Date(row["In-Clocking Date"])
      const outDate = new Date(row["Out-Clocking Date"])
      const isNight = outDate > inDate

      return {
        ...row,
        "Pay Rate": isNight ? "65" : "60",
        "Pay Code": isNight ? "FXNT" : "FXDY",
      }
    })
  }

  // Step 8: Create Timecard ID from GUID
  createTimecardID(data: any[]): any[] {
    return data.map((row) => ({
      ...row,
      "Timecard ID": row["In-Clocking GUID"],
    }))
  }

  // Step 9: Format times (remove extra characters)
  formatTimes(data: any[]): any[] {
    return data.map((row) => {
      const formatTime = (time: string) => {
        if (!time) return ""
        // Convert various time formats to HH:MM
        const timeStr = time.toString()
        if (timeStr.includes(":")) {
          const parts = timeStr.split(":")
          return `${parts[0].padStart(2, "0")}:${parts[1].slice(0, 2)}`
        }
        return timeStr
      }

      return {
        ...row,
        "In-Clocking Time": formatTime(row["In-Clocking Time"]),
        "Out-Clocking Time": formatTime(row["Out-Clocking Time"]),
      }
    })
  }

  // Step 10: Add approver (Jennifer Devine for LVHN)
  addApprover(data: any[]): any[] {
    return data.map((row) => ({
      ...row,
      Approver: "Jennifer Devine",
    }))
  }

  // Step 11: Remove unnecessary columns and format output
  formatOutput(data: any[]): PayrollOutput[] {
    return data.map((row) => ({
      "Stogo EID": (row["Stogo EID"] || "").replace(/NU|HS/g, ""),
      "Pay Code": row["Pay Code"] || "",
      "Pay Hours": row["Pay Hours"] || "",
      "Pay Rate": row["Pay Rate"] || "",
      Blank: " ",
      "Lookup TNAA": row.Company || "",
      "Timecard ID": row["Timecard ID"] || "",
      "Meta Info": new Date().toLocaleDateString(),
      "Lookup Shift ID": "",
      "Lookup Person Name": `${row.FirstName || ""} ${row.LastName || ""}`.trim(),
      "In-Clocking Date": row["In-Clocking Date"] || "",
      "In-Clocking Time": row["In-Clocking Time"] || "",
      "Out-Clocking Date": row["Out-Clocking Date"] || "",
      "Out-Clocking Time": row["Out-Clocking Time"] || "",
      Approver: row.Approver || "",
      Company: row.Company || "",
      "Company Description": row["Company Description"] || "",
      "Cost Center": row["Cost Center"] || "",
      "Cost Center Description": row["Cost Center Description"] || "",
    }))
  }

  // Main transformation pipeline
  async transform(
    wdData: TimesheetRow[],
    manualData: TimesheetRow[],
    crosswalkData: CrosswalkRow[],
  ): Promise<PayrollOutput[]> {
    console.log("[v0] Starting LVHN payroll transformation...")

    let data = this.stackTimesheets(wdData, manualData)
    console.log("[v0] Stacked timesheets:", data.length)

    data = this.lookupStogoEID(data, crosswalkData)
    console.log("[v0] Looked up Stogo EIDs")

    data = this.filterByStogoEID(data)
    console.log("[v0] Filtered by Stogo EID:", data.length)

    data = this.filterByGUID(data)
    console.log("[v0] Filtered by GUID:", data.length)

    data = this.calculateLunchTime(data)
    data = this.calculatePayHours(data)
    data = this.assignPayRate(data)
    data = this.createTimecardID(data)
    data = this.formatTimes(data)
    data = this.addApprover(data)

    const output = this.formatOutput(data)
    console.log("[v0] Transformation complete:", output.length, "records")

    return output
  }
}
