/**
 * AttendanceTimeline.tsx
 *
 * Main component module in features path: app/(user)/attendance/AttendanceTimeline.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\AttendanceTimeline.tsx

"use client";

import styles from "@/styles/user/attendance/AttendanceTimeline.module.css";
import React from "react";
import { formatTime12h } from "./attendance.utils";

interface AttendanceTimelineProps {
  timeIn: string;
  breakOut: string;
  breakIn: string;
  timeOut: string;
}

/**
 * AttendanceTimeline
 *
 * Renders the AttendanceTimeline interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceTimeline.
 *
 * @param { timeIn, breakOut, breakIn, timeOut }: AttendanceTimelineProps
 * @returns State operations sequence.
 */
export default function AttendanceTimeline({ timeIn, breakOut, breakIn, timeOut }: AttendanceTimelineProps) {
  const events = [
    { label: "Time In", val: timeIn },
    { label: "Break Out", val: breakOut },
    { label: "Break In", val: breakIn },
    { label: "Time Out", val: timeOut }
  ];

  return (
    <div className={styles.card_0}>
      <div className={styles.div_1}>
        {events.map((ev) => {
          const isDone = !!ev.val;
          return (
            <div key={ev.label} className={styles.div_2}>
              <div className={`${styles.card_4} ${
                isDone
                  ? "border-[#F4C542] bg-[#F4C542]"
                  : "border-border"
              }`} />
              <div>
                <span className={styles.table_3}>{ev.label}</span>
                <span className={`${styles.text_5} ${isDone ? "text-foreground font-semibold" : "text-muted-foreground/45"}`}>
                  {isDone ? `✔ ${formatTime12h(ev.val)}` : "— : —"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
