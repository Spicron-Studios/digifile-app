import { NextResponse } from "next/server"
import prisma from "@/app/lib/prisma"
import { Account, CalendarEvent } from "@/app/types/calendar"

export async function GET() {
  try {
    // Fetch active users and their active calendar entries
    const users = await prisma.users.findMany({
      where: { active: true },
      include: {
        user_calendar_entries: {
          where: { active: true },
        },
      },
    })

    // Transform data into the Account format
    const accounts: Account[] = users.map((user) => ({
      AccountID: user.uid,
      Name: `${user.first_name ?? ''} ${user.surname ?? ''}`.trim(),
      "Calendar-Entries": user.user_calendar_entries.map((entry) => ({
        Date: entry.date?.toISOString() ?? '',
        Length: entry.length?.toString() ?? '',
        Description: entry.description ?? '',
      })),
    }))

    // Generate CalendarEvent data
    const events: CalendarEvent[] = accounts.flatMap((account) =>
      account["Calendar-Entries"].map((entry, index) => {
        const start = new Date(entry.Date)
        const end = new Date(start.getTime() + parseInt(entry.Length) * 60000)
        return {
          id: `${account.AccountID}-${index}`,
          title: entry.Description,
          start,
          end,
          accountId: account.AccountID,
          accountName: account.Name,
          color: 'bg-blue-500', // Adjust color as needed
        }
      })
    )

    return NextResponse.json({ accounts, events })
  } catch (error) {
    console.error('Failed to fetch calendar data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
} 