'use client';

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/app/lib/supabase/client";
import Link from "next/link";
import {
  RefreshCw, AlertTriangle,
  CalendarCheck, Users, MessageSquare, Gamepad2,
  Sun, Sunrise, Moon, ChevronRight, Calendar, ArrowUpRight
} from "lucide-react";
import styles from "@/styles/user/dashboard/personal/page.module.css";
import WelcomeModal from "@/components/shared/WelcomeModal";
import WelcomeHero from "@/components/shared/WelcomeHero";

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: <Sunrise size={16} /> };
  if (h < 18) return { text: "Good afternoon", icon: <Sun size={16} /> };
  return { text: "Good evening", icon: <Moon size={16} /> };
}

export default function DashboardPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customPortals, setCustomPortals] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_external_portals');
      if (stored) {
        setCustomPortals(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [phTime, setPhTime] = useState("");
  const [phDate, setPhDate] = useState("");

  const greeting = useMemo(() => getGreeting(), []);

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
        .select("first_name, last_name, role")
        .eq("id", uid)
        .single();
      if (profileData) {
        setUserName(`${profileData.first_name} ${profileData.last_name}`);
        setUserRole(profileData.role || "Associate");
      } else {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User");
        setUserRole("Associate");
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

    return () => {
      clearTimeout(fallback);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const quickLinks = [
    { label: "Attendance", href: "/attendance", icon: CalendarCheck, accent: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400", border: "hover:border-emerald-400 dark:hover:border-emerald-600" },
    { label: "Calendar", href: "/calendar", icon: Calendar, accent: "group-hover:text-amber-600 dark:group-hover:text-amber-400", border: "hover:border-amber-400 dark:hover:border-amber-600" },
    // { label: "Teams", href: "/teams", icon: Users, accent: "group-hover:text-blue-600 dark:group-hover:text-blue-400", border: "hover:border-blue-400 dark:hover:border-blue-600" },
    // { label: "Messages", href: "/messages", icon: MessageSquare, accent: "group-hover:text-violet-600 dark:group-hover:text-violet-400", border: "hover:border-violet-400 dark:hover:border-violet-600" },
    { label: "Playground", href: "/playground", icon: Gamepad2, accent: "group-hover:text-rose-600 dark:group-hover:text-rose-400", border: "hover:border-rose-400 dark:hover:border-rose-600" }
  ];

  return (
    <div className={styles.container}>
      <WelcomeModal userName={userName} role={userRole} />
      {showSplash && (
        <div className={styles.splashOverlay}>
          <div className={styles.splashInner}>
            <div className={styles.splashAnimation}>
              <div className={styles.splashBlur} />
              <div className={styles.splashBorder} />
              <div className={styles.splashSpinner} />
              <svg viewBox="0 0 100 100" className={styles.splashSvg}>
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
            <div className={styles.splashTextWrapper}>
              <p className={styles.splashText}>Syncing your dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17181B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="text-rose-500 mb-4"><AlertTriangle size={48} /></div>
            <h2 className="text-xl font-bold text-white mb-2">Connection Timeout</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We are having trouble loading your dashboard right now. Please check your internet connection or try refreshing.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={async () => { setShowErrorModal(false); await handleRefresh(); }}
                className="flex-1 bg-white text-black py-2 rounded-xl font-bold hover:bg-white/90 transition"
              >
                Reconnect
              </button>
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 bg-white/10 text-white py-2 rounded-xl font-bold hover:bg-white/20 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.mainWrapper}>
        <div className={styles.mainContent}>
          <WelcomeHero userName={userName} role={userRole} />

          {/* External Portals */}
          <div>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <ArrowUpRight size={14} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>External Portals</h2>
                <p className={styles.sectionSubtitle}>Quick access shortcuts to primary service domains and tools</p>
              </div>
            </div>

            <div className={styles.portalsGrid}>
              <a href="https://www.sunlife.com.ph/en/" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
                  <defs>
                    <filter id="sl-shadow-1" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <radialGradient id="sl-globe-1" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#FFECA0" /><stop offset="50%" stopColor="#F4C542" /><stop offset="90%" stopColor="#B28200" /><stop offset="100%" stopColor="#7C5B00" />
                    </radialGradient>
                    <linearGradient id="sl-ray-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2B2" /><stop offset="30%" stopColor="#F4C542" /><stop offset="70%" stopColor="#D89D00" /><stop offset="100%" stopColor="#966C00" />
                    </linearGradient>
                    <mask id="sl-mask-1">
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    </mask>
                  </defs>
                  <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#sl-ray-1)" filter="url(#sl-shadow-1)" />
                  <circle cx="45" cy="56" r="31" fill="url(#sl-globe-1)" mask="url(#sl-mask-1)" filter="url(#sl-shadow-1)" />
                  <path d="M 20 38 A 31 31 0 0 1 70 38 A 28 28 0 0 0 20 38 Z" fill="rgba(255,255,255,0.22)" mask="url(#sl-mask-1)" pointerEvents="none" />
                </svg>
                <span className={styles.portalLabel}>Sun Life Portal</span>
              </a>

              <a href="https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
                  <defs>
                    <filter id="sl-shadow-2" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <radialGradient id="sl-globe-2" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#FFECA0" /><stop offset="50%" stopColor="#F4C542" /><stop offset="90%" stopColor="#B28200" /><stop offset="100%" stopColor="#7C5B00" />
                    </radialGradient>
                    <linearGradient id="sl-ray-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2B2" /><stop offset="30%" stopColor="#F4C542" /><stop offset="70%" stopColor="#D89D00" /><stop offset="100%" stopColor="#966C00" />
                    </linearGradient>
                    <mask id="sl-mask-2">
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    </mask>
                  </defs>
                  <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#sl-ray-2)" filter="url(#sl-shadow-2)" />
                  <circle cx="45" cy="56" r="31" fill="url(#sl-globe-2)" mask="url(#sl-mask-2)" filter="url(#sl-shadow-2)" />
                  <path d="M 20 38 A 31 31 0 0 1 70 38 A 28 28 0 0 0 20 38 Z" fill="rgba(255,255,255,0.22)" mask="url(#sl-mask-2)" pointerEvents="none" />
                </svg>
                <span className={styles.portalLabel}>Advisor Office</span>
              </a>

              <a href="https://docs.google.com/spreadsheets/" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardGreen} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
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
                <span className={styles.portalLabel}>Google Sheets</span>
              </a>

              <a href="https://teampaduatracker.vercel.app/tasktracker" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group flex flex-col items-center justify-center`}>
                <img
                  src="/Image/icon/TP.png"
                  alt="Task Tracker"
                  className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className={`${styles.portalLabel} mt-3`}>Task Tracker</span>
              </a>

              <a href="https://www.jotform.com/" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
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
                <span className={styles.portalLabel}>JotForm</span>
              </a>

              <a href="https://form.jotform.com/261829362405055" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group flex flex-col items-center justify-center`}>
                <img
                  src="/Image/icon/Form.png"
                  alt="JotForm Intern"
                  className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className={`${styles.portalLabel} mt-3`}>JotForm Intern</span>
              </a>

              <a href="https://drive.google.com/drive/folders/1ZLNJHFUFYDkVG9pQwMF2hio89j7vp04x?dmr=1&ec=wgc-drive-hero-goto" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardGreen} group flex flex-col items-center justify-center`}>
                <img
                  src="/Image/icon/drive.png"
                  alt="Google Drive"
                  className="w-12 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className={`${styles.portalLabel} mt-3`}>Google Drive</span>
              </a>

              <a href="https://teams.microsoft.com/" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
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
                <span className={styles.portalLabel}>Microsoft Teams</span>
              </a>

              <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardPink} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
                  <defs>
                    <filter id="canva-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="canva-grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C4CC" />
                      <stop offset="50%" stopColor="#7D2AE8" />
                      <stop offset="100%" stopColor="#FF4F9A" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="40" fill="url(#canva-grad-user)" filter="url(#canva-shadow-user)" />
                  <text x="50" y="56" fill="white" fontSize="16" fontWeight="bold" fontFamily="'Fredoka One', 'Comfortaa', 'Nunito', sans-serif" textAnchor="middle" letterSpacing="-0.5">Canva</text>
                </svg>
                <span className={styles.portalLabel}>Canva</span>
              </a>
              <a href="https://zoom.us/" target="_blank" rel="noopener noreferrer" className={`${styles.portalCard} ${styles.portalCardYellow} group`}>
                <svg viewBox="0 0 100 100" className={styles.portalIcon}>
                  <defs>
                    <filter id="zoom-shadow-user" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="zoom-grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2D8CFF" />
                      <stop offset="100%" stopColor="#0B5CFF" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="40" fill="url(#zoom-grad-user)" filter="url(#zoom-shadow-user)" />
                  <path d="M 33 42 C 33 40, 35 38, 37 38 L 57 38 C 59 38, 61 40, 61 42 L 61 58 C 61 60, 59 62, 57 62 L 37 62 C 35 62, 33 60, 33 58 Z M 63 45 L 75 37 L 75 63 L 63 55 Z" fill="white" />
                </svg>
                <span className={styles.portalLabel}>Zoom</span>
              </a>

              {customPortals.map((portal, idx) => (
                <a
                  key={`custom-portal-${idx}`}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.portalCard} group flex flex-col items-center justify-center`}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-theme)',
                    minHeight: '120px',
                    borderRadius: '16px'
                  }}
                >
                  {portal.iconUrl ? (
                    <img
                      src={portal.iconUrl}
                      alt={portal.name}
                      className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                      }}
                    >
                      {portal.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`${styles.portalLabel} mt-3`}>{portal.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <ArrowUpRight size={14} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Navigation Portal Shortcuts</h2>
                <p className={styles.sectionSubtitle}>Quick internal routing to primary workspace modules</p>
              </div>
            </div>

            <div className={styles.navGrid}>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.navCard} group block`}
                  >
                    <div className={styles.navCardAccent} />
                    <div className={styles.navCardHeader}>
                      <div className={styles.navCardIconWrapper}>
                        <Icon size={18} />
                      </div>
                      <ChevronRight size={16} className={styles.navCardChevron} />
                    </div>
                    <div className={styles.navCardContent}>
                      <h3 className={styles.navCardTitle}>{link.label}</h3>
                      <p className={styles.navCardSubtitle}>Access {link.label.toLowerCase()} module</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <footer className={styles.footer}>
            <div>TeamPadua Member Terminal • 2026</div>
            <div className={styles.footerRight}>
              <span>SLA: 99.99%</span>
              <span>Secure Layer Online</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
