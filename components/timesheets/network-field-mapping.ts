export interface NetworkFieldMapping {
  networkId: string
  networkName: string
  fileName: string
  fieldMappings: Record<string, string>
  additionalFields: string[]
}

export const networkFieldMappings: NetworkFieldMapping[] = [
  {
    networkId: "16",
    networkName: "Willis Knighton",
    fileName: "Willis Knight Time Input File.csv",
    fieldMappings: {
      externalEmployeeId: "EMPID",
      employeeName: "FIRSTNAME,LASTNAME",
      clockInDateTime: "CLOCK-IN",
      clockOutDateTime: "CLOCK-OUT",
      facilityName: "UNITCODE",
      hours: "HOURS",
      payCode: "PAYCODE",
      shiftDate: "DATEOFSHIFT",
    },
    additionalFields: ["PAYCODE", "HOURS", "UNITCODE", "DATEOFSHIFT"],
  },
  {
    networkId: "19",
    networkName: "UofL",
    fileName: "UofL input time file.csv",
    fieldMappings: {
      externalEmployeeId: "Employee ID",
      employeeName: "First Name,Last Name",
      clockInDate: "In-Clocking Date",
      clockInTime: "In-Clocking Time",
      clockOutDate: "Out-Clocking Date",
      clockOutTime: "Out-Clocking Time",
      facilityName: "Facility Name",
      costCenterNumber: "Cost Center ID",
      costCenterDescription: "Cost Center Name",
      hours: "Hours",
    },
    additionalFields: ["Time Card ID", "Lunch Y/N", "Facility ID"],
  },
  {
    networkId: "30",
    networkName: "Shannon Health",
    fileName: "Shannon Input Time File.csv",
    fieldMappings: {
      employeeName: "Employee Name",
      clockInDateTime: "Transaction Start Date/Time",
      clockOutDateTime: "Transaction End Date/Time",
      facilityName: "Location",
      hours: "Hours",
    },
    additionalFields: [
      "Job",
      "Transaction Apply Date",
      "Transaction Type",
      "Transaction In Exceptions",
      "Transaction Out Exceptions",
      "Money",
      "Days",
      "Employee Payrule",
    ],
  },
  {
    networkId: "18",
    networkName: "Baptist Arkansas",
    fileName: "Baptist Arkansas Input Time File.csv",
    fieldMappings: {
      externalEmployeeId: "Employee",
      employeeName: "First Name,Last Name",
      clockInDate: "Punch In Date",
      clockInTime: "Punch In Time",
      clockOutDate: "Punch Out Date",
      clockOutTime: "Punch Out Time",
      costCenterNumber: "Department Name",
      costCenterDescription: "Department Description",
      hours: "Hours Worked",
    },
    additionalFields: ["Timecard Date", "Pay Code Name"],
  },
  {
    networkId: "29",
    networkName: "Arkansas Childrens",
    fileName: "AR Childrens Input Time File.csv",
    fieldMappings: {
      externalEmployeeId: "EMPLOYEE_ID",
      employeeName: "FIRST_NAME,LAST_NAME",
      clockInDate: "CLOCK_IN_DATE",
      clockInTime: "CLOCK_IN_TIME",
      clockOutDate: "CLOCK_OUT_DATE",
      clockOutTime: "CLOCK_OUT_TIME",
      facilityName: "FACILITY_NAME",
      costCenterNumber: "COST_CENTER_ID",
      costCenterDescription: "COST_CENTER_NAME",
      hours: "HOURS",
    },
    additionalFields: ["GUID", "WHEN_POSTED", "Lunch_Y_N", "FACILITY_ID", "PAYCODE"],
  },
  {
    networkId: "13",
    networkName: "Lehigh Valley",
    fileName: "LVHN Time Input File.xlsx",
    fieldMappings: {
      network: "13 - Lehigh Valley",
      facilityName: "Company - Company Description",
      departmentName: "Cost Center - Cost Center Description",
      externalEmployeeId: "EmployeeID",
      employeeName: "FirstName,LastName",
      clockInDate: "In-Clocking Date",
      clockInTime: "In-Clocking Time",
      clockOutDate: "Out-Clocking Date",
      clockOutTime: "Out-Clocking Time",
      suggestedShift: "Assigned Shift",
      matchStatus: "Match Status",
      incentive: "Incentive",
      approvalDate: "Last Time Approved",
      approvalDecision: "Yes",
      approvedBy: "Approver",
      inClockingGuid: "In-Clocking GUID",
      hours: "Hours",
      payCode: "Paycode",
      lunch: "UserShiftAnswer-OutClocking",
    },
    additionalFields: [],
  },
]

export function getNetworkMapping(networkId: string): NetworkFieldMapping | undefined {
  return networkFieldMappings.find((mapping) => mapping.networkId === networkId)
}

export function getAllNetworks(): { id: string; name: string }[] {
  return networkFieldMappings.map((mapping) => ({
    id: mapping.networkId,
    name: `${mapping.networkId} - ${mapping.networkName}`,
  }))
}
