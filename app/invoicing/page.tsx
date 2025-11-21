"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Download, FileSpreadsheet } from "lucide-react"
import { PayPeriodPicker } from "@/components/dashboard/pay-period-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from "xlsx"

// Helper function to get last week's pay period (Sunday to Saturday)
function getLastWeekPayPeriod(): { from: Date; to: Date } {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const thisWeekSunday = new Date(today)
  thisWeekSunday.setDate(today.getDate() - today.getDay())
  thisWeekSunday.setHours(0, 0, 0, 0)
  const lastWeekSunday = new Date(thisWeekSunday)
  lastWeekSunday.setDate(thisWeekSunday.getDate() - 7)
  const lastWeekSaturday = new Date(lastWeekSunday)
  lastWeekSaturday.setDate(lastWeekSunday.getDate() + 6)
  lastWeekSaturday.setHours(23, 59, 59, 999)
  return { from: lastWeekSunday, to: lastWeekSaturday }
}

export default function InvoicingPage() {
  const [uploadedFiles, setUploadedFiles] = useState<{
    previousPayrollPeriod?: File
    currentPayrollPeriod?: File
    invoiceDetailPeriod1?: File
    invoiceDetailPeriod2?: File
    invoiceDetailPeriod3?: File
    invoiceDetailPeriod4?: File
  }>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any[]>([])
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const [invoiceResult, setInvoiceResult] = useState<any>(null)
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string>("mainInvoiceDetail")
  const [payPeriod, setPayPeriod] = useState<{ from: Date; to: Date }>(() => getLastWeekPayPeriod())
  const { toast } = useToast()

  const handleGenerateInvoice = async () => {
    // Validate network selection
    if (!selectedNetwork) {
      toast({
        title: "Network required",
        description: "Please select a network before generating invoice.",
        variant: "destructive",
      })
      return
    }

    if (!uploadedFiles.previousPayrollPeriod || !uploadedFiles.currentPayrollPeriod) {
      toast({
        title: "Missing required files",
        description: "Please upload both payroll period files",
        variant: "destructive",
      })
      return
    }

    if (!uploadedFiles.invoiceDetailPeriod1 || !uploadedFiles.invoiceDetailPeriod2 || 
        !uploadedFiles.invoiceDetailPeriod3 || !uploadedFiles.invoiceDetailPeriod4) {
      toast({
        title: "Missing required files",
        description: "Please upload all 4 FLEX Invoice Detail files",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("previousPayrollPeriod", uploadedFiles.previousPayrollPeriod)
      formData.append("currentPayrollPeriod", uploadedFiles.currentPayrollPeriod)
      formData.append("invoiceDetailPeriod1", uploadedFiles.invoiceDetailPeriod1)
      formData.append("invoiceDetailPeriod2", uploadedFiles.invoiceDetailPeriod2)
      formData.append("invoiceDetailPeriod3", uploadedFiles.invoiceDetailPeriod3)
      formData.append("invoiceDetailPeriod4", uploadedFiles.invoiceDetailPeriod4)
      formData.append("network", selectedNetwork)

      const response = await fetch("/api/invoicing/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || "Failed to generate invoice")
      }

      const result = await response.json()
      console.log("[Invoice] Generated response:", result)
      console.log("[Invoice] Record count:", result.recordCount)
      console.log("[Invoice] Has outputs:", !!result.outputs)
      console.log("[Invoice] Main invoice detail count:", result.outputs?.mainInvoiceDetail?.length || 0)
      
      // Always set the result and show preview, even if outputs structure is unexpected
      setGeneratedInvoiceData(result.data || [])
      setInvoiceResult(result)
      setSelectedPreviewFile("mainInvoiceDetail") // Default to main invoice detail
      setShowInvoicePreview(true)
      
      if (!result.outputs) {
        console.warn("[Invoice] Warning: Response missing outputs object")
        toast({
          title: "Invoice generated with warnings",
          description: "Response structure may be incomplete. Check console for details.",
          variant: "default",
        })
      } else {
        toast({
          title: "Invoice generated successfully",
          description: `${result.recordCount || 0} records processed. ${result.hasMicrohospitals ? '6 files' : '3 files'} generated.`,
        })
      }
    } catch (error) {
      console.error("[Invoice] Error:", error)
      console.error("[Invoice] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      toast({
        title: "Error generating invoice",
        description: error instanceof Error ? error.message : "Unknown error occurred. Check console for details.",
        variant: "destructive",
      })
      setShowInvoicePreview(false)
      setInvoiceResult(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFile = (data: any[], filename: string, format: "csv" | "xlsx") => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to download",
        description: "This file has no records",
        variant: "destructive",
      })
      return
    }

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Detail")
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`)
    } else {
      const csv = convertToCSV(data)
      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }

    toast({
      title: "File downloaded",
      description: `${filename} downloaded successfully`,
    })
  }

  const allFilesUploaded = 
    uploadedFiles.previousPayrollPeriod && 
    uploadedFiles.currentPayrollPeriod &&
    uploadedFiles.invoiceDetailPeriod1 &&
    uploadedFiles.invoiceDetailPeriod2 &&
    uploadedFiles.invoiceDetailPeriod3 &&
    uploadedFiles.invoiceDetailPeriod4

  const handleFileUpload = (fileType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: file || undefined,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-semibold text-foreground leading-tight">Invoice</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Previous Payroll Period - REQUIRED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Previous Payroll Period
                <span className="text-red-500 text-xs">*</span>
              </label>
              {uploadedFiles.previousPayrollPeriod && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">The most recent FLEX payroll CSV</p>
            <label className="block">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload("previousPayrollPeriod", e)}
                className="hidden"
                id="file-previous-payroll"
              />
              <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                uploadedFiles.previousPayrollPeriod 
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
              }`}>
                <p className="text-sm font-medium text-muted-foreground">
                  {uploadedFiles.previousPayrollPeriod?.name || "Choose file or drag here"}
                </p>
              </div>
            </label>
          </div>

          {/* Current Payroll Period - REQUIRED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Current Payroll Period
                <span className="text-red-500 text-xs">*</span>
              </label>
              {uploadedFiles.currentPayrollPeriod && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">The current FLEX payroll CSV</p>
            <label className="block">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload("currentPayrollPeriod", e)}
                className="hidden"
                id="file-current-payroll"
              />
              <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                uploadedFiles.currentPayrollPeriod 
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
              }`}>
                <p className="text-sm font-medium text-muted-foreground">
                  {uploadedFiles.currentPayrollPeriod?.name || "Choose file or drag here"}
                </p>
              </div>
            </label>
          </div>

          {/* Invoice Detail Period 1 - REQUIRED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Invoice Detail - Period 1
                <span className="text-red-500 text-xs">*</span>
              </label>
              {uploadedFiles.invoiceDetailPeriod1 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Most recent FLEX Invoice Detail</p>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload("invoiceDetailPeriod1", e)}
                className="hidden"
                id="file-invoice-detail-1"
              />
              <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                uploadedFiles.invoiceDetailPeriod1 
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
              }`}>
                <p className="text-sm font-medium text-muted-foreground">
                  {uploadedFiles.invoiceDetailPeriod1?.name || "Choose file or drag here"}
                </p>
              </div>
            </label>
          </div>

          {/* Invoice Detail Period 2 - REQUIRED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Invoice Detail - Period 2
                <span className="text-red-500 text-xs">*</span>
              </label>
              {uploadedFiles.invoiceDetailPeriod2 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">2nd most recent FLEX Invoice Detail</p>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload("invoiceDetailPeriod2", e)}
                className="hidden"
                id="file-invoice-detail-2"
              />
              <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                uploadedFiles.invoiceDetailPeriod2 
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
              }`}>
                <p className="text-sm font-medium text-muted-foreground">
                  {uploadedFiles.invoiceDetailPeriod2?.name || "Choose file or drag here"}
                </p>
              </div>
            </label>
          </div>

          {/* Invoice Detail Period 3 - REQUIRED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Invoice Detail - Period 3
                <span className="text-red-500 text-xs">*</span>
              </label>
              {uploadedFiles.invoiceDetailPeriod3 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">3rd most recent FLEX Invoice Detail</p>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload("invoiceDetailPeriod3", e)}
                className="hidden"
                id="file-invoice-detail-3"
              />
              <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                uploadedFiles.invoiceDetailPeriod3 
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
              }`}>
                <p className="text-sm font-medium text-muted-foreground">
                  {uploadedFiles.invoiceDetailPeriod3?.name || "Choose file or drag here"}
                </p>
              </div>
            </label>
          </div>

          {/* Invoice Detail Period 4 - REQUIRED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Invoice Detail - Period 4
                <span className="text-red-500 text-xs">*</span>
              </label>
              {uploadedFiles.invoiceDetailPeriod4 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">4th most recent FLEX Invoice Detail</p>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload("invoiceDetailPeriod4", e)}
                className="hidden"
                id="file-invoice-detail-4"
              />
              <div className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-4 text-center ${
                uploadedFiles.invoiceDetailPeriod4 
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                  : "border-muted-foreground/25 bg-background hover:border-primary/50 hover:bg-accent/50"
              }`}>
                <p className="text-sm font-medium text-muted-foreground">
                  {uploadedFiles.invoiceDetailPeriod4?.name || "Choose file or drag here"}
                </p>
              </div>
            </label>
          </div>
        </div>
        
        {/* Required Files Indicator */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500">*</span> Required fields must be uploaded to generate invoice. Total inputs required every cycle: <span className="font-semibold text-foreground">6 files</span>
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleGenerateInvoice}
          disabled={isGenerating || !selectedNetwork || !allFilesUploaded}
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
              Generate Invoice
            </>
          )}
        </Button>
      </div>

      {/* Generated Invoice Preview */}
      {showInvoicePreview && invoiceResult && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Generated Invoice Data
            </h2>
            <div className="flex items-center gap-4">
              {invoiceResult.invoiceNumber && (
                <span className="text-sm text-muted-foreground font-medium">
                  Invoice Number: <span className="font-semibold text-foreground">{invoiceResult.invoiceNumber}</span>
                </span>
              )}
            </div>
          </div>
          
          {/* Show error message if outputs are missing */}
          {!invoiceResult.outputs && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-2">
                ⚠️ No output data received from the server.
              </p>
              <p className="text-xs text-muted-foreground">
                The API response did not include the expected outputs structure. Please check the browser console for details.
              </p>
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">View response data</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(invoiceResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
          
          <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Main Records:</span> <span className="font-semibold text-foreground">{invoiceResult.outputs?.mainInvoiceDetail?.length || 0}</span>
              </div>
              {invoiceResult.hasMicrohospitals && (
                <div>
                  <span className="text-muted-foreground">Microhospital Records:</span> <span className="font-semibold text-foreground">{invoiceResult.outputs?.microInvoiceDetail?.length || 0}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Files Generated:</span> <span className="font-semibold text-foreground">{invoiceResult.hasMicrohospitals ? '6' : '3'}</span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          {invoiceResult.outputs && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Output Group A - Internal Review Files */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Internal Review Files (Excel)</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => downloadFile(
                    invoiceResult.outputs?.mainInvoiceDetail || [], 
                    `FLEX_Lehigh_Invoice_Detail_${invoiceResult.invoiceNumber}`, 
                    "xlsx"
                  )}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Main Invoice Detail
                </Button>
                
                {invoiceResult.hasMicrohospitals && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => downloadFile(
                      invoiceResult.outputs?.microInvoiceDetail || [], 
                      `FLEX_Lehigh_Micro_Invoice_Detail_MICFLEX1012`, 
                      "xlsx"
                    )}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Micro Invoice Detail
                  </Button>
                )}
              </div>

              {/* Output Group B - Invoice Files (SFTP) */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Invoice Files for SFTP (CSV)</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => downloadFile(
                    invoiceResult.outputs?.mainInvoiceCSV || [], 
                    `LVHNInvoice_${new Date().toISOString().split("T")[0].replace(/-/g, "")}`, 
                    "csv"
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Main Invoice CSV
                </Button>
                
                {invoiceResult.hasMicrohospitals && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => downloadFile(
                      invoiceResult.outputs?.microInvoiceCSV || [], 
                      `LVHNInvoiceMicroHospitals_${new Date().toISOString().split("T")[0].replace(/-/g, "")}R`, 
                      "csv"
                    )}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Micro Invoice CSV
                  </Button>
                )}
              </div>

              {/* Output Group C - Productivity Files (SFTP) */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Productivity Files for SFTP (CSV)</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => downloadFile(
                    invoiceResult.outputs?.mainProductivityCSV || [], 
                    `LVHNProductivityHours_${new Date().toISOString().split("T")[0].replace(/-/g, "")}`, 
                    "csv"
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Main Productivity CSV
                </Button>
                
                {invoiceResult.hasMicrohospitals && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => downloadFile(
                      invoiceResult.outputs?.microProductivityCSV || [], 
                      `LVHNProductivityHoursMicroHospitals_${new Date().toISOString().split("T")[0].replace(/-/g, "")}R`, 
                      "csv"
                    )}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Micro Productivity CSV
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* File Preview Selector */}
          {invoiceResult.outputs ? (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview Generated Files</h3>
                <div className="text-sm text-muted-foreground">
                  Select a file to preview its contents
                </div>
              </div>
              
              {/* File Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-border pb-2">
              {/* Main Invoice Detail */}
              <button
                onClick={() => setSelectedPreviewFile("mainInvoiceDetail")}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedPreviewFile === "mainInvoiceDetail"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Main Invoice Detail
                <span className="ml-1 text-xs opacity-75">
                  ({invoiceResult.outputs?.mainInvoiceDetail?.length || 0})
                </span>
              </button>

              {/* Micro Invoice Detail */}
              {invoiceResult.hasMicrohospitals && (
                <button
                  onClick={() => setSelectedPreviewFile("microInvoiceDetail")}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedPreviewFile === "microInvoiceDetail"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Micro Invoice Detail
                  <span className="ml-1 text-xs opacity-75">
                    ({invoiceResult.outputs?.microInvoiceDetail?.length || 0})
                  </span>
                </button>
              )}

              {/* Main Invoice CSV */}
              <button
                onClick={() => setSelectedPreviewFile("mainInvoiceCSV")}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedPreviewFile === "mainInvoiceCSV"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Download className="h-4 w-4" />
                Main Invoice CSV
                <span className="ml-1 text-xs opacity-75">
                  ({invoiceResult.outputs?.mainInvoiceCSV?.length || 0})
                </span>
              </button>

              {/* Micro Invoice CSV */}
              {invoiceResult.hasMicrohospitals && (
                <button
                  onClick={() => setSelectedPreviewFile("microInvoiceCSV")}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedPreviewFile === "microInvoiceCSV"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Micro Invoice CSV
                  <span className="ml-1 text-xs opacity-75">
                    ({invoiceResult.outputs?.microInvoiceCSV?.length || 0})
                  </span>
                </button>
              )}

              {/* Main Productivity CSV */}
              <button
                onClick={() => setSelectedPreviewFile("mainProductivityCSV")}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedPreviewFile === "mainProductivityCSV"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Download className="h-4 w-4" />
                Main Productivity CSV
                <span className="ml-1 text-xs opacity-75">
                  ({invoiceResult.outputs?.mainProductivityCSV?.length || 0})
                </span>
              </button>

              {/* Micro Productivity CSV */}
              {invoiceResult.hasMicrohospitals && (
                <button
                  onClick={() => setSelectedPreviewFile("microProductivityCSV")}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedPreviewFile === "microProductivityCSV"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Micro Productivity CSV
                  <span className="ml-1 text-xs opacity-75">
                    ({invoiceResult.outputs?.microProductivityCSV?.length || 0})
                  </span>
                </button>
              )}
            </div>

            {/* Preview Table */}
            {(() => {
              const previewData = invoiceResult.outputs?.[selectedPreviewFile] || []
              const fileLabels: Record<string, string> = {
                mainInvoiceDetail: "Main Invoice Detail (Excel)",
                microInvoiceDetail: "Micro Invoice Detail (Excel)",
                mainInvoiceCSV: "Main Invoice CSV (Workday)",
                microInvoiceCSV: "Micro Invoice CSV (Workday)",
                mainProductivityCSV: "Main Productivity CSV",
                microProductivityCSV: "Micro Productivity CSV",
              }

              console.log("[Invoice] Preview data for", selectedPreviewFile, ":", previewData.length, "records")
              console.log("[Invoice] First record:", previewData[0])

              if (!previewData || previewData.length === 0) {
                return (
                  <div className="p-8 text-center border border-border rounded-lg bg-muted/30">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground font-medium">
                      No data available for {fileLabels[selectedPreviewFile] || selectedPreviewFile}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This file contains no records
                    </p>
                  </div>
                )
              }

              return (
                <div className="overflow-auto max-h-[600px] border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      {fileLabels[selectedPreviewFile]}
                    </h3>
                    <span className="text-sm text-muted-foreground font-medium">
                      {previewData.length} {previewData.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                  <table className="w-full border-collapse bg-card" style={{ minWidth: "max-content" }}>
                    <thead className="sticky top-0 z-10 bg-muted">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((header) => (
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
                      {previewData.map((row: any, index: number) => (
                        <tr
                          key={index}
                          className={`transition-colors ${
                            index % 2 === 0
                              ? "bg-card hover:bg-accent/30"
                              : "bg-muted/50 hover:bg-accent/30"
                          }`}
                        >
                          {Object.keys(previewData[0] || {}).map((header) => {
                            const value = row[header] || ""
                            const isNumeric = header.includes("Hours") || 
                                            header.includes("Pay") || 
                                            header.includes("Fee") || 
                                            header.includes("Cost") || 
                                            header.includes("Quantity") ||
                                            header.includes("Unit")
                            
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
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      Scroll horizontally to view all columns. All {previewData.length} records displayed.
                    </p>
                  </div>
                </div>
              )
            })()}
            </div>
          ) : (
            <div className="mt-6 p-8 text-center border border-border rounded-lg bg-muted/30">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground font-medium">
                Preview data will appear here once invoice is generated
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ""
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ""
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(",")
    )
  ]
  
  return csvRows.join("\n")
}

