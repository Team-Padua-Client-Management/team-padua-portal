/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/attendance/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\attendance\page.tsx

"use client";


  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import styles from "@/styles/user/attendance/page.module.css";import React, { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { AttendanceRecord, DashboardStats } from "./attendance.types";
import { calculateHours, getStatus, formatDateString } from "./attendance.utils";
import AttendanceDashboard from "./AttendanceDashboard";
/**
 * AttendancePage
 *
 * Renders the AttendancePage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AttendancePage.
 *
 * 
 * @returns State operations sequence.
 */
export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalHours: 0,
    averageHours: 0,
    currentStatus: "Absent"
  });
  useEffect(() => {
    setSelectedDate(formatDateString(new Date()));
  }, []);
  useEffect(() => {
    /**
 * Executes operations logic for initSession.
 *
 * 
 * @returns State operations sequence.
 */
async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const uid = session.user.id;
        const todayStr = formatDateString(new Date());
        const { data: todayRecords } = await supabase
          .from("attendance")
          .select("id")
          .eq("user_id", uid)
          .eq("attendance_date", todayStr);
        if (!todayRecords || todayRecords.length === 0) {
          await /* Query database records from active repository grid */ supabase.from("attendance").insert([{
            user_id: uid,
            attendance_date: todayStr,
            status: "Absent",
            time_in: null,
            break_out: null,
            break_in: null,
            time_out: null,
            total_hours: 0,
            daily_record: ""
          }]);
        }
        await fetchAttendance(uid);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", uid)
          .single();
        if (profileData) {
          setProfile({
            name: profileData.full_name || session.user.user_metadata?.full_name || "User",
            role: profileData.role || "Associate"
          });
        } else {
          setProfile({
            name: session.user.user_metadata?.full_name || session.user.email || "User",
            role: "Associate"
          });
        }
      }
    }
    initSession();
  }, []);
  useEffect(() => {
    if (selectedDate) {
      const found = records.find((r) => r.attendance_date === selectedDate);
      if (found) {
        setSelectedRecord(found);
      } else {
        setSelectedRecord({
          attendance_date: selectedDate,
          time_in: null,
          break_out: null,
          break_in: null,
          time_out: null,
          total_hours: 0,
          daily_record: "",
          admin_feedback: "",
          status: "Absent"
        });
      }
    }
  }, [selectedDate, records]);
  /**
 * Executes operations logic for fetchAttendance.
 *
 * @param uid: string
 * @returns State operations sequence.
 */
