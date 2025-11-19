// Example API route that proxies to Django API
// This allows you to add Next.js-specific logic while using Django for CRUD

import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-guards"
import { djangoClient, DjangoApiError } from "@/lib/django-client"

// GET /api/django/timesheets - List timesheets
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "manager", "coordinator", "viewer"])

    const { searchParams } = new URL(request.url)
    const params = {
      status: searchParams.get("status") || undefined,
      network: searchParams.get("network") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
    }

    const timesheets = await djangoClient.get("/api/timesheets/", params)

    return NextResponse.json(timesheets)
  } catch (error) {
    console.error("[Django] Error fetching timesheets:", error)
    
    if (error instanceof DjangoApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch timesheets" },
      { status: 500 }
    )
  }
}

// POST /api/django/timesheets - Create timesheet
export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "manager", "coordinator"])

    const body = await request.json()
    const timesheet = await djangoClient.post("/api/timesheets/", body)

    return NextResponse.json(timesheet, { status: 201 })
  } catch (error) {
    console.error("[Django] Error creating timesheet:", error)
    
    if (error instanceof DjangoApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: "Failed to create timesheet" },
      { status: 500 }
    )
  }
}

