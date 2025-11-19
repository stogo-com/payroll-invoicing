"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  type TransformationType,
  type TransformationCategory,
  type TransformationRule,
  TRANSFORMATION_TYPES,
} from "@/types/transformation-types"

interface TransformationRuleEditorProps {
  rule?: TransformationRule
  inputFields: string[]
  outputFields: string[]
  onSave: (rule: TransformationRule) => void
  onCancel: () => void
}

export function TransformationRuleEditor({
  rule,
  inputFields,
  outputFields,
  onSave,
  onCancel,
}: TransformationRuleEditorProps) {
  const [selectedType, setSelectedType] = useState<TransformationType | "">(rule?.name || "")
  const [purpose, setPurpose] = useState(rule?.purpose || "")
  const [ruleLogic, setRuleLogic] = useState(rule?.ruleLogic || "")
  const [selectedInputFields, setSelectedInputFields] = useState<string[]>(rule?.inputFields || [])
  const [selectedOutputFields, setSelectedOutputFields] = useState<string[]>(rule?.outputFields || [])

  const handleSave = () => {
    if (!selectedType) return

    const transformationRule: TransformationRule = {
      id: rule?.id || `rule-${Date.now()}`,
      name: selectedType,
      category: TRANSFORMATION_TYPES[selectedType].category,
      purpose,
      ruleLogic,
      dataPointsReferenced: [...selectedInputFields, ...selectedOutputFields],
      inputFields: selectedInputFields,
      outputFields: selectedOutputFields,
    }

    onSave(transformationRule)
  }

  const groupedTransformations = Object.entries(TRANSFORMATION_TYPES).reduce(
    (acc, [type, config]) => {
      if (!acc[config.category]) {
        acc[config.category] = []
      }
      acc[config.category].push({
        type: type as TransformationType,
        ...config,
      })
      return acc
    },
    {} as Record<
      TransformationCategory,
      Array<{
        type: TransformationType
        category: TransformationCategory
        description: string
      }>
    >,
  )

  return (
    <Card className="p-6 bg-white border-2 border-slate-200">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {rule ? "Edit Transformation Rule" : "Add Transformation Rule"}
          </h3>
        </div>

        {/* Transformation Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="transformation-type" className="text-sm font-medium">
            Transformation Type
          </Label>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as TransformationType)}>
            <SelectTrigger id="transformation-type" className="w-full">
              <SelectValue placeholder="Select transformation type..." />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {Object.entries(groupedTransformations).map(([category, types]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">{category}</div>
                  {types.map((t) => (
                    <SelectItem key={t.type} value={t.type}>
                      <div className="flex flex-col">
                        <span className="font-medium">{t.type}</span>
                        <span className="text-xs text-slate-500">{t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {selectedType && (
            <p className="text-xs text-slate-600 mt-1">{TRANSFORMATION_TYPES[selectedType].description}</p>
          )}
        </div>

        {/* Purpose */}
        <div className="space-y-2">
          <Label htmlFor="purpose" className="text-sm font-medium">
            Purpose
          </Label>
          <Input
            id="purpose"
            placeholder="Brief description of what this transformation does..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Rule Logic */}
        <div className="space-y-2">
          <Label htmlFor="rule-logic" className="text-sm font-medium">
            Rule Logic
          </Label>
          <Textarea
            id="rule-logic"
            placeholder="Detailed transformation logic and instructions..."
            value={ruleLogic}
            onChange={(e) => setRuleLogic(e.target.value)}
            className="w-full min-h-[120px] font-mono text-sm"
          />
        </div>

        {/* Input Fields */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Input Fields</Label>
          <div className="flex flex-wrap gap-2">
            {inputFields.map((field) => (
              <button
                key={field}
                onClick={() => {
                  setSelectedInputFields((prev) =>
                    prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
                  )
                }}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedInputFields.includes(field)
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {field}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Click to select input fields used in this transformation</p>
        </div>

        {/* Output Fields */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Output Fields</Label>
          <div className="flex flex-wrap gap-2">
            {outputFields.map((field) => (
              <button
                key={field}
                onClick={() => {
                  setSelectedOutputFields((prev) =>
                    prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
                  )
                }}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedOutputFields.includes(field)
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {field}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Click to select output fields created or modified by this transformation
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={!selectedType || !purpose} className="flex-1">
            {rule ? "Update Rule" : "Add Rule"}
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
