import prisma from '@/app/lib/prisma';
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
} from '@/app/lib/api-auth';

/**
 * GET /api/settings/users/roles
 * Fetch all available roles for the organization
 */
async function getRolesHandler() {
  try {
    // Fetch all active roles for the organization
    const roles = await prisma.roles.findMany({
      where: {
        active: true,
      },
      select: {
        uid: true,
        role_name: true,
        description: true,
      },
    });

    return createSuccessResponse(roles);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(
      `Failed to fetch roles: ${errorMessage}`,
      500,
      'DATABASE_ERROR'
    );
  }
}

export const GET = withAuth(getRolesHandler, {
  loggerContext: 'api/settings/users/roles/route.ts',
});
