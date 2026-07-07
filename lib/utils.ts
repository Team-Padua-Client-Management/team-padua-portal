/**
 * utils.ts
 *
 * Main component module in features path: lib/utils.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Executes operations logic for cn.
 *
 * @param ...inputs: ClassValue[]
 * @returns State operations sequence.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
