import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createNotification } from "@/app/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const portalSlug = searchParams.get("portal");
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "display_order";
    const status = searchParams.get("status"); // Optional status filter

    if (!portalSlug) {
      return NextResponse.json({ error: "Missing portal parameter" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("portal_resources")
      .select(`
        *,
        category:category_id(id, name, slug, icon, color)
      `)
      .eq("portal_slug", portalSlug);

    // Filter by Category
    if (categoryId && categoryId !== "all" && categoryId !== "ALL") {
      query = query.eq("category_id", categoryId);
    }

    // Filter by Status (Admin can see Active & Hidden, Clients might see only Active)
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    } else {
      // By default, do not return Archived items unless requested
      query = query.neq("status", "Archived");
    }

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply Sorting
    if (sortBy === "title") {
      query = query.order("title", { ascending: true });
    } else if (sortBy === "favorite") {
      query = query.order("favorite", { ascending: false }).order("display_order", { ascending: true });
    } else if (sortBy === "updated") {
      query = query.order("updated_at", { ascending: false });
    } else {
      // Default: display_order, then updated_at
      query = query.order("display_order", { ascending: true }).order("updated_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Resources GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Resources GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Ensure timestamps and portal slug are present
    const payload = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from("portal_resources")
      .insert(payload)
      .select(`
        *,
        category:category_id(id, name, slug, icon, color)
      `)
      .single();

    if (error) {
      console.error("Resources POST failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    const portalName = data.portal_slug ? data.portal_slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Portal";
    await createNotification({
      title: "🚀 New Resource Added! 🔗",
      description: `New shortcut "${data.title}" added to the ${portalName} portal. Check it out!`,
      type: "portal",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Resources POST exception:", err);
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

    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from("portal_resources")
      .update(payload)
      .eq("id", id)
      .select(`
        *,
        category:category_id(id, name, slug, icon, color)
      `)
      .single();

    if (error) {
      console.error("Resources PUT failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    await createNotification({
      title: "🔄 Portal Resource Updated! ⚡",
      description: `Portal resource "${data.title}" has been updated.`,
      type: "portal",
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Resources PUT exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    // Get resource details before delete for a nicer notification
    const { data: resData } = await supabaseAdmin
      .from("portal_resources")
      .select("title")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("portal_resources")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Resources DELETE failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification
    const resTitle = resData?.title ? `"${resData.title}"` : "A portal resource";
    await createNotification({
      title: "🗑️ Portal Resource Removed ❌",
      description: `${resTitle} has been deleted from portal management.`,
      type: "portal",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resources DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
