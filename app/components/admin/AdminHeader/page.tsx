'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/components/admin/AdminHeader/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/components/admin/AdminHeader/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, ChevronDown, Bell, Sun, Moon, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase/client';
import NotificationBell from "@/components/shared/NotificationBell";

interface HeaderProps {
  onMenuClick?: () => void;
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  birthdate: string;
  relationship: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const pageConfig: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview and analytics workspace' },
  profile: { title: 'Profile', description: 'Manage account credentials' },
  teams: { title: 'Teams', description: 'Organizational operational nodes' },
  faq: { title: 'Knowledge Base', description: 'Verified systemic answers' },
  announcements: { title: 'Announcements', description: 'Enterprise communication feeds' },
  messages: { title: 'Messages', description: 'Realtime chat channels' },
  attendance: { title: 'Attendance', description: 'Daily punch logs and historical record ledger' },
  members: { title: 'Members', description: 'Manage team roles and access' },
  departments: { title: 'Departments', description: 'Organizational sectors' },
  Design: { title: 'Design Studio', description: 'Creative canvas editor' },
  cpst: { title: '2026 CPST', description: 'Client Prospect Servicing Tracker' },
};

/**
 * AdminHeader
 *
 * Renders the AdminHeader interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminHeader.
 *
 * @param { onMenuClick }: HeaderProps
 * @returns State operations sequence.
 */
export default function AdminHeader({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    avatar: '',
    role: '',
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setTimeout(() => {
      setIsDark(theme === 'dark');
    }, 0);
  }, []);

  /**
 * Executes operations logic for getDaysUntilBirthday.
 *
 * @param birthdateStr: string
 * @returns State operations sequence.
 */
const getDaysUntilBirthday = (birthdateStr: string) => {
    if (!birthdateStr) return -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birthDate = new Date(birthdateStr);
    const nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBday.getTime() < today.getTime()) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
 * Executes operations logic for loadUserAndBirthdays.
 *
 * 
 * @returns State operations sequence.
 */
const loadUserAndBirthdays = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url')
      .eq('id', session.user.id)
      .single();

    const rawRole = profileData?.role || session.user.user_metadata?.role || 'Associate';
    setUserData({
      name:
        profileData?.full_name ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split('@')[0] ||
        'User',
      email: session.user.email || '',
      avatar: profileData?.avatar_url || session.user.user_metadata?.avatar_url || '',
      role: rawRole.toUpperCase(),
    });

    try {
      const res = await fetch('/api/clients');
      if (!res.ok) return;
      const clientsData: Client[] = await res.json();

      const milestones: Record<number, string> = {
        0: 'Birthday Today 🎂',
        1: 'Birthday Tomorrow',
        3: 'Birthday in 3 Days',
        7: 'Birthday in 7 Days',
        14: 'Birthday in 14 Days',
        30: 'Birthday in 30 Days',
      };

      const { data: dbNotifs } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      const list: NotificationItem[] = (dbNotifs || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        type: n.type || 'info',
        is_read: n.is_read || false,
        created_at: n.created_at
      }));

      clientsData.forEach((client) => {
        const days = getDaysUntilBirthday(client.birthdate);
        if (days in milestones) {
          list.push({
            id: `birthday-${days}-${client.id}`,
            title: milestones[days],
            description:
              days === 0
                ? `${client.name} has their birthday today!`
                : `${client.name}'s birthday is in ${days} day${days > 1 ? 's' : ''}.`,
            type: days === 0 ? 'today' : 'upcoming',
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      });

      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  /**
 * Executes operations logic for handleMarkAsRead.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const handleMarkAsRead = async (id: string) => {
    if (id.startsWith('birthday-')) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      loadUserAndBirthdays();
    }, 0);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin_realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          loadUserAndBirthdays();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    /**
 * Executes operations logic for refresh.
 *
 * 
 * @returns State operations sequence.
 */
const refresh = () => loadUserAndBirthdays();
    window.addEventListener('profile-updated', refresh);
    return () => window.removeEventListener('profile-updated', refresh);
  }, []);

  useEffect(() => {
    /**
 * Executes operations logic for handleClickOutside.
 *
 * @param event: MouseEvent
 * @returns State operations sequence.
 */
const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
 * Executes operations logic for handleLogout.
 *
 * 
 * @returns State operations sequence.
 */
const handleLogout = async () => {
    await /* Terminate authenticated security token session */ supabase.auth.signOut();
    router.push('/auth/login');
  };

  /**
 * Executes operations logic for toggleTheme.
 *
 * 
 * @returns State operations sequence.
 */
const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: nextDark ? 'dark' : 'light' } }));
  };

  const initials =
    userData.name
      ?.split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'US';

  const pathParts = pathname.split('/');
  const currentPathKey = pathParts[2] || pathParts[1] || 'dashboard';
  const currentPage = pageConfig[currentPathKey] || { title: 'Team Padua', description: 'Workspace Node' };

  /**
 * Executes operations logic for renderAvatar.
 *
 * @param sizeClass: string, textClass: string
 * @returns State operations sequence.
 */
