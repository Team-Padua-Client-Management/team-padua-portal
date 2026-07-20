// lib/statDisplay.ts
// Central place for "what do we show when the real number isn't loaded yet".
// Real data always wins. If it's not there, we show a clearly-labeled
// illustrative number instead of a blank "—", so the page never looks broken.

export const ILLUSTRATIVE_STATS = {
    totalClients: 120,
    activeClients: 112,
    acrRequests: 3,
    teamMembers: 14,
    upcomingEvents: 5,
    birthdaysThisMonth: 8,
};

export interface StatDisplay {
    value: string;
    isSample: boolean;
}

/**
 * Returns the real value if present (> 0), otherwise an illustrative
 * fallback flagged with isSample so the UI can show a small "sample" tag.
 */
export function getStat(real: number, fallback: number, suffix = ''): StatDisplay {
    if (real > 0) return { value: `${real}${suffix}`, isSample: false };
    return { value: `${fallback}${suffix}`, isSample: true };
}