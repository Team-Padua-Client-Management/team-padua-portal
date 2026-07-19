/**
 * route.ts
 *
 * Auth callback handler for Supabase.
 *
 * Handles two callback types:
 * 1. Email verification — exchanges code, checks account status
 * 2. Password reset — exchanges code, redirects to reset form
 */

import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { logSecurityEvent } from "@/app/lib/auth/security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=auth_failed`
    );
  }

  const user = data?.user;

  // ─── Password Reset Callback ──────────────────────────────────────────────
  if (type === "password_reset") {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/reset-password`
    );
  }

  // ─── Email Verification Callback ──────────────────────────────────────────
  if (user) {
    // Log the email verification event
    await logSecurityEvent({
      userId: user.id,
      eventType: "email_verified",
      metadata: { email: user.email },
    });

    // Check current account status
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("status, role")
      .eq("id", user.id)
      .single();

    const accountStatus = profile?.status?.toLowerCase();
    const role = profile?.role;

    // If account is pending admin approval, redirect to login with message
    if (accountStatus === "pending") {
      // Sign the user out — they can't access the portal yet
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?message=email_verified_pending`
      );
    }

    // If account is suspended or disabled, redirect with appropriate message
    if (accountStatus === "suspended" || accountStatus === "disabled") {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=account_blocked`
      );
    }

    // Active account — redirect to appropriate dashboard
    if (role === "Admin") {
      return NextResponse.redirect(`${requestUrl.origin}/admin/dashboard`);
    }
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
