"use client"

import { useState } from "react"
import type { FieldMapping } from "@/types/mapping"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface MappingRowFormProps {
  open: boolean
  onClose: () => void
  onSave: (mapping: Omit<FieldMapping, "id">) => void
  direction: "inbound" | "outbound"
  initialData?: FieldMapping
}

export function MappingRowForm({ open, onClose, onSave, direction, initialData }: MappingRowFormProps) {
  const [formData, setFormData] = useState<Partial<FieldMapping>>(
    initialData || {
      fieldName: "",
      dataType: "string",
      format: "",
      order: 0,
      direction,
      targetField: "",
      transformation: "",
      validationRules: [],
    },
  )

  const handleSubmit = () => {
    onSave(formData as Omit<FieldMapping, "id">)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Field Mapping</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fieldName">Field Name</Label>
            <Input
              id="fieldName"
              value={formData.fieldName}
              onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
              placeholder="e.g., Employee ID"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dataType">Data Type</Label>
            <Select value={formData.dataType} onValueChange={(value) => setFormData({ ...formData, dataType: value })}>
              <SelectTrigger id="dataType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="datetime">DateTime</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Input
              id="format"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              placeholder="e.g., MM/DD/YYYY"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value) })}
            />
          </div>
          {direction === "outbound" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="targetField">Target Field</Label>
                <Input
                  id="targetField"
                  value={formData.targetField}
                  onChange={(e) => setFormData({ ...formData, targetField: e.target.value })}
                  placeholder="e.g., approval_date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transformation">Transformation Rule</Label>
                <Input
                  id="transformation"
                  value={formData.transformation}
                  onChange={(e) => setFormData({ ...formData, transformation: e.target.value })}
                  placeholder="e.g., formatDate(value, 'YYYY-MM-DD')"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
