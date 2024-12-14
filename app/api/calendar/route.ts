import { NextResponse } from "next/server"
import prisma from '@/app/lib/prisma'
import { Account, CalendarEvent } from '@/app/types/calendar'
import { Logger } from '@/app/lib/logger'
import { writeServerLog } from '@/app/lib/logger/server-logger'

const logger = Logger.getInstance()
const FILE_NAME = 'api/calendar/route.ts'

export async function GET() {
  console.log('API route handler called')
  await writeServerLog('Direct test of logging system')
  await logger.init()
  await logger.info(FILE_NAME, 'Test log entry')

  try {
    await logger.info(FILE_NAME, 'Calendar API request received')

    // Add headers to ensure JSON response
    const headers = {
      'Content-Type': 'application/json',
    }

    // Test database connection
    try {
      await prisma.$connect()
      await logger.debug(FILE_NAME, 'Database connection successful')
    } catch (error) {
      await logger.error(FILE_NAME, `Database connection failed: ${error}`)
      throw new Error('Database connection failed')
    }

    // Fetch users with their calendar entries
    await logger.debug(FILE_NAME, 'Fetching users and calendar entries')
    const users = await prisma.users.findMany({
      where: { active: true },
      include: {
        user_calendar_entries: {
          where: { active: true },
        },
      },
    }).catch(async (error) => {
      await logger.error(FILE_NAME, `Prisma query failed: ${error}`)
      throw new Error('Database query failed')
    })

    if (!users) {
      await logger.warning(FILE_NAME, 'No users found in database')
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404, headers }
      )
    }

    await logger.debug(FILE_NAME, `Found ${users.length} active users`)

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
      { error: 'Failed to fetch calendar data' },
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