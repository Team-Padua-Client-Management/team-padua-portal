import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createNotification } from "@/app/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusId = searchParams.get("statusId");
    const sortBy = searchParams.get("sortBy") || "newest";

    let query = supabaseAdmin
      .from("mngt_records")
      .select(`
        *,
        status:status_id(id, name, color, sort_order),
        gc_status:gc_status_id(id, name, color, sort_order)
      `);

    if (search) {
      query = query.or(`client_name.ilike.%${search}%,nickname.ilike.%${search}%,email_address.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (statusId && statusId !== "ALL") {
      query = query.or(`status_id.eq.${statusId},gc_status_id.eq.${statusId}`);
    }

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "client_name") {
      query = query.order("client_name", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("MNGT GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("MNGT GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("mngt_records")
      .insert(body)
      .select(`
        *,
        status:status_id(id, name, color, sort_order),
        gc_status:gc_status_id(id, name, color, sort_order)
      `);

    if (error) {
      console.error("MNGT POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const record = Array.isArray(data) ? data[0] : data;
    if (record) {
      // Trigger notification
      await createNotification({
        title: "✍️ New MNGT Request Submitted! 📄",
        description: `MNGT request for client "${record.client_name}" has been created.`,
        type: "servicing",
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("MNGT POST exception:", err);
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
      .from("mngt_records")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        status:status_id(id, name, color, sort_order),
        gc_status:gc_status_id(id, name, color, sort_order)
      `)
      .single();

    if (error) {
      console.error("MNGT PUT query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    const statusText = data.status?.name ? `[Status: ${data.status.name}]` : "";
    await createNotification({
      title: "🔄 MNGT Request Updated! ⚡",
      description: `MNGT record for client "${data.client_name}" has been updated. ${statusText}`,
      type: "servicing",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("MNGT PUT exception:", err);
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
        .from("mngt_records")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("MNGT DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ MNGT Request Discarded ❌",
        description: `MNGT request has been deleted from client servicing.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    if (ids) {
      const idList = ids.split(",");
      const { error } = await supabaseAdmin
        .from("mngt_records")
        .delete()
        .in("id", idList);

      if (error) {
        console.error("MNGT bulk DELETE query failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ Multiple MNGT Requests Discarded ❌",
        description: `Successfully cleared ${idList.length} MNGT requests.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (err) {
    console.error("MNGT DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
