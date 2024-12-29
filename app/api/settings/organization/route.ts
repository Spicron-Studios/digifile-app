import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization ID found' }, 
        { status: 401 }
      )
    }

    const orgInfo = await prisma.organization_info.findFirst({
      where: {
        uid: session.user.orgId
      }
    })

    if (!orgInfo) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(orgInfo)
  } catch (error) {
    console.error('Failed to fetch organization info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization info' },
      { status: 500 }
    )
  }
} 