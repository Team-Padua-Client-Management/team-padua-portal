/**
 * use-chat-scroll.tsx
 *
 * Main component module in features path: hooks/use-chat-scroll.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\hooks\use-chat-scroll.tsx

import { useCallback, useRef } from 'react'

/**
 * Executes operations logic for useChatScroll.
 *
 * 
 * @returns State operations sequence.
 */
export function useChatScroll() {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  return { containerRef, scrollToBottom }
}
