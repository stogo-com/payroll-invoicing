"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getNetworkMapping, getAllNetworks } from "./network-field-mapping"

interface ManualTimesheetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTimesheetCreate: (timesheetData: any) => void
  selectedNetwork?: string
}

export function ManualTimesheetModal({
  open,
  onOpenChange,
  onTimesheetCreate,
  selectedNetwork,
}: ManualTimesheetModalProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState(selectedNetwork || "")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const networkMapping = getNetworkMapping(selectedNetworkId)
  const availableNetworks = getAllNetworks()

  const handleNetworkChange = (networkId: string) => {
    setSelectedNetworkId(networkId)
    setFormData({}) // Reset form when network changes
    setErrors({})
  }

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))

    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors((prev) => ({
        ...prev,
        [fieldKey]: "",
      }))
    }
  }

  const getLehighValleyFields = () => [
    {
      key: "network",
      label: "Network",
      type: "text",
      required: true,
      defaultValue: "13 - Lehigh Valley",
      disabled: true,
    },
    {
      key: "facilityName",
      label: "Facility Name",
      type: "text",
      required: true,
      placeholder: "Company - Company Description",
    },
    {
      key: "departmentName",
      label: "Department Name",
      type: "text",
      required: true,
      placeholder: "Cost Center - Cost Center Description",
    },
    {
      key: "externalEmployeeId",
      label: "External Employee ID",
      type: "text",
      required: true,
      placeholder: "EmployeeID from file",
    },
    { key: "employeeName", label: "Employee Name", type: "text", required: true, placeholder: "First and Last Name" },
    { key: "clockInDate", label: "Clock In Date", type: "date", required: true },
    { key: "clockInTime", label: "Clock In Time", type: "time", required: true },
    { key: "clockOutDate", label: "Clock Out Date", type: "date", required: true },
    { key: "clockOutTime", label: "Clock Out Time", type: "time", required: true },
    {
      key: "suggestedShift",
      label: "Suggested Shift",
      type: "text",
      placeholder: "System will look up assigned shift",
    },
    {
      key: "matchStatus",
      label: "Match Status",
      type: "select",
      options: ["Matched", "Needs Review", "Error"],
      defaultValue: "Matched",
    },
    { key: "incentiveFlag", label: "Incentive", type: "checkbox" },
    {
      key: "approvalDate",
      label: "Approval Date",
      type: "datetime-local",
      defaultValue: new Date().toISOString().slice(0, 16),
    },
    {
      key: "approvalDecision",
      label: "Approval Decision",
      type: "select",
      options: ["Yes", "No"],
      defaultValue: "Yes",
    },
    { key: "approvedBy", label: "Approved By", type: "text", required: true, placeholder: "Enter approver name" },
    { key: "inClockingGuid", label: "In-Clocking GUID", type: "text", placeholder: "GUID from client file" },
    { key: "hours", label: "Hours", type: "number", step: "0.01", placeholder: "Hours from client file" },
    { key: "payCode", label: "Pay Code", type: "text", placeholder: "Pay code from client file" },
    {
      key: "lunch",
      label: "Lunch",
      type: "select",
      options: ["Yes", "No"],
      placeholder: "UserShiftAnswer-OutClocking value",
    },
  ]

  const getFieldsForNetwork = () => {
    if (selectedNetworkId === "13") {
      return getLehighValleyFields()
    }

    // Default fields for other networks
    return [
      {
        key: "network",
        label: "Network",
        type: "text",
        required: true,
        defaultValue: `${selectedNetworkId} - ${networkMapping?.networkName}`,
        disabled: true,
      },
      { key: "externalEmployeeId", label: "External Employee ID", type: "text", required: true },
      { key: "employeeName", label: "Employee Name", type: "text", required: true },
      { key: "clockInDate", label: "Clock In Date", type: "date", required: true },
      { key: "clockInTime", label: "Clock In Time", type: "time", required: true },
      { key: "clockOutDate", label: "Clock Out Date", type: "date", required: true },
      { key: "clockOutTime", label: "Clock Out Time", type: "time", required: true },
      { key: "facilityName", label: "Facility Name", type: "text", required: true },
      { key: "costCenterNumber", label: "Cost Center Number", type: "text" },
      { key: "costCenterDescription", label: "Cost Center Description", type: "text" },
      { key: "hours", label: "Hours", type: "number", step: "0.01" },
      {
        key: "approvalDecision",
        label: "Approval Decision",
        type: "select",
        options: ["Yes", "No"],
        defaultValue: "Yes",
      },
      { key: "approvedBy", label: "Approved By", type: "text", required: true },
    ]
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fields = getFieldsForNetwork()

    fields.forEach((field) => {
      if (field.required && !formData[field.key] && !field.defaultValue) {
        newErrors[field.key] = `${field.label} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    // Set default values and prepare timesheet data
    const fields = getFieldsForNetwork()
    const timesheetData: any = {
      timesheetId: `manual-${Date.now()}`,
      networkId: selectedNetworkId,
      status: formData.matchStatus === "Matched" ? "matched" : "needs_review",
      ...formData,
    }

    // Set default values for fields that have them
    fields.forEach((field) => {
      if (field.defaultValue && !timesheetData[field.key]) {
        timesheetData[field.key] = field.defaultValue
      }
    })

    // For Lehigh Valley, structure the dynamic fields properly
    if (selectedNetworkId === "13") {
      timesheetData.dynamicFields = {
        Network: timesheetData.network,
        "Facility Name": timesheetData.facilityName,
        "Department Name": timesheetData.departmentName,
        "External Employee ID": timesheetData.externalEmployeeId,
        "Employee Name": timesheetData.employeeName,
        "Clock In Date": timesheetData.clockInDate,
        "Clock In Time": timesheetData.clockInTime,
        "Clock Out Date": timesheetData.clockOutDate,
        "Clock Out Time": timesheetData.clockOutTime,
        "Suggested Shift": timesheetData.suggestedShift,
        "Match Status": timesheetData.matchStatus,
        Incentive: timesheetData.incentiveFlag ? "Yes" : "No",
        "Approval Date": timesheetData.approvalDate,
        "Approval Decision": timesheetData.approvalDecision,
        "Approved By": timesheetData.approvedBy,
        "In-Clocking GUID": timesheetData.inClockingGuid,
        Hours: timesheetData.hours,
        "Pay Code": timesheetData.payCode,
        Lunch: timesheetData.lunch,
      }
    }

    onTimesheetCreate(timesheetData)
    onOpenChange(false)
    setFormData({})
    setErrors({})
  }

  const renderField = (field: any) => {
    const value = formData[field.key] || field.defaultValue || ""
    const hasError = !!errors[field.key]

    switch (field.type) {
      case "checkbox":
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={field.disabled}
            />
            <Label htmlFor={field.key} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
          </div>
        )

      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.key, val)} disabled={field.disabled}>
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-500">{errors[field.key]}</p>}
          </div>
        )

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
            <Input
              id={field.key}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? "border-red-500" : ""}
              step={field.step}
              disabled={field.disabled}
            />
            {hasError && <p className="text-sm text-red-500">{errors[field.key]}</p>}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Manual Timesheet</DialogTitle>
          <DialogDescription>
            Add a new timesheet record manually. Select the network to show relevant fields for that client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="network-select">Network *</Label>
            <Select value={selectedNetworkId} onValueChange={handleNetworkChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a network" />
              </SelectTrigger>
              <SelectContent>
                {availableNetworks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedNetworkId && (
            <ScrollArea className="h-96 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{getFieldsForNetwork().map(renderField)}</div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedNetworkId}>
            Create Timesheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
