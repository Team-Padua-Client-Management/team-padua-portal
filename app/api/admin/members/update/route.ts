/**
 * route.ts
 *
 * Main component module in features path: app/api/admin/members/update/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

/**
 * Executes operations logic for POST.
 *
 * @param req: Request
 * @returns State operations sequence.
 */
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
        } = body;

        const { error } = await supabaseAdmin
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
                    birthday,
                    address,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "id",
                }
            );

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });

    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: "Server Error",
            },
            {
                status: 500,
            }
        );
    }
}
