import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("acr_progress")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("ACR progress GET query failed:", error);
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    if (data && data.length === 0) {
      const defaults = [
        { id: "11111111-1111-1111-1111-111111111111", name: "01 - Transferred", color: "#22c55e", sort_order: 1 },
        { id: "22222222-2222-2222-2222-222222222222", name: "02-Request Sent", color: "#84cc16", sort_order: 2 },
        { id: "33333333-3333-3333-3333-333333333333", name: "03-Okay to process", color: "#eab308", sort_order: 3 },
        { id: "44444444-4444-4444-4444-444444444444", name: "Pending", color: "#f97316", sort_order: 4 },
        { id: "55555555-5555-5555-5555-555555555555", name: "Pending ID", color: "#ef4444", sort_order: 5 },
        { id: "66666666-6666-6666-6666-666666666666", name: "Pending PN", color: "#dc2626", sort_order: 6 }
      ];
      const { error: insertError } = await supabaseAdmin.from("acr_progress").insert(defaults);
      if (insertError) {
        console.error("ACR progress seeding query failed:", insertError);
        return NextResponse.json({ error: insertError.message, details: insertError.details, hint: insertError.hint }, { status: 500 });
      }
      const { data: seeded, error: fetchSeededErr } = await supabaseAdmin
        .from("acr_progress")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (fetchSeededErr) {
        console.error("ACR progress fetch seeded query failed:", fetchSeededErr);
        return NextResponse.json({ error: fetchSeededErr.message, details: fetchSeededErr.details, hint: fetchSeededErr.hint }, { status: 500 });
      }
      return NextResponse.json(seeded);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("ACR progress GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("acr_progress")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("ACR progress POST query failed:", error);
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("ACR progress POST exception:", err);
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

    const { error } = await supabaseAdmin
      .from("acr_progress")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("ACR progress DELETE query failed:", error);
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ACR progress DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
