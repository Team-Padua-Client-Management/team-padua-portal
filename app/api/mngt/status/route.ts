import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("mngt_status")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("MNGT status GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && data.length === 0) {
      const defaults = [
        { id: "m1", name: 'Pending', color: '#3b82f6', sort_order: 1 },
        { id: "m2", name: 'Completed', color: '#22c55e', sort_order: 2 },
        { id: "m3", name: 'Processing', color: '#f97316', sort_order: 3 },
        { id: "m4", name: 'Waiting', color: '#eab308', sort_order: 4 },
        { id: "m5", name: 'Email Sent', color: '#a21caf', sort_order: 5 },
        { id: "m6", name: 'Messenger Sent', color: '#06b6d4', sort_order: 6 }
      ];
      const { error: insertError } = await supabaseAdmin.from("mngt_status").insert(defaults);
      if (insertError) {
        console.error("MNGT status seeding query failed:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      const { data: seeded, error: fetchSeededErr } = await supabaseAdmin
        .from("mngt_status")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (fetchSeededErr) {
        console.error("MNGT status fetch seeded query failed:", fetchSeededErr);
        return NextResponse.json({ error: fetchSeededErr.message }, { status: 500 });
      }
      return NextResponse.json(seeded);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("MNGT status GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("mngt_status")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("MNGT status POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("MNGT status POST exception:", err);
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
      .from("mngt_status")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("MNGT status DELETE query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MNGT status DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
