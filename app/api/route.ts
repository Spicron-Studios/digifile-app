'use server'

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      select: {
        username: true
      }
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
