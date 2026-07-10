import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ppu_processors")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("PPU processors GET query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && data.length === 0) {
      const defaults = [
        { id: "u1", name: 'Krystel', color: '#d946ef', sort_order: 1 },
        { id: "u2", name: 'Lorena', color: '#a21caf', sort_order: 2 },
        { id: "u3", name: 'Sir Pads', color: '#eab308', sort_order: 3 },
        { id: "u4", name: 'Trisha', color: '#2563eb', sort_order: 4 },
        { id: "u5", name: 'Valerie', color: '#ef4444', sort_order: 5 }
      ];
      const { error: insertError } = await supabaseAdmin.from("ppu_processors").insert(defaults);
      if (insertError) {
        console.error("PPU processors seeding query failed:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      const { data: seeded, error: fetchSeededErr } = await supabaseAdmin
        .from("ppu_processors")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (fetchSeededErr) {
        console.error("PPU processors fetch seeded query failed:", fetchSeededErr);
        return NextResponse.json({ error: fetchSeededErr.message }, { status: 500 });
      }
      return NextResponse.json(seeded);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PPU processors GET exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("ppu_processors")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("PPU processors POST query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PPU processors POST exception:", err);
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
      .from("ppu_processors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("PPU processors DELETE query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PPU processors DELETE exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
