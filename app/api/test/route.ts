import { NextResponse } from "next/server"
import { Logger } from '@/app/lib/logger'

const logger = Logger.getInstance()
const FILE_NAME = 'api/test/route.ts'

export async function GET() {
  try {
    await logger.init()
    await logger.info(FILE_NAME, 'Hello World from Test API')
    
    return NextResponse.json(
      { message: 'Hello World' },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    await logger.error(FILE_NAME, `Test failed: ${error}`)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
} 