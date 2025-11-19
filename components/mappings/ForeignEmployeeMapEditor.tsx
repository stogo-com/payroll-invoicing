"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ForeignEmployeeMap } from "@/types/mapping"

interface ForeignEmployeeMapEditorProps {
  clientId: string
}

export function ForeignEmployeeMapEditor({ clientId }: ForeignEmployeeMapEditorProps) {
  const [maps, setMaps] = useState<ForeignEmployeeMap[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMaps()
  }, [clientId])

  const fetchMaps = async () => {
    try {
      const response = await fetch(`/api/mappings/employee-maps?clientId=${clientId}`)
      const data = await response.json()
      setMaps(data)
    } catch (error) {
      console.error("Failed to fetch employee maps:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("clientId", clientId)

    try {
      await fetch("/api/mappings/employee-maps/bulk", {
        method: "POST",
        body: formData,
      })
      fetchMaps()
    } catch (error) {
      console.error("Failed to upload employee maps:", error)
    }
  }

  const filteredMaps = maps.filter(
    (map) =>
      map.clientEmployeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      map.internalEmployeeId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
            className="w-64"
          />
          <Button>Add Mapping</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading employee mappings...</div>
      ) : filteredMaps.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No employee mappings found. Upload a CSV file to bulk import mappings.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Employee ID</TableHead>
              <TableHead>Internal Employee ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaps.map((map) => (
              <TableRow key={map.id}>
                <TableCell className="font-medium">{map.clientEmployeeId}</TableCell>
                <TableCell>{map.internalEmployeeId}</TableCell>
                <TableCell>
                  <Badge variant={map.active ? "default" : "secondary"}>{map.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>{new Date(map.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Edit
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
