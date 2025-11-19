"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { FieldMapping } from "@/types/mapping"

interface FieldMappingEditorProps {
  clientId: string
}

export function FieldMappingEditor({ clientId }: FieldMappingEditorProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchMappings()
  }, [clientId])

  const fetchMappings = async () => {
    try {
      const response = await fetch(`/api/mappings/field-mappings?clientId=${clientId}`)
      const data = await response.json()
      setMappings(data)
    } catch (error) {
      console.error("Failed to fetch mappings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMapping = async (mapping: Partial<FieldMapping>) => {
    try {
      const url = mapping.id ? `/api/mappings/field-mappings/${mapping.id}` : "/api/mappings/field-mappings"

      const method = mapping.id ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mapping, clientId }),
      })

      fetchMappings()
      setIsDialogOpen(false)
      setEditingMapping(null)
    } catch (error) {
      console.error("Failed to save mapping:", error)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return

    try {
      await fetch(`/api/mappings/field-mappings/${id}`, { method: "DELETE" })
      fetchMappings()
    } catch (error) {
      console.error("Failed to delete mapping:", error)
    }
  }

  const handlePreviewTransformation = async () => {
    if (!previewFile) return

    const formData = new FormData()
    formData.append("file", previewFile)
    formData.append("clientId", clientId)

    try {
      const response = await fetch("/api/mappings/preview", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      console.log("[v0] Preview data:", data)
      setShowPreview(true)
    } catch (error) {
      console.error("Failed to preview transformation:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMapping(null)}>Add Mapping</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMapping ? "Edit" : "Add"} Field Mapping</DialogTitle>
                <DialogDescription>Configure how a source field maps to a target field</DialogDescription>
              </DialogHeader>
              <MappingForm
                mapping={editingMapping}
                onSave={handleSaveMapping}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingMapping(null)
                }}
              />
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
              className="w-64"
            />
            <Button variant="outline" onClick={handlePreviewTransformation} disabled={!previewFile}>
              Preview Transformation
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading mappings...</div>
      ) : mappings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No field mappings configured. Add a mapping to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Field</TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead>Transform Type</TableHead>
              <TableHead>Transform Rule</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell className="font-medium">{mapping.sourceField}</TableCell>
                <TableCell>{mapping.targetField}</TableCell>
                <TableCell className="capitalize">{mapping.transformType}</TableCell>
                <TableCell className="max-w-xs truncate">{mapping.transformRule}</TableCell>
                <TableCell>{new Date(mapping.lastUpdated).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMapping(mapping)
                      setIsDialogOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteMapping(mapping.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function MappingForm({
  mapping,
  onSave,
  onCancel,
}: {
  mapping: FieldMapping | null
  onSave: (mapping: Partial<FieldMapping>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    sourceField: mapping?.sourceField || "",
    targetField: mapping?.targetField || "",
    transformType: mapping?.transformType || "string",
    transformRule: mapping?.transformRule || "",
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Source Field</Label>
        <Input
          value={formData.sourceField}
          onChange={(e) => setFormData({ ...formData, sourceField: e.target.value })}
          placeholder="e.g., employee_id"
        />
      </div>

      <div className="space-y-2">
        <Label>Target Field</Label>
        <Input
          value={formData.targetField}
          onChange={(e) => setFormData({ ...formData, targetField: e.target.value })}
          placeholder="e.g., employeeInternalId"
        />
      </div>

      <div className="space-y-2">
        <Label>Transform Type</Label>
        <Select
          value={formData.transformType}
          onValueChange={(value) => setFormData({ ...formData, transformType: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="numeric">Numeric</SelectItem>
            <SelectItem value="dateParse">Date Parse</SelectItem>
            <SelectItem value="concat">Concatenate</SelectItem>
            <SelectItem value="lookup">Lookup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Transform Rule</Label>
        <Input
          value={formData.transformRule}
          onChange={(e) => setFormData({ ...formData, transformRule: e.target.value })}
          placeholder="e.g., trim() or parseFloat() or lookup(employee_map)"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave({ ...mapping, ...formData })}>Save</Button>
      </DialogFooter>
    </div>
  )
}
