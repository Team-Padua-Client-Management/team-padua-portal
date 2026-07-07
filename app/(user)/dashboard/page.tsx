/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/dashboard/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { redirect } from "next/navigation";

/**
 * DashboardRedirect
 *
 * Renders the DashboardRedirect interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for DashboardRedirect.
 *
 * 
 * @returns State operations sequence.
 */
export default function DashboardRedirect() {
    redirect("/dashboard/personal");
}
