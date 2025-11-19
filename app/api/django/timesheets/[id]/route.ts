// Individual timesheet operations

import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { djangoClient, DjangoApiError } from "@/lib/django-client"

// GET /api/django/timesheets/[id] - Get single timesheet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(["admin", "manager", "coordinator", "viewer"])

    const timesheet = await djangoClient.get(`/api/timesheets/${params.id}/`)

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error("[Django] Error fetching timesheet:", error)
    
    if (error instanceof DjangoApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch timesheet" },
      { status: 500 }
    )
  }
}

// PATCH /api/django/timesheets/[id] - Update timesheet
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(["admin", "manager", "coordinator"])

    const body = await request.json()
    const timesheet = await djangoClient.patch(`/api/timesheets/${params.id}/`, body)

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error("[Django] Error updating timesheet:", error)
    
    if (error instanceof DjangoApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: "Failed to update timesheet" },
      { status: 500 }
    )
  }
}

// DELETE /api/django/timesheets/[id] - Delete timesheet
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(["admin", "manager"])

    await djangoClient.delete(`/api/timesheets/${params.id}/`)

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error("[Django] Error deleting timesheet:", error)
    
    if (error instanceof DjangoApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete timesheet" },
      { status: 500 }
    )
  }
}

