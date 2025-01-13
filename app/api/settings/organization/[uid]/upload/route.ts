import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/app/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization ID found' },
        { status: 401 }
      )
    }

    if (session.user.orgId !== params.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - Organization mismatch' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'consent'
    const consentNumber = formData.get('consentNumber') as string

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Missing file or type' },
        { status: 400 }
      )
    }

    let path: string
    let contentType: string

    if (type === 'logo') {
      path = `${params.uid}/logo/${params.uid}-logo.jpg`
      contentType = 'image/jpeg'
    } else if (type === 'consent') {
      path = `${params.uid}/consent-forms/${params.uid}Consent${consentNumber}.txt`
      contentType = 'text/plain'
    } else {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      )
    }

    const { data, error: uploadError } = await supabase.storage
      .from('DigiFile_Public')
      .upload(path, file, {
        upsert: true,
        contentType
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from('DigiFile_Public')
      .getPublicUrl(path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
} 