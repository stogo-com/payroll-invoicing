"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { FileText, Clock, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FacilityData {
  facility: string
  count: number
  hours: number
}

interface PayPeriodMetric {
  payPeriod: string
  network: string
  facilities: FacilityData[]
  totalCount: number
  totalHours: number
}

interface MetricsWidgetProps {
  title: string
  type: "count" | "hours"
  data: PayPeriodMetric[]
  networks: string[]
  facilities: string[]
  color?: string
  onFiltersChange?: (filters: { network?: string; facility?: string }) => void
}

const COLORS = ["#6969f5", "#6a6a6a", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export function MetricsWidget({ 
  title, 
  type, 
  data, 
  networks, 
  facilities, 
  color = "#6969f5",
  onFiltersChange 
}: MetricsWidgetProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all")
  const [selectedFacility, setSelectedFacility] = useState<string>("all")

  // Filter data based on selected network and facility
  const filteredData = useMemo(() => {
    let filtered = data

    // Filter by network (if data has network info, otherwise skip)
    if (selectedNetwork !== "all") {
      filtered = filtered.filter((period) => period.network === selectedNetwork)
    }

    // Filter by facility
    if (selectedFacility !== "all") {
      filtered = filtered.map((period) => ({
        ...period,
        facilities: period.facilities.filter((f) => f.facility === selectedFacility),
      }))
    }

    return filtered
  }, [data, selectedNetwork, selectedFacility])

  // Flatten data for chart - group by facility across all pay periods
  const facilityMap = useMemo(() => {
    const map = new Map<string, { count: number; hours: number }>()

    filteredData.forEach((period) => {
      period.facilities.forEach((facility) => {
        if (!map.has(facility.facility)) {
          map.set(facility.facility, { count: 0, hours: 0 })
        }
        const existing = map.get(facility.facility)!
        existing.count += facility.count
        existing.hours += facility.hours
      })
    })

    return map
  }, [filteredData])

  // Convert to array and sort
  const facilityData = useMemo(() => {
    return Array.from(facilityMap.entries())
      .map(([facility, data]) => ({
        facility,
        count: data.count,
        hours: Math.round(data.hours * 100) / 100,
      }))
      .sort((a, b) => (type === "count" ? b.count - a.count : b.hours - a.hours))
      .slice(0, 10) // Top 10 facilities
  }, [facilityMap, type])

  // Data for pay period trend
  const payPeriodData = useMemo(() => {
    return filteredData.map((period) => ({
      payPeriod: period.payPeriod.split(" - ")[0], // Just show start date
      total: type === "count" ? period.totalCount : Math.round(period.totalHours * 100) / 100,
      ...period.facilities.reduce((acc, f) => {
        acc[f.facility] = type === "count" ? f.count : Math.round(f.hours * 100) / 100
        return acc
      }, {} as Record<string, number>),
    }))
  }, [filteredData, type])

  const totalValue = useMemo(() => {
    return filteredData.reduce((sum, period) => sum + (type === "count" ? period.totalCount : period.totalHours), 0)
  }, [filteredData, type])

  const formattedTotal = type === "count" ? totalValue.toLocaleString() : Math.round(totalValue * 100) / 100

  const handleNetworkChange = (value: string) => {
    setSelectedNetwork(value)
    onFiltersChange?.({ network: value === "all" ? undefined : value, facility: selectedFacility === "all" ? undefined : selectedFacility })
  }

  const handleFacilityChange = (value: string) => {
    setSelectedFacility(value)
    onFiltersChange?.({ network: selectedNetwork === "all" ? undefined : selectedNetwork, facility: value === "all" ? undefined : value })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {type === "count" ? <FileText className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            {title}
          </CardTitle>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Network
            </Label>
            <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {networks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Facility
            </Label>
            <Select value={selectedFacility} onValueChange={handleFacilityChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility} value={facility}>
                    {facility}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-3xl font-bold" style={{ color }}>
            {formattedTotal}
            {type === "hours" && <span className="text-lg text-muted-foreground ml-1">hours</span>}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Across {filteredData.length} pay period{filteredData.length !== 1 ? "s" : ""}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Facilities Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Top Facilities</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={facilityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="facility"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number) => [
                    type === "count" ? `${value} records` : `${value} hours`,
                    type === "count" ? "Count" : "Hours",
                  ]}
                />
                <Bar dataKey={type === "count" ? "count" : "hours"} fill={color} radius={[4, 4, 0, 0]}>
                  {facilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pay Period Trend */}
          {data.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Trend by Pay Period</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={payPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="payPeriod"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="text-xs"
                    tick={{ fill: "currentColor" }}
                  />
                  <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => [
                      type === "count" ? `${value} records` : `${value} hours`,
                      "Total",
                    ]}
                  />
                  <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Facility Breakdown Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">Facility Breakdown</h4>
            <div className="max-h-[200px] overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-2 font-semibold">Facility</th>
                    <th className="text-right p-2 font-semibold">
                      {type === "count" ? "Count" : "Hours"}
                    </th>
                    <th className="text-right p-2 font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                          {facilityData.length > 0 ? (
                            facilityData.map((facility, index) => {
                              const percentage = totalValue > 0 ? ((facility[type === "count" ? "count" : "hours"] / totalValue) * 100).toFixed(1) : "0"
                              return (
                                <tr key={facility.facility} className="border-t border-border hover:bg-muted/50">
                                  <td className="p-2">{facility.facility}</td>
                                  <td className="p-2 text-right font-medium">
                                    {type === "count"
                                      ? facility.count.toLocaleString()
                                      : Math.round(facility.hours * 100) / 100}
                                  </td>
                                  <td className="p-2 text-right text-muted-foreground">{percentage}%</td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-sm text-muted-foreground">
                                No data available for selected filters
                              </td>
                            </tr>
                          )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

