"use client"

interface TimesheetFiltersProps {
  onFileUpload?: (fileType: string, file: File | null) => void
  requiredNetwork?: boolean
  selectedNetwork?: string
  uploadedFiles?: {
    contingentWorker?: File
    manualAdds?: File
  }
}

export function TimesheetFilters({ 
  onFileUpload, 
  requiredNetwork = true, 
  selectedNetwork = "",
  uploadedFiles = {}
}: TimesheetFiltersProps) {
  const handleFileUpload = (fileType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    onFileUpload?.(fileType, file)
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <span className="text-2xl">📤</span>
        Upload Files
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              id="file-timesheets-client"
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
              id="file-timesheets-additional"
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
          <span className="text-red-500">*</span> Required fields must be uploaded
        </p>
      </div>
    </div>
  )
}
