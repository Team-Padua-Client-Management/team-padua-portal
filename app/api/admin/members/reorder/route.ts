import { NextResponse } from "next/server";
import { createClient } from "@src/lib/supabase/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "Admin" || profile?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const { memberIds } = body as { memberIds: string[] };

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid memberIds array" }, { status: 400 });
    }

    // Prepare batch update payloads for display_order
    const updates = memberIds.map((id, index) => ({
      id,
      display_order: index + 1,
      updated_at: new Date().toISOString(),
    }));

    // Update profiles with new display_order
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .upsert(updates, { onConflict: "id" });

    if (updateError) {
      console.error("Error updating member order:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated order for ${memberIds.length} members`,
    });
  } catch (err: unknown) {
    console.error("Reorder members server error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
