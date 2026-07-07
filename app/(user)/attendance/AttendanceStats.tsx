/**
 * AttendanceStats.tsx
 *
 * Main component module in features path: app/(user)/attendance/AttendanceStats.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\AttendanceStats.tsx

"use client";

import styles from "@/styles/user/attendance/AttendanceStats.module.css";
import React, { useMemo } from "react";
import { AttendanceRecord } from "./attendance.types";

interface AttendanceStatsProps {
  records: AttendanceRecord[];
}

/**
 * AttendanceStats
 *
 * Renders the AttendanceStats interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceStats.
 *
 * @param { records }: AttendanceStatsProps
 * @returns State operations sequence.
 */
export default function AttendanceStats({ records }: AttendanceStatsProps) {
  const weekly = useMemo(() => {
    const valid = records
      .filter((r) => r.total_hours !== null && r.total_hours > 0)
      .slice(0, 5)
      .reverse();
    if (valid.length === 0) {
      return [
        { day: "Mon", hours: 0 },
        { day: "Tue", hours: 0 },
        { day: "Wed", hours: 0 },
        { day: "Thu", hours: 0 },
        { day: "Fri", hours: 0 }
      ];
    }
    return valid.map((r) => {
      const d = new Date(r.attendance_date);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      return {
        day: dayName,
        hours: r.total_hours || 0
      };
    });
  }, [records]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, rec) => {
        if (rec.status === "Present" || rec.status === "Completed") {
          acc.present++;
        } else if (rec.status === "Late") {
          acc.late++;
        } else {
          acc.absent++;
        }
        return acc;
      },
      { present: 0, late: 0, absent: 0 }
    );
  }, [records]);

  const totalDays = Math.max(1, totals.present + totals.late + totals.absent);
  const pPct = Math.round((totals.present / totalDays) * 100);
  const lPct = Math.round((totals.late / totalDays) * 100);
  const aPct = Math.round((totals.absent / totalDays) * 100);

  return (
    <div className={styles.container_0}>
      <div className={styles.card_1}>
        <h4 className={styles.table_2}>Weekly Logged Hours</h4>
        <div className={styles.div_3}>
          {weekly.map((item, idx) => (
            <div key={idx} className={styles.container_4}>
              <span className={styles.table_5}>{item.day}</span>
              <div className={styles.container_6}>
                <div
                  className={styles.table_7}
                  style={{ width: `${Math.min(100, (item.hours / 12) * 100)}%` }}
                />
              </div>
              <span className={styles.text_8}>{item.hours.toFixed(1)}h</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.card_9}>
        <div>
          <h4 className={styles.table_10}>Monthly Allocation</h4>
          <div className={styles.container_11}>
            <svg className={styles.table_12}>
              <circle
                cx="56"
                cy="56"
                r="46"
                fill="transparent"
                stroke="currentColor"
                className={styles.text_13}
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                fill="transparent"
                stroke="#F4C542"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - (pPct + lPct) / 100)}`}
                className={styles.table_14}
              />
            </svg>
          </div>
        </div>
        <div className={styles.container_15}>
          <div className={styles.text_16}>
            <div className={styles.div_17} />
            <span className={styles.table_18}>Present</span>
            <p className={styles.text_19}>{pPct}%</p>
          </div>
          <div className={styles.text_20}>
            <div className={styles.div_21} />
            <span className={styles.table_22}>Late</span>
            <p className={styles.text_23}>{lPct}%</p>
          </div>
          <div className={styles.text_24}>
            <div className={styles.div_25} />
            <span className={styles.table_26}>Absent</span>
            <p className={styles.text_27}>{aPct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
