/**
 * getAdminConversationDetails.ts
 *
 * Main component module in features path: app/lib/messages/getAdminConversationDetails.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\getAdminConversationDetails.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Executes operations logic for getAdminConversationDetails.
 *
 * 
 * @returns State operations sequence.
 */
export async function getAdminConversationDetails() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Get the Admin profile
    const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'Admin')
        .single();

    if (adminError || !adminProfile) {
        console.error('Admin profile not found:', adminError);
        return null;
    }

    const conversationKey = `${adminProfile.id}:${user.id}`;

    // Fetch the conversation
    const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('conversation_key', conversationKey)
        .maybeSingle();

    if (convError || !conversation) {
        return null;
    }

    // Fetch unread count for the user (messages in this conversation where sender_id = adminProfile.id and not read by user)
    const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('id')
        .eq('conversation_id', conversation.id)
        .eq('sender_id', adminProfile.id);

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

    return {
        id: conversation.id,
        last_message: conversation.last_message,
        last_message_at: conversation.last_message_at,
        unreadCount
    };
}
