import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Demo auth endpoint - authentication disabled for preview",
  })
}

export async function POST() {
  return NextResponse.json({
    message: "Demo auth endpoint - authentication disabled for preview",
  })
}
