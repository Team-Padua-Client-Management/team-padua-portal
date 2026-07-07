/**
 * AttendanceCalendar.tsx
 *
 * Main component module in features path: app/(user)/attendance/AttendanceCalendar.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\AttendanceCalendar.tsx

"use client";

import styles from "@/styles/user/attendance/AttendanceCalendar.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { formatDateString } from "./attendance.utils";

interface AttendanceCalendarProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

/**
 * AttendanceCalendar
 *
 * Renders the AttendanceCalendar interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceCalendar.
 *
 * @param { selectedDate, onSelectDate }: AttendanceCalendarProps
 * @returns State operations sequence.
 */
export default function AttendanceCalendar({ selectedDate, onSelectDate }: AttendanceCalendarProps) {
  const [yr, mo, dy] = selectedDate.split("-").map(Number);
  const [current, setCurrent] = useState(new Date(yr || new Date().getFullYear(), (mo ? mo - 1 : new Date().getMonth()), dy || new Date().getDate()));
  const year = current.getFullYear();
  const month = current.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= lastDay; i++) {
    days.push(i);
  }
  
  /**
 * Executes operations logic for prevMonth.
 *
 * 
 * @returns State operations sequence.
 */
const prevMonth = () => {
    setCurrent(new Date(year, month - 1, 1));
  };
  /**
 * Executes operations logic for nextMonth.
 *
 * 
 * @returns State operations sequence.
 */
const nextMonth = () => {
    setCurrent(new Date(year, month + 1, 1));
  };
  /**
 * Executes operations logic for prevYear.
 *
 * 
 * @returns State operations sequence.
 */
const prevYear = () => {
    setCurrent(new Date(year - 1, month, 1));
  };
  /**
 * Executes operations logic for nextYear.
 *
 * 
 * @returns State operations sequence.
 */
const nextYear = () => {
    setCurrent(new Date(year + 1, month, 1));
  };
  
  /**
 * Executes operations logic for handleDayClick.
 *
 * @param day: number
 * @returns State operations sequence.
 */
const handleDayClick = (day: number) => {
    const d = String(day).padStart(2, "0");
    const m = String(month + 1).padStart(2, "0");
    onSelectDate(`${year}-${m}-${d}`);
  };
  
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const todayStr = formatDateString(new Date());
  
  return (
    <div className={styles.card_0}>
      <div className={styles.container_1}>
        <div className={styles.container_2}>
          <button
            type="button"
            onClick={prevYear}
            className={styles.table_3}
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className={styles.table_4}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
        <span className={styles.text_5}>
          {monthNames[month]} {year}
        </span>
        <div className={styles.container_6}>
          <button
            type="button"
            onClick={nextMonth}
            className={styles.table_7}
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={nextYear}
            className={styles.table_8}
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
      <div className={styles.text_9}>
        {weekdays.map((day) => (
          <div key={day} className={styles.table_10}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.container_11}>
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }
          const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dStr === selectedDate;
          const isTodayDate = dStr === todayStr;
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`${styles.table_13} ${
                isSelected
                  ? "bg-[#F4C542] text-black font-bold border border-[#F4C542] shadow-xs"
                  : isTodayDate
                  ? "bg-[#FFF7D6] dark:bg-[#2E2818]/60 text-[#F4C542] dark:text-[#F4C542] font-semibold border border-border"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{day}</span>
              {isTodayDate && (
                <span className={styles.text_12}>
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
