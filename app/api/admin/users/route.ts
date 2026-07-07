/**
 * route.ts
 *
 * Main component module in features path: app/api/admin/users/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

/**
 * Executes operations logic for GET.
 *
 * 
 * @returns State operations sequence.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const users = data.users.map((user) => ({
      id: user.id,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "Administrator",
      email: user.email,
      provider: user.app_metadata?.provider ?? "email",
      avatar:
        user.user_metadata?.avatar_url ??
        `https://ui-avatars.com/api/?background=facc15&color=000&name=${encodeURIComponent(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Admin"
        )}`,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      emailConfirmed: !!user.email_confirmed_at,
    }));

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
