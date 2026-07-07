/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/messages/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\messages\page.tsx
import { createClient } from "@/app/lib/supabase/server";
import MessagesClient from "./MessagesClient";

/**
 * Executes operations logic for MessagesPage.
 *
 * 
 * @returns State operations sequence.
 */
export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return <MessagesClient userId={user.id} username={user.user_metadata?.full_name ?? user.email ?? "User"} />;
}
