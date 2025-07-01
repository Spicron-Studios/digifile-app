'use server';

import prisma from '@/app/lib/prisma';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@/app/lib/logger';
const logger = Logger.getInstance();

const appointmentSchema = z.object({
  user_uid: z.string().uuid('Invalid user ID'),
  startdate: z.date(),
  enddate: z.date(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

type AppointmentData = z.infer<typeof appointmentSchema>;

const ORGANIZATION_ID = 'd290f1ee-6c54-4b01-90e6-d701748f0851';

export async function addAppointment(data: AppointmentData) {
  try {
    const validatedData = appointmentSchema.parse(data);

    const newAppointment = await prisma.user_calendar_entries.create({
      data: {
        uid: uuidv4(),
        user_uid: validatedData.user_uid,
        startdate: validatedData.startdate,
        enddate: validatedData.enddate,
        title: validatedData.title,
        description: validatedData.description ?? null,
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
        locked: false,
        orgid: ORGANIZATION_ID,
      },
    });

    return newAppointment;
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

    const updatedAppointment = await prisma.user_calendar_entries.update({
      where: { uid: id },
      data: {
        user_uid: validatedData.user_uid,
        startdate: validatedData.startdate,
        enddate: validatedData.enddate,
        title: validatedData.title,
        description: validatedData.description ?? null,
        last_edit: new Date(),
      },
    });

    return updatedAppointment;
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
    const appointment = await prisma.user_calendar_entries.findUnique({
      where: { uid: id },
    });

    await logger.debug(
      'appointments.ts',
      `Found appointment: ${JSON.stringify(appointment)}`
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Then delete it
    const deletedAppointment = await prisma.user_calendar_entries.delete({
      where: { uid: id },
    });

    await logger.info(
      'appointments.ts',
      `Successfully deleted appointment: ${JSON.stringify(deletedAppointment)}`
    );

    return deletedAppointment;
  } catch (error) {
    await logger.error(
      'appointments.ts',
      `Error deleting appointment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}
