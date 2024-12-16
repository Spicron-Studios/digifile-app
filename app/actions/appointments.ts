"use server"

import prisma from "@/app/lib/prisma"
import { z } from "zod"
import { v4 as uuidv4 } from 'uuid'

const appointmentSchema = z.object({
  user_uid: z.string().uuid("Invalid user ID"),
  startdate: z.date(),
  enddate: z.date(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
})

type AppointmentData = z.infer<typeof appointmentSchema>

const ORGANIZATION_ID = "d290f1ee-6c54-4b01-90e6-d701748f0851"

export async function addAppointment(data: AppointmentData) {
  try {
    const validatedData = appointmentSchema.parse(data)
    
    const newAppointment = await prisma.user_calendar_entries.create({
      data: {
        uid: uuidv4(),
        user_uid: validatedData.user_uid,
        startdate: validatedData.startdate,
        enddate: validatedData.enddate,
        title: validatedData.title,
        description: validatedData.description,
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
        locked: false,
        orgid: ORGANIZATION_ID,
      },
    })

    if (!newAppointment) {
      throw new Error("Failed to create appointment")
    }

    return newAppointment
  } catch (error) {
    console.error("Error adding appointment:", error)
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors[0].message}`)
    }
    throw new Error(error instanceof Error ? error.message : "Failed to add appointment")
  }
}
