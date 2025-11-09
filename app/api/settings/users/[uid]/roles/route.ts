import { NextRequest, NextResponse } from 'next/server';
import db, { roles, users } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger/logger.service';
import { eq, and } from 'drizzle-orm';

// Get role for a specific user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const { uid } = await params;

    const session = await auth();
    if (!session?.user?.orgId) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        'Unauthorized access attempt to user role'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission: allow if requesting own role or user has elevated role
    const roleName = (session.user.role?.name ?? '').toLowerCase();
    const hasElevated =
      roleName === 'admin' ||
      roleName === 'organizer' ||
      roleName === 'superuser';
    if (uid !== session.user.id && !hasElevated) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user role directly from user table
    const userWithRole = await db
      .select({
        uid: users.uid,
        roleId: users.roleId,
        roleName: roles.roleName,
        description: roles.description,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.uid))
      .where(and(eq(users.uid, uid), eq(users.orgid, session.user.orgId)))
      .limit(1);

    if (userWithRole.length > 0) {
      const user = userWithRole[0];
      if (user && user.roleId) {
        const roleDetails = {
          uid: user.roleId,
          role_name: user.roleName || 'Unknown',
          description: user.description || null,
        };

        await logger.info(
          'api/settings/users/[uid]/roles/route.ts',
          `Retrieved role ${roleDetails.role_name} for user ${uid}`
        );
        return NextResponse.json(roleDetails);
      }
    }

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `No role found for user ${uid}`
    );
    return NextResponse.json(null);
  } catch (error) {
    await logger.error(
      'api/settings/users/[uid]/roles/route.ts',
      `Failed to fetch user role: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to fetch user role' },
      { status: 500 }
    );
  }
}

// Update role for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const { uid } = await params;

    const session = await auth();
    if (!session?.user?.orgId) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        'Unauthorized access attempt to update user role'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roleId } = await request.json();

    if (!roleId || typeof roleId !== 'string') {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        'Invalid request body for role update'
      );
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `Updating role for user ${uid} to ${roleId}`
    );

    // Permission: only Admin/Organizer/SuperUser can modify roles
    const roleName = (session.user.role?.name ?? '').toLowerCase();
    const hasElevated =
      roleName === 'admin' ||
      roleName === 'organizer' ||
      roleName === 'superuser';
    if (!hasElevated) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update user role directly
    const updated = await db
      .update(users)
      .set({
        roleId: roleId,
        lastEdit: new Date().toISOString(),
      })
      .where(and(eq(users.uid, uid), eq(users.orgid, session.user.orgId)))
      .returning();

    if (updated.length === 0) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        `User ${uid} not found or not in organization`
      );
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch updated role details
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.uid, roleId))
      .limit(1);

    if (role.length === 0 || !role[0]) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        `Role ${roleId} not found`
      );
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const roleDetails = {
      uid: role[0].uid,
      role_name: role[0].roleName || 'Unknown',
      description: role[0].description || null,
    };

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `Role update completed. User ${uid} now has role ${roleDetails.role_name}`
    );
    return NextResponse.json(roleDetails);
  } catch (error) {
    await logger.error(
      'api/settings/users/[uid]/roles/route.ts',
      `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
