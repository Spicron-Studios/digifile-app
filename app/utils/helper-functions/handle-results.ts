// Types for the result object with discriminated union
export type Success<T> = {
  data: T;
  error: null;
};

export type Failure<E> = {
  data: null;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

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
  }
): Promise<Result<T, E>> => {
  try {
    const data = await promise;
    await options?.onSuccess?.(data);
    return { data, error: null };
  } catch (error) {
    await options?.onError?.(error as E);
    return { data: null, error: error as E };
  } finally {
    await options?.onFinally?.();
  }
};
