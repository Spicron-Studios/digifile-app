import { NextResponse } from "next/server"
import prisma from '@/app/lib/prisma'
import { Account, CalendarEvent } from '@/app/types/calendar'
import { Logger } from '@/app/lib/logger'

const logger = Logger.getInstance()
const FILE_NAME = 'api/calendar/route.ts'

// Initialize logger once at module level
await logger.init()

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
        user_uid: {
          in: users.map(user => user.uid)
        }
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

    // Transform to required format
    await logger.debug(FILE_NAME, 'Transforming data to required format')
    const accounts: Account[] = users.map((user) => ({
      AccountID: user.uid,
      Name: `${user.first_name} ${user.surname}`,
      'Calendar-Entries': userCalendarMap[user.uid]?.map((entry) => ({
        Date: entry.date?.toISOString() ?? '',
        Length: entry.length?.toString() ?? '',
        Description: entry.description ?? '',
      })) ?? []
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