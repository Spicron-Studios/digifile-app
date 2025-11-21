## RuneSentinel Foundation Guide

Centralized defensive programming primitives for this app live in this folder.
They provide:

- **Result pattern**: `Success`, `Failure`, `Result`, `AsyncResult`, `handleResult`
- **Resilience**: `withRetry`, `withTimeout`
- **Typed errors**: `BaseError`, `NetworkError`, `TimeoutError`, `ValidationError`
- **Error chaining**: `wrapError`
- **Logging**: `logger` (Prismatic-style, UUID trace IDs; colored on server, plain in browser)

All examples below use the **canonical import**:

```ts
import {
  type Result,
  type AsyncResult,
  type Success,
  type Failure,
  handleResult,
  withRetry,
  withTimeout,
  wrapError,
  BaseError,
  NetworkError,
  TimeoutError,
  ValidationError,
  logger,
} from "@/app/lib/foundation";
```

> TypeScript expectations in this repo:
> - **No `any`** – use generics and concrete types.
> - **Explicit return types** on exported functions.
> - JSX components return **`React.JSX.Element`**, not `JSX.Element`.

---

## 1. Result pattern (`Result`, `AsyncResult`, `handleResult`)

### 1.1 Types

```ts
type Success<T> = { data: T; error: null };
type Failure<E> = { data: null; error: E };
type Result<T, E = Error> = Success<T> | Failure<E>;
type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
```

**Why**: Callers must check `result.error` before using `result.data`. No thrown
exceptions cross async boundaries unnoticed.

### 1.2 Basic usage

```ts
async function fetchUser(userId: string): Promise<User> {
  // Example: throws on failure
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) {
    throw new Error(`Failed to load user ${userId}`);
  }
  return res.json() as Promise<User>;
}

export async function loadUser(userId: string): Promise<Result<User>> {
  return handleResult(fetchUser(userId));
}

export async function loadUserForComponent(
  userId: string,
): Promise<User | null> {
  const { data, error } = await handleResult(fetchUser(userId));

  if (error) {
    logger.error("loadUserForComponent", error);
    return null;
  }

  return data;
}
```

### 1.3 With side-effect callbacks

`handleResult` supports optional callbacks:

```ts
const { data, error } = await handleResult<User, Error>(
  fetchUser(userId),
  (user) => {
    logger.info("loadUser", `Loaded user ${user.id}`);
  },
  (err) => {
    const wrapped = wrapError(err, "UserService", "Failed to load user");
    logger.error("loadUser", wrapped);
  },
);
```

> **Guideline**: Keep callbacks for **logging / metrics / tracing**, and keep
> business branching in the caller (based on `error` / `data`).

### 1.4 Using `Result` in public APIs

For internal helpers or server actions, prefer explicit `Result` returns:

```ts
type SaveOutcome = Result<{ id: string }, ValidationError | Error>;

export async function saveSomething(
  input: unknown,
): Promise<SaveOutcome> {
  return handleResult(
    validateAndSave(input),
    (ok) => logger.info("saveSomething", `Saved ${ok.id}`),
    (err) => logger.error("saveSomething", err),
  );
}
```

---

## 2. Retry + Timeout (`withRetry`, `withTimeout`)

### 2.1 `withTimeout`

```ts
async function callSlowApi(): Promise<string> {
  const res = await fetch("/api/slow");
  if (!res.ok) throw new Error("Slow API failed");
  return res.text();
}

export async function loadWithTimeout(): Promise<Result<string, TimeoutError | Error>> {
  return handleResult(
    withTimeout(callSlowApi(), 5_000),
    (data) => logger.info("loadWithTimeout", `Loaded payload of length ${data.length}`),
    (err) => logger.error("loadWithTimeout", err),
  );
}
```

If the timeout is exceeded, a `TimeoutError` is thrown and then wrapped in a `Result`.

### 2.2 `withRetry`

```ts
async function fetchCritical(): Promise<Response> {
  return fetch("/api/critical");
}

export async function loadWithRetry(): Promise<Result<Response>> {
  const operation = (): Promise<Response> => fetchCritical();

  return handleResult(
    withRetry(operation, {
      retries: 3,
      delay: 1_000,
      backoff: true,
      shouldRetry: (err) => err instanceof NetworkError || err instanceof TimeoutError,
      onRetry: ({ error, attempt, retriesLeft, delay }) => {
        logger.warn(
          "loadWithRetry",
          `Retry attempt ${attempt}, retries left=${retriesLeft}, delay=${delay}ms`,
          error,
        );
      },
    }),
    (res) => logger.info("loadWithRetry", `Final attempt succeeded with status ${res.status}`),
    (err) => logger.error("loadWithRetry", err),
  );
}
```

> **Pattern**: `withTimeout` wraps a **single** attempt; `withRetry` wraps an
> **operation factory** for multiple attempts. Combine them when needed.

---

## 3. Custom errors (`BaseError`, `NetworkError`, `TimeoutError`, `ValidationError`)

### 3.1 When to use which

- **`ValidationError`**: Input or payload is invalid; treat as 4xx / user-fixable.
- **`NetworkError`**: Connectivity / transport problems; often retryable.
- **`TimeoutError`**: Operation took too long; usually retryable or escalated.
- **`BaseError`**: Base class if you need more specific domain errors later.

### 3.2 Example: validation

