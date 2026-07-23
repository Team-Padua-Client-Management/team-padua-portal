/**
 * types.ts
 *
 * Shared TypeScript types for the auth system.
 *
 * Used across server actions, security utilities, and client components.
 */

// ─── Account Status ──────────────────────────────────────────────────────────

export type AccountStatus = "pending" | "active" | "suspended" | "disabled";

export const ACCOUNT_STATUS_MESSAGES: Record<AccountStatus, string> = {
  pending: "Your account is awaiting administrator approval. Please check back later.",
  active: "", // no block message
  suspended: "Your account has been suspended. Please contact your administrator.",
  disabled: "This account is no longer available.",
};

// ─── Security Event Types ────────────────────────────────────────────────────

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "lockout_triggered"
  | "password_reset_request"
  | "password_reset_complete"
  | "account_status_change"
  | "registration"
  | "email_verified"
  | "oauth_login";

// ─── Auth Action Results ─────────────────────────────────────────────────────

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  email?: string;
  /** Lockout remaining seconds for client-side countdown display */
  lockoutSeconds?: number;
};

// ─── Password Strength ──────────────────────────────────────────────────────

export type PasswordStrengthLevel =
  | "Weak"
  | "Fair"
  | "Good"
  | "Strong"
  | "Excellent";

export type PasswordStrength = {
  score: number;
  level: PasswordStrengthLevel;
  percent: number;
};

// ─── Validation Results ──────────────────────────────────────────────────────

export type ValidationResult = {
  valid: boolean;
  error?: string;
  /** Cleaned/trimmed value */
  value?: string;
};

// ─── Security Constants ──────────────────────────────────────────────────────

export const AUTH_CONSTANTS = {
  /** Max failed login attempts before lockout */
  MAX_FAILED_ATTEMPTS: 5,
  /** Lockout duration in minutes */
  LOCKOUT_DURATION_MINUTES: 15,
  /** Forgot password cooldown in seconds */
  FORGOT_PASSWORD_COOLDOWN_SECONDS: 60,
  /** Max password reset requests per email per hour */
  MAX_RESET_REQUESTS_PER_HOUR: 3,
  /** Number of previous passwords to check against */
  PASSWORD_HISTORY_DEPTH: 5,
  /** Password min length */
  PASSWORD_MIN_LENGTH: 8,
  /** Password max length */
  PASSWORD_MAX_LENGTH: 128,
  /** Name min length */
  NAME_MIN_LENGTH: 3,
  /** Name max length */
  NAME_MAX_LENGTH: 100,
  /** Current terms version */
  TERMS_VERSION: "1.0",
  /** Artificial delay (ms) for forgot password to prevent timing attacks */
  TIMING_SAFE_DELAY_MS: 500,
} as const;
