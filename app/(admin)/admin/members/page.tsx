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
import Header from "@/app/components/admin/AdminHeader";
import Sidebar from "@/app/components/admin/AdminSidebar";
import AdminMembersTable from "./AdminMembersTable/AdminMembersTable";
import { Users, UserCheck, Clock, UserX, Plus } from "lucide-react";

/**
 * Executes operations logic for AdminMembers.
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

    const { data: profilesData } = await supabase.from("profiles").select("*");

    const users = authData.users
        .filter((u) => u.id !== user.id)
        .map((u) => {
            const profile = profilesData?.find((p) => p.id === u.id) || {};
            const googleAvatar = u.user_metadata?.avatar_url || u.user_metadata?.picture || "";
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
                avatar: profile.avatar_url || googleAvatar || "",
                avatarMode: profile.avatar_mode || (googleAvatar ? "upload" : "initials"),
                aiSeed: profile.ai_seed || u.id || u.email || "default",
                provider: u.app_metadata?.provider || "email",
                status: profile.status || (u.email_confirmed_at ? "Active" : "Pending"),
                presence_status: profile.status || "Offline",
                joined: u.created_at ?? "",
                lastActive: u.last_sign_in_at ?? "",
                client_servicing_permissions: profile.client_servicing_permissions || {
                    cpst: { view: false, create: false, edit: false, delete: false, export: false },
                    acr: { view: false, create: false, edit: false, delete: false, export: false },
                    fst: { view: false, create: false, edit: false, delete: false, export: false },
                    cpc: { view: false, create: false, edit: false, delete: false, export: false },
                    ppu: { view: false, create: false, edit: false, delete: false, export: false },
                    mngt: { view: false, create: false, edit: false, delete: false, export: false },
                },
            };
        });

    const stats = {
        total: users.length,
        verified: users.filter(u => u.status === "Active").length,
        pending: users.filter(u => u.status === "Pending").length,
        disabled: users.filter(u => u.status === "Disabled").length,
    };

    const statCards = [
        {
            label: "Total Members",
            val: stats.total,
            icon: Users,
            color: "text-foreground",
            pct: "100%",
            accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        },
        {
            label: "Active Members",
            val: stats.verified,
            icon: UserCheck,
            color: "text-emerald-600 dark:text-emerald-400",
            pct: stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : "0%",
            accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        },
        {
            label: "Pending Verification",
            val: stats.pending,
            icon: Clock,
            color: "text-amber-500 dark:text-amber-400",
            pct: stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : "0%",
            accentBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        },
        {
            label: "Disabled / Suspended",
            val: stats.disabled,
            icon: UserX,
            color: "text-red-500 dark:text-red-400",
            pct: stats.total > 0 ? `${Math.round((stats.disabled / stats.total) * 100)}%` : "0%",
            accentBg: "bg-red-500/10 text-red-600 dark:text-red-400"
        }
    ];

    return (
        <div className={styles.pageShell}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <Header />
                <div className={styles.mainContainer}>
                    {/* Header Section */}
                    <div className={styles.pageHeader}>
                        <div className={styles.headerInfo}>
                            <span className={styles.categoryBadge}>
                                <Users size={12} strokeWidth={2.2} />
                                Access & Directory Control
                            </span>
                            <h1 className={styles.pageTitle}>Members Directory</h1>
                            <p className={styles.pageSubtitle}>
                                Manage team accounts, assign organizational roles, configure departments, and control granular module-level permissions across TeamPadua.
                            </p>
                        </div>
                        <button type="button" className={styles.inviteBtn}>
                            <Plus size={15} strokeWidth={2.5} />
                            <span>Invite Member</span>
                        </button>
                    </div>

                    {/* KPI Stat Cards Grid */}
                    <div className={styles.statsGrid}>
                        {statCards.map((stat, idx) => {
                            const IconComponent = stat.icon;
                            return (
                                <div key={idx} className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <span className={styles.statLabel}>{stat.label}</span>
                                        <div className={`${styles.statIconWrap} ${stat.accentBg}`}>
                                            <IconComponent size={16} strokeWidth={2} />
                                        </div>
                                    </div>
                                    <div className={styles.statValueRow}>
                                        <h3 className={`${styles.statValue} ${stat.color}`}>{stat.val}</h3>
                                        <span className={styles.statBadge}>{stat.pct}</span>
                                    </div>
                                    <div className={styles.statDecoration} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Members Interactive Table Component */}
                    <AdminMembersTable initialUsers={users} />
                </div>
            </div>
        </div>
    );
}
