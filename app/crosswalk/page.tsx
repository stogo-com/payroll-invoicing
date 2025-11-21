"use client"

import { useState } from "react"
import { CrosswalkTable } from "@/components/crosswalk/crosswalk-table"
import { CSVImportExport } from "@/components/crosswalk/csv-import-export"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, Info } from "lucide-react"

interface CrosswalkMapping {
  clientId: string
  clientEmployeeId: string
  internalEmployeeId: string
  activeFlag: boolean
  notes?: string
}

export default function CrosswalkPage() {
  const [mappings, setMappings] = useState<CrosswalkMapping[]>([])
  const [isRematching, setIsRematching] = useState(false)

  const handleMappingChange = async (newMappings: CrosswalkMapping[]) => {
    setMappings(newMappings)

    // Trigger re-matching of impacted timesheet records
    setIsRematching(true)
    try {
      // In real implementation, this would call the API to re-match affected records
      console.log("Re-matching timesheet records affected by crosswalk changes...")
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Re-matching failed:", error)
    } finally {
      setIsRematching(false)
    }
  }

  const handleImport = (importedMappings: CrosswalkMapping[]) => {
    const updatedMappings = [...mappings, ...importedMappings]
    handleMappingChange(updatedMappings)
  }

  const handleManualRematch = () => {
    handleMappingChange(mappings)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-semibold text-foreground leading-tight">Employee Crosswalk</h1>
          <p className="text-muted-foreground">Manage mappings between client employee IDs and internal employee IDs</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImportExport mappings={mappings} onImport={handleImport} />
          <Button variant="outline" onClick={handleManualRematch} disabled={isRematching}>
            {isRematching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Re-matching...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-match Records
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Employee crosswalk mappings link client-specific employee IDs to internal employee IDs. When mappings are
          updated, affected timesheet records will be automatically re-matched to ensure data consistency.
        </AlertDescription>
      </Alert>

      {/* Re-matching Status */}
      {isRematching && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Re-matching timesheet records with updated crosswalk mappings. This may take a few moments...
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">156</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">142</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">14</div>
            <p className="text-xs text-muted-foreground">Temporarily disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">5</div>
            <p className="text-xs text-muted-foreground">With active mappings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Crosswalk Mappings</CardTitle>
          <CardDescription>
            Manage the relationship between client employee IDs and internal employee IDs. Changes will trigger
            automatic re-matching of timesheet records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CrosswalkTable onMappingChange={handleMappingChange} />
        </CardContent>
      </Card>
    </div>
  )
}
