/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/users/[id]/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import UserViewClient from "./UserViewClient";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Executes operations logic for UserProfileViewPage.
 *
 * @param { params }: Props
 * @returns State operations sequence.
 */
export default async function UserProfileViewPage({ params }: Props) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: fetchedSocialLinks } = await supabase
    .from("social_links")
    .select("*")
    .eq("user_id", id)
    .order("display_order");

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

  const userProps = {
    id: profile.id,
    name: profile.full_name || "User",
    email: profile.email || "",
    employeeId: profile.employee_id || "",
    role: profile.role || "Member",
    department: profile.department || "",
    team: profile.team || "",
    phone: profile.phone || "",
    gender: profile.gender || "",
    birthday: profile.birthday || "",

    address: profile.address || "",

    region: profile.region || "",
    province: profile.province || "",
    city: profile.city || "",
    barangay: profile.barangay || "",
    subdivision: profile.subdivision || "",
    street: profile.street || "",
    houseNo: profile.house_no || "",
    postalCode: profile.postal_code || "",
    latitude: profile.latitude || "",
    longitude: profile.longitude || "",
    mapUrl: profile.map_url || "",

    avatar: profile.avatar_url || "",
    status: profile.status || "Active",
    bio: profile.bio || "",
    website: profile.website || "",
    gcashQr: profile.gcash_qr || null,
    bannerTheme:
      profile.banner_theme ||
      "linear-gradient(135deg, #FFFFFF 0%, #FFF7D6 100%)",
    avatarMode: profile.avatar_mode || "initials",
    aiSeed: profile.ai_seed || profile.id || "default",
  };

  return (
    <UserViewClient
      initialUser={userProps}
      socialLinks={fetchedSocialLinks || []}
      tasks={userTasks}
    />
  );
}
