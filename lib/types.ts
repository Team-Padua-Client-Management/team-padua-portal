/**
 * types.ts
 *
 * Main component module in features path: lib/types.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
}

export interface OllamaMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface OllamaRequest {
    model: string;
    messages: OllamaMessage[];
    stream?: boolean;
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: "assistant";
        content: string;
    };
    done: boolean;
}

export interface ChatRequest {
    messages: ChatMessage[];
}
