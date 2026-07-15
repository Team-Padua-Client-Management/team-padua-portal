/**
 * auth.ts
 *
 * Main component module in features path: app/action/auth.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

/**
 * Executes operations logic for SignIn.
 *
 * @param formData: FormData
 * @returns State operations sequence.
 */
export const SignIn = async (formData: FormData) => {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/admin/dashboard");
};

/**
 * Executes operations logic for SignUp.
 *
 * @param formData: FormData
 * @returns State operations sequence.
 */
export const SignUp = async (formData: FormData) => {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const phone = formData.get("phone") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Notify admins
  await supabase.from("notifications").insert({
    title: "New Member Registration",
    description: `A new member (${name || email}) has just signed up and is pending approval.`,
    type: "user",
    is_read: false
  });

  return { success: true, email };
};

/**
 * Executes operations logic for SignOut.
 *
 * 
 * @returns State operations sequence.
 */
export const SignOut = async () => {
  const supabase = await createClient();

  await /* Terminate authenticated security token session */ supabase.auth.signOut();

  redirect("/auth/login");
};
