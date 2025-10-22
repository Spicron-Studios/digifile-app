import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import db, { organizationInfo } from '@/app/lib/drizzle';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger/logger.service';

export async function PUT(request: Request, context: unknown) {
  const params = (context as { params?: Record<string, unknown> }).params ?? {};
  const uid = String(params.uid);

  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const updatedOrg = await db
      .update(organizationInfo)
      .set({
        practiceName: data.practiceName,
        practiceType: data.practiceType,
        vatNo: data.vatNo,
        address: data.address,
        postal: data.postal,
        practiceTelephone: data.practiceTelephone,
        accountsTelephone: data.accountsTelephone,
        cell: data.cell,
        fax: data.fax,
        email: data.email,
        lastEdit: new Date().toISOString(),
      })
      .where(
        and(eq(organizationInfo.uid, uid), eq(organizationInfo.active, true))
      )
      .returning();

    return NextResponse.json(updatedOrg[0]);
  } catch (error) {
    const logger = Logger.getInstance();
    await logger.init();
    await logger.error(
      'api/settings/organization/[uid]/route.ts',
      `Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
