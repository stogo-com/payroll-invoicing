import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
import { logAuditEvent } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // 'timesheets' or 'crosswalk'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`uploads/${type}/${Date.now()}-${file.name}`, file, {
      access: "private",
    })

    // Trigger n8n workflow for processing
    const n8nResponse = await fetch(`${process.env.N8N_WEBHOOK_URL}/process-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({
        fileUrl: blob.url,
        fileName: file.name,
        type,
        uploadedBy: session.user.id,
      }),
    })

    if (!n8nResponse.ok) {
      throw new Error("Failed to trigger n8n workflow")
    }

    const result = await n8nResponse.json()

    await logAuditEvent({
      userId: session.user.id,
      action: "CSV_UPLOADED",
      resourceType: "FILE",
      resourceId: blob.url,
      details: { fileName: file.name, type, fileSize: file.size },
    })

    return NextResponse.json({
      success: true,
      fileUrl: blob.url,
      fileName: file.name,
      batchId: result.batchId,
    })
  } catch (error) {
    console.error("Error uploading CSV:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
