/**
 * route.ts
 *
 * Main component module in features path: app/api/debug-db/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import { createClient } from "@src/lib/supabase/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";

/**
 * Executes operations logic for GET.
 * Secure debug endpoint disabled in production and restricted to authenticated Admins only.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden in production environment." }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { error: insertError } = await supabaseAdmin
      .from("message_reads")
      .insert({
        message_id: "00000000-0000-0000-0000-000000000000",
        user_id: user.id,
        read_at: new Date().toISOString()
      });

    return NextResponse.json({
      insertError: insertError ? {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      } : "Insert succeeded"
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