```ts
import { z } from "zod";
import { ValidationError } from "@/app/lib/foundation";

const PayloadSchema = z.object({
  email: z.string().email(),
});

export function validatePayload(data: unknown): { email: string } {
  const res = PayloadSchema.safeParse(data);
  if (!res.success) {
    const msg = res.error.errors.map(e => e.message).join(", ");
    throw new ValidationError(`Invalid payload: ${msg}`, res.error);
  }
  return res.data;
}
```

Then at the boundary:

```ts
export async function POST(request: Request): Promise<Response> {
  const { data, error } = await handleResult(
    (async () => validatePayload(await request.json()))(),
  );

  if (error) {
    if (error instanceof ValidationError) {
      logger.warn("ExampleRoute", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400 },
      );
    }

    const wrapped = wrapError(error, "ExampleRoute", "Unexpected error");
    logger.error("ExampleRoute", wrapped);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 },
    );
  }

  return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
}
```

---

## 4. Error chaining (`wrapError`)

Use `wrapError` when you want to **add context** but still preserve the original error and stack trace.

```ts
async function readFromDb(id: string): Promise<User> {
  try {
    return await db.users.find(id);
  } catch (err) {
    throw wrapError(err, "UserRepository", `Failed to read user ${id}`);
  }
}

export async function loadUserSafe(id: string): Promise<Result<User>> {
  return handleResult(
    readFromDb(id),
    (user) => logger.info("loadUserSafe", `Loaded ${user.id}`),
    (err) => logger.error("loadUserSafe", err),
  );
}
```

The wrapped error has:

- A message like `"[UserRepository] Failed to read user 123"`.
- A `cause` property with the original error.
- A composed stack trace that includes both levels.

---

## 5. Logger (`logger`)

### 5.1 Behavior

- **Server (Node)**:
  - Uses ANSI colors via `crayon` when `LOG_FORMAT !== "json"`.
  - Emits structured JSON when `process.env.LOG_FORMAT === "json"`.
- **Browser**:
  - Logs plain text to `console.*` with a `[traceId]` prefix.

All methods return a **string trace ID**:

```ts
const traceId = logger.info("SomeContext", "Something happened");
logger.error("SomeContext", `Error in trace ${traceId}`, error);
```

Available methods:

```ts
logger.log(context: string, ...args: unknown[]): string;
logger.info(context: string, ...args: unknown[]): string;
logger.warn(context: string, ...args: unknown[]): string;
logger.error(context: string, ...args: unknown[]): string;
logger.debug(context: string, ...args: unknown[]): string;
```

### 5.2 Server action example

```ts
"use server";

import { logger, handleResult } from "@/app/lib/foundation";

export async function doSomethingDangerous(
  input: string,
): Promise<Result<{ ok: true }>> {
  const traceId = logger.info("doSomethingDangerous", "Start", { input });

  const result = await handleResult(
    performWork(input),
    () => logger.info("doSomethingDangerous", `Success [${traceId}]`),
    (err) => logger.error("doSomethingDangerous", `Failure [${traceId}]`, err),
  );

  return result;
}
```

### 5.3 Client component example

```tsx
"use client";

import type React from "react";
import { useEffect } from "react";
import { logger } from "@/app/lib/foundation";

export function ExampleWidget(): React.JSX.Element {
  useEffect(() => {
    logger.info("ExampleWidget", "Mounted");
  }, []);

  return <div>Example</div>;
}
```

---

## 6. Interop with `app/utils/helper-functions/handle-results.ts`

To avoid mass refactors, the legacy helper:

- Re-exports the same `Success`, `Failure`, `Result` types from here.
- Wraps `handleResult` to support an `options` object:

```ts
handleResult(promise, {
  onSuccess?: (data) => void | Promise<void>;
  onError?: (error) => void | Promise<void>;
  onFinally?: () => void | Promise<void>;
});
```

**New code** should generally:

- Import directly from `@/app/lib/foundation` when possible.
- Only use the helper when you specifically want the `onFinally` semantics.

---

## 7. Patterns and anti-patterns

### 7.1 Recommended patterns

- Use `Result` and `AsyncResult` at module boundaries (API routes, server actions, service layers).
- Use `ValidationError` for user-facing validation failures and log as warnings.
- Use `NetworkError` / `TimeoutError` with `withRetry` and `withTimeout` for external I/O.
- Use `wrapError` when adding context; never lose the original exception.
- Log **context + error**, not just the error message.

### 7.2 Anti-patterns

- Throwing plain strings: `throw "oops"` ❌ → always throw `Error` or `BaseError` subclasses.
- Ignoring `Result.error`: always check and branch.
- Using `.then().catch()` on promises that are also passed to `handleResult`.
- Creating ad hoc loggers instead of the shared `logger`.

---

## 8. Quick checklist for AI agents

When adding or modifying code:

1. **Async boundaries** (actions, routes, services):
   - Prefer `handleResult` and `Result<T, E>` instead of bare throws across layers.
2. **Error types**:
   - Use `ValidationError` / `NetworkError` / `TimeoutError` where appropriate.
3. **Logging**:
   - Use `logger.info/warn/error/debug` with a clear context string (usually `"file-or-module-path"` style).
4. **Context**:
   - When rethrowing or bubbling up, prefer `wrapError` to add layer-specific context.
5. **Imports**:
   - Use `@/app/lib/foundation` as the single source for these utilities. Do not re-declare `Result` or custom errors elsewhere.

This guide should be treated as the **source of truth** for defensive programming practices in this project. Update it whenever you introduce new patterns or primitives in `app/lib/foundation`.


