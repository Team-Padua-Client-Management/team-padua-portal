import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase/admin";
import { createNotification } from "@src/lib/notifications";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            id,
            full_name,
            employee_id,
            role,
            department,
            team,
            phone,
            status,
            birthday,
            address,
            client_servicing_permissions,
        } = body;

        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert(
                {
                    id,
                    full_name,
                    employee_id,
                    role,
                    department,
                    team,
                    phone,
                    status,
                    birthday: birthday?.trim() ? birthday : null,
                    address,
                    client_servicing_permissions,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "id",
                }
            );

        if (profileError) {
            return NextResponse.json(
                { success: false, error: profileError.message },
                { status: 500 }
            );
        }

        // Trigger notification
        await createNotification({
            title: "👤 Member Profile Synchronized! ⚙️",
            description: `Profile credentials and system rights for "${full_name}" have been updated.`,
            type: "member",
        });

        // Sync with advisors table
        if (role === "Advisor") {
            const { data: profileData } = await supabaseAdmin
                .from("profiles")
                .select("email")
                .eq("id", id)
                .single();

            const { data: existingAdvisor } = await supabaseAdmin
                .from("advisors")
                .select("id")
                .eq("id", id)
                .single();

            if (!existingAdvisor) {
                await supabaseAdmin.from("advisors").insert({
                    id,
                    advisor_code: employee_id || `ADV-${id.slice(0, 6).toUpperCase()}`,
                    advisor_name: full_name,
                    email: profileData?.email || "",
                    created_at: new Date().toISOString(),
                });
            } else {
                await supabaseAdmin.from("advisors").update({
                    advisor_name: full_name,
                    advisor_code: employee_id || `ADV-${id.slice(0, 6).toUpperCase()}`,
                    email: profileData?.email || "",
                }).eq("id", id);
            }
        } else {
            await supabaseAdmin.from("advisors").delete().eq("id", id);
        }

        return NextResponse.json({
            success: true,
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

