/**
 * createConversation.ts
 *
 * Main component module in features path: app/lib/messages/createConversation.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\createConversation.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Executes operations logic for createConversation.
 *
 * @param targetUserId?: string
 * @returns State operations sequence.
 */
export async function createConversation(targetUserId?: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) throw new Error('Profile not found');

    let adminId = '';
    let userId = '';

    if (profile.role === 'Admin') {
        if (!targetUserId) throw new Error('Target user ID required for Admin to initiate a conversation');
        adminId = user.id;
        userId = targetUserId;
    } else {
        userId = user.id;
        const { data: adminProfile, error: adminError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'Admin')
            .single();

        if (adminError || !adminProfile) throw new Error('Administrator not found');
        adminId = adminProfile.id;
    }

    const conversationKey = `${adminId}:${userId}`;

    const { data: existingConversation, error: fetchError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('conversation_key', conversationKey)
        .maybeSingle();

    if (fetchError) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(fetchError);
        console.error(JSON.stringify(fetchError, null, 2));
        throw new Error(fetchError.message);
    }
    if (existingConversation) return existingConversation;

    const { data: newConversation, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
            conversation_key: conversationKey
        })
        .select('*')
        .single();

    if (createError || !newConversation) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(createError);
        console.error(JSON.stringify(createError, null, 2));
        throw new Error(createError?.message || 'Failed to create conversation');
    }

    const participants = [
        { conversation_id: newConversation.id, user_id: adminId, role: 'admin' },
        { conversation_id: newConversation.id, user_id: userId, role: 'user' }
    ];

    const { error: participantError } = await supabaseAdmin
        .from('conversation_participants')
        .insert(participants);

    if (participantError) {
        console.error("========== SUPABASE ERROR ==========");
        console.error(participantError);
        console.error(JSON.stringify(participantError, null, 2));
        await supabaseAdmin.from('conversations').delete().eq('id', newConversation.id);
        throw new Error(participantError.message);
    }

    return newConversation;
}
