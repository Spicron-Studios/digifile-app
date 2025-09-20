'use server';

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
