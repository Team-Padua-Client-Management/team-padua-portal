/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/members/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import styles from "@/styles/admin/members/page.module.css";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import AdminMembersTable from "./AdminMembersTable/AdminMembersTable";

/**
 * Executes operations logic for AdminMembers.
 *
 * 
 * @returns State operations sequence.
 */
export default async function AdminMembers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw new Error(authError.message);

    const { data: profilesData } = await /* Query database records from active repository grid */ supabase.from("profiles").select("*");

    const users = authData.users
        .filter((u) => u.id !== user.id)
        .map((u) => {
            const profile = profilesData?.find((p) => p.id === u.id) || {};
            return {
                id: u.id,
                name: profile.full_name || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
                email: u.email ?? "",
                employeeId: profile.employee_id ?? "",
                role: profile.role ?? "Member",
                department: profile.department ?? "",
                team: profile.team ?? "",
                phone: profile.phone ?? "",
                gender: profile.gender ?? "",
                birthday: profile.birthday ?? "",
                address: profile.address ?? "",
                avatar: profile.avatar_url ?? "",
                provider: u.app_metadata?.provider || "email",
                status: profile.status || (u.email_confirmed_at ? "Active" : "Pending"),
                joined: u.created_at ?? "",
                lastActive: u.last_sign_in_at ?? "",
            };
        });

    const stats = {
        total: users.length,
        verified: users.filter(u => u.status === "Active").length,
        pending: users.filter(u => u.status === "Pending").length,
        disabled: users.filter(u => u.status === "Disabled").length,
    };

    return (
        <div className={styles.text_0}>
            <Sidebar />
            <div className={styles.container_1}>
                <Header />
                <div className={styles.div_2}>
                    <div className={styles.container_3}>
                        <div>
                            <h1 className={styles.table_4}>Members Management</h1>
                            <p className={styles.text_5}>Manage team roles, departments, employee IDs, and platform access.</p>
                        </div>
                        <button className={styles.table_6}>
                            + Invite Member
                        </button>
                    </div>

                    <div className={styles.container_7}>
                        {[
                            { label: "Total Members", val: stats.total },
                            { label: "Verified", val: stats.verified, color: "text-green-600 dark:text-green-400" },
                            { label: "Pending", val: stats.pending, color: "text-amber-500 dark:text-amber-400" },
                            { label: "Disabled", val: stats.disabled, color: "text-red-500 dark:text-red-400" }
                        ].map((stat, idx) => (
                            <div key={idx} className={styles.card_8}>
                                <p className={styles.table_9}>{stat.label}</p>
                                <h3 className={`${styles.text_10} ${stat.color || "text-foreground"}`}>{stat.val}</h3>
                            </div>
                        ))}
                    </div>

                    <AdminMembersTable initialUsers={users} />
                </div>
            </div>
        </div>
    );
}
