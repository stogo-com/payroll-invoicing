"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface CrosswalkMapping {
  clientId: string
  clientEmployeeId: string
  internalEmployeeId: string
  activeFlag: boolean
  notes?: string
}

interface ImportResult {
  success: number
  errors: number
  warnings: number
  details: Array<{
    row: number
    type: "success" | "error" | "warning"
    message: string
  }>
}

interface CSVImportExportProps {
  mappings: CrosswalkMapping[]
  onImport?: (mappings: CrosswalkMapping[]) => void
}

export function CSVImportExport({ mappings, onImport }: CSVImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === "text/csv") {
      setUploadedFile(file)
      // Parse CSV for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",")
        const preview = lines.slice(1, 6).map((line, index) => {
          const values = line.split(",")
          return headers.reduce((obj, header, i) => {
            obj[header.trim()] = values[i]?.trim() || ""
            return obj
          }, {} as any)
        })
        setPreviewData(preview)
      }
      reader.readAsText(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  })

  const handleExport = () => {
    const csvContent = [
      "Client ID,Client Employee ID,Internal Employee ID,Active,Notes",
      ...mappings.map(
        (m) =>
          `${m.clientId},${m.clientEmployeeId},${m.internalEmployeeId},${m.activeFlag ? "Yes" : "No"},"${
            m.notes || ""
          }"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `crosswalk-mappings-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Simulate processing
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setProgress(100)

      // Mock import result
      const result: ImportResult = {
        success: 15,
        errors: 2,
        warnings: 1,
        details: [
          { row: 1, type: "success", message: "Mapping created successfully" },
          { row: 2, type: "success", message: "Mapping updated successfully" },
          { row: 3, type: "error", message: "Invalid client ID" },
          { row: 4, type: "warning", message: "Duplicate mapping found, skipped" },
          { row: 5, type: "error", message: "Missing internal employee ID" },
        ],
      }

      setImportResult(result)

      // Mock imported mappings
      const newMappings: CrosswalkMapping[] = [
        {
          clientId: "UofL",
          clientEmployeeId: "NEW001",
          internalEmployeeId: "INT-NEW001",
          activeFlag: true,
          notes: "Imported from CSV",
        },
      ]

      onImport?.(newMappings)
    } catch (error) {
      console.error("Import failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetImport = () => {
    setUploadedFile(null)
    setPreviewData([])
    setImportResult(null)
    setProgress(0)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Import CSV
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Crosswalk Mappings</DialogTitle>
            <DialogDescription>
              Upload a CSV file with employee crosswalk mappings. Expected columns: Client ID, Client Employee ID,
              Internal Employee ID, Active, Notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload */}
            {!uploadedFile && !importResult && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg">Drop the CSV file here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">Drag & drop a CSV file here, or click to select</p>
                    <p className="text-sm text-muted-foreground">Only CSV files are accepted</p>
                  </div>
                )}
              </div>
            )}

            {/* File Preview */}
            {uploadedFile && previewData.length > 0 && !importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">Preview of first 5 rows</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetImport}>
                    Remove
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(previewData[0] || {}).map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, i) => (
                            <TableCell key={i}>{value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing mappings...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import completed</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-600">{importResult.success}</span> Success
                        </div>
                        <div>
                          <span className="font-medium text-yellow-600">{importResult.warnings}</span> Warnings
                        </div>
                        <div>
                          <span className="font-medium text-red-600">{importResult.errors}</span> Errors
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Detailed Results */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.row}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {detail.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {detail.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                              {detail.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                              <span className="capitalize">{detail.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{detail.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                {importResult ? "Close" : "Cancel"}
              </Button>
              {uploadedFile && !importResult && (
                <Button onClick={handleImport} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Import Mappings"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
