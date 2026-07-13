/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/users/[id]/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import UserDetailClient from "./UserDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Executes operations logic for UserProfilePage.
 *
 * @param { params }: Props
 * @returns State operations sequence.
 */
export default async function UserProfilePage({ params }: Props) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) redirect("/auth/login");

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(id);

  if (userError || !userData?.user) notFound();

  const targetUser = userData.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  const { data: fetchedSocialLinks } = await supabase
    .from("social_links")
    .select("*")
    .eq("user_id", id)
    .order("display_order");

  const { data: attendanceLogs } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", id)
    .order("attendance_date", { ascending: false });

  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("task_id")
    .eq("user_id", id);

  const taskIds = assignments?.map((a) => a.task_id) || [];

  let userTasks: any[] = [];

  if (taskIds.length > 0) {
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .in("id", taskIds);

    userTasks = tasksData || [];
  }

  const googleName =
    targetUser.user_metadata?.full_name ||
    targetUser.user_metadata?.name ||
    (targetUser.user_metadata?.given_name
      ? `${targetUser.user_metadata?.given_name} ${targetUser.user_metadata?.family_name || ""}`.trim()
      : "") ||
    targetUser.email?.split("@")[0] ||
    "User";

  const googleAvatar =
    targetUser.user_metadata?.avatar_url ||
    targetUser.user_metadata?.picture ||
    "";

  const userProps = {
    id: targetUser.id,
    name: profile?.full_name || googleName,

    email: targetUser.email || "",
    employeeId: profile?.employee_id || "",
    role: profile?.role || "Member",
    department: profile?.department || "",
    team: profile?.team || "",
    phone: profile?.phone || "",
    gender: profile?.gender || "",
    birthday: profile?.birthday || "",

    address: profile?.address || "",
    avatar: profile?.avatar_url || googleAvatar || "",

    region: profile?.region || "",
    province: profile?.province || "",
    city: profile?.city || "",
    barangay: profile?.barangay || "",
    subdivision: profile?.subdivision || "",
    street: profile?.street || "",
    houseNo: profile?.house_no || "",
    postalCode: profile?.postal_code || "",
    latitude: profile?.latitude || "",
    longitude: profile?.longitude || "",
    mapUrl: profile?.map_url || "",

    avatar: profile?.avatar_url || googleAvatar,
    provider: targetUser.app_metadata?.provider || "email",
    status:
      profile?.status ||
      (targetUser.email_confirmed_at ? "Active" : "Pending"),
    joined: targetUser.created_at || "",
    lastActive: targetUser.last_sign_in_at || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    gcashQr: profile?.gcash_qr || null,
    bannerTheme:
      profile?.banner_theme ||
      "linear-gradient(135deg, #FFFFFF 0%, #FFF7D6 100%)",
    avatarMode:
      profile?.avatar_mode || (googleAvatar ? "upload" : "initials"),
    aiSeed:
      profile?.ai_seed ||
      targetUser.id ||
      targetUser.email ||
      "default",
  };

  return (
    <UserDetailClient
      initialUser={userProps}
      socialLinks={fetchedSocialLinks || []}
      attendance={attendanceLogs || []}
      tasks={userTasks}
    />
  );
}
