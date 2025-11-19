"use client"

import { useState, useEffect, useMemo } from "react"
import { PayPeriodPicker } from "@/components/dashboard/pay-period-picker"
import { MetricsWidget } from "@/components/dashboard/metrics-widget"
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
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
  today.setHours(12, 0, 0, 0)
  const thisWeekSunday = getSundayOfWeek(today)
  const lastWeekSunday = new Date(thisWeekSunday)
  lastWeekSunday.setDate(thisWeekSunday.getDate() - 7)
  lastWeekSunday.setHours(0, 0, 0, 0)
  const lastWeekSaturday = new Date(lastWeekSunday)
  lastWeekSaturday.setDate(lastWeekSunday.getDate() + 6)
  lastWeekSaturday.setHours(23, 59, 59, 999)
  return { from: lastWeekSunday, to: lastWeekSaturday }
}

interface WidgetConfig {
  id: string
  title: string
  visible: boolean
}

interface PayPeriodMetric {
  payPeriod: string
  network: string
  facilities: Array<{ facility: string; count: number; hours: number }>
  totalCount: number
  totalHours: number
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<{
    timesheets: { metrics: PayPeriodMetric[]; summary: any }
    payroll: { metrics: PayPeriodMetric[]; summary: any }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [payPeriod, setPayPeriod] = useState<{ from: Date; to: Date }>(() => getLastWeekPayPeriod())
  const { toast } = useToast()

  // Widget configuration with default visibility
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: "timesheets-count", title: "Timesheets - Count by Facility", visible: true },
    { id: "timesheets-hours", title: "Timesheets - Hours by Facility", visible: true },
    { id: "payroll-count", title: "Payroll - Count by Facility", visible: true },
    { id: "payroll-hours", title: "Payroll - Hours by Facility", visible: true },
  ])

  // Extract unique networks and facilities from metrics
  const { networks, facilities } = useMemo(() => {
    if (!metrics) return { networks: [], facilities: [] }
    
    const networkSet = new Set<string>()
    const facilitySet = new Set<string>()
    
    metrics.timesheets.metrics.forEach((period) => {
      networkSet.add(period.network)
      period.facilities.forEach((f) => facilitySet.add(f.facility))
    })
    
    return {
      networks: Array.from(networkSet).sort(),
      facilities: Array.from(facilitySet).sort(),
    }
  }, [metrics])

  // Load metrics data
  useEffect(() => {
    loadMetrics()
  }, [payPeriod])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("startDate", payPeriod.from.toISOString())
      params.append("endDate", payPeriod.to.toISOString())

      const response = await fetch(`/api/dashboard/metrics?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", errorData)
        throw new Error(errorData.error || "Failed to load metrics")
      }

      const data = await response.json()
      console.log("Dashboard metrics loaded:", data)
      setMetrics(data)
    } catch (error) {
      console.error("Error loading metrics:", error)
      toast({
        title: "Error loading dashboard",
        description: error instanceof Error ? error.message : "Failed to load metrics data",
        variant: "destructive",
      })
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  const visibleWidgets = widgets.filter((w) => w.visible)

  // Always show widgets, even if there's no data
  const shouldShowWidgets = !loading && visibleWidgets.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground leading-tight">Dashboard</h1>
          {payPeriod && (
            <p className="text-sm text-muted-foreground mt-1">
              Pay Period: <span className="font-semibold text-foreground">
                {format(payPeriod.from, "MMM dd, yyyy")} - {format(payPeriod.to, "MMM dd, yyyy")}
              </span>
            </p>
          )}
        </div>
        <DashboardCustomizer widgets={widgets} onWidgetsChange={setWidgets} />
      </div>

      {/* Pay Period Picker */}
      <div className="max-w-md">
        <PayPeriodPicker value={payPeriod} onChange={setPayPeriod} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shouldShowWidgets ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {/* Timesheets - Count */}
          {visibleWidgets.some((w) => w.id === "timesheets-count") && (
            <MetricsWidget
              title="Timesheets - Count by Facility"
              type="count"
              data={metrics?.timesheets?.metrics || []}
              networks={networks}
              facilities={facilities}
              color="#6969f5"
            />
          )}

          {/* Timesheets - Hours */}
          {visibleWidgets.some((w) => w.id === "timesheets-hours") && (
            <MetricsWidget
              title="Timesheets - Hours by Facility"
              type="hours"
              data={metrics?.timesheets?.metrics || []}
              networks={networks}
              facilities={facilities}
              color="#06b6d4"
            />
          )}

          {/* Payroll - Count */}
          {visibleWidgets.some((w) => w.id === "payroll-count") && (
            <MetricsWidget
              title="Payroll - Count by Facility"
              type="count"
              data={metrics?.payroll?.metrics || []}
              networks={networks}
              facilities={facilities}
              color="#8b5cf6"
            />
          )}

          {/* Payroll - Hours */}
          {visibleWidgets.some((w) => w.id === "payroll-hours") && (
            <MetricsWidget
              title="Payroll - Hours by Facility"
              type="hours"
              data={metrics?.payroll?.metrics || []}
              networks={networks}
              facilities={facilities}
              color="#10b981"
            />
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No widgets visible</p>
          <p className="text-sm">Use the "Customize Dashboard" button to show widgets.</p>
        </div>
      )}
    </div>
  )
}
