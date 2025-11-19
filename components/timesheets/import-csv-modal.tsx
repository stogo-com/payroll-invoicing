"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface ImportResult {
  matched: number
  needsReview: number
  errors: number
  message: string
  data?: any[]
}

interface ImportCSVModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (result: ImportResult) => void
}

export function ImportCSVModal({ open, onOpenChange, onImportComplete }: ImportCSVModalProps) {
  const [selectedClient, setSelectedClient] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === "text/csv") {
      setUploadedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  })

  const handleImport = async () => {
    if (!uploadedFile || !selectedClient) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setUploadProgress(100)

      const mockData =
        selectedClient === "Lehigh Valley"
          ? [
              {
                timesheetId: `imported-${Date.now()}-1`,
                networkId: "13",
                externalEmployeeId: "CW100113",
                employeeName: "Test Employee 1",
                clockInDate: "2025-01-15",
                clockInTime: "07:00:00",
                clockOutDate: "2025-01-15",
                clockOutTime: "19:00:00",
                facilityName: "LEHIGH VALLEY HOSPITAL - Lehigh Valley Health Network",
                costCenterNumber: "9441",
                costCenterDescription: "ICU - Critical Care",
                status: "matched",
                incentiveFlag: true,
                approvalDate: new Date().toLocaleString(),
                approvalDecision: "Yes",
                approvedBy: "System Import",
                dynamicFields: {
                  Network: "13 - Lehigh Valley",
                  "Facility Name": "LEHIGH VALLEY HOSPITAL - Lehigh Valley Health Network",
                  "Department Name": "9441 - ICU - Critical Care",
                  "External Employee ID": "CW100113",
                  "Employee Name": "Test Employee 1",
                  "Clock In Date": "2025-01-15",
                  "Clock In Time": "07:00:00",
                  "Clock Out Date": "2025-01-15",
                  "Clock Out Time": "19:00:00",
                  "Suggested Shift": "Day Shift 7a-7p",
                  "Match Status": "Matched",
                  Incentive: "Day shift differential",
                  "Approval Date": new Date().toLocaleString(),
                  "Approval Decision": "Yes",
                  "Approved By": "System Import",
                  "In-Clocking GUID": "6D505809-3E75-488C-BB67-E8E3C028A256",
                  Hours: "12.00",
                  "Pay Code": "REG CW",
                  Lunch: "Yes",
                },
              },
              {
                timesheetId: `imported-${Date.now()}-2`,
                networkId: "13",
                externalEmployeeId: "CW100114",
                employeeName: "Test Employee 2",
                clockInDate: "2025-01-15",
                clockInTime: "19:00:00",
                clockOutDate: "2025-01-16",
                clockOutTime: "07:30:00",
                facilityName: "LEHIGH VALLEY HOSPITAL - Lehigh Valley Health Network",
                costCenterNumber: "9442",
                costCenterDescription: "Emergency Department",
                status: "needs_review",
                incentiveFlag: false,
                approvalDate: new Date().toLocaleString(),
                approvalDecision: "No",
                errorMessage: "Shift overlap detected - needs manual review",
                dynamicFields: {
                  Network: "13 - Lehigh Valley",
                  "Facility Name": "LEHIGH VALLEY HOSPITAL - Lehigh Valley Health Network",
                  "Department Name": "9442 - Emergency Department",
                  "External Employee ID": "CW100114",
                  "Employee Name": "Test Employee 2",
                  "Clock In Date": "2025-01-15",
                  "Clock In Time": "19:00:00",
                  "Clock Out Date": "2025-01-16",
                  "Clock Out Time": "07:30:00",
                  "Suggested Shift": "Night Shift 7p-7a",
                  "Match Status": "Needs Review",
                  Incentive: "No incentive available",
                  "Approval Date": new Date().toLocaleString(),
                  "Approval Decision": "No",
                  "Approved By": "System Import",
                  "In-Clocking GUID": "7E505809-3E75-488C-BB67-E8E3C028A257",
                  Hours: "12.50",
                  "Pay Code": "REG CW",
                  Lunch: "No",
                },
              },
            ]
          : []

      const result: ImportResult = {
        matched: mockData.filter((d) => d.status === "matched").length,
        needsReview: mockData.filter((d) => d.status === "needs_review").length,
        errors: 0,
        message: "Import completed successfully",
        data: mockData,
      }

      setImportResult(result)
      onImportComplete?.(result)

      // Reset after showing result
      setTimeout(() => {
        setUploadedFile(null)
        setSelectedClient("")
        setImportResult(null)
        setUploadProgress(0)
        onOpenChange(false)
      }, 3000)
    } catch (error) {
      console.error("Import failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setImportResult(null)
    setUploadProgress(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import CSV Timesheets</DialogTitle>
          <DialogDescription>Upload a CSV file containing timesheet data for processing and matching</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose the client for this import" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lehigh Valley">Lehigh Valley</SelectItem>
                <SelectItem value="UofL">University of Louisville</SelectItem>
                <SelectItem value="Willis Knight">Willis Knight</SelectItem>
                <SelectItem value="Shannon">Shannon Medical</SelectItem>
                <SelectItem value="Baptist Arkansas">Baptist Arkansas</SelectItem>
                <SelectItem value="AR Children's">AR Children's Hospital</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  <p className="text-sm text-muted-foreground">Only CSV files are accepted (max 10MB)</p>
                </div>
              )}
            </div>
          )}

          {/* Uploaded File Info */}
          {uploadedFile && !importResult && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="outline" size="sm" onClick={resetUpload}>
                Remove
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{importResult.message}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-600">{importResult.matched}</span> Matched
                    </div>
                    <div>
                      <span className="font-medium text-yellow-600">{importResult.needsReview}</span> Need Review
                    </div>
                    <div>
                      <span className="font-medium text-red-600">{importResult.errors}</span> Errors
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!uploadedFile || !selectedClient || isUploading}>
              {isUploading ? "Processing..." : "Import CSV"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
