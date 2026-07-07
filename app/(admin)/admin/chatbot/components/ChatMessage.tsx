"use client";

/**
 * ChatMessage.tsx
 *
 * Main component module in features path: app/(admin)/admin/chatbot/components/ChatMessage.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/chatbot/components/ChatMessage.module.css";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import { Copy, Check, RotateCcw } from "lucide-react";

  // ======================================================
// State Initialization & Hooks
// ======================================================
import { useState } from "react";

interface ChatMessageProps {
    message: ChatMessageType;
}

/**
 * ChatMessage
 *
 * Renders the ChatMessage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for ChatMessage.
 *
 * @param { message }: ChatMessageProps
 * @returns State operations sequence.
 */
export default function ChatMessage({ message }: ChatMessageProps) {
    const [copied, setCopied] = useState(false);
    const isAssistant = message.role === "assistant";

    /**
 * Executes operations logic for handleCopy.
 *
 * 
 * @returns State operations sequence.
 */
async function handleCopy() {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className={`${styles.container_8} ${isAssistant ? "flex-row" : "flex-row-reverse"} group`}>
            <div
                className={`${styles.container_9} ${isAssistant
                        ? "bg-[#F4C542] shadow-[#F4C542]/30"
                        : "bg-black"
                    }`}
            >
                {isAssistant ? (
                    <svg viewBox="0 0 100 100" className={styles.div_0}>
                        <defs>
                            <mask id={`msg-mask-${message.id}`}>
                                <rect x="0" y="0" width="100" height="100" fill="white" />
                                <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
                                <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
                                <path d="M 30 20 Q 46 55 30 85" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
                                <path d="M 50 15 Q 65 55 50 88" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
                                <path d="M 68 22 Q 78 55 68 83" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
                            </mask>
                        </defs>
                        <circle cx="50" cy="52" r="38" fill="black" mask={`url(#msg-mask-${message.id})`} />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" className={styles.div_1} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                )}
            </div>

            <div className={`${styles.container_10} ${isAssistant ? "items-start" : "items-end"}`}>
                <div
                    className={`${styles.text_11} ${isAssistant
                            ? "bg-white border border-black/8 text-black rounded-2xl rounded-bl-md shadow-sm"
                            : "bg-black text-white rounded-2xl rounded-br-md shadow-md"
                        }`}
                >
                    {message.content}
                </div>

                {isAssistant && (
                    <div className={`${styles.table_2} group`}>
                        <button
                            onClick={handleCopy}
                            className={styles.table_3}
                        >
                            {copied ? (
                                <><Check size={9} className={styles.text_4} /><span className={styles.text_5}>Copied</span></>
                            ) : (
                                <><Copy size={9} /><span>Copy</span></>
                            )}
                        </button>
                        <span className={styles.text_6}>·</span>
                        <button className={styles.table_7}>
                            <RotateCcw size={9} />
                            <span>Retry</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
