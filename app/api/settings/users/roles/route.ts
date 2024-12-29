import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

// Get all available roles for the organization
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all roles for the organization
    const roles = await prisma.roles.findMany({
      where: {
        orgid: session.user.orgId,
        active: true
      },
      select: {
        uid: true,
        role_name: true,
        description: true
      }
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
} 