"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"

interface IncentiveRule {
  id: string
  networkId: string // Changed from clientId to networkId
  departmentCode: string
  rules: {
    nightDifferential?: { rate: number; conditions: string[] }
    floatingNurse?: { rate: number; conditions: string[] }
    weekendPremium?: { rate: number; conditions: string[] }
    holidayPay?: { rate: number; conditions: string[] }
  }
  effectiveFrom: Date
  effectiveTo?: Date
}

interface IncentiveEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: IncentiveRule | null
  onSave?: (rule: IncentiveRule) => void
}

export function IncentiveEditor({ open, onOpenChange, rule, onSave }: IncentiveEditorProps) {
  const [formData, setFormData] = useState<Partial<IncentiveRule>>(
    rule || {
      networkId: "", // Changed from clientId to networkId
      departmentCode: "",
      rules: {},
      effectiveFrom: new Date(),
    },
  )

  const [newRuleType, setNewRuleType] = useState("")
  const [newRuleRate, setNewRuleRate] = useState("")
  const [newRuleConditions, setNewRuleConditions] = useState("")

  const ruleTypes = [
    { value: "nightDifferential", label: "Night Differential" },
    { value: "floatingNurse", label: "Floating Nurse" },
    { value: "weekendPremium", label: "Weekend Premium" },
    { value: "holidayPay", label: "Holiday Pay" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.networkId && formData.departmentCode && formData.effectiveFrom) {
      // Updated condition
      onSave?.({
        id: rule?.id || `incentive-${Date.now()}`,
        networkId: formData.networkId, // Changed from clientId to networkId
        departmentCode: formData.departmentCode,
        rules: formData.rules || {},
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo,
      })
      onOpenChange(false)
    }
  }

  const addRule = () => {
    if (newRuleType && newRuleRate && newRuleConditions) {
      const conditions = newRuleConditions.split(",").map((c) => c.trim())
      setFormData({
        ...formData,
        rules: {
          ...formData.rules,
          [newRuleType]: {
            rate: Number.parseFloat(newRuleRate),
            conditions,
          },
        },
      })
      setNewRuleType("")
      setNewRuleRate("")
      setNewRuleConditions("")
    }
  }

  const removeRule = (ruleType: string) => {
    const newRules = { ...formData.rules }
    delete newRules[ruleType as keyof typeof newRules]
    setFormData({ ...formData, rules: newRules })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Incentive Rule" : "Create Incentive Rule"}</DialogTitle>
          <DialogDescription>
            Define incentive rules for specific network departments with effective date ranges
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="networkId">Network</Label> {/* Changed label from Client to Network */}
              <Select
                value={formData.networkId} // Changed from clientId to networkId
                onValueChange={(value) => setFormData({ ...formData, networkId: value })} // Updated field name
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="13">13 - Lehigh Valley</SelectItem>
                  <SelectItem value="16">16 - Willis Knighton</SelectItem>
                  <SelectItem value="18">18 - Baptist Arkansas</SelectItem>
                  <SelectItem value="19">19 - UofL</SelectItem>
                  <SelectItem value="21">21 - Parrish Medical Center</SelectItem>
                  <SelectItem value="29">29 - Arkansas Childrens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentCode">Department Code</Label>
              <Input
                id="departmentCode"
                value={formData.departmentCode}
                onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                placeholder="603 Safety Attendants"
                required
              />
            </div>
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom?.toISOString().split("T")[0]}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: new Date(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To (Optional)</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={formData.effectiveTo?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveTo: e.target.value ? new Date(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          {/* Current Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Incentive Rules</CardTitle>
              <CardDescription>Define the conditions and rates for various incentive types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.rules || {}).map(([ruleType, config]) => (
                <div key={ruleType} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ruleTypes.find((t) => t.value === ruleType)?.label || ruleType}</Badge>
                      <span className="text-sm font-medium">Rate: {config.rate}x</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Conditions: {config.conditions.join(", ")}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeRule(ruleType)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add New Rule */}
              <div className="grid grid-cols-4 gap-2 p-4 border-2 border-dashed rounded-lg">
                <Select value={newRuleType} onValueChange={setNewRuleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypes
                      .filter((type) => !formData.rules?.[type.value as keyof typeof formData.rules])
                      .map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Rate (e.g., 1.5)"
                  value={newRuleRate}
                  onChange={(e) => setNewRuleRate(e.target.value)}
                  type="number"
                  step="0.1"
                  min="1"
                />
                <Input
                  placeholder="Conditions (comma-separated)"
                  value={newRuleConditions}
                  onChange={(e) => setNewRuleConditions(e.target.value)}
                />
                <Button type="button" onClick={addRule} disabled={!newRuleType || !newRuleRate || !newRuleConditions}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Common condition examples:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Night Differential: shiftType === 'Night'</li>
                  <li>• Floating Nurse: timesheetDepartment !== shiftDepartment</li>
                  <li>• Weekend Premium: dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday'</li>
                  <li>• Holiday Pay: isHoliday === true</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{rule ? "Update" : "Create"} Rule</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
