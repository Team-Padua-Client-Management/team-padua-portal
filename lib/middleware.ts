/**
 * middleware.ts
 *
 * Main component module in features path: lib/middleware.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\lib\middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Executes operations logic for updateSession.
 *
 * @param request: NextRequest
 * @returns State operations sequence.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ROUTE DEFINITIONS (Nasa taas para malinis)
  // ───────────────────────────────────────────────────────────────────────────
  const pathname = request.nextUrl.pathname;

  const isAdminPage = pathname.startsWith("/admin");
  const isUserPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/playground") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/users");
  const isAuthPage = pathname.startsWith("/auth") || pathname.startsWith("/login");

  // ───────────────────────────────────────────────────────────────────────────
  // 2. AUTH & PROFILE CHECK
  // ───────────────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Catch profile errors early
    if (error) {
      console.error("Profile Error:", error);
    }

    role = profile?.role ?? null;
  }

  const isAdmin = role === "Admin";

  // ───────────────────────────────────────────────────────────────────────────
  // 3. GUARDS & ROUTING LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  // Guard A: Unauthenticated users accessing protected areas
  if (!user && (isAdminPage || isUserPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Guard B: Authenticated but missing a profile record
  if (user && !role && (isAdminPage || isUserPage)) {
    const url = request.nextUrl.clone();
    // Pwede mo rin itong gawing "/unauthorized" kung may ganoon kang route
    url.pathname = "/auth/login"; 
    return NextResponse.redirect(url);
  }

  // Guard C: Non-admins trying to access Admin pages
  if (user && isAdminPage && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Guard D: Admins trying to access regular User pages (Redirect to Admin Dashboard)
  if (user && isAdmin && isUserPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  // Guard E: Already logged-in users visiting Auth/Login pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();

    if (isAdmin) {
      url.pathname = "/admin/dashboard";
    } else {
      url.pathname = "/dashboard";
    }

    return NextResponse.redirect(url);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. RETURN RESPONSE
  // ───────────────────────────────────────────────────────────────────────────
  return supabaseResponse;
}
