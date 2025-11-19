"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface CreateShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId?: string
  onShiftCreate?: (shiftData: any) => void
}

export function CreateShiftModal({ open, onOpenChange, employeeId, onShiftCreate }: CreateShiftModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shiftData, setShiftData] = useState({
    employeeInternalId: employeeId || "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    department: "",
    facility: "OU Children's Hospital",
    shiftType: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Combine date and time
      const start = new Date(`${shiftData.startDate}T${shiftData.startTime}`)
      const end = new Date(`${shiftData.endDate}T${shiftData.endTime}`)

      const newShift = {
        employeeInternalId: shiftData.employeeInternalId,
        start: start.toISOString(),
        end: end.toISOString(),
        department: shiftData.department,
        facility: shiftData.facility,
        shiftType: shiftData.shiftType,
        notes: shiftData.notes,
      }

      // In real implementation, this would call the API
      console.log("Creating shift:", newShift)

      onShiftCreate?.(newShift)
      onOpenChange(false)

      // Reset form
      setShiftData({
        employeeInternalId: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        department: "",
        facility: "OU Children's Hospital",
        shiftType: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error creating shift:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Shift</DialogTitle>
          <DialogDescription>Create a new shift that can be matched to timesheet records</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee Internal ID</Label>
              <Input
                id="employeeId"
                value={shiftData.employeeInternalId}
                onChange={(e) => setShiftData({ ...shiftData, employeeInternalId: e.target.value })}
                placeholder="INT-204275"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility">Facility</Label>
              <Select
                value={shiftData.facility}
                onValueChange={(value) => setShiftData({ ...shiftData, facility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OU Children's Hospital">OU Children's Hospital</SelectItem>
                  <SelectItem value="Baptist Arkansas">Baptist Arkansas</SelectItem>
                  <SelectItem value="Shannon Medical">Shannon Medical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={shiftData.startDate}
                onChange={(e) => setShiftData({ ...shiftData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={shiftData.startTime}
                onChange={(e) => setShiftData({ ...shiftData, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={shiftData.endDate}
                onChange={(e) => setShiftData({ ...shiftData, endDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={shiftData.endTime}
                onChange={(e) => setShiftData({ ...shiftData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={shiftData.department}
                onChange={(e) => setShiftData({ ...shiftData, department: e.target.value })}
                placeholder="603 Safety Attendants"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftType">Shift Type</Label>
              <Select
                value={shiftData.shiftType}
                onValueChange={(value) => setShiftData({ ...shiftData, shiftType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Weekend">Weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={shiftData.notes}
              onChange={(e) => setShiftData({ ...shiftData, notes: e.target.value })}
              placeholder="Additional notes about this shift..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Shift"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
