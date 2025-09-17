import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger';

export interface AuthenticatedRequest extends NextRequest {
  auth: {
    user: {
      id: string;
      orgId: string;
      roles: Array<{ role: { uid: string; name: string } }>;
    };
  };
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  type?: string;
}

/**
 * Standardized authentication wrapper for API routes
 * Ensures consistent auth checking, logging, and error responses
 */
export function withAuth<T>(
  handler: (
    _request: AuthenticatedRequest,
    _context?: { params?: Record<string, string | string[]> }
  ) => Promise<NextResponse<ApiResponse<T>>>,
  options: {
    requireRoles?: string[];
    allowSelfAccess?: boolean;
    loggerContext: string;
  } = { loggerContext: 'api' }
) {
  return async (
    _request: NextRequest,
    _context?: any
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const logger = Logger.getInstance();
    await logger.init();

    try {
      await logger.info(
        options.loggerContext,
        `${_request.method} ${_request.url} - Authentication check started`
      );

      // Get session
      const session = await auth();
      if (!session?.user?.orgId) {
        await logger.warning(
          options.loggerContext,
          'Unauthorized access attempt - No valid session'
        );
        return NextResponse.json(
          { error: 'Unauthorized', type: 'AUTH_ERROR' },
          { status: 401 }
        );
      }

      // Check organization access for parameterized routes
      if (_context?.params?.uid && options.allowSelfAccess) {
        if (session.user.orgId !== _context.params.uid) {
          await logger.warning(
            options.loggerContext,
            `Forbidden access attempt - Organization mismatch: ${session.user.orgId} vs ${_context.params.uid}`
          );
          return NextResponse.json(
            {
              error: 'Forbidden - Organization access denied',
              type: 'ORG_ACCESS_ERROR',
            },
            { status: 403 }
          );
        }
      }

      // Check role requirements
      if (options.requireRoles && options.requireRoles.length > 0) {
        const userRoles = session.user.roles.map(r =>
          r.role.name.toLowerCase()
        );
        const hasRequiredRole = options.requireRoles.some(role =>
          userRoles.includes(role.toLowerCase())
        );

        if (!hasRequiredRole) {
          await logger.warning(
            options.loggerContext,
            `Access denied - Required roles: ${options.requireRoles.join(', ')}, User roles: ${userRoles.join(', ')}`
          );
          return NextResponse.json(
            { error: 'Insufficient permissions', type: 'ROLE_ERROR' },
            { status: 403 }
          );
        }
      }

      // Create authenticated request
      const authenticatedRequest = _request as AuthenticatedRequest;
      authenticatedRequest.auth = {
        user: {
          id: session.user.id,
          orgId: session.user.orgId,
          roles: session.user.roles,
        },
      };

      await logger.debug(
        options.loggerContext,
        `Authentication successful for user: ${session.user.id}, org: ${session.user.orgId}`
      );

      // Call the handler
      return await handler(authenticatedRequest, _context);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await logger.error(
        options.loggerContext,
        `Authentication middleware error: ${errorMessage}`
      );

      return NextResponse.json(
        { error: 'Internal server error', type: 'SYSTEM_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Standardized error response helper
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  type: string = 'SYSTEM_ERROR'
): NextResponse<ApiResponse> {
  return NextResponse.json({ error, type }, { status });
}

/**
 * Standardized success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Validation helper for request data
 */
export async function validateRequestData<T>(
  request: NextRequest,
  validator: (_data: T) => T
): Promise<{ data: T; error?: never } | { data?: never; error: string }> {
  try {
    const rawData = await request.json();
    const validatedData = validator(rawData);
    return { data: validatedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Invalid request data';
    return { error: errorMessage };
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(roles: Array<{ role: { name: string } }>): boolean {
  return roles.some(r => r.role.name.toLowerCase() === 'admin');
}

/**
 * Check if user has organizer privileges
 */
export function isOrganizer(roles: Array<{ role: { name: string } }>): boolean {
  return roles.some(r => r.role.name.toLowerCase() === 'organizer');
}

/**
 * Check if user has admin or organizer privileges
 */
export function isAdminOrOrganizer(
  roles: Array<{ role: { name: string } }>
): boolean {
  return isAdmin(roles) || isOrganizer(roles);
}
