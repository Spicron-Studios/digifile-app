import prisma from '@/app/lib/prisma';
import {
  withAuth,
  AuthenticatedRequest,
  createSuccessResponse,
  createErrorResponse,
} from '@/app/lib/api-auth';
import { validateOrganization } from '@/app/lib/api-validation';

/**
 * GET /api/settings/organization
 * Fetch organization information for the authenticated user's organization
 */
async function getOrganizationHandler(request: AuthenticatedRequest) {
  try {
    const orgInfo = await prisma.organization_info.findFirst({
      where: {
        uid: request.auth.user.orgId,
        active: true,
      },
    });

    if (!orgInfo) {
      return createErrorResponse('Organization not found', 404, 'NOT_FOUND');
    }

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
