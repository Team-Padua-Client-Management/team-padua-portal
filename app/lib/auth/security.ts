/**
 * security.ts
 *
 * Server-side security utilities for authentication.
 *
 * Handles: account status checks, login lockout, failed login tracking,
 * security event logging, password history, and rate limiting.
 *
 * All functions use supabaseAdmin (service role) to bypass RLS.
 */

import { supabaseAdmin } from "@/app/lib/supabase/admin";
import {
  AUTH_CONSTANTS,
  ACCOUNT_STATUS_MESSAGES,
  type AccountStatus,
  type SecurityEventType,
} from "./types";

// ─── Account Status Check ────────────────────────────────────────────────────

export type AccountStatusResult = {
  allowed: boolean;
  status: AccountStatus;
  message: string;
};

/**
 * Checks if a user's account status allows login.
 * Returns { allowed: false, message } for blocked statuses.
 */
export async function checkAccountStatus(
  userId: string
): Promise<AccountStatusResult> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    // If no profile exists yet, treat as pending
    return {
      allowed: false,
      status: "pending",
      message: ACCOUNT_STATUS_MESSAGES.pending,
    };
  }

  const status = (profile.status?.toLowerCase() as AccountStatus) || "pending";

  if (status !== "active") {
    return {
      allowed: false,
      status,
      message: ACCOUNT_STATUS_MESSAGES[status] || ACCOUNT_STATUS_MESSAGES.pending,
    };
  }

  return { allowed: true, status: "active", message: "" };
}

// ─── Login Lockout ───────────────────────────────────────────────────────────

export type LockoutResult = {
  locked: boolean;
  secondsRemaining: number;
};

/**
 * Checks if a user's account is currently locked due to too many failed attempts.
 */
export async function checkLoginLockout(
  userId: string
): Promise<LockoutResult> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("failed_login_count, locked_until")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { locked: false, secondsRemaining: 0 };
  }

  const { failed_login_count, locked_until } = profile;

  if (
    locked_until &&
    failed_login_count >= AUTH_CONSTANTS.MAX_FAILED_ATTEMPTS
  ) {
    const lockedUntilDate = new Date(locked_until);
    const now = new Date();

    if (lockedUntilDate > now) {
      const secondsRemaining = Math.ceil(
        (lockedUntilDate.getTime() - now.getTime()) / 1000
      );
      return { locked: true, secondsRemaining };
    }

    // Lock has expired — reset
    await supabaseAdmin
      .from("profiles")
      .update({
        failed_login_count: 0,
        locked_until: null,
      })
      .eq("id", userId);
  }

  return { locked: false, secondsRemaining: 0 };
}

// ─── Failed Login Tracking ───────────────────────────────────────────────────

/**
 * Increments the failed login counter.
 * If threshold reached, sets locked_until timestamp.
 * Returns the updated count and whether lockout was triggered.
 */
export async function recordFailedLogin(
  userId: string
): Promise<{ count: number; lockedOut: boolean; lockoutSeconds: number }> {
  // Get current count
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("failed_login_count")
    .eq("id", userId)
    .single();

  const currentCount = profile?.failed_login_count ?? 0;
  const newCount = currentCount + 1;

  const updatePayload: Record<string, unknown> = {
    failed_login_count: newCount,
  };

  let lockedOut = false;
  let lockoutSeconds = 0;

  if (newCount >= AUTH_CONSTANTS.MAX_FAILED_ATTEMPTS) {
    const lockUntil = new Date(
      Date.now() + AUTH_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000
    );
    updatePayload.locked_until = lockUntil.toISOString();
    lockedOut = true;
    lockoutSeconds = AUTH_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60;

    // Log lockout event
    await logSecurityEvent({
      userId,
      eventType: "lockout_triggered",
      metadata: { failedAttempts: newCount },
    });
  }

  await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  return { count: newCount, lockedOut, lockoutSeconds };
}

/**
 * Resets failed login counter and clears lockout on successful login.
 */
export async function resetFailedLoginCount(userId: string): Promise<void> {
  await supabaseAdmin
    .from("profiles")
    .update({
      failed_login_count: 0,
      locked_until: null,
    })
    .eq("id", userId);
}

// ─── Security Event Logging ──────────────────────────────────────────────────

