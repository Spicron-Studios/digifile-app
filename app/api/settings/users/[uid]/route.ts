'use server'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

// We can define the type inline here
export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // orgId filter from the session
    const updatedUser = await prisma.users.update({
      where: {
        uid: params.uid,
        orgid: session.user.orgId
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
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
} 