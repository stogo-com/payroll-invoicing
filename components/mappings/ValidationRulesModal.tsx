"use client"

import { useState } from "react"
import type { ValidationRule } from "@/types/mapping"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ValidationRulesModalProps {
  open: boolean
  onClose: () => void
  rules: ValidationRule[]
  onSave: (rules: ValidationRule[]) => void
  fieldName: string
}

export function ValidationRulesModal({ open, onClose, rules, onSave, fieldName }: ValidationRulesModalProps) {
  const [localRules, setLocalRules] = useState<ValidationRule[]>(rules)

  const addRule = () => {
    setLocalRules([
      ...localRules,
      {
        id: Date.now().toString(),
        fieldName,
        ruleType: "required",
        errorMessage: "",
      },
    ])
  }

  const updateRule = (id: string, updates: Partial<ValidationRule>) => {
    setLocalRules(localRules.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const deleteRule = (id: string) => {
    setLocalRules(localRules.filter((r) => r.id !== id))
  }

  const handleSave = () => {
    onSave(localRules)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation Rules for {fieldName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {localRules.map((rule) => (
            <div key={rule.id} className="grid gap-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Rule {localRules.indexOf(rule) + 1}</h4>
                <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                  Delete
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Rule Type</Label>
                  <Select value={rule.ruleType} onValueChange={(value) => updateRule(rule.id, { ruleType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="regex">Regex Pattern</SelectItem>
                      <SelectItem value="minValue">Min Value</SelectItem>
                      <SelectItem value="maxValue">Max Value</SelectItem>
                      <SelectItem value="minLength">Min Length</SelectItem>
                      <SelectItem value="maxLength">Max Length</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Condition</Label>
                  <Input
                    value={rule.condition || ""}
                    onChange={(e) => updateRule(rule.id, { condition: e.target.value })}
                    placeholder="e.g., ^[0-9]{5}$"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Error Message</Label>
                <Input
                  value={rule.errorMessage}
                  onChange={(e) => updateRule(rule.id, { errorMessage: e.target.value })}
                  placeholder="e.g., This field is required"
                />
              </div>
            </div>
          ))}
          <Button onClick={addRule} variant="outline" className="w-full bg-transparent">
            Add Validation Rule
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Rules</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