interface LogSecurityEventParams {
  userId?: string;
  eventType: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs a security event to the auth_security_events table.
 * Silently fails (logs to console) — never blocks auth flow.
 */
export async function logSecurityEvent(
  params: LogSecurityEventParams
): Promise<void> {
  try {
    await supabaseAdmin.from("auth_security_events").insert({
      user_id: params.userId || null,
      event_type: params.eventType,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error("Failed to log security event:", err);
  }
}

// ─── Password History ────────────────────────────────────────────────────────

/**
 * Checks if a password hash matches any of the user's recent passwords.
 *
 * Note: Since we can't access Supabase's internal bcrypt hashes directly,
 * we store our own bcrypt hashes in the password_history table.
 * The comparison is done by re-hashing with the stored salts.
 *
 * For practical purposes, we use a simple approach:
 * We store a SHA-256 hash of the password (not bcrypt, since we can't
 * do bcrypt in Edge/Serverless without native modules).
 * This is acceptable for history-checking purposes only (not for storage of credentials).
 */
export async function checkPasswordHistory(
  userId: string,
  newPassword: string
): Promise<{ reused: boolean }> {
  const newHash = await hashForHistory(newPassword);

  const { data: history } = await supabaseAdmin
    .from("password_history")
    .select("password_hash")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(AUTH_CONSTANTS.PASSWORD_HISTORY_DEPTH);

  if (!history || history.length === 0) {
    return { reused: false };
  }

  const reused = history.some((entry) => entry.password_hash === newHash);
  return { reused };
}

/**
 * Adds a password to the user's history after a successful password change.
 */
export async function addPasswordToHistory(
  userId: string,
  password: string
): Promise<void> {
  const hash = await hashForHistory(password);

  await supabaseAdmin.from("password_history").insert({
    user_id: userId,
    password_hash: hash,
  });
}

/**
 * Creates a SHA-256 hash for password history comparison.
 * Uses Web Crypto API (available in Edge/Serverless).
 */
async function hashForHistory(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Forgot Password Rate Limiting ──────────────────────────────────────────

/**
 * Checks if the email has exceeded the max password reset requests per hour.
 * Returns { allowed: false } if rate limited.
 */
export async function checkResetRateLimit(
  email: string
): Promise<{ allowed: boolean }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from("auth_security_events")
    .select("id")
    .eq("event_type", "password_reset_request")
    .gte("created_at", oneHourAgo)
    .eq("metadata->>email", email);

  if (error) {
    // If we can't check, allow the request (fail open for UX)
    console.error("Rate limit check failed:", error);
    return { allowed: true };
  }

  return {
    allowed: (events?.length ?? 0) < AUTH_CONSTANTS.MAX_RESET_REQUESTS_PER_HOUR,
  };
}

// ─── Lookup user by email ────────────────────────────────────────────────────

/**
 * Finds a user by email using the admin API.
 * Returns null if not found (does not leak existence to callers).
 */
export async function findUserByEmail(
  email: string
): Promise<{ id: string; email_confirmed_at: string | null } | null> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (error || !data?.users) return null;

  // listUsers doesn't support email filter directly in all versions,
  // so we use a broader approach: query by email via the admin API
  const { data: userData } = await supabaseAdmin
    .rpc("get_user_by_email_lookup", { lookup_email: email })
    .single();

  // Fallback: iterate through users (admin.listUsers doesn't filter by email well)
  // In practice, use the auth.users table directly with service role
  if (!userData) {
    const { data: authUser } = await supabaseAdmin
      .from("auth.users" as string)
      .select("id, email_confirmed_at")
      .eq("email", email)
      .single();

    // If that doesn't work (auth.users not directly queryable via PostgREST),
    // use the admin API list approach
    if (!authUser) {
      // Final fallback: iterate
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const found = allUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (!found) return null;
      return {
        id: found.id,
        email_confirmed_at: found.email_confirmed_at ?? null,
      };
    }

    return authUser as { id: string; email_confirmed_at: string | null };
  }

  return userData as { id: string; email_confirmed_at: string | null };
}

// ─── Timing-safe delay ───────────────────────────────────────────────────────

/**
 * Adds an artificial delay to prevent timing-based account enumeration.
 */
export function timingSafeDelay(): Promise<void> {
  // Add random jitter (400-600ms) to prevent timing analysis
  const delay =
    AUTH_CONSTANTS.TIMING_SAFE_DELAY_MS +
    Math.floor(Math.random() * 200) - 100;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
