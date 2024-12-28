'use server'

import { NextResponse } from 'next/server'
import { auth } from "@/app/actions/auth"
import prisma from '@/app/lib/prisma'

export async function GET() {
  try {
    // Verify authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.users.findMany({
      where: {
        AND: [
          { active: true },
          { orgid: session.user.orgId } // Use the organization ID from the session
        ]
      },
      select: {
        username: true
      }
    })
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' + error }, 
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
