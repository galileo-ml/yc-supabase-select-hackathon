import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    console.log("backend url", BACKEND_URL)
    const response = await fetch(`${BACKEND_URL}/campaigns`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend error:", errorText)
      return NextResponse.json(
        { error: "Failed to fetch campaigns" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { num_users } = body
    if (!num_users || num_users < 1) {
      return NextResponse.json(
        { error: "num_users must be a positive integer" },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ num_users }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend error:", errorText)
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
