/**
 * AttendanceTable.tsx
 *
 * Main component module in features path: app/(user)/attendance/AttendanceTable.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\AttendanceTable.tsx

"use client";

import styles from "@/styles/user/attendance/AttendanceTable.module.css";
import React from "react";
import { AttendanceRecord } from "./attendance.types";
import { formatTime12h } from "./attendance.utils";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onSelectDate: (dateStr: string) => void;
}

/**
 * AttendanceTable
 *
 * Renders the AttendanceTable interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceTable.
 *
 * @param { records, onSelectDate }: AttendanceTableProps
 * @returns State operations sequence.
 */
export default function AttendanceTable({ records, onSelectDate }: AttendanceTableProps) {
  return (
    <div className={styles.card_0}>
      <table className={styles.card_1}>
        <thead>
          <tr className={styles.div_2}>
            <th className={styles.table_3}>Date</th>
            <th className={styles.table_4}>In</th>
            <th className={styles.table_5}>Break Out</th>
            <th className={styles.table_6}>Break In</th>
            <th className={styles.table_7}>Out</th>
            <th className={styles.table_8}>Hours</th>
            <th className={styles.table_9}>Daily Record</th>
            <th className={styles.table_10}>Feedback</th>
            <th className={styles.table_11}>Status</th>
          </tr>
        </thead>
        <tbody className={styles.div_12}>
          {records.length === 0 ? (
            <tr>
              <td colSpan={9} className={styles.card_13}>
                No attendance entries found in ledger
              </td>
            </tr>
          ) : (
            records.map((rec) => (
              <tr
                key={rec.attendance_date}
                onClick={() => onSelectDate(rec.attendance_date)}
                className={styles.table_14}
              >
                <td className={styles.text_15}>{rec.attendance_date}</td>
                <td className={styles.text_16}>{formatTime12h(rec.time_in)}</td>
                <td className={styles.text_17}>{formatTime12h(rec.break_out)}</td>
                <td className={styles.text_18}>{formatTime12h(rec.break_in)}</td>
                <td className={styles.text_19}>{formatTime12h(rec.time_out)}</td>
                <td className={styles.text_20}>
                  {rec.total_hours !== null ? rec.total_hours.toFixed(2) : "0.00"}
                </td>
                <td className={styles.table_21}>
                  {rec.daily_record || "—"}
                </td>
                <td className={styles.table_22}>
                  {rec.admin_feedback || "—"}
                </td>
                <td className={styles.text_23}>
                  <span className={`${styles.table_24} ${
                    rec.status === "Present"
                      ? "bg-[#FFF7D6] dark:bg-[#2E2818]/60 text-black dark:text-[#F4C542] border border-[#F4C542]/40"
                      : rec.status === "Late"
                      ? "bg-[#FFF7D6] dark:bg-[#2E2818]/40 text-[#A3843B] dark:text-[#F4C542] border border-amber-200/20"
                      : rec.status === "Completed"
                      ? "bg-[#F0FDF4] dark:bg-[#163420]/30 text-[#166534] dark:text-[#4ade80] border border-[#DCFCE7]/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
