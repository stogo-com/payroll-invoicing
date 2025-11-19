"use client"

import { useState } from "react"
import { CalendarIcon, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface DashboardFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function DashboardFilters({ onFiltersChange }: DashboardFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [payrollPeriod, setPayrollPeriod] = useState<string>("")
  const [network, setNetwork] = useState<string>("")

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    onFiltersChange?.({
      dateRange: range,
      payrollPeriod,
      network,
    })
  }

  const handlePayrollPeriodChange = (value: string) => {
    setPayrollPeriod(value)
    onFiltersChange?.({
      dateRange,
      payrollPeriod: value,
      network,
    })
  }

  const handleNetworkChange = (value: string) => {
    setNetwork(value)
    onFiltersChange?.({
      dateRange,
      payrollPeriod,
      network: value,
    })
  }

  const clearFilters = () => {
    setDateRange(undefined)
    setPayrollPeriod("")
    setNetwork("")
    onFiltersChange?.({
      dateRange: undefined,
      payrollPeriod: "",
      network: "",
    })
  }

  const hasActiveFilters = dateRange || payrollPeriod || network

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {/* Payroll Period */}
      <Select value={payrollPeriod} onValueChange={handlePayrollPeriodChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Payroll Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monday">Monday</SelectItem>
          <SelectItem value="thursday">Thursday</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
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
              <span>Shift Start Date Range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Network */}
      <Select value={network} onValueChange={handleNetworkChange}>
        <SelectTrigger className="w-60">
          <SelectValue placeholder="Network" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LVHN">LVHN - Lehigh Valley Health Network</SelectItem>
        </SelectContent>
      </Select>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          {payrollPeriod && (
            <Badge variant="secondary" className="capitalize">
              {payrollPeriod} Payroll
            </Badge>
          )}
          {network && <Badge variant="secondary">{network}</Badge>}
          {dateRange?.from && (
            <Badge variant="secondary">
              {dateRange.to
                ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                : format(dateRange.from, "MMM dd")}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
