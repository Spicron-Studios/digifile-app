import {
	createErrorResponse,
	createSuccessResponse,
	withAuth,
} from "@/app/lib/api-auth";
import db, { roles } from "@/app/lib/drizzle";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/settings/users/roles
 * Fetch all available roles for the organization
 */
async function getRolesHandler() {
	try {
		// Fetch all active roles for the organization
		const rolesList = await db
			.select({
				uid: roles.uid,
				role_name: roles.roleName,
				description: roles.description,
			})
			.from(roles)
			.where(eq(roles.active, true));

		return createSuccessResponse(rolesList);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return createErrorResponse(
			`Failed to fetch roles: ${errorMessage}`,
			500,
			"DATABASE_ERROR",
		);
	}
}

export const GET = withAuth(getRolesHandler, {
	loggerContext: "api/settings/users/roles/route.ts",
});
