'use client';

// Keep utility functions small and focused for client-side validation

export type DateParts = { year: string; month: string; day: string };

export function sanitizeDigits(input: string, maxLen = 13): string {
  const digitsOnly = input.replace(/[^0-9]/g, '');
  return digitsOnly.slice(0, maxLen);
}

export function luhnCheck(id: string): boolean {
  // Standard Luhn algorithm over all digits
  let sum = 0;
  let shouldDouble = false;
  for (let i = id.length - 1; i >= 0; i--) {
    let digit = parseInt(id.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function resolveCentury(yy: number, mm: number, dd: number): number {
  // Choose century that yields a non-future date and plausible age
  const candidate2000 = 2000 + yy;
  const candidate1900 = 1900 + yy;
  const date2000 = new Date(candidate2000, mm - 1, dd);
  const today = new Date();

  // Prefer 2000s if not in the future
  if (date2000 <= today) {
    return candidate2000;
  }
  return candidate1900;
}

export function parseSouthAfricanId(id: string): {
  valid: boolean;
  dob?: DateParts;
  gender?: 'male' | 'female';
  reason?: string;
} {
  const cleaned = sanitizeDigits(id, 13);
  if (cleaned.length !== 13) {
    return { valid: false, reason: 'ID must be exactly 13 digits' };
  }
  // Extract YYMMDD
  const yy = parseInt(cleaned.slice(0, 2), 10);
  const mm = parseInt(cleaned.slice(2, 4), 10);
  const dd = parseInt(cleaned.slice(4, 6), 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) {
    return { valid: false, reason: 'Invalid date parts in ID' };
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { valid: false, reason: 'Date out of range' };
  }
  const fullYear = resolveCentury(yy, mm, dd);
  const date = new Date(fullYear, mm - 1, dd);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return { valid: false, reason: 'Invalid calendar date' };
  }

  // Gender: digits 7–10 (index 6–9) => >=5000 male, else female
  const genderBlock = parseInt(cleaned.slice(6, 10), 10);
  const gender: 'male' | 'female' = genderBlock >= 5000 ? 'male' : 'female';

  // Validate Luhn checksum (mandatory for SA ID)
  if (!luhnCheck(cleaned)) {
    return { valid: false, reason: 'Failed Luhn checksum' };
  }

  return {
    valid: true,
    dob: {
      year: String(fullYear),
      month: String(mm).padStart(2, '0'),
      day: String(dd).padStart(2, '0'),
    },
    gender,
  };
}

export function normalizePhoneInput(input: string): string {
  // Allow digits, space, +, -, (, ) only
  return input.replace(/[^0-9+\-()\s]/g, '');
}

/**
 * Validates a phone number according to international standards
 * Accepts formats like: +27 82 123 4567, 0821234567, (082) 123-4567, etc.
 * Minimum 7 digits, maximum 15 digits (E.164 standard allows up to 15 digits)
 * @param input - The phone number string to validate
 * @returns Object with valid flag and optional error message
 */
export function validatePhoneNumber(input: string): {
  valid: boolean;
  error?: string;
} {
  // Allow empty (optional field)
  if (!input || input.trim().length === 0) {
    return { valid: true };
  }

  // Normalize: remove all non-digit characters except + at the start
  const normalized = normalizePhoneInput(input);

  // Extract digits only for length check
  const digitsOnly = normalized.replace(/[^0-9]/g, '');

  // Check if contains any letters (shouldn't happen after normalizePhoneInput, but double-check)
  if (/[a-zA-Z]/.test(input)) {
    return { valid: false, error: 'Phone number cannot contain letters' };
  }

  // Check minimum length (at least 7 digits for a valid phone number)
  if (digitsOnly.length < 7) {
    return {
      valid: false,
      error: 'Phone number must contain at least 7 digits',
    };
  }

  // Check maximum length (E.164 standard: max 15 digits)
  if (digitsOnly.length > 15) {
    return {
      valid: false,
      error: 'Phone number cannot exceed 15 digits',
    };
  }

  // Basic format validation: should start with + (optional) followed by digits
  // Allow formats: +1234567890, 1234567890, (123) 456-7890, etc.
  const phonePattern = /^\+?[\d\s\-()]+$/;
  if (!phonePattern.test(normalized)) {
    return {
      valid: false,
      error: 'Invalid phone number format',
    };
  }

  return { valid: true };
}

export function isValidEmail(input: string): boolean {
  // Allow empty (optional field)
  if (!input || input.trim().length === 0) {
    return true;
  }
  // Enhanced email validation pattern
  // Matches: user@domain.com, user.name@domain.co.uk, etc.
  const emailPattern =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailPattern.test(input);
}

/**
 * Validates email and returns error message if invalid
 * @param input - The email string to validate
 * @returns Object with valid flag and optional error message
 */
export function validateEmail(input: string): {
  valid: boolean;
  error?: string;
} {
  // Allow empty (optional field)
  if (!input || input.trim().length === 0) {
    return { valid: true };
  }

  if (!isValidEmail(input)) {
    return { valid: false, error: 'Invalid email address format' };
  }

  return { valid: true };
}

/**
 * Validates date of birth
 * @param dateString - Date string in YYYY-MM-DD format (for date inputs) or YYYY/MM/DD format
 * @returns Object with valid flag and optional error message
 */
export function validateDateOfBirth(dateString: string): {
  valid: boolean;
  error?: string;
} {
  // Allow empty (optional field)
  if (!dateString || dateString.trim().length === 0) {
    return { valid: true };
  }

  // Handle both YYYY-MM-DD and YYYY/MM/DD formats
  const dateParts = dateString.split(/[-\/]/);
  if (dateParts.length !== 3) {
    return { valid: false, error: 'Invalid date format' };
  }

  const year = parseInt(dateParts[0] || '', 10);
  const month = parseInt(dateParts[1] || '', 10);
  const day = parseInt(dateParts[2] || '', 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { valid: false, error: 'Date must contain valid numbers' };
  }

  // Check reasonable year range (1900 to current year)
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return {
      valid: false,
      error: `Year must be between 1900 and ${currentYear}`,
    };
  }

  // Check month range
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }

  // Check day range
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Day must be between 1 and 31' };
  }

  // Check if date is valid (e.g., Feb 30 doesn't exist)
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, error: 'Invalid calendar date' };
  }

  // Check if date is in the future
  if (date > new Date()) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  return { valid: true };
}
