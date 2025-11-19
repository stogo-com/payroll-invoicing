"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { FieldDefinition, FieldMapping } from "@/types/field-schema"

interface FieldMappingTableProps {
  inputFields: FieldDefinition[]
  outputFields: FieldDefinition[]
  mappings: FieldMapping[]
  onMappingsChange: (mappings: FieldMapping[]) => void
}

export function FieldMappingTable({ inputFields, outputFields, mappings, onMappingsChange }: FieldMappingTableProps) {
  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addMapping = () => {
    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      sourceFieldId: "",
      targetFieldId: "",
      transformType: "direct",
      transformRule: "",
    }
    setEditingMapping(newMapping)
    setIsDialogOpen(true)
  }

  const saveMapping = (mapping: FieldMapping) => {
    if (mappings.find((m) => m.id === mapping.id)) {
      onMappingsChange(mappings.map((m) => (m.id === mapping.id ? mapping : m)))
    } else {
      onMappingsChange([...mappings, mapping])
    }
    setIsDialogOpen(false)
    setEditingMapping(null)
  }

  const deleteMapping = (mappingId: string) => {
    onMappingsChange(mappings.filter((m) => m.id !== mappingId))
  }

  const getFieldName = (fieldId: string, fields: FieldDefinition[]) => {
    return fields.find((f) => f.id === fieldId)?.name || "Unknown"
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Field Mappings</h3>
          <p className="text-sm text-muted-foreground">Map input fields to output fields with transformation rules</p>
        </div>
        <Button onClick={addMapping} size="sm">
          Add Mapping
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Source Field</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Target Field</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Transform Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Transform Rule</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                  No mappings defined. Click "Add Mapping" to create field mappings.
                </td>
              </tr>
            ) : (
              mappings.map((mapping) => (
                <tr key={mapping.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-sm text-foreground">
                    {getFieldName(mapping.sourceFieldId, inputFields)}
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">
                    {getFieldName(mapping.targetFieldId, outputFields)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {mapping.transformType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{mapping.transformRule || "-"}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingMapping(mapping)
                          setIsDialogOpen(true)
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => deleteMapping(mapping.id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMapping?.sourceFieldId ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
          </DialogHeader>
          {editingMapping && (
            <MappingEditor
              mapping={editingMapping}
              inputFields={inputFields}
              outputFields={outputFields}
              onSave={saveMapping}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingMapping(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MappingEditor({
  mapping,
  inputFields,
  outputFields,
  onSave,
  onCancel,
}: {
  mapping: FieldMapping
  inputFields: FieldDefinition[]
  outputFields: FieldDefinition[]
  onSave: (mapping: FieldMapping) => void
  onCancel: () => void
}) {
  const [editedMapping, setEditedMapping] = useState<FieldMapping>(mapping)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Source Field (Input)</label>
        <Select
          value={editedMapping.sourceFieldId}
          onValueChange={(value) => setEditedMapping({ ...editedMapping, sourceFieldId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source field" />
          </SelectTrigger>
          <SelectContent>
            {inputFields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name} ({field.dataType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Target Field (Output)</label>
        <Select
          value={editedMapping.targetFieldId}
          onValueChange={(value) => setEditedMapping({ ...editedMapping, targetFieldId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select target field" />
          </SelectTrigger>
          <SelectContent>
            {outputFields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name} ({field.dataType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Transform Type</label>
        <Select
          value={editedMapping.transformType}
          onValueChange={(value) => setEditedMapping({ ...editedMapping, transformType: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="direct">Direct (No transformation)</SelectItem>
            <SelectItem value="lookup">Lookup (Database lookup)</SelectItem>
            <SelectItem value="calculate">Calculate (Compute value)</SelectItem>
            <SelectItem value="format">Format (Change format)</SelectItem>
            <SelectItem value="custom">Custom (Custom logic)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Transform Rule (Optional)</label>
        <Input
          value={editedMapping.transformRule || ""}
          onChange={(e) => setEditedMapping({ ...editedMapping, transformRule: e.target.value })}
          placeholder="e.g., Lookup employee shift ID from database"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editedMapping)}
          disabled={!editedMapping.sourceFieldId || !editedMapping.targetFieldId}
        >
          Save Mapping
        </Button>
      </div>
    </div>
  )
}
