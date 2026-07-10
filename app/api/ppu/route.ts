import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusId = searchParams.get("statusId");
    const processorId = searchParams.get("processorId");
    const sortBy = searchParams.get("sortBy") || "newest";

    let query = supabaseAdmin
      .from("ppu_records")
      .select(`
        *,
        status_item:status_id(id, name, color, sort_order),
        updated_by:updated_by_id(id, name, color, sort_order),
        sent_by:sent_by_id(id, name, color, sort_order)
      `);

    if (search) {
      query = query.or(`policy_owner.ilike.%${search}%,policy_number.ilike.%${search}%,comments.ilike.%${search}%`);
    }

    if (statusId && statusId !== "ALL") {
      query = query.eq("status_id", statusId);
    }

    if (processorId && processorId !== "ALL") {
      query = query.or(`updated_by_id.eq.${processorId},sent_by_id.eq.${processorId}`);
    }

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "policy_number") {
      query = query.order("policy_number", { ascending: true });
    } else if (sortBy === "policy_owner") {
      query = query.order("policy_owner", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("PPU GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PPU GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("ppu_records")
      .insert(body)
      .select(`
        *,
        status_item:status_id(id, name, color, sort_order),
        updated_by:updated_by_id(id, name, color, sort_order),
        sent_by:sent_by_id(id, name, color, sort_order)
      `);

    if (error) {
      console.error("PPU POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PPU POST exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("ppu_records")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        status_item:status_id(id, name, color, sort_order),
        updated_by:updated_by_id(id, name, color, sort_order),
        sent_by:sent_by_id(id, name, color, sort_order)
      `)
      .single();

    if (error) {
      console.error("PPU PUT query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PPU PUT exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (id) {
      const { error } = await supabaseAdmin
        .from("ppu_records")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("PPU DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (ids) {
      const idList = ids.split(",");
      const { error } = await supabaseAdmin
        .from("ppu_records")
        .delete()
        .in("id", idList);

      if (error) {
        console.error("PPU bulk DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (err) {
    console.error("PPU DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
