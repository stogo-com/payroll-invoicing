"use client"

import { useState } from "react"
import type { FieldMapping } from "@/types/mapping"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MappingRowForm } from "./MappingRowForm"
import { ValidationRulesModal } from "./ValidationRulesModal"

interface InboundMappingTableProps {
  data: FieldMapping[]
  onUpdate: (id: string, updates: Partial<FieldMapping>) => void
  onDelete: (id: string) => void
  onCreate: (mapping: Omit<FieldMapping, "id">) => void
}

export function InboundMappingTable({ data, onUpdate, onDelete, onCreate }: InboundMappingTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [validationOpen, setValidationOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null)

  const inboundData = data.filter((m) => m.direction === "inbound")

  const handleEdit = (mapping: FieldMapping) => {
    setSelectedMapping(mapping)
    setFormOpen(true)
  }

  const handleValidation = (mapping: FieldMapping) => {
    setSelectedMapping(mapping)
    setValidationOpen(true)
  }

  const handleSaveValidation = (rules: any[]) => {
    if (selectedMapping) {
      onUpdate(selectedMapping.id, { validationRules: rules })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Inbound Field Mappings</h3>
        <Button onClick={() => setFormOpen(true)}>Add Field</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Field Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Validation Rules</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inboundData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No inbound mappings defined. Click "Add Field" to create one.
                </TableCell>
              </TableRow>
            ) : (
              inboundData.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>{mapping.order}</TableCell>
                  <TableCell className="font-medium">{mapping.fieldName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{mapping.dataType}</Badge>
                  </TableCell>
                  <TableCell>{mapping.format || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleValidation(mapping)}>
                      🛡️ {mapping.validationRules?.length || 0} rules
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(mapping)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(mapping.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <MappingRowForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedMapping(null)
        }}
        onSave={(mapping) => {
          if (selectedMapping) {
            onUpdate(selectedMapping.id, mapping)
          } else {
            onCreate(mapping)
          }
        }}
        direction="inbound"
        initialData={selectedMapping || undefined}
      />
      {selectedMapping && (
        <ValidationRulesModal
          open={validationOpen}
          onClose={() => {
            setValidationOpen(false)
            setSelectedMapping(null)
          }}
          rules={selectedMapping.validationRules || []}
          onSave={handleSaveValidation}
          fieldName={selectedMapping.fieldName}
        />
      )}
    </div>
  )
}
