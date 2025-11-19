"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface InvoicingFiltersProps {
  selectedNetwork: string
  onNetworkChange: (network: string) => void
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export function InvoicingFilters({
  selectedNetwork,
  onNetworkChange,
  dateRange,
  onDateRangeChange,
}: InvoicingFiltersProps) {
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4">
      <div className="flex-1">
        <Label htmlFor="network">Network</Label>
        <Select value={selectedNetwork} onValueChange={onNetworkChange}>
          <SelectTrigger id="network">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="13">13 - Lehigh Valley</SelectItem>
            <SelectItem value="14">14 - Willis Knighton</SelectItem>
            <SelectItem value="15">15 - UofL Health</SelectItem>
            <SelectItem value="16">16 - Shannon Health</SelectItem>
            <SelectItem value="17">17 - Baptist Arkansas</SelectItem>
            <SelectItem value="18">18 - AR Children's</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label>Shift Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
