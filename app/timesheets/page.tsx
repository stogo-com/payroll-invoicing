"use client"

import { useState, useEffect } from "react"
import { TimesheetFilters } from "@/components/timesheets/timesheet-filters"
import { ManualTimesheetModal } from "@/components/timesheets/manual-timesheet-modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PayPeriodPicker } from "@/components/dashboard/pay-period-picker"
import { useToast } from "@/hooks/use-toast"
import { parseCSV } from "@/lib/lvhn-payroll-transformer"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Helper function to get last week's pay period (Sunday to Saturday)
function getLastWeekPayPeriod(): { from: Date; to: Date } {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const thisWeekSunday = new Date(today)
  thisWeekSunday.setDate(today.getDate() - today.getDay())
  thisWeekSunday.setHours(0, 0, 0, 0)
  const lastWeekSunday = new Date(thisWeekSunday)
  lastWeekSunday.setDate(thisWeekSunday.getDate() - 7)
  lastWeekSunday.setHours(0, 0, 0, 0)
  const lastWeekSaturday = new Date(lastWeekSunday)
  lastWeekSaturday.setDate(lastWeekSunday.getDate() + 6)
  lastWeekSaturday.setHours(23, 59, 59, 999)
  return { from: lastWeekSunday, to: lastWeekSaturday }
}

