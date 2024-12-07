import { accounts } from "@/data/accounts"
import { transformEntriesToEvents } from "@/utils/calendar"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const events = transformEntriesToEvents(accounts)
    return NextResponse.json({ accounts, events })
  } catch (err) {
    console.error('Calendar API Error:', err)
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    )
  }
} 