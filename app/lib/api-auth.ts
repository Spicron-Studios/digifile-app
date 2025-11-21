import { auth } from "@/app/lib/auth";
import { logger, wrapError } from "@/app/lib/foundation";
import { type NextRequest, NextResponse } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
	auth: {
		user: {
			id: string;
			orgId: string;
			role: { uid: string; name: string } | null;
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
		_context?: { params?: Record<string, string | string[]> },
	) => Promise<NextResponse<ApiResponse<T>>>,
	options: {
		requireRoles?: string[];
		allowSelfAccess?: boolean;
		loggerContext: string;
	} = { loggerContext: "api" },
) {
	return async (
		_request: NextRequest,
		_context?: unknown,
	): Promise<NextResponse<ApiResponse<T>>> => {
		try {
			logger.info(
				options.loggerContext,
				`${_request.method} ${_request.url} - Authentication check started`,
			);

			// Get session
			const session = await auth();
			if (!session?.user?.orgId) {
				logger.warn(
					options.loggerContext,
					"Unauthorized access attempt - No valid session",
				);
				return NextResponse.json(
					{ error: "Unauthorized", type: "AUTH_ERROR" },
					{ status: 401 },
				);
			}

			// Check organization access for parameterized routes
			const context = _context as
				| { params?: Record<string, string | string[]> }
				| undefined;
			if (context?.params?.uid && options.allowSelfAccess) {
				if (session.user.orgId !== context.params.uid) {
					logger.warn(
						options.loggerContext,
						`Forbidden access attempt - Organization mismatch: ${session.user.orgId} vs ${context.params.uid}`,
					);
					return NextResponse.json(
						{
							error: "Forbidden - Organization access denied",
							type: "ORG_ACCESS_ERROR",
						},
						{ status: 403 },
					);
				}
			}

			// Check role requirements
			if (options.requireRoles && options.requireRoles.length > 0) {
				const userRoleName = (session.user.role?.name ?? "").toLowerCase();
				const hasRequiredRole = options.requireRoles.some(
					(role) => userRoleName === role.toLowerCase(),
				);

				if (!hasRequiredRole) {
					logger.warn(
						options.loggerContext,
						`Access denied - Required roles: ${options.requireRoles.join(", ")}, User role: ${userRoleName}`,
					);
					return NextResponse.json(
						{ error: "Insufficient permissions", type: "ROLE_ERROR" },
						{ status: 403 },
					);
				}
			}

			// Create authenticated request
			const authenticatedRequest = _request as AuthenticatedRequest;
			authenticatedRequest.auth = {
				user: {
					id: session.user.id,
					orgId: session.user.orgId,
					role: session.user.role ?? null,
				},
			};

			logger.debug(
				options.loggerContext,
				`Authentication successful for user: ${session.user.id}, org: ${session.user.orgId}`,
			);

			// Call the handler
			return await handler(
				authenticatedRequest,
				_context as { params?: Record<string, string | string[]> } | undefined,
			);
		} catch (error) {
			const wrapped = wrapError(
				error,
				"withAuth",
				"Authentication middleware error",
			);
			logger.error(options.loggerContext, wrapped);

			return NextResponse.json(
				{ error: "Internal server error", type: "SYSTEM_ERROR" },
				{ status: 500 },
			);
		}
	};
}

/**
 * Standardized error response helper
 */
export function createErrorResponse(
	error: string,
	status = 500,
	type = "SYSTEM_ERROR",
): NextResponse<ApiResponse> {
	return NextResponse.json({ error, type }, { status });
}

/**
 * Standardized success response helper
 */
export function createSuccessResponse<T>(
	data: T,
	status = 200,
): NextResponse<ApiResponse<T>> {
	return NextResponse.json({ data }, { status });
}

/**
 * Validation helper for request data
 */
export async function validateRequestData<T>(
	request: NextRequest,
	validator: (_data: T) => T,
): Promise<{ data: T; error?: never } | { data?: never; error: string }> {
	try {
		const rawData = await request.json();
		const validatedData = validator(rawData);
		return { data: validatedData };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Invalid request data";
		return { error: errorMessage };
	}
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: { name: string } | null | undefined): boolean {
	return (role?.name ?? "").toLowerCase() === "admin";
}

/**
 * Check if user has organizer privileges
 */
export function isOrganizer(
	role: { name: string } | null | undefined,
): boolean {
	return (role?.name ?? "").toLowerCase() === "organizer";
}

export function isSuperUser(
	role: { name: string } | null | undefined,
): boolean {
	return (role?.name ?? "").toLowerCase() === "superuser";
}

/**
 * Check if user has admin or organizer privileges
 */
export function isAdminOrOrganizer(
	role: { name: string } | null | undefined,
): boolean {
	return isAdmin(role) || isOrganizer(role);
}

export function hasElevatedAccess(
	role: { name: string } | null | undefined,
): boolean {
	return isAdmin(role) || isOrganizer(role) || isSuperUser(role);
}