export default function TimesheetsPage() {
  const [manualTimesheetOpen, setManualTimesheetOpen] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [editedTimesheets, setEditedTimesheets] = useState<Set<string>>(new Set())
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const [payPeriod, setPayPeriod] = useState<{ from: Date; to: Date }>(() => getLastWeekPayPeriod())
  const [uploadedFiles, setUploadedFiles] = useState<{
    contingentWorker?: File
    manualAdds?: File
  }>({})
  const [combinedTimesheetData, setCombinedTimesheetData] = useState<any[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const { toast } = useToast()

  const handleNetworkChange = (value: string) => {
    setSelectedNetwork(value)
  }

  // Helper function to parse both CSV and Excel files
  const parseFile = async (file: File): Promise<any[]> => {
    const fileName = file.name.toLowerCase()
    const arrayBuffer = await file.arrayBuffer()
    const firstBytes = new Uint8Array(arrayBuffer.slice(0, 2))
    const isExcelByContent = firstBytes[0] === 0x50 && firstBytes[1] === 0x4B // "PK" signature
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || isExcelByContent
    
    if (isExcel) {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      return jsonData
    } else {
      const text = await file.text()
      return parseCSV(text)
    }
  }

  const handleFileUpload = (fileType: string, file: File | null) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: file || undefined,
    }))
  }

  // Combine files when both are uploaded
  useEffect(() => {
    const combineFiles = async () => {
      if (!uploadedFiles.contingentWorker) {
        setCombinedTimesheetData([])
        return
      }

      setIsLoadingFiles(true)
      try {
        const clientData = await parseFile(uploadedFiles.contingentWorker)
        let additionalData: any[] = []
        
        if (uploadedFiles.manualAdds) {
          additionalData = await parseFile(uploadedFiles.manualAdds)
        }

        // Combine both datasets
        const combined = [...clientData, ...additionalData]
        setCombinedTimesheetData(combined)

        toast({
          title: "Files loaded",
          description: `Loaded ${combined.length} timesheet records (${clientData.length} from Client Time Sheets${additionalData.length > 0 ? `, ${additionalData.length} from Additional Time Sheets` : ''})`,
        })
      } catch (error) {
        console.error("[Timesheets] Error parsing files:", error)
        toast({
          title: "Error loading files",
          description: error instanceof Error ? error.message : "Failed to parse uploaded files",
          variant: "destructive",
        })
        setCombinedTimesheetData([])
      } finally {
        setIsLoadingFiles(false)
      }
    }

    combineFiles()
  }, [uploadedFiles.contingentWorker, uploadedFiles.manualAdds, toast])

  const handleSendTimesheets = () => {
    console.log("[v0] Sending all approved timesheets")
    setShowSendDialog(false)
    // TODO: Implement API call to scheduling application
  }

  const handleUpdateTimesheets = () => {
    console.log("[v0] Updating", editedTimesheets.size, "timesheets")
    setShowUpdateDialog(false)
    setEditedTimesheets(new Set())
    // TODO: Implement API call to update timesheets
  }

  const handleManualTimesheetCreate = (timesheetData: any) => {
    console.log("Created manual timesheet:", timesheetData)
  }

  const getSendSummary = () => {
    const mockApprovedCount = 15
    const networkName = selectedNetwork ? getNetworkName(selectedNetwork) : "All Networks"
    return { count: mockApprovedCount, network: networkName }
  }

  const getNetworkName = (networkId: string): string => {
    const networks: Record<string, string> = {
      "LVHN": "Lehigh Valley Health Network (LVHN)",
      "Arkansas": "Arkansas Children's",
      "Louisville": "University of Louisville",
      "DMH": "Dosher Memorial Hospital",
    }
    return networks[networkId] || "Unknown Network"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-semibold text-foreground leading-tight">Time Sheets</h1>
        <div className="flex gap-2">
          <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={editedTimesheets.size === 0}>
                <span className="mr-2">💾</span>
                Update Timesheets
                {editedTimesheets.size > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {editedTimesheets.size}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Timesheets</DialogTitle>
                <DialogDescription>
                  Are you sure that you want to sync {editedTimesheets.size} timesheet update
                  {editedTimesheets.size !== 1 ? "s" : ""}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTimesheets}>Update Timesheets</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setManualTimesheetOpen(true)} disabled={!selectedNetwork}>
            <span className="mr-2">➕</span>
            Add Manual Timesheet
          </Button>
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button disabled={!selectedNetwork}>
                <span className="mr-2">📤</span>
                Send Time Sheets
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Time Sheets</DialogTitle>
                <DialogDescription>
                  You are about to create {getSendSummary().count} time sheet{getSendSummary().count !== 1 ? "s" : ""}{" "}
                  for the Network of {getSendSummary().network}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendTimesheets}>Send Time Sheets</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Network and Pay Period Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="space-y-2">
          <Label>Network <span className="text-red-500 text-xs">*</span></Label>
          <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LVHN">Lehigh Valley Health Network (LVHN)</SelectItem>
              <SelectItem value="Arkansas">Arkansas Children's</SelectItem>
              <SelectItem value="Louisville">University of Louisville</SelectItem>
              <SelectItem value="DMH">Dosher Memorial Hospital</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <PayPeriodPicker value={payPeriod} onChange={setPayPeriod} />
        </div>
      </div>

      <TimesheetFilters
        onFileUpload={handleFileUpload}
        requiredNetwork={false}
        selectedNetwork={selectedNetwork}
        uploadedFiles={uploadedFiles}
      />

      {/* Loading Indicator */}
      {isLoadingFiles && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading and combining files...</p>
          </div>
        </div>
      )}

      {/* Combined Timesheet Data Display */}
      {!isLoadingFiles && combinedTimesheetData.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Combined Timesheet Data
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground font-medium">
                {combinedTimesheetData.length} record{combinedTimesheetData.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-auto max-h-[600px] border border-border rounded-lg">
            <table className="w-full border-collapse bg-card" style={{ minWidth: "max-content" }}>
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  {Object.keys(combinedTimesheetData[0] || {}).map((header) => (
                    <th
                      key={header}
                      className="border border-border bg-muted px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap"
                      style={{ minWidth: "120px" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {combinedTimesheetData.map((row, index) => {
                  return (
                    <tr
                      key={index}
                      className={`transition-colors ${
                        index % 2 === 0 
                          ? "bg-card hover:bg-accent/30" 
                          : "bg-muted/50 hover:bg-accent/30"
                      }`}
                    >
                      {Object.keys(combinedTimesheetData[0] || {}).map((header) => {
                        const value = row[header] || ""
                        const isNumeric = header.includes("Hours") || header === "Cost Center"
                        
                        return (
                          <td
                            key={header}
                            className="border border-border px-3 py-2 text-xs whitespace-nowrap text-foreground"
                            style={{
                              fontFamily: isNumeric ? "monospace" : "inherit",
                              textAlign: isNumeric ? "right" : "left",
                            }}
                          >
                            <span className="text-foreground">{value}</span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Scroll horizontally to view all columns. All {combinedTimesheetData.length} records displayed.
            </p>
          </div>
        </div>
      )}

      <ManualTimesheetModal
        open={manualTimesheetOpen}
        onOpenChange={setManualTimesheetOpen}
        onTimesheetCreate={handleManualTimesheetCreate}
      />
    </div>
  )
}
