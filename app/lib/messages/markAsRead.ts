/**
 * markAsRead.ts
 *
 * Main component module in features path: app/lib/messages/markAsRead.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\markAsRead.ts
'use server';

import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Executes operations logic for markAsRead.
 *
 * @param messageId: string
 * @returns State operations sequence.
 */
export async function markAsRead(messageId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Check if the read receipt already exists
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('message_reads')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (fetchError) {
        console.error("========== SUPABASE FETCH ERROR ==========");
        console.error(fetchError);
        throw new Error(fetchError.message);
    }

    let readReceipt;
    let error;

    if (existing) {
        const { data, error: updateError } = await supabaseAdmin
            .from('message_reads')
            .update({
                read_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select('*')
            .single();
        
        readReceipt = data;
        error = updateError;
    } else {
        const { data, error: insertError } = await supabaseAdmin
            .from('message_reads')
            .insert({
                message_id: messageId,
                user_id: user.id,
                read_at: new Date().toISOString()
            })
            .select('*')
            .single();

        readReceipt = data;
        error = insertError;
    }

    if (error) {
        console.error("========== SUPABASE WRITE ERROR ==========");
        console.error(error);
        console.error(JSON.stringify(error, null, 2));
        throw new Error(error.message);
    }
    return readReceipt;
}
