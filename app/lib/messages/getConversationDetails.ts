/**
 * getConversationDetails.ts
 *
 * Main component module in features path: app/lib/messages/getConversationDetails.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\getConversationDetails.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Executes operations logic for getConversationDetails.
 *
 * 
 * @returns State operations sequence.
 */
export async function getConversationDetails() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Fetch all conversations where the key starts with the current admin's ID
    const { data: conversations, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .like('conversation_key', `${user.id}:%`);

    if (error || !conversations) {
        console.error('Error fetching conversations:', error);
        return {};
    }

    const details: Record<string, {
        id: string;
        last_message: string | null;
        last_message_at: string | null;
        unreadCount: number;
    }> = {};

    await Promise.all(conversations.map(async (conv) => {
        // Extract the target user's ID from the conversation key "adminId:userId"
        const parts = conv.conversation_key.split(':');
        if (parts.length !== 2) return;
        const targetUserId = parts[1];

        // Fetch unread count for the current admin (sender_id != admin.id and not read by admin)
        const { data: messages } = await supabaseAdmin
            .from('messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id);

        let unreadCount = 0;
        if (messages && messages.length > 0) {
            const messageIds = messages.map(m => m.id);
            const { data: reads } = await supabaseAdmin
                .from('message_reads')
                .select('message_id')
                .in('message_id', messageIds)
                .eq('user_id', user.id);

            const readMessageIds = new Set(reads?.map(r => r.message_id) || []);
            unreadCount = messageIds.filter(id => !readMessageIds.has(id)).length;
        }

        details[targetUserId] = {
            id: conv.id,
            last_message: conv.last_message,
            last_message_at: conv.last_message_at,
            unreadCount
        };
    }));

    return details;
}
