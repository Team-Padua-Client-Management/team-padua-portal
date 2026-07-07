"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/calendar/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/calendar/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle
} from "lucide-react";

/**
 * CalendarPage
 *
 * Renders the CalendarPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for CalendarPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  /**
 * Executes operations logic for getDaysInMonth.
 *
 * @param y: number, m: number
 * @returns State operations sequence.
 */
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  /**
 * Executes operations logic for getFirstDayOfMonth.
 *
 * @param y: number, m: number
 * @returns State operations sequence.
 */
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonthDays = getDaysInMonth(year, month - 1);
  const calendarCells: { date: number; isCurrentMonth: boolean; monthOffset: number }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      date: prevMonthDays - i,
      isCurrentMonth: false,
      monthOffset: -1
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      date: i,
      isCurrentMonth: true,
      monthOffset: 0
    });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      date: i,
      isCurrentMonth: false,
      monthOffset: 1
    });
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  /**
 * Executes operations logic for handlePrevMonth.
 *
 * 
 * @returns State operations sequence.
 */
const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  /**
 * Executes operations logic for handleNextMonth.
 *
 * 
 * @returns State operations sequence.
 */
const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  /**
 * Executes operations logic for handleToday.
 *
 * 
 * @returns State operations sequence.
 */
const handleToday = () => {
    setCurrentDate(new Date());
  };

  /**
 * Executes operations logic for isTodayDate.
 *
 * @param dateNum: number, monthOffset: number
 * @returns State operations sequence.
 */
const isTodayDate = (dateNum: number, monthOffset: number) => {
    const today = new Date();
    const cellDate = new Date(year, month + monthOffset, dateNum);
    return today.toDateString() === cellDate.toDateString();
  };

  if (loading) {
    return (
      <div className={styles.container_0}>
        <div className={styles.container_1}>
          <div className={styles.container_2}>
            <div className={styles.div_3} />
            <div className={styles.div_4} />
            <div className={styles.table_5} />
          </div>
          <p className={styles.table_6}>Loading Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.text_7}>
      {showErrorModal && (
        <div className={styles.container_8}>
          <div className={styles.card_9}>
            <div className={styles.text_10}><AlertTriangle size={48} /></div>
            <h2 className={styles.text_11}>Something went wrong</h2>
            <p className={styles.text_12}>
              We could not load your calendar contents. Please refresh and try again.
            </p>
            <button
              onClick={() => { setShowErrorModal(false); }}
              className={styles.table_13}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className={styles.div_14}>
        <div className={styles.table_15} />
        <div className={styles.container_16}>
          <div>
            <div className={styles.container_17}>
              <CalendarIcon className={styles.text_18} />
              <span className={styles.table_19}>Calendar Workspace</span>
            </div>
            <h2 className={styles.table_20}>Personal Schedule</h2>
            <p className={styles.table_21}>Manage and track your schedule month-by-month</p>
          </div>
          <Link href="/dashboard/personal" className={styles.table_22}>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className={styles.div_23}>
        <div className={styles.div_24}>
          <div className={styles.card_25}>
            <div className={styles.container_26}>
              <h3 className={styles.text_27}>
                {monthNames[month]} {year}
              </h3>
              <div className={styles.container_28}>
                <button
                  onClick={handlePrevMonth}
                  className={styles.card_29}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleToday}
                  className={styles.card_30}
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className={styles.card_31}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className={styles.table_32}>
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className={styles.container_33}>
              {calendarCells.map((cell, idx) => {
                const isToday = isTodayDate(cell.date, cell.monthOffset);

                return (
                  <div
                    key={idx}
                    className={`${styles.table_36} ${
                      cell.isCurrentMonth ? "bg-card text-foreground" : "bg-muted/10 text-muted-foreground/50"
                    } ${isToday ? "ring-1 ring-[#F4C542] border-[#F4C542]/50 bg-[#FFFDF0] dark:bg-[#1E1C15]" : ""} group`}
                  >
                    <div className={styles.container_34}>
                      <span className={`${styles.text_37} ${
                        isToday ? "bg-[#F4C542] text-black font-extrabold" : ""
                      }`}>
                        {cell.date}
                      </span>
                    </div>

                    <div className={styles.div_35}>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
