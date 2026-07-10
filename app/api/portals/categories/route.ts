import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("portal_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Categories endpoint exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
