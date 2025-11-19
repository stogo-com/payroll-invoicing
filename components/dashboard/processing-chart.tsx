"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const weeklyData = [
  { name: "Mon", matched: 245, needsReview: 12, errors: 8 },
  { name: "Tue", matched: 189, needsReview: 18, errors: 5 },
  { name: "Wed", matched: 298, needsReview: 15, errors: 12 },
  { name: "Thu", matched: 267, needsReview: 9, errors: 7 },
  { name: "Fri", matched: 234, needsReview: 21, errors: 14 },
  { name: "Sat", matched: 156, needsReview: 8, errors: 3 },
  { name: "Sun", matched: 178, needsReview: 11, errors: 6 },
]

const statusData = [
  { name: "Matched", value: 1567, color: "#0073e6" },
  { name: "Needs Review", value: 94, color: "#66b3ff" },
  { name: "Posted", value: 1423, color: "#99ccff" },
  { name: "Errors", value: 55, color: "#dc2626" },
]

export function ProcessingChart() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Weekly Processing Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="matched" fill="#0073e6" name="Matched" />
              <Bar dataKey="needsReview" fill="#66b3ff" name="Needs Review" />
              <Bar dataKey="errors" fill="#dc2626" name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Current Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
