import { NextResponse } from "next/server"
import prisma from '@/app/lib/prisma'
import { Account, CalendarEvent } from '@/app/types/calendar'

export async function GET() {
  try {
    // Fetch users with their calendar entries
    const users = await prisma.users.findMany({
      where: { active: true },
      include: {
        user_calendar_entries: {
          where: { active: true },
        },
      },
    }).catch((error) => {
      console.error('Prisma query failed:', error)
      throw new Error('Database query failed')
    })

    if (!users) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404 }
      )
    }

    // Transform database data into accounts
    const accounts: Account[] = users.map((user) => ({
      AccountID: user.uid,
      Name: `${user.first_name} ${user.surname}`,
      'Calendar-Entries': user.user_calendar_entries.map((entry) => ({
        Date: entry.date?.toISOString() ?? '',
        Length: entry.length?.toString() ?? '',
        Description: entry.description ?? '',
      })),
    }))

    // Transform entries into events
    const events: CalendarEvent[] = accounts.flatMap((account) =>
      account['Calendar-Entries'].map((entry, index) => {
        const start = new Date(entry.Date)
        const end = new Date(start.getTime() + Number(entry.Length) * 60000)
        return {
          id: `${account.AccountID}-${index}`,
          title: entry.Description,
          start,
          end,
          accountId: account.AccountID,
          accountName: account.Name,
          color: 'bg-blue-500',
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