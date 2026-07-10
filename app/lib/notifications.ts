import { supabaseAdmin } from "./supabase/admin";

interface CreateNotificationParams {
  title: string;
  description: string;
  type?: string;
  userId?: string | null;
}

/**
 * Creates a notification in the system.
 * If userId is null, it broadcasts to all users (global).
 */
export async function createNotification({
  title,
  description,
  type = "info",
  userId = null,
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        title,
        description,
        type,
        user_id: userId,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error("Supabase notification insert error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Exception in createNotification:", err);
    return { success: false, error: String(err) };
  }
}
