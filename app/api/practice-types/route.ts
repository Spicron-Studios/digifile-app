import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function GET() {
  try {
    const practiceTypes = await prisma.practice_Types.findMany({
      select: {
        uuid: true,
        codes: true,
        name: true
      },
      where: {
        codes: { not: null },
        name: { not: null }
      }
    })

    return NextResponse.json(practiceTypes)
  } catch (error) {
    console.error('Error fetching practice types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch practice types' },
      { status: 500 }
    )
  }
}