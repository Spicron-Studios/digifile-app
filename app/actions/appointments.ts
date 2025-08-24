'use server';

import db, { userCalendarEntries } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@/app/lib/logger';

const logger = Logger.getInstance();

const appointmentSchema = z
  .object({
    user_uid: z.string().uuid('Invalid user ID'),
    startdate: z.date(),
    enddate: z.date(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  })
  .refine(data => data.enddate > data.startdate, {
    message: 'End date must be after start date',
    path: ['enddate'],
  });

export type AppointmentData = z.infer<typeof appointmentSchema>;

export async function addAppointment(data: AppointmentData) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  try {
    const validatedData = appointmentSchema.parse(data);

    const newAppointment = await db
      .insert(userCalendarEntries)
      .values({
        uid: uuidv4(),
        userUid: validatedData.user_uid,
        startdate: validatedData.startdate,
        enddate: validatedData.enddate,
        title: validatedData.title,
        description: validatedData.description ?? null,
        active: true,
        dateCreated: new Date(),
        lastEdit: new Date(),
        locked: false,
        orgid: session.user.orgId,
        length: null,
      })
      .returning();

    return newAppointment[0];
  } catch (error) {
    console.error('Error adding appointment:', error);
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors[0]?.message || 'Unknown validation error'}`
      );
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to add appointment'
    );
  }
}

export async function updateAppointment(id: string, data: AppointmentData) {
  try {
    const validatedData = appointmentSchema.parse(data);

    const updatedAppointment = await db
      .update(userCalendarEntries)
      .set({
        userUid: validatedData.user_uid,
        startdate: validatedData.startdate,
        enddate: validatedData.enddate,
        title: validatedData.title,
        description: validatedData.description ?? null,
        lastEdit: new Date(),
      })
      .where(eq(userCalendarEntries.uid, id))
      .returning();

    if (updatedAppointment.length === 0) {
      throw new Error('Appointment not found');
    }

    return updatedAppointment[0];
  } catch (error) {
    console.error('Error updating appointment:', error);
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors[0]?.message || 'Unknown validation error'}`
      );
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update appointment'
    );
  }
}

export async function deleteAppointment(id: string) {
  await logger.info(
    'appointments.ts',
    `Delete appointment called with ID: ${id}`
  );

  if (!id) {
    await logger.error('appointments.ts', `Appointment ID is required`);
    throw new Error('Appointment ID is required');
  }

  try {
    // Verify the appointment exists first
    await logger.info(
      'appointments.ts',
      `Verifying appointment exists with ID: ${id}`
    );

    const appointment = await db
      .select()
      .from(userCalendarEntries)
      .where(eq(userCalendarEntries.uid, id))
      .limit(1);

    await logger.debug(
      'appointments.ts',
      `Found appointment: ${JSON.stringify(appointment[0] || null)}`
    );

    if (appointment.length === 0) {
      throw new Error('Appointment not found');
    }

    // Then delete it (soft delete by setting active to false)
    const deletedAppointment = await db
      .update(userCalendarEntries)
      .set({
        active: false,
        lastEdit: new Date(),
      })
      .where(eq(userCalendarEntries.uid, id))
      .returning();

    await logger.info(
      'appointments.ts',
      `Successfully deleted appointment: ${JSON.stringify(deletedAppointment[0])}`
    );

    return deletedAppointment[0];
  } catch (error) {
    await logger.error(
      'appointments.ts',
      `Error deleting appointment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw new Error(
      error instanceof Error ? error.message : 'Failed to delete appointment'
    );
  }
}
