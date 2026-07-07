/**
 * getConversation.ts
 *
 * Main component module in features path: app/lib/messages/getConversation.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\getConversation.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Executes operations logic for getConversation.
 *
 * @param targetUserId?: string
 * @returns State operations sequence.
 */
export async function getConversation(targetUserId?: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'Admin')
        .single();

    if (adminError || !adminProfile) throw new Error('Administrator not found');

    let conversationKey = '';

    if (user.id === adminProfile.id) {
        if (!targetUserId) throw new Error('Target user ID required for Admin query');
        conversationKey = `${user.id}:${targetUserId}`;
    } else {
        conversationKey = `${adminProfile.id}:${user.id}`;
    }

    const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('conversation_key', conversationKey)
        .maybeSingle();

    if (error) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(error);
        console.error(JSON.stringify(error, null, 2));
        throw new Error(error.message);
    }
    return conversation;
}
