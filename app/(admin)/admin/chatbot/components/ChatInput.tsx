"use client";

/**
 * ChatInput.tsx
 *
 * Main component module in features path: app/(admin)/admin/chatbot/components/ChatInput.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/chatbot/components/ChatInput.module.css";

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import { useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Square, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop?: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

/**
 * ChatInput
 *
 * Renders the ChatInput interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for ChatInput.
 *
 * @param {
    value,
    onChange,
    onSend,
    onStop,
    isLoading,
    disabled,
}: ChatInputProps
 * @returns State operations sequence.
 */
export default function ChatInput({
    value,
    onChange,
    onSend,
    onStop,
    isLoading,
    disabled,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }, [value]);

    useEffect(() => {
        if (!isLoading) {
            textareaRef.current?.focus();
        }
    }, [isLoading]);

    /**
 * Executes operations logic for handleKeyDown.
 *
 * @param e: KeyboardEvent<HTMLTextAreaElement>
 * @returns State operations sequence.
 */
function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && value.trim()) {
                onSend();
            }
        }
    }

    const canSend = value.trim().length > 0 && !isLoading && !disabled;

    return (
        <div className={styles.div_0}>
            <div
                className={`${styles.table_9} ${isLoading
                        ? "border-[#F4C542] shadow-[#F4C542]/20 shadow-md"
                        : value.trim()
                            ? "border-black/20 shadow-md"
                            : "border-black/10 focus-within:border-black/25 focus-within:shadow-md"
                    }`}
            >
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Padua AI anything…"
                    rows={1}
                    disabled={isLoading || disabled}
                    className={styles.table_1}
                />

                <div className={styles.container_2}>
                    <div className={styles.container_3}>
                        <button
                            type="button"
                            className={styles.table_4}
                            title="Attach file"
                        >
                            <Paperclip size={13} strokeWidth={1.6} />
                        </button>
                        <button
                            type="button"
                            className={styles.table_5}
                            title="Voice input"
                        >
                            <Mic size={13} strokeWidth={1.6} />
                        </button>
                    </div>

                    <div className={styles.container_6}>
                        {value.length > 0 && (
                            <span className={styles.text_7}>
                                {value.length}
                            </span>
                        )}
                        <button
                            onClick={isLoading ? onStop : onSend}
                            disabled={isLoading ? false : !canSend}
                            title={isLoading ? "Stop generating" : "Send message"}
                            className={`${styles.table_10} ${isLoading
                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/25"
                                    : canSend
                                        ? "bg-[#F4C542] text-black hover:bg-[#e6b800] shadow-md shadow-[#F4C542]/40 active:scale-95"
                                        : "bg-black/6 text-black/25 cursor-not-allowed"
                                }`}
                        >
                            {isLoading
                                ? <Square size={12} fill="currentColor" />
                                : <ArrowUp size={14} strokeWidth={2.5} />
                            }
                        </button>
                    </div>
                </div>
            </div>

            <p className={styles.table_8}>
                Enter to send · Shift+Enter for new line · AI may make mistakes
            </p>
        </div>
    );
}
