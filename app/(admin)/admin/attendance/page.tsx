/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/attendance/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import AttendanceClient from "./AttendanceClient";

/**
 * Executes operations logic for AttendancePage.
 *
 * 
 * @returns State operations sequence.
 */
export default async function AttendancePage() {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw new Error(authError.message);
    
    const { data: profilesData } = await /* Query database records from active repository grid */ supabase.from("profiles").select("*");
    
    const { data: attendanceData, error: attendanceError } = await supabaseAdmin
        .from("attendance")
        .select("*");

    if (attendanceError) {
        console.error("Error fetching attendance via Admin client:", attendanceError);
    }

    const currentAdminId = adminUser?.id;

    const filteredUsers = authData.users
        .filter(u => u.id !== currentAdminId)
        .map(u => {
            const p = profilesData?.find(profile => profile.id === u.id) || {};
            return {
                id: u.id,
                email: u.email || "",
                name: p.full_name || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || "User",
                avatar: p.avatar_url || u.user_metadata?.avatar_url || "",
                avatarMode: p.avatar_mode || "initials",
                aiSeed: p.ai_seed || u.id || "default",
            };
        });

    return (
        <AttendanceClient 
            users={filteredUsers} 
            profiles={profilesData || []} 
            initialAttendance={attendanceData || []} 
        />
    );
}
