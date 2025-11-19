import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mappingId, timesheetIds } = body

    // Trigger n8n workflow for re-matching
    const n8nResponse = await fetch(`${process.env.N8N_WEBHOOK_URL}/rematch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({
        mappingId,
        timesheetIds,
        triggeredBy: session.user.id,
      }),
    })

    if (!n8nResponse.ok) {
      throw new Error("Failed to trigger n8n workflow")
    }

    return NextResponse.json({ success: true, message: "Re-matching triggered" })
  } catch (error) {
    console.error("Error triggering re-match:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
