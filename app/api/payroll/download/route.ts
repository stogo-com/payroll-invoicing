import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "manager"])

    const body = await request.json()
    const { data, network } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid payroll data" }, { status: 400 })
    }

    // Convert to CSV format
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(",")]

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header]
        // Escape commas and quotes in values
        return typeof value === "string" && (value.includes(",") || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      })
      csvRows.push(values.join(","))
    })

    const csvContent = csvRows.join("\n")
    const filename = `${network}_Payroll_${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading payroll:", error)
    return NextResponse.json({ error: "Failed to download payroll file" }, { status: 500 })
  }
}
