"use client";

/**
 * ChatWindow.tsx
 *
 * Main component module in features path: app/(admin)/admin/chatbot/components/ChatWindow.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/chatbot/components/ChatWindow.module.css";

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";

interface ChatWindowProps {
    messages: ChatMessageType[];
    isLoading: boolean;
    onSuggestion: (text: string) => void;
}

/**
 * ChatWindow
 *
 * Renders the ChatWindow interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for ChatWindow.
 *
 * @param { messages, isLoading, onSuggestion }: ChatWindowProps
 * @returns State operations sequence.
 */
export default function ChatWindow({ messages, isLoading, onSuggestion }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    if (messages.length === 0 && !isLoading) {
        return <EmptyState onSuggestion={onSuggestion} />;
    }

    return (
        <div className={styles.table_0}>
            {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={bottomRef} className={styles.div_1} />
        </div>
    );
}
