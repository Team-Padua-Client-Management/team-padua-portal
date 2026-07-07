/**
 * page.tsx
 *
 * Main component module in features path: app/components/admin/AdminSidebar/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\components\admin\AdminSidebar\page.tsx
'use client';

import styles from "@/styles/components/admin/AdminSidebar/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ClipboardList, CalendarCheck,
  Building2, UsersRound, Megaphone, MessageSquare,
  CircleHelp, Paintbrush, ChevronDown, ChevronRight, X
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * AdminSidebar
 *
 * Renders the AdminSidebar interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminSidebar.
 *
 * @param { isOpen, onClose }: AdminSidebarProps
 * @returns State operations sequence.
 */
export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [greeting, setGreeting] = useState('');

  // Setup dynamic Philippines Time greeting
  useEffect(() => {
    /**
 * Executes operations logic for getPhGreeting.
 *
 * 
 * @returns State operations sequence.
 */
const getPhGreeting = () => {
      try {
        const options = { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false } as const;
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const hour = parseInt(formatter.format(new Date()), 10);

        if (hour >= 5 && hour < 12) return 'Good Morning, Admin';
        if (hour >= 12 && hour < 18) return 'Good Afternoon, Admin';
        return 'Good Evening, Admin';
      } catch (err) {
        return 'Welcome, Admin';
      }
    };

    setTimeout(() => {
      setGreeting(getPhGreeting());
    }, 0);
    const interval = setInterval(() => {
      setGreeting(getPhGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/dashboard')) {
      setTimeout(() => {
        setDashboardOpen(true);
      }, 0);
    }
  }, [pathname]);

  const dashboardItems = [
    { name: 'Overview', href: '/admin/dashboard' },
    { name: 'Analytics', href: '/admin/dashboard/analytics' },
  ];

  const menuItems = [
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'CPST', href: '/admin/cpst', icon: ClipboardList },
    { name: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
    { name: 'Departments', href: '/admin/departments', icon: Building2 },
    { name: 'Teams', href: '/admin/teams', icon: UsersRound },
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Knowledge Base', href: '/admin/faq', icon: CircleHelp },
    { name: 'Design Studio', href: '/admin/Design', icon: Paintbrush },
  ];

  const sidebarContent = (
    <div className={styles.card_0}>
      <div className={styles.card_1}>
        <div className={styles.container_2}>
          <div>
            <h1 className={styles.table_3}>Team Padua</h1>
            <p className={styles.table_4}>Control Terminal</p>
          </div>
          {onClose && (
            <button onClick={onClose} className={styles.table_5}>
              <X size={16} />
            </button>
          )}
        </div>
        {greeting && (
          <p className={styles.table_6}>
            ● {greeting}
          </p>
        )}
      </div>

      <nav className={styles.card_7}>
        {/* Dashboard Node with sub-menu */}
        <div className={styles.div_8}>
          <div
            className={`${styles.table_18} ${
              pathname.startsWith('/admin/dashboard')
                ? 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border-l-2 border-[#F4C542] font-bold'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            }`}
          >
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              className={styles.container_9}
            >
              <LayoutDashboard size={16} className={pathname.startsWith('/admin/dashboard') ? 'text-[#F4C542]' : 'text-muted-foreground'} />
              <span>Dashboard</span>
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDashboardOpen(!dashboardOpen);
              }}
              className={styles.table_10}
            >
              {dashboardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          
          {dashboardOpen && (
            <div className={styles.div_11}>
              {dashboardItems.map((sub) => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    className={`${styles.table_19} ${
                      subActive
                        ? 'bg-[#FFF7D6]/50 dark:bg-[#2E2818]/50 text-black dark:text-[#F4C542] font-bold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Regular Menu Nodes */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${styles.table_20} ${
                active
                  ? 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border-l-2 border-[#F4C542] font-bold'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={16} className={active ? 'text-[#F4C542]' : 'text-muted-foreground'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.card_12}>
        <p className={styles.text_13}>Admin Portal Secures Online</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.card_14}>
        {sidebarContent}
      </aside>
      {/* Mobile drawer support */}
      {isOpen && (
        <div className={styles.container_15}>
          <div className={styles.div_16} onClick={onClose} />
          <aside className={styles.card_17}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
