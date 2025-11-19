"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getNetworkMapping } from "./network-field-mapping"

interface TimesheetRecord {
  timesheetId: string
  networkId: string
  externalEmployeeId: string
  employeeName: string
  clockInDate: string
  clockInTime: string
  clockOutDate: string
  clockOutTime: string
  facilityName: string
  costCenterNumber: string
  costCenterDescription: string
  status: "matched" | "needs_review"
  suggestedShift?: {
    id: string
    name: string
  }
  incentiveFlag: boolean
  incentiveNote?: string
  incentiveAmount?: string
  approvalDate: string
  approvalDecision: "Yes" | "No"
  approvedBy?: string
  errorMessage?: string
  dynamicFields?: Record<string, any>
}

const mockTimesheets: TimesheetRecord[] = [
  {
    timesheetId: "timesheet-sample-1",
    networkId: "19",
    externalEmployeeId: "TEMPUOL4",
    employeeName: "Nakayla Little",
    clockInDate: "2025-09-05",
    clockInTime: "07:00:00",
    clockOutDate: "2025-09-05",
    clockOutTime: "16:15:00",
    facilityName: "Peace Hospital",
    costCenterNumber: "6503208",
    costCenterDescription: "NURSING FLOAT POOL (ORIENTATION)",
    status: "matched",
    suggestedShift: {
      id: "14372456",
      name: "14372456 Nakayla Little 175766459(204275) at 2025-09-05 07:00:00-06:00 in 6503208 NURSING FLOAT POOL at Peace Hospital",
    },
    incentiveFlag: true,
    incentiveNote: "Day shift differential applied",
    incentiveAmount: "$3.00/hour",
    approvalDate: new Date().toLocaleString(),
    approvalDecision: "Yes",
    dynamicFields: {
      "Time Card ID": "",
      "Lunch Y/N": "Y",
      "Facility ID": "650",
      Hours: "8.75",
    },
  },
  {
    timesheetId: "timesheet-sample-2",
    networkId: "16",
    externalEmployeeId: "72195",
    employeeName: "Mary Burks",
    clockInDate: "2025-09-01",
    clockInTime: "18:42:00",
    clockOutDate: "2025-09-02",
    clockOutTime: "07:06:00",
    facilityName: "7.6019",
    costCenterNumber: "7.6019",
    costCenterDescription: "Unit 7.6019",
    status: "matched",
    incentiveFlag: true,
    incentiveNote: "Night differential + weekend premium",
    incentiveAmount: "$5.00/hour + $50.00/shift",
    approvalDate: new Date().toLocaleString(),
    approvalDecision: "Yes",
    dynamicFields: {
      PAYCODE: "REG",
      HOURS: "11.75",
      UNITCODE: "7.6019",
      DATEOFSHIFT: "9/1/2025",
    },
  },
  {
    timesheetId: "timesheet-sample-3",
    networkId: "13",
    externalEmployeeId: "CW100112",
    employeeName: "Oluranti Alana",
    clockInDate: "2025-07-27",
    clockInTime: "18:59:00",
    clockOutDate: "2025-07-28",
    clockOutTime: "07:36:00",
    facilityName: "LEHIGH VALLEY HOSPITAL - Lehigh Valley Health Network",
    costCenterNumber: "9440",
    costCenterDescription: "5C MED SURGE - CC",
    status: "needs_review",
    incentiveFlag: false,
    approvalDate: "2025-08-04 07:33:58",
    approvalDecision: "Yes",
    approvedBy: "Sarah Johnson",
    errorMessage: "Could not find a matching assigned shift for this employee and shift date",
    dynamicFields: {
      Network: "13 - Lehigh Valley",
      "Facility Name": "LEHIGH VALLEY HOSPITAL - Lehigh Valley Health Network",
      "Department Name": "9440 - 5C MED SURGE - CC",
      "External Employee ID": "CW100112",
      "Employee Name": "Oluranti Alana",
      "Clock In Date": "2025-07-27",
      "Clock In Time": "18:59:00",
      "Clock Out Date": "2025-07-28",
      "Clock Out Time": "07:36:00",
      "Suggested Shift": "Night Shift 7p-7a",
      "Match Status": "Needs Review",
      Incentive: "No incentive available",
      "Approval Date": "2025-08-04 07:33:58",
      "Approval Decision": "Yes",
      "Approved By": "Sarah Johnson",
      "In-Clocking GUID": "5D505809-3E75-488C-BB67-E8E3C028A255",
      Hours: "12.62",
      "Pay Code": "REG CW",
      Lunch: "No",
    },
  },
]

