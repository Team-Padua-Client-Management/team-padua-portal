import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createNotification } from "@/app/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const basicId = searchParams.get("basicId");
    const processorId = searchParams.get("processorId");
    const sortBy = searchParams.get("sortBy") || "newest";

    let query = supabaseAdmin
      .from("cpc_records")
      .select(`
        *,
        digital_basic:digital_basic_id(id, name, color, sort_order),
        digital_premium:digital_premium_id(id, name, color, sort_order),
        hard_copy:hard_copy_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `);

    if (search) {
      query = query.or(`policy_owner.ilike.%${search}%,policy_number.ilike.%${search}%,comments.ilike.%${search}%`);
    }

    if (basicId && basicId !== "ALL") {
      query = query.eq("digital_basic_id", basicId);
    }

    if (processorId && processorId !== "ALL") {
      query = query.eq("processed_by_id", processorId);
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
      console.error("CPC GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("CPC GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("cpc_records")
      .insert(body)
      .select(`
        *,
        digital_basic:digital_basic_id(id, name, color, sort_order),
        digital_premium:digital_premium_id(id, name, color, sort_order),
        hard_copy:hard_copy_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `);

    if (error) {
      console.error("CPC POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const record = Array.isArray(data) ? data[0] : data;
    if (record) {
      // Trigger notification
      await createNotification({
        title: "👥 New CPC Record Entry! 📄",
        description: `CPC entry for owner "${record.policy_owner}" (Policy #${record.policy_number}) has been registered.`,
        type: "servicing",
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("CPC POST exception:", err);
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
      .from("cpc_records")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        digital_basic:digital_basic_id(id, name, color, sort_order),
        digital_premium:digital_premium_id(id, name, color, sort_order),
        hard_copy:hard_copy_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `)
      .single();

    if (error) {
      console.error("CPC PUT query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    await createNotification({
      title: "🔄 CPC Record Updated! ⚡",
      description: `CPC record for owner "${data.policy_owner}" (Policy #${data.policy_number}) has been updated.`,
      type: "servicing",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("CPC PUT exception:", err);
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
        .from("cpc_records")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("CPC DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ CPC Record Removed ❌",
        description: `CPC record has been removed from client servicing.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    if (ids) {
      const idList = ids.split(",");
      const { error } = await supabaseAdmin
        .from("cpc_records")
        .delete()
        .in("id", idList);

      if (error) {
        console.error("CPC bulk DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ Multiple CPC Records Removed ❌",
        description: `Successfully discarded ${idList.length} CPC records.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (err) {
    console.error("CPC DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
