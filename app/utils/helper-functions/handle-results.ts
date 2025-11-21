/**
 * handle-results.ts — Mini tutorial for developers and AI coding agents
 *
 * What is this?
 * - A tiny utility that converts any Promise<T> into a Promise<Result<T, E>>
 *   where no exceptions are thrown. Instead, the outcome is always an object
 *   with either { data, error: null } or { data: null, error }.
 *
 * Why use this?
 * - Standardizes async error handling without repetitive try/catch.
 * - Enforces explicit handling of failures via a typed discriminated union.
 * - Plays well with linters and makes control flow clearer and safer.
 * - Optional onSuccess/onError/onFinally callbacks for side effects.
 *
 * Core types and API
 * - Result<T, E = Error> = { data: T; error: null } | { data: null; error: E }
 * - handleResult<T, E = Error>(promise, options?) => Promise<Result<T, E>>
 *   options?: { onSuccess?: (data: T) => void | Promise<void>; onError?: (error: E) => void | Promise<void>; onFinally?: () => void | Promise<void> }
 *
 * How to use (copy-paste friendly)
 *
 * Basic pattern
 * ```ts
 * import { handleResult } from "@/utils/helper-functions/handle-results";
 *
 * async function loadUser(userId: string) {
 *   const { data: user, error } = await handleResult(fetchUser(userId));
 *   if (error) {
 *     // handle error path
 *     return null;
 *   }
 *   // success path is type-safe: user is non-null here
 *   return user;
 * }
 * ```
 *
 * With side-effect callbacks
 * ```ts
 * const { data, error } = await handleResult(updateUser(input), {
 *   onSuccess: (updated) => logger.info("User updated", { id: updated.id }),
 *   onError: (err) => logger.error("Update failed", { err }),
 *   onFinally: () => setSubmitting(false),
 * });
 * ```
 *
 * Migrating from try/catch
 * Before:
 * ```ts
 * let user: User | null = null;
 * try {
 *   user = await fetchUser(id);
 * } catch (err) {
 *   logger.error(err);
 * }
 * if (!user) return;
 * // use user
 * ```
 * After:
 * ```ts
 * const { data: user, error } = await handleResult<User>(fetchUser(id));
 * if (error) {
 *   logger.error(error);
 *   return;
 * }
 * // use user
 * ```
 *
 * Custom error types
 * ```ts
 * type ApiError = { message: string; code: string };
 * const { data, error } = await handleResult<MyData, ApiError>(apiCall());
 * if (error) {
 *   // error is ApiError here
 * }
 * ```
 *
 * Composing multiple operations
 * - Sequential short-circuit:
 * ```ts
 * const a = await handleResult(stepA());
 * if (a.error) return a.error;
 * const b = await handleResult(stepB(a.data));
 * if (b.error) return b.error;
 * // proceed with b.data
 * ```
 * - Parallel with Promise.all:
 * ```ts
 * const [r1, r2] = await Promise.all([
 *   handleResult(fetchA()),
 *   handleResult(fetchB()),
 * ]);
 * if (r1.error || r2.error) {
 *   // handle errors individually
 * }
 * ```
 *
 * Where to adopt this pattern
 * - API routes, server actions, services/SDK wrappers, React event handlers,
 *   background jobs—any async boundary.
 *
 * Quick adoption checklist
 * - Import and use handleResult around async calls.
 * - Always check `result.error` first; return/early-exit on failure.
 * - Keep side effects in options or a dedicated layer (logging/toasts).
 * - Prefer meaningful custom error types when useful.
 *
 * Anti-patterns to avoid
 * - Ignoring `error` from the returned Result.
 * - Mixing handleResult with .then/.catch on the same promise.
 * - Duplicating side effects both in callbacks and in the if/else branch.
 *
 * Notes for AI coding agents
 * - Prefer this utility in new/updated code for consistent error handling.
 * - Update call sites, not callee signatures. Do not change existing public
 *   function signatures—wrap their returned promises at the call site.
 */

import {
	type Success,
	type Failure,
	type Result,
	handleResult as coreHandleResult,
} from "@/app/lib/foundation";

export type { Success, Failure, Result };

/**
 * Examples:
 * ```ts
 * const { data, error } = await handleResult(promise);
 * ```
 * ```ts
 * const { data, error } = await handleResult(promise, {
 *   onSuccess: (data) => console.log("Success:", data),
 *   onError: (error) => console.error("Error:", error),
 *   onFinally: () => console.log("Finally!")
 * });
 * ```
 */
export const handleResult = async <T, E = Error>(
	promise: Promise<T>,
	options?: {
		onSuccess?: (_data: T) => Promise<void> | void;
		onError?: (_error: E) => Promise<void> | void;
		onFinally?: () => Promise<void> | void;
	},
): Promise<Result<T, E>> => {
	const result = await coreHandleResult<T, E>(
		promise,
		async data => {
			await options?.onSuccess?.(data);
		},
		async error => {
			await options?.onError?.(error);
		},
	);

	await options?.onFinally?.();

	return result;
};

