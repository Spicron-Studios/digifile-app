import { NextResponse } from 'next/server';
import db, { organizationInfo } from '@/app/lib/drizzle';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const { uid } = params;

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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update organization:', error);
    }
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
