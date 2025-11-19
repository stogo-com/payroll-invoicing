"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface InvoicingRecord {
  id: string
  shiftId: string
  eid: string
  eeName: string
  startDateOfShift: string
  endDateOfShift: string
  firstPunch: string
  lastPunch: string
  hoursWorked: number
  facilityNumber: string
  facName: string
  deptNumber: string
  deptName: string
  nightDayShift: string
  approved: string
  submitted: string
  reviewComments: string
  priorityMessages: string
  shiftComments: string
  timecardStatus: string
  invoiceDate: string
  invoiceId: string
  incentive: string
  approvedBy: string
  workRule: string
  adjustedBaseRate: number
  punches: number
  breaks: number
  networkCode: string
  networkName: string
  jobCategoryCode: string
  jobCategoryName: string
}

interface InvoicingTableProps {
  selectedNetwork: string
  dateRange: { from: Date | undefined; to: Date | undefined }
  onRecordEdit: (recordId: string) => void
}

export function InvoicingTable({ selectedNetwork, dateRange, onRecordEdit }: InvoicingTableProps) {
  const [records, setRecords] = useState<InvoicingRecord[]>([])
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)

  useEffect(() => {
    // Mock data - filtered for "Submitted to Payroll" status
    const mockData: InvoicingRecord[] = [
      {
        id: "6319",
        shiftId: "14520787",
        eid: "N4468991",
        eeName: "Emma Lynn",
        startDateOfShift: "2025-10-13 19:00:00",
        endDateOfShift: "2025-10-13 23:00:00",
        firstPunch: "2025-10-13 18:59:04",
        lastPunch: "2025-10-13 23:20:00",
        hoursWorked: 4.42,
        facilityNumber: "HS225",
        facName: "Doylestown Hospital",
        deptNumber: "1B",
        deptName: "ER",
        nightDayShift: "night",
        approved: "yes",
        submitted: "yes",
        reviewComments: "",
        priorityMessages: "",
        shiftComments: "Mass Meds RN",
        timecardStatus: "Submitted to Payroll",
        invoiceDate: "2025-10-15",
        invoiceId: "INV-100001",
        incentive: "Surge Admin Incentive NU999999",
        approvedBy: "John Doe",
        workRule: "1667 Flex RN",
        adjustedBaseRate: 85.5,
        punches: 2,
        breaks: 0,
        networkCode: "13",
        networkName: "Lehigh Valley",
        jobCategoryCode: "RN",
        jobCategoryName: "Registered Nurse",
      },
      {
        id: "6320",
        shiftId: "14520788",
        eid: "N4468992",
        eeName: "Peter House",
        startDateOfShift: "2025-10-13 07:00:00",
        endDateOfShift: "2025-10-13 19:00:00",
        firstPunch: "2025-10-13 06:58:00",
        lastPunch: "2025-10-13 19:17:00",
        hoursWorked: 12.25,
        facilityNumber: "HS225",
        facName: "Doylestown Hospital",
        deptNumber: "2C",
        deptName: "ICU",
        nightDayShift: "day",
        approved: "yes",
        submitted: "yes",
        reviewComments: "",
        priorityMessages: "",
        shiftComments: "",
        timecardStatus: "Submitted to Payroll",
        invoiceDate: "2025-10-15",
        invoiceId: "INV-100002",
        incentive: "",
        approvedBy: "Jane Smith",
        workRule: "1667 Flex RN",
        adjustedBaseRate: 82.0,
        punches: 2,
        breaks: 1,
        networkCode: "13",
        networkName: "Lehigh Valley",
        jobCategoryCode: "RN",
        jobCategoryName: "Registered Nurse",
      },
    ]

    setRecords(mockData)
  }, [selectedNetwork, dateRange])

  const handleCellEdit = (id: string, field: keyof InvoicingRecord, value: string) => {
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, [field]: value } : record)))
    onRecordEdit(id)
    setEditingCell(null)
  }

  const renderEditableCell = (record: InvoicingRecord, field: keyof InvoicingRecord) => {
    const value = record[field]
    const isEditing = editingCell?.id === record.id && editingCell?.field === field

    if (isEditing) {
      return (
        <Input
          autoFocus
          defaultValue={String(value)}
          onBlur={(e) => handleCellEdit(record.id, field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCellEdit(record.id, field, e.currentTarget.value)
            }
            if (e.key === "Escape") {
              setEditingCell(null)
            }
          }}
          className="h-8"
        />
      )
    }

    return (
      <div
        onClick={() => setEditingCell({ id: record.id, field })}
        className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
      >
        {String(value)}
      </div>
    )
  }

  if (!selectedNetwork || !dateRange.from || !dateRange.to) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Please select a network and date range to view invoicing records
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Shift ID</TableHead>
              <TableHead>EID</TableHead>
              <TableHead>EE Name</TableHead>
              <TableHead>Start Date of Shift</TableHead>
              <TableHead>End Date of Shift</TableHead>
              <TableHead>First Punch</TableHead>
              <TableHead>Last Punch</TableHead>
              <TableHead>Hours Worked</TableHead>
              <TableHead>Facility #</TableHead>
              <TableHead>Fac Name</TableHead>
              <TableHead>Dept #</TableHead>
              <TableHead>Dept Name</TableHead>
              <TableHead>Night/Day Shift</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Review Comments</TableHead>
              <TableHead>Priority Messages</TableHead>
              <TableHead>Shift Comments</TableHead>
              <TableHead>Timecard Status</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Incentive</TableHead>
              <TableHead>Approved By</TableHead>
              <TableHead>Work Rule</TableHead>
              <TableHead>Adjusted Base Rate</TableHead>
              <TableHead>Punches</TableHead>
              <TableHead>Breaks</TableHead>
              <TableHead>Network Code</TableHead>
              <TableHead>Network Name</TableHead>
              <TableHead>Job Category Code</TableHead>
              <TableHead>Job Category Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{renderEditableCell(record, "id")}</TableCell>
                <TableCell>{renderEditableCell(record, "shiftId")}</TableCell>
                <TableCell>{renderEditableCell(record, "eid")}</TableCell>
                <TableCell>{renderEditableCell(record, "eeName")}</TableCell>
                <TableCell>{renderEditableCell(record, "startDateOfShift")}</TableCell>
                <TableCell>{renderEditableCell(record, "endDateOfShift")}</TableCell>
                <TableCell>{renderEditableCell(record, "firstPunch")}</TableCell>
                <TableCell>{renderEditableCell(record, "lastPunch")}</TableCell>
                <TableCell>{renderEditableCell(record, "hoursWorked")}</TableCell>
                <TableCell>{renderEditableCell(record, "facilityNumber")}</TableCell>
                <TableCell>{renderEditableCell(record, "facName")}</TableCell>
                <TableCell>{renderEditableCell(record, "deptNumber")}</TableCell>
                <TableCell>{renderEditableCell(record, "deptName")}</TableCell>
                <TableCell>
                  <Badge variant={record.nightDayShift === "night" ? "secondary" : "default"}>
                    {record.nightDayShift}
                  </Badge>
                </TableCell>
                <TableCell>{renderEditableCell(record, "approved")}</TableCell>
                <TableCell>{renderEditableCell(record, "submitted")}</TableCell>
                <TableCell>{renderEditableCell(record, "reviewComments")}</TableCell>
                <TableCell>{renderEditableCell(record, "priorityMessages")}</TableCell>
                <TableCell>{renderEditableCell(record, "shiftComments")}</TableCell>
                <TableCell>
                  <Badge variant="outline">{record.timecardStatus}</Badge>
                </TableCell>
                <TableCell>{renderEditableCell(record, "invoiceDate")}</TableCell>
                <TableCell>{renderEditableCell(record, "invoiceId")}</TableCell>
                <TableCell>{renderEditableCell(record, "incentive")}</TableCell>
                <TableCell>{renderEditableCell(record, "approvedBy")}</TableCell>
                <TableCell>{renderEditableCell(record, "workRule")}</TableCell>
                <TableCell>{renderEditableCell(record, "adjustedBaseRate")}</TableCell>
                <TableCell>{renderEditableCell(record, "punches")}</TableCell>
                <TableCell>{renderEditableCell(record, "breaks")}</TableCell>
                <TableCell>{renderEditableCell(record, "networkCode")}</TableCell>
                <TableCell>{renderEditableCell(record, "networkName")}</TableCell>
                <TableCell>{renderEditableCell(record, "jobCategoryCode")}</TableCell>
                <TableCell>{renderEditableCell(record, "jobCategoryName")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
