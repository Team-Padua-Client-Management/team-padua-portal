"use client";

/**
 * AttendanceClient.tsx
 *
 * Main component module in features path: app/(admin)/admin/attendance/AttendanceClient.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/attendance/AttendanceClient.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, X, ChevronRight as ArrowRight } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import Header from "@/app/components/admin/AdminHeader/page";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatarMode?: string;
  aiSeed?: string;
}

/**
 * Executes operations logic for AiAvatar.
 *
 * @param { seed, size = 36 }: { seed: string; size?: number }
 * @returns State operations sequence.
 */
function AiAvatar({ seed, size = 36 }: { seed: string; size?: number }) {
  /**
 * Executes operations logic for hash.
 *
 * @param s: string
 * @returns State operations sequence.
 */
const hash = (s: string) =>
    [...s].reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
  const n = Math.abs(hash(seed));
  const palettes = [
    { bg: ["#FFF9E5", "#FFF7D6"], orb1: "#F4C542", orb2: "#E6A800", acc: "#000000" },
    { bg: ["#1a1a2e", "#16213e"], orb1: "#e94560", orb2: "#0f3460", acc: "#e94560" },
    { bg: ["#0d1117", "#161b22"], orb1: "#58a6ff", orb2: "#1f6feb", acc: "#79c0ff" },
    { bg: ["#0a0a0a", "#1a0a2e"], orb1: "#a855f7", orb2: "#7c3aed", acc: "#d8b4fe" },
  ];
  const shapes = [
    "M 20,50 Q 35,20 50,50 Q 65,80 80,50",
    "M 15,40 Q 40,10 60,40 Q 80,70 85,45",
  ];
  const pal = palettes[n % palettes.length];
  const cx1 = 20 + (n % 40);
  const cy1 = 20 + ((n >> 4) % 40);
  const cx2 = 60 + (n % 30);
  const cy2 = 50 + ((n >> 8) % 30);
  const shape = shapes[(n >> 2) % shapes.length];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal.bg[0]} />
          <stop offset="100%" stopColor={pal.bg[1]} />
        </linearGradient>
        <radialGradient id={`orb1-${seed}`} cx="30%" cy="30%" r="60%">
          <stop offset="0%" stopColor={pal.orb1} stopOpacity="0.7" />
          <stop offset="100%" stopColor={pal.orb1} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`orb2-${seed}`} cx="70%" cy="70%" r="60%">
          <stop offset="0%" stopColor={pal.orb2} stopOpacity="0.6" />
          <stop offset="100%" stopColor={pal.orb2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bg-${seed})`} />
      <circle cx={cx1} cy={cy1} r="55" fill={`url(#orb1-${seed})`} />
      <circle cx={cx2} cy={cy2} r="45" fill={`url(#orb2-${seed})`} />
      <path d={shape} fill="none" stroke={pal.acc} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="3" fill={pal.acc} fillOpacity="0.9" />
    </svg>
  );
}

/**
 * Executes operations logic for InitialsAvatar.
 *
 * @param { name, size = 36 }: { name: string; size?: number }
 * @returns State operations sequence.
 */
function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={styles.text_0}
    >
      {initials}
    </div>
  );
}

/**
 * Executes operations logic for AvatarDisplay.
 *
 * @param { avatar, avatarMode, aiSeed, name, size = 36 }: { avatar?: string; avatarMode?: string; aiSeed?: string; name: string; size?: number }
 * @returns State operations sequence.
 */
function AvatarDisplay({ avatar, avatarMode, aiSeed, name, size = 36 }: { avatar?: string; avatarMode?: string; aiSeed?: string; name: string; size?: number }) {
  if (avatarMode === "upload" && avatar) {
    return (
      <img src={avatar} alt={name} style={{ width: size, height: size }}
        className={styles.div_1} />
    );
  }
  if (avatarMode === "ai" && aiSeed) {
    return (
      <div className={styles.div_2} style={{ width: size, height: size }}>
        <AiAvatar seed={aiSeed} size={size} />
      </div>
    );
  }
  return <InitialsAvatar name={name} size={size} />;
}

interface Profile {
  id: string;
  role?: string;
  department?: string;
  team?: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  attendance_date: string;
  time_in: string | null;
  break_out: string | null;
  break_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  daily_record: string | null;
  admin_feedback: string | null;
  status: string;
}

interface AttendanceClientProps {
  users: User[];
  profiles: Profile[];
  initialAttendance: AttendanceRecord[];
}

/**
 * AttendanceClient
 *
 * Renders the AttendanceClient interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendanceClient.
 *
 * @param { users, profiles, initialAttendance }: AttendanceClientProps
 * @returns State operations sequence.
 */