interface TimesheetTableProps {
  onRowAction?: (action: string, record: TimesheetRecord) => void
  onBulkAction?: (action: string, selectedIds: string[]) => void
  selectedNetwork?: string
  importedData?: TimesheetRecord[]
}

export function TimesheetTable({ onRowAction, onBulkAction, selectedNetwork, importedData = [] }: TimesheetTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [editingShift, setEditingShift] = useState<string | null>(null)
  const [shiftSearchTerm, setShiftSearchTerm] = useState("")
  const [editingApproval, setEditingApproval] = useState<string | null>(null)
  const [approvedBySearch, setApprovedBySearch] = useState("")
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [editingFields, setEditingFields] = useState<Record<string, Record<string, any>>>({})

  const networkMapping = selectedNetwork ? getNetworkMapping(selectedNetwork) : null

  const allTimesheets = [...mockTimesheets, ...importedData]

  const filteredTimesheets = selectedNetwork
    ? allTimesheets.filter((timesheet) => timesheet.networkId === selectedNetwork)
    : []

  if (!selectedNetwork) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Please select a network to view timesheets.</p>
      </div>
    )
  }

  const getColumnsForNetwork = () => {
    if (!networkMapping) return []

    if (selectedNetwork === "13") {
      return [
        "Network",
        "Facility Name",
        "Department Name",
        "External Employee ID",
        "Employee Name",
        "Clock In Date",
        "Clock In Time",
        "Clock Out Date",
        "Clock Out Time",
        "Suggested Shift",
        "Match Status",
        "Incentive",
        "Approval Date",
        "Approval Decision",
        "Approved By",
        "In-Clocking GUID",
        "Hours",
        "Pay Code",
        "Lunch",
      ]
    }

    // For other networks, show standard columns + additional fields
    return [
      "Network",
      "External Employee ID",
      "Employee Name",
      "Clock In Date",
      "Clock In Time",
      "Clock Out Date",
      "Clock Out Time",
      "Facility Name",
      "Department Name",
      "Suggested Shift",
      "Status",
      "Incentive",
      "Approval Date",
      "Approval Decision",
      "Approved By",
      ...networkMapping.additionalFields,
    ]
  }

  const columns = getColumnsForNetwork()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredTimesheets.map((t) => t.timesheetId))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (timesheetId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, timesheetId])
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== timesheetId))
    }
  }

  const handleBulkCreate = () => {
    const matchedIds = selectedRows.filter((id) => {
      const record = filteredTimesheets.find((t) => t.timesheetId === id)
      return record?.status === "matched"
    })
    onBulkAction?.("bulk-create", matchedIds)
  }

  const handleSendTimesheets = () => {
    const approvedTimesheets = selectedRows.filter((id) => {
      const record = filteredTimesheets.find((t) => t.timesheetId === id)
      return record?.approvalDecision === "Yes"
    })

    console.log("[v0] Sending timesheets:", approvedTimesheets)
    setShowSendDialog(false)
    // TODO: Implement API call to scheduling application
  }

  const handleShiftSearch = (value: string) => {
    setShiftSearchTerm(value)
    console.log("[v0] Searching for shifts:", value)
  }

  const handleApprovedBySearch = (value: string) => {
    setApprovedBySearch(value)
    console.log("[v0] Searching for approved by:", value)
  }

  const getNetworkName = (networkId: string): string => {
    const networks: Record<string, string> = {
      "13": "Lehigh Valley",
      "16": "Willis Knighton",
      "18": "Baptist Arkansas",
      "19": "UofL",
      "21": "Parrish Medical Center",
      "29": "Arkansas Childrens",
    }
    return networks[networkId] || "Unknown Network"
  }

  const updateField = (timesheetId: string, field: string, value: any) => {
    setEditingFields((prev) => ({
      ...prev,
      [timesheetId]: {
        ...prev[timesheetId],
        [field]: value,
      },
    }))
    console.log(`[v0] Updated ${field} for ${timesheetId}:`, value)
  }

  const getFieldValue = (record: TimesheetRecord, field: string) => {
    return editingFields[record.timesheetId]?.[field] ?? (record as any)[field]
  }

  const handleDelete = (record: TimesheetRecord) => {
    console.log("[v0] Deleting timesheet:", record.timesheetId)
    onRowAction?.("delete", record)
  }

  const getSendSummary = () => {
    const approvedCount = selectedRows.filter((id) => {
      const record = filteredTimesheets.find((t) => t.timesheetId === id)
      return record?.approvalDecision === "Yes"
    }).length

    const networkName = selectedNetwork ? getNetworkName(selectedNetwork) : "All Networks"

    return { count: approvedCount, network: networkName }
  }

  const renderDynamicFieldValue = (record: TimesheetRecord, column: string) => {
    const value = getFieldValue(record, `dynamicFields.${column}`) || record.dynamicFields?.[column] || ""

    return (
      <Input
        value={value}
        onChange={(e) => updateField(record.timesheetId, `dynamicFields.${column}`, e.target.value)}
        className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border"
        placeholder={`Enter ${column}`}
      />
    )
  }

  const renderColumnValue = (record: TimesheetRecord, column: string) => {
    switch (column) {
      case "Network":
        return (
          <span className="font-medium">
            {record.networkId} - {getNetworkName(record.networkId)}
          </span>
        )
      case "Facility Name":
        return (
          <Input
            value={getFieldValue(record, "facilityName")}
            onChange={(e) => updateField(record.timesheetId, "facilityName", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border"
          />
        )
      case "Department Name":
        return (
          <Input
            value={`${getFieldValue(record, "costCenterNumber")} - ${getFieldValue(record, "costCenterDescription")}`}
            onChange={(e) => {
              const [number, ...descParts] = e.target.value.split(" - ")
              updateField(record.timesheetId, "costCenterNumber", number)
              updateField(record.timesheetId, "costCenterDescription", descParts.join(" - "))
            }}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border"
          />
        )
      case "External Employee ID":
        return (
          <Input
            value={getFieldValue(record, "externalEmployeeId")}
            onChange={(e) => updateField(record.timesheetId, "externalEmployeeId", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border"
          />
        )
      case "Employee Name":
        return (
          <Input
            value={getFieldValue(record, "employeeName")}
            onChange={(e) => updateField(record.timesheetId, "employeeName", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border"
          />
        )
      case "Clock In Date":
        return (
          <Input
            type="date"
            value={getFieldValue(record, "clockInDate")}
            onChange={(e) => updateField(record.timesheetId, "clockInDate", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border w-32"
          />
        )
      case "Clock In Time":
        return (
          <Input
            type="time"
            value={getFieldValue(record, "clockInTime")}
            onChange={(e) => updateField(record.timesheetId, "clockInTime", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border w-24"
          />
        )
      case "Clock Out Date":
        return (
          <Input
            type="date"
            value={getFieldValue(record, "clockOutDate")}
            onChange={(e) => updateField(record.timesheetId, "clockOutDate", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border w-32"
          />
        )
      case "Clock Out Time":
        return (
          <Input
            type="time"
            value={getFieldValue(record, "clockOutTime")}
            onChange={(e) => updateField(record.timesheetId, "clockOutTime", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border w-24"
          />
        )
      case "Suggested Shift":
        return (
          <div className="max-w-xs">
            {editingShift === record.timesheetId ? (
              <div className="space-y-2">
                <Input
                  placeholder="Type shift keywords..."
                  value={shiftSearchTerm}
                  onChange={(e) => handleShiftSearch(e.target.value)}
                  className="text-xs"
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingShift(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingShift(null)
                      setShiftSearchTerm("")
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : record.suggestedShift ? (
              <div
                className="cursor-pointer hover:bg-muted p-1 rounded text-xs"
                onClick={() => setEditingShift(record.timesheetId)}
              >
                <div className="truncate" title={record.suggestedShift.name}>
                  {record.suggestedShift.name}
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingShift(record.timesheetId)} className="text-xs">
                Select Shift
              </Button>
            )}
          </div>
        )
      case "Match Status":
        return record.status === "matched" ? (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Matched
          </Badge>
        ) : record.status === "needs_review" ? (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 cursor-help">
                Needs Review
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{record.errorMessage || "Could not find a matching assigned shift"}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="bg-red-100 text-red-800 cursor-help">
                Error
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Data or formatting issue detected</p>
            </TooltipContent>
          </Tooltip>
        )
      case "Incentive":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={getFieldValue(record, "incentiveFlag")}
              onCheckedChange={(checked) => updateField(record.timesheetId, "incentiveFlag", !!checked)}
            />
            {getFieldValue(record, "incentiveFlag") && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="cursor-help">
                    <span className="mr-1">✨</span>
                    Yes
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{record.incentiveAmount || "Department incentive available"}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      case "Approval Date":
        return (
          <Input
            type="datetime-local"
            value={new Date(getFieldValue(record, "approvalDate")).toISOString().slice(0, 16)}
            onChange={(e) => updateField(record.timesheetId, "approvalDate", new Date(e.target.value).toLocaleString())}
            className="text-xs w-40"
          />
        )
      case "Approval Decision":
        return (
          <Select
            value={getFieldValue(record, "approvalDecision")}
            onValueChange={(value: "Yes" | "No") => updateField(record.timesheetId, "approvalDecision", value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        )
      case "Approved By":
        return (
          <div>
            {editingApproval === record.timesheetId ? (
              <div className="space-y-2">
                <Input
                  placeholder="Type employee name..."
                  value={approvedBySearch}
                  onChange={(e) => handleApprovedBySearch(e.target.value)}
                  className="text-xs w-40"
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingApproval(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateField(record.timesheetId, "approvedBy", approvedBySearch)
                      setEditingApproval(null)
                      setApprovedBySearch("")
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : getFieldValue(record, "approvedBy") ? (
              <div
                className="cursor-pointer hover:bg-muted p-1 rounded text-xs"
                onClick={() => setEditingApproval(record.timesheetId)}
              >
                {getFieldValue(record, "approvedBy")}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingApproval(record.timesheetId)}
                className="text-xs"
              >
                Select Employee
              </Button>
            )}
          </div>
        )
      case "In-Clocking GUID":
        return (
          <Input
            value={
              getFieldValue(record, "dynamicFields.In-Clocking GUID") ||
              record.dynamicFields?.["In-Clocking GUID"] ||
              ""
            }
            onChange={(e) => updateField(record.timesheetId, "dynamicFields.In-Clocking GUID", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border font-mono text-xs"
            placeholder="GUID"
          />
        )
      case "Hours":
        return (
          <Input
            type="number"
            step="0.01"
            value={getFieldValue(record, "dynamicFields.Hours") || record.dynamicFields?.["Hours"] || ""}
            onChange={(e) => updateField(record.timesheetId, "dynamicFields.Hours", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border w-20"
            placeholder="0.00"
          />
        )
      case "Pay Code":
        return (
          <Input
            value={getFieldValue(record, "dynamicFields.Pay Code") || record.dynamicFields?.["Pay Code"] || ""}
            onChange={(e) => updateField(record.timesheetId, "dynamicFields.Pay Code", e.target.value)}
            className="border-0 bg-transparent p-1 h-auto focus:bg-background focus:border w-24"
            placeholder="REG"
          />
        )
      case "Lunch":
        return (
          <Select
            value={getFieldValue(record, "dynamicFields.Lunch") || record.dynamicFields?.["Lunch"] || ""}
            onValueChange={(value) => updateField(record.timesheetId, "dynamicFields.Lunch", value)}
          >
            <SelectTrigger className="w-16">
              <SelectValue placeholder="?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        )
      default:
        // Handle any other dynamic fields
        return renderDynamicFieldValue(record, column)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border">
          <div>
            <span className="text-sm font-medium">Viewing Network: </span>
            <Badge variant="outline" className="ml-2">
              {getNetworkName(selectedNetwork)} ({networkMapping?.fileName || "Unknown Format"})
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredTimesheets.length} timesheet{filteredTimesheets.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedRows.length} row{selectedRows.length > 1 ? "s" : ""} selected
            </span>
            <Button onClick={handleBulkCreate} size="sm">
              Create Timesheets (
              {
                selectedRows.filter((id) => {
                  const record = filteredTimesheets.find((t) => t.timesheetId === id)
                  return record?.status === "matched"
                }).length
              }
              )
            </Button>
            <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <span className="mr-2">📤</span>
                  Send Time Sheets
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Time Sheets</DialogTitle>
                  <DialogDescription>
                    You are about to create {getSendSummary().count} time sheet{getSendSummary().count !== 1 ? "s" : ""}{" "}
                    for the Network of {getSendSummary().network}.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendTimesheets}>Send Time Sheets</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === filteredTimesheets.length && filteredTimesheets.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimesheets.map((record) => (
                <TableRow key={record.timesheetId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(record.timesheetId)}
                      onCheckedChange={(checked) => handleSelectRow(record.timesheetId, !!checked)}
                    />
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column}>{renderColumnValue(record, column)}</TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <span className="text-base">🗑️</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
