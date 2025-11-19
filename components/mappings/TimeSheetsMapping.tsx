"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { FieldDefinition, FieldMapping } from "@/types/field-schema"

export function TimeSheetsMapping({ clientId }: { clientId: number }) {
  const [inputFields] = useState<FieldDefinition[]>([
    { id: "1", name: "EmployeeID", dataType: "string", order: 1, validationRules: [] },
    { id: "2", name: "FirstName", dataType: "string", order: 2, validationRules: [] },
    { id: "3", name: "LastName", dataType: "string", order: 3, validationRules: [] },
    { id: "4", name: "In-Clocking GUID", dataType: "guid", order: 4, validationRules: [] },
    { id: "5", name: "Hours", dataType: "decimal", order: 5, validationRules: [] },
    { id: "6", name: "Paycode", dataType: "string", order: 6, validationRules: [] },
    { id: "7", name: "In-Clocking Date", dataType: "date", order: 7, validationRules: [] },
    { id: "8", name: "In-Clocking Time", dataType: "string", order: 8, validationRules: [] },
    { id: "9", name: "Out-Clocking Date", dataType: "date", order: 9, validationRules: [] },
    { id: "10", name: "Out-Clocking Time", dataType: "string", order: 10, validationRules: [] },
    { id: "11", name: "Company", dataType: "string", order: 11, validationRules: [] },
    { id: "12", name: "Cost Center", dataType: "string", order: 12, validationRules: [] },
  ])

  const [outputFields] = useState<FieldDefinition[]>([
    { id: "o1", name: "id", dataType: "integer", order: 1, validationRules: [] },
    { id: "o2", name: "status", dataType: "string", order: 2, validationRules: [], description: "Timeclock Status" },
    { id: "o3", name: "shift_id", dataType: "integer", order: 3, validationRules: [] },
    {
      id: "o4",
      name: "internal_status",
      dataType: "string",
      order: 4,
      validationRules: [],
      description: "Internal Status",
    },
    {
      id: "o5",
      name: "timesheet_state",
      dataType: "string",
      order: 5,
      validationRules: [],
      description: "Timesheet State",
    },
    {
      id: "o6",
      name: "approval_date",
      dataType: "datetime",
      order: 6,
      validationRules: [],
      description: "Approval Date",
    },
    {
      id: "o7",
      name: "approval_decision",
      dataType: "string",
      order: 7,
      validationRules: [],
      description: "Approval Decision",
    },
    {
      id: "o8",
      name: "approved_by_id",
      dataType: "integer",
      order: 8,
      validationRules: [],
      description: "Approved By",
    },
    {
      id: "o9",
      name: "approval_comments",
      dataType: "string",
      order: 9,
      validationRules: [],
      description: "Approval Comments",
    },
    { id: "o10", name: "submitted", dataType: "datetime", order: 10, validationRules: [], description: "Submitted" },
    { id: "o11", name: "employee_id", dataType: "string", order: 11, validationRules: [] },
    { id: "o12", name: "clock_in", dataType: "datetime", order: 12, validationRules: [] },
    { id: "o13", name: "clock_out", dataType: "datetime", order: 13, validationRules: [] },
    { id: "o14", name: "hours_worked", dataType: "decimal", order: 14, validationRules: [] },
  ])

  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    {
      id: "m1",
      mappingType: "input-to-output",
      sourceFieldId: "1",
      targetFieldId: "o11",
      transformRule: "Direct copy",
    },
    {
      id: "m2",
      mappingType: "input-to-output",
      sourceFieldId: "7",
      targetFieldId: "o12",
      transformRule: "Combine In-Clocking Date and In-Clocking Time into datetime format",
    },
    {
      id: "m3",
      mappingType: "output-only",
      targetFieldId: "o2",
      defaultValueType: "dropdown",
      dropdownOptions: [
        "Future",
        "Start",
        "Active",
        "Resume",
        "Over",
        "Locked",
        "Approved",
        "Submitted to Payroll",
        "Invoiced",
      ],
    },
    {
      id: "m4",
      mappingType: "output-only",
      targetFieldId: "o10",
      defaultValueType: "system-generated",
      systemGeneratedRule: "Auto-generated timestamp when message is sent to payroll system",
    },
  ])

  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addMapping = () => {
    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      mappingType: "input-to-output",
      targetFieldId: "",
    }
    setEditingMapping(newMapping)
    setIsDialogOpen(true)
  }

  const saveMapping = (mapping: FieldMapping) => {
    if (fieldMappings.find((m) => m.id === mapping.id)) {
      setFieldMappings(fieldMappings.map((m) => (m.id === mapping.id ? mapping : m)))
    } else {
      setFieldMappings([...fieldMappings, mapping])
    }
    setIsDialogOpen(false)
    setEditingMapping(null)
  }

  const deleteMapping = (mappingId: string) => {
    setFieldMappings(fieldMappings.filter((m) => m.id !== mappingId))
  }

  const getFieldById = (fieldId: string | undefined, fields: FieldDefinition[]) => {
    if (!fieldId) return null
    return fields.find((f) => f.id === fieldId)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">Time Sheets Field Mapping</h3>
          <p className="text-muted-foreground max-w-2xl">
            Map input CSV fields to database output fields, or configure output-only fields with default values and
            system-generated rules.
          </p>
        </div>
        <Button onClick={addMapping} size="lg" className="shadow-sm">
          + Add Field Mapping
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Field Mappings</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {fieldMappings.length} {fieldMappings.length === 1 ? "mapping" : "mappings"} configured
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground w-[15%]">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground w-[25%]">
                  Input Field
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">CSV Source</span>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground w-[30%]">
                  Transformation / Default Value
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">Processing Rule</span>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground w-[25%]">
                  Output Field
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">Database Target</span>
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-foreground w-[5%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fieldMappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">→</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">No field mappings defined yet</p>
                        <p className="text-sm text-muted-foreground">
                          Click "Add Field Mapping" to create your first mapping
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                fieldMappings.map((mapping) => {
                  const inputField = getFieldById(mapping.sourceFieldId, inputFields)
                  const outputField = getFieldById(mapping.targetFieldId, outputFields)

                  return (
                    <tr key={mapping.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-5 px-6">
                        <Badge
                          variant={mapping.mappingType === "input-to-output" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {mapping.mappingType === "input-to-output" ? "Input→Output" : "Output Only"}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        {mapping.mappingType === "input-to-output" && inputField ? (
                          <div className="space-y-2">
                            <div className="font-semibold text-foreground text-base">{inputField.name}</div>
                            <Badge variant="outline" className="font-mono text-xs">
                              {inputField.dataType}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No input field</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {mapping.mappingType === "input-to-output" ? (
                          <div className="text-sm text-foreground">
                            {mapping.transformRule || <span className="text-muted-foreground italic">Direct copy</span>}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Badge variant="secondary" className="text-xs">
                              {mapping.defaultValueType === "static" && "Static Value"}
                              {mapping.defaultValueType === "dropdown" && "Dropdown Options"}
                              {mapping.defaultValueType === "api-call" && "API Call"}
                              {mapping.defaultValueType === "system-generated" && "System Generated"}
                            </Badge>
                            {mapping.defaultValueType === "static" && (
                              <div className="text-sm text-foreground">{mapping.defaultValue}</div>
                            )}
                            {mapping.defaultValueType === "dropdown" && (
                              <div className="text-xs text-muted-foreground">
                                Options: {mapping.dropdownOptions?.join(", ")}
                              </div>
                            )}
                            {mapping.defaultValueType === "api-call" && (
                              <div className="text-xs text-muted-foreground font-mono">{mapping.apiEndpoint}</div>
                            )}
                            {mapping.defaultValueType === "system-generated" && (
                              <div className="text-sm text-foreground">{mapping.systemGeneratedRule}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-2">
                          <div className="font-semibold text-foreground text-base">
                            {outputField?.name || "Unknown"}
                          </div>
                          {outputField?.description && (
                            <div className="text-xs text-muted-foreground">{outputField.description}</div>
                          )}
                          <Badge variant="outline" className="font-mono text-xs">
                            {outputField?.dataType || "unknown"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setEditingMapping(mapping)
                              setIsDialogOpen(true)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMapping(mapping.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mapping Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMapping?.sourceFieldId ? "Edit Field Mapping" : "Add New Field Mapping"}</DialogTitle>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Mapping Type</label>
        <Select
          value={editedMapping.mappingType}
          onValueChange={(value: "input-to-output" | "output-only") =>
            setEditedMapping({
              ...editedMapping,
              mappingType: value,
              sourceFieldId: value === "output-only" ? undefined : editedMapping.sourceFieldId,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="input-to-output">Input → Output (Map CSV field to database)</SelectItem>
            <SelectItem value="output-only">Output Only (System-generated or default value)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {editedMapping.mappingType === "input-to-output" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Input Field (CSV Source)</label>
          <Select
            value={editedMapping.sourceFieldId}
            onValueChange={(value) => setEditedMapping({ ...editedMapping, sourceFieldId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select input field from CSV" />
            </SelectTrigger>
            <SelectContent>
              {inputFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    <span>{field.name}</span>
                    <span className="text-xs text-muted-foreground">({field.dataType})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Output Field (Database Target)</label>
        <Select
          value={editedMapping.targetFieldId}
          onValueChange={(value) => setEditedMapping({ ...editedMapping, targetFieldId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select output field in database" />
          </SelectTrigger>
          <SelectContent>
            {outputFields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                <div className="flex items-center gap-2">
                  <span>{field.name}</span>
                  {field.description && <span className="text-xs text-muted-foreground">- {field.description}</span>}
                  <span className="text-xs text-muted-foreground">({field.dataType})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {editedMapping.mappingType === "input-to-output" ? (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Transformation Rule (Optional)</label>
          <Input
            value={editedMapping.transformRule || ""}
            onChange={(e) => setEditedMapping({ ...editedMapping, transformRule: e.target.value })}
            placeholder="e.g., Combine date and time fields into datetime format"
          />
          <p className="text-xs text-muted-foreground">
            Describe how the input field should be transformed before mapping to output
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Default Value Type</label>
            <Select
              value={editedMapping.defaultValueType}
              onValueChange={(value: "static" | "dropdown" | "api-call" | "system-generated") =>
                setEditedMapping({ ...editedMapping, defaultValueType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select how this field gets its value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static Value</SelectItem>
                <SelectItem value="dropdown">Dropdown Options</SelectItem>
                <SelectItem value="api-call">API Call</SelectItem>
                <SelectItem value="system-generated">System Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editedMapping.defaultValueType === "static" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Default Value</label>
              <Input
                value={editedMapping.defaultValue || ""}
                onChange={(e) => setEditedMapping({ ...editedMapping, defaultValue: e.target.value })}
                placeholder="Enter default value"
              />
            </div>
          )}

          {editedMapping.defaultValueType === "dropdown" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Dropdown Options</label>
              <Input
                value={editedMapping.dropdownOptions?.join(", ") || ""}
                onChange={(e) =>
                  setEditedMapping({
                    ...editedMapping,
                    dropdownOptions: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                placeholder="Enter options separated by commas"
              />
              <p className="text-xs text-muted-foreground">Example: Future, Start, Active, Resume, Over, Locked</p>
            </div>
          )}

          {editedMapping.defaultValueType === "api-call" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">API Endpoint</label>
              <Input
                value={editedMapping.apiEndpoint || ""}
                onChange={(e) => setEditedMapping({ ...editedMapping, apiEndpoint: e.target.value })}
                placeholder="/api/managers?network=..."
              />
              <p className="text-xs text-muted-foreground">
                API endpoint to fetch dynamic values (e.g., list of managers)
              </p>
            </div>
          )}

          {editedMapping.defaultValueType === "system-generated" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">System Generation Rule</label>
              <Input
                value={editedMapping.systemGeneratedRule || ""}
                onChange={(e) => setEditedMapping({ ...editedMapping, systemGeneratedRule: e.target.value })}
                placeholder="Describe how the system generates this value"
              />
              <p className="text-xs text-muted-foreground">
                Example: Auto-generated timestamp when message is sent to payroll
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editedMapping)}
          disabled={
            !editedMapping.targetFieldId ||
            (editedMapping.mappingType === "input-to-output" && !editedMapping.sourceFieldId)
          }
        >
          Save Mapping
        </Button>
      </div>
    </div>
  )
}
