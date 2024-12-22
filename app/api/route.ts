import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'API root endpoint' })
}

export async function POST() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
