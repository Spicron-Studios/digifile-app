import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { auth } from '@/app/lib/auth';
import { getBucket } from '@/app/lib/storage';

export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase client not initialized' },
      { status: 500 }
    );
  }

  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization ID found' },
        { status: 401 }
      );
    }

    // Verify the requested org matches the session org
    if (session.user.orgId !== params.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - Organization mismatch' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from(getBucket('ASSETS'))
      .upload(`${params.uid}/logo/${params.uid}-logo.jpg`, file, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(getBucket('ASSETS'))
      .getPublicUrl(`${params.uid}/logo/${params.uid}-logo.jpg`);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process logo upload' },
      { status: 500 }
    );
  }
}
