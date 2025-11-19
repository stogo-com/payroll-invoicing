import { NextResponse } from "next/server"

const mockEmployeeMaps = [
  {
    id: "1",
    clientId: "1",
    clientEmployeeId: "EMP001",
    internalEmployeeId: "INT-12345",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    clientId: "1",
    clientEmployeeId: "EMP002",
    internalEmployeeId: "INT-12346",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

  const filtered = clientId ? mockEmployeeMaps.filter((m) => m.clientId === clientId) : mockEmployeeMaps

  return NextResponse.json(filtered)
}
