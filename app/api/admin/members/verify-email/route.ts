import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, verifyAll } = body;

        if (verifyAll) {
            // Verify all unverified users
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
            if (error) throw error;
            
            const unverifiedUsers = data.users.filter(u => !u.email_confirmed_at);
            
            for (const user of unverifiedUsers) {
                await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
                await supabaseAdmin.from("profiles").update({ status: "Active" }).eq("id", user.id);
            }
            
            return NextResponse.json({ success: true, count: unverifiedUsers.length });
        } else if (id) {
            // Verify single user
            const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { email_confirm: true });
            if (error) throw error;
            
            await supabaseAdmin.from("profiles").update({ status: "Active" }).eq("id", id);
            
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: "Missing user ID or verifyAll flag" }, { status: 400 });
        }

    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Server Error" },
            { status: 500 }
        );
    }
}
