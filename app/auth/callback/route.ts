/**
 * route.ts
 *
 * Main component module in features path: app/auth/callback/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * Executes operations logic for GET.
 *
 * @param request: Request
 * @returns State operations sequence.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=auth_failed`
    );
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
