/**
 * state-updates.ts — Utilities for working with optional properties in state updates
 *
 * What is this?
 * - Helper functions for safely updating state objects when using TypeScript's
 *   `exactOptionalPropertyTypes: true` compiler option.
 * - Provides type-safe ways to omit properties and conditionally set properties
 *   without violating strict optional property type rules.
 *
 * Why use this?
 * - With `exactOptionalPropertyTypes: true`, you cannot set a property to `undefined`.
 *   Properties must either be present with a value or completely omitted.
 * - These utilities make it easy to follow this pattern without verbose destructuring.
 * - Ensures type safety and consistency across the codebase.
 *
 * Core concepts
 * - Optional properties (`prop?: string`) can be absent or present with a value.
 * - They CANNOT be present with `undefined` when `exactOptionalPropertyTypes: true`.
 * - To "clear" a property, you must omit it entirely, not set it to `undefined`.
 *
 * API Reference
 *
 * omitProperty<T, K extends keyof T>(obj: T, key: K): Omit<T, K>
 *   - Removes a single property from an object
 *   - Returns a new object without the specified property
 *
 * omitProperties<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>
 *   - Removes multiple properties from an object
 *   - Returns a new object without the specified properties
 *
 * setPropertyIf<T, K extends keyof T>(
 *   obj: T,
 *   key: K,
 *   value: T[K],
 *   condition: boolean
 * ): T
 *   - Conditionally sets a property (includes it if condition is true, omits if false)
 *   - Useful for validation errors: set error if invalid, omit if valid
 *
 * updateStateWithOptional<T>(
 *   updater: (prev: T) => Partial<T>
 * ): (prev: T) => T
 *   - Helper for React setState functions
 *   - Automatically filters out undefined values from partial updates
 *
 * How to use (copy-paste friendly)
 *
 * Clearing a validation error
 * ```ts
 * import { omitProperty } from "@/utils/helper-functions/state-updates";
 *
 * // Before (WRONG with exactOptionalPropertyTypes):
 * setValidationErrors(prev => ({ ...prev, id: undefined }));
 *
 * // After (CORRECT):
 * setValidationErrors(prev => omitProperty(prev, 'id'));
 * ```
 *
 * Conditionally setting a validation error
 * ```ts
 * import { setPropertyIf } from "@/utils/helper-functions/state-updates";
 *
 * const emailValidation = validateEmail(value);
 * setValidationErrors(prev =>
 *   setPropertyIf(prev, 'email', emailValidation.error, !emailValidation.valid)
 * );
 * ```
 *
 * Clearing multiple errors at once
 * ```ts
 * import { omitProperties } from "@/utils/helper-functions/state-updates";
 *
 * setValidationErrors(prev => omitProperties(prev, ['id', 'email', 'phone']));
 * ```
 *
 * Conditional property inclusion in object updates
 * ```ts
 * import { setPropertyIf } from "@/utils/helper-functions/state-updates";
 *
 * setFile(prevFile => ({
 *   ...prevFile,
 *   patient: {
 *     ...prevFile.patient,
 *     ...(gender && { gender }), // Manual conditional spreading
 *     // OR use utility:
 *     ...setPropertyIf({}, 'gender', gender, !!gender),
 *   },
 * }));
 * ```
 *
 * Common patterns
 *
 * Pattern 1: Clear single error
 * ```ts
 * setValidationErrors(prev => omitProperty(prev, 'fieldName'));
 * ```
 *
 * Pattern 2: Set error conditionally
 * ```ts
 * const validation = validateField(value);
 * setValidationErrors(prev =>
 *   setPropertyIf(prev, 'fieldName', validation.error, !validation.valid)
 * );
 * ```
 *
 * Pattern 3: Clear error on valid input
 * ```ts
 * if (isValid) {
 *   setValidationErrors(prev => omitProperty(prev, 'fieldName'));
 * } else {
 *   setValidationErrors(prev => ({
 *     ...prev,
 *     fieldName: 'Error message',
 *   }));
 * }
 * ```
 *
 * Pattern 4: Multiple conditional updates
 * ```ts
 * setValidationErrors(prev => {
 *   let updated = prev;
 *   updated = setPropertyIf(updated, 'email', emailError, hasEmailError);
 *   updated = setPropertyIf(updated, 'phone', phoneError, hasPhoneError);
 *   return updated;
 * });
 * ```
 *
 * Anti-patterns to avoid
 * - Setting properties to `undefined`: `{ ...prev, field: undefined }` ❌
 * - Using `delete` operator: `delete prev.field` ❌ (breaks immutability)
 * - Conditional assignment without omitting: `field: condition ? value : undefined` ❌
 *
 * Migration guide
 *
 * Before (without exactOptionalPropertyTypes):
 * ```ts
 * setState(prev => ({ ...prev, field: undefined }));
 * setState(prev => ({ ...prev, field: isValid ? undefined : error }));
 * ```
 *
 * After (with exactOptionalPropertyTypes):
 * ```ts
 * setState(prev => omitProperty(prev, 'field'));
 * setState(prev => setPropertyIf(prev, 'field', error, !isValid));
 * ```
 */

/**
 * Removes a single property from an object.
 * Returns a new object without the specified property.
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3 };
 * const withoutB = omitProperty(obj, 'b');
 * // Result: { a: 1, c: 3 }
 * ```
 */
export function omitProperty<
	T extends Record<string, unknown>,
	K extends keyof T,
>(obj: T, key: K): Omit<T, K> {
	const { [key]: _, ...rest } = obj;
	return rest;
}

/**
 * Removes multiple properties from an object.
 * Returns a new object without the specified properties.
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3, d: 4 };
 * const withoutBC = omitProperties(obj, ['b', 'c']);
 * // Result: { a: 1, d: 4 }
 * ```
 */
export function omitProperties<
	T extends Record<string, unknown>,
	K extends keyof T,
>(obj: T, keys: K[]): Omit<T, K> {
	const result = { ...obj };
	for (const key of keys) {
		delete result[key];
	}
	return result as Omit<T, K>;
}

/**
 * Conditionally sets a property on an object.
 * If condition is true, the property is set to the value.
 * If condition is false, the property is omitted.
 *
 * @example
 * ```ts
 * const obj = { a: 1 };
 * const withB = setPropertyIf(obj, 'b', 2, true);
 * // Result: { a: 1, b: 2 }
 *
 * const withoutB = setPropertyIf(obj, 'b', 2, false);
 * // Result: { a: 1 }
 * ```
 */
export function setPropertyIf<
	T extends Record<string, unknown>,
	K extends keyof T,
>(obj: T, key: K, value: T[K], condition: boolean): T {
	if (condition) {
		return { ...obj, [key]: value };
	}
	return omitProperty(obj, key) as T;
}

/**
 * Helper for React setState that filters out undefined values from partial updates.
 * Useful when you have a function that returns Partial<T> but need to ensure
 * no undefined values are included.
 *
 * @example
 * ```ts
 * const updater = updateStateWithOptional<MyState>((prev) => ({
 *   field1: someCondition ? 'value' : undefined, // undefined will be filtered out
 *   field2: 'always present',
 * }));
 *
 * setState(updater);
 * ```
 */
export function updateStateWithOptional<T extends Record<string, unknown>>(
	updater: (prev: T) => Partial<T>,
): (prev: T) => T {
	return (prev: T): T => {
		const update = updater(prev);
		const filtered: Partial<T> = {};

		for (const key in update) {
			if (update[key] !== undefined) {
				filtered[key] = update[key];
			}
		}

		return { ...prev, ...filtered };
	};
}
