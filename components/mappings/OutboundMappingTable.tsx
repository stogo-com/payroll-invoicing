"use client"

import { useState } from "react"
import type { FieldMapping } from "@/types/mapping"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MappingRowForm } from "./MappingRowForm"

interface OutboundMappingTableProps {
  data: FieldMapping[]
  onUpdate: (id: string, updates: Partial<FieldMapping>) => void
  onDelete: (id: string) => void
  onCreate: (mapping: Omit<FieldMapping, "id">) => void
}

export function OutboundMappingTable({ data, onUpdate, onDelete, onCreate }: OutboundMappingTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null)

  const outboundData = data.filter((m) => m.direction === "outbound")

  const handleEdit = (mapping: FieldMapping) => {
    setSelectedMapping(mapping)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Outbound Field Mappings</h3>
        <Button onClick={() => setFormOpen(true)}>Add Mapping</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Field</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead>Transformation Rule</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outboundData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No outbound mappings defined. Click "Add Mapping" to create one.
                </TableCell>
              </TableRow>
            ) : (
              outboundData.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.fieldName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{mapping.dataType}</Badge>
                  </TableCell>
                  <TableCell>{mapping.targetField || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{mapping.transformation || "-"}</TableCell>
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
        direction="outbound"
        initialData={selectedMapping || undefined}
      />
    </div>
  )
}
