/**
 * sendMessage.ts
 *
 * Main component module in features path: app/lib/messages/sendMessage.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\sendMessage.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

interface SendMessagePayload {
    conversationId: string;
    message: string;
    topic?: string;
    messageType?: 'text' | 'image' | 'pdf' | 'document' | 'file';
    extension?: string;
    payload?: Record<string, unknown>;
    event?: string;
}

/**
 * Executes operations logic for sendMessage.
 *
 * @param {
    conversationId,
    message,
    topic = '',
    messageType = 'text',
    extension = '',
    payload = {},
    event = ''
}: SendMessagePayload
 * @returns State operations sequence.
 */
export async function sendMessage({
    conversationId,
    message,
    topic = '',
    messageType = 'text',
    extension = '',
    payload = {},
    event = ''
}: SendMessagePayload) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) throw new Error('Profile not found');

    if (profile.role !== 'Admin') {
        const { data: participant, error: partError } = await supabaseAdmin
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (partError || !participant) throw new Error('Access denied to conversation');
    }

    const { data: insertedMessage, error: insertError } = await supabaseAdmin
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            message,
            message_type: messageType
        })
        .select('*')
        .single();

    if (insertError || !insertedMessage) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(insertError);
        console.error(JSON.stringify(insertError, null, 2));
        throw new Error(insertError?.message || 'Failed to insert message');
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
        .from('conversations')
        .update({
            last_message: message,
            last_message_at: now,
            updated_at: now
        })
        .eq('id', conversationId);

    if (updateError) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(updateError);
        console.error(JSON.stringify(updateError, null, 2));
        throw new Error(updateError.message);
    }

    return insertedMessage;
}
