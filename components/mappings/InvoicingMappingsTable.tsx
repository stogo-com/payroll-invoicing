"use client"

import { useState } from "react"
import type { FieldMapping } from "@/types/mapping"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MappingRowForm } from "./MappingRowForm"
import { useMappings } from "@/hooks/useMappings"

interface InvoicingMappingsTableProps {
  networkId: string
}

export function InvoicingMappingsTable({ networkId }: InvoicingMappingsTableProps) {
  const { data, createMapping, updateMapping, deleteMapping } = useMappings(networkId, "invoicing")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null)

  const handleEdit = (mapping: FieldMapping) => {
    setSelectedMapping(mapping)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invoicing Field Mappings</h3>
        <Button onClick={() => setFormOpen(true)}>Add Field</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No invoicing mappings defined. Click "Add Field" to create one.
                </TableCell>
              </TableRow>
            ) : (
              data.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.fieldName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{mapping.dataType}</Badge>
                  </TableCell>
                  <TableCell>{mapping.format || "-"}</TableCell>
                  <TableCell>{mapping.targetField || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(mapping)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMapping(mapping.id)}>
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
            updateMapping(selectedMapping.id, mapping)
          } else {
            createMapping(mapping)
          }
        }}
        direction="inbound"
        initialData={selectedMapping || undefined}
      />
    </div>
  )
}
