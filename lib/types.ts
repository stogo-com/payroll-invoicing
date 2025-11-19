export interface Network {
  id: string
  name: string
  activeFlag: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NetworkMapping {
  networkId: string
  mapping: any
  activeFlag: boolean
  updatedAt: Date
}

export interface EmployeeCrosswalk {
  networkId: string
  networkEmployeeId: string
  internalEmployeeId: string
  activeFlag: boolean
  notes?: string
}

export interface TimeEntryRecord {
  timesheetId: string
  networkId: string
  businessKey: string
  recordVersion: number
  isCurrent: boolean
  status: "normalized" | "matched" | "needs_review" | "posted" | "error"
  validationFlags: string[]
  employeeNetworkId?: string
  employeeInternalId?: string
  employeeName?: string
  shiftDate?: Date
  timezone?: string
  clockInAt?: Date
  clockOutAt?: Date
  breakMinutes?: number
  recordedHours?: number
  computedHours?: number
  payCode?: string
  unitOrDepartment?: string
  costCenter?: string
  matchedShiftId?: number
  timesheetDepartment?: string
  shiftDepartment?: string
  incentiveFlag: boolean
  incentiveNote?: string
  rawId: string
  createdAt: Date
  updatedAt: Date
}

export const NETWORKS = [
  { id: "13", name: "Lehigh Valley" },
  { id: "16", name: "Willis Knighton" },
  { id: "18", name: "Baptist Arkansas" },
  { id: "19", name: "UofL" },
  { id: "21", name: "Parrish Medical Center" },
  { id: "29", name: "Arkansas Childrens" },
] as const
