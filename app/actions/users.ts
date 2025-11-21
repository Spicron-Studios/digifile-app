"use server";

import { auth } from "@/app/lib/auth";
import db, { users, roles } from "@/app/lib/drizzle";
import { and, eq } from "drizzle-orm";

export type SimpleUser = {
	uid: string;
	title: string | null;
	first_name: string | null;
	surname: string | null;
	email: string | null;
	username: string | null;
	cell_no: string | null;
	role_id: string | null;
};

export async function getUsers(): Promise<SimpleUser[]> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");

	const roleName = (session.user.role?.name ?? "").toLowerCase();
	const isAdmin = roleName === "admin";
	const isOrganizer = roleName === "organizer";

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
			role_id: users.roleId,
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
	},
) {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");

	const updated = await db
		.update(users)
		.set({
			title: data.title,
			firstName: data.firstName,
			surname: data.lastName,
			username: data.username,
			email: data.email,
			cellNo: data.phone,
			lastEdit: new Date().toISOString(),
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

	return roleList.map((r) => ({
		uid: r.uid,
		role_name: r.role_name || "",
		description: r.description,
	}));
}

export async function getUserRole(userUid: string): Promise<Role | null> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");

	const userWithRole = await db
		.select({
			uid: users.uid,
			roleId: users.roleId,
			roleName: roles.roleName,
			description: roles.description,
		})
		.from(users)
		.leftJoin(roles, eq(users.roleId, roles.uid))
		.where(and(eq(users.uid, userUid), eq(users.orgid, session.user.orgId)))
		.limit(1);

	if (userWithRole.length > 0) {
		const user = userWithRole[0];
		if (user?.roleId) {
			return {
				uid: user.roleId,
				role_name: user.roleName || "Unknown",
				description: user.description,
			};
		}
	}

	return null;
}

export async function updateUserRole(
	userUid: string,
	roleId: string,
): Promise<Role | null> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");

	// Check if user has elevated access
	const name = (session.user.role?.name ?? "").toLowerCase();
	const hasElevated =
		name === "admin" || name === "organizer" || name === "superuser";

	if (!hasElevated) {
		throw new Error("Forbidden");
	}

	const updated = await db
		.update(users)
		.set({
			roleId: roleId,
			lastEdit: new Date().toISOString(),
		})
		.where(and(eq(users.uid, userUid), eq(users.orgid, session.user.orgId)))
		.returning();

	if (updated.length > 0) {
		// Return role details
		const role = await db
			.select()
			.from(roles)
			.where(eq(roles.uid, roleId))
			.limit(1);

		return role.length > 0 && role[0]
			? {
					uid: role[0].uid,
					role_name: role[0].roleName || "Unknown",
					description: role[0].description || null,
				}
			: null;
	}

	return null;
}
