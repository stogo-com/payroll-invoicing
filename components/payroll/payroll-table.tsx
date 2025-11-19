"use client"
import { useState } from "react"
import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface PayrollTableProps {
  data: any[]
  selectedNetwork?: string
  onFieldUpdate: (recordId: string, field: string, value: string) => void
}

export function PayrollTable({ data, selectedNetwork, onFieldUpdate }: PayrollTableProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string } | null>(null)

  const formatDateTime = (dateString: string) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MM/dd/yyyy HH:mm")
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MM/dd/yyyy")
    } catch {
      return dateString
    }
  }

  const EditableCell = ({ recordId, field, value, type = "text" }: any) => {
    const isEditing = editingCell?.recordId === recordId && editingCell?.field === field
    const [localValue, setLocalValue] = useState(value)

    const handleBlur = () => {
      if (localValue !== value) {
        onFieldUpdate(recordId, field, localValue)
      }
      setEditingCell(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur()
      } else if (e.key === "Escape") {
        setLocalValue(value)
        setEditingCell(null)
      }
    }

    if (isEditing) {
      return (
        <Input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 w-full"
        />
      )
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center"
        onClick={() => setEditingCell({ recordId, field })}
      >
        {value || <span className="text-muted-foreground italic">Click to edit</span>}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">No payroll records found</p>
          <p className="text-xs text-muted-foreground mt-1">
            No approved and locked timecards match the selected criteria
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead className="whitespace-nowrap">Shift ID</TableHead>
              <TableHead className="whitespace-nowrap">EID</TableHead>
              <TableHead className="whitespace-nowrap">EE Name</TableHead>
              <TableHead className="whitespace-nowrap">Start Date of Shift</TableHead>
              <TableHead className="whitespace-nowrap">End Date of Shift</TableHead>
              <TableHead className="whitespace-nowrap">First Punch</TableHead>
              <TableHead className="whitespace-nowrap">Last Punch</TableHead>
              <TableHead className="whitespace-nowrap">Hours Worked</TableHead>
              <TableHead className="whitespace-nowrap">Facility #</TableHead>
              <TableHead className="whitespace-nowrap">Fac Name</TableHead>
              <TableHead className="whitespace-nowrap">Dept #</TableHead>
              <TableHead className="whitespace-nowrap">Dept Name</TableHead>
              <TableHead className="whitespace-nowrap">Night/Day Shift</TableHead>
              <TableHead className="whitespace-nowrap">Approved</TableHead>
              <TableHead className="whitespace-nowrap">Submitted</TableHead>
              <TableHead className="whitespace-nowrap">Review Comments</TableHead>
              <TableHead className="whitespace-nowrap">Priority Messages</TableHead>
              <TableHead className="whitespace-nowrap">Shift Comments</TableHead>
              <TableHead className="whitespace-nowrap">Timecard status</TableHead>
              <TableHead className="whitespace-nowrap">Invoice date</TableHead>
              <TableHead className="whitespace-nowrap">Invoice ID</TableHead>
              <TableHead className="whitespace-nowrap">Incentive</TableHead>
              <TableHead className="whitespace-nowrap">Approved by</TableHead>
              <TableHead className="whitespace-nowrap">Work Rule</TableHead>
              <TableHead className="whitespace-nowrap">Adjusted Base Rate</TableHead>
              <TableHead className="whitespace-nowrap">Punches</TableHead>
              <TableHead className="whitespace-nowrap">Breaks</TableHead>
              <TableHead className="whitespace-nowrap">Network Code</TableHead>
              <TableHead className="whitespace-nowrap">Network Name</TableHead>
              <TableHead className="whitespace-nowrap">Job Category Code</TableHead>
              <TableHead className="whitespace-nowrap">Job Category Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.id}</TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="shiftId" value={record.shiftId} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="eid" value={record.eid} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell recordId={record.id} field="eeName" value={record.eeName} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell
                    recordId={record.id}
                    field="startDateOfShift"
                    value={formatDateTime(record.startDateOfShift)}
                    type="datetime-local"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell
                    recordId={record.id}
                    field="endDateOfShift"
                    value={formatDateTime(record.endDateOfShift)}
                    type="datetime-local"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell
                    recordId={record.id}
                    field="firstPunch"
                    value={formatDateTime(record.firstPunch)}
                    type="datetime-local"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell
                    recordId={record.id}
                    field="lastPunch"
                    value={formatDateTime(record.lastPunch)}
                    type="datetime-local"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <EditableCell recordId={record.id} field="hoursWorked" value={record.hoursWorked} type="number" />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="facilityNumber" value={record.facilityNumber} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell recordId={record.id} field="facName" value={record.facName} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="deptNumber" value={record.deptNumber} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell recordId={record.id} field="deptName" value={record.deptName} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="nightDayShift" value={record.nightDayShift} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="approved" value={record.approved} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell
                    recordId={record.id}
                    field="submitted"
                    value={formatDateTime(record.submitted)}
                    type="datetime-local"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="reviewComments" value={record.reviewComments} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="priorityMessages" value={record.priorityMessages} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="shiftComments" value={record.shiftComments} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="timecardStatus" value={record.timecardStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell
                    recordId={record.id}
                    field="invoiceDate"
                    value={formatDate(record.invoiceDate)}
                    type="date"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="invoiceId" value={record.invoiceId} />
                </TableCell>
                <TableCell className="text-right">
                  <EditableCell recordId={record.id} field="incentive" value={record.incentive} type="number" />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell recordId={record.id} field="approvedBy" value={record.approvedBy} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="workRule" value={record.workRule} />
                </TableCell>
                <TableCell className="text-right">
                  <EditableCell
                    recordId={record.id}
                    field="adjustedBaseRate"
                    value={record.adjustedBaseRate}
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="punches" value={record.punches} />
                </TableCell>
                <TableCell className="text-right">
                  <EditableCell recordId={record.id} field="breaks" value={record.breaks} type="number" />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="networkCode" value={record.networkCode} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell recordId={record.id} field="networkName" value={record.networkName} />
                </TableCell>
                <TableCell>
                  <EditableCell recordId={record.id} field="jobCategoryCode" value={record.jobCategoryCode} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <EditableCell recordId={record.id} field="jobCategoryName" value={record.jobCategoryName} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="border-t p-4">
        <p className="text-sm text-muted-foreground">
          Showing {data.length} approved and locked timecard{data.length !== 1 ? "s" : ""}
        </p>
      </div>
    </Card>
  )
}
