"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

// Helper function to get Sunday of a given date
function getSundayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - day)
  sunday.setHours(0, 0, 0, 0)
  return sunday
}

// Helper function to get Saturday of a given date's week
function getSaturdayOfWeek(date: Date): Date {
  const sunday = getSundayOfWeek(date)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  saturday.setHours(23, 59, 59, 999)
  return saturday
}

// Helper function to get last week's pay period (Sunday to Saturday)
function getLastWeekPayPeriod(): { from: Date; to: Date } {
  const today = new Date()
  today.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
  
  // Get last week's Sunday (7 days before this week's Sunday)
  const thisWeekSunday = getSundayOfWeek(today)
  const lastWeekSunday = new Date(thisWeekSunday)
  lastWeekSunday.setDate(thisWeekSunday.getDate() - 7)
  lastWeekSunday.setHours(0, 0, 0, 0)
  
  // Get last week's Saturday
  const lastWeekSaturday = new Date(lastWeekSunday)
  lastWeekSaturday.setDate(lastWeekSunday.getDate() + 6)
  lastWeekSaturday.setHours(23, 59, 59, 999)
  
  return { from: lastWeekSunday, to: lastWeekSaturday }
}

interface PayPeriodPickerProps {
  value?: { from: Date; to: Date }
  onChange: (payPeriod: { from: Date; to: Date }) => void
}

export function PayPeriodPicker({ value, onChange }: PayPeriodPickerProps) {
  const [payPeriodPickerMonth, setPayPeriodPickerMonth] = useState(() => {
    const lastWeek = getLastWeekPayPeriod()
    return lastWeek.from.getMonth()
  })
  const [payPeriodPickerYear, setPayPeriodPickerYear] = useState(() => {
    const lastWeek = getLastWeekPayPeriod()
    return lastWeek.from.getFullYear()
  })

  // Default to last week if no value
  const payPeriod = value || getLastWeekPayPeriod()

  return (
    <div className="space-y-2">
      <Label>Pay Period</Label>
      <Select
        value={payPeriod ? `${payPeriod.from.getTime()}` : ""}
        onValueChange={(selectValue) => {
          const timestamp = parseInt(selectValue, 10)
          const selectedDate = new Date(timestamp)
          const week = {
            from: getSundayOfWeek(selectedDate),
            to: getSaturdayOfWeek(selectedDate)
          }
          onChange(week)
        }}
      >
        <SelectTrigger className="w-full">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Select pay period">
            {payPeriod ? (
              `${format(payPeriod.from, "MMM dd, yyyy")} - ${format(payPeriod.to, "MMM dd, yyyy")}`
            ) : (
              "Select pay period"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {/* Quick Options */}
          <div className="p-2 border-b">
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Quick Select</div>
            <div className="space-y-1">
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                onClick={() => {
                  const lastWeek = getLastWeekPayPeriod()
                  onChange(lastWeek)
                }}
              >
                Last Week ({format(getLastWeekPayPeriod().from, "MMM dd")} - {format(getLastWeekPayPeriod().to, "MMM dd, yyyy")})
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                onClick={() => {
                  const thisWeek = {
                    from: getSundayOfWeek(new Date()),
                    to: getSaturdayOfWeek(new Date())
                  }
                  onChange(thisWeek)
                }}
              >
                This Week ({format(getSundayOfWeek(new Date()), "MMM dd")} - {format(getSaturdayOfWeek(new Date()), "MMM dd, yyyy")})
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="p-2 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Navigate Month</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    const newDate = new Date(payPeriodPickerYear, payPeriodPickerMonth - 1, 1)
                    setPayPeriodPickerMonth(newDate.getMonth())
                    setPayPeriodPickerYear(newDate.getFullYear())
                  }}
                >
                  ←
                </Button>
                <span className="text-xs font-medium px-2">
                  {new Date(payPeriodPickerYear, payPeriodPickerMonth).toLocaleString('default', { month: 'short', year: 'numeric' })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    const newDate = new Date(payPeriodPickerYear, payPeriodPickerMonth + 1, 1)
                    setPayPeriodPickerMonth(newDate.getMonth())
                    setPayPeriodPickerYear(newDate.getFullYear())
                  }}
                  disabled={payPeriodPickerMonth === new Date().getMonth() && payPeriodPickerYear === new Date().getFullYear()}
                >
                  →
                </Button>
              </div>
            </div>
          </div>

          {/* List of Pay Periods */}
          <div className="p-2 max-h-[250px] overflow-y-auto">
            {(() => {
              const weeks: { from: Date; to: Date }[] = []
              const firstDay = new Date(payPeriodPickerYear, payPeriodPickerMonth, 1)
              const lastDay = new Date(payPeriodPickerYear, payPeriodPickerMonth + 1, 0)
              
              // Find the first Sunday of the month (or before if month doesn't start on Sunday)
              let currentSunday = getSundayOfWeek(firstDay)
              if (currentSunday > firstDay) {
                currentSunday = new Date(currentSunday)
                currentSunday.setDate(currentSunday.getDate() - 7)
              }
              
              // Generate all Sunday-Saturday weeks that include any day of the month
              while (currentSunday <= lastDay) {
                const saturday = getSaturdayOfWeek(currentSunday)
                // Only include weeks that overlap with the month
                if (saturday >= firstDay || currentSunday <= lastDay) {
                  weeks.push({ from: new Date(currentSunday), to: saturday })
                }
                currentSunday = new Date(currentSunday)
                currentSunday.setDate(currentSunday.getDate() + 7)
              }
              
              if (weeks.length === 0) {
                return <div className="text-sm text-muted-foreground p-2 text-center">No pay periods available</div>
              }
              
              return weeks.map((week, index) => {
                const isSelected = payPeriod?.from.getTime() === week.from.getTime() && 
                                 payPeriod?.to.getTime() === week.to.getTime()
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const weekFrom = new Date(week.from)
                weekFrom.setHours(0, 0, 0, 0)
                const weekTo = new Date(week.to)
                weekTo.setHours(23, 59, 59, 999)
                const isFuture = weekFrom > today
                const isCurrentWeek = weekFrom <= today && weekTo >= today
                
                return (
                  <SelectItem
                    key={`week-${week.from.getTime()}`}
                    value={`${week.from.getTime()}`}
                    disabled={isFuture}
                    className={isSelected ? "bg-primary/10" : ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium text-sm">
                          {format(week.from, "MMM dd")} - {format(week.to, "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isCurrentWeek && 'Current Week'}
                          {isFuture && 'Future Week'}
                          {!isCurrentWeek && !isFuture && format(week.from, "EEEE")}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-primary font-bold ml-2">✓</div>
                      )}
                    </div>
                  </SelectItem>
                )
              })
            })()}
          </div>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Pay periods are always Sunday through Saturday. Select a week from the dropdown above.
      </p>
    </div>
  )
}

