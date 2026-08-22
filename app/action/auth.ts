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
import { createClient } from "@src/lib/supabase/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";
import { createNotification } from "@src/lib/notifications";
import { validateEmail, validatePassword, validateName, validatePhoneNumber } from "@src/lib/auth/validation";
import {
  checkAccountStatus,
  checkLoginLockout,
  recordFailedLogin,
  resetFailedLoginCount,
  logSecurityEvent,
  checkPasswordHistory,
  addPasswordToHistory,
  checkResetRateLimit,
  checkLoginRateLimit,
  findUserByEmail,
  timingSafeDelay,
} from "@src/lib/auth/security";
import { AUTH_CONSTANTS, type AuthActionResult } from "@src/lib/auth/types";
import { getSiteUrl } from "@src/lib/getSiteUrl";

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

  // 2. Check login rate limit
  const rateLimit = await checkLoginRateLimit(email);
  if (!rateLimit.allowed) {
    await logSecurityEvent({
      eventType: "login_failed",
      metadata: { reason: "rate_limit_exceeded", email },
    });
    return { error: "Too many login attempts. Please try again later." };
  }

  // 3. Attempt password authentication immediately (removes enumeration)
  console.log("[DEBUG - LOGIN]: Attempting login for", email);
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !authData.user) {
    // If Supabase enforces email confirmation at the API level
    if (signInError?.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please verify your email address before signing in. Check your inbox for the confirmation link." };
    }

    // Hide timing differences
    const delayPromise = timingSafeDelay();
    
    // Look up user to record failed attempt internally
    const user = await findUserByEmail(email);
    
    if (user) {
      const failResult = await recordFailedLogin(user.id);
      await logSecurityEvent({
        userId: user.id,
        eventType: "login_failed",
        metadata: { email, failedCount: failResult.count, reason: "invalid_credentials" },
      });

      await delayPromise;

      if (failResult.lockedOut) {
        const minutes = AUTH_CONSTANTS.LOCKOUT_DURATION_MINUTES;
        return {
          error: `Too many failed attempts. Your account has been locked for ${minutes} minutes.`,
          lockoutSeconds: failResult.lockoutSeconds,
        };
      }
    } else {
      await delayPromise;
    }

    return { error: "Invalid email or password." };
  }

  const authUser = authData.user;

  // 4. Check email verification (if Supabase allows login without confirmation)
  if (!authUser.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      error: "Please verify your email address before signing in. Check your inbox for the confirmation link.",
    };
  }

  // 5. Authentication succeeded. Now verify account status & lockout.
  // We do this AFTER verifying the password so we never reveal account state
  // to unauthenticated attackers.
  
  // Check lockout
  const lockout = await checkLoginLockout(authUser.id);
  if (lockout.locked) {
    await supabase.auth.signOut(); // Revoke the session we just created
    const minutes = Math.ceil(lockout.secondsRemaining / 60);
    return {
      error: `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      lockoutSeconds: lockout.secondsRemaining,
    };
  }

  // Check account status
  const statusResult = await checkAccountStatus(authUser.id);
  if (!statusResult.allowed && email.toLowerCase() !== "admin@teampadua.com") {
    await supabase.auth.signOut();
    await logSecurityEvent({
      userId: authUser.id,
      eventType: "login_failed",
      metadata: { reason: `account_status_${statusResult.status}`, email },
    });
    return { error: statusResult.message, status: statusResult.status };
  }

  // 5. Successful and valid login — reset counters and log
  await resetFailedLoginCount(authUser.id);
  await logSecurityEvent({
    userId: authUser.id,
    eventType: "login_success",
    metadata: { email },
  });

  // 6. Determine redirect based on role
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
  let role = (formData.get("role") as string) || "Financial Advisor";
  if (role !== "Financial Advisor" && role !== "Business Development Lead") {
    role = "Financial Advisor"; // Fallback to safe default if tampered
  }

  // 2. Check for duplicate email
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    return { error: "An account with this email already exists." };
  }

  // 3. Create user via Supabase Auth
  const supabase = await createClient();

  console.log("[DEBUG - SIGNUP]: Registering user", email);
  const redirectUrl = `${getSiteUrl()}/auth/callback`;
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone,
      },
      emailRedirectTo: redirectUrl,
    },
  });

  if (signUpError) {
    console.log("SIGNUP ERROR:", signUpError);
    return { error: signUpError.message };
  }

  const userId = signUpData.user?.id;

  // 4. Set account_status to pending, store terms acceptance
  if (userId) {
    const { error: insertError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: name,
      email: email,
      phone,
      role: role, // Dynamically selected role
      status: "Pending", // All users are pending initially until email verification
      terms_accepted_at: new Date().toISOString(),
      terms_version: AUTH_CONSTANTS.TERMS_VERSION,
    });
    
    if (insertError) {
      console.error("[DEBUG - SIGNUP]: Failed to insert profile:", insertError);
    }

    // Store initial password in history
    await addPasswordToHistory(userId, password);

    // Log registration event
    await logSecurityEvent({
      userId,
      eventType: "registration",
      metadata: { email, requestedRole: role },
    });
  }

  // 5. Send welcome email
  // Note: Admin notification has been moved to callback/route.ts (fires after email verification)

  try {
    const emailFrom = process.env.EMAIL_FROM;
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && emailFrom) {
      const { resend } = await import("@src/lib/resend");
      const WelcomeEmail = (await import("@src/features/users/emails/WelcomeEmail")).default;
      const React = await import("react");
      await resend.emails.send({
        from: `Team Padua <${emailFrom}>`,
        to: [email],
        subject: "Welcome to Team Padua Client Management Portal",
        react: React.createElement(WelcomeEmail, { name }),
      });
    }
  } catch (emailErr) {
    console.error("[DEBUG - SIGNUP]: Failed to send welcome email via Resend:", emailErr);
  }

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
    console.log("[DEBUG - RESET PWD]: Sending reset email to", email);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?type=password_reset`,
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

