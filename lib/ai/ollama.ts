/**
 * ollama.ts
 *
 * Main component module in features path: lib/ai/ollama.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import {
    ChatMessage,
    OllamaMessage,
    OllamaRequest,
    OllamaResponse,
} from "@/lib/types";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3:latest";

/**
 * Executes operations logic for toOllamaMessages.
 *
 * @param messages: ChatMessage[]
 * @returns State operations sequence.
 */
function toOllamaMessages(messages: ChatMessage[]): OllamaMessage[] {
    return messages.map((message) => ({
        role: message.role,
        content: message.content,
    }));
}

/**
 * Executes operations logic for chatWithOllama.
 *
 * @param 
    messages: ChatMessage[]

 * @returns State operations sequence.
 */
export async function chatWithOllama(
    messages: ChatMessage[]
): Promise<string> {
    const body: OllamaRequest = {
        model: MODEL,
        stream: false,
        messages: toOllamaMessages(messages),
    };

    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to connect to Ollama.");
    }

    const data: OllamaResponse = await response.json();

    return data.message.content;
}
