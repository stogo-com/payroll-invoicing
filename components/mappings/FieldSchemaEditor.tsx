"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { FieldDefinition, DataType, ValidationRule } from "@/types/field-schema"

interface FieldSchemaEditorProps {
  title: string
  description: string
  fields: FieldDefinition[]
  onFieldsChange: (fields: FieldDefinition[]) => void
}

export function FieldSchemaEditor({ title, description, fields, onFieldsChange }: FieldSchemaEditorProps) {
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const dataTypes: DataType[] = ["string", "number", "date", "datetime", "boolean", "guid", "decimal", "integer"]

  const addField = () => {
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      name: "",
      dataType: "string",
      order: fields.length + 1,
      validationRules: [],
    }
    setEditingField(newField)
    setIsDialogOpen(true)
  }

  const saveField = (field: FieldDefinition) => {
    if (fields.find((f) => f.id === field.id)) {
      onFieldsChange(fields.map((f) => (f.id === field.id ? field : f)))
    } else {
      onFieldsChange([...fields, field])
    }
    setIsDialogOpen(false)
    setEditingField(null)
  }

  const deleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId))
  }

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === fieldId)
    if (index === -1) return

    const newFields = [...fields]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= fields.length) return
    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]

    newFields.forEach((f, i) => (f.order = i + 1))
    onFieldsChange(newFields)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={addField} size="sm">
          Add Field
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No fields defined. Click "Add Field" to get started.
          </p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 p-3 rounded-md border border-border bg-background">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{field.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{field.dataType}</span>
                  {field.validationRules.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {field.validationRules.length} rule{field.validationRules.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {field.description && <span className="text-xs text-muted-foreground">{field.description}</span>}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveField(field.id, "up")}
                  disabled={index === 0}
                  className="px-2 py-1 text-xs hover:bg-muted rounded disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveField(field.id, "down")}
                  disabled={index === fields.length - 1}
                  className="px-2 py-1 text-xs hover:bg-muted rounded disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={() => {
                    setEditingField(field)
                    setIsDialogOpen(true)
                  }}
                  className="px-2 py-1 text-xs hover:bg-muted rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteField(field.id)}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField?.name ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <FieldEditor
              field={editingField}
              dataTypes={dataTypes}
              onSave={saveField}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingField(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FieldEditor({
  field,
  dataTypes,
  onSave,
  onCancel,
}: {
  field: FieldDefinition
  dataTypes: DataType[]
  onSave: (field: FieldDefinition) => void
  onCancel: () => void
}) {
  const [editedField, setEditedField] = useState<FieldDefinition>(field)

  const addValidationRule = () => {
    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      type: "required",
      message: "",
    }
    setEditedField({
      ...editedField,
      validationRules: [...editedField.validationRules, newRule],
    })
  }

  const updateValidationRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    setEditedField({
      ...editedField,
      validationRules: editedField.validationRules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    })
  }

  const deleteValidationRule = (ruleId: string) => {
    setEditedField({
      ...editedField,
      validationRules: editedField.validationRules.filter((r) => r.id !== ruleId),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Field Name</label>
        <Input
          value={editedField.name}
          onChange={(e) => setEditedField({ ...editedField, name: e.target.value })}
          placeholder="e.g., EmployeeID"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Data Type</label>
        <Select
          value={editedField.dataType}
          onValueChange={(value) => setEditedField({ ...editedField, dataType: value as DataType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Description (Optional)</label>
        <Input
          value={editedField.description || ""}
          onChange={(e) => setEditedField({ ...editedField, description: e.target.value })}
          placeholder="Brief description of this field"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-foreground">Validation Rules</label>
          <Button onClick={addValidationRule} size="sm" variant="outline">
            Add Rule
          </Button>
        </div>
        <div className="space-y-2">
          {editedField.validationRules.map((rule) => (
            <div key={rule.id} className="flex gap-2 p-2 border border-border rounded">
              <Select
                value={rule.type}
                onValueChange={(value) => updateValidationRule(rule.id, { type: value as any })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="min">Min</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                  <SelectItem value="pattern">Pattern</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {(rule.type === "min" || rule.type === "max" || rule.type === "pattern") && (
                <Input
                  value={rule.value || ""}
                  onChange={(e) => updateValidationRule(rule.id, { value: e.target.value })}
                  placeholder="Value"
                  className="flex-1"
                />
              )}

              <Input
                value={rule.message}
                onChange={(e) => updateValidationRule(rule.id, { message: e.target.value })}
                placeholder="Error message"
                className="flex-1"
              />

              <button
                onClick={() => deleteValidationRule(rule.id)}
                className="px-2 text-red-600 hover:bg-red-50 rounded"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={() => onSave(editedField)} disabled={!editedField.name}>
          Save Field
        </Button>
      </div>
    </div>
  )
}
