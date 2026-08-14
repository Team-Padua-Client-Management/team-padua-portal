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
import { createClient } from "@src/lib/supabase/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";
import { logSecurityEvent } from "@src/lib/auth/security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  console.log("[DEBUG - CALLBACK]: Hit callback route", { code: !!code, type, next });

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

  // ─── Email Verification / OAuth Callback ──────────────────────────────────
  if (user) {
    const provider = user.app_metadata?.provider;
    const isOAuth = provider && provider !== "email";

    console.log("[DEBUG - CALLBACK]: Successfully verified session for user", user.email, "Provider:", provider);

    // Log the authentication security event with accurate provider
    await logSecurityEvent({
      userId: user.id,
      eventType: isOAuth ? "oauth_login" : "email_verified",
      metadata: { email: user.email, provider: provider || "email" },
    });

    // Check current account status
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("status, role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";
      const avatarUrl =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

      const { data: newProfile } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName,
            email: user.email,
            avatar_url: avatarUrl,
            role: "Member",
            status: "Pending",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("status, role, full_name")
        .maybeSingle();

      profile = newProfile || { status: "Pending", role: "Member", full_name: fullName };
      
      // Notify admins about the new registration
      if (!profile || profile.status === "Pending") {
        await supabaseAdmin.from("notifications").insert({
          title: "New Member Registration (Google)",
          description: `A new member (${fullName || user.email}) signed up via Google and is pending approval.`,
          type: "user",
          is_read: false,
        });
      }
    }

    const accountStatus = profile?.status?.toLowerCase();
    const role = profile?.role;

    // If account is pending admin approval
    if (accountStatus === "pending") {
      const nameOrEmail = profile?.full_name || user.email;

      if (role === "Financial Advisor") {
        // Financial Advisors do not require admin approval
        await supabaseAdmin.from("profiles").update({ status: "Active" }).eq("id", user.id);
        
        await supabaseAdmin.from("notifications").insert({
          title: "New Financial Advisor Registration",
          description: `${nameOrEmail} has registered and verified their email.`,
          type: "user",
          is_read: false,
        });
        
        // Let them proceed into the portal (redirect handled below)
      } else {
        // Business Development Lead requires Admin Approval
        await supabaseAdmin.from("notifications").insert({
          title: "Pending Registration Review",
          description: `${nameOrEmail} has verified their email and is awaiting account approval.`,
          type: "user",
          is_read: false,
        });

        // Sign the user out — they can't access the portal yet
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?message=email_verified_pending`
        );
      }
    }

    // If account is suspended or disabled, redirect with appropriate message
    if (accountStatus === "suspended" || accountStatus === "disabled") {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=account_blocked`
      );
    }

    // Active account — redirect to appropriate destination or dashboard
    if (next && next.startsWith("/")) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    if (role === "Admin") {
      return NextResponse.redirect(`${requestUrl.origin}/admin/dashboard`);
    }
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}

