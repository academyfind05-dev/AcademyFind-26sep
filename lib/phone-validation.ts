/**
 * Centralized Phone Validation Utility
 * Enforces strict 10-digit Indian mobile number format and filters out common spam/dummy sequences.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanedPhone?: string;
  error?: string;
}

// Common dummy/test sequences and repetitive numbers frequently submitted by spammers and bots
const BLOCKED_DUMMY_NUMBERS = new Set([
  "1234567890",
  "9876543210",
  "0123456789",
  "9898989898",
  "9123456789",
  "9000000000",
  "8000000000",
  "7000000000",
  "6000000000",
  "9999999999",
  "8888888888",
  "7777777777",
  "6666666666",
  "0000000000",
  "1111111111",
  "2222222222",
  "3333333333",
  "4444444444",
  "5555555555",
]);

/**
 * Validates whether the given string is a legitimate 10-digit Indian mobile number.
 * Accepts numbers with or without +91, 91, or leading 0.
 */
export function validateIndianPhoneNumber(rawPhone: string | null | undefined): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { isValid: false, error: "Phone number is required." };
  }

  // 1. Strip all non-numeric characters (spaces, dashes, parentheses, etc.)
  let cleaned = rawPhone.replace(/\D/g, "");

  // 2. Normalize country code prefixes:
  // If 12 digits starting with '91', strip '91'
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }
  // If 11 digits starting with '0', strip leading '0'
  else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // 3. Check exact length
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: "Please enter a valid 10-digit mobile number.",
    };
  }

  // 4. Strict Indian mobile prefix check (must start with 6, 7, 8, or 9)
  const strictIndianRegex = /^[6-9]\d{9}$/;
  if (!strictIndianRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "Invalid mobile number. Mobile numbers must start with 6, 7, 8, or 9.",
    };
  }

  // Allow official Firebase test number in development
  if (process.env.NODE_ENV === "development" && cleaned === "9999999999") {
    return {
      isValid: true,
      cleanedPhone: cleaned,
    };
  }

  // 5. Check for all identical digits (e.g., 9999999999, 8888888888)
  if (/^(\d)\1{9}$/.test(cleaned)) {
    return {
      isValid: false,
      error: "Please enter a genuine mobile number (repeated digits are not accepted).",
    };
  }

  // 6. Check for more than 6 consecutive repeating digits (e.g., 9879999999)
  if (/(\d)\1{6,}/.test(cleaned)) {
    return {
      isValid: false,
      error: "Invalid number pattern detected.",
    };
  }

  // 7. Check against known blocked test/dummy numbers
  if (BLOCKED_DUMMY_NUMBERS.has(cleaned)) {
    return {
      isValid: false,
      error: "Please enter your genuine personal contact number.",
    };
  }

  return {
    isValid: true,
    cleanedPhone: cleaned,
  };
}

/**
 * Client-friendly fast regex tester
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
