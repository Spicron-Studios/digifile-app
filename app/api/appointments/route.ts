'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import db, { userCalendarEntries } from '@/app/lib/drizzle';
import { v4 as uuidv4 } from 'uuid';

const appointmentSchema = z.object({
  user_uid: z.string(),
  startdate: z.string(),
  enddate: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = appointmentSchema.parse(json);

    const newAppointment = await db
      .insert(userCalendarEntries)
      .values({
        uid: uuidv4(),
        userUid: data.user_uid,
        startdate: new Date(data.startdate).toISOString(),
        enddate: new Date(data.enddate).toISOString(),
        title: data.title,
        description: data.description ?? null,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
        locked: false,
        orgid: null, // This should be set based on authenticated user
        length: 0, // Changed from null to 0
      })
      .returning();

    return NextResponse.json(newAppointment[0]);
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating appointment:', error);
    }
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
