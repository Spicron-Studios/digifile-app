'use server'

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    const isAdmin = session.user.roles.some(r => r.role.name.toLowerCase() === 'admin') || false;
    const isOrganizer = session.user.roles.some(r => r.role.name.toLowerCase() === 'organizer') || false;


    // Base query conditions
    const whereConditions: any = {
      AND: [
        { active: true },
        { orgid: session.user.orgId }
      ]
    }

    // If user is not admin/organizer, only show their own record
    if (!(isAdmin || isOrganizer)) {
      whereConditions.AND.push({ uid: session.user.id })
    }
    
    const users = await prisma.users.findMany({
      where: whereConditions,
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