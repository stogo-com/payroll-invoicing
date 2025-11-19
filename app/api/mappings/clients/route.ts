import { NextResponse } from "next/server"

// Mock data for development
const mockClients = [
  {
    id: "1",
    name: "Lehigh Valley Health Network",
    code: "LVHN",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Arkansas Children's",
    code: "ARChildrens",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "University of Louisville",
    code: "UofL",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function GET() {
  return NextResponse.json(mockClients)
}
