"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { type TransformationRule } from "@/types/transformation-types"
import { getDefaultInvoiceTransformationRules, DEFAULT_INVOICE_CONFIG } from "@/lib/invoice-transformer-config"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Save, Loader2 } from "lucide-react"

export function InvoicingMapping({ clientId }: { clientId: number }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [transformations, setTransformations] = useState<TransformationRule[]>([])
  const [editingRule, setEditingRule] = useState<TransformationRule | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRule, setNewRule] = useState<Partial<TransformationRule>>({
    id: "",
    name: "",
    category: "Column",
    purpose: "",
    ruleLogic: "",
    dataPointsReferenced: [],
    inputFields: [],
    outputFields: [],
  })

  useEffect(() => {
    loadRules()
  }, [clientId])

  const loadRules = async () => {
    setIsLoading(true)
    try {
      const clientIdStr = String(clientId)
      const response = await fetch(`/api/mappings/invoicing/${clientIdStr}/transformations`)

      if (response.ok) {
        const data = await response.json()
        if (data.rules && data.rules.length > 0) {
          setTransformations(data.rules)
        } else {
          setTransformations(getDefaultInvoiceTransformationRules())
        }
      } else {
        console.warn("[Invoice] Failed to load transformation rules, using defaults")
        setTransformations(getDefaultInvoiceTransformationRules())
      }
    } catch (error) {
      console.error("[Invoice] Error loading rules:", error)
      setTransformations(getDefaultInvoiceTransformationRules())
    } finally {
      setIsLoading(false)
    }
  }

  const saveRules = async () => {
    setIsSaving(true)
    try {
      const clientIdStr = String(clientId)
      const response = await fetch(`/api/mappings/invoicing/${clientIdStr}/transformations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: transformations }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice transformation rules saved successfully",
        })
      } else {
        throw new Error("Failed to save rules")
      }
    } catch (error) {
      console.error("[Invoice] Error saving rules:", error)
      toast({
        title: "Error",
        description: "Failed to save invoice transformation rules",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddRule = () => {
    if (!newRule.id || !newRule.name) {
      toast({
        title: "Error",
        description: "Please provide rule ID and name",
        variant: "destructive",
      })
      return
    }

    const rule: TransformationRule = {
      id: newRule.id,
      name: newRule.name,
      category: (newRule.category as any) || "Column",
      purpose: newRule.purpose || "",
      ruleLogic: newRule.ruleLogic || "",
      dataPointsReferenced: newRule.dataPointsReferenced || [],
      inputFields: newRule.inputFields || [],
      outputFields: newRule.outputFields || [],
      parameters: newRule.parameters,
    }

    setTransformations([...transformations, rule])
    setNewRule({
      id: "",
      name: "",
      category: "Column",
      purpose: "",
      ruleLogic: "",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: [],
    })
    setIsAddDialogOpen(false)
    setTimeout(saveRules, 500)
  }

  const handleUpdateRule = (updatedRule: TransformationRule) => {
    setTransformations(transformations.map((r) => (r.id === updatedRule.id ? updatedRule : r)))
    setEditingRule(null)
    setTimeout(saveRules, 500)
  }

  const handleDeleteRule = (ruleId: string) => {
    setTransformations(transformations.filter((r) => r.id !== ruleId))
    setTimeout(saveRules, 500)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Invoice Transformation Rules</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Transformation Rule</DialogTitle>
                <DialogDescription>Create a new invoice transformation rule</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Rule ID</Label>
                  <Input
                    value={newRule.id}
                    onChange={(e) => setNewRule({ ...newRule, id: e.target.value })}
                    placeholder="e.g., 23"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Calculate Total"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={newRule.category}
                    onValueChange={(value) => setNewRule({ ...newRule, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Row">Row</SelectItem>
                      <SelectItem value="Column">Column</SelectItem>
                      <SelectItem value="Format">Format</SelectItem>
                      <SelectItem value="Conditional">Conditional</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Textarea
                    value={newRule.purpose}
                    onChange={(e) => setNewRule({ ...newRule, purpose: e.target.value })}
                    placeholder="Describe the purpose of this rule"
                  />
                </div>
                <div>
                  <Label>Rule Logic</Label>
                  <Textarea
                    value={newRule.ruleLogic}
                    onChange={(e) => setNewRule({ ...newRule, ruleLogic: e.target.value })}
                    placeholder="Describe how this rule works"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRule}>Add Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={saveRules} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {transformations.map((rule) => (
          <Card key={rule.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">#{rule.id}</Badge>
                  <h3 className="font-semibold">{rule.name}</h3>
                  <Badge>{rule.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rule.purpose}</p>
                <p className="text-xs text-muted-foreground">{rule.ruleLogic}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRule(rule)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Transformation Rule</DialogTitle>
              <DialogDescription>Update invoice transformation rule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rule ID</Label>
                <Input value={editingRule.id} disabled />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={editingRule.category}
                  onValueChange={(value) => setEditingRule({ ...editingRule, category: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Row">Row</SelectItem>
                    <SelectItem value="Column">Column</SelectItem>
                    <SelectItem value="Format">Format</SelectItem>
                    <SelectItem value="Conditional">Conditional</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purpose</Label>
                <Textarea
                  value={editingRule.purpose}
                  onChange={(e) => setEditingRule({ ...editingRule, purpose: e.target.value })}
                />
              </div>
              <div>
                <Label>Rule Logic</Label>
                <Textarea
                  value={editingRule.ruleLogic}
                  onChange={(e) => setEditingRule({ ...editingRule, ruleLogic: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateRule(editingRule)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
