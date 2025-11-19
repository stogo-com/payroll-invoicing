"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PayrollTable } from "@/components/payroll/payroll-table"
import { PayrollFilters } from "@/components/payroll/payroll-filters"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PayPeriodPicker } from "@/components/dashboard/pay-period-picker"
import { format } from "date-fns"
import { DEFAULT_PAYROLL_CONFIG } from "@/lib/payroll-transformer-config"

export default function PayrollPage() {
  const [filters, setFilters] = useState<any>({})
  const [payrollData, setPayrollData] = useState<any[]>([])
  const [editedRecords, setEditedRecords] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{
    contingentWorker?: File
    manualAdds?: File
    crosswalk?: File
    facilityCrosswalk?: File
    shiftsFile?: File
  }>({})
  const [generatedPayroll, setGeneratedPayroll] = useState<Blob | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const { toast } = useToast()

  // Helper function to get Sunday of a given date
  const getSundayOfWeek = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const sunday = new Date(d)
    sunday.setDate(d.getDate() - day)
    sunday.setHours(0, 0, 0, 0)
    return sunday
  }

  // Helper function to get Saturday of a given date's week
  const getSaturdayOfWeek = (date: Date): Date => {
    const sunday = getSundayOfWeek(date)
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    saturday.setHours(23, 59, 59, 999)
    return saturday
  }

  // Helper function to get last week's pay period (Sunday to Saturday)
  const getLastWeekPayPeriod = (): { from: Date; to: Date } => {
    const today = new Date()
    today.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    
    // Get last week's Sunday (7 days before this week's Sunday)
    const thisWeekSunday = getSundayOfWeek(today)
    const lastWeekSunday = new Date(thisWeekSunday)
    lastWeekSunday.setDate(thisWeekSunday.getDate() - 7)
    lastWeekSunday.setHours(0, 0, 0, 0)
    
    // Get last week's Saturday
    const lastWeekSaturday = new Date(lastWeekSunday)
    lastWeekSaturday.setDate(lastWeekSunday.getDate() + 6)
    lastWeekSaturday.setHours(23, 59, 59, 999)
    
    return { from: lastWeekSunday, to: lastWeekSaturday }
  }

  const [payPeriod, setPayPeriod] = useState<{ from: Date; to: Date }>(() => {
    return getLastWeekPayPeriod()
  })
  const [generatedPayrollData, setGeneratedPayrollData] = useState<any[]>([])
  const [showPayrollPreview, setShowPayrollPreview] = useState(false)


  const handleFiltersChange = (newFilters: any) => {
    console.log("[v0] Payroll filters changed:", newFilters)
    setFilters(newFilters)

    if (newFilters.network && newFilters.dateRange?.from && newFilters.dateRange?.to) {
      fetchPayrollData(newFilters)
    }
  }

  const fetchPayrollData = async (filters: any) => {
    // TODO: Replace with actual API call
    setPayrollData([])
    setEditedRecords(new Set())
  }

  const handleFieldUpdate = (recordId: string, field: string, value: string) => {
    setPayrollData((prev) => prev.map((record) => (record.id === recordId ? { ...record, [field]: value } : record)))
    setEditedRecords((prev) => new Set(prev).add(recordId))
  }

  const handleUpdateTimesheets = () => {
    if (editedRecords.size === 0) {
      toast({
        title: "No changes to sync",
        description: "Make edits to timesheet records before syncing updates.",
        variant: "destructive",
      })
      return
    }
    setShowConfirmDialog(true)
  }

  const confirmSyncUpdates = async () => {
    console.log("[v0] Syncing updates for records:", Array.from(editedRecords))
    // TODO: Implement actual API call to sync updates
    toast({
      title: "Updates synced successfully",
      description: `${editedRecords.size} timesheet record${editedRecords.size !== 1 ? "s" : ""} updated.`,
    })
    setEditedRecords(new Set())
    setShowConfirmDialog(false)
  }

  const handleSubmitToPayroll = () => {
    console.log("[v0] Submitting to payroll:", payrollData)
    // TODO: Implement actual API call to submit to payroll
    toast({
      title: "Submitted to payroll",
      description: `${payrollData.length} record${payrollData.length !== 1 ? "s" : ""} submitted successfully.`,
    })
  }

  const handleFileUpload = (
    fileType: "contingentWorker" | "manualAdds" | "crosswalk" | "facilityCrosswalk" | "shiftsFile",
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [fileType]: file }))
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully.`,
      })
    }
  }

  const handleGeneratePayroll = async () => {
    // Validate network selection
    if (!selectedNetwork) {
      toast({
        title: "Network required",
        description: "Please select a network before generating payroll.",
        variant: "destructive",
      })
      return
    }

    // Validate required files: Client Time Sheets, Assigned Shifts, Employee Mapping, and Facility Mapping
    if (!uploadedFiles.contingentWorker || !uploadedFiles.shiftsFile || !uploadedFiles.crosswalk || !uploadedFiles.facilityCrosswalk) {
      toast({
        title: "Missing required files",
        description: "Please upload Client Time Sheets, Assigned Shifts, Employee Mapping, and Facility Mapping files.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    console.log("[v0] Generating payroll file with:", uploadedFiles)

    try {
      // Map network to clientId directly (based on mappings page)
      const networkToClientId: Record<string, string> = {
        "LVHN": "1", // Lehigh Valley Health Network
        "Arkansas": "2", // Arkansas Children's
        "Louisville": "3", // University of Louisville
        "DMH": "4", // Dosher Memorial Hospital (if exists)
      }
      
      const clientId = networkToClientId[selectedNetwork] || null
      
      console.log("[v0] Network:", selectedNetwork, "→ ClientId:", clientId)
      
      // Fetch transformation and incentive rules from mappings API
      let transformations: any[] = []
      let incentiveRules: any[] = []
      let incentivesEnabled = true
      let incentiveValidThrough = "2025-11-08"
      
      if (clientId) {
        try {
          console.log("[v0] Fetching rules for clientId:", clientId)
          
          // Fetch transformation rules
          const transformResponse = await fetch(`/api/mappings/payroll/${clientId}/transformations`)
          console.log("[v0] Transform API status:", transformResponse.status)
          if (transformResponse.ok) {
            const transformData = await transformResponse.json()
            console.log("[v0] Transformation rules API response:", JSON.stringify(transformData, null, 2))
            if (transformData.rules && transformData.rules.length > 0) {
              transformations = transformData.rules
              console.log("[v0] ✓ Loaded", transformations.length, "transformation rules from mappings")
            } else {
              console.warn("[v0] ⚠ No transformation rules found in mappings for clientId:", clientId)
            }
          } else {
            const errorText = await transformResponse.text()
            console.warn("[v0] ⚠ Failed to fetch transformation rules, status:", transformResponse.status, "error:", errorText)
          }
          
          // Fetch incentive rules
          const incentiveResponse = await fetch(`/api/mappings/payroll/${clientId}/incentives`)
          console.log("[v0] Incentive API status:", incentiveResponse.status)
          if (incentiveResponse.ok) {
            const incentiveData = await incentiveResponse.json()
            console.log("[v0] Incentive rules API response:", JSON.stringify(incentiveData, null, 2))
            if (incentiveData.rules && incentiveData.rules.length > 0) {
              incentiveRules = incentiveData.rules
              incentivesEnabled = incentiveData.enabled ?? true
              if (incentiveData.validThrough) {
                incentiveValidThrough = incentiveData.validThrough.split("T")[0]
              }
              console.log("[v0] ✓ Loaded", incentiveRules.length, "incentive rules from mappings")
              console.log("[v0] Incentive rules details:", incentiveRules.map(r => ({
                company: r.company,
                costCenters: r.costCenters?.length || 0,
                amount: r.amount,
                description: r.description
              })))
            } else {
              console.warn("[v0] ⚠ No incentive rules found in mappings for clientId:", clientId, "- will use defaults")
              // Use default incentive rules if none found
              incentiveRules = DEFAULT_PAYROLL_CONFIG.incentives.rules
              console.log("[v0] Using default incentive rules:", incentiveRules.length, "rules")
            }
          } else {
            const errorText = await incentiveResponse.text()
            console.warn("[v0] ⚠ Failed to fetch incentive rules, status:", incentiveResponse.status, "error:", errorText)
            // Use default incentive rules on error
            incentiveRules = DEFAULT_PAYROLL_CONFIG.incentives.rules
            console.log("[v0] Using default incentive rules due to error:", incentiveRules.length, "rules")
          }
        } catch (error) {
          console.error("[v0] ✗ Error loading rules from mappings:", error)
          // Use default incentive rules on error
          incentiveRules = DEFAULT_PAYROLL_CONFIG.incentives.rules
          console.log("[v0] Using default incentive rules due to exception:", incentiveRules.length, "rules")
        }
      } else {
        console.warn("[v0] ⚠ No clientId found for network:", selectedNetwork, "- using default rules")
        // Use default incentive rules if no clientId
        incentiveRules = DEFAULT_PAYROLL_CONFIG.incentives.rules
        console.log("[v0] Using default incentive rules (no clientId):", incentiveRules.length, "rules")
      }

      const formData = new FormData()
      formData.append("rawTimecard", uploadedFiles.contingentWorker!)
      if (uploadedFiles.manualAdds) {
        formData.append("manualAdds", uploadedFiles.manualAdds)
      }
      formData.append("crosswalk", uploadedFiles.crosswalk!)
      if (uploadedFiles.facilityCrosswalk) {
        formData.append("facilityCrosswalk", uploadedFiles.facilityCrosswalk)
      }
      if (uploadedFiles.shiftsFile) {
        formData.append("shiftsFile", uploadedFiles.shiftsFile)
      }
      formData.append("network", selectedNetwork)
      formData.append("payPeriodStart", payPeriod.from.toISOString())
      formData.append("payPeriodEnd", payPeriod.to.toISOString())
      
      // Add transformation and incentive rules to formData (always send, even if empty)
      formData.append("transformations", JSON.stringify(transformations))
      formData.append("incentiveRules", JSON.stringify(incentiveRules))
      formData.append("incentivesEnabled", JSON.stringify(incentivesEnabled))
      formData.append("incentiveValidThrough", incentiveValidThrough)

      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || "Failed to generate payroll")
      }

      const result = await response.json()
      console.log("[v0] Payroll generated:", result.recordCount, "records")
      console.log("[v0] Used", transformations.length, "transformation rules and", incentiveRules.length, "incentive rules")

      setGeneratedPayrollData(result.data)
      setShowPayrollPreview(true)
      setGeneratedPayroll(new Blob([JSON.stringify(result.data)], { type: "application/json" }))

      toast({
        title: "Payroll generated",
        description: `${result.recordCount} payroll records generated successfully using ${transformations.length} transformation rules.`,
      })
    } catch (error) {
      console.error("[v0] Generation error:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate payroll file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPayrollFile = async () => {
    if (generatedPayrollData.length === 0) {
      toast({
        title: "No data available",
        description: "Please generate a payroll file first.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Downloading payroll file")

    try {
      const response = await fetch("/api/payroll/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: generatedPayrollData,
          network: selectedNetwork,
        }),
      })

      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedNetwork}_Payroll_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: "Payroll file is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download payroll file.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-semibold text-foreground leading-tight">Payroll</h1>
      </div>

      {/* Network and Pay Period Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="space-y-2">
          <Label>Network <span className="text-red-500 text-xs">*</span></Label>
          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
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

        <div className="rounded-xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-2xl">📤</span>
            Upload Files
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Client Time Sheets - REQUIRED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  Client Time Sheets
                  <span className="text-red-500 text-xs">*</span>
                </label>
                {uploadedFiles.contingentWorker && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                    ✓ Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">WD_contingentworker_STOGO_[date]</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload("contingentWorker", e)}
                  className="hidden"
                  id="file-timesheets"
                />
                <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                  uploadedFiles.contingentWorker 
                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
                }`}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedFiles.contingentWorker?.name || "Choose file or drag here"}
                  </p>
                </div>
              </label>
            </div>

            {/* Assigned Shifts - REQUIRED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  Assigned Shifts
                  <span className="text-red-500 text-xs">*</span>
                </label>
                {uploadedFiles.shiftsFile && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                    ✓ Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">LVHN Time Input File</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload("shiftsFile", e)}
                  className="hidden"
                  id="file-shifts"
                />
                <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                  uploadedFiles.shiftsFile 
                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
                }`}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedFiles.shiftsFile?.name || "Choose file or drag here"}
                  </p>
                </div>
              </label>
            </div>

            {/* Employee Mapping - REQUIRED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  Employee Mapping
                  <span className="text-red-500 text-xs">*</span>
                </label>
                {uploadedFiles.crosswalk && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                    ✓ Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">API to STOGO EE Crosswalk</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload("crosswalk", e)}
                  className="hidden"
                  id="file-mapping"
                />
                <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                  uploadedFiles.crosswalk 
                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
                }`}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedFiles.crosswalk?.name || "Choose file or drag here"}
                  </p>
                </div>
              </label>
            </div>

            {/* Facility Mapping - REQUIRED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  Facility Mapping
                  <span className="text-red-500 text-xs">*</span>
                </label>
                {uploadedFiles.facilityCrosswalk && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                    ✓ Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">TNAA to STOGO Facility Crosswalk</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload("facilityCrosswalk", e)}
                  className="hidden"
                  id="file-facility-crosswalk"
                />
                <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                  uploadedFiles.facilityCrosswalk 
                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
                }`}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedFiles.facilityCrosswalk?.name || "Choose file or drag here"}
                  </p>
                </div>
              </label>
            </div>

            {/* Additional Time Sheets - OPTIONAL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  Additional Time Sheets
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </label>
                {uploadedFiles.manualAdds && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                    ✓ Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Manual Adds LVHN [date]</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload("manualAdds", e)}
                  className="hidden"
                  id="file-additional"
                />
                <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                  uploadedFiles.manualAdds 
                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
                }`}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedFiles.manualAdds?.name || "Choose file or drag here"}
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Required Files Indicator */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Required fields must be uploaded to generate payroll
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleGeneratePayroll}
            disabled={
              !selectedNetwork ||
              !uploadedFiles.contingentWorker || 
              !uploadedFiles.shiftsFile || 
              !uploadedFiles.crosswalk || 
              !uploadedFiles.facilityCrosswalk || 
              isGenerating
            }
            size="lg"
            className="font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <>
                <span className="mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <span className="mr-2">⚙️</span>
                Generate Payroll
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPayrollFile}
            disabled={generatedPayrollData.length === 0}
            size="lg"
            className="font-semibold shadow-sm hover:shadow-md transition-all bg-transparent"
          >
            <span className="mr-2">⬇️</span>
            Download Payroll File
          </Button>
        </div>

        {showPayrollPreview && generatedPayrollData.length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Generated Payroll Data
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  {generatedPayrollData.length} record{generatedPayrollData.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPayrollFile}
                  className="h-8"
                >
                  <span className="mr-2">⬇️</span>
                  Download CSV
                </Button>
              </div>
            </div>
            
            {/* Incentive Legend */}
            {(() => {
              // Count incentives and log for debugging
              const incentiveRows = generatedPayrollData.filter(row => {
                const hasIncentive = row.hasIncentive === true || row.hasIncentive === "true"
                return hasIncentive
              })
              const incentiveCount = incentiveRows.length
              
              // Debug logging
              console.log(`[UI] Total rows: ${generatedPayrollData.length}, Incentive rows: ${incentiveCount}`)
              if (incentiveCount > 0) {
                console.log(`[UI] Sample incentive rows:`, incentiveRows.slice(0, 3).map(r => ({
                  company: r.Company,
                  costCenter: r["Cost Center"],
                  hasIncentive: r.hasIncentive,
                  payRate: r["Pay Rate"]
                })))
              }
              
              if (incentiveCount > 0) {
                return (
                  <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-200 dark:bg-purple-700 border border-purple-300 dark:border-purple-600"></div>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
                        {incentiveCount} {incentiveCount === 1 ? 'timesheet' : 'timesheets'} {incentiveCount === 1 ? 'is' : 'are'} highlighted in purple, indicating {incentiveCount === 1 ? 'a shift' : 'shifts'} with incentive pay
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            })()}
            
            {/* Outside Pay Period Summary */}
            {(() => {
              const outsidePayPeriodRows = generatedPayrollData.filter(row => {
                const isOutside = row.isOutsidePayPeriod === true || row.isOutsidePayPeriod === "true"
                return isOutside
              })
              const outsidePayPeriodCount = outsidePayPeriodRows.length
              
              if (outsidePayPeriodCount > 0) {
                return (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-700 border border-yellow-300 dark:border-yellow-600"></div>
                      <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                        {outsidePayPeriodCount} {outsidePayPeriodCount === 1 ? 'shift' : 'shifts'} {outsidePayPeriodCount === 1 ? 'is' : 'are'} outside the selected pay period. 
                        Adjusted Pay Rate Date Start/End columns show the correct pay period dates for these shifts.
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            })()}

            <div className="overflow-auto max-h-[600px] border border-border rounded-lg">
              <table className="w-full border-collapse bg-card" style={{ minWidth: "max-content" }}>
                <thead className="sticky top-0 z-10 bg-muted">
                  <tr>
                    {Object.keys(generatedPayrollData[0] || {})
                      .filter(header => header !== "hasIncentive" && header !== "isOutsidePayPeriod") // Exclude metadata columns
                      .map((header) => (
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
                  {generatedPayrollData.map((row, index) => {
                    const hasIncentive = row.hasIncentive === true || row.hasIncentive === "true"
                    const isOutsidePayPeriod = row.isOutsidePayPeriod === true || row.isOutsidePayPeriod === "true"
                    
                    // Debug logging for first few rows
                    if (index < 3) {
                      console.log(`[UI] Row ${index}: hasIncentive =`, row.hasIncentive, typeof row.hasIncentive, "Company:", row.Company, "Cost Center:", row["Cost Center"])
                    }
                    
                    return (
                      <tr
                        key={index}
                        className={`transition-colors ${
                          hasIncentive 
                            ? "bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/50 border-l-4 border-l-purple-500 dark:border-l-purple-400" 
                            : index % 2 === 0 
                              ? "bg-card hover:bg-accent/30" 
                              : "bg-muted/50 hover:bg-accent/30"
                        }`}
                      >
                        {Object.keys(generatedPayrollData[0] || {})
                          .filter(header => header !== "hasIncentive" && header !== "isOutsidePayPeriod") // Exclude metadata columns
                          .map((header) => {
                          const value = row[header] || ""
                          const isNumeric = header.includes("Hours")
                          const isPayCode = header === "Pay Code"
                          const isPayRate = header === "Pay Rate"
                          const isAdjustedPay = header.includes("Adjusted Pay Rate Date")
                          const hasAdjustedPayValue = isAdjustedPay && value && value.trim() !== ""
                          
                          return (
                            <td
                              key={header}
                              className={`border border-border px-3 py-2 text-xs whitespace-nowrap text-foreground ${
                                hasAdjustedPayValue && isOutsidePayPeriod
                                  ? "bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-l-yellow-500 dark:border-l-yellow-400 font-semibold"
                                  : ""
                              }`}
                              style={{
                                fontFamily: isNumeric ? "monospace" : "inherit",
                                textAlign: isNumeric ? "right" : "left",
                              }}
                            >
                              {isPayCode ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    value === "FXNT"
                                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                      : value === "FXDY"
                                      ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {value}
                                </span>
                              ) : isPayRate ? (
                                // Pay Rate: show the number, highlight if incentive
                                <span className={hasIncentive ? "font-semibold text-purple-700 dark:text-purple-300" : "text-foreground"}>
                                  {value}
                                </span>
                              ) : isAdjustedPay ? (
                                // Adjusted Pay Rate Date Start/End: highlight if has value and outside pay period
                                <span className={hasAdjustedPayValue && isOutsidePayPeriod ? "text-yellow-800 dark:text-yellow-200 font-semibold" : "text-foreground"}>
                                  {value || ""}
                                </span>
                              ) : (
                                <span className="text-foreground">{value}</span>
                              )}
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
                Scroll horizontally to view all columns. All {generatedPayrollData.length} records displayed.
              </p>
            </div>
          </div>
        )}

        <PayrollFilters onFiltersChange={handleFiltersChange} />

        {!filters.network || !filters.dateRange?.from || !filters.dateRange?.to ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/50 p-12">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Select a network and shift date range to view payroll records
              </p>
              <p className="text-xs text-muted-foreground mt-1">Only approved and locked timecards will be displayed</p>
            </div>
          </div>
        ) : (
          <PayrollTable data={payrollData} selectedNetwork={filters.network} onFieldUpdate={handleFieldUpdate} />
        )}
    </div>
  )
}