export default function AttendanceClient({ users, profiles, initialAttendance }: AttendanceClientProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  
  useEffect(() => {
    console.log("Attendance");
    console.table(attendance);
    console.log("Users");
    console.table(users);
    console.log("Profiles");
    console.table(profiles);
  }, [attendance, users, profiles]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dept");
  const [hideTimes, setHideTimes] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    type: 'record' | 'feedback';
    userId: string;
    userName: string;
    date: string;
    content: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  }, []);

  const displayLongDate = useMemo(() => {
    if (!selectedDate) return "";
    const [yr, mo, dy] = selectedDate.split("-").map(Number);
    return new Date(yr, mo - 1, dy).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }, [selectedDate]);

  /**
 * Executes operations logic for handleDateChange.
 *
 * @param daysOffset: number
 * @returns State operations sequence.
 */
const handleDateChange = (daysOffset: number) => {
    if (!selectedDate) return;
    const [yr, mo, dy] = selectedDate.split("-").map(Number);
    const d = new Date(yr, mo - 1, dy);
    d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  /**
 * Executes operations logic for handleSaveFeedback.
 *
 * 
 * @returns State operations sequence.
 */
const handleSaveFeedback = async () => {
    if (!activeModal || activeModal.type !== 'feedback') return;
    setIsSaving(true);
    const { userId, date, content } = activeModal;
    const existing = attendance.find(a => a.user_id === userId && a.attendance_date === date);
    const updatedFields = { admin_feedback: content };

    if (existing) {
      const { error } = await supabase
        .from("attendance")
        .update(updatedFields)
        .eq("id", existing.id);
      if (!error) {
        setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, ...updatedFields } : a));
      }
    } else {
      const newRecord = {
        user_id: userId,
        attendance_date: date,
        admin_feedback: content,
        status: 'Absent'
      };
      const { data, error } = await supabase
        .from("attendance")
        .insert([newRecord])
        .select();
      if (!error && data && data[0]) {
        setAttendance(prev => [...prev, data[0]]);
      }
    }
    setIsSaving(false);
    setActiveModal(null);
  };

  const formatTime12h = (timeStr: string | null): string => {
    if (!timeStr) return "—";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const hrs = Number(parts[0]);
    const mins = parts[1];
    const secs = parts[2] || "00";
    const ampm = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${String(displayHrs).padStart(2, "0")}:${mins}:${secs} ${ampm}`;
  };

  const formatDecimalHours = (decimal: number | null): string => {
    if (!decimal || decimal <= 0) return "—";
    const hrs = Math.floor(decimal);
    const mins = Math.round((decimal - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const mappedRecords = useMemo(() => {
    return users.map((u) => {
      const profile: Profile = profiles.find((p) => p.id === u.id) || { id: "" };
      const record = attendance.find((a) => a.user_id === u.id && a.attendance_date === selectedDate) || {
        id: "",
        user_id: u.id,
        attendance_date: selectedDate,
        time_in: null,
        break_out: null,
        break_in: null,
        time_out: null,
        total_hours: 0,
        daily_record: "",
        admin_feedback: "",
        status: "Absent"
      };
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || "",
        avatarMode: u.avatarMode || "initials",
        aiSeed: u.aiSeed || "default",
        role: profile.role || "Associate",
        department: profile.department || "General",
        team: profile.team || "No Team",
        record
      };
    });
  }, [users, profiles, attendance, selectedDate]);

  const filteredAndSortedRecords = useMemo(() => {
    let result = mappedRecords.filter((rec) => {
      return rec.name.toLowerCase().includes(search.toLowerCase()) ||
             rec.department.toLowerCase().includes(search.toLowerCase());
    });
    if (sortBy === "dept") {
      result.sort((a, b) => a.department.localeCompare(b.department));
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [mappedRecords, search, sortBy]);

  return (
    <div className={styles.text_3}>
      <Sidebar />
      <div className={styles.container_4}>
        <Header />
        <main className={styles.div_5}>
          <div className={styles.container_6}>
            <div>
              <h1 className={styles.text_7}>Attendance Monitor</h1>
              <p className={styles.table_8}>{displayLongDate}</p>
            </div>
            <div className={styles.container_9}>
              <div className={styles.card_10}>
                <button
                  onClick={() => handleDateChange(-1)}
                  className={styles.table_11}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className={styles.container_12}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.table_13}
                  />
                </div>
                <button
                  onClick={() => handleDateChange(1)}
                  className={styles.table_14}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                onClick={() => setHideTimes(!hideTimes)}
                className={styles.card_15}
              >
                {hideTimes ? "Show Times" : "Hide Times"}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.card_16}
              >
                <option value="dept">Sort by Dept</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
          <div className={styles.card_17}>
            <Search className={styles.text_18} size={14} />
            <input
              type="text"
              placeholder="Search by name or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.table_19}
            />
          </div>
          <div className={styles.card_20}>
            <div className={styles.div_21}>
              <table className={styles.text_22}>
                <thead>
                  <tr className={styles.table_23}>
                    <th className={styles.div_24}>Intern</th>
                    <th className={styles.text_25}>
                      <span className={styles.table_26}>Time In</span>
                    </th>
                    <th className={styles.text_27}>
                      <span className={styles.table_28}>Break Out</span>
                    </th>
                    <th className={styles.text_29}>
                      <span className={styles.table_30}>Break In</span>
                    </th>
                    <th className={styles.text_31}>
                      <span className={styles.table_32}>Time Out</span>
                    </th>
                    <th className={styles.text_33}>
                      <span className={styles.table_34}>Total Hrs</span>
                    </th>
                    <th className={styles.text_35}>
                      <span className={styles.table_36}>Daily Record</span>
                    </th>
                    <th className={styles.text_37}>
                      <span className={styles.table_38}>Admin Feedback</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={styles.card_39}>
                  {filteredAndSortedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.table_40}>
                        No team member records match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedRecords.map((rec) => {
                      return (
                        <tr key={rec.userId} className={styles.table_41}>
                          <td className={styles.div_42}>
                            <div className={styles.container_43}>
                              <AvatarDisplay 
                                avatar={rec.avatar} 
                                avatarMode={rec.avatarMode} 
                                aiSeed={rec.aiSeed} 
                                name={rec.name} 
                                size={36} 
                              />
                              <div>
                                <span className={styles.text_44}>{rec.name}</span>
                                <span className={styles.table_45}>{rec.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.text_46}>
                            {hideTimes ? "••:••:••" : formatTime12h(rec.record.time_in)}
                          </td>
                          <td className={styles.text_47}>
                            {hideTimes ? "••:••:••" : formatTime12h(rec.record.break_out)}
                          </td>
                          <td className={styles.text_48}>
                            {hideTimes ? "••:••:••" : formatTime12h(rec.record.break_in)}
                          </td>
                          <td className={styles.text_49}>
                            {hideTimes ? "••:••:••" : formatTime12h(rec.record.time_out)}
                          </td>
                          <td className={styles.text_50}>
                            {rec.record.total_hours && rec.record.total_hours > 0 ? (
                              <span className={styles.text_51}>
                                {formatDecimalHours(rec.record.total_hours)}
                              </span>
                            ) : (
                              <span className={styles.text_52}>—</span>
                            )}
                          </td>
                          <td className={styles.text_53}>
                            {rec.record.daily_record ? (
                              <button
                                onClick={() => setActiveModal({
                                  type: 'record',
                                  userId: rec.userId,
                                  userName: rec.name,
                                  date: selectedDate,
                                  content: rec.record.daily_record || ""
                                })}
                                className={styles.table_54}
                              >
                                <span>View record</span>
                                <ArrowRight size={10} className={styles.text_55} />
                              </button>
                            ) : (
                              <span className={styles.text_56}>No record</span>
                            )}
                          </td>
                          <td className={styles.text_57}>
                            <button
                              onClick={() => setActiveModal({
                                type: 'feedback',
                                userId: rec.userId,
                                userName: rec.name,
                                date: selectedDate,
                                content: rec.record.admin_feedback || ""
                              })}
                              className={styles.table_58}
                            >
                              <span className={styles.table_59}>{rec.record.admin_feedback || "Write feedback"}</span>
                              <ArrowRight size={10} className={styles.text_60} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {activeModal && (
        <div className={styles.container_61}>
          <div className={styles.card_62}>
            <button
              onClick={() => setActiveModal(null)}
              className={styles.table_63}
            >
              <X size={16} />
            </button>
            <h3 className={styles.text_64}>
              {activeModal.type === 'record' ? 'Daily Record' : 'Edit Admin Feedback'}
            </h3>
            <p className={styles.table_65}>
              {activeModal.userName} • {activeModal.date}
            </p>
            <div className={styles.div_66}>
              {activeModal.type === 'record' ? (
                <div className={styles.input_67}>
                  {activeModal.content || "No record submitted by the intern for this date."}
                </div>
              ) : (
                <textarea
                  value={activeModal.content}
                  onChange={(e) => setActiveModal(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Provide administrative feedback..."
                  rows={5}
                  className={styles.table_68}
                />
              )}
            </div>
            <div className={styles.container_69}>
              <button
                onClick={() => setActiveModal(null)}
                className={styles.table_70}
              >
                {activeModal.type === 'record' ? "Close" : "Cancel"}
              </button>
              {activeModal.type === 'feedback' && (
                <button
                  onClick={handleSaveFeedback}
                  disabled={isSaving}
                  className={styles.table_71}
                >
                  {isSaving ? (
                    <div className={styles.table_72} />
                  ) : (
                    "Save Feedback"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
