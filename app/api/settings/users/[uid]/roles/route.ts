import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger';

// Get roles for a specific user
export async function GET(
  _request: NextRequest,
  context: { params: { uid: string } }
): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const { uid } = await Promise.resolve(context.params);

    const session = await auth();
    if (!session?.user?.orgId) {
      await logger.warning(
        'api/settings/users/[uid]/roles/route.ts',
        'Unauthorized access attempt to user roles'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user roles using $queryRaw
    const userRoles =
      (await prisma.$queryRaw`
        SELECT 
        ur.uid,
        r.uid AS role_uid,
        r.role_name,
        r.description
      FROM 
        user_roles AS ur
      JOIN 
        roles AS r ON ur.roleid = r.uid
      WHERE 
        ur.userid = ${uid}::uuid AND
        ur.orgid = ${session.user.orgId}::uuid AND
        ur.active = true
    `) || []; // Default to empty array if null

    // Transform the result to match the expected shape, handling null case
    const roles = Array.isArray(userRoles)
      ? userRoles.map((ur: any) => ({
          uid: ur.role_uid || '',
          role_name: ur.role_name || '',
          description: ur.description || null,
        }))
      : [];

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `Retrieved ${roles.length} roles for user ${uid}`
    );
    return NextResponse.json(roles);
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
  context: { params: { uid: string } }
): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const { uid } = await Promise.resolve(context.params);

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
      const existingRole = await prisma.user_roles.findFirst({
        where: {
          userid: uid,
          roleid: roleIds[0],
          orgid: session.user.orgId,
        },
      });

      if (existingRole) {
        // Update existing role to active
        await logger.debug(
          'api/settings/users/[uid]/roles/route.ts',
          `Updating existing role ${roleIds[0]} for user ${uid}`
        );
        await prisma.user_roles.update({
          where: {
            uid: existingRole.uid,
          },
          data: {
            active: true,
            last_edit: new Date(),
          },
        });

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
        await prisma.user_roles.create({
          data: {
            uid: crypto.randomUUID(),
            userid: uid,
            roleid: roleIds[0],
            orgid: session.user.orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date(),
            locked: false,
          },
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
      await prisma.user_roles.updateMany({
        where: {
          userid: uid,
          roleid: { in: roleIds },
          orgid: session.user.orgId,
          active: true,
        },
        data: {
          active: false,
          last_edit: new Date(),
        },
      });

      await logger.info(
        'api/settings/users/[uid]/roles/route.ts',
        'Roles removed successfully'
      );
    }

    // Fetch updated roles with role details
    const updatedUserRoles =
      (await prisma.$queryRaw`
    SELECT 
    ur.uid,
    r.uid AS role_uid,
    r.role_name,
    r.description
  FROM 
    user_roles AS ur
  JOIN 
    roles AS r ON ur.roleid = r.uid
  WHERE 
    ur.userid = ${uid}::uuid AND
    ur.orgid = ${session.user.orgId}::uuid AND
    ur.active = true
`) || [];

    // Transform the result to return just the role details
    const roles = Array.isArray(updatedUserRoles)
      ? updatedUserRoles.map((ur: any) => ({
          uid: ur.role_uid || '',
          role_name: ur.role_name || '',
          description: ur.description || null,
        }))
      : [];

    await logger.info(
      'api/settings/users/[uid]/roles/route.ts',
      `Role update completed. User now has ${roles.length} active roles`
    );
    return NextResponse.json(roles);
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
