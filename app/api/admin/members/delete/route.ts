import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";
import { createNotification } from "@src/lib/notifications";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing user ID" },
                { status: 400 }
            );
        }

        // Fetch user info for notification
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, role")
            .eq("id", id)
            .single();

        const fullName = profile?.full_name || "Unknown User";
        const role = profile?.role || "Member";

        // 1. Delete user from auth (this typically cascades to profiles if set up that way)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            return NextResponse.json(
                { success: false, error: authError.message },
                { status: 500 }
            );
        }

        // 2. Also explicitly delete from profiles just in case cascade is not on
        await supabaseAdmin.from("profiles").delete().eq("id", id);

        // 3. Delete from advisors table to sync
        if (role === "Advisor") {
            await supabaseAdmin.from("advisors").delete().eq("id", id);
        }

        // Trigger notification
        await createNotification({
            title: "👤 Member Removed",
            description: `The account for "${fullName}" has been permanently deleted.`,
            type: "member",
        });

        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : "Server Error",
            },
            { status: 500 }
        );
    }
}
