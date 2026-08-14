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
import {
  getModuleKeyFromPath,
  isExemptPath,
  isFullMaintenance,
  isModuleMaintenance,
  type MaintenanceSetting,
} from "@src/lib/maintenance";
import {
  isClientServicingRoute,
  getModuleKeyForRoute,
  hasAutomaticAccess,
  type ClientServicingModule,
} from "@src/lib/permissions";

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  let client_servicing_permissions: any = null;

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, client_servicing_permissions")
      .eq("id", user.id)
      .single();

    // Catch profile errors early
    if (error) {
      console.error("Profile Error:", error);
    }

    role = profile?.role ?? null;
    client_servicing_permissions = profile?.client_servicing_permissions ?? null;
  }

  const isAdmin = role === "Admin";

  // ───────────────────────────────────────────────────────────────────────────
  // 3. GUARDS & ROUTING LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  // Guard A: Unauthenticated users accessing protected areas
  if (!user && (isAdminPage || isUserPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Guard B: Authenticated but missing a profile record
  if (user && !role && (isAdminPage || isUserPage)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "profile_not_found");
    return NextResponse.redirect(url);
  }

  // Guard C: Non-admins trying to access Admin pages
  // Exception: Non-admin users with Client Servicing permissions may access
  // specific Client Servicing routes if their role + permissions allow it.
  if (user && isAdminPage && !isAdmin) {
    const isCSRoute = isClientServicingRoute(pathname);

    if (isCSRoute) {
      // For Client Servicing routes, allow access if:
      // - Role is Advisor (automatic access), OR
      // - Role is Bizdev/Member with explicit module permission
      const moduleKey = getModuleKeyForRoute(pathname);

      if (moduleKey && hasAutomaticAccess(role)) {
        // Advisor: allow through to the page (page-level guard enforces further)
        // Bizdev/Member: use previously fetched permissions
        const permissions = client_servicing_permissions as Record<ClientServicingModule, { view: boolean }> | null;
        const hasAccess = permissions?.[moduleKey]?.view === true;

        if (!hasAccess) {
          const url = request.nextUrl.clone();
          url.pathname = "/403";
          return NextResponse.redirect(url);
        }
      }
    } else {
      // Non-CS admin routes: redirect non-admins to dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
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
  // 4. MAINTENANCE MODE CHECKS
  // ───────────────────────────────────────────────────────────────────────────
  // Admins bypass all maintenance checks. Exempt paths (settings, auth,
  // maintenance pages, API routes) are never blocked.
  if (!isAdmin && !isExemptPath(pathname) && (isAdminPage || isUserPage)) {
    try {
      const { data: maintenanceData } = await supabase
        .from("maintenance_settings")
        .select("module_key, enabled, updated_at");

      const settings: MaintenanceSetting[] = (maintenanceData ?? []) as MaintenanceSetting[];

      // Check full-system maintenance first
      if (isFullMaintenance(settings)) {
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
      }

      // Check per-module maintenance
      const moduleKey = getModuleKeyFromPath(pathname);
      if (moduleKey && isModuleMaintenance(settings, moduleKey)) {
        const url = request.nextUrl.clone();
        url.pathname = `/maintenance/${moduleKey}`;
        return NextResponse.redirect(url);
      }
    } catch (err) {
      // If maintenance check fails, allow access rather than blocking
      console.error("Maintenance check error:", err);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. RETURN RESPONSE
  // ───────────────────────────────────────────────────────────────────────────
  return supabaseResponse;
}
