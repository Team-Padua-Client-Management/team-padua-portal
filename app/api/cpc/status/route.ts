import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("cpc_status")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("CPC status GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && data.length === 0) {
      const defaults = [
        { id: "b1", name: 'Ready to Print', color: '#eab308', sort_order: 1 },
        { id: "b2", name: 'Pending', color: '#3b82f6', sort_order: 2 },
        { id: "b3", name: 'Completed', color: '#22c55e', sort_order: 3 },
        { id: "p1", name: 'Pending', color: '#3b82f6', sort_order: 4 },
        { id: "p2", name: 'Ready to Print', color: '#eab308', sort_order: 5 },
        { id: "p3", name: 'Completed', color: '#22c55e', sort_order: 6 },
        { id: "h1", name: 'Pending', color: '#f97316', sort_order: 7 },
        { id: "h2", name: 'Completed', color: '#22c55e', sort_order: 8 }
      ];
      const { error: insertError } = await supabaseAdmin.from("cpc_status").insert(defaults);
      if (insertError) {
        console.error("CPC status seeding query failed:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      const { data: seeded, error: fetchSeededErr } = await supabaseAdmin
        .from("cpc_status")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (fetchSeededErr) {
        console.error("CPC status fetch seeded query failed:", fetchSeededErr);
        return NextResponse.json({ error: fetchSeededErr.message }, { status: 500 });
      }
      return NextResponse.json(seeded);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("CPC status GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("cpc_status")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("CPC status POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("CPC status POST exception:", err);
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
      .from("cpc_status")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("CPC status DELETE query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CPC status DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
