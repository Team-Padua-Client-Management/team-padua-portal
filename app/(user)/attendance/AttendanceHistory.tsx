/**
 * AttendanceHistory.tsx
 *
 * Main component module in features path: app/(user)/attendance/AttendanceHistory.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\AttendanceHistory.tsx

"use client";

import styles from "@/styles/user/attendance/AttendanceHistory.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================
import React, { useState } from "react";
import { AttendanceRecord } from "./attendance.types";
import AttendanceTable from "./AttendanceTable";

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  onSelectDate: (dateStr: string) => void;
}

/**
 * AttendanceHistory
 *
 * Renders the AttendanceHistory interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceHistory.
 *
 * @param { records, onSelectDate }: AttendanceHistoryProps
 * @returns State operations sequence.
 */
export default function AttendanceHistory({ records, onSelectDate }: AttendanceHistoryProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("All");

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" }
  ];

  const filtered = records.filter((rec) => {
    const matchesSearch =
      (rec.daily_record || "").toLowerCase().includes(search.toLowerCase()) ||
      rec.attendance_date.includes(search);
    const matchesStatus = status === "All" || rec.status === status;
    const [recYear, recMonth] = rec.attendance_date.split("-");
    const matchesMonth = month === "All" || recMonth === month;
    const matchesYear = year === "All" || recYear === year;
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  return (
    <div className={styles.div_0}>
      <div className={styles.container_1}>
        <div>
          <input
            type="text"
            placeholder="Search Ledger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.card_2}
          />
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={styles.card_3}
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={styles.card_4}
          >
            <option value="All">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={styles.card_5}
          >
            <option value="All">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>
      <AttendanceTable records={filtered} onSelectDate={onSelectDate} />
    </div>
  );
}
