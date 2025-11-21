import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { auth } from "@/app/actions/auth";
import db, { users } from "@/app/lib/drizzle";
import { and, eq } from "drizzle-orm";

export async function GET() {
	try {
		// Verify authentication
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userList = await db
			.select({
				username: users.username,
			})
			.from(users)
			.where(and(eq(users.active, true), eq(users.orgid, session.user.orgId)));

		return NextResponse.json(userList);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch users" + error },
			{ status: 500 },
		);
	}
}

export async function POST() {
	return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
