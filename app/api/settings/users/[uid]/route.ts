'use server';

import { NextRequest, NextResponse } from 'next/server';
import db, { users } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  context: { params: { uid: string } }
): Promise<NextResponse> {
  try {
    const { uid } = await Promise.resolve(context.params);

    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received data:', data);

    const updatedUser = await db
      .update(users)
      .set({
        title: data.title,
        firstName: data.firstName,
        surname: data.lastName,
        username: data.username,
        email: data.email,
        cellNo: data.phone,
        lastEdit: new Date(),
      })
      .where(and(eq(users.uid, uid), eq(users.orgid, session.user.orgId)))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Updated user:', updatedUser[0]);
    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
