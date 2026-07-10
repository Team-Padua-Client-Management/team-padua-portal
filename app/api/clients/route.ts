/**
 * route.ts
 *
 * Main component module in features path: app/api/clients/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createNotification } from "@/app/lib/notifications";

/**
 * Executes operations logic for GET.
 *
 * 
 * @returns State operations sequence.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("cpst_clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Executes operations logic for POST.
 *
 * @param request: Request
 * @returns State operations sequence.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("cpst_clients")
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    await createNotification({
      title: "👥 Client Profile Registered! 🎉",
      description: `Client "${data.name}" has been successfully added to CPST.`,
      type: "client",
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Executes operations logic for PUT.
 *
 * @param request: Request
 * @returns State operations sequence.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const { id, ...updates } = body;

    const { data, error } = await supabaseAdmin
      .from("cpst_clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    await createNotification({
      title: "✏️ Client Profile Updated! 🔄",
      description: `Client "${data.name}" profile information has been modified.`,
      type: "client",
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Executes operations logic for DELETE.
 *
 * @param request: Request
 * @returns State operations sequence.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const { error } = await supabaseAdmin
        .from("cpst_clients")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ Client Profile Discarded ❌",
        description: `A client record has been removed from CPST.`,
        type: "client",
      });

      return NextResponse.json({ success: true });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
    }

    if (body && Array.isArray(body.ids)) {
      const { error } = await supabaseAdmin
        .from("cpst_clients")
        .delete()
        .in("id", body.ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ Multiple Client Profiles Discarded ❌",
        description: `Successfully cleared ${body.ids.length} client records from CPST.`,
        type: "client",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Missing id parameter or ids array in request body" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
