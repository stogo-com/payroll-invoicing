"use client"

import { useState } from "react"
import { IncentiveTable } from "@/components/incentives/incentive-table"
import { IncentiveEditor } from "@/components/incentives/incentive-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Info, Sparkles } from "lucide-react"

export default function IncentivesPage() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)

  const handleEdit = (rule: any) => {
    setEditingRule(rule)
    setEditorOpen(true)
  }

  const handleDelete = (rule: any) => {
    console.log("Delete rule:", rule)
  }

  const handlePreview = (rule: any) => {
    console.log("Preview rule logic:", rule)
  }

  const handleSave = (rule: any) => {
    console.log("Save rule:", rule)
    setEditingRule(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-semibold text-foreground leading-tight">Incentive Management</h1>
          <p className="text-muted-foreground">Configure department-level incentive rules for different clients</p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null)
            setEditorOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Incentive rules are applied automatically during timesheet processing. Rules with overlapping effective dates
          will be prioritized by creation order. Use the preview function to test rule logic before activation.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">Currently effective</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">5</div>
            <p className="text-xs text-muted-foreground">With incentive rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">18</div>
            <p className="text-xs text-muted-foreground">With specific rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">1.6x</div>
            <p className="text-xs text-muted-foreground">Across all incentives</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incentive Rules</CardTitle>
          <CardDescription>
            Manage incentive rules by client and department. Rules define conditions and multiplier rates for various
            scenarios like night shifts, floating assignments, and holiday work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncentiveTable onEdit={handleEdit} onDelete={handleDelete} onPreview={handlePreview} />
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <IncentiveEditor open={editorOpen} onOpenChange={setEditorOpen} rule={editingRule} onSave={handleSave} />
    </div>
  )
}
