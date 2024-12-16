import { NextResponse } from "next/server"
import prisma from '@/app/lib/prisma'
import { Account, CalendarEvent } from '@/app/types/calendar'
import { Logger } from '@/app/lib/logger'

const logger = Logger.getInstance()
const FILE_NAME = 'api/calendar/route.ts'

// Initialize logger once at module level
await logger.init()

// Add this array at the top of the file
const COLORS = [

    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-fuchsia-500',
    'bg-rose-500',
    'bg-lime-500',
    'bg-amber-500',
    'bg-sky-500',
    
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-orange-400',
    'bg-pink-400',
    'bg-teal-400',
    'bg-red-400',
    'bg-yellow-400',
    'bg-indigo-400',
    'bg-cyan-400',
    'bg-emerald-400',
    'bg-violet-400',
    'bg-fuchsia-400',
    'bg-rose-400',
    'bg-lime-400',
    'bg-amber-400',
    'bg-sky-400',
    
    'bg-blue-600',
    'bg-green-600',
    'bg-purple-600',
    'bg-orange-600',
    'bg-pink-600',
    'bg-teal-600',
    'bg-red-600',
    'bg-yellow-600',
    'bg-indigo-600',
    'bg-cyan-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-fuchsia-600',
    'bg-rose-600',
    'bg-lime-600',
    'bg-amber-600',
    'bg-sky-600'
    
];

export async function GET() {
  try {
    await logger.info(FILE_NAME, 'Calendar API request received')

    const headers = {
      'Content-Type': 'application/json',
    }

    // Test database connection
    try {
      await prisma.$connect()
      await logger.debug(FILE_NAME, 'Database connection successful')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await logger.error(FILE_NAME, `Database connection failed: ${errorMessage}`)
      throw new Error('Database connection failed')
    }

    // First get all active users
    await logger.debug(FILE_NAME, 'Fetching active users')
    const users = await prisma.users.findMany({
        where: {
            AND: [
              { active: true },
              { orgid: 'd290f1ee-6c54-4b01-90e6-d701748f0851' }
            ]
        }
    })

    // Check if no active users found
    if (users.length === 0) {
      await logger.info(FILE_NAME, 'No active users found')
      return NextResponse.json(
        { 
          error: 'No active users found',
          type: 'NO_USERS'
        },
        { 
          status: 404,
          headers 
        }
      )
    }
    
    await logger.debug(FILE_NAME, `Found ${users.length} active users`)

    // Then get all calendar entries for these users
    await logger.debug(FILE_NAME, 'Fetching calendar entries for users')
    const userCalendarEntries = await prisma.user_calendar_entries.findMany({
      where: {
        active: true,
        orgid: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        user_uid: {
          in: users.map(user => user.uid)
        }
      },
      select: {
        uid: true,
        user_uid: true,
        startdate: true,
        enddate: true,
        description: true,
        title: true
      }
    })

    // Check if no calendar entries found
    if (userCalendarEntries.length === 0) {
      await logger.info(FILE_NAME, 'No calendar entries found for active users')
      return NextResponse.json(
        { 
          error: 'No calendar entries found',
          type: 'NO_ENTRIES'
        },
        { 
          status: 404,
          headers 
        }
      )
    }


    await logger.debug(FILE_NAME, `Found ${userCalendarEntries.length} calendar entries`)

    // Group calendar entries by user
    await logger.debug(FILE_NAME, 'Grouping calendar entries by user')
    const userCalendarMap = userCalendarEntries.reduce((acc, entry) => {
      if (!acc[entry.user_uid]) {
        acc[entry.user_uid] = [];
      }
      acc[entry.user_uid].push(entry);
      return acc;
    }, {} as Record<string, typeof userCalendarEntries>);

    await logger.debug(FILE_NAME, `User calendar map content: ${JSON.stringify(userCalendarMap, null, 2)}`)

    // Transform to required format
    await logger.debug(FILE_NAME, 'Transforming data to required format')
    const accounts: Account[] = users.map((user) => ({
      AccountID: user.uid,
      Name: user.username ?? `${user.first_name} ${user.surname}`,
      'Calendar-Entries': userCalendarMap[user.uid]?.map((entry) => ({
        uid: entry.uid,
        startdate: entry.startdate?.toISOString() ?? '',
        enddate: entry.enddate?.toISOString() ?? '',
        title: entry.title ?? '',
        Description: entry.description ?? '',
      })) ?? []
    }))

    await logger.debug(FILE_NAME, `Accounts content: ${JSON.stringify(accounts, null, 2)}`)

    // Transform entries into events
    const events: CalendarEvent[] = accounts.flatMap((account, accountIndex) =>
      account['Calendar-Entries'].map((entry, index) => {
        return {
          id: entry.uid,
          title: entry.title,
          description: entry.Description,
          start: new Date(entry.startdate),
          end: new Date(entry.enddate),
          accountId: account.AccountID,
          accountName: account.Name,
          color: COLORS[accountIndex % COLORS.length],
        }
      })
    )

    await logger.info(FILE_NAME, `Events content: ${JSON.stringify(events, null, 2)}`)
    await logger.debug(FILE_NAME, `Transformed ${events.length} calendar events`)
    await logger.info(FILE_NAME, 'Calendar data successfully retrieved')

    return NextResponse.json(
      { accounts, events },
      { headers }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logger.error(FILE_NAME, `Failed to fetch calendar data: ${errorMessage}`)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar data',
        type: 'SYSTEM_ERROR'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await prisma.$disconnect()
    await logger.debug(FILE_NAME, 'Database connection closed')
  }
} 