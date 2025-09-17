import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getBucket } from '@/app/lib/storage';

export async function POST(request: NextRequest, context: unknown) {
  const params = (context as { params?: Record<string, unknown> }).params ?? {};
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

    if (session.user.orgId !== String(params.uid)) {
      return NextResponse.json(
        { error: 'Unauthorized - Organization mismatch' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'consent'
    const consentNumber = formData.get('consentNumber') as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Missing file or type' },
        { status: 400 }
      );
    }

    let path: string;
    let contentType: string;

    const uid = String(params.uid);

    if (type === 'logo') {
      path = `${uid}/logo/${uid}-logo.jpg`;
      contentType = 'image/jpeg';
    } else if (type === 'consent') {
      path = `${uid}/consent-forms/${uid}Consent${consentNumber}.txt`;
      contentType = 'text/plain';
    } else {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      );
    }

    const { error: uploadError } = await supabase.storage
      .from(getBucket('ASSETS'))
      .upload(path, file, {
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(getBucket('ASSETS'))
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
