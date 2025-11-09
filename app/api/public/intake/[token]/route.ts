import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { z } from 'zod';
import crypto from 'crypto';
import db, { patient } from '@/app/lib/drizzle';
import { Logger } from '@/app/lib/logger/logger.service';
import { verifyIntakeToken } from '@/app/lib/intake-tokens';

const logger = Logger.getInstance();

const IntakeSchema = z.object({
  name: z.string().min(1),
  surname: z.string().optional().nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  isUnder18: z.boolean(),
  id: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  cellPhone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

// Light per-process rate limit; use Redis in production.
const rateMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, data] of rateMap.entries()) {
      if (now > data.resetAt) {
        rateMap.delete(ip);
      }
    }
  },
  5 * 60 * 1000
);

function rateLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = rateMap.get(ip);
  if (!cur || now > cur.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (cur.count >= max) return false;
  cur.count += 1;
  return true;
}

export async function OPTIONS(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  await logger.init();
  const { token } = await params;
  const secret = process.env.INTAKE_FORM_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  const verify = verifyIntakeToken(token, secret);
  if (!verify.ok)
    return NextResponse.json({ error: 'Invalid or expired' }, { status: 401 });
  return NextResponse.json({ ok: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  await logger.init();
  try {
    const { token } = await params;

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 20, 60_000)) {
      await logger.warning(
        'api/public/intake/[token]/route.ts',
        `Rate limited: ${ip}`
      );
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const secret = process.env.INTAKE_FORM_SECRET;
    if (!secret) {
      await logger.error(
        'api/public/intake/[token]/route.ts',
        'Missing INTAKE_FORM_SECRET'
      );
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    const verify = verifyIntakeToken(token, secret);
    if (!verify.ok) {
      await logger.warning(
        'api/public/intake/[token]/route.ts',
        `Token error: ${verify.error}`
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = IntakeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    const data = parsed.data;

    if (!data.isUnder18 && (!data.id || data.id.trim() === '')) {
      return NextResponse.json(
        { error: 'ID is required for adults' },
        { status: 400 }
      );
    }

    const newUid = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const inserted = await db
      .insert(patient)
      .values({
        uid: newUid,
        orgid: verify.data.orgId,
        name: data.name,
        surname: data.surname ?? null,
        id: data.isUnder18 ? null : (data.id ?? null),
        dateOfBirth: data.dateOfBirth,
        title: data.title ?? null,
        gender: data.gender ?? null,
        cellPhone: data.cellPhone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        active: true,
        dateCreated: nowIso,
        lastEdit: nowIso,
        locked: false,
      })
      .returning();

    if (!inserted || inserted.length === 0) {
      await logger.error(
        'api/public/intake/[token]/route.ts',
        'Insert returned empty result'
      );
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    await logger.success(
      'api/public/intake/[token]/route.ts',
      `Intake saved for org=${verify.data.orgId}, uid=${newUid}`
    );
    return NextResponse.json({ success: true, uid: newUid }, { status: 201 });
  } catch (error) {
    await logger.error(
      'api/public/intake/[token]/route.ts',
      `Unhandled error: ${error instanceof Error ? error.message : 'Unknown'}`
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
