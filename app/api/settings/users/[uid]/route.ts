import { auth } from "@/app/lib/auth";
import db, { users } from "@/app/lib/drizzle";
import { Logger } from "@/app/lib/logger/logger.service";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
	try {
		const { uid } = await params;

		const session = await auth();
		if (!session?.user?.orgId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await request.json();
		const logger = Logger.getInstance();
		await logger.init();
		await logger.debug(
			"api/settings/users/[uid]/route.ts",
			`Received data: ${JSON.stringify(data)}`,
		);

		const updatedUser = await db
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
			.where(
				and(eq(users.uid, String(uid)), eq(users.orgid, session.user.orgId)),
			)
			.returning();

		if (updatedUser.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const logger2 = Logger.getInstance();
		await logger2.init();
		await logger2.info(
			"api/settings/users/[uid]/route.ts",
			`Updated user: ${JSON.stringify(updatedUser[0])}`,
		);
		return NextResponse.json(updatedUser[0]);
	} catch (error) {
		const logger = Logger.getInstance();
		await logger.init();
		await logger.error(
			"api/settings/users/[uid]/route.ts",
			`Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return NextResponse.json(
			{ error: "Failed to update user" },
			{ status: 500 },
		);
	}
}
