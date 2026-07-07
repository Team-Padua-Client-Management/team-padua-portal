"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/chatbot/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/chatbot/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================
import { useState, useCallback, useRef } from "react";
import { ChatMessage } from "@/lib/types";
import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";

/**
 * ChatbotPage
 *
 * Renders the ChatbotPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for ChatbotPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function ChatbotPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const currentMessagesRef = useRef<ChatMessage[]>([]);

    const sendMessage = useCallback(
        async (overrideInput?: string) => {
            const text = (overrideInput ?? input).trim();
            if (!text || isLoading) return;

            const userMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: text,
            };

            const updatedMessages = [...currentMessagesRef.current, userMessage];
            currentMessagesRef.current = updatedMessages;
            setMessages(updatedMessages);

            setInput("");
            setIsLoading(true);
            setError(null);

            abortControllerRef.current = new AbortController();

            try {
                const res = await fetch("/api/chatbot", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: updatedMessages }),
                    signal: abortControllerRef.current.signal,
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error || "Something went wrong.");
                }

                const assistantMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: data.reply,
                };

                const nextMessages = [...currentMessagesRef.current, assistantMessage];
                currentMessagesRef.current = nextMessages;
                setMessages(nextMessages);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                const message = err instanceof Error ? err.message : "Failed to reach the server.";
                setError(message);
            } finally {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [input, isLoading]
    );

    /**
 * Executes operations logic for handleStop.
 *
 * 
 * @returns State operations sequence.
 */
function handleStop() {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsLoading(false);
    }

    /**
 * Executes operations logic for handleClear.
 *
 * 
 * @returns State operations sequence.
 */
function handleClear() {
        if (isLoading) handleStop();
        setMessages([]);
        currentMessagesRef.current = [];
        setInput("");
        setError(null);
    }

    /**
 * Executes operations logic for handleSuggestion.
 *
 * @param text: string
 * @returns State operations sequence.
 */
function handleSuggestion(text: string) {
        sendMessage(text);
    }

    return (
        <div className={styles.container_0}>
            <ChatHeader onClear={handleClear} messageCount={messages.length} />

            <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onSuggestion={handleSuggestion}
            />

            {error && (
                <div className={styles.text_1}>
                    <span className={styles.div_2}>⚠</span>
                    <span>{error}</span>
                </div>
            )}

            <ChatInput
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                onStop={handleStop}
                isLoading={isLoading}
            />
        </div>
    );
}
