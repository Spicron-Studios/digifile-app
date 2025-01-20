import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/app/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side operations
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

    // Verify the requested org matches the session org
    if (session.user.orgId !== params.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - Organization mismatch' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload to Supabase
    const { data, error: uploadError } = await supabase.storage
      .from('DigiFile_Public')
      .upload(`${params.uid}/logo/${params.uid}-logo.jpg`, file, {
        upsert: true,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('DigiFile_Public')
      .getPublicUrl(`${params.uid}/logo/${params.uid}-logo.jpg`)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process logo upload' },
      { status: 500 }
    )
  }
} 