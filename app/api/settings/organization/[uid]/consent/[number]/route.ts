import { NextRequest } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getBucket } from '@/app/lib/storage';

export async function GET(_request: NextRequest, context: unknown) {
  try {
    const params =
      (context as { params?: Record<string, unknown> }).params ?? {};
    const session = await auth();
    if (!session?.user?.orgId) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (session.user.orgId !== String(params.uid)) {
      return new Response('Forbidden', { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return new Response('Supabase client not initialized', { status: 500 });
    }

    const uid = String(params.uid);
    const number = String(params.number);
    const path = `${uid}/consent-forms/${uid}Consent${number}.txt`;

    const { data, error } = await supabase.storage
      .from(getBucket('ASSETS'))
      .download(path);

    if (error) {
      console.error('Error fetching consent file:', error);
      return new Response('File not found', { status: 404 });
    }

    const text = await data.text();
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error processing consent request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
