/**
 * auth.ts
 *
 * Server Actions for authentication.
 *
 * Handles: SignIn, SignUp, SignOut, ForgotPassword, ResetPassword.
 * All validation and security checks are enforced server-side.
 */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createNotification } from "@/app/lib/notifications";
import { validateEmail, validatePassword, validateName, validatePhoneNumber } from "@/app/lib/auth/validation";
import {
  checkAccountStatus,
  checkLoginLockout,
  recordFailedLogin,
  resetFailedLoginCount,
  logSecurityEvent,
  checkPasswordHistory,
  addPasswordToHistory,
  checkResetRateLimit,
  timingSafeDelay,
} from "@/app/lib/auth/security";
import { AUTH_CONSTANTS, type AuthActionResult } from "@/app/lib/auth/types";

// ─── Sign In ─────────────────────────────────────────────────────────────────

export const SignIn = async (formData: FormData): Promise<AuthActionResult> => {
  const supabase = await createClient();

  // 1. Validate inputs
  const emailResult = validateEmail(formData.get("email"));
  if (!emailResult.valid) {
    return { error: emailResult.error };
  }

  const rawPassword = formData.get("password");
  if (typeof rawPassword !== "string" || !rawPassword.trim()) {
    return { error: "Password is required." };
  }

  const email = emailResult.value!;
  const password = rawPassword;

  // 2. Look up user by email to get userId for pre-auth checks
  //    We use admin.listUsers to find the user without authenticating
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const authUser = listData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!authUser) {
    // Generic message — don't reveal that the email doesn't exist
    return { error: "Invalid email or password." };
  }

  // 3. Check account status BEFORE attempting password auth
  const statusResult = await checkAccountStatus(authUser.id);
  if (!statusResult.allowed) {
    // Log the attempt
    await logSecurityEvent({
      userId: authUser.id,
      eventType: "login_failed",
      metadata: { reason: `account_status_${statusResult.status}`, email },
    });
    return { error: statusResult.message };
  }

  // 4. Check lockout status
  const lockout = await checkLoginLockout(authUser.id);
  if (lockout.locked) {
    const minutes = Math.ceil(lockout.secondsRemaining / 60);
    return {
      error: `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      lockoutSeconds: lockout.secondsRemaining,
    };
  }

  // 5. Check email verification
  if (!authUser.email_confirmed_at) {
    return {
      error: "Please verify your email address before signing in. Check your inbox for the confirmation link.",
    };
  }

  // 6. Attempt password authentication
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Record failed attempt
    const failResult = await recordFailedLogin(authUser.id);

    await logSecurityEvent({
      userId: authUser.id,
      eventType: "login_failed",
      metadata: {
        email,
        failedCount: failResult.count,
        reason: "invalid_credentials",
      },
    });

    if (failResult.lockedOut) {
      const minutes = AUTH_CONSTANTS.LOCKOUT_DURATION_MINUTES;
      return {
        error: `Too many failed attempts. Your account has been locked for ${minutes} minutes.`,
        lockoutSeconds: failResult.lockoutSeconds,
      };
    }

    const remaining = AUTH_CONSTANTS.MAX_FAILED_ATTEMPTS - failResult.count;
    if (remaining <= 2 && remaining > 0) {
      return {
        error: `Invalid email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before lockout.`,
      };
    }

    return { error: "Invalid email or password." };
  }

  // 7. Successful login — reset counters and log
  await resetFailedLoginCount(authUser.id);
  await logSecurityEvent({
    userId: authUser.id,
    eventType: "login_success",
    metadata: { email },
  });

  // 8. Determine redirect based on role
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = profile?.role === "Admin";
  redirect(isAdmin ? "/admin/dashboard" : "/dashboard");
};

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export const SignUp = async (formData: FormData): Promise<AuthActionResult> => {
  // 1. Validate all fields server-side
  const nameResult = validateName(formData.get("name"));
  if (!nameResult.valid) return { error: nameResult.error };

  const emailResult = validateEmail(formData.get("email"));
  if (!emailResult.valid) return { error: emailResult.error };

  const phoneResult = validatePhoneNumber(formData.get("phone"));
  if (!phoneResult.valid) return { error: phoneResult.error };

  const passwordResult = validatePassword(formData.get("password"));
  if (!passwordResult.valid) return { error: passwordResult.error };

  const confirmPassword = formData.get("confirmPassword") as string;
  if (passwordResult.value !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  // Terms acceptance
  const termsAccepted = formData.get("termsAccepted") === "true";
  if (!termsAccepted) {
    return { error: "You must accept the Terms and Conditions to register." };
  }

  const name = nameResult.value!;
  const email = emailResult.value!;
  const phone = phoneResult.value!;
  const password = passwordResult.value!;
  const role = (formData.get("role") as string) || "Financial Advisor";

  // 2. Check for duplicate email
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const existingUser = listData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  // 3. Create user via Supabase Auth
  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const userId = signUpData.user?.id;

  // 4. Set account_status to pending, store terms acceptance
  if (userId) {
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: name,
        phone,
        role: "Member", // Default role until admin assigns
        status: "Pending",
        terms_accepted_at: new Date().toISOString(),
        terms_version: AUTH_CONSTANTS.TERMS_VERSION,
      },
      { onConflict: "id" }
    );

    // Store initial password in history
    await addPasswordToHistory(userId, password);

    // Log registration event
    await logSecurityEvent({
      userId,
      eventType: "registration",
      metadata: { email, requestedRole: role },
    });
  }

  // 5. Notify admins
  await supabaseAdmin.from("notifications").insert({
    title: "New Member Registration",
    description: `A new member (${name || email}) has signed up and is pending approval.`,
    type: "user",
    is_read: false,
  });

  return { success: true, email };
};

// ─── Sign Out ────────────────────────────────────────────────────────────────

export const SignOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
};

// ─── Forgot Password ─────────────────────────────────────────────────────────

export const ForgotPasswordAction = async (
  formData: FormData
): Promise<AuthActionResult> => {
  const emailResult = validateEmail(formData.get("email"));

  // Always add timing-safe delay to prevent enumeration
  const delayPromise = timingSafeDelay();

  // Safe response — always the same regardless of email existence
  const safeResponse: AuthActionResult = {
    success: true,
    error: undefined,
  };

  if (!emailResult.valid) {
    await delayPromise;
    return { error: emailResult.error };
  }

  const email = emailResult.value!;

  // Check rate limit
  const rateLimit = await checkResetRateLimit(email);

  if (rateLimit.allowed) {
    // Only send if rate limit not exceeded
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=password_reset`,
    });
  }

  // Log the attempt regardless (for rate limiting tracking)
  await logSecurityEvent({
    eventType: "password_reset_request",
    metadata: { email, rateLimited: !rateLimit.allowed },
  });

  await delayPromise;
  return safeResponse;
};

