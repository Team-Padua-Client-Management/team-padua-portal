import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";
import { createNotification } from "@src/lib/notifications";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            email,
            password,
            full_name,
            role,
            employee_id,
        } = body;

        if (!email || !password || !full_name || !role) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                name: full_name
            }
        });

        if (authError) {
            return NextResponse.json(
                { success: false, error: authError.message },
                { status: 400 }
            );
        }

        const userId = authData.user.id;

        // 2. Insert into profiles table
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert({
                id: userId,
                full_name,
                role,
                employee_id: employee_id || "",
                status: "Active",
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            // Rollback auth user creation if profile insert fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json(
                { success: false, error: profileError.message },
                { status: 500 }
            );
        }

        // 3. Sync with advisors table if role is Advisor
        if (role === "Advisor") {
            await supabaseAdmin.from("advisors").insert({
                id: userId,
                advisor_code: employee_id || `ADV-${userId.slice(0, 6).toUpperCase()}`,
                advisor_name: full_name,
                email,
                created_at: new Date().toISOString(),
            });
        }

        // Trigger notification
        await createNotification({
            title: "👤 New Member Added! ⚙️",
            description: `A new ${role} account for "${full_name}" has been created.`,
            type: "member",
        });

        return NextResponse.json({
            success: true,
            userId,
        });

    } catch (err: unknown) {
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : "Server Error",
            },
            {
                status: 500,
            }
        );
    }
}
