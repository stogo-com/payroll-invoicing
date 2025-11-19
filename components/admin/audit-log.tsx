"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface AuditLogEntry {
  id: string
  actorUserId: string
  actorName: string
  action: string
  entityType: string
  entityId?: string
  details?: any
  ip?: string
  userAgent?: string
  timestamp: Date
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "1",
    actorUserId: "user-1",
    actorName: "Admin User",
    action: "CREATE_USER",
    entityType: "User",
    entityId: "user-3",
    details: { email: "viewer@willisknight.com", role: "viewer" },
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    timestamp: new Date("2025-01-15T10:30:00"),
  },
  {
    id: "2",
    actorUserId: "user-2",
    actorName: "Coordinator User",
    action: "IMPORT_CSV",
    entityType: "TimeEntryRawIngest",
    details: { clientId: "UofL", recordsProcessed: 245, matched: 230, errors: 15 },
    ip: "192.168.1.101",
    userAgent: "Mozilla/5.0...",
    timestamp: new Date("2025-01-15T09:15:00"),
  },
  {
    id: "3",
    actorUserId: "user-2",
    actorName: "Coordinator User",
    action: "UPDATE_CROSSWALK",
    entityType: "EmployeeCrosswalk",
    entityId: "UofL-204275",
    details: { oldInternalId: "INT-204275", newInternalId: "INT-204275-V2" },
    ip: "192.168.1.101",
    userAgent: "Mozilla/5.0...",
    timestamp: new Date("2025-01-15T08:45:00"),
  },
  {
    id: "4",
    actorUserId: "user-1",
    actorName: "Admin User",
    action: "CREATE_INCENTIVE_RULE",
    entityType: "IncentiveCatalog",
    entityId: "incentive-4",
    details: { clientId: "Shannon", departmentCode: "ICU", rules: { nightDifferential: { rate: 2.0 } } },
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    timestamp: new Date("2025-01-15T08:00:00"),
  },
]

export function AuditLog() {
  const [logs] = useState<AuditLogEntry[]>(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [entityTypeFilter, setEntityTypeFilter] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = !actionFilter || log.action === actionFilter
    const matchesEntityType = !entityTypeFilter || log.entityType === entityTypeFilter

    const matchesDateRange =
      !dateRange?.from || !dateRange?.to || (log.timestamp >= dateRange.from && log.timestamp <= dateRange.to)

    return matchesSearch && matchesAction && matchesEntityType && matchesDateRange
  })

  const getActionBadge = (action: string) => {
    if (action.startsWith("CREATE")) return <Badge variant="default">Create</Badge>
    if (action.startsWith("UPDATE")) return <Badge variant="secondary">Update</Badge>
    if (action.startsWith("DELETE")) return <Badge variant="destructive">Delete</Badge>
    if (action.startsWith("IMPORT")) return <Badge variant="outline">Import</Badge>
    return <Badge variant="outline">{action}</Badge>
  }

  const clearFilters = () => {
    setSearchTerm("")
    setActionFilter("")
    setEntityTypeFilter("")
    setDateRange(undefined)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Log</h2>
        <p className="text-muted-foreground">Track all system activities and changes made by users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CREATE_USER">Create User</SelectItem>
            <SelectItem value="UPDATE_USER">Update User</SelectItem>
            <SelectItem value="IMPORT_CSV">Import CSV</SelectItem>
            <SelectItem value="UPDATE_CROSSWALK">Update Crosswalk</SelectItem>
            <SelectItem value="CREATE_INCENTIVE_RULE">Create Incentive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="TimeEntryRawIngest">Time Entry</SelectItem>
            <SelectItem value="EmployeeCrosswalk">Crosswalk</SelectItem>
            <SelectItem value="IncentiveCatalog">Incentive</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-60 justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Date Range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(log.timestamp, "MMM dd, yyyy HH:mm:ss")}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{log.actorName}</div>
                    <div className="text-xs text-muted-foreground">{log.actorUserId}</div>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{log.entityType}</div>
                    {log.entityId && <div className="text-xs text-muted-foreground">{log.entityId}</div>}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm truncate">{JSON.stringify(log.details)}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
