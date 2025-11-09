'use server';
import { Logger } from '@/app/lib/logger/logger.service';

import db, { users, userCalendarEntries } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { and, eq, inArray } from 'drizzle-orm';
import {
  colorForIndex,
  type Account,
  type CalendarEvent,
} from '@/app/types/calendar';

interface CalendarData {
  accounts: Account[];
  events: CalendarEvent[];
}

export async function getCalendarData(
  selectedUserIds?: string[]
): Promise<CalendarData> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { accounts: [], events: [] };
  }

  // Load users in the org; basic active filter
  const userList = await db
    .select({
      uid: users.uid,
      firstName: users.firstName,
      surname: users.surname,
    })
    .from(users)
    .where(and(eq(users.orgid, session.user.orgId), eq(users.active, true)));

  const accounts: Account[] = userList.map((u, idx) => ({
    uid: u.uid!,
    name: `${u.firstName ?? ''} ${u.surname ?? ''}`.trim() || 'Unknown',
    color: colorForIndex(idx),
  }));

  const visibleIds =
    selectedUserIds && selectedUserIds.length > 0
      ? selectedUserIds
      : accounts.map(a => a.uid);

  const rows = await db
    .select({
      uid: userCalendarEntries.uid,
      userUid: userCalendarEntries.userUid,
      startdate: userCalendarEntries.startdate,
      enddate: userCalendarEntries.enddate,
      title: userCalendarEntries.title,
      description: userCalendarEntries.description,
    })
    .from(userCalendarEntries)
    .where(
      and(
        eq(userCalendarEntries.active, true),
        eq(userCalendarEntries.orgid, session.user.orgId),
        inArray(userCalendarEntries.userUid, visibleIds)
      )
    );

  const colorByUserId = new Map(accounts.map(a => [a.uid, a.color] as const));

  const events: CalendarEvent[] = rows.map(r => ({
    id: r.uid!,
    title: r.title ?? '',
    start: new Date(r.startdate as string),
    end: new Date(r.enddate as string),
    resourceId: r.userUid!,
    color: colorByUserId.get(r.userUid!) ?? colorForIndex(0),
    description: r.description ?? null,
  }));

  return { accounts, events };
}

export async function getDayEvents(
  dateISO: string,
  userIds: string[]
): Promise<CalendarEvent[]> {
  const session = await auth();
  if (!session?.user?.orgId) {
    const logger = Logger.getInstance();
    await logger.init();
    await logger.warning(
      'app/actions/calendar.ts',
      '[getDayEvents] unauthorized or missing org'
    );
    return [];
  }

  const start = new Date(dateISO);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  // Using simple BETWEEN by string compare on timestamp
  const rows = await db
    .select({
      uid: userCalendarEntries.uid,
      userUid: userCalendarEntries.userUid,
      startdate: userCalendarEntries.startdate,
      enddate: userCalendarEntries.enddate,
      title: userCalendarEntries.title,
      description: userCalendarEntries.description,
    })
    .from(userCalendarEntries)
    .where(
      and(
        eq(userCalendarEntries.active, true),
        eq(userCalendarEntries.orgid, session.user.orgId),
        inArray(userCalendarEntries.userUid, userIds)
      )
    );
  {
    const logger = Logger.getInstance();
    await logger.init();
    await logger.debug(
      'app/actions/calendar.ts',
      `[getDayEvents] db rows ${rows.length} for ${dateISO} users ${JSON.stringify(userIds)}`
    );
  }

  // Filter to day bounds in JS to avoid extra operators
  const dayRows = rows.filter(r => {
    const s = new Date(r.startdate as string);
    const e = new Date(r.enddate as string);
    // Include events that intersect the day: start < endOfDay && end > startOfDay
    return s <= end && e >= start;
  });
  {
    const logger = Logger.getInstance();
    await logger.init();
    await logger.debug(
      'app/actions/calendar.ts',
      `[getDayEvents] filtered to day ${dayRows.length}`
    );
  }

  // Color mapping by user index is unknown here, default blue
  return dayRows.map(r => ({
    id: r.uid!,
    title: r.title ?? '',
    start: new Date(r.startdate as string),
    end: new Date(r.enddate as string),
    resourceId: r.userUid!,
    color: '#3b82f6',
    description: r.description ?? null,
  }));
}
