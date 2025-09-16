import db, { organizationInfo } from '@/app/lib/drizzle';
import {
  withAuth,
  AuthenticatedRequest,
  createSuccessResponse,
  createErrorResponse,
} from '@/app/lib/api-auth';
import { validateOrganization } from '@/app/lib/api-validation';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/settings/organization
 * Fetch organization information for the authenticated user's organization
 */
async function getOrganizationHandler(request: AuthenticatedRequest) {
  try {
    const orgInfoResults = await db
      .select()
      .from(organizationInfo)
      .where(
        and(
          eq(organizationInfo.uid, request.auth.user.orgId),
          eq(organizationInfo.active, true)
        )
      )
      .limit(1);

    if (orgInfoResults.length === 0) {
      return createErrorResponse('Organization not found', 404, 'NOT_FOUND');
    }

    const orgInfo = orgInfoResults[0];

    // Validate the response data
    const validatedOrgInfo = validateOrganization(orgInfo);

    return createSuccessResponse(validatedOrgInfo);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(
      `Failed to fetch organization info: ${errorMessage}`,
      500,
      'DATABASE_ERROR'
    );
  }
}

export const GET = withAuth(getOrganizationHandler, {
  loggerContext: 'api/settings/organization/route.ts',
});
