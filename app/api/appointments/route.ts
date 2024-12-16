import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/app/lib/prisma"

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
        uid: undefined, // Prisma will auto-generate if set up
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
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
