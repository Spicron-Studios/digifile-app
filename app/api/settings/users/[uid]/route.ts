'use server'

import { NextResponse } from 'next/server'
import * as Sentry from "@sentry/nextjs"
import prisma from '@/app/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const data = await request.json()
    
    const updatedUser = await prisma.users.update({
      where: {
        AND: [
          { uid: params.uid },
          { orgid: process.env.ORGANIZATION_ID }
        ]
      },
      data: {
        title: data.title,
        first_name: data.firstName,
        surname: data.lastName,
        username: data.username,
        email: data.email,
        cell_no: data.phone,
        last_edit: new Date()
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        "endpoint": "PUT /api/settings/users/[uid]"
      }
    })

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
} 