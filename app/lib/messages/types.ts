/**
 * types.ts
 *
 * Main component module in features path: app/lib/messages/types.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

export type Conversation = {
    id: string;
    created_at: string;
    updated_at: string;
    last_message: string | null;
    last_message_at: string | null;
};

export type ConversationParticipant = {
    id: string;
    conversation_id: string;
    user_id: string;
    role: string;
};

export type Message = {
    id: string;
    conversation_id: string;
    topic: string | null;
    sender_id: string;
    message: string;
    extension: string | null;
    message_type: string | null;
    payload: Record<string, unknown> | null;
    event: string | null;
    created_at: string;
    edited: boolean;
    private: boolean;
    profiles?: {
        full_name: string;
        avatar_url: string;
    } | null;
};

export type MessageRead = {
    id: string;
    message_id: string;
    user_id: string;
    read_at: string;
};

export type CreateConversationResult = {
    conversation: Conversation;
    created: boolean;
};

export type SendMessageInput = {
    conversationId: string;
    senderId: string;
    message: string;
    topic?: string;
    extension?: string;
    messageType?: string;
    payload?: Record<string, unknown>;
    event?: string;
    private?: boolean;
};

export type SendMessageResult = {
    success: boolean;
    message: Message;
};

export type GetMessagesResult = {
    messages: Message[];
};

export type GetConversationResult = {
    conversation: Conversation | null;
};

export type MarkAsReadResult = {
    success: boolean;
};
