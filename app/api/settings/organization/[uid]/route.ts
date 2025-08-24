import { NextRequest, NextResponse } from 'next/server';
import db, { organizationInfo } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization ID found' },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (params.uid !== session.user.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - Organization ID mismatch' },
        { status: 403 }
      );
    }

    const updatedOrg = await db
      .update(organizationInfo)
      .set({
        practiceName: data.practice_name ?? undefined,
        practiceType: data.practice_type ?? undefined,
        bhfNumber: data.bhf_number ?? undefined,
        hpcsa: data.hpcsa ?? undefined,
        vatNo: data.vat_no ?? undefined,
        address: data.address ?? undefined,
        postal: data.postal ?? undefined,
        practiceTelephone: data.practice_telephone ?? undefined,
        accountsTelephone: data.accounts_telephone ?? undefined,
        cell: data.cell ?? undefined,
        fax: data.fax ?? undefined,
        email: data.email ?? undefined,
        lastEdit: new Date(),
      })
      .where(eq(organizationInfo.uid, session.user.orgId))
      .returning();

    if (updatedOrg.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrg[0]);
  } catch (error) {
    console.error('Failed to update organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
