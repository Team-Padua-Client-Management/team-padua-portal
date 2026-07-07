"use client";

/**
 * EmptyState.tsx
 *
 * Main component module in features path: app/(admin)/admin/chatbot/components/EmptyState.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/chatbot/components/EmptyState.module.css";
import { Bot, Zap, ShieldCheck, Code2 } from "lucide-react";

const SUGGESTIONS = [
  { icon: Zap, label: "Explain quantum computing in simple terms" },
  { icon: Code2, label: "Write a Python function to reverse a linked list" },
  { icon: ShieldCheck, label: "What are the best practices for REST API design?" },
];

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

/**
 * EmptyState
 *
 * Renders the EmptyState interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for EmptyState.
 *
 * @param { onSuggestion }: EmptyStateProps
 * @returns State operations sequence.
 */
export default function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className={styles.input_0}>
      <div className={styles.container_1}>
        <Bot size={26} className={styles.text_2} />
      </div>

      <h2 className={styles.text_3}>How can I help?</h2>
      <p className={styles.text_4}>
        Ask me anything — I'm running locally on your machine via Ollama.
      </p>

      <div className={styles.container_5}>
        {SUGGESTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => onSuggestion(label)}
            className={`${styles.table_6} group`}
          >
            <Icon size={15} className={`${styles.table_7} group`} />
            <span className={styles.text_8}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