const renderAvatar = (sizeClass: string, textClass: string) => (
    <div className={`${sizeClass} overflow-hidden rounded-lg border border-border bg-[#FFF7D6] dark:bg-[#2E2818] flex items-center justify-center font-bold text-[#F4C542] shrink-0`}>
      {userData.avatar ? (
        <img src={userData.avatar} alt={userData.name} className={styles.div_0} />
      ) : (
        <span className={textClass}>{initials}</span>
      )}
    </div>
  );

  const isCpst = pathname.startsWith('/admin/cpst');
  const cpstTabs = [
    { name: 'Overview', href: '/admin/cpst' },
    { name: 'Analytics', href: '/admin/cpst/analytics' },
    { name: 'Birthday Center', href: '/admin/cpst/greetings' },
  ];

  return (
    <header className={styles.card_1}>
      <div className={styles.container_2}>
        <div className={styles.container_3}>
          <button
            onClick={() => onMenuClick?.()}
            className={styles.card_4}
          >
            <Menu size={15} />
          </button>
          <div>
            <h1 className={styles.text_5}>{currentPage.title}</h1>
            <p className={styles.table_6}>
              {currentPage.description}
            </p>
          </div>
        </div>

        <div className={styles.container_7}>
          <NotificationBell />

          <div ref={dropdownRef} className={styles.div_23}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={styles.card_24}
            >
              {renderAvatar('h-7 w-7', 'text-[10px]')}
              <span className={styles.text_25}>{userData.name}</span>
              <ChevronDown size={12} className={styles.table_26} />
            </button>

            {profileOpen && (
              <div className={styles.card_27}>
                <div className={styles.card_28}>
                  <div className={styles.container_29}>
                    {renderAvatar('h-10 w-10', 'text-xs')}
                    <div className={styles.div_30}>
                      <h3 className={styles.table_31}>{userData.name}</h3>
                      <p className={styles.text_32}>{userData.role}</p>
                      <p className={styles.table_33}>{userData.email}</p>
                    </div>
                  </div>
                </div>
                <div className={styles.div_34}>
                  <button
                    onClick={() => {
                      router.push(pathname.startsWith('/admin') ? '/admin/profile' : '/profile');
                      setProfileOpen(false);
                    }}
                    className={styles.table_35}
                  >
                    <User size={14} className={styles.text_36} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={styles.table_37}
                  >
                    <span className={styles.container_38}>
                      {isDark ? <Sun size={14} className={styles.text_39} /> : <Moon size={14} />}
                      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </span>
                    <span className={styles.text_40}>{isDark ? 'Dark' : 'Light'}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className={styles.table_41}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCpst && (
        <div className={styles.card_42}>
          <div className={styles.container_43}>
            {cpstTabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`${styles.table_46} ${active
                    ? 'border-[#F4C542] text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
