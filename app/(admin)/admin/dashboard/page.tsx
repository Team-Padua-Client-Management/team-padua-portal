'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, ClipboardList, CalendarCheck, CalendarDays,
  Building2, UsersRound, Megaphone, MessageSquare,
  CircleHelp, Paintbrush, RefreshCw, Loader2, ArrowUpRight, Wallet,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/dashboard/page.module.css";
import WelcomeModal from "@/components/shared/WelcomeModal";

type KpiData = {
  members: number;
  cpst: number;
  acr: number;
  cpc: number;
  fst: number;
  mngt: number;
  ppu: number;
  attendance: number;
  announcements: number;
  designs: number;
  faqs: number;
};

export default function DashboardOverviewPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('Administrator');
  const [greeting, setGreeting] = useState('Good Morning');

  const [kpis, setKpis] = useState<KpiData>({
    members: 0,
    cpst: 0,
    acr: 0,
    cpc: 0,
    fst: 0,
    mngt: 0,
    ppu: 0,
    attendance: 0,
    announcements: 0,
    designs: 0,
    faqs: 0
  });

  const getPhGreeting = () => {
    try {
      const options = { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false } as const;
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const hour = parseInt(formatter.format(new Date()), 10);

      if (hour >= 5 && hour < 12) return 'Good Morning';
      if (hour >= 12 && hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    } catch (err) {
      return 'Welcome';
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator');
        setAdminId(user.id);
      }

      const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: cpstCount } = await supabase.from('cpst_clients').select('*', { count: 'exact', head: true });
      const { count: acrCount } = await supabase.from('acr_clients').select('*', { count: 'exact', head: true });
      const { count: cpcCount } = await supabase.from('cpc_clients').select('*', { count: 'exact', head: true });
      const { count: fstCount } = await supabase.from('fst_clients').select('*', { count: 'exact', head: true });
      const { count: mngtCount } = await supabase.from('mngt_clients').select('*', { count: 'exact', head: true });
      const { count: ppuCount } = await supabase.from('ppu_clients').select('*', { count: 'exact', head: true });
      const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
      const { count: announcementsCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
      const { count: designsCount } = await supabase.from('design_templates').select('*', { count: 'exact', head: true });
      const { count: faqsCount } = await supabase.from('faqs').select('*', { count: 'exact', head: true });

      setKpis({
        members: membersCount || 0,
        cpst: cpstCount || 0,
        acr: acrCount || 0,
        cpc: cpcCount || 0,
        fst: fstCount || 0,
        mngt: mngtCount || 0,
        ppu: ppuCount || 0,
        attendance: attendanceCount || 0,
        announcements: announcementsCount || 0,
        designs: designsCount || 0,
        faqs: faqsCount || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setGreeting(getPhGreeting());
    fetchDashboardData();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className={styles.text_0}>
      <WelcomeModal userName={adminName} role="Admin" />
      {showSplash && (
        <div className={styles.table_1}>
          <div className={styles.container_2}>
            <div className={styles.container_3}>
              <div className={styles.div_4} />
              <div className={styles.div_5} />
              <div className={styles.table_6} />
              <svg viewBox="0 0 100 100" className={styles.div_7}>
                <defs>
                  <filter id="admin-splash-shadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                  </filter>
                  <radialGradient id="admin-splash-globe-3d" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFECA0" /><stop offset="50%" stopColor="#F4C542" /><stop offset="90%" stopColor="#B28200" /><stop offset="100%" stopColor="#7C5B00" />
                  </radialGradient>
                  <linearGradient id="admin-splash-ray-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B2" /><stop offset="30%" stopColor="#F4C542" /><stop offset="70%" stopColor="#D89D00" /><stop offset="100%" stopColor="#966C00" />
                  </linearGradient>
                  <mask id="admin-splash-grid-mask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  </mask>
                </defs>
                <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#admin-splash-ray-metal)" filter="url(#admin-splash-shadow)" />
                <circle cx="45" cy="56" r="31" fill="url(#admin-splash-globe-3d)" mask="url(#admin-splash-grid-mask)" filter="url(#admin-splash-shadow)" />
                <path d="M 20 38 A 31 31 0 0 1 70 38 A 28 28 0 0 0 20 38 Z" fill="rgba(255,255,255,0.25)" mask="url(#admin-splash-grid-mask)" pointerEvents="none" />
              </svg>
            </div>
            <div className={styles.div_8}>
              <p className={styles.table_9}>Syncing admin dashboard...</p>
            </div>
          </div>
        </div>
      )}

      <Sidebar />

      <div className={styles.container_10}>
        <Header />

        <main className={styles.div_11}>
          <div className={styles.heroGlassCard}>
            <div className={styles.heroGlow} />

            <div className={styles.heroLeft}>
              <div className={styles.greetingBadge}>
                {greeting}
              </div>
              <h1 className={styles.welcomeText}>
                Welcome, <span className={styles.usernameHighlight}>{adminName}</span>
              </h1>
              <div className={styles.memberBadge}>Administrator</div>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.dateDisplay}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className={styles.verticalDivider} />
              <div className={styles.timeDisplay}>
                <span className={styles.timeText}>ACTIVE</span>
              </div>
              <button
                onClick={handleRefresh}
                className={styles.refreshButton}
                title="Refresh Workspace Grid"
              >
                <RefreshCw size={16} className={isRefreshing ? styles.spinIcon : ""} />
              </button>
            </div>
          </div>

          <div className={styles.div_23}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
                <ArrowUpRight size={14} />
              </div>
              <div>
                <h2 className={styles.table_24}>External Portals</h2>
                <p className={styles.text_25}>Quick access shortcuts to primary service domains and tools</p>
              </div>
            </div>
            <div className={styles.container_26}>
              {/* Sun Life Portal */}
              <div
                onClick={() => window.open("https://www.sunlife.com.ph/en/", "_blank", "noopener,noreferrer")}
                className={`${styles.card_27} group relative`}
              >
                <Link
                  href="/admin/portals/sun-life"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Sun Life Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_28} group`}>
                  <defs>
                    <filter id="sl-shadow-1" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <radialGradient id="sl-globe-1" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#FFECA0" />
                      <stop offset="50%" stopColor="#F4C542" />
                      <stop offset="90%" stopColor="#B28200" />
                      <stop offset="100%" stopColor="#7C5B00" />
                    </radialGradient>
                    <linearGradient id="sl-ray-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2B2" />
                      <stop offset="30%" stopColor="#F4C542" />
                      <stop offset="70%" stopColor="#D89D00" />
                      <stop offset="100%" stopColor="#966C00" />
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
                <span className={`${styles.table_29} group`}>Sun Life Portal</span>
              </div>

              {/* Advisor Office */}
              <div
                onClick={() => window.open("https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:", "_blank", "noopener,noreferrer")}
                className={`${styles.card_30} group relative`}
              >
                <Link
                  href="/admin/portals/advisor-office"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Advisor Office Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_31} group`}>
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
                <span className={`${styles.table_32} group`}>Advisor Office</span>
              </div>

              {/* Google Sheets */}
              <div
                onClick={() => window.open("https://bit.ly/4f2fpLK", "_blank", "noopener,noreferrer")}
                className={`${styles.card_33} group relative`}
              >
                <Link
                  href="/admin/portals/google-sheets"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Google Sheets Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_34} group`}>
                  <defs>
                    <filter id="excel-shadow-adm" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="ex-bg-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1F9A55" /><stop offset="100%" stopColor="#0B4C28" />
                    </linearGradient>
                    <linearGradient id="ex-plate-adm" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#167C41" /><stop offset="100%" stopColor="#0D522A" />
                    </linearGradient>
                    <linearGradient id="ex-x-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#E0E0E0" />
                    </linearGradient>
                  </defs>
                  <rect x="30" y="15" width="55" height="70" rx="14" fill="url(#ex-bg-adm)" filter="url(#excel-shadow-adm)" />
                  <path d="M 44 15 L 85 56 L 85 15 Z" fill="rgba(255,255,255,0.08)" />
                  <rect x="15" y="32" width="36" height="36" rx="8" fill="url(#ex-plate-adm)" filter="url(#excel-shadow-adm)" stroke="#1F9A55" strokeWidth="1" />
                  <rect x="16" y="33" width="34" height="34" rx="7" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <path d="M24 41 L30 41 L33 50 L36 41 L42 41 L36 53 L42 65 L36 65 L33 56 L30 65 L24 65 L30 53 Z" fill="url(#ex-x-adm)" />
                </svg>
                <span className={`${styles.table_35} group`}>Google Sheets</span>
              </div>

              {/* Task Tracker */}
              <div
                onClick={() => window.open("https://teampaduatracker.vercel.app/tasktracker", "_blank", "noopener,noreferrer")}
                className={`${styles.card_33} group flex flex-col items-center justify-center relative`}
              >
                <Link
                  href="/admin/portals/task-tracker"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Task Tracker Resources"
                >
                  <Settings size={13} />
                </Link>
                <img
                  src="/Image/icon/TP.png"
                  alt="Task Tracker"
                  className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className={`${styles.table_35} mt-3`}>
                  Task Tracker
                </span>
              </div>

              {/* JotForm */}
              <div
                onClick={() => window.open("https://www.jotform.com/", "_blank", "noopener,noreferrer")}
                className={`${styles.card_36} group relative`}
              >
                <Link
                  href="/admin/portals/jotform"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage JotForm Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_37} group`}>
                  <defs>
                    <filter id="jot-shadow-adm" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.45" />
                    </filter>
                    <linearGradient id="jt-blue-adm" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#66B7FF" /><stop offset="30%" stopColor="#0087FF" /><stop offset="100%" stopColor="#004C99" />
                    </linearGradient>
                    <linearGradient id="jt-orange-adm" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF9455" /><stop offset="30%" stopColor="#FF6100" /><stop offset="100%" stopColor="#B23E00" />
                    </linearGradient>
                    <linearGradient id="jt-yellow-adm" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFD366" /><stop offset="30%" stopColor="#FFB700" /><stop offset="100%" stopColor="#B27A00" />
                    </linearGradient>
                    <linearGradient id="jt-dark-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1E3275" /><stop offset="100%" stopColor="#061138" />
                    </linearGradient>
                  </defs>
                  <path d="M 12 62 C 12 60, 14 59, 16 61 L 39 84 C 41 86, 40 88, 38 88 L 16 88 C 14 88, 12 86, 12 84 Z" fill="url(#jt-dark-adm)" filter="url(#jot-shadow-adm)" />
                  <g filter="url(#jot-shadow-adm)">
                    <path d="M 52 13 C 58 19, 58 29, 52 35 L 34 53 C 28 59, 18 59, 12 53 C 6 47, 6 37, 12 31 L 30 13 C 36 7, 46 7, 52 13 Z" fill="url(#jt-blue-adm)" />
                    <path d="M 48 16 C 52 20, 52 27, 48 31 L 34 45 C 32 47, 28 47, 26 45 C 24 43, 24 39, 26 37 L 40 23 C 42 21, 45 19, 48 16 Z" fill="rgba(255,255,255,0.25)" pointerEvents="none" />
                  </g>
                  <g filter="url(#jot-shadow-adm)">
                    <path d="M 78 27 C 84 33, 84 43, 78 49 L 49 78 C 43 84, 33 84, 27 78 C 21 72, 21 62, 27 56 L 56 27 C 62 21, 72 21, 78 27 Z" fill="url(#jt-orange-adm)" />
                    <path d="M 74 30 C 78 34, 78 41, 74 45 L 49 70 C 47 72, 43 72, 41 70 C 39 68, 39 64, 41 62 L 66 37 C 68 35, 71 33, 74 30 Z" fill="rgba(255,255,255,0.25)" pointerEvents="none" />
                  </g>
                  <g filter="url(#jot-shadow-adm)">
                    <path d="M 83 53 C 89 59, 89 69, 83 75 L 69 89 C 63 95, 53 95, 47 89 C 41 83, 41 73, 47 67 L 61 53 C 67 47, 77 47, 83 53 Z" fill="url(#jt-yellow-adm)" />
                    <path d="M 79 56 C 83 60, 83 67, 79 71 L 69 81 C 67 83, 63 83, 61 81 C 59 79, 59 75, 61 73 L 71 63 C 73 61, 76 59, 79 56 Z" fill="rgba(255,255,255,0.25)" pointerEvents="none" />
                  </g>
                </svg>
                <span className={`${styles.table_38} group`}>JotForm</span>
              </div>

              {/* JotForm Intern */}
              <div
                onClick={() => window.open("https://form.jotform.com/261829362405055", "_blank", "noopener,noreferrer")}
                className={`${styles.card_36} group relative`}
              >
                <Link
                  href="/admin/portals/jotform"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage JotForm Resources"
                >
                  <Settings size={13} />
                </Link>
                <img
                  src="/Image/icon/Form.png"
                  alt="JotForm Intern"
                  className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className={`${styles.table_38} group`}>JotForm Intern</span>
              </div>

              {/* Google Drive */}
              <div
                onClick={() => window.open("https://drive.google.com/drive/folders/1ZLNJHFUFYDkVG9pQwMF2hio89j7vp04x?usp=sharing", "_blank", "noopener,noreferrer")}
                className={`${styles.card_30} group relative`}
              >
                <Link
                  href="/admin/portals/google-drive"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Google Drive Resources"
                >
                  <Settings size={13} />
                </Link>
                <img
                  src="/Image/icon/drive.png"
                  alt="Google Drive"
                  className="w-12 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className={`${styles.table_32} group`}>Google Drive</span>
              </div>

              {/* Microsoft Teams */}
              <div
                onClick={() => window.open("https://teams.microsoft.com/", "_blank", "noopener,noreferrer")}
                className={`${styles.card_30} group relative`}
              >
                <Link
                  href="/admin/portals/microsoft-teams"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Microsoft Teams Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_31} group`}>
                  <defs>
                    <filter id="teams-shadow-adm" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="teams-bg-grad-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7B83EB" /><stop offset="100%" stopColor="#464EB8" />
                    </linearGradient>
                    <linearGradient id="teams-icon-grad-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5B64E2" /><stop offset="100%" stopColor="#3B429F" />
                    </linearGradient>
                  </defs>
                  <rect x="25" y="20" width="55" height="55" rx="12" fill="url(#teams-bg-grad-adm)" filter="url(#teams-shadow-adm)" />
                  <rect x="15" y="32" width="30" height="30" rx="8" fill="url(#teams-icon-grad-adm)" filter="url(#teams-shadow-adm)" />
                  <text x="30" y="53" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
                  <circle cx="60" cy="38" r="8" fill="white" />
                  <path d="M48 58 C48 51, 54 48, 60 48 C66 48, 72 51, 72 58 Z" fill="white" />
                </svg>
                <span className={`${styles.table_32} group`}>Microsoft Teams</span>
              </div>

              {/* Canva */}
              <div
                onClick={() => window.open("https://www.canva.com/", "_blank", "noopener,noreferrer")}
                className={`${styles.card_39} group relative`}
              >
                <Link
                  href="/admin/portals/canva"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Canva Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_40} group`}>
                  <defs>
                    <filter id="canva-shadow-adm" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="canva-grad-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C4CC" />
                      <stop offset="50%" stopColor="#7D2AE8" />
                      <stop offset="100%" stopColor="#FF4F9A" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="40" fill="url(#canva-grad-adm)" filter="url(#canva-shadow-adm)" />
                  <text x="50" y="56" fill="white" fontSize="16" fontWeight="bold" fontFamily="'Fredoka One', 'Comfortaa', 'Nunito', sans-serif" textAnchor="middle" letterSpacing="-0.5">Canva</text>
                </svg>
                <span className={`${styles.table_41} group`}>Canva</span>
              </div>

              {/* Zoom */}
              <div
                onClick={() => window.open("https://bit.ly/4wrEVBg", "_blank", "noopener,noreferrer")}
                className={`${styles.card_30} group relative`}
              >
                <Link
                  href="/admin/portals/zoom"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#F4C542]/20 hover:text-[#F4C542] hover:scale-110 z-10 flex items-center justify-center text-text-secondary cursor-pointer"
                  title="Manage Zoom Resources"
                >
                  <Settings size={13} />
                </Link>
                <svg viewBox="0 0 100 100" className={`${styles.table_31} group`}>
                  <defs>
                    <filter id="zoom-shadow-adm" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="zoom-grad-adm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2D8CFF" />
                      <stop offset="100%" stopColor="#0B5CFF" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="40" fill="url(#zoom-grad-adm)" filter="url(#zoom-shadow-adm)" />
                  <path d="M 33 42 C 33 40, 35 38, 37 38 L 57 38 C 59 38, 61 40, 61 42 L 61 58 C 61 60, 59 62, 57 62 L 37 62 C 35 62, 33 60, 33 58 Z M 63 45 L 75 37 L 75 63 L 63 55 Z" fill="white" />
                </svg>
                <span className={`${styles.table_32} group`}>Zoom</span>
              </div>
            </div>
          </div>

          <div className={styles.div_42}>
            <div>
              <h3 className={styles.table_43}>Workspace Metrics Overview</h3>
              <p className={styles.text_44}>Live database statistics counters across workspace sectors and links to manage</p>
            </div>
            <div className={styles.container_45}>
              <Link href="/admin/members" className={`${styles.card_46} group`}>
                <div className={styles.text_47}>
                  <span className={styles.table_48}>Members</span>
                  <Users size={14} className={`${styles.table_49} group`} />
                </div>
                <div className={styles.container_50}>
                  <h3 className={styles.table_51}>{kpis.members}</h3>
                  <span className={styles.text_52}>Manage <ArrowUpRight size={10} /></span>
                </div>
              </Link>

              <Link href="/admin/cpst" className={`${styles.card_53} group`}>
                <div className={styles.text_54}>
                  <span className={styles.table_55}>CPST</span>
                  <ClipboardList size={14} className={`${styles.table_56} group`} />
                </div>
                <div className={styles.container_57}>
                  <h3 className={styles.table_58}>{kpis.cpst}</h3>
                  <span className={styles.text_59}>Prospects <ArrowUpRight size={10} /></span>
                </div>
              </Link>

              <Link href="/admin/acr" className={`${styles.card_67} group`}>
                <div className={styles.text_68}>
                  <span className={styles.table_69}>ACR</span>
                  <Building2 size={14} className={`${styles.table_70} group`} />
                </div>
                <div className={styles.container_71}>
                  <h3 className={styles.table_72}>{kpis.acr}</h3>
                  <span className={styles.text_73}>Sector <ArrowUpRight size={10} /></span>
                </div>
              </Link>

              <Link href="/admin/cpc" className={`${styles.card_46} group`}>
                <div className={styles.text_47}>
                  <span className={styles.table_48}>CPC</span>
                  <UsersRound size={14} className={`${styles.table_49} group`} />
                </div>
                <div className={styles.container_50}>
                  <h3 className={styles.table_51}>{kpis.cpc}</h3>
                  <span className={styles.text_52}>Sector <ArrowUpRight size={10} /></span>
                </div>
              </Link>

              <Link href="/admin/fst" className={`${styles.card_53} group`}>
                <div className={styles.text_54}>
                  <span className={styles.table_55}>FST</span>
                  <CalendarDays size={14} className={`${styles.table_56} group`} />
                </div>
                <div className={styles.container_57}>
                  <h3 className={styles.table_58}>{kpis.fst}</h3>
                  <span className={styles.text_59}>Sector <ArrowUpRight size={10} /></span>
                </div>
              </Link>

              <Link href="/admin/mngt" className={`${styles.card_67} group`}>
                <div className={styles.text_68}>
                  <span className={styles.table_69}>MNGT</span>
                  <MessageSquare size={14} className={`${styles.table_70} group`} />
                </div>
                <div className={styles.container_71}>
                  <h3 className={styles.table_72}>{kpis.mngt}</h3>
                  <span className={styles.text_73}>Sector <ArrowUpRight size={10} /></span>
                </div>
              </Link>

              <Link href="/admin/ppu" className={`${styles.card_46} group`}>
                <div className={styles.text_47}>
                  <span className={styles.table_48}>PPU</span>
                  <Wallet size={14} className={`${styles.table_49} group`} />
                </div>
                <div className={styles.container_50}>
                  <h3 className={styles.table_51}>{kpis.ppu}</h3>
                  <span className={styles.text_52}>Sector <ArrowUpRight size={10} /></span>
                </div>
              </Link>


            </div>
          </div>

          <footer className={styles.text_95}>
            <div>TeamPadua Operations Control Terminal • 2026</div>
            <div className={styles.container_96}>
              <span>SLA: 99.99%</span>
              <span>Secure Layer Online</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}