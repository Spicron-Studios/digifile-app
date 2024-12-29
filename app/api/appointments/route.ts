'use server'

import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/app/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

const appointmentSchema = z.object({
  user_uid: z.string(),
  startdate: z.string(),
  enddate: z.string(),
  title: z.string(),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const data = appointmentSchema.parse(json)

    const newAppointment = await prisma.user_calendar_entries.create({
      data: {
        uid: uuidv4(),
        user_uid: data.user_uid,
        startdate: new Date(data.startdate),
        enddate: new Date(data.enddate),
        title: data.title,
        description: data.description,
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
        locked: false,
      },
    })

    return NextResponse.json(newAppointment)
  } catch (error: unknown) {
    console.error("Error creating appointment:", error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
