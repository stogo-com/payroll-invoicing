import { NextResponse } from "next/server"

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

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
  const client = mockClients.find((c) => c.id === params.clientId)

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  return NextResponse.json(client)
}
