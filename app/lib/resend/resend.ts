/**
 * resend.ts
 *
 * Main component module in features path: app/lib/resend/resend.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\lib\resend\resend.ts

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
