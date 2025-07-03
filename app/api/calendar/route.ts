'use server';

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { Account, CalendarEvent, CalendarEntry } from '@/app/types/calendar';
import { Logger } from '@/app/lib/logger';
import { auth } from '@/app/lib/auth';

const logger = Logger.getInstance();
const FILE_NAME = 'api/calendar/route.ts';

await logger.init();

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
  'bg-sky-600',
];

export async function GET() {
  try {
    await logger.info(FILE_NAME, 'Calendar API request received');

    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized', type: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const isAdmin = session.user.roles.some(
      r => r.role.name.toLowerCase() === 'admin'
    );
    const isOrganizer = session.user.roles.some(
      r => r.role.name.toLowerCase() === 'organizer'
    );

    const headers = {
      'Content-Type': 'application/json',
    };

    await prisma.$connect();
    await logger.debug(FILE_NAME, 'Database connection successful');

    // Build the where clause based on user role
    const whereClause: any = {
      AND: [{ active: true }, { orgid: session.user.orgId }],
    };

    // If not admin/organizer, only show the user's own calendar
    if (!isAdmin && !isOrganizer) {
      whereClause.AND.push({ uid: session.user.id });
    }

    const users = await prisma.users.findMany({ where: whereClause });

    if (users.length === 0) {
      await logger.info(FILE_NAME, 'No active users found');
      return NextResponse.json(
        { error: 'No active users found', type: 'NO_USERS' },
        { status: 404, headers }
      );
    }

    await logger.debug(FILE_NAME, `Found ${users.length} active users`);

    const userCalendarEntries = await prisma.user_calendar_entries.findMany({
      where: {
        active: true,
        orgid: session.user.orgId,
        user_uid: {
          in: users.map(user => user.uid),
        },
      },
      select: {
        uid: true,
        user_uid: true,
        startdate: true,
        enddate: true,
        description: true,
        title: true,
      },
    });

    if (userCalendarEntries.length === 0) {
      await logger.info(
        FILE_NAME,
        'No calendar entries found for active users'
      );
      return NextResponse.json(
        { error: 'No calendar entries found', type: 'NO_ENTRIES' },
        { status: 404, headers }
      );
    }

    await logger.debug(
      FILE_NAME,
      `Found ${userCalendarEntries.length} calendar entries`
    );

    const userCalendarMap = userCalendarEntries.reduce(
      (acc, entry) => {
        const userUid = entry.user_uid;
        if (userUid) {
          if (!acc[userUid]) {
            acc[userUid] = [];
          }
          acc[userUid].push(entry);
        }
        return acc;
      },
      {} as Record<string, typeof userCalendarEntries>
    );

    const accounts: Account[] = users.map((user, index) => ({
      AccountID: user.uid,
      Name: user.username ?? `${user.first_name} ${user.surname}`,
      'Calendar-Entries':
        userCalendarMap[user.uid]?.map(
          entry =>
            ({
              uid: entry.uid,
              startdate: entry.startdate?.toISOString() ?? '',
              enddate: entry.enddate?.toISOString() ?? '',
              title: entry.title ?? '',
              description: entry.description ?? '',
              length: '0',
            }) as CalendarEntry
        ) ?? [],
      color: COLORS[index % COLORS.length] || 'bg-gray-500',
    }));

    const events: CalendarEvent[] = accounts.flatMap((account, accountIndex) =>
      account['Calendar-Entries'].map(entry => {
        // Ensure proper date parsing - the dates from DB are in UTC
        const startDate = new Date(entry.startdate);
        const endDate = new Date(entry.enddate);

        return {
          id: entry.uid,
          title: entry.title,
          description: entry.description,
          start: startDate,
          end: endDate,
          accountId: account.AccountID,
          accountName: account.Name,
          color: COLORS[accountIndex % COLORS.length] || 'bg-gray-500',
        };
      })
    );

    await logger.info(FILE_NAME, 'Calendar data successfully retrieved');

    return NextResponse.json({ accounts, events }, { headers });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await logger.error(
      FILE_NAME,
      `Failed to fetch calendar data: ${errorMessage}`
    );

    return NextResponse.json(
      { error: 'Failed to fetch calendar data', type: 'SYSTEM_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