async function fetchAttendance(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", uid)
      .order("attendance_date", { ascending: false });
    if (!error && data) {
      const formatted: AttendanceRecord[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        attendance_date: item.attendance_date,
        time_in: item.time_in,
        break_out: item.break_out,
        break_in: item.break_in,
        time_out: item.time_out,
        total_hours: item.total_hours ? Number(item.total_hours) : 0,
        daily_record: item.daily_record,
        admin_feedback: item.admin_feedback,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      setRecords(formatted);
      calculateStats(formatted);
    }
    setLoading(false);
  }
  /**
 * Executes operations logic for calculateStats.
 *
 * @param history: AttendanceRecord[]
 * @returns State operations sequence.
 */
function calculateStats(history: AttendanceRecord[]) {
    let present = 0;
    let late = 0;
    let absent = 0;
    let hours = 0;
    history.forEach((r) => {
      if (r.status === "Present" || r.status === "Completed") {
        if (r.status === "Present") present++;
        else present++;
      } else if (r.status === "Late") {
        late++;
      } else if (r.status === "Absent") {
        absent++;
      }
      if (r.total_hours) hours += r.total_hours;
    });
    const activeDays = present + late;
    const avg = activeDays > 0 ? hours / activeDays : 0;
    const todayStr = formatDateString(new Date());
    const todayRec = history.find(r => r.attendance_date === todayStr);
    const currentStatus = todayRec ? todayRec.status : "Absent";
    setStats({
      presentDays: present,
      lateDays: late,
      absentDays: absent,
      totalHours: hours,
      averageHours: avg,
      currentStatus
    });
  }
  /**
 * Executes operations logic for handleTimeChange.
 *
 * @param field: "time_in" | "break_out" | "break_in" | "time_out", value: string
 * @returns State operations sequence.
 */
const handleTimeChange = (field: "time_in" | "break_out" | "break_in" | "time_out", value: string) => {
    if (!selectedRecord) return;
    const updated = { ...selectedRecord, [field]: value || null };
    const computedHours = calculateHours(
      updated.time_in,
      updated.time_out,
      updated.break_out,
      updated.break_in
    );
    const computedStatus = getStatus(updated.time_in, updated.time_out);
    setSelectedRecord({
      ...updated,
      total_hours: computedHours,
      status: computedStatus
    });
  };
  /**
 * Executes operations logic for handleRecordChange.
 *
 * @param val: string
 * @returns State operations sequence.
 */
const handleRecordChange = (val: string) => {
    if (!selectedRecord) return;
    setSelectedRecord({ ...selectedRecord, daily_record: val });
  };
  /**
 * Executes operations logic for handleSave.
 *
 * 
 * @returns State operations sequence.
 */
async function handleSave() {
    if (!userId || !selectedRecord) return;
    setSaving(true);
    const computedHours = calculateHours(
      selectedRecord.time_in,
      selectedRecord.time_out,
      selectedRecord.break_out,
      selectedRecord.break_in
    );
    const computedStatus = getStatus(selectedRecord.time_in, selectedRecord.time_out);
    const payload = {
      user_id: userId,
      attendance_date: selectedRecord.attendance_date,
      time_in: selectedRecord.time_in,
      break_out: selectedRecord.break_out,
      break_in: selectedRecord.break_in,
      time_out: selectedRecord.time_out,
      total_hours: computedHours,
      daily_record: selectedRecord.daily_record,
      status: computedStatus
    };
    let error;
    if (selectedRecord.id) {
      const { error: err } = await supabase
        .from("attendance")
        .update(payload)
        .eq("id", selectedRecord.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("attendance")
        .insert([payload]);
      error = err;
    }
    if (!error) {
      await fetchAttendance(userId);
    }
    setSaving(false);
  }
  /**
 * Executes operations logic for handlePunch.
 *
 * @param field: "time_in" | "break_out" | "break_in" | "time_out"
 * @returns State operations sequence.
 */
async function handlePunch(field: "time_in" | "break_out" | "break_in" | "time_out") {
    if (!userId || !selectedRecord) return;
    setSaving(true);
    const now = new Date();
    let hrs = String(now.getHours());
    let mins = String(now.getMinutes()).padStart(2, "0");
    let ampm = Number(hrs) >= 12 ? "PM" : "AM";
    let displayHrs = Number(hrs) % 12;
    if (displayHrs === 0) displayHrs = 12;
    const timeStr = `${displayHrs}:${mins} ${ampm}`;
    const updated = { ...selectedRecord, [field]: timeStr };
    const computedHours = calculateHours(
      updated.time_in,
      updated.time_out,
      updated.break_out,
      updated.break_in
    );
    const computedStatus = getStatus(updated.time_in, updated.time_out);
    const payload = {
      user_id: userId,
      attendance_date: updated.attendance_date,
      time_in: updated.time_in,
      break_out: updated.break_out,
      break_in: updated.break_in,
      time_out: updated.time_out,
      total_hours: computedHours,
      status: computedStatus,
      daily_record: updated.daily_record
    };
    let error;
    if (selectedRecord.id) {
      const { error: err } = await supabase
        .from("attendance")
        .update(payload)
        .eq("id", selectedRecord.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("attendance")
        .insert([payload]);
      error = err;
    }
    if (!error) {
      await fetchAttendance(userId);
    }
    setSaving(false);
  }
  if (loading || !selectedRecord || !profile) {
    return (
      <div className={styles.card_0}>
        <div className={styles.container_1}>
          <div className={styles.container_2}>
            <div className={styles.div_3} />
            <div className={styles.div_4} />
            <div className={styles.table_5} />
            <div className={styles.div_6} />
          </div>
          <p className={styles.table_7}>Loading Attendance...</p>
        </div>
      </div>
    );
  }
  return (
    <AttendanceDashboard
      records={records}
      selectedRecord={selectedRecord}
      stats={stats}
      selectedDate={selectedDate}
      profile={profile}
      onSelectDate={setSelectedDate}
      onTimeChange={handleTimeChange}
      onRecordChange={handleRecordChange}
      onSave={handleSave}
      onPunch={handlePunch}
      isSaving={saving}
    />
  );
}
