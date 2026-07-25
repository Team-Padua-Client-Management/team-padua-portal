import { supabase } from '@src/lib/supabase/client';

export interface CreateNotificationParams {
  title: string;
  description: string;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  userId?: string | null;
}

/**
 * Reusable helper to create system notifications across all functional modules.
 * Called only after successful database mutations.
 */
export async function createNotification({
  title,
  description,
  type = 'info',
  userId = null,
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          title,
          description,
          type,
          user_id: userId,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        // Table doesn't exist yet, fail gracefully without console noise
        return { success: false, error: 'Notifications table not configured' };
      }
      console.error('Failed to create notification:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Exception in createNotification:', err);
    return { success: false, error: String(err) };
  }
}

export default createNotification;
