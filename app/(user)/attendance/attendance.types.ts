/**
 * attendance.types.ts
 *
 * Main component module in features path: app/(user)/attendance/attendance.types.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\attendance.types.ts

export interface AttendanceRecord {
  id?: string;
  user_id?: string;
  attendance_date: string;
  time_in: string | null;
  break_out: string | null;
  break_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  daily_record: string | null;
  admin_feedback: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}
export interface DashboardStats {
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: number;
  averageHours: number;
  currentStatus: string;
}
