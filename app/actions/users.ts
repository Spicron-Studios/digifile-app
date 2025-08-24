'use server';

import db, { users, roles, userRoles } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';

export type SimpleUser = {
  uid: string;
  title: string | null;
  first_name: string | null;
  surname: string | null;
  email: string | null;
  username: string | null;
  cell_no: string | null;
};

export async function getUsers(): Promise<SimpleUser[]> {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  const isAdmin = session.user.roles.some(
    r => r.role.name.toLowerCase() === 'admin'
  );
  const isOrganizer = session.user.roles.some(
    r => r.role.name.toLowerCase() === 'organizer'
  );

  const whereConditions = [
    eq(users.active, true),
    eq(users.orgid, session.user.orgId),
  ];

  if (!(isAdmin || isOrganizer)) {
    whereConditions.push(eq(users.uid, session.user.id));
  }

  const userList = await db
    .select({
      uid: users.uid,
      title: users.title,
      first_name: users.firstName,
      surname: users.surname,
      email: users.email,
      username: users.username,
      cell_no: users.cellNo,
    })
    .from(users)
    .where(and(...whereConditions));

  return userList;
}

export async function updateUser(
  userUid: string,
  data: {
    title: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
  }
) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  const updated = await db
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
    .where(and(eq(users.uid, userUid), eq(users.orgid, session.user.orgId)))
    .returning();

  return updated[0];
}

export type Role = {
  uid: string;
  role_name: string;
  description: string | null;
};

export async function getAvailableRoles(): Promise<Role[]> {
  const roleList = await db
    .select({
      uid: roles.uid,
      role_name: roles.roleName,
      description: roles.description,
    })
    .from(roles)
    .where(eq(roles.active, true));

  return roleList.map(r => ({
    uid: r.uid,
    role_name: r.role_name || '',
    description: r.description,
  }));
}

export async function getUserRoles(userUid: string): Promise<Role[]> {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  const rows = await db
    .select({
      uid: roles.uid,
      role_name: roles.roleName,
      description: roles.description,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleid, roles.uid))
    .where(
      and(
        eq(userRoles.userid, userUid),
        eq(userRoles.orgid, session.user.orgId),
        eq(userRoles.active, true)
      )
    );

  return rows.map(r => ({
    uid: r.uid || '',
    role_name: r.role_name || '',
    description: r.description || null,
  }));
}

export async function updateUserRoles(
  userUid: string,
  roleIds: string[],
  action: 'add' | 'remove'
): Promise<Role[]> {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  if (action === 'add') {
    const roleId = roleIds[0];

    // Check if role assignment already exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userid, userUid),
          eq(userRoles.roleid as any, roleId),
          eq(userRoles.orgid, session.user.orgId)
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      // Reactivate existing role
      await db
        .update(userRoles)
        .set({
          active: true,
          lastEdit: new Date(),
        })
        .where(eq(userRoles.uid, existing[0].uid));
    } else {
      // Create new role assignment
      await db.insert(userRoles).values({
        uid: crypto.randomUUID(),
        userid: userUid,
        roleid: roleId,
        orgid: session.user.orgId,
        active: true,
        dateCreated: new Date(),
        lastEdit: new Date(),
        locked: false,
      });
    }
  } else {
    // Deactivate roles
    await db
      .update(userRoles)
      .set({
        active: false,
        lastEdit: new Date(),
      })
      .where(
        and(
          eq(userRoles.userid, userUid),
          inArray(userRoles.roleid as any, roleIds),
          eq(userRoles.orgid, session.user.orgId),
          eq(userRoles.active, true)
        )
      );
  }

  return getUserRoles(userUid);
}
