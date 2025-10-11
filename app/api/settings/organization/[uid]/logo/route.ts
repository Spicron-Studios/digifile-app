import { Logger } from '@/app/lib/logger/logger.service';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { auth } from '@/app/lib/auth';
import { getBucket } from '@/app/lib/storage';

export async function PUT(request: NextRequest, context: unknown) {
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

    // Verify the requested org matches the session org
    if (session.user.orgId !== String(params.uid)) {
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
      const logger = Logger.getInstance();
      await logger.init();
      await logger.error(
        'api/settings/organization/[uid]/logo/route.ts',
        `Supabase upload error: ${uploadError.message ?? 'Unknown error'}`
      );
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }

    // Get the public URL
    const uid = String(params.uid);

    const { data: urlData } = supabase.storage
      .from(getBucket('ASSETS'))
      .getPublicUrl(`${uid}/logo/${uid}-logo.jpg`);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    const logger = Logger.getInstance();
    await logger.init();
    await logger.error(
      'api/settings/organization/[uid]/logo/route.ts',
      `Logo upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to process logo upload' },
      { status: 500 }
    );
  }
}
