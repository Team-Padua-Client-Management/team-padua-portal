import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createNotification } from "@/app/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const progressId = searchParams.get("progressId");
    const processorId = searchParams.get("processorId");
    const sortBy = searchParams.get("sortBy") || "newest";

    let query = supabaseAdmin
      .from("fst_requests")
      .select(`
        *,
        progress:progress_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `);

    if (search) {
      query = query.or(`policy_owner.ilike.%${search}%,policy_number.ilike.%${search}%,comments.ilike.%${search}%`);
    }

    if (progressId && progressId !== "ALL") {
      query = query.eq("progress_id", progressId);
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
      console.error("FST GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("FST GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("fst_requests")
      .insert(body)
      .select(`
        *,
        progress:progress_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `);

    if (error) {
      console.error("FST POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const record = Array.isArray(data) ? data[0] : data;
    if (record) {
      // Trigger notification
      await createNotification({
        title: "✍️ New FST Request Entry! 📄",
        description: `FST request for owner "${record.policy_owner}" (Policy #${record.policy_number}) has been created.`,
        type: "servicing",
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("FST POST exception:", err);
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
      .from("fst_requests")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        progress:progress_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `)
      .single();

    if (error) {
      console.error("FST PUT query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    const statusText = data.progress?.name ? `[Status: ${data.progress.name}]` : "";
    await createNotification({
      title: "🔄 FST Request Updated! ⚡",
      description: `FST request for owner "${data.policy_owner}" (Policy #${data.policy_number}) has been updated. ${statusText}`,
      type: "servicing",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("FST PUT exception:", err);
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
        .from("fst_requests")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("FST DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ FST Request Discarded ❌",
        description: `FST request has been discarded from client servicing.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    if (ids) {
      const idList = ids.split(",");
      const { error } = await supabaseAdmin
        .from("fst_requests")
        .delete()
        .in("id", idList);

      if (error) {
        console.error("FST bulk DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ Multiple FST Requests Discarded ❌",
        description: `Successfully cleared ${idList.length} FST requests from system.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (err) {
    console.error("FST DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
