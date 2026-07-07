"use client";

/**
 * ChatHeader.tsx
 *
 * Main component module in features path: app/(admin)/admin/chatbot/components/ChatHeader.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/chatbot/components/ChatHeader.module.css";
import { Trash2, ChevronDown, Cpu } from "lucide-react";

interface ChatHeaderProps {
    onClear: () => void;
    messageCount: number;
}

/**
 * ChatHeader
 *
 * Renders the ChatHeader interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for ChatHeader.
 *
 * @param { onClear, messageCount }: ChatHeaderProps
 * @returns State operations sequence.
 */
export default function ChatHeader({ onClear, messageCount }: ChatHeaderProps) {
    return (
        <div className={styles.container_0}>
            <div className={styles.container_1}>
                <div className={styles.container_2}>
                    <svg viewBox="0 0 100 100" className={styles.div_3}>
                        <defs>
                            <radialGradient id="hdr-globe" cx="35%" cy="35%" r="65%">
                                <stop offset="0%" stopColor="#fff8dc" />
                                <stop offset="50%" stopColor="#F4C542" />
                                <stop offset="100%" stopColor="#7C5B00" />
                            </radialGradient>
                            <mask id="hdr-mask">
                                <rect x="0" y="0" width="100" height="100" fill="white" />
                                <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
                                <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
                                <path d="M 30 20 Q 46 55 30 85" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
                                <path d="M 50 15 Q 65 55 50 88" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
                                <path d="M 68 22 Q 78 55 68 83" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
                            </mask>
                        </defs>
                        <circle cx="50" cy="52" r="38" fill="white" mask="url(#hdr-mask)" />
                    </svg>
                </div>

                <div>
                    <div className={styles.container_4}>
                        <span className={styles.table_5}>Padua AI</span>
                        <span className={styles.table_6}>
                            Beta
                        </span>
                    </div>
                    <div className={styles.container_7}>
                        <span className={styles.div_8} />
                        <p className={styles.text_9}>Llama 3 · Local</p>
                    </div>
                </div>
            </div>

            <div className={styles.container_10}>
                {messageCount > 0 && (
                    <button
                        onClick={onClear}
                        className={styles.table_11}
                    >
                        <Trash2 size={11} />
                        Clear
                    </button>
                )}
                <button className={styles.table_12}>
                    <Cpu size={10} />
                    Model
                    <ChevronDown size={10} />
                </button>
            </div>
        </div>
    );
}
