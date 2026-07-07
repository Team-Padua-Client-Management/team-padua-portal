/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/messages/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import styles from "@/styles/admin/messages/page.module.css";
import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import AdminMessagesClient from "./AdminMessagesClient";

/**
 * Executes operations logic for AdminMessagesPage.
 *
 * 
 * @returns State operations sequence.
 */
export default async function AdminMessagesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        return (
            <div className={styles.text_0}>
                Failed to load users: {error.message}
            </div>
        );
    }

    const { data: profilesData } = await /* Query database records from active repository grid */ supabase.from("profiles").select("*");

    const safeUsers = data.users
        .filter((u) => u.id !== user.id)
        .map((u) => {
            const p = profilesData?.find((profile) => profile.id === u.id) || {};
            return {
                id: u.id,
                email: u.email ?? "",
                name: p.full_name || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || "User",
                avatar: p.avatar_url || u.user_metadata?.avatar_url || "",
                avatarMode: p.avatar_mode || "initials",
                aiSeed: p.ai_seed || u.id || "default",
            };
        });

    return <AdminMessagesClient users={safeUsers} currentUserId={user.id} />;
}
