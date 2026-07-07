/**
 * subscribeMessages.ts
 *
 * Main component module in features path: app/lib/messages/subscribeMessages.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\messages\subscribeMessages.ts

import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import type { Message } from "./types";

/**
 * Executes operations logic for subscribeMessages.
 *
 * @param 
    conversationId: string,
    onEvent: (payload: {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        newRecord: Message | null;
        oldRecord: Message | null;
    }
 * @returns State operations sequence.
 */
export function subscribeMessages(
    conversationId: string,
    onEvent: (payload: {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        newRecord: Message | null;
        oldRecord: Message | null;
    }) => void,
    onStatus?: (status: string, err?: Error) => void
) {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload: RealtimePostgresChangesPayload<Message>) => {
                onEvent({
                    eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
                    newRecord: (payload.new as Message) ?? null,
                    oldRecord: (payload.old as Message) ?? null,
                });
            }
        )
        .subscribe((status, err) => {
            console.log(`Supabase Realtime status [messages:${conversationId}]:`, status, err);
            if (onStatus) {
                onStatus(status, err);
            }
        });

    return () => {
        void supabase.removeChannel(channel);
    };
}
