/**
 * AttendanceDashboard.tsx
 *
 * Main component module in features path: app/(user)/attendance/AttendanceDashboard.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\AttendanceDashboard.tsx

"use client";

import styles from "@/styles/user/attendance/AttendanceDashboard.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Coffee, LogIn, LogOut, CornerDownLeft, Plus, ChevronRight, X, Clock, HelpCircle } from "lucide-react";
import { AttendanceRecord, DashboardStats } from "./attendance.types";
import AttendanceCalendar from "./AttendanceCalendar";
import AttendanceHistory from "./AttendanceHistory";
import AttendanceTimeline from "./AttendanceTimeline";
import AttendanceStats from "./AttendanceStats";
import AttendanceModal from "./AttendanceModal";
import { formatTime12h, formatDateString } from "./attendance.utils";

interface AttendanceDashboardProps {
  records: AttendanceRecord[];
  selectedRecord: AttendanceRecord;
  stats: DashboardStats;
  selectedDate: string;
  profile: { name: string; role: string };
  onSelectDate: (dateStr: string) => void;
  onTimeChange: (field: "time_in" | "break_out" | "break_in" | "time_out", value: string) => void;
  onRecordChange: (val: string) => void;
  onSave: () => void;
  onPunch: (field: "time_in" | "break_out" | "break_in" | "time_out") => void;
  isSaving: boolean;
}

/**
 * Executes operations logic for TimePickerInput.
 *
 * @param {
  label,
  value,
  onChange
}: {
  label: string;
  value: string | null;
  onChange: (val: string
 * @returns State operations sequence.
 */
function TimePickerInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string | null;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayVal = value ? formatTime12h(value) : "Select time";
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  useEffect(() => {
    if (value) {
      const clean = value.trim().toUpperCase();
      const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (match) {
        setHour(match[1].padStart(2, "0"));
        setMinute(match[2].padStart(2, "0"));
        setAmpm(match[3]);
      }
    }
  }, [value, isOpen]);

  useEffect(() => {
    /**
 * Executes operations logic for handleClickOutside.
 *
 * @param event: MouseEvent
 * @returns State operations sequence.
 */
function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
 * Executes operations logic for handleApply.
 *
 * 
 * @returns State operations sequence.
 */
const handleApply = () => {
    onChange(`${Number(hour)}:${minute} ${ampm}`);
    setIsOpen(false);
  };

  /**
 * Executes operations logic for handleClear.
 *
 * 
 * @returns State operations sequence.
 */
const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={styles.container_0}>
      <span className={styles.table_1}>{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.card_2}
      >
        {displayVal}
      </button>
      {isOpen && (
        <div className={styles.card_3}>
          <div className={styles.container_4}>
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className={styles.card_5}
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className={styles.text_6}>:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className={styles.card_7}
            >
              {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={ampm}
              onChange={(e) => setAmpm(e.target.value)}
              className={styles.card_8}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <div className={styles.container_9}>
            <button
              type="button"
              onClick={handleClear}
              className={styles.table_10}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={styles.table_11}
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AttendanceDashboard
 *
 * Renders the AttendanceDashboard interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceDashboard.
 *
 * @param {
  records,
  selectedRecord,
  stats,
  selectedDate,
  profile,
  onSelectDate,
  onTimeChange,
  onRecordChange,
  onSave,
  onPunch,
  isSaving
}: AttendanceDashboardProps
 * @returns State operations sequence.
 */
export default function AttendanceDashboard({
  records,
  selectedRecord,
  stats,
  selectedDate,
  profile,
  onSelectDate,
  onTimeChange,
  onRecordChange,
  onSave,
  onPunch,
  isSaving
}: AttendanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<"history" | "timeline" | "stats">("history");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [yr, mo, dy] = selectedDate.split("-").map(Number);
  const todayStr = formatDateString(new Date());
  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayDate = useMemo(() => {
    if (isToday) return "Today";
    if (yr && mo && dy) {
      return new Date(yr, mo - 1, dy).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }
    return selectedDate;
  }, [selectedDate, isToday, yr, mo, dy]);

  const formattedHours = useMemo(() => {
    const hours = selectedRecord.total_hours;
    if (!hours || hours <= 0) return "0.0h";
    return `${hours.toFixed(1)}h`;
  }, [selectedRecord.total_hours]);

  const hasIn = !!selectedRecord.time_in;
  const hasBO = !!selectedRecord.break_out;
  const hasBI = !!selectedRecord.break_in;
  const hasOut = !!selectedRecord.time_out;

  /**
 * Executes operations logic for statusColor.
 *
 * @param status: string
 * @returns State operations sequence.
 */
const statusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-[#FFF9E5] dark:bg-[#2E2818]/60 text-[#A3843B] dark:text-[#F4C542] border border-[#F4C542]/30";
      case "Late":
        return "bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-[#fef08a] border border-amber-300 dark:border-amber-500/20";
      case "Completed":
        return "bg-[#F0FDF4] dark:bg-[#163420]/30 text-[#166534] dark:text-[#4ade80] border border-[#DCFCE7] dark:border-[#DCFCE7]/20";
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
    }
  };

  return (
    <div className={styles.text_12}>
      <div className={styles.div_13}>
        {/* Simplified Stats Cards */}
        <div className={styles.container_14}>
          {/* Card 1: Attendance Ledger Summary */}
          <div className={styles.card_15}>
            <div className={styles.div_16}>
              <span className={styles.table_17}>ATTENDANCE LEDGER</span>
              <div className={styles.container_18}>
                <div>
                  <span className={styles.text_19}>{stats.presentDays}</span>
                  <span className={styles.text_20}>Present</span>
                </div>
                <div className={styles.div_21}>
                  <span className={styles.text_22}>{stats.lateDays}</span>
                  <span className={styles.text_23}>Late</span>
                </div>
                <div className={styles.div_24}>
                  <span className={styles.text_25}>{stats.absentDays}</span>
                  <span className={styles.text_26}>Absent</span>
                </div>
              </div>
            </div>
            <div className={styles.container_27}>
              <Clock size={16} className={styles.text_28} />
            </div>
          </div>

          {/* Card 2: Cumulative Working Hours */}
          <div className={styles.card_29}>
            <div className={styles.div_30}>
              <span className={styles.table_31}>CUMULATIVE HOURS</span>
              <div className={styles.container_32}>
                <div>
                  <span className={styles.text_33}>{stats.totalHours.toFixed(1)}h</span>
                  <span className={styles.text_34}>Total Work</span>
                </div>
                <div className={styles.div_35}>
                  <span className={styles.text_36}>{stats.averageHours.toFixed(1)}h</span>
                  <span className={styles.text_37}>Avg / Day</span>
                </div>
              </div>
            </div>
            <div className={styles.container_38}>
              <Coffee size={16} className={styles.text_39} />
            </div>
          </div>

          {/* Card 3: Status Tracking */}
          <div className={styles.card_40}>
            <div className={styles.div_41}>
              <span className={styles.table_42}>PUNCH DESK STATUS</span>
              <div className={styles.div_43}>
                <span className={`${styles.text_110} ${statusColor(stats.currentStatus)}`}>
                  {stats.currentStatus}
                </span>
              </div>
            </div>
            <div className={styles.container_44}>
              <span className={styles.div_45} />
            </div>
          </div>
        </div>

        {/* Daily Punch Desk Box */}
        <div className={styles.card_46}>
          <div className={styles.container_47}>
            <div>
              <div className={styles.container_48}>
                <h2 className={styles.text_49}>Daily Punch Desk</h2>
                <span className={styles.table_50}>
                  {displayDate}
                </span>
              </div>
              <p className={styles.table_51}>
                {profile.name} • {profile.role}
              </p>
            </div>

            <div className={styles.container_52}>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className={styles.table_53}
              >
                📅 Calendar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className={styles.table_54}
              >
                {isSaving ? (
                  <div className={styles.table_55} />
                ) : (
                  "Save Desk Record"
                )}
              </button>
            </div>
          </div>

          {isPast && (
            <div className={styles.text_56}>
              <Clock size={16} className={styles.text_57} />
              <span>Editing Past Attendance Record. Automatic punches are disabled for past dates.</span>
            </div>
          )}

          {/* Clock Widget & Punch Timeline Grid */}
          <div className={styles.container_58}>
            {/* Live Clock & Hours Output */}
            <div className={styles.text_59}>
              <span className={styles.table_60}>LIVE OFFICE TIMER</span>
              <span className={styles.table_61}>{currentTime || "--:--:--"}</span>
              <div className={styles.div_62} />
              <span className={styles.table_63}>Calculated Shift Duration</span>
              <span className={styles.text_64}>{formattedHours}</span>
            </div>

            {/* Checklist Timeline View */}
            <div className={styles.div_65}>
              <span className={styles.table_66}>PUNCH TIMESTAMPS</span>
              
              <div className={styles.div_67}>
                {[
                  { label: "Time In", val: selectedRecord.time_in, key: "time_in" },
                  { label: "Break Out", val: selectedRecord.break_out, key: "break_out" },
                  { label: "Break In", val: selectedRecord.break_in, key: "break_in" },
                  { label: "Time Out", val: selectedRecord.time_out, key: "time_out" }
                ].map((item) => {
                  const set = !!item.val;
                  return (
                    <div key={item.key} className={styles.text_68}>
                      <div className={styles.container_69}>
                        <div className={`${styles.container_111} ${
                          set ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                        }`}>
                          {set ? "✓" : "•"}
                        </div>
                        <span className={`${styles.text_112} ${set ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"}`}>{item.label}</span>
                      </div>
                      <span className={`${styles.text_113} ${set ? "text-zinc-800 dark:text-zinc-200 font-bold" : "text-zinc-400 dark:text-zinc-600"}`}>
                        {item.val ? formatTime12h(item.val) : "--:--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Button Box */}
            <div className={styles.table_70}>
              {isToday ? (
                <div className={styles.div_71}>
                  <span className={styles.table_72}>REGISTER PUNCH</span>
                  
                  {!hasIn && (
                    <button
                      type="button"
                      onClick={() => onPunch("time_in")}
                      disabled={isSaving}
                      className={styles.table_73}
                    >
                      <LogIn size={15} /> Time In
                    </button>
                  )}
                  {hasIn && !hasBO && !hasOut && (
                    <div className={styles.container_74}>
                      <button
                        type="button"
                        onClick={() => onPunch("break_out")}
                        disabled={isSaving}
                        className={styles.table_75}
                      >
                        <Coffee size={15} /> Start Break
                      </button>
                      <button
                        type="button"
                        onClick={() => onPunch("time_out")}
                        disabled={isSaving}
                        className={styles.table_76}
                      >
                        <LogOut size={15} /> Time Out
                      </button>
                    </div>
                  )}
                  {hasBO && !hasBI && (
                    <button
                      type="button"
                      onClick={() => onPunch("break_in")}
                      disabled={isSaving}
                      className={styles.table_77}
                    >
                      <CornerDownLeft size={15} /> End Break
                    </button>
                  )}
                  {hasBI && !hasOut && (
                    <button
                      type="button"
                      onClick={() => onPunch("time_out")}
                      disabled={isSaving}
                      className={styles.table_78}
                    >
                      <LogOut size={15} /> Time Out
                    </button>
                  )}
                  {hasOut && (
                    <div className={styles.table_79}>
                      ✓ Shift Completed
                    </div>
                  )}
                </div>
              ) : (
                /* Manual Inputs for Past Record Date */
                <div className={styles.div_80}>
                  <span className={styles.table_81}>MANUAL TIME EDIT</span>
                  
                  <div className={styles.container_82}>
                    <TimePickerInput
                      label="In"
                      value={selectedRecord.time_in}
                      onChange={(val) => onTimeChange("time_in", val)}
                    />
                    <TimePickerInput
                      label="Out"
                      value={selectedRecord.time_out}
                      onChange={(val) => onTimeChange("time_out", val)}
                    />
                    <TimePickerInput
                      label="Break Out"
                      value={selectedRecord.break_out}
                      onChange={(val) => onTimeChange("break_out", val)}
                    />
                    <TimePickerInput
                      label="Break In"
                      value={selectedRecord.break_in}
                      onChange={(val) => onTimeChange("break_in", val)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Accomplishments & Feedback Textboxes */}
          <div className={styles.container_83}>
            <div className={styles.div_84}>
              <div className={styles.container_85}>
                <span className={styles.table_86}>Daily Accomplishment Record</span>
                <span className={styles.text_87}>Editable</span>
              </div>
              <textarea
                value={selectedRecord.daily_record || ""}
                onChange={(e) => onRecordChange(e.target.value)}
                placeholder="Document your daily work achievements and activities..."
                rows={3}
                className={styles.table_88}
              />
            </div>
            <div className={styles.div_89}>
              <div className={styles.container_90}>
                <span className={styles.table_91}>Administrative Feedback</span>
                <span className={styles.table_92}>Read-Only</span>
              </div>
              <div className={styles.input_93}>
                {selectedRecord.admin_feedback || "No administrative feedback has been recorded for this date."}
              </div>
            </div>
          </div>
        </div>

        {/* History Logs */}
        <div className={styles.container_94}>
          <div className={styles.div_95}>
            <div className={styles.container_96}>
              {[
                { id: "history", label: "Ledger History" },
                { id: "timeline", label: "Timeline View" },
                { id: "stats", label: "Analytics" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${styles.table_114} ${
                    activeTab === tab.id
                      ? "border-[#F4C542] text-zinc-800 dark:text-zinc-100 font-bold"
                      : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.div_97}>
              {activeTab === "history" && (
                <AttendanceHistory records={records} onSelectDate={onSelectDate} />
              )}
              {activeTab === "timeline" && (
                <AttendanceTimeline
                  timeIn={selectedRecord.time_in || ""}
                  breakOut={selectedRecord.break_out || ""}
                  breakIn={selectedRecord.break_in || ""}
                  timeOut={selectedRecord.time_out || ""}
                />
              )}
              {activeTab === "stats" && <AttendanceStats records={records} />}
            </div>
          </div>

          {/* Reference guide below */}
          <div className={styles.div_98}>
            <div className={styles.card_99}>
              <h3 className={styles.table_100}>
                Desk Operations Reference Guide
              </h3>
              <div className={styles.text_101}>
                <div>
                  <h4 className={styles.text_102}>
                    <Clock size={14} className={styles.text_103} /> 1. Today (Automatic)
                  </h4>
                  <p>Use the sequential workflow buttons. Times are captured instantly upon clicking. Manual overrides are disabled for current date.</p>
                </div>
                <div className={styles.div_104}>
                  <h4 className={styles.text_105}>
                    📅 2. History (Manual Override)
                  </h4>
                  <p>Select a past date using the Calendar modal. Use the manual dropdown selectors to adjust historical punch coordinates.</p>
                </div>
                <div className={styles.div_106}>
                  <h4 className={styles.text_107}>
                    💡 3. Shift Duration Equation
                  </h4>
                  <p className={styles.text_108}>
                    ((BreakOut - TimeIn) + (TimeOut - BreakIn)) * 24
                  </p>
                  <p className={styles.div_109}>Automatically calculates and deducts registered lunch breaks from total shifts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AttendanceModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)}>
          <AttendanceCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              onSelectDate(d);
              setIsCalendarOpen(false);
            }}
          />
        </AttendanceModal>
      </div>
    </div>
  );
}
