'use client';

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/app/lib/supabase/client";
import AnnouncementWidget from "@/components/shared/AnnouncementWidget";
import Link from "next/link";
import {
  RefreshCw, AlertTriangle,
  CalendarCheck, Users, MessageSquare, Gamepad2,
  Sun, Sunrise, Moon, ChevronRight, LogIn, Coffee, LogOut, Timer,
  Calendar, HelpCircle, ArrowUpRight
} from "lucide-react";
import styles from "@/styles/user/dashboard/personal/page.module.css";

type AttendanceToday = {
  status: string;
  time_in: string | null;
  break_out: string | null;
  break_in: string | null;
  time_out: string | null;
  total_hours: number | null;
};

type AttendanceStats = {
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: number;
  avgHours: number;
};

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: <Sunrise className={styles.text_0} /> };
  if (h < 18) return { text: "Good afternoon", icon: <Sun className={styles.text_1} /> };
  return { text: "Good evening", icon: <Moon className={styles.text_2} /> };
}

function fmtTime(t: string | null): string {
  if (!t) return "—";
  const [hh, mm] = t.split(":");
  const h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${mm} ${ampm}`;
}

export default function DashboardPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [attendanceToday, setAttendanceToday] = useState<AttendanceToday | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ presentDays: 0, lateDays: 0, absentDays: 0, totalHours: 0, avgHours: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) {
        setAnnouncements(data.map((a: any) => ({
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          content: a.content,
          category: a.category,
          priority: a.priority,
          author: a.author,
          publishDate: a.publish_date ? new Date(a.publish_date).toISOString().split('T')[0] : '—',
          isPinned: a.is_pinned || false,
          audience: a.audience || [],
          event_date: a.event_date,
          start_time: a.start_time,
          end_time: a.end_time,
          timezone: a.timezone,
          event_type: a.event_type,
          location_name: a.location_name,
          location_address: a.location_address,
          latitude: a.latitude,
          longitude: a.longitude,
          google_place_id: a.google_place_id,
          visibility_type: a.visibility_type,
          require_acknowledgement: a.require_acknowledgement
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel('user_dashboard_realtime_announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [phTime, setPhTime] = useState("");
  const [phDate, setPhDate] = useState("");
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});

  const greeting = useMemo(() => getGreeting(), []);

  const toggleHelp = (sec: string) => {
    setShowHelp(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhTime(now.toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setPhDate(now.toLocaleDateString("en-US", { timeZone: "Asia/Manila", weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const uid = session.user.id;
      setUserId(uid);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", uid)
        .single();
      if (profileData) {
        setUserName(profileData.full_name || session.user.user_metadata?.full_name || "User");
        setUserRole(profileData.role || "Associate");
      } else {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User");
        setUserRole("Associate");
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const { data: todayAtt } = await supabase
        .from("attendance")
        .select("status, time_in, break_out, break_in, time_out, total_hours")
        .eq("user_id", uid)
        .eq("attendance_date", todayStr)
        .single();
      setAttendanceToday(todayAtt || null);

      const { data: allAtt } = await supabase
        .from("attendance")
        .select("status, total_hours")
        .eq("user_id", uid);
      if (allAtt) {
        let present = 0, late = 0, absent = 0, hours = 0;
        allAtt.forEach((r: any) => {
          if (r.status === "Present" || r.status === "Completed") present++;
          else if (r.status === "Late") late++;
          else if (r.status === "Absent") absent++;
          if (r.total_hours) hours += Number(r.total_hours);
        });
        const active = present + late;
        setAttendanceStats({ presentDays: present, lateDays: late, absentDays: absent, totalHours: hours, avgHours: active > 0 ? parseFloat((hours / active).toFixed(1)) : 0 });
      }

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", uid)
        .eq("is_read", false);
      setUnreadMessages(count || 0);

    } catch {
      setShowErrorModal(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fallback = setTimeout(() => setShowSplash(false), 2000);
    fetchDashboardData().then(() => setTimeout(() => setShowSplash(false), 800));

    const channelAttendance = supabase
      .channel("realtime-personal-attendance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(fallback);
      supabase.removeChannel(channelAttendance);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    await fetchAnnouncements();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const attendanceBadge = (status: string | undefined) => {
    const s = status || "Absent";
    const m: Record<string, string> = {
      Present: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
      Completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
      Late: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700",
      Absent: "bg-zinc-100 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
    };
    return m[s] || m.Absent;
  };

  const quickLinks = [
    { label: "Attendance", href: "/attendance", icon: CalendarCheck, accent: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400", border: "hover:border-emerald-400 dark:hover:border-emerald-600" },
    { label: "Calendar", href: "/calendar", icon: Calendar, accent: "group-hover:text-amber-600 dark:group-hover:text-amber-400", border: "hover:border-amber-400 dark:hover:border-amber-600" },
    { label: "Teams", href: "/teams", icon: Users, accent: "group-hover:text-blue-600 dark:group-hover:text-blue-400", border: "hover:border-blue-400 dark:hover:border-blue-600" },
    { label: "Messages", href: "/messages", icon: MessageSquare, accent: "group-hover:text-violet-600 dark:group-hover:text-violet-400", border: "hover:border-violet-400 dark:hover:border-violet-600" },
    { label: "Playground", href: "/playground", icon: Gamepad2, accent: "group-hover:text-rose-600 dark:group-hover:text-rose-400", border: "hover:border-rose-400 dark:hover:border-rose-600" }
  ];

  return (
    <div className={styles.text_3}>
      {showSplash && (
        <div className={styles.table_4}>
          <div className={styles.container_5}>
            <div className={styles.container_6}>
              <div className={styles.div_7} />
              <div className={styles.div_8} />
              <div className={styles.table_9} />
              <svg viewBox="0 0 100 100" className={styles.div_10}>
                <defs>
                  <filter id="splash-shadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
                  </filter>
                  <radialGradient id="splash-globe-3d" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFECA0" />
                    <stop offset="50%" stopColor="#F4C542" />
                    <stop offset="90%" stopColor="#B28200" />
                    <stop offset="100%" stopColor="#7C5B00" />
                  </radialGradient>
                  <linearGradient id="splash-ray-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B2" />
                    <stop offset="30%" stopColor="#F4C542" />
                    <stop offset="70%" stopColor="#D89D00" />
                    <stop offset="100%" stopColor="#966C00" />
                  </linearGradient>
                  <mask id="splash-grid-mask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  </mask>
                </defs>
                <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#splash-ray-metal)" filter="url(#splash-shadow)" />
                <circle cx="45" cy="56" r="31" fill="url(#splash-globe-3d)" mask="url(#splash-grid-mask)" filter="url(#splash-shadow)" />
                <path d="M 20 38 A 31 31 0 0 1 70 38 A 28 28 0 0 0 20 38 Z" fill="rgba(255,255,255,0.25)" mask="url(#splash-grid-mask)" pointerEvents="none" />
              </svg>
            </div>
            <div className={styles.div_11}>
              <p className={styles.table_12}>Syncing your dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className={styles.container_13}>
          <div className={styles.card_14}>
            <div className={styles.text_15}><AlertTriangle size={48} /></div>
            <h2 className={styles.text_16}>Connection Timeout</h2>
            <p className={styles.text_17}>
              We are having trouble loading your dashboard right now. Please check your internet connection or try refreshing.
            </p>
            <div className={styles.text_18}>
              <div>[Error] Connection sync timeout</div>
              <div>[Error] Failed to load workspace data</div>
              <div>[System] Ready to retry connection</div>
            </div>
            <div className={styles.container_19}>
              <button
                onClick={async () => { setShowErrorModal(false); await handleRefresh(); }}
                className={styles.table_20}
              >
                Reconnect
              </button>
              <button
                onClick={() => setShowErrorModal(false)}
                className={styles.table_21}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.div_22}>
        <div className={styles.table_23} />
        <div className={styles.container_24}>
          <div className={styles.div_25}>
            <div className={styles.container_26}>
              {greeting.icon}
              <span className={styles.table_27}>{greeting.text}</span>
            </div>
            <h1 className={styles.table_28}>
              Welcome, <span className={styles.text_29}>
                {userName}
              </span>
            </h1>
            {userRole && (
              <p className={styles.table_30}>{userRole}</p>
            )}
          </div>

          <div className={styles.container_31}>
            <div className={styles.text_32}>
              <p className={styles.table_33}>{phDate}</p>
            </div>
            <div className={styles.div_34} />
            <div className={styles.container_35}>
              <span className={styles.input_36}>{phTime || "00:00:00 AM"}</span>
              <button
                onClick={handleRefresh}
                className={styles.card_37}
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card_38}>
        <div className={styles.container_39}>
          <div className="p-1 bg-[#F4C542]/10 rounded-md text-[#F4C542] flex items-center justify-center">
            <ArrowUpRight size={13} />
          </div>
          <h3 className={styles.text_40}>Launchpad Center</h3>
          <button
            onClick={() => toggleHelp('launchpad')}
            className={styles.table_41}
            title="View Instructions"
          >
            <HelpCircle size={13} />
          </button>
        </div>
        {showHelp['launchpad'] && (
          <div className={styles.table_42}>
            Launch external systems and operational tools. Click any card to launch the selected service platform in a new browser window.
          </div>
        )}
        <div className={styles.container_43}>
          <a
            href="https://www.sunlife.com.ph/en/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_44} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_45} group`}>
              <defs>
                <filter id="real-shadow-user-1" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <radialGradient id="globe-3d-user-1" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FFECA0" /><stop offset="50%" stopColor="#F4C542" /><stop offset="90%" stopColor="#B28200" /><stop offset="100%" stopColor="#7C5B00" />
                </radialGradient>
                <linearGradient id="ray-metal-user-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2B2" /><stop offset="30%" stopColor="#F4C542" /><stop offset="70%" stopColor="#D89D00" /><stop offset="100%" stopColor="#966C00" />
                </linearGradient>
                <mask id="grid-mask-user-1">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </mask>
              </defs>
              <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#ray-metal-user-1)" filter="url(#real-shadow-user-1)" />
              <circle cx="45" cy="56" r="31" fill="url(#globe-3d-user-1)" mask="url(#grid-mask-user-1)" filter="url(#real-shadow-user-1)" />
              <path d="M 20 38 A 31 31 0 0 1 70 38 A 28 28 0 0 0 20 38 Z" fill="rgba(255,255,255,0.22)" mask="url(#grid-mask-user-1)" pointerEvents="none" />
            </svg>
            <span className={`${styles.table_46} group`}>Sun Life</span>
          </a>
          <a
            href="https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_47} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_48} group`}>
              <defs>
                <filter id="real-shadow-user-2" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <radialGradient id="globe-3d-user-2" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FFECA0" /><stop offset="50%" stopColor="#F4C542" /><stop offset="90%" stopColor="#B28200" /><stop offset="100%" stopColor="#7C5B00" />
                </radialGradient>
                <linearGradient id="ray-metal-user-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2B2" /><stop offset="30%" stopColor="#F4C542" /><stop offset="70%" stopColor="#D89D00" /><stop offset="100%" stopColor="#966C00" />
                </linearGradient>
                <mask id="grid-mask-user-2">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </mask>
              </defs>
              <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#ray-metal-user-2)" filter="url(#real-shadow-user-2)" />
              <circle cx="45" cy="56" r="31" fill="url(#globe-3d-user-2)" mask="url(#grid-mask-user-2)" filter="url(#real-shadow-user-2)" />
              <path d="M 20 38 A 31 31 0 0 1 70 38 A 28 28 0 0 0 20 38 Z" fill="rgba(255,255,255,0.22)" mask="url(#grid-mask-user-2)" pointerEvents="none" />
            </svg>
            <span className={`${styles.table_49} group`}>Advisor Office</span>
          </a>
          <a
            href="https://docs.google.com/spreadsheets/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_50} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_51} group`}>
              <defs>
                <filter id="excel-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <linearGradient id="ex-bg-user" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1F9A55" /><stop offset="100%" stopColor="#0B4C28" />
                </linearGradient>
                <linearGradient id="ex-plate-user" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#167C41" /><stop offset="100%" stopColor="#0D522A" />
                </linearGradient>
                <linearGradient id="ex-x-user" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#E0E0E0" />
                </linearGradient>
              </defs>
              <rect x="30" y="15" width="55" height="70" rx="14" fill="url(#ex-bg-user)" filter="url(#excel-shadow-user)" />
              <path d="M 44 15 L 85 56 L 85 15 Z" fill="rgba(255,255,255,0.08)" />
              <rect x="15" y="32" width="36" height="36" rx="8" fill="url(#ex-plate-user)" filter="url(#excel-shadow-user)" stroke="#1F9A55" strokeWidth="1" />
              <rect x="16" y="33" width="34" height="34" rx="7" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <path d="M24 41 L30 41 L33 50 L36 41 L42 41 L36 53 L42 65 L36 65 L33 56 L30 65 L24 65 L30 53 Z" fill="url(#ex-x-user)" />
            </svg>
            <span className={`${styles.table_52} group`}>Sheets</span>
          </a>
          <a
            href="https://teampaduatracker.vercel.app/tasktracker"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_50} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_51} group`}>
              <defs>
                <filter id="tracker-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <linearGradient id="tracker-grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2B2" /><stop offset="100%" stopColor="#F4C542" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="#1E1E24" filter="url(#tracker-shadow-user)" stroke="#F4C542" strokeWidth="2" />
              <path d="M35 50 L45 60 L65 40" stroke="url(#tracker-grad-user)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className={`${styles.table_52} group`}>Task Tracker</span>
          </a>
          <a
            href="https://www.jotform.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_53} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_54} group`}>
              <defs>
                <filter id="jot-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.45" />
                </filter>
                <linearGradient id="jt-blue-user" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#66B7FF" /><stop offset="30%" stopColor="#0087FF" /><stop offset="100%" stopColor="#004C99" />
                </linearGradient>
                <linearGradient id="jt-orange-user" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF9455" /><stop offset="30%" stopColor="#FF6100" /><stop offset="100%" stopColor="#B23E00" />
                </linearGradient>
                <linearGradient id="jt-yellow-user" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFD366" /><stop offset="30%" stopColor="#FFB700" /><stop offset="100%" stopColor="#B27A00" />
                </linearGradient>
                <linearGradient id="jt-dark-user" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3275" /><stop offset="100%" stopColor="#061138" />
                </linearGradient>
              </defs>
              <path d="M 12 62 C 12 60, 14 59, 16 61 L 39 84 C 41 86, 40 88, 38 88 L 16 88 C 14 88, 12 86, 12 84 Z" fill="url(#jt-dark-user)" filter="url(#jot-shadow-user)" />
              <g filter="url(#jot-shadow-user)">
                <path d="M 52 13 C 58 19, 58 29, 52 35 L 34 53 C 28 59, 18 59, 12 53 C 6 47, 6 37, 12 31 L 30 13 C 36 7, 46 7, 52 13 Z" fill="url(#jt-blue-user)" />
                <path d="M 48 16 C 52 20, 52 27, 48 31 L 34 45 C 32 47, 28 47, 26 45 C 24 43, 24 39, 26 37 L 40 23 C 42 21, 45 19, 48 16 Z" fill="rgba(255,255,255,0.25)" pointerEvents="none" />
              </g>
              <g filter="url(#jot-shadow-user)">
                <path d="M 78 27 C 84 33, 84 43, 78 49 L 49 78 C 43 84, 33 84, 27 78 C 21 72, 21 62, 27 56 L 56 27 C 62 21, 72 21, 78 27 Z" fill="url(#jt-orange-user)" />
                <path d="M 74 30 C 78 34, 78 41, 74 45 L 49 70 C 47 72, 43 72, 41 70 C 39 68, 39 64, 41 62 L 66 37 C 68 35, 71 33, 74 30 Z" fill="rgba(255,255,255,0.25)" pointerEvents="none" />
              </g>
              <g filter="url(#jot-shadow-user)">
                <path d="M 83 53 C 89 59, 89 69, 83 75 L 69 89 C 63 95, 53 95, 47 89 C 41 83, 41 73, 47 67 L 61 53 C 67 47, 77 47, 83 53 Z" fill="url(#jt-yellow-user)" />
                <path d="M 79 56 C 83 60, 83 67, 79 71 L 69 81 C 67 83, 63 83, 61 81 C 59 79, 59 75, 61 73 L 71 63 C 73 61, 76 59, 79 56 Z" fill="rgba(255,255,255,0.25)" pointerEvents="none" />
              </g>
            </svg>
            <span className={`${styles.table_55} group`}>JotForm</span>
          </a>
          <a
            href="https://form.jotform.com/261829362405055"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_53} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_54} group`}>
              <defs>
                <filter id="jot-intern-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.45" />
                </filter>
                <linearGradient id="jt-intern-blue-user" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#66B7FF" /><stop offset="100%" stopColor="#004C99" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="url(#jt-intern-blue-user)" filter="url(#jot-intern-shadow-user)" />
              <path d="M35 50 L45 60 L65 40 M30 30 H70 M30 70 H70" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
            <span className={`${styles.table_55} group`}>JotForm Intern</span>
          </a>
          <a
            href="https://drive.google.com/drive/folders/1ZLNJHFUFYDkVG9pQwMF2hio89j7vp04x?dmr=1&ec=wgc-drive-hero-goto"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_47} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_48} group`}>
              <defs>
                <filter id="drive-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3" />
                </filter>
              </defs>
              <g filter="url(#drive-shadow-user)">
                <path d="M50 20 L80 72 H58 L39 38 Z" fill="#0F9D58" />
                <path d="M50 20 L20 72 H42 L61 38 Z" fill="#4285F4" />
                <path d="M20 72 H80 L69 52 H31 Z" fill="#F4B400" />
              </g>
            </svg>
            <span className={`${styles.table_49} group`}>Google Drive</span>
          </a>
          <a
            href="https://teams.microsoft.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_47} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_48} group`}>
              <defs>
                <filter id="teams-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <linearGradient id="teams-bg-grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7B83EB" /><stop offset="100%" stopColor="#464EB8" />
                </linearGradient>
                <linearGradient id="teams-icon-grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5B64E2" /><stop offset="100%" stopColor="#3B429F" />
                </linearGradient>
              </defs>
              <rect x="25" y="20" width="55" height="55" rx="12" fill="url(#teams-bg-grad-user)" filter="url(#teams-shadow-user)" />
              <rect x="15" y="32" width="30" height="30" rx="8" fill="url(#teams-icon-grad-user)" filter="url(#teams-shadow-user)" />
              <text x="30" y="53" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
              <circle cx="60" cy="38" r="8" fill="white" />
              <path d="M48 58 C48 51, 54 48, 60 48 C66 48, 72 51, 72 58 Z" fill="white" />
            </svg>
            <span className={`${styles.table_49} group`}>Microsoft Teams</span>
          </a>
          <a
            href="https://www.canva.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card_56} group`}
          >
            <svg viewBox="0 0 100 100" className={`${styles.table_57} group`}>
              <defs>
                <filter id="canva-shadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <linearGradient id="canva-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00C4CC" />
                  <stop offset="50%" stopColor="#7D2AE8" />
                  <stop offset="100%" stopColor="#FF4F9A" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="url(#canva-gradient)" filter="url(#canva-shadow)" />
              <text x="50" y="56" fill="white" fontSize="16" fontWeight="bold" fontFamily="'Fredoka One', 'Comfortaa', 'Nunito', sans-serif" textAnchor="middle" letterSpacing="-0.5">Canva</text>
            </svg>
            <span className={`${styles.table_58} group`}>Canva</span>
          </a>
        </div>
      </div>

      {/* Active Corporate Announcements Feed */}
      <div className={styles.card_83}>
        <div className={styles.container_84}>
          <div>
            <h3 className={styles.text_86}>📢 Corporate Announcements</h3>
          </div>
        </div>
        {announcements.length === 0 ? (
          <div className={styles.feedEmpty}>
            No active corporate broadcasts.
          </div>
        ) : (
          <div className={styles.feedGrid}>
            {announcements.map((item) => (
              <AnnouncementWidget
                key={item.id}
                announcement={item}
                onRefresh={fetchAnnouncements}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.container_81}>
        <div className={styles.div_82}>
          <div className={styles.card_83}>
            <div className={styles.container_84}>
              <div>
                <div className={styles.container_85}>
                  <h3 className={styles.text_86}>Attendance overview metrics</h3>
                  <button
                    onClick={() => toggleHelp('overview')}
                    className={styles.table_87}
                    title="View Instructions"
                  >
                    <HelpCircle size={13} />
                  </button>
                </div>
                {showHelp['overview'] && (
                  <div className={styles.table_88}>
                    Attendance historical summary. Provides averages of present days, late logs, and calculated work hours since account activation.
                  </div>
                )}
              </div>
              <Link href="/attendance" className={styles.table_89}>
                View All <ChevronRight className={styles.div_90} />
              </Link>
            </div>
            <div className={styles.container_91}>
              {[
                { label: "Present", value: attendanceStats.presentDays, color: "text-emerald-700 dark:text-emerald-400" },
                { label: "Late", value: attendanceStats.lateDays, color: "text-amber-700 dark:text-amber-400" },
                { label: "Absent", value: attendanceStats.absentDays, color: "text-zinc-500 dark:text-zinc-400" },
                { label: "Total Hours", value: `${attendanceStats.totalHours.toFixed(1)}h`, color: "text-blue-700 dark:text-blue-400" },
                { label: "Avg/Day", value: `${attendanceStats.avgHours}h`, color: "text-violet-700 dark:text-violet-400" }
              ].map((s) => (
                <div key={s.label} className={styles.text_92}>
                  <span className={styles.table_93}>{s.label}</span>
                  <span className={`${styles.text_105} ${s.color} block mt-1`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.div_94}>
          <div className={styles.card_95}>
            <div>
              <div className={styles.container_96}>
                <h3 className={styles.text_97}>Navigation Portal Shortcuts</h3>
                <button
                  onClick={() => toggleHelp('shortcuts')}
                  className={styles.table_98}
                  title="View Instructions"
                >
                  <HelpCircle size={13} />
                </button>
              </div>
              {showHelp['shortcuts'] && (
                <div className={styles.table_99}>
                  Navigation shortcuts. Easily access attendance logs, the month calendar view, task boards, department listings, conversations, or playground features.
                </div>
              )}
            </div>
            <div className={styles.div_100}>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.table_106} ${link.border} group`}
                  >
                    <Icon size={16} className={`${styles.table_107} ${link.accent}`} />
                    <span className={styles.container_101}>{link.label}</span>
                    {link.label === "Messages" && unreadMessages > 0 && (
                      <span className={styles.text_102}>{unreadMessages}</span>
                    )}
                    <ChevronRight size={14} className={`${styles.table_103} group`} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
