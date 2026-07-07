/**
 * client.ts
 *
 * Main component module in features path: lib/client.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\lib\client.ts

import { createBrowserClient } from '@supabase/ssr'

/**
 * Executes operations logic for createClient.
 *
 * 
 * @returns State operations sequence.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
