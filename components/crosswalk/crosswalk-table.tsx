"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Plus, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CrosswalkMapping {
  networkId: string
  networkEmployeeId: string
  internalEmployeeId: string
  activeFlag: boolean
  notes?: string
}

const mockCrosswalkData: CrosswalkMapping[] = [
  {
    networkId: "19",
    networkEmployeeId: "204275",
    internalEmployeeId: "INT-204275",
    activeFlag: true,
    notes: "Primary assignment - Safety Attendant",
  },
  {
    networkId: "19",
    networkEmployeeId: "204276",
    internalEmployeeId: "INT-204276",
    activeFlag: true,
  },
  {
    networkId: "16",
    networkEmployeeId: "WK001",
    internalEmployeeId: "INT-204277",
    activeFlag: true,
    notes: "Floating nurse - multiple departments",
  },
  {
    networkId: "21",
    networkEmployeeId: "SH123",
    internalEmployeeId: "INT-204278",
    activeFlag: false,
    notes: "Inactive - terminated employment",
  },
]

interface CrosswalkTableProps {
  onMappingChange?: (mappings: CrosswalkMapping[]) => void
}

export function CrosswalkTable({ onMappingChange }: CrosswalkTableProps) {
  const [mappings, setMappings] = useState<CrosswalkMapping[]>(mockCrosswalkData)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [editingMapping, setEditingMapping] = useState<CrosswalkMapping | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.networkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.networkEmployeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.internalEmployeeId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredMappings.map((m) => `${m.networkId}-${m.networkEmployeeId}`))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, key])
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== key))
    }
  }

  const handleEdit = (mapping: CrosswalkMapping) => {
    setEditingMapping(mapping)
  }

  const handleDelete = (mapping: CrosswalkMapping) => {
    const newMappings = mappings.filter(
      (m) => !(m.networkId === mapping.networkId && m.networkEmployeeId === mapping.networkEmployeeId),
    )
    setMappings(newMappings)
    onMappingChange?.(newMappings)
  }

  const handleSave = (mapping: CrosswalkMapping) => {
    if (editingMapping) {
      const newMappings = mappings.map((m) =>
        m.networkId === editingMapping.networkId && m.networkEmployeeId === editingMapping.networkEmployeeId
          ? mapping
          : m,
      )
      setMappings(newMappings)
      onMappingChange?.(newMappings)
    } else {
      const newMappings = [...mappings, mapping]
      setMappings(newMappings)
      onMappingChange?.(newMappings)
    }
    setEditingMapping(null)
    setIsAddDialogOpen(false)
  }

  const handleBulkDelete = () => {
    const keysToDelete = new Set(selectedRows)
    const newMappings = mappings.filter((m) => !keysToDelete.has(`${m.networkId}-${m.networkEmployeeId}`))
    setMappings(newMappings)
    setSelectedRows([])
    onMappingChange?.(newMappings)
  }

  const handleBulkToggleActive = () => {
    const keysToToggle = new Set(selectedRows)
    const newMappings = mappings.map((m) => {
      if (keysToToggle.has(`${m.networkId}-${m.networkEmployeeId}`)) {
        return { ...m, activeFlag: !m.activeFlag }
      }
      return m
    })
    setMappings(newMappings)
    setSelectedRows([])
    onMappingChange?.(newMappings)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mappings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <CrosswalkEditDialog mapping={null} onSave={handleSave} onCancel={() => setIsAddDialogOpen(false)} />
          </Dialog>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedRows.length} mapping{selectedRows.length > 1 ? "s" : ""} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkToggleActive}>
            Toggle Active
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === filteredMappings.length && filteredMappings.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Network Employee ID</TableHead>
              <TableHead>Internal Employee ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.map((mapping) => {
              const key = `${mapping.networkId}-${mapping.networkEmployeeId}`
              return (
                <TableRow key={key}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(key)}
                      onCheckedChange={(checked) => handleSelectRow(key, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {mapping.networkId} - {getNetworkName(mapping.networkId)}
                  </TableCell>
                  <TableCell>{mapping.networkEmployeeId}</TableCell>
                  <TableCell>{mapping.internalEmployeeId}</TableCell>
                  <TableCell>
                    <Badge variant={mapping.activeFlag ? "default" : "secondary"}>
                      {mapping.activeFlag ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{mapping.notes || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(mapping)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(mapping)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {editingMapping && (
        <CrosswalkEditDialog
          mapping={editingMapping}
          onSave={handleSave}
          onCancel={() => setEditingMapping(null)}
          open={true}
        />
      )}
    </div>
  )
}

interface CrosswalkEditDialogProps {
  mapping: CrosswalkMapping | null
  onSave: (mapping: CrosswalkMapping) => void
  onCancel: () => void
  open?: boolean
}

function CrosswalkEditDialog({ mapping, onSave, onCancel, open }: CrosswalkEditDialogProps) {
  const [formData, setFormData] = useState<CrosswalkMapping>(
    mapping || {
      networkId: "",
      networkEmployeeId: "",
      internalEmployeeId: "",
      activeFlag: true,
      notes: "",
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mapping ? "Edit Mapping" : "Add New Mapping"}</DialogTitle>
        <DialogDescription>
          {mapping ? "Update the employee crosswalk mapping" : "Create a new employee crosswalk mapping"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="networkId">Network</Label>
            <Select
              value={formData.networkId}
              onValueChange={(value) => setFormData({ ...formData, networkId: value })}
              disabled={!!mapping}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="13">13 - Lehigh Valley</SelectItem>
                <SelectItem value="16">16 - Willis Knighton</SelectItem>
                <SelectItem value="18">18 - Baptist Arkansas</SelectItem>
                <SelectItem value="19">19 - UofL</SelectItem>
                <SelectItem value="21">21 - Parrish Medical Center</SelectItem>
                <SelectItem value="29">29 - Arkansas Childrens</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="networkEmployeeId">Network Employee ID</Label>
            <Input
              id="networkEmployeeId"
              value={formData.networkEmployeeId}
              onChange={(e) => setFormData({ ...formData, networkEmployeeId: e.target.value })}
              placeholder="204275"
              required
              disabled={!!mapping}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="internalEmployeeId">Internal Employee ID</Label>
          <Input
            id="internalEmployeeId"
            value={formData.internalEmployeeId}
            onChange={(e) => setFormData({ ...formData, internalEmployeeId: e.target.value })}
            placeholder="INT-204275"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="activeFlag"
            checked={formData.activeFlag}
            onCheckedChange={(checked) => setFormData({ ...formData, activeFlag: !!checked })}
          />
          <Label htmlFor="activeFlag">Active</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this mapping..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{mapping ? "Update" : "Create"} Mapping</Button>
        </div>
      </form>
    </DialogContent>
  )
}

function getNetworkName(networkId: string): string {
  const networks: Record<string, string> = {
    "13": "Lehigh Valley",
    "16": "Willis Knighton",
    "18": "Baptist Arkansas",
    "19": "UofL",
    "21": "Parrish Medical Center",
    "29": "Arkansas Childrens",
  }
  return networks[networkId] || "Unknown Network"
}
