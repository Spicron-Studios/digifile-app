import { NextRequest, NextResponse } from 'next/server';
import db, { userRoles, roles } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger';
import { eq, and, inArray } from 'drizzle-orm';

// Get roles for a specific user
export async function GET(
  _request: NextRequest,
  context: unknown
): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const params =
      (context as { params?: Record<string, unknown> }).params ?? {};
    const uid = String(params.uid ?? '');

    const session = await auth();
    if (!session?.user?.orgId) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        'Unauthorized access attempt to user roles'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user roles using Drizzle join
    const userRolesList = await db
      .select({
        uid: roles.uid,
        role_name: roles.roleName,
        description: roles.description,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleid, roles.uid))
      .where(
        and(
          eq(userRoles.userid, uid),
          eq(userRoles.orgid, session.user.orgId),
          eq(userRoles.active, true)
        )
      );

    // Transform the result to match the expected shape
    const rolesList = userRolesList.map(ur => ({
      uid: ur.uid || '',
      role_name: ur.role_name || '',
      description: ur.description || null,
    }));

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `Retrieved ${rolesList.length} roles for user ${uid}`
    );
    return NextResponse.json(rolesList);
  } catch (error) {
    await logger.error(
      'api/settings/users/[uid]/roles/route.ts',
      `Failed to fetch user roles: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

// Add or remove roles for a user
export async function PUT(
  request: NextRequest,
  context: unknown
): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const params =
      (context as { params?: Record<string, unknown> }).params ?? {};
    const uid = String(params.uid ?? '');

    const session = await auth();
    if (!session?.user?.orgId) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        'Unauthorized access attempt to update user roles'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roleIds, action } = await request.json();

    if (!Array.isArray(roleIds) || !['add', 'remove'].includes(action)) {
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
      `Processing role ${action} for user ${uid}`
    );

    if (action === 'add') {
      await logger.debug(
        'api/settings/users/[uid]/roles/route.ts',
        'Adding role to user'
      );

      // Check for existing role (active or inactive)
      const existingRole = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userid, uid),
            eq(userRoles.roleid, roleIds[0]),
            eq(userRoles.orgid, session.user.orgId)
          )
        )
        .limit(1);

      if (existingRole.length > 0) {
        // Update existing role to active
        await logger.debug(
          'api/settings/users/[uid]/roles/route.ts',
          `Updating existing role ${roleIds[0]} for user ${uid}`
        );
        await db
          .update(userRoles)
          .set({
            active: true,
            lastEdit: new Date().toISOString(),
          })
          .where(eq(userRoles.uid, existingRole[0]?.uid as string));

        await logger.info(
          'api/settings/users/[uid]/roles/route.ts',
          'Existing role updated successfully'
        );
      } else {
        await logger.debug(
          'api/settings/users/[uid]/roles/route.ts',
          `Creating new role ${roleIds[0]} for user ${uid}`
        );
        // Create new user role record
        await db.insert(userRoles).values({
          uid: crypto.randomUUID(),
          userid: uid,
          roleid: roleIds[0],
          orgid: session.user.orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
          locked: false,
        });

        await logger.info(
          'api/settings/users/[uid]/roles/route.ts',
          'New role created successfully'
        );
      }
    } else {
      await logger.debug(
        'api/settings/users/[uid]/roles/route.ts',
        `Removing roles ${roleIds.join(', ')} from user ${uid}`
      );

      // Set role to inactive
      await db
        .update(userRoles)
        .set({
          active: false,
          lastEdit: new Date().toISOString(),
        })
        .where(
          and(
            eq(userRoles.userid, uid),
            inArray(userRoles.roleid, roleIds),
            eq(userRoles.orgid, session.user.orgId),
            eq(userRoles.active, true)
          )
        );

      await logger.info(
        'api/settings/users/[uid]/roles/route.ts',
        'Roles removed successfully'
      );
    }

    // Fetch updated roles with role details
    const updatedUserRoles = await db
      .select({
        uid: roles.uid,
        role_name: roles.roleName,
        description: roles.description,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleid, roles.uid))
      .where(
        and(
          eq(userRoles.userid, uid),
          eq(userRoles.orgid, session.user.orgId),
          eq(userRoles.active, true)
        )
      );

    // Transform the result to return just the role details
    const rolesList = updatedUserRoles.map(ur => ({
      uid: ur.uid || '',
      role_name: ur.role_name || '',
      description: ur.description || null,
    }));

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `Role update completed. User now has ${rolesList.length} active roles`
    );
    return NextResponse.json(rolesList);
  } catch (error) {
    await logger.error(
      'api/settings/users/[uid]/roles/route.ts',
      `Failed to update user roles: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to update user roles' },
      { status: 500 }
    );
  }
}
