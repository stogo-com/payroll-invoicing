"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Clock, MapPin } from "lucide-react"

interface Shift {
  shiftId: number
  employeeInternalId: string
  start: string
  end: string
  department: string
  facility: string
  status: string
  shiftType: string
  score: number
}

const mockShifts: Shift[] = [
  {
    shiftId: 14372456,
    employeeInternalId: "INT-204275",
    start: "2025-12-31T18:45:00",
    end: "2026-01-01T07:15:00",
    department: "603 Safety Attendants",
    facility: "OU Children's Hospital",
    status: "Assigned",
    shiftType: "Night",
    score: 95,
  },
  {
    shiftId: 14372457,
    employeeInternalId: "INT-204275",
    start: "2025-12-31T07:00:00",
    end: "2025-12-31T19:00:00",
    department: "Emergency Department",
    facility: "OU Children's Hospital",
    status: "Available",
    shiftType: "Day",
    score: 75,
  },
]

interface SearchShiftsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId?: string
  onShiftSelect?: (shift: Shift) => void
}

export function SearchShiftsModal({ open, onOpenChange, employeeId, onShiftSelect }: SearchShiftsModalProps) {
  const [searchParams, setSearchParams] = useState({
    employeeId: employeeId || "",
    startDate: "",
    endDate: "",
    department: "",
  })

  const handleSearch = () => {
    // In real implementation, this would call the API
    console.log("Searching shifts with params:", searchParams)
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          High Match
        </Badge>
      )
    if (score >= 70) return <Badge variant="secondary">Medium Match</Badge>
    return <Badge variant="outline">Low Match</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Search Shifts</DialogTitle>
          <DialogDescription>Find matching shifts for the selected timesheet record</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={searchParams.employeeId}
                onChange={(e) => setSearchParams({ ...searchParams, employeeId: e.target.value })}
                placeholder="INT-204275"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={searchParams.startDate}
                onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={searchParams.endDate}
                onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={searchParams.department}
                onChange={(e) => setSearchParams({ ...searchParams, department: e.target.value })}
                placeholder="603 Safety Attendants"
              />
            </div>
          </div>

          <Button onClick={handleSearch} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Search Shifts
          </Button>

          {/* Results Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockShifts.map((shift) => (
                  <TableRow key={shift.shiftId}>
                    <TableCell className="font-medium">#{shift.shiftId}</TableCell>
                    <TableCell>{shift.employeeInternalId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">
                          {new Date(shift.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                          {new Date(shift.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{shift.department}</span>
                      </div>
                    </TableCell>
                    <TableCell>{shift.facility}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{shift.shiftType}</Badge>
                    </TableCell>
                    <TableCell>{getScoreBadge(shift.score)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          onShiftSelect?.(shift)
                          onOpenChange(false)
                        }}
                      >
                        Attach
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
