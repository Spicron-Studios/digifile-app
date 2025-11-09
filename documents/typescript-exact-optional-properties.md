# TypeScript: exactOptionalPropertyTypes Best Practices

## Overview

This document outlines best practices for working with TypeScript's `exactOptionalPropertyTypes: true` compiler option, which is enabled in this project's `tsconfig.json`.

## What is `exactOptionalPropertyTypes`?

When `exactOptionalPropertyTypes: true` is enabled, TypeScript distinguishes between:

- **Optional properties** (`prop?: string`): The property can be **absent** or **present with a value**
- **Union with undefined** (`prop: string | undefined`): The property **must be present**, but can have `undefined` as a value

### Key Difference

```typescript
// With exactOptionalPropertyTypes: true

interface Example {
  optional?: string; // Can be absent OR present with string
  required: string | undefined; // Must be present, but can be undefined
}

const obj1: Example = {
  // optional is absent - OK ✅
  required: undefined, // required is present with undefined - OK ✅
};

const obj2: Example = {
  optional: undefined, // ERROR ❌ - cannot set optional to undefined
  required: undefined, // OK ✅
};
```

## Why Use This?

1. **Type Safety**: Prevents accidentally setting optional properties to `undefined`
2. **API Consistency**: Matches how JSON serialization works (properties are either present or absent)
3. **Database Compatibility**: Aligns with how most databases handle NULL vs missing columns
4. **Runtime Behavior**: Distinguishes between `obj.prop === undefined` (absent) vs `obj.prop === undefined` (present but undefined)

## Common Patterns

### ✅ Correct Patterns

#### 1. Clearing/Removing Optional Properties

**Use destructuring to omit properties:**

```typescript
// ✅ CORRECT: Omit property using destructuring
setValidationErrors(prev => {
  const { id, ...rest } = prev;
  return rest;
});

// Or use utility function
import { omitProperty } from '@/utils/helper-functions/state-updates';
setValidationErrors(prev => omitProperty(prev, 'id'));
```

**❌ WRONG:**

```typescript
// ❌ ERROR: Cannot set optional property to undefined
setValidationErrors(prev => ({ ...prev, id: undefined }));
```

#### 2. Conditionally Setting Optional Properties

**Use conditional spreading:**

```typescript
// ✅ CORRECT: Only include property when value exists
setValidationErrors(prev => {
  const { email, ...rest } = prev;
  return {
    ...rest,
    ...(emailValidation.valid ? {} : { email: emailValidation.error }),
  };
});

// Or use utility function
import { setPropertyIf } from '@/utils/helper-functions/state-updates';
setValidationErrors(prev =>
  setPropertyIf(prev, 'email', emailValidation.error, !emailValidation.valid)
);
```

**❌ WRONG:**

```typescript
// ❌ ERROR: Cannot set to undefined
setValidationErrors(prev => ({
  ...prev,
  email: emailValidation.valid ? undefined : emailValidation.error,
}));
```

#### 3. Conditional Property Inclusion in Objects

**Use conditional spreading:**

```typescript
// ✅ CORRECT: Conditional inclusion
setFile(prevFile => ({
  ...prevFile,
  patient: {
    ...prevFile.patient,
    ...(gender && { gender }), // Only include if truthy
  },
}));
```

**❌ WRONG:**

```typescript
// ❌ ERROR: May assign undefined
setFile(prevFile => ({
  ...prevFile,
  patient: {
    ...prevFile.patient,
    gender: parsed.gender, // Could be undefined
  },
}));
```

#### 4. Type Guards for Optional Values

**Extract and guard before use:**

```typescript
// ✅ CORRECT: Extract and guard
const dob = parsed.dob;
const gender = parsed.gender;
if (!dob || !gender) return; // Type guard
// Now TypeScript knows they're defined
setFile(prevFile => ({
  ...prevFile,
  patient: {
    ...prevFile.patient,
    dob: `${dob.year}/${dob.month}/${dob.day}`,
    ...(gender && { gender }),
  },
}));
```

**❌ WRONG:**

```typescript
// ❌ ERROR: Possibly undefined
setFile(prevFile => ({
  ...prevFile,
  patient: {
    ...prevFile.patient,
    dob: `${parsed.dob.year}/${parsed.dob.month}/${parsed.dob.day}`, // Error!
  },
}));
```

#### 5. Passing Optional Props to Components

**Use conditional spreading:**

```typescript
// ✅ CORRECT: Only include properties when they have values
<MedicalAidInfo
  errors={{
    ...(validationErrors.member_id && {
      member_id: validationErrors.member_id,
    }),
    ...(validationErrors.member_cell && {
      member_cell: validationErrors.member_cell,
    }),
  }}
/>
```

