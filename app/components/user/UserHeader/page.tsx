'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/components/user/UserHeader/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/components/user/UserHeader/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useEffect, useRef, useState } from 'react';
import { User, Settings, LogOut, ChevronDown, Bell, Sun, Moon, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import NotificationBell from "@/components/shared/NotificationBell";

interface UserData {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface UserHeaderProps {
  onMenuClick?: () => void;
}

const pageConfig: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview and analytics workspace' },
  profile: { title: 'Profile Settings', description: 'Update information and preferences' },
  teams: { title: 'Team Directory', description: 'Collaborate and connect with team members' },
  faq: { title: 'Knowledge Base', description: 'Verified systemic answers' },
  announcements: { title: 'Announcements', description: 'Enterprise communication feeds' },
  messages: { title: 'Messages', description: 'Direct channels and discussion threads' },
  attendance: { title: 'Attendance', description: 'Daily punch logs and historical record ledger' },
  playground: { title: 'Playground', description: 'Interactive development playground' }
};

/**
 * UserHeader
 *
 * Renders the UserHeader interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for UserHeader.
 *
 * @param { onMenuClick }: UserHeaderProps
 * @returns State operations sequence.
 */
export default function UserHeader({ onMenuClick }: UserHeaderProps) {
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

  /**
 * Executes operations logic for loadUser.
 *
 * 
 * @returns State operations sequence.
 */
const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url')
      .eq('id', session.user.id)
      .single();

    const rawRole = profileData?.role || session.user.user_metadata?.role || 'Associate';
    const formattedRole = rawRole.toUpperCase();

    setUserData({
      name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      avatar: profileData?.avatar_url || session.user.user_metadata?.avatar_url || '',
      role: formattedRole,
    });

    try {
      const { data: dbNotifs } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbNotifs) {
        setNotifications(dbNotifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.description,
          type: n.type || 'info',
          is_read: n.is_read || false,
          created_at: n.created_at
        })));
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  /**
 * Executes operations logic for handleMarkAsRead.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const handleMarkAsRead = async (id: string) => {
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
    const theme = localStorage.getItem("theme") || "light";
    setTimeout(() => {
      setIsDark(theme === "dark");
    }, 0);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadUser();
    }, 0);
  }, []);

  useEffect(() => {
    /**
 * Executes operations logic for refresh.
 *
 * 
 * @returns State operations sequence.
 */
const refresh = () => loadUser();
    window.addEventListener("profile-updated", refresh);
    return () => {
      window.removeEventListener("profile-updated", refresh);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('user_realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          loadUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { theme: nextDark ? "dark" : "light" } })
    );
  };

  const initials = userData.name
    ?.split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'US';

  const pathParts = pathname.split('/');
  const currentPathKey = pathParts[1] || 'dashboard';
  const currentPage = pageConfig[currentPathKey] || {
    title: 'Team Padua',
    description: 'Workspace Node',
  };

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

  return (
    <header className={styles.card_1}>
      <div className={styles.container_2}>
        {onMenuClick && (
          <button onClick={onMenuClick} className={styles.table_3}>
            <Menu size={18} />
          </button>
        )}
        <div>
          <h1 className={styles.text_4}>{currentPage.title}</h1>
          <p className={styles.table_5}>{currentPage.description}</p>
        </div>
      </div>

      <div className={styles.container_6}>
        <NotificationBell />

        <div ref={dropdownRef} className={styles.div_22}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={styles.card_23}
          >
            {renderAvatar('h-7 w-7', 'text-[10px]')}
            <span className={styles.text_24}>{userData.name}</span>
            <ChevronDown size={12} className={styles.table_25} />
          </button>

          {profileOpen && (
            <div className={styles.card_26}>
              <div className={styles.card_27}>
                <div className={styles.container_28}>
                  {renderAvatar('h-10 w-10', 'text-xs')}
                  <div className={styles.div_29}>
                    <h3 className={styles.table_30}>{userData.name}</h3>
                    <p className={styles.text_31}>{userData.role}</p>
                    <p className={styles.table_32}>{userData.email}</p>
                  </div>
                </div>
              </div>

              <div className={styles.div_33}>
                <button
                  onClick={() => { router.push('/profile'); setProfileOpen(false); }}
                  className={styles.table_34}
                >
                  <User size={14} className={styles.text_35} /> <span>Profile</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className={styles.table_36}
                >
                  <span className={styles.container_37}>
                    {isDark ? <Sun size={14} className={styles.text_38} /> : <Moon size={14} />}
                    <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                  </span>
                  <span className={styles.text_39}>{isDark ? "Dark" : "Light"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={styles.table_40}
                >
                  <LogOut size={14} /> <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
