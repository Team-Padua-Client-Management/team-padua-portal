/**
 * validation.ts
 *
 * Server-side validation utilities for auth forms.
 *
 * All validation enforced here is the source of truth —
 * client-side checks are purely a UX convenience layer.
 */

import { AUTH_CONSTANTS, type ValidationResult, type PasswordStrength, type PasswordStrengthLevel } from "./types";

// ─── Email Validation ────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function validateEmail(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw) {
    return { valid: false, error: "Email address is required." };
  }

  const email = raw.trim().toLowerCase();

  if (!email) {
    return { valid: false, error: "Email address is required." };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  return { valid: true, value: email };
}

// ─── Password Validation ─────────────────────────────────────────────────────

export interface PasswordCheckItem {
  label: string;
  valid: boolean;
}

export function getPasswordChecks(value: string): PasswordCheckItem[] {
  return [
    { label: "At least 8 characters", valid: value.length >= AUTH_CONSTANTS.PASSWORD_MIN_LENGTH },
    { label: "At most 128 characters", valid: value.length <= AUTH_CONSTANTS.PASSWORD_MAX_LENGTH },
    { label: "One uppercase letter", valid: /[A-Z]/.test(value) },
    { label: "One lowercase letter", valid: /[a-z]/.test(value) },
    { label: "One number", valid: /\d/.test(value) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function validatePassword(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw) {
    return { valid: false, error: "Password is required." };
  }

  const password = raw;

  if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters.` };
  }

  if (password.length > AUTH_CONSTANTS.PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password must be at most ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters.` };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter." };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter." };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least one number." };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one special character." };
  }

  return { valid: true, value: password };
}

// ─── Password Strength Scoring ───────────────────────────────────────────────

/**
 * Entropy-based password strength scoring.
 *
 * Scores based on character class diversity AND length bonus,
 * mapped to 5 tiers: Weak / Fair / Good / Strong / Excellent.
 *
 * This is a heuristic equivalent of zxcvbn without the dependency.
 */
export function getPasswordStrengthScore(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, level: "Weak", percent: 0 };
  }

  let score = 0;

  // Character class diversity (0-5 points)
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1.5;
  // Multiple special characters
  if ((password.match(/[^A-Za-z0-9]/g) || []).length >= 2) score += 0.5;

  // Length bonus (0-4 points)
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Penalty for repetitive patterns
  if (/(.)\1{2,}/.test(password)) score -= 1;
  // Penalty for sequential characters (abc, 123)
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 0.5;
  }

  // Clamp score
  score = Math.max(0, Math.min(10, score));

  // Map to levels
  let level: PasswordStrengthLevel;
  let percent: number;

  if (score <= 2) {
    level = "Weak";
    percent = 20;
  } else if (score <= 4) {
    level = "Fair";
    percent = 40;
  } else if (score <= 6) {
    level = "Good";
    percent = 60;
  } else if (score <= 8) {
    level = "Strong";
    percent = 80;
  } else {
    level = "Excellent";
    percent = 100;
  }

  return { score, level, percent };
}

// ─── Name Validation ─────────────────────────────────────────────────────────

export function validateName(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw) {
    return { valid: false, error: "Full name is required." };
  }

  const name = raw.trim();

  if (name.length < AUTH_CONSTANTS.NAME_MIN_LENGTH) {
    return { valid: false, error: `Name must be at least ${AUTH_CONSTANTS.NAME_MIN_LENGTH} characters.` };
  }

  if (name.length > AUTH_CONSTANTS.NAME_MAX_LENGTH) {
    return { valid: false, error: `Name must be at most ${AUTH_CONSTANTS.NAME_MAX_LENGTH} characters.` };
  }

  return { valid: true, value: name };
}

// ─── PH Mobile Number Validation ─────────────────────────────────────────────

/**
 * Validates Philippine mobile numbers.
 * Accepted formats:
 * - 09xxxxxxxxx (11 digits)
 * - +639xxxxxxxxx (with country code)
 * - 639xxxxxxxxx (without +)
 */
const PH_MOBILE_REGEX = /^(?:\+?63|0)9\d{9}$/;

export function validatePhoneNumber(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw) {
    return { valid: false, error: "Mobile number is required." };
  }

  const phone = raw.trim().replace(/[\s\-()]/g, "");

  if (!phone) {
    return { valid: false, error: "Mobile number is required." };
  }

  if (!PH_MOBILE_REGEX.test(phone)) {
    return { valid: false, error: "Please enter a valid PH mobile number (e.g. 09171234567)." };
  }

  return { valid: true, value: phone };
}
