'use server';

import db, { userCalendarEntries } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const AppointmentSchema = z.object({
  userUid: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  start: z.string(),
  end: z.string(),
});

export async function addAppointment(
  input: unknown
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.orgId) return { ok: false, error: 'Unauthorized' };
  const parsed = AppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid data' };

  const id = uuidv4();
  const { userUid, title, description, start, end } = parsed.data;
  await db.insert(userCalendarEntries).values({
    uid: id,
    userUid,
    title,
    description: description ?? null,
    startdate: start,
    enddate: end,
    active: true,
    dateCreated: new Date().toISOString(),
    lastEdit: new Date().toISOString(),
    orgid: session.user.orgId,
    locked: false,
  });
  return { ok: true };
}

export async function updateAppointment(
  id: string,
  input: unknown
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.orgId) return { ok: false, error: 'Unauthorized' };
  const parsed = AppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid data' };

  const { userUid, title, description, start, end } = parsed.data;
  await db
    .update(userCalendarEntries)
    .set({
      userUid,
      title,
      description: description ?? null,
      startdate: start,
      enddate: end,
      lastEdit: new Date().toISOString(),
    })
    .where(
      and(
        eq(userCalendarEntries.uid, id),
        eq(userCalendarEntries.orgid, session.user.orgId)
      )
    );
  return { ok: true };
}

export async function deleteAppointment(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.orgId) return { ok: false, error: 'Unauthorized' };
  await db
    .update(userCalendarEntries)
    .set({ active: false, lastEdit: new Date().toISOString() })
    .where(
      and(
        eq(userCalendarEntries.uid, id),
        eq(userCalendarEntries.orgid, session.user.orgId)
      )
    );
  return { ok: true };
}
