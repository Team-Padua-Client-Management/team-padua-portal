/**
 * getMessages.ts
 *
 * Main component module in features path: app/lib/messages/getMessages.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\getMessages.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Executes operations logic for getMessages.
 *
 * @param conversationId: string
 * @returns State operations sequence.
 */
export async function getMessages(conversationId: string) {
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

        if (partError || !participant) throw new Error('Access denied to conversation history');
    }

    const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(error);
        console.error(JSON.stringify(error, null, 2));
        throw new Error(error.message);
    }

    if (!messages || messages.length === 0) {
        return [];
    }

    // Perform manual client-side join on profiles since PostgREST schema cache does not have the relationship
    const senderIds = Array.from(new Set(messages.map((m) => m.sender_id)));
    const { data: profiles, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', senderIds);

    if (profileErr) {
        console.error('getMessages profiles fetch error:', profileErr);
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const messagesWithProfiles = messages.map((m) => ({
        ...m,
        profiles: profileMap.get(m.sender_id) || null
    }));

    return messagesWithProfiles;
}
