export interface FieldConfig {
  key: string
  label: string
  type: "text" | "number" | "date" | "time" | "datetime-local" | "select" | "checkbox"
  required: boolean
  visible: boolean
  options?: string[]
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ClientConfig {
  clientId: string
  clientName: string
  fields: FieldConfig[]
}

// Default field configurations for different clients
export const CLIENT_CONFIGS: ClientConfig[] = [
  {
    clientId: "default",
    clientName: "Default Configuration",
    fields: [
      { key: "networkId", label: "Network ID", type: "text", required: true, visible: true },
      { key: "externalEmployeeId", label: "External Employee ID", type: "text", required: true, visible: true },
      { key: "employeeName", label: "Employee Name", type: "text", required: true, visible: true },
      { key: "clockInDate", label: "Clock In Date", type: "date", required: true, visible: true },
      { key: "clockInTime", label: "Clock In Time", type: "time", required: true, visible: true },
      { key: "clockOutDate", label: "Clock Out Date", type: "date", required: true, visible: true },
      { key: "clockOutTime", label: "Clock Out Time", type: "time", required: true, visible: true },
      { key: "facilityName", label: "Facility Name", type: "text", required: true, visible: true },
      { key: "costCenterNumber", label: "Cost Center Number", type: "text", required: true, visible: true },
      { key: "costCenterDescription", label: "Department Name", type: "text", required: true, visible: true },
      { key: "incentiveFlag", label: "Incentive", type: "checkbox", required: false, visible: true },
      { key: "approvalDate", label: "Approval Date", type: "datetime-local", required: false, visible: true },
      {
        key: "approvalDecision",
        label: "Approval Decision",
        type: "select",
        required: false,
        visible: true,
        options: ["Yes", "No"],
      },
      { key: "approvedBy", label: "Approved By", type: "text", required: false, visible: true },
    ],
  },
  {
    clientId: "lehigh-valley",
    clientName: "Lehigh Valley Health Network",
    fields: [
      { key: "networkId", label: "Network ID", type: "text", required: true, visible: true },
      { key: "externalEmployeeId", label: "Employee Badge ID", type: "text", required: true, visible: true },
      { key: "employeeName", label: "Full Name", type: "text", required: true, visible: true },
      { key: "clockInDate", label: "Shift Date", type: "date", required: true, visible: true },
      { key: "clockInTime", label: "Start Time", type: "time", required: true, visible: true },
      { key: "clockOutDate", label: "End Date", type: "date", required: true, visible: true },
      { key: "clockOutTime", label: "End Time", type: "time", required: true, visible: true },
      { key: "facilityName", label: "Hospital Location", type: "text", required: true, visible: true },
      { key: "costCenterNumber", label: "Unit Code", type: "text", required: true, visible: true },
      { key: "costCenterDescription", label: "Unit Description", type: "text", required: true, visible: true },
      { key: "breakTime", label: "Break Duration (minutes)", type: "number", required: false, visible: true },
      { key: "incentiveFlag", label: "Premium Pay", type: "checkbox", required: false, visible: true },
      { key: "approvalDate", label: "Approval Date", type: "datetime-local", required: false, visible: true },
      {
        key: "approvalDecision",
        label: "Approval Status",
        type: "select",
        required: false,
        visible: true,
        options: ["Yes", "No"],
      },
      { key: "approvedBy", label: "Approved By", type: "text", required: false, visible: true },
    ],
  },
  {
    clientId: "willis-knighton",
    clientName: "Willis Knighton Health System",
    fields: [
      { key: "networkId", label: "Network ID", type: "text", required: true, visible: true },
      { key: "externalEmployeeId", label: "WK Employee ID", type: "text", required: true, visible: true },
      { key: "employeeName", label: "Employee Name", type: "text", required: true, visible: true },
      { key: "clockInDate", label: "Work Date", type: "date", required: true, visible: true },
      { key: "clockInTime", label: "Clock In", type: "time", required: true, visible: true },
      { key: "clockOutDate", label: "Clock Out Date", type: "date", required: true, visible: true },
      { key: "clockOutTime", label: "Clock Out", type: "time", required: true, visible: true },
      { key: "facilityName", label: "WK Facility", type: "text", required: true, visible: true },
      { key: "costCenterNumber", label: "Department Code", type: "text", required: true, visible: true },
      { key: "costCenterDescription", label: "Department", type: "text", required: true, visible: true },
      {
        key: "shiftType",
        label: "Shift Type",
        type: "select",
        required: false,
        visible: true,
        options: ["Day", "Evening", "Night", "Weekend"],
      },
      { key: "incentiveFlag", label: "Shift Differential", type: "checkbox", required: false, visible: true },
      { key: "approvalDate", label: "Approval Date", type: "datetime-local", required: false, visible: true },
      {
        key: "approvalDecision",
        label: "Approval Decision",
        type: "select",
        required: false,
        visible: true,
        options: ["Yes", "No"],
      },
      { key: "approvedBy", label: "Supervisor", type: "text", required: false, visible: true },
    ],
  },
]

export const getClientConfig = (clientId: string): ClientConfig => {
  return CLIENT_CONFIGS.find((config) => config.clientId === clientId) || CLIENT_CONFIGS[0]
}

export const getAvailableClients = (): { id: string; name: string }[] => {
  return CLIENT_CONFIGS.map((config) => ({ id: config.clientId, name: config.clientName }))
}
