import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

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
