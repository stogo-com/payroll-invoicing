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
import { type TransformationType, TRANSFORMATION_TYPES, type TransformationRule } from "@/types/transformation-types"
import { DEFAULT_PAYROLL_CONFIG, type IncentiveRule } from "@/lib/payroll-transformer-config"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

export function PayrollMapping({ clientId }: { clientId: number }) {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("LVHN")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [uploadedFiles, setUploadedFiles] = useState<{
    rawTimecard?: File
    manualAdds?: File
    crosswalk?: File
  }>({})

  // Initialize with empty arrays - will be loaded from API
  const [transformations, setTransformations] = useState<TransformationRule[]>([])
  const [incentiveRules, setIncentiveRules] = useState<IncentiveRule[]>([])
  const [incentivesEnabled, setIncentivesEnabled] = useState(true)
  const [incentiveValidThrough, setIncentiveValidThrough] = useState("2025-11-08")

  // Load rules from API on mount
  useEffect(() => {
    loadRules()
  }, [clientId])

  const loadRules = async () => {
    setIsLoading(true)
    try {
      // Convert clientId to string for API
      const clientIdStr = String(clientId)
      
      // Load transformation rules
      const transformResponse = await fetch(
        `/api/mappings/payroll/${clientIdStr}/transformations`
      )
      
      if (transformResponse.ok) {
        const transformData = await transformResponse.json()
        if (transformData.rules && transformData.rules.length > 0) {
          setTransformations(transformData.rules)
        } else {
          // If no rules exist, use defaults
          setTransformations(getDefaultTransformationRules())
        }
      } else {
        // If API call failed, use defaults
        console.warn("[v0] Failed to load transformation rules, using defaults")
        setTransformations(getDefaultTransformationRules())
      }

      // Load incentive rules
      const incentiveResponse = await fetch(
        `/api/mappings/payroll/${clientIdStr}/incentives`
      )
      
      if (incentiveResponse.ok) {
        const incentiveData = await incentiveResponse.json()
        if (incentiveData.rules && incentiveData.rules.length > 0) {
          setIncentiveRules(incentiveData.rules)
        } else {
          setIncentiveRules(DEFAULT_PAYROLL_CONFIG.incentives.rules)
        }
        setIncentivesEnabled(incentiveData.enabled ?? true)
        if (incentiveData.validThrough) {
          setIncentiveValidThrough(incentiveData.validThrough.split("T")[0])
        }
      } else {
        // If API call failed, use defaults
        console.warn("[v0] Failed to load incentive rules, using defaults")
        setIncentiveRules(DEFAULT_PAYROLL_CONFIG.incentives.rules)
      }
    } catch (error) {
      console.error("[v0] Error loading rules:", error)
      // Fallback to defaults on error
      setTransformations(getDefaultTransformationRules())
      setIncentiveRules(DEFAULT_PAYROLL_CONFIG.incentives.rules)
    } finally {
      setIsLoading(false)
    }
  }

  const saveRules = async () => {
    setIsSaving(true)
    try {
      const clientIdStr = String(clientId)
      
      // Save transformation rules
      await fetch(`/api/mappings/payroll/${clientIdStr}/transformations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: transformations }),
      })

      // Save incentive rules
      await fetch(`/api/mappings/payroll/${clientIdStr}/incentives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: incentiveRules,
          enabled: incentivesEnabled,
          validThrough: incentiveValidThrough,
        }),
      })

      toast({
        title: "Rules saved",
        description: "Transformation and incentive rules have been saved successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving rules:", error)
      toast({
        title: "Save failed",
        description: "Failed to save rules. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to get default transformation rules
  const getDefaultTransformationRules = (): TransformationRule[] => {
    // Return the default rules (the ones currently hardcoded)
    return [
      // Step 1: Stack/Merge
      {
        id: "1",
        name: "Stack",
        category: "Merge",
        purpose: "Merge raw timecards with manual adds into a single dataset",
        ruleLogic: "Combine WD_contingentworker_STOGO file and Manual Adds LVHN file by stacking all records",
        dataPointsReferenced: ["All columns from both files"],
        inputFields: ["WD_contingentworker_STOGO", "Manual Adds LVHN"],
        outputFields: ["Stacked Timecard Records"],
      },
      // Step 2: Extract Time from DateTime
      {
        id: "2",
        name: "Extract",
        category: "Format",
        purpose: "Extract time portion from clocking times (HH:MM:SS → HH:MM)",
        ruleLogic: "Extract first 5 characters from end of In-Clocking Time and Out-Clocking Time to get HH:MM format",
        dataPointsReferenced: ["In-Clocking Time", "Out-Clocking Time"],
        inputFields: ["In-Clocking Time", "Out-Clocking Time"],
        outputFields: ["In-Clocking Time", "Out-Clocking Time"],
      },
      // Step 3: Lookup Stogo EID
      {
        id: "3",
        name: "Lookup",
        category: "Merge",
        purpose: "Lookup Stogo EID from crosswalk using EmployeeID",
        ruleLogic: "Match EmployeeID from timecard with EEID in crosswalk file, return 'Lookup *Employee Number' as StogoEID",
        dataPointsReferenced: ["EmployeeID", "EEID", "Lookup *Employee Number"],
        inputFields: ["EmployeeID", "API to STOGO EE Crosswalk"],
        outputFields: ["StogoEID"],
      },
      // Step 4: Filter - Remove records without Stogo EID
      {
        id: "4",
        name: "Filter",
        category: "Row",
        purpose: "Remove records without a Stogo EID",
        ruleLogic: "Keep only records where StogoEID exists and is not empty",
        dataPointsReferenced: ["StogoEID"],
        inputFields: ["StogoEID"],
        outputFields: ["Filtered Records"],
      },
      // Step 5: Calculate Lunch Time
      {
        id: "5",
        name: "If",
        category: "Conditional",
        purpose: "Calculate lunch time based on UserShiftAnswer-OutClocking",
        ruleLogic: "IF UserShiftAnswer-OutClocking = 'Yes' THEN 0.5 ELSE 0",
        dataPointsReferenced: ["UserShiftAnswer-OutClocking"],
        inputFields: ["UserShiftAnswer-OutClocking"],
        outputFields: ["LunchTime"],
      },
      // Step 6: Calculate Pay Hours
      {
        id: "6",
        name: "Calculate",
        category: "Column",
        purpose: "Calculate pay hours by subtracting lunch time from total hours",
        ruleLogic: "PayHours = Hours - LunchTime (rounded to 2 decimal places)",
        dataPointsReferenced: ["Hours", "LunchTime"],
        inputFields: ["Hours", "LunchTime"],
        outputFields: ["PayHours"],
      },
      // Step 7: Filter - Separate records with and without In-Clocking GUID
      {
        id: "7",
        name: "Filter",
        category: "Row",
        purpose: "Identify records with In-Clocking GUID",
        ruleLogic: "Keep records where In-Clocking GUID is not empty",
        dataPointsReferenced: ["In-Clocking GUID"],
        inputFields: ["In-Clocking GUID"],
        outputFields: ["Records with GUID"],
      },
      // Step 8: Concat - Create Timecard ID when GUID is missing
      {
        id: "8",
        name: "Concat Cols",
        category: "Column",
        purpose: "Create Timecard ID from date, time, and EID when GUID is absent",
        ruleLogic: "Concatenate In-Clocking Date + In-Clocking Time + StogoEID to create In-Clocking GUID",
        dataPointsReferenced: ["In-Clocking Date", "In-Clocking Time", "StogoEID"],
        inputFields: ["In-Clocking Date", "In-Clocking Time", "StogoEID"],
        outputFields: ["In-Clocking GUID"],
      },
      // Step 9: Replace - Remove special characters from Timecard ID
      {
        id: "9",
        name: "Replace",
        category: "Format",
        purpose: "Remove blanks, colons, and dashes from In-Clocking GUID",
        ruleLogic: "Replace blanks, ':', and '-' with empty string in In-Clocking GUID",
        dataPointsReferenced: ["In-Clocking GUID"],
        inputFields: ["In-Clocking GUID"],
        outputFields: ["In-Clocking GUID"],
      },
      // Step 10: Stack - Merge records with and without GUID back together
      {
        id: "10",
        name: "Stack",
        category: "Merge",
        purpose: "Merge records with GUID and records with generated Timecard ID",
        ruleLogic: "Stack records that had GUID with records that had Timecard ID created",
        dataPointsReferenced: ["All columns"],
        inputFields: ["All processed records"],
        outputFields: ["Merged Records"],
      },
      // Step 11: Rename Columns
      {
        id: "11",
        name: "Rename Cols",
        category: "Column",
        purpose: "Rename In-Clocking GUID to Timecard ID",
        ruleLogic: "Rename column 'In-Clocking GUID' to 'Timecard ID'",
        dataPointsReferenced: ["In-Clocking GUID"],
        inputFields: ["In-Clocking GUID"],
        outputFields: ["Timecard ID"],
      },
      // Step 12: Remove Columns - Clean up intermediate columns
      {
        id: "12",
        name: "Remove Cols",
        category: "Column",
        purpose: "Remove intermediate columns that are no longer needed",
        ruleLogic: "Remove EmployeeID, Hours, Paycode, UserShiftAnswer-OutClocking, Last Time Approved, Lunch Time",
        dataPointsReferenced: ["EmployeeID", "Hours", "Paycode", "UserShiftAnswer-OutClocking", "Last Time Approved", "Lunch Time"],
        inputFields: ["EmployeeID", "Hours", "Paycode", "UserShiftAnswer-OutClocking", "Last Time Approved", "Lunch Time"],
        outputFields: [],
      },
      // Step 13: Determine Day/Night Shift
      {
        id: "13",
        name: "If",
        category: "Conditional",
        purpose: "Determine if shift is Day or Night based on clock dates",
        ruleLogic: "IF Out-Clocking Date > In-Clocking Date THEN 'Night' ELSE 'Day'",
        dataPointsReferenced: ["In-Clocking Date", "Out-Clocking Date"],
        inputFields: ["In-Clocking Date", "Out-Clocking Date"],
        outputFields: ["ShiftType"],
      },
      // Step 14: Replace - Assign Pay Rates based on Day/Night
      {
        id: "14",
        name: "Replace",
        category: "Column",
        purpose: "Replace Day/Night with base pay rates",
        ruleLogic: "Replace 'Day' with '58' and 'Night' with '63' in ShiftType column, create Pay Rate column",
        dataPointsReferenced: ["ShiftType"],
        inputFields: ["ShiftType"],
        outputFields: ["PayRate"],
      },
      // Step 15: Assign Pay Rates with Incentives
      {
        id: "15",
        name: "Assign",
        category: "Column",
        purpose: "Apply incentive rules to base pay rates",
        ruleLogic: "Base: Day = $58/hr, Night = $63/hr. Apply incentives: Cedar Crest (Sat/Sun days $5, Fri/Sat/Sun nights $10), Carbon (nights $10), Schuylkill (nights $10). Valid through 11/08/2025",
        dataPointsReferenced: ["PayRate", "Company", "Cost Center", "In-Clocking Date", "In-Clocking Time", "Out-Clocking Time"],
        inputFields: ["PayRate", "Company", "Cost Center", "In-Clocking Date", "In-Clocking Time", "Out-Clocking Time"],
        outputFields: ["PayRate", "hasIncentive"],
      },
      // Step 16: Replace - Assign Pay Codes based on Day/Night
      {
        id: "16",
        name: "Replace",
        category: "Column",
        purpose: "Replace Day/Night with pay codes",
        ruleLogic: "Replace 'Day' with 'FXDY' and 'Night' with 'FXNT' in ShiftType column, create Pay Code column",
        dataPointsReferenced: ["ShiftType"],
        inputFields: ["ShiftType"],
        outputFields: ["PayCode"],
      },
      // Step 17: Add Blank Column
      {
        id: "17",
        name: "New Col",
        category: "Column",
        purpose: "Add blank column as required by output format",
        ruleLogic: "Add column 'Blank' with single space value",
        dataPointsReferenced: [],
        inputFields: [],
        outputFields: ["Blank"],
      },
      // Step 18: Lookup TNAA
      {
        id: "18",
        name: "Lookup",
        category: "Merge",
        purpose: "Lookup TNAA from facility crosswalk using Company",
        ruleLogic: "Match Company (from timecard) with Stogo Code (from facility crosswalk), return TNAA. Remove 'HS' prefix if present",
        dataPointsReferenced: ["Company", "Stogo Code", "TNAA"],
        inputFields: ["Company", "TNAA to STOGO Facility Crosswalk"],
        outputFields: ["LookupTNAA"],
      },
      // Step 19: Concat - Create Shift ID
      {
        id: "19",
        name: "Concat Cols",
        category: "Column",
        purpose: "Create Shift ID from date and Stogo EID",
        ruleLogic: "Concatenate In-Clocking Date (YYYYMMDD format) + StogoEID to create Shift ID",
        dataPointsReferenced: ["In-Clocking Date", "StogoEID"],
        inputFields: ["In-Clocking Date", "StogoEID"],
        outputFields: ["ShiftID"],
      },
      // Step 20: Replace - Remove special characters from Shift ID
      {
        id: "20",
        name: "Replace",
        category: "Format",
        purpose: "Remove slashes from Shift ID",
        ruleLogic: "Replace '/' with empty string in Shift ID",
        dataPointsReferenced: ["ShiftID"],
        inputFields: ["ShiftID"],
        outputFields: ["ShiftID"],
      },
      // Step 21: Lookup Shift ID
      {
        id: "21",
        name: "Lookup",
        category: "Merge",
        purpose: "Lookup Shift ID from shifts file using Person ID and date",
        ruleLogic: "Match Person ID (from shifts) = Stogo EID (from timecard) AND date matches, return Shift ID from shifts file",
        dataPointsReferenced: ["StogoEID", "Person ID", "start_date_time", "Shift ID"],
        inputFields: ["StogoEID", "In-Clocking Date", "LVHN Time Input File"],
        outputFields: ["LookupShiftID"],
      },
      // Step 22: Lookup Person Name
      {
        id: "22",
        name: "Lookup",
        category: "Merge",
        purpose: "Lookup Person Name from shifts file using Person ID",
        ruleLogic: "Match Person ID (from shifts) = Stogo EID (from timecard), return Person Name. Fallback to FirstName + LastName if not found",
        dataPointsReferenced: ["StogoEID", "Person ID", "Person Name"],
        inputFields: ["StogoEID", "LVHN Time Input File"],
        outputFields: ["LookupPersonName"],
      },
      // Step 23: Date Format - Format In-Clocking Date
      {
        id: "23",
        name: "DateTime Format",
        category: "Format",
        purpose: "Format In-Clocking Date to MM/dd/yy format",
        ruleLogic: "Convert In-Clocking Date from yyyy-MM-dd format to MM/dd/yy format",
        dataPointsReferenced: ["In-Clocking Date"],
        inputFields: ["In-Clocking Date"],
        outputFields: ["In-Clocking Date"],
      },
      // Step 24: Replace - Remove NU/HS prefixes from Stogo EID
      {
        id: "24",
        name: "Replace",
        category: "Format",
        purpose: "Remove NU and HS prefixes from Stogo EID",
        ruleLogic: "Replace 'NU' and 'HS' prefixes with empty string in Stogo EID",
        dataPointsReferenced: ["StogoEID"],
        inputFields: ["StogoEID"],
        outputFields: ["StogoEID"],
      },
      // Step 25: Assign Approver
      {
        id: "25",
        name: "If",
        category: "Conditional",
        purpose: "Assign approver name based on network",
        ruleLogic: "IF Network = 'LEHIGH' THEN 'Jennifer Devine' ELSE IF Network = 'BHA' THEN 'Debra Langley' ELSE IF Network = 'AR CHILDRENS' THEN 'Maria Allred' ELSE IF Network = 'UOFL' THEN 'Tim Peach' ELSE IF Network = 'SHANNON' THEN 'Tracy Lasater' ELSE IF Network = 'PARRISH' THEN 'Shannon Lapinski' ELSE IF Network = 'WILLIS KNIGHTON' THEN 'Stephanie Player' ELSE IF Network = 'MULTICARE' THEN 'Samantha Hamilton'",
        dataPointsReferenced: ["Network"],
        inputFields: ["Network"],
        outputFields: ["Approver"],
      },
      // Step 26: Reorder Columns
      {
        id: "26",
        name: "Reorder Cols",
        category: "Column",
        purpose: "Reorder columns to match final output format",
        ruleLogic: "Reorder columns to: Stogo EID, Pay Code, Pay Hours, Pay Rate, Blank, Lookup TNAA, Timecard ID, Meta Info, Lookup Shift ID, Lookup Person Name, In-Clocking Date, In-Clocking Time, Out-Clocking Date, Out-Clocking Time, Approver, Company, Company Description, Cost Center, Cost Center Description",
        dataPointsReferenced: ["All columns"],
        inputFields: ["All columns"],
        outputFields: ["Reordered Columns"],
      },
      // Step 27: Remove Columns - Final cleanup
      {
        id: "27",
        name: "Remove Cols",
        category: "Column",
        purpose: "Remove temporary columns not needed in final output",
        ruleLogic: "Remove Shift ID, Network, and any other temporary columns",
        dataPointsReferenced: ["Shift ID", "Network"],
        inputFields: ["Shift ID", "Network"],
        outputFields: [],
      },
      // Step 28: Whitespace - Clean up any remaining whitespace issues
      {
        id: "28",
        name: "Whitespace",
        category: "Format",
        purpose: "Clean up whitespace in all text fields",
        ruleLogic: "Trim whitespace, remove line feeds, tabs, carriage returns, consecutive spaces, and non-printable characters",
        dataPointsReferenced: ["All text columns"],
        inputFields: ["All text columns"],
        outputFields: ["Cleaned text columns"],
      },
    ]
  }

  const [isAddTransformOpen, setIsAddTransformOpen] = useState(false)
  const [editingTransform, setEditingTransform] = useState<TransformationRule | null>(null)
  const [newTransform, setNewTransform] = useState<Partial<TransformationRule>>({
    name: "Filter",
    category: "Row",
    purpose: "",
    ruleLogic: "",
    dataPointsReferenced: [],
    inputFields: [],
    outputFields: [],
  })

  // Add these missing state variables for incentive management
  const [isAddIncentiveOpen, setIsAddIncentiveOpen] = useState(false)
  const [editingIncentive, setEditingIncentive] = useState<IncentiveRule | null>(null)
  const [newIncentive, setNewIncentive] = useState<Partial<IncentiveRule>>({
    company: "",
    costCenters: [],
    dayOfWeek: undefined,
    shiftType: undefined,
    timeRange: undefined,
    amount: 0,
    description: "",
  })

  const handleFileUpload = (fileType: "rawTimecard" | "manualAdds" | "crosswalk", file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [fileType]: file }))
  }

  // Helper function to generate rule logic preview from structured inputs
  const generateRuleLogicPreview = (transform: Partial<TransformationRule>): string => {
    if (!transform.name) return ""

    const params = transform.parameters || {}

    switch (transform.name) {
      case "Filter":
        const filterCol = params.filterColumn || "column"
        const condition = params.condition || "not_empty"
        const value = params.value ? ` "${params.value}"` : ""
        const conditionText = condition === "not_empty" ? "is not empty" : condition === "equals" ? `equals${value}` : condition
        return `Keep rows where ${filterCol} ${conditionText}`
      
      case "Lookup":
        return `Match ${params.matchKey || "source"} with ${params.lookupKey || "key"} in ${params.lookupFile || "file"} → return ${params.returnColumn || "column"}`
      
      case "Calculate":
        const op = params.operation === "subtract" ? "-" : params.operation === "add" ? "+" : params.operation === "multiply" ? "×" : "÷"
        return `${params.firstColumn || "Column1"} ${op} ${params.secondValue || "Column2"}`
      
      case "Assign":
        if (params.assignType === "value") {
          return `Set ${params.targetColumn || "column"} = ${params.value || "value"}`
        } else if (params.assignType === "conditional") {
          return `Conditionally assign ${params.targetColumn || "column"}`
        } else {
          return `Copy to ${params.targetColumn || "column"}`
        }
      
      case "DateTime Format":
        return `Format ${params.sourceColumn || "column"} to ${params.format || "format"}`
      
      default:
        return transform.ruleLogic || "Configure the transformation above"
    }
  }

  const handleAddTransformation = () => {
    if (!newTransform.name || !newTransform.purpose) return

    const transformType = TRANSFORMATION_TYPES[newTransform.name as TransformationType]

    // Generate rule logic from structured parameters
    const ruleLogic = generateRuleLogicPreview(newTransform) || newTransform.ruleLogic || ""

    const transformation: TransformationRule = {
      id: Date.now().toString(),
      name: newTransform.name as TransformationType,
      category: transformType.category,
      purpose: newTransform.purpose,
      ruleLogic: ruleLogic,
      dataPointsReferenced: newTransform.dataPointsReferenced || [],
      inputFields: newTransform.inputFields || [],
      outputFields: newTransform.outputFields || [],
      parameters: newTransform.parameters || {},
    }

    setTransformations((prev) => [...prev, transformation])
    // Reset form
    setNewTransform({
      name: "Filter",
      category: "Row",
      purpose: "",
      ruleLogic: "",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: [],
    })
    setIsAddTransformOpen(false)
    setTimeout(() => saveRules(), 500)
  }

  const handleEditTransformation = (transform: TransformationRule) => {
    setEditingTransform(transform)
    setNewTransform(transform)
    setIsAddTransformOpen(true)
  }

  const handleUpdateTransformation = () => {
    if (!editingTransform) return

    setTransformations((prev) =>
      prev.map((t) => (t.id === editingTransform.id ? { ...editingTransform, ...newTransform } : t)),
    )
    // Auto-save after update
    setTimeout(() => saveRules(), 500)
    setEditingTransform(null)
    setNewTransform({
      name: "Filter",
      category: "Row",
      purpose: "",
      ruleLogic: "",
      dataPointsReferenced: [],
      inputFields: [],
      outputFields: [],
    })
    setIsAddTransformOpen(false)
  }

  const handleDeleteTransformation = (id: string) => {
    setTransformations((prev) => prev.filter((t) => t.id !== id))
    setTimeout(() => saveRules(), 500)
  }

  const handleAddIncentive = () => {
    if (!newIncentive.company || !newIncentive.amount || newIncentive.costCenters?.length === 0) {
      return
    }

    const incentive: IncentiveRule = {
      company: newIncentive.company,
      costCenters: newIncentive.costCenters || [],
      dayOfWeek: newIncentive.dayOfWeek,
      shiftType: newIncentive.shiftType,
      timeRange: newIncentive.timeRange,
      amount: newIncentive.amount || 0,
      description: newIncentive.description || "",
    }

    setIncentiveRules((prev) => [...prev, incentive])
    // Auto-save after a short delay
    setTimeout(() => saveRules(), 500)
    setNewIncentive({
      company: "",
      costCenters: [],
      dayOfWeek: undefined,
      shiftType: undefined,
      timeRange: undefined,
      amount: 0,
      description: "",
    })
    setIsAddIncentiveOpen(false)
  }

  const handleEditIncentive = (incentive: IncentiveRule, index: number) => {
    setEditingIncentive({ ...incentive, id: index.toString() } as any)
    setNewIncentive(incentive)
    setIsAddIncentiveOpen(true)
  }

  const handleUpdateIncentive = () => {
    if (!editingIncentive || !newIncentive.company || !newIncentive.amount) return

    const index = parseInt((editingIncentive as any).id, 10)
    setIncentiveRules((prev) =>
      prev.map((rule, i) =>
        i === index
          ? {
              company: newIncentive.company!,
              costCenters: newIncentive.costCenters || [],
              dayOfWeek: newIncentive.dayOfWeek,
              shiftType: newIncentive.shiftType,
              timeRange: newIncentive.timeRange,
              amount: newIncentive.amount || 0,
              description: newIncentive.description || "",
            }
          : rule
      )
    )
    // Auto-save after update
    setTimeout(() => saveRules(), 500)
    setEditingIncentive(null)
    setNewIncentive({
      company: "",
      costCenters: [],
      dayOfWeek: undefined,
      shiftType: undefined,
      timeRange: undefined,
      amount: 0,
      description: "",
    })
    setIsAddIncentiveOpen(false)
  }

  const handleDeleteIncentive = (index: number) => {
    setIncentiveRules((prev) => prev.filter((_, i) => i !== index))
    setTimeout(() => saveRules(), 500)
  }

  const handleGeneratePayroll = async () => {
    if (!uploadedFiles.rawTimecard || !uploadedFiles.manualAdds || !uploadedFiles.crosswalk) {
      return
    }

    setIsProcessing(true)

    try {
      // Create FormData to send files to the API
      const formData = new FormData()
      formData.append("rawTimecard", uploadedFiles.rawTimecard)
      formData.append("manualAdds", uploadedFiles.manualAdds)
      formData.append("crosswalk", uploadedFiles.crosswalk)
      formData.append("network", selectedNetwork)
      formData.append("transformations", JSON.stringify(transformations))
      formData.append("incentiveRules", JSON.stringify(incentiveRules))
      formData.append("incentivesEnabled", JSON.stringify(incentivesEnabled))
      formData.append("incentiveValidThrough", incentiveValidThrough)

      // Call the API to process files
      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate payroll file")
      }

      // Get the generated file as blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create download link and trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = `LVHN_Payroll_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("✓ Payroll file generated and downloaded successfully!")
    } catch (error) {
      console.error("Error generating payroll:", error)
      alert("Error generating payroll file. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Merge":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Row":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Column":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Format":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Conditional":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "Input":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Network Selection</h3>
            <p className="text-sm text-muted-foreground">Select the network to process payroll files for</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="network">Network</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger id="network" className="w-full md:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LVHN">LVHN - Lehigh Valley Health Network</SelectItem>
                <SelectItem value="ARCHI">ARCHI - Arkansas Children's</SelectItem>
                <SelectItem value="ULOU">ULOU - University of Louisville</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* File Upload Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Input Files</h3>
        <p className="text-sm text-muted-foreground mb-6">Upload the 3 required files to generate the payroll output</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Raw Timecard File */}
          <div className="space-y-2">
            <Label htmlFor="raw-timecard">
              WD_contingentworker_STOGO_[date]
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="raw-timecard"
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload("rawTimecard", file)
              }}
            />
            {uploadedFiles.rawTimecard && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span className="truncate">{uploadedFiles.rawTimecard.name}</span>
              </p>
            )}
          </div>

          {/* Manual Adds File */}
          <div className="space-y-2">
            <Label htmlFor="manual-adds">
              Manual Adds LVHN [date]
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="manual-adds"
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload("manualAdds", file)
              }}
            />
            {uploadedFiles.manualAdds && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span className="truncate">{uploadedFiles.manualAdds.name}</span>
              </p>
            )}
          </div>

          {/* Crosswalk File */}
          <div className="space-y-2">
            <Label htmlFor="crosswalk">
              API to STOGO EE Crosswalk
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="crosswalk"
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload("crosswalk", file)
              }}
            />
            {uploadedFiles.crosswalk && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span className="truncate">{uploadedFiles.crosswalk.name}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Transformation Pipeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Transformation Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              {transformations.length} transformation{transformations.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={saveRules}
              disabled={isSaving || isLoading}
            >
              {isSaving ? "Saving..." : "Save Rules"}
            </Button>
            <Dialog open={isAddTransformOpen} onOpenChange={setIsAddTransformOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingTransform(null)
                    setNewTransform({
                      name: "Filter",
                      category: "Row",
                      purpose: "",
                      ruleLogic: "",
                      dataPointsReferenced: [],
                      inputFields: [],
                      outputFields: [],
                    })
                  }}
                >
                  Add Transformation
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="!max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col sm:!max-w-[95vw]"
                style={{ maxWidth: '95vw', width: '95vw' }}
              >
                <DialogHeader className="pb-4 border-b px-8 pt-6">
                  <DialogTitle className="text-2xl">{editingTransform ? "Edit" : "Add"} Transformation Rule</DialogTitle>
                  <DialogDescription className="text-base">
                    Configure your transformation rule step by step
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-8">
                  {/* Top Row: Basic Information - Horizontal */}
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Transformation Type *</Label>
                      <Select
                        value={newTransform.name}
                        onValueChange={(value) => {
                          const transformType = TRANSFORMATION_TYPES[value as TransformationType]
                          setNewTransform((prev) => ({
                            ...prev,
                            name: value as TransformationType,
                            category: transformType.category,
                            inputFields: [],
                            outputFields: [],
                            ruleLogic: "",
                            parameters: {},
                          }))
                        }}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRANSFORMATION_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div className="font-medium">{key}</div>
                                <div className="text-xs text-muted-foreground">{value.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label className="text-base font-semibold">Purpose / Description *</Label>
                      <Input
                        placeholder="Describe what this transformation does..."
                        value={newTransform.purpose || ""}
                        onChange={(e) => setNewTransform((prev) => ({ ...prev, purpose: e.target.value }))}
                        className="h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Category</Label>
                      <div className="h-11 flex items-center px-3 bg-muted rounded-md">
                        <Badge variant="secondary">
                          {newTransform.category || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section: Input Sources and Configuration - Side by Side */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Left: Input Sources */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-semibold">Input Sources</Label>
                      </div>
                      
                      {/* Files */}
                      <div className="space-y-3 p-4 border rounded-lg bg-card">
                        <Label className="text-sm font-medium text-muted-foreground">Source Files</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {["WD_contingentworker_STOGO", "Manual Adds LVHN", "API to STOGO EE Crosswalk", "TNAA to STOGO Facility Crosswalk", "LVHN Time Input File"].map((file) => (
                            <div key={file} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                              <Checkbox
                                id={`file-${file}`}
                                checked={newTransform.inputFields?.some(f => f === file) || false}
                                onCheckedChange={(checked) => {
                                  const current = newTransform.inputFields || []
                                  if (checked) {
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      inputFields: [...current, file],
                                    }))
                                  } else {
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      inputFields: current.filter((f) => f !== file),
                                    }))
                                  }
                                }}
                              />
                              <Label htmlFor={`file-${file}`} className="text-sm font-normal cursor-pointer flex-1">
                                {file}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Columns */}
                      <div className="space-y-3 p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-muted-foreground">Source Columns</Label>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                          {[
                            "EmployeeID", "FirstName", "LastName", "In-Clocking Date", "In-Clocking Time",
                            "Out-Clocking Date", "Out-Clocking Time", "Hours", "Company", "Cost Center",
                            "StogoEID", "TimecardID", "ShiftType", "PayRate", "PayCode", "PayHours"
                          ].map((col) => (
                            <div key={col} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                              <Checkbox
                                id={`col-${col}`}
                                checked={newTransform.inputFields?.some(f => f === col) || false}
                                onCheckedChange={(checked) => {
                                  const current = newTransform.inputFields || []
                                  if (checked) {
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      inputFields: [...current, col],
                                    }))
                                  } else {
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      inputFields: current.filter((f) => f !== col),
                                    }))
                                  }
                                }}
                              />
                              <Label htmlFor={`col-${col}`} className="text-sm font-normal cursor-pointer flex-1">
                                {col}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Input
                          placeholder="Type custom column name and press Enter"
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const value = e.currentTarget.value.trim()
                              if (value && !newTransform.inputFields?.includes(value)) {
                                setNewTransform((prev) => ({
                                  ...prev,
                                  inputFields: [...(prev.inputFields || []), value],
                                }))
                                e.currentTarget.value = ""
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Right: Configuration */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Configuration</Label>
                      
                      <div className="p-4 border rounded-lg bg-card min-h-[400px]">
                        {/* Filter Configuration */}
                        {newTransform.name === "Filter" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Filter Column</Label>
                                <Select
                                  value={newTransform.parameters?.filterColumn || ""}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, filterColumn: value },
                                      ruleLogic: `Keep rows where ${value} is not empty`,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(newTransform.inputFields || []).filter(f => !f.includes("_") && !f.includes("STOGO") && !f.includes("LVHN")).map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {field}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Condition</Label>
                                <Select
                                  value={newTransform.parameters?.condition || "not_empty"}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, condition: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_empty">Is Not Empty</SelectItem>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="greater_than">Greater Than</SelectItem>
                                    <SelectItem value="less_than">Less Than</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {newTransform.parameters?.condition === "equals" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Value to Match</Label>
                                <Input
                                  placeholder="Enter value"
                                  value={newTransform.parameters?.value || ""}
                                  onChange={(e) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, value: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lookup Configuration */}
                        {newTransform.name === "Lookup" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Lookup File</Label>
                              <Select
                                value={newTransform.parameters?.lookupFile || ""}
                                onValueChange={(value) =>
                                  setNewTransform((prev) => ({
                                    ...prev,
                                    parameters: { ...prev.parameters, lookupFile: value },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select lookup file" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="API to STOGO EE Crosswalk">API to STOGO EE Crosswalk</SelectItem>
                                  <SelectItem value="TNAA to STOGO Facility Crosswalk">TNAA to STOGO Facility Crosswalk</SelectItem>
                                  <SelectItem value="LVHN Time Input File">LVHN Time Input File</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Match Key (Source Column)</Label>
                                <Select
                                  value={newTransform.parameters?.matchKey || ""}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, matchKey: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(newTransform.inputFields || []).filter(f => !f.includes("_") && !f.includes("STOGO") && !f.includes("LVHN")).map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {field}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Lookup Key (In File)</Label>
                                <Input
                                  placeholder="e.g., EEID, Stogo Code"
                                  value={newTransform.parameters?.lookupKey || ""}
                                  onChange={(e) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, lookupKey: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Return Column</Label>
                              <Input
                                placeholder="e.g., Lookup *Employee Number, TNAA"
                                value={newTransform.parameters?.returnColumn || ""}
                                onChange={(e) =>
                                  setNewTransform((prev) => ({
                                    ...prev,
                                    parameters: { ...prev.parameters, returnColumn: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* Calculate Configuration */}
                        {newTransform.name === "Calculate" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">First Column</Label>
                                <Select
                                  value={newTransform.parameters?.firstColumn || ""}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, firstColumn: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(newTransform.inputFields || []).filter(f => !f.includes("_") && !f.includes("STOGO") && !f.includes("LVHN")).map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {field}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Operation</Label>
                                <Select
                                  value={newTransform.parameters?.operation || "subtract"}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, operation: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="add">+ Add</SelectItem>
                                    <SelectItem value="subtract">- Subtract</SelectItem>
                                    <SelectItem value="multiply">× Multiply</SelectItem>
                                    <SelectItem value="divide">÷ Divide</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Second Column / Value</Label>
                                <Input
                                  placeholder="Column or number"
                                  value={newTransform.parameters?.secondValue || ""}
                                  onChange={(e) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, secondValue: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Assign Configuration */}
                        {newTransform.name === "Assign" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Target Column</Label>
                                <Input
                                  placeholder="e.g., PayRate, PayCode, Approver"
                                  value={newTransform.parameters?.targetColumn || ""}
                                  onChange={(e) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, targetColumn: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Assignment Type</Label>
                                <Select
                                  value={newTransform.parameters?.assignType || "value"}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, assignType: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="value">Fixed Value</SelectItem>
                                    <SelectItem value="conditional">Conditional (If/Then)</SelectItem>
                                    <SelectItem value="copy">Copy from Column</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {newTransform.parameters?.assignType === "value" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Value</Label>
                                <Input
                                  placeholder="e.g., 58, FXDY, Jennifer Devine"
                                  value={newTransform.parameters?.value || ""}
                                  onChange={(e) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, value: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* DateTime Format Configuration */}
                        {newTransform.name === "DateTime Format" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Source Column</Label>
                                <Select
                                  value={newTransform.parameters?.sourceColumn || ""}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, sourceColumn: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(newTransform.inputFields || []).filter(f => !f.includes("_") && !f.includes("STOGO") && !f.includes("LVHN")).map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {field}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Target Format</Label>
                                <Select
                                  value={newTransform.parameters?.format || "HH:MM"}
                                  onValueChange={(value) =>
                                    setNewTransform((prev) => ({
                                      ...prev,
                                      parameters: { ...prev.parameters, format: value },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="HH:MM">HH:MM (24-hour time)</SelectItem>
                                    <SelectItem value="M/D/YY">M/D/YY (Date)</SelectItem>
                                    <SelectItem value="YYYYMMDD">YYYYMMDD (Date)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Default for other types */}
                        {!["Filter", "Lookup", "Calculate", "Assign", "DateTime Format"].includes(newTransform.name || "") && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Configuration Details</Label>
                            <Textarea
                              placeholder="Enter configuration details for this transformation type"
                              value={newTransform.ruleLogic || ""}
                              onChange={(e) => setNewTransform((prev) => ({ ...prev, ruleLogic: e.target.value }))}
                              rows={6}
                            />
                          </div>
                        )}

                        {/* Rule Logic Preview */}
                        {(newTransform.name || newTransform.parameters) && (
                          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="font-semibold text-primary mb-2 text-sm">Generated Rule Logic:</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {generateRuleLogicPreview(newTransform) || "Configure the rule above to see preview"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Output Fields - Full Width */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Output Fields</Label>
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {newTransform.outputFields?.map((field, idx) => (
                          <Badge key={idx} variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
                            {field}
                            <button
                              onClick={() => {
                                setNewTransform((prev) => ({
                                  ...prev,
                                  outputFields: prev.outputFields?.filter((_, i) => i !== idx) || [],
                                }))
                              }}
                              className="ml-1 hover:text-destructive text-base leading-none"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Type output field name and press Enter to add"
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const value = e.currentTarget.value.trim()
                            if (value && !newTransform.outputFields?.includes(value)) {
                              setNewTransform((prev) => ({
                                ...prev,
                                outputFields: [...(prev.outputFields || []), value],
                              }))
                              e.currentTarget.value = ""
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-4 px-8 pb-6">
                  <Button variant="outline" onClick={() => setIsAddTransformOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingTransform ? handleUpdateTransformation : handleAddTransformation}
                    disabled={!newTransform.name || !newTransform.purpose}
                    size="lg"
                  >
                    {editingTransform ? "Update" : "Add"} Transformation Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transformation List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading transformation rules...
          </div>
        ) : (
          <div className="space-y-3">
            {transformations.map((transform, index) => (
              <Card key={transform.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </span>
                      <Badge className={getCategoryColor(transform.category)}>{transform.category}</Badge>
                      <h4 className="font-semibold">{transform.name}</h4>
                    </div>

                    <p className="text-sm text-muted-foreground">{transform.purpose}</p>

                    {transform.ruleLogic && (
                      <div className="bg-muted/50 rounded p-3 text-sm">
                        <span className="font-medium">Logic: </span>
                        {transform.ruleLogic}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs">
                      {transform.inputFields.length > 0 && (
                        <div>
                          <span className="font-medium">Input: </span>
                          <span className="text-muted-foreground">{transform.inputFields.join(", ")}</span>
                        </div>
                      )}
                      {transform.outputFields.length > 0 && (
                        <div>
                          <span className="font-medium">Output: </span>
                          <span className="text-muted-foreground">{transform.outputFields.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTransformation(transform)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTransformation(transform.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Incentive Rules Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Incentive Rules</h3>
            <p className="text-sm text-muted-foreground">
              Configure pay rate incentives based on facility, cost center, day of week, and shift type
            </p>
          </div>
          <Dialog open={isAddIncentiveOpen} onOpenChange={setIsAddIncentiveOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingIncentive(null)
                  setNewIncentive({
                    company: "",
                    costCenters: [],
                    dayOfWeek: undefined,
                    shiftType: undefined,
                    timeRange: undefined,
                    amount: 0,
                    description: "",
                  })
                }}
              >
                Add Incentive Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingIncentive ? "Edit" : "Add"} Incentive Rule</DialogTitle>
                <DialogDescription>
                  Configure when and how much extra pay should be applied
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Company Code *</Label>
                  <Input
                    placeholder="e.g., 100402"
                    value={newIncentive.company || ""}
                    onChange={(e) => setNewIncentive((prev) => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost Centers (comma-separated) *</Label>
                  <Input
                    placeholder="e.g., 9343, 9353, 9358"
                    value={newIncentive.costCenters?.join(", ") || ""}
                    onChange={(e) =>
                      setNewIncentive((prev) => ({
                        ...prev,
                        costCenters: e.target.value
                          .split(",")
                          .map((cc) => cc.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shift Type</Label>
                  <Select
                    value={newIncentive.shiftType || "Both"}
                    onValueChange={(value) =>
                      setNewIncentive((prev) => ({
                        ...prev,
                        shiftType: value === "Both" ? undefined : (value as "Day" | "Night"),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Both">Both Day and Night</SelectItem>
                      <SelectItem value="Day">Day Only</SelectItem>
                      <SelectItem value="Night">Night Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${index}`}
                          checked={newIncentive.dayOfWeek?.includes(index) || false}
                          onCheckedChange={(checked) => {
                            const currentDays = newIncentive.dayOfWeek || []
                            if (checked) {
                              setNewIncentive((prev) => ({
                                ...prev,
                                dayOfWeek: [...currentDays, index],
                              }))
                            } else {
                              setNewIncentive((prev) => ({
                                ...prev,
                                dayOfWeek: currentDays.filter((d) => d !== index),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`day-${index}`} className="text-sm font-normal cursor-pointer">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewIncentive((prev) => ({ ...prev, dayOfWeek: undefined }))}
                  >
                    Clear Days
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time Range Start (Hour 0-23)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="e.g., 7"
                      value={newIncentive.timeRange?.start?.toString() || ""}
                      onChange={(e) =>
                        setNewIncentive((prev) => ({
                          ...prev,
                          timeRange: {
                            ...prev.timeRange,
                            start: parseInt(e.target.value, 10) || undefined,
                          } as any,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Range End (Hour 0-23)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="e.g., 19"
                      value={newIncentive.timeRange?.end?.toString() || ""}
                      onChange={(e) =>
                        setNewIncentive((prev) => ({
                          ...prev,
                          timeRange: {
                            ...prev.timeRange,
                            end: parseInt(e.target.value, 10) || undefined,
                          } as any,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Incentive Amount ($ per hour) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 5"
                    value={newIncentive.amount?.toString() || ""}
                    onChange={(e) =>
                      setNewIncentive((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="e.g., Cedar Crest: Sat/Sun days 7a-7p - $5 extra per hour"
                    value={newIncentive.description || ""}
                    onChange={(e) =>
                      setNewIncentive((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddIncentiveOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingIncentive ? handleUpdateIncentive : handleAddIncentive}>
                  {editingIncentive ? "Update" : "Add"} Incentive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Incentive Settings */}
        <div className="mb-6 space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incentives-enabled"
              checked={incentivesEnabled}
              onCheckedChange={setIncentivesEnabled}
            />
            <Label htmlFor="incentives-enabled" className="cursor-pointer">
              Enable Incentives
            </Label>
          </div>
          <div className="space-y-2">
            <Label>Valid Through Date</Label>
            <Input
              type="date"
              value={incentiveValidThrough}
              onChange={(e) => setIncentiveValidThrough(e.target.value)}
            />
          </div>
        </div>

        {/* Incentive Rules List */}
        <div className="space-y-3">
          {incentiveRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incentive rules configured. Click "Add Incentive Rule" to create one.
            </div>
          ) : (
            incentiveRules.map((rule, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Company {rule.company}</Badge>
                      <Badge variant="outline">${rule.amount}/hr</Badge>
                      {rule.shiftType && (
                        <Badge variant="outline">{rule.shiftType} Shift</Badge>
                      )}
                    </div>

                    {rule.description && (
                      <p className="text-sm font-medium">{rule.description}</p>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Cost Centers:</span> {rule.costCenters.join(", ")}
                      </p>
                      {rule.dayOfWeek && rule.dayOfWeek.length > 0 && (
                        <p>
                          <span className="font-medium">Days:</span>{" "}
                          {rule.dayOfWeek
                            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                            .join(", ")}
                        </p>
                      )}
                      {rule.timeRange && (
                        <p>
                          <span className="font-medium">Time Range:</span> {rule.timeRange.start}:00 -{" "}
                          {rule.timeRange.end}:00
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditIncentive(rule, index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteIncentive(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Generate Payroll File</h3>
            <p className="text-sm text-muted-foreground">
              Process {selectedNetwork} files through {transformations.length} transformation rules
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleGeneratePayroll}
            disabled={
              !uploadedFiles.rawTimecard || !uploadedFiles.manualAdds || !uploadedFiles.crosswalk || isProcessing
            }
            className="min-w-[200px]"
          >
            {isProcessing ? "Processing..." : "Generate & Download"}
          </Button>
        </div>

        {(!uploadedFiles.rawTimecard || !uploadedFiles.manualAdds || !uploadedFiles.crosswalk) && (
          <p className="text-sm text-amber-600 mt-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>Please upload all 3 required files to generate the payroll output</span>
          </p>
        )}

        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>Processing files through transformation pipeline...</span>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
