/**
 * attendance.utils.ts
 *
 * Main component module in features path: app/(user)/attendance/attendance.utils.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\attendance.utils.ts

/**
 * Executes operations logic for parseTimeToMinutes.
 *
 * @param timeStr: string | null
 * @returns State operations sequence.
 */
export function parseTimeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hrs = Number(match12[1]);
    const mins = Number(match12[2]);
    const ampm = match12[3];
    if (ampm === "PM" && hrs < 12) hrs += 12;
    if (ampm === "AM" && hrs === 12) hrs = 0;
    return hrs * 60 + mins;
  }
  const parts = clean.split(":").map(Number);
  if (parts.length >= 2) {
    const hrs = parts[0];
    const mins = parts[1];
    return hrs * 60 + mins;
  }
  return 0;
}
/**
 * Executes operations logic for calculateHours.
 *
 * @param 
  inTime: string | null,
  outTime: string | null,
  breakOut: string | null,
  breakIn: string | null

 * @returns State operations sequence.
 */
export function calculateHours(
  inTime: string | null,
  outTime: string | null,
  breakOut: string | null,
  breakIn: string | null
): number {
  if (!inTime) return 0;
  let totalMins = 0;
  const inMins = parseTimeToMinutes(inTime);
  const outMins = outTime ? parseTimeToMinutes(outTime) : 0;
  const boMins = breakOut ? parseTimeToMinutes(breakOut) : 0;
  const biMins = breakIn ? parseTimeToMinutes(breakIn) : 0;
  if (boMins > inMins) {
    totalMins += (boMins - inMins);
  }
  if (outMins > 0) {
    const startAfternoon = biMins > 0 ? biMins : (boMins > 0 ? boMins : inMins);
    if (outMins > startAfternoon) {
      totalMins += (outMins - startAfternoon);
    }
  }
  return Math.round((totalMins / 60) * 100) / 100;
}
/**
 * Executes operations logic for formatTime12h.
 *
 * @param timeStr: string | null
 * @returns State operations sequence.
 */
export function formatTime12h(timeStr: string | null): string {
  if (!timeStr) return "--";
  const clean = timeStr.trim();
  if (clean.includes("AM") || clean.includes("PM")) {
    return clean;
  }
  const parts = clean.split(":");
  if (parts.length >= 2) {
    let hrs = Number(parts[0]);
    const minsStr = parts[1].padStart(2, "0");
    const ampm = hrs >= 12 ? "PM" : "AM";
    let displayHrs = hrs % 12;
    if (displayHrs === 0) displayHrs = 12;
    return `${displayHrs}:${minsStr} ${ampm}`;
  }
  return clean;
}
/**
 * Executes operations logic for getStatus.
 *
 * @param inTime: string | null, outTime: string | null
 * @returns State operations sequence.
 */
export function getStatus(inTime: string | null, outTime: string | null): string {
  if (outTime) return "Completed";
  if (!inTime) return "Absent";
  const mins = parseTimeToMinutes(inTime);
  const cutoff = 9 * 60;
  return mins > cutoff ? "Late" : "Present";
}
/**
 * Executes operations logic for formatDateString.
 *
 * @param date: Date
 * @returns State operations sequence.
 */
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