// ─── Reset Password ──────────────────────────────────────────────────────────

export const ResetPasswordAction = async (
  formData: FormData
): Promise<AuthActionResult> => {
  const supabase = await createClient();

  // 1. Validate we have an active session (reset token creates one via callback)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Invalid or expired reset link. Please request a new password reset.",
    };
  }

  // 2. Validate password
  const passwordResult = validatePassword(formData.get("password"));
  if (!passwordResult.valid) return { error: passwordResult.error };

  const confirmPassword = formData.get("confirmPassword") as string;
  if (passwordResult.value !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const password = passwordResult.value!;

  // 3. Check password history
  const historyCheck = await checkPasswordHistory(user.id, password);
  if (historyCheck.reused) {
    return {
      error: "This password has been used recently. Please choose a different password.",
    };
  }

  // 4. Update password
  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return { error: updateError.message };
  }

  // 5. Add to password history
  await addPasswordToHistory(user.id, password);

  // 6. Invalidate all other sessions (force re-login everywhere)
  try {
    await supabaseAdmin.auth.admin.signOut(user.id, "others");
  } catch (err) {
    console.error("Failed to invalidate other sessions:", err);
  }

  // 7. Log security event
  await logSecurityEvent({
    userId: user.id,
    eventType: "password_reset_complete",
    metadata: { email: user.email },
  });

  return { success: true };
};
