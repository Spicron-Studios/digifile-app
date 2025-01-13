import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/app/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string; number: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (session.user.orgId !== params.uid) {
      return new Response('Forbidden', { status: 403 })
    }

    const path = `${params.uid}/consent-forms/${params.uid}Consent${params.number}.txt`
    
    const { data, error } = await supabase.storage
      .from('DigiFile_Public')
      .download(path)

    if (error) {
      console.error('Error fetching consent file:', error)
      return new Response('File not found', { status: 404 })
    }

    const text = await data.text()
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('Error processing consent request:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 