/**
 * 🌈 RUNE SENTINEL (PRISMATIC EDITION) 🌈
 *
 * Core defensive programming primitives for the app:
 * - Type-safe Result/AsyncResult pattern
 * - Custom error classes
 * - Timeout and retry helpers
 * - Error wrapping with chain-of-custody
 *
 * NOTE:
 * - This file is intentionally free of Node-only imports so that it can be
 *   safely consumed in both server and browser environments.
 * - Logging is implemented in dedicated logger modules that build on top of
 *   these primitives.
 */

// ==========================================
// 0. THE CRAYON (Colors of the Wind)
// ==========================================

const codes = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	gray: "\x1b[90m",
} as const;

/**
 * Built-in color utility (Crayon).
 * Adds visual clarity to logs without requiring external deps.
 * Server-side loggers may use these for ANSI-colored output.
 */
export const crayon = {
	red: (text: string): string => `${codes.red}${text}${codes.reset}`,
	green: (text: string): string => `${codes.green}${text}${codes.reset}`,
	yellow: (text: string): string => `${codes.yellow}${text}${codes.reset}`,
	blue: (text: string): string => `${codes.blue}${text}${codes.reset}`,
	magenta: (text: string): string => `${codes.magenta}${text}${codes.reset}`,
	cyan: (text: string): string => `${codes.cyan}${text}${codes.reset}`,
	white: (text: string): string => `${codes.white}${text}${codes.reset}`,
	gray: (text: string): string => `${codes.gray}${text}${codes.reset}`,
	bold: (text: string): string => `${codes.bright}${text}${codes.reset}`,
};

// ==========================================
// 1. RESULT TYPES
// ==========================================

/**
 * Represents a successful operation.
 * Explicitly encodes data presence and error absence.
 */
export type Success<T> = {
	data: T;
	error: null;
};

/**
 * Represents a failed operation.
 * Explicitly encodes error presence and data absence.
 */
export type Failure<E> = {
	data: null;
	error: E;
};

/**
 * Discriminated union for success and failure.
 * Always check `result.error` before using `result.data`.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Standard async return type for defensive operations.
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ==========================================
// 2. LOGGING TYPES (used by loggers built on top of this file)
// ==========================================

export type LogSeverity = "log" | "info" | "warn" | "error" | "debug";

// ==========================================
// 3. THE BESTIARY (Custom Error Classes)
// ==========================================

/**
 * Base class for all custom application errors.
 * Allows reliable instanceof checks and includes a code and optional cause.
 */
export class BaseError extends Error {
	public readonly code: string;

	public readonly cause?: unknown;

	constructor(message: string, code: string, cause?: unknown) {
		super(message);
		this.name = new.target.name;
		this.code = code;
		this.cause = cause;
	}
}

/**
 * Thrown when a network request fails (e.g. offline, DNS failure).
 */
export class NetworkError extends BaseError {
	constructor(message: string, cause?: unknown) {
		super(message, "NETWORK_ERROR", cause);
	}
}

/**
 * Thrown when an operation exceeds its time limit.
 */
export class TimeoutError extends BaseError {
	constructor(message: string, cause?: unknown) {
		super(message, "TIMEOUT_ERROR", cause);
	}
}

/**
 * Thrown when data fails validation rules.
 */
export class ValidationError extends BaseError {
	constructor(message: string, cause?: unknown) {
		super(message, "VALIDATION_ERROR", cause);
	}
}

// ==========================================
// 4. NORMALIZATION & RESULT HANDLING
// ==========================================

/**
 * Ensures every error is a proper Error object.
 * JavaScript allows throwing strings/numbers; this normalizes them.
 */
const normalizeError = (error: unknown): Error => {
	if (error instanceof Error) return error;
	return new Error(String(error));
};

/**
 * Wraps a Promise to catch errors and return a Result object.
 * Eliminates repetitive try/catch in business logic.
 *
 * @param promise The async operation
 * @param onSuccess Optional callback for success
 * @param onError Optional callback for failure
 */
export const handleResult = async <T, E = Error>(
	promise: Promise<T>,
	onSuccess?: (data: T) => void,
	onError?: (error: E) => void,
): AsyncResult<T, E> => {
	try {
		const data = await promise;
		onSuccess?.(data);
		return { data, error: null };
	} catch (error) {
		const safeError = normalizeError(error) as unknown as E;
		onError?.(safeError);
		return { data: null, error: safeError };
	}
};

// ==========================================
// 5. THE HOURGLASS (Timeout Wrapper)
// ==========================================

/**
 * Rejects a promise if it takes longer than `ms` milliseconds.
 *
 * @param promise The async operation
 * @param ms Timeout duration in milliseconds
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new TimeoutError(`Operation timed out after ${ms}ms`));
		}, ms);

		promise
			.then((value) => {
				clearTimeout(timer);
				resolve(value);
			})
			.catch((reason) => {
				clearTimeout(timer);
				reject(reason);
			});
	});
};

// ==========================================
// 6. THE TIME TURNER (Retry Logic)
// ==========================================

export type RetryOptions = {
	retries?: number;
	delay?: number;
	backoff?: boolean;
	shouldRetry?: (error: unknown) => boolean;
	onRetry?: (info: {
		error: unknown;
		attempt: number;
		retriesLeft: number;
		delay: number;
	}) => void;
};

/**
 * Automatically retries a failed operation based on configuration.
 *
 * @param operation Function that returns a promise
 * @param options Retry configuration (count, delay, etc.)
 */
export const withRetry = async <T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> => {
	const {
		retries = 3,
		delay = 0,
		backoff = false,
		shouldRetry,
		onRetry,
	} = options;

	try {
		return await operation();
	} catch (error) {
		if (retries > 0 && (!shouldRetry || shouldRetry(error))) {
			const waitTime = delay;
			const attempt =
				options.retries !== undefined ? options.retries - retries + 1 : 1;

			onRetry?.({
				error,
				attempt,
				retriesLeft: retries,
				delay: waitTime,
			});

			if (waitTime > 0) {
				await new Promise<void>((resolve) => {
					setTimeout(resolve, waitTime);
				});
			}

			return withRetry(operation, {
				...options,
				retries: retries - 1,
				delay: backoff ? delay * 2 : delay,
			});
		}

		throw error;
	}
};

// ==========================================
// 7. CHAIN OF CUSTODY (Error Propagation)
// ==========================================

/**
 * Adds context to an error while preserving the original cause.
 *
 * @param error The original error
 * @param context The current layer (e.g. "UserService")
 * @param message What we were trying to do
 */
export const wrapError = (
	error: unknown,
	context: string,
	message: string,
): Error => {
	const originalError = normalizeError(error);
	const newError = new Error(`${crayon.bold(`[${context}]`)} ${message}`);

	// Modern `cause` property support (loosely typed for compatibility)
	(newError as { cause?: Error }).cause = originalError;

	if (originalError.stack) {
		newError.stack = `${newError.stack ?? ""}\nCaused by: ${originalError.stack}`;
	}

	return newError;
};
