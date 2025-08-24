'use server';

import db, { users, userCalendarEntries } from '@/app/lib/drizzle';
import { Logger } from '@/app/lib/logger';
import { auth } from '@/app/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import type {
  Account,
  CalendarEvent,
  CalendarEntry,
} from '@/app/types/calendar';

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
];

export async function getCalendarData(): Promise<{
  accounts: Account[];
  events: CalendarEvent[];
}> {
  const logger = Logger.getInstance();
  await logger.init();

  const session = await auth();
  if (!session?.user?.orgId) {
    await logger.warning('actions/calendar.ts', 'Unauthorized calendar access');
    return { accounts: [], events: [] };
  }

  const isAdmin = session.user.roles.some(
    r => r.role.name.toLowerCase() === 'admin'
  );
  const isOrganizer = session.user.roles.some(
    r => r.role.name.toLowerCase() === 'organizer'
  );

  // Build where conditions for users
  const userWhereConditions = [
    eq(users.active, true),
    eq(users.orgid, session.user.orgId),
  ];

  if (!isAdmin && !isOrganizer) {
    userWhereConditions.push(eq(users.uid, session.user.id));
  }

  const userList = await db
    .select()
    .from(users)
    .where(and(...userWhereConditions));

  if (userList.length === 0) {
    return { accounts: [], events: [] };
  }

  const userCalendarEntriesList = await db
    .select({
      uid: userCalendarEntries.uid,
      user_uid: userCalendarEntries.userUid,
      startdate: userCalendarEntries.startdate,
      enddate: userCalendarEntries.enddate,
      description: userCalendarEntries.description,
      title: userCalendarEntries.title,
    })
    .from(userCalendarEntries)
    .where(
      and(
        eq(userCalendarEntries.active, true),
        eq(userCalendarEntries.orgid, session.user.orgId),
        inArray(
          userCalendarEntries.userUid as any,
          userList.map(u => u.uid)
        )
      )
    );

  const userCalendarMap = userCalendarEntriesList.reduce(
    (acc, entry) => {
      const userUid = entry.user_uid;
      if (userUid) {
        if (!acc[userUid]) acc[userUid] = [];
        acc[userUid].push(entry);
      }
      return acc;
    },
    {} as Record<string, typeof userCalendarEntriesList>
  );

  const accounts: Account[] = userList.map((user, index) => ({
    AccountID: user.uid,
    Name: user.username ?? `${user.firstName} ${user.surname}`,
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
    account['Calendar-Entries'].map(entry => ({
      id: entry.uid,
      title: entry.title,
      description: entry.description,
      start: new Date(entry.startdate),
      end: new Date(entry.enddate),
      accountId: account.AccountID,
      accountName: account.Name,
      color: COLORS[accountIndex % COLORS.length] || 'bg-gray-500',
    }))
  );

  return { accounts, events };
}
