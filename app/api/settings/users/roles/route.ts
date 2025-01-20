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

    console.log("[api/settings/users/roles] Getting all roles for organization " + session.user.orgId);
    // Fetch all roles for the organization
    const roles = await prisma.roles.findMany({
      where: {
        active: true
      },
      select: {
        uid: true,
        role_name: true,
        description: true
      }
    })

    console.log("[api/settings/users/roles] Roles found:", roles)

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
} 