import { NextResponse } from 'next/server';
import db, { users } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const roleName = (session.user.role?.name ?? '').toLowerCase();
    const isAdmin = roleName === 'admin';
    const isOrganizer = roleName === 'organizer';
    const isSuperUser = roleName === 'superuser';

    // Build where conditions
    const whereConditions = [
      eq(users.active, true),
      eq(users.orgid, session.user.orgId),
    ];

    // If user is not admin/organizer, only show their own record
    if (!(isAdmin || isOrganizer || isSuperUser)) {
      whereConditions.push(eq(users.uid, session.user.id));
    }

    const usersList = await db
      .select({
        uid: users.uid,
        title: users.title,
        first_name: users.firstName,
        surname: users.surname,
        email: users.email,
        username: users.username,
        cell_no: users.cellNo,
        role_id: users.roleId,
      })
      .from(users)
      .where(and(...whereConditions));

    return NextResponse.json(usersList);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch users:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
