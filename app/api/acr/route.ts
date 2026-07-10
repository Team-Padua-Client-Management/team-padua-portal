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
      .from("acr_requests")
      .select(`
        *,
        progress:progress_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `);

    if (search) {
      query = query.or(`policy_owner.ilike.%${search}%,policy_number.ilike.%${search}%,comments.ilike.%${search}%,agent_confirmation.ilike.%${search}%`);
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
      console.error("ACR GET query failed:", error);
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("ACR GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("acr_requests")
      .insert(body)
      .select(`
        *,
        progress:progress_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `)
      .single();

    if (error) {
      console.error("ACR POST query failed:", error);
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    // Trigger notification
    await createNotification({
      title: "✍️ New ACR Request Submitted! 📄",
      description: `Advisor Change Request for owner "${data.policy_owner}" (Policy #${data.policy_number}) has been created.`,
      type: "servicing",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("ACR POST exception:", err);
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
      .from("acr_requests")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        progress:progress_id(id, name, color, sort_order),
        processor:processed_by_id(id, name, color, sort_order)
      `)
      .single();

    if (error) {
      console.error("ACR PUT query failed:", error);
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    // Trigger notification
    const statusText = data.progress?.name ? `[Status: ${data.progress.name}]` : "";
    await createNotification({
      title: "🔄 ACR Request Modified! ⚡",
      description: `ACR for owner "${data.policy_owner}" (Policy #${data.policy_number}) has been updated. ${statusText}`,
      type: "servicing",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("ACR PUT exception:", err);
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
        .from("acr_requests")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("ACR DELETE query failed:", error);
        return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ ACR Request Discarded ❌",
        description: `Advisor Change Request record has been deleted from client servicing.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    if (ids) {
      const idList = ids.split(",");
      const { error } = await supabaseAdmin
        .from("acr_requests")
        .delete()
        .in("id", idList);

      if (error) {
        console.error("ACR bulk DELETE query failed:", error);
        return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
      }

      // Trigger notification
      await createNotification({
        title: "🗑️ Multiple ACR Requests Cleared ❌",
        description: `Successfully discarded ${idList.length} Advisor Change Requests.`,
        type: "servicing",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
  } catch (err) {
    console.error("ACR DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
