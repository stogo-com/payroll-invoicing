import { NextResponse } from "next/server"

const mockMappings = [
  {
    id: "1",
    clientId: "1",
    sourceField: "EmpID",
    targetField: "employeeInternalId",
    transformRule: "lookup(employee_map)",
    transformType: "lookup",
    lastUpdated: new Date(),
    createdAt: new Date(),
  },
  {
    id: "2",
    clientId: "1",
    sourceField: "ClockIn",
    targetField: "clockInAt",
    transformRule: 'parseDate("MM/DD/YYYY HH:mm")',
    transformType: "dateParse",
    lastUpdated: new Date(),
    createdAt: new Date(),
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

  const filtered = clientId ? mockMappings.filter((m) => m.clientId === clientId) : mockMappings

  return NextResponse.json(filtered)
}

export async function POST(request: Request) {
  const body = await request.json()
  const newMapping = {
    id: String(mockMappings.length + 1),
    ...body,
    lastUpdated: new Date(),
    createdAt: new Date(),
  }
  mockMappings.push(newMapping)
  return NextResponse.json(newMapping)
}
