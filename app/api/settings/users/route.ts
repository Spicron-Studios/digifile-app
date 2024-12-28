'use server'

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      where: {
        AND: [
          { active: true },
          { orgid: process.env.ORGANIZATION_ID }
        ]
      },
      select: {
        uid: true,
        title: true,
        first_name: true,
        surname: true,
        email: true,
        username: true,
        cell_no: true
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
} 