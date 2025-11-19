"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"

interface IncentiveRule {
  id: string
  clientId: string
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

const mockIncentiveRules: IncentiveRule[] = [
  {
    id: "incentive-1",
    clientId: "UofL",
    departmentCode: "603 Safety Attendants",
    rules: {
      nightDifferential: {
        rate: 1.5,
        conditions: ["shiftType === 'Night'"],
      },
      floatingNurse: {
        rate: 2.0,
        conditions: ["timesheetDepartment !== shiftDepartment"],
      },
    },
    effectiveFrom: new Date("2025-01-01"),
  },
  {
    id: "incentive-2",
    clientId: "Willis Knight",
    departmentCode: "Emergency Department",
    rules: {
      nightDifferential: {
        rate: 1.75,
        conditions: ["shiftType === 'Night'"],
      },
      weekendPremium: {
        rate: 1.25,
        conditions: ["dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday'"],
      },
    },
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: new Date("2025-12-31"),
  },
  {
    id: "incentive-3",
    clientId: "Shannon",
    departmentCode: "ICU",
    rules: {
      nightDifferential: {
        rate: 2.0,
        conditions: ["shiftType === 'Night'"],
      },
      holidayPay: {
        rate: 2.5,
        conditions: ["isHoliday === true"],
      },
    },
    effectiveFrom: new Date("2025-01-01"),
  },
]

interface IncentiveTableProps {
  onEdit?: (rule: IncentiveRule) => void
  onDelete?: (rule: IncentiveRule) => void
  onPreview?: (rule: IncentiveRule) => void
}

export function IncentiveTable({ onEdit, onDelete, onPreview }: IncentiveTableProps) {
  const [rules] = useState<IncentiveRule[]>(mockIncentiveRules)

  const getStatusBadge = (rule: IncentiveRule) => {
    const now = new Date()
    const isActive = rule.effectiveFrom <= now && (!rule.effectiveTo || rule.effectiveTo >= now)
    const isUpcoming = rule.effectiveFrom > now
    const isExpired = rule.effectiveTo && rule.effectiveTo < now

    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>
    }
    if (isUpcoming) {
      return <Badge variant="outline">Upcoming</Badge>
    }
    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Active
        </Badge>
      )
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const getRulesSummary = (rules: IncentiveRule["rules"]) => {
    const ruleTypes = Object.keys(rules)
    if (ruleTypes.length === 0) return "No rules"
    if (ruleTypes.length === 1) return ruleTypes[0].replace(/([A-Z])/g, " $1").toLowerCase()
    return `${ruleTypes.length} rules`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Rules</TableHead>
            <TableHead>Effective Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.clientId}</TableCell>
              <TableCell>{rule.departmentCode}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{getRulesSummary(rule.rules)}</div>
                  <div className="text-xs text-muted-foreground">
                    {Object.entries(rule.rules).map(([type, config]) => (
                      <span key={type} className="mr-2">
                        {type}: {config.rate}x
                      </span>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">From: {format(rule.effectiveFrom, "MMM dd, yyyy")}</div>
                  {rule.effectiveTo && (
                    <div className="text-xs text-muted-foreground">To: {format(rule.effectiveTo, "MMM dd, yyyy")}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(rule)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPreview?.(rule)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Logic
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(rule)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete?.(rule)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
