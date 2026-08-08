/**
 * resend.ts
 *
 * Responsibilities:
 * - Initializes Resend client with process.env.RESEND_API_KEY.
 * - Provides fallback during build evaluation when environment variable is not present.
 */

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");
