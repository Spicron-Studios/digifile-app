import prisma from './prisma'
import { Account, CalendarEntry, CalendarEvent } from '@/app/types/calendar'

export async function getAccountsAndEvents(): Promise<{ accounts: Account[]; events: CalendarEvent[] }> {
  const users = await prisma.users.findMany({
    where: { active: true },
    include: {
      user_calendar_entries: {
        where: { active: true },
      },
    },
  })

  // Transform database data into the expected shape
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
      const end = new Date(start.getTime() + Number(entry.Length) * 60000) // Length in minutes
      return {
        id: `${account.AccountID}-${index}`,
        title: entry.Description,
        start,
        end,
        accountId: account.AccountID,
        accountName: account.Name,
        color: 'bg-blue-500', // Assign colors as needed
      }
    })
  )

  return { accounts, events }
} 