**❌ WRONG:**

```typescript
// ❌ ERROR: May pass undefined
<MedicalAidInfo
  errors={{
    member_id: validationErrors.member_id, // Could be undefined
    member_cell: validationErrors.member_cell, // Could be undefined
  }}
/>
```

## Utility Functions

We provide utility functions in `app/utils/helper-functions/state-updates.ts` to make these patterns easier:

### `omitProperty<T, K>(obj: T, key: K): Omit<T, K>`

Removes a single property from an object.

```typescript
import { omitProperty } from '@/utils/helper-functions/state-updates';

setValidationErrors(prev => omitProperty(prev, 'id'));
```

### `omitProperties<T, K>(obj: T, keys: K[]): Omit<T, K>`

Removes multiple properties from an object.

```typescript
import { omitProperties } from '@/utils/helper-functions/state-updates';

setValidationErrors(prev => omitProperties(prev, ['id', 'email', 'phone']));
```

### `setPropertyIf<T, K>(obj: T, key: K, value: T[K], condition: boolean): T`

Conditionally sets a property (includes if condition is true, omits if false).

```typescript
import { setPropertyIf } from '@/utils/helper-functions/state-updates';

const emailValidation = validateEmail(value);
setValidationErrors(prev =>
  setPropertyIf(prev, 'email', emailValidation.error, !emailValidation.valid)
);
```

## Real-World Examples from Codebase

### Example 1: Validation Error Management

**File**: `app/(main)/sites/file-data/[uid]/page.tsx`

```typescript
// Clearing validation error
setValidationErrors(prev => {
  const { id, ...rest } = prev;
  return rest;
});

// Setting validation error conditionally
const emailValidation = validateEmail(value);
setValidationErrors(prev => {
  const { email, ...rest } = prev;
  return {
    ...rest,
    ...(emailValidation.valid ? {} : { email: emailValidation.error }),
  };
});
```

### Example 2: Conditional Property Updates

**File**: `app/(main)/sites/file-data/[uid]/page.tsx`

```typescript
// Type guard before using optional values
const dob = parsed.dob;
const gender = parsed.gender;
if (!dob || !gender) return;

setFile(prevFile => ({
  ...prevFile,
  patient: {
    ...prevFile.patient,
    dob: `${dob.year}/${dob.month}/${dob.day}`,
    ...(gender && { gender }),
  },
}));
```

### Example 3: Component Props

**File**: `app/(main)/sites/file-data/[uid]/page.tsx`

```typescript
<MedicalAidInfo
  errors={{
    ...(validationErrors.member_id && {
      member_id: validationErrors.member_id,
    }),
    ...(validationErrors.member_cell && {
      member_cell: validationErrors.member_cell,
    }),
  }}
/>
```

## Migration Checklist

When updating code to work with `exactOptionalPropertyTypes: true`:

- [ ] Replace `{ ...obj, prop: undefined }` with destructuring to omit property
- [ ] Replace conditional assignments like `prop: condition ? value : undefined` with conditional spreading
- [ ] Add type guards before using optional values from function returns
- [ ] Update component prop passing to use conditional spreading
- [ ] Use utility functions from `state-updates.ts` for common patterns

## Anti-Patterns to Avoid

### ❌ Setting Properties to `undefined`

```typescript
// ❌ WRONG
setState(prev => ({ ...prev, field: undefined }));
```

### ❌ Using `delete` Operator

```typescript
// ❌ WRONG - breaks immutability and type safety
const updated = { ...prev };
delete updated.field;
setState(updated);
```

### ❌ Conditional Assignment Without Omitting

```typescript
// ❌ WRONG
setState(prev => ({
  ...prev,
  field: isValid ? undefined : error, // Cannot set to undefined
}));
```

### ❌ Direct Use of Possibly Undefined Values

```typescript
// ❌ WRONG
const result = someFunction();
setState(prev => ({
  ...prev,
  value: result.optionalValue, // May be undefined
}));
```

## Related Documentation

- [TypeScript Handbook: Optional Properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)
- [TypeScript Release Notes: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
- Project utility functions: `app/utils/helper-functions/state-updates.ts`

## Questions?

If you encounter issues with `exactOptionalPropertyTypes`, check:

1. Are you trying to set an optional property to `undefined`? → Use destructuring to omit instead
2. Are you using a value that might be `undefined`? → Add a type guard first
3. Are you passing optional props to components? → Use conditional spreading

For more examples, see the utility functions documentation in `state-updates.ts`.
