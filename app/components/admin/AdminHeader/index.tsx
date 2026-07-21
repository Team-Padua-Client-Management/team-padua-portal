'use client';

import styles from "@/styles/components/admin/AdminHeader/page.module.css";
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, ChevronDown, Bell, Sun, Moon, Search, Settings, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase/client';
import NotificationBell from "@/components/shared/NotificationBell";
import { useAdminLayoutContext } from '@/app/components/admin/AdminLayoutContext';
import ProfileAvatar from "@/components/shared/ProfileAvatar";

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
  faq: { title: 'Knowledge Base', description: 'Verified systemic answers' },
  announcements: { title: 'Announcements', description: 'Enterprise communication feeds' },
  attendance: { title: 'Attendance', description: 'Daily punch logs and historical record ledger' },
  members: { title: 'Members', description: 'Manage team roles and access' },
  departments: { title: 'Departments', description: 'Organizational sectors' },
  Design: { title: 'Design Studio', description: 'Creative canvas editor' },
  cpst: { title: '2026 CPST', description: 'Client Prospect Servicing Tracker' },
};

// --- Real brand logo SVGs (official marks, not generic Lucide glyphs) ---

// Literal Zoom app icon
const ZoomLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#0B5CFF" />
    <path d="M17.5 8.5l-3 2.3v-1.3c0-.8-.7-1.5-1.5-1.5H6c-.8 0-1.5.7-1.5 1.5v5c0 .8.7 1.5 1.5 1.5h7c.8 0 1.5-.7 1.5-1.5v-1.3l3 2.3c.6.4 1.5.1 1.5-.7v-5.6c0-.8-.9-1.1-1.5-.7z" fill="#fff" />
  </svg>
);

// Google Drive triangle mark, no background box — sits on the button's own tint
const GoogleDriveLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
      fill="#0066da"
    />
    <path
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
      fill="#00ac47"
    />
    <path
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
      fill="#ea4335"
    />
    <path
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
      fill="#00832d"
    />
    <path
      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
      fill="#2684fc"
    />
    <path
      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
      fill="#ffba00"
    />
  </svg>
);

const quickTools = [
  {
    id: 'zoom',
    label: 'Zoom',
    url: 'https://bit.ly/4wrEVBg',
    Logo: ZoomLogo,
    // Zoom now has its own full-color icon, so use the neutral tint background like Drive
    bg: 'rgba(148, 163, 184, 0.16)',
  },
  {
    id: 'google-drive',
    label: 'Google Drive',
    url: 'https://drive.google.com/drive/folders/1ZLNJHFUFYDkVG9pQwMF2hio89j7vp04x?usp=sharing',
    Logo: GoogleDriveLogo,
    // Drive keeps its own multi-color mark on a soft neutral tint
    bg: 'rgba(148, 163, 184, 0.16)',
  },
];

export default function AdminHeader({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const layoutContext = useAdminLayoutContext();
  const [isMobile, setIsMobile] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [presenceStatus, setPresenceStatus] = useState<'online' | 'offline' | 'busy'>('online');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    avatar: '',
    role: '',
  });

  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const uniqueId = Math.random().toString(36).slice(2, 9);
      channel = supabase
        .channel(`admin-header-profile-${session.user.id}-${uniqueId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${session.user.id}`,
          },
          (payload) => {
            if (payload.new && 'status' in payload.new) {
              setPresenceStatus((payload.new as any).status || 'online');
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (status: 'online' | 'offline' | 'busy') => {
    setPresenceStatus(status);
    localStorage.setItem('presence-status', status);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from("profiles")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);
    }

    window.dispatchEvent(new CustomEvent('presence-status-change', { detail: { status } }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setTimeout(() => {
      const isThemeDark = ["dark", "midnight", "forest", "sunset", "slate"].includes(theme);
      setIsDark(isThemeDark);
      document.documentElement.setAttribute('data-theme', theme);
      if (isThemeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, 0);
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  const hideHeader = isMobile && layoutContext?.isSidebarOpen;

  const loadUserAndBirthdays = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url, status')
      .eq('id', session.user.id)
      .single();

    const rawRole = profileData?.role || session.user.user_metadata?.role || 'Associate';
    const googleAvatar = session.user.user_metadata?.avatar_url || '';

    if (profileData?.status) {
      setPresenceStatus(profileData.status as any);
    }

    setUserData({
      name:
        profileData?.full_name ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split('@')[0] ||
        'User',
      email: session.user.email || '',
      avatar: profileData?.avatar_url || googleAvatar || '',
      role: rawRole.toUpperCase(),
    });
  };

  useEffect(() => {
    setTimeout(() => {
      loadUserAndBirthdays();
    }, 0);
  }, []);

  useEffect(() => {
    const refresh = () => loadUserAndBirthdays();
    window.addEventListener('profile-updated', refresh);
    return () => window.removeEventListener('profile-updated', refresh);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    const current = localStorage.getItem('theme') || 'light';
    const isCurrentDark = ["dark", "midnight", "forest", "sunset", "slate"].includes(current);
    const nextTheme = isCurrentDark ? 'light' : 'dark';

    const isNextDark = nextTheme === 'dark';
    setIsDark(isNextDark);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (isNextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: nextTheme } }));
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
  const currentPage = pageConfig[currentPathKey] || { title: 'Workspace', description: 'Administrative Node' };

  const renderAvatar = (wrapperClass: string, showStatusDot: boolean = false) => (
    <div className="relative shrink-0">
      <div className={wrapperClass} style={{ border: "none", background: "none" }}>
        <ProfileAvatar
          avatarUrl={userData.avatar}
          name={userData.name}
          size={28}
        />
      </div>
      {showStatusDot && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-white dark:border-background rounded-full shadow-2xs ${presenceStatus === 'online' ? 'bg-emerald-500' :
          presenceStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'
          }`} />
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
    <>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''} ${hideHeader ? styles.headerHidden : ''}`}>
        <div className={styles.leftSection}>
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 mr-2 text-foreground/70 hover:text-foreground cursor-pointer rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className={styles.titleContainer}>
            <span className={styles.breadcrumb}>Admin / {currentPage.title}</span>
            <h1 className={styles.pageTitle}>{currentPage.title}</h1>
            <p className={styles.pageDescription}>{currentPage.description}</p>
          </div>
        </div>

        <div className={styles.centerSection}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search clients, advisors, records..."
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-border/60">
            {quickTools.map((tool) => {
              const Logo = tool.Logo;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => window.open(tool.url, "_blank", "noopener,noreferrer")}
                  title={tool.label}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105"
                  style={{
                    backgroundColor: tool.bg,
                  }}
                >
                  <Logo size={tool.id === 'zoom' ? 22 : 18} />
                </button>
              );
            })}
          </div>

          <NotificationBell />

          <div ref={dropdownRef} className={styles.profileContainer}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={styles.profileBtn}
            >
              {renderAvatar(styles.avatar, true)}
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{userData.name}</span>
                <span className={styles.profileRole}>{userData.role}</span>
              </div>
              <ChevronDown
                size={14}
                className={`${styles.chevronIcon} ${profileOpen ? styles.chevronIconOpen : ''}`}
              />
            </button>

            <div className={`${styles.dropdown} ${profileOpen ? styles.dropdownOpen : ''}`}>
              <div className={styles.dropdownHeader}>
                {renderAvatar(styles.dropdownAvatar, true)}
                <div className={styles.dropdownUserDetails}>
                  <h3 className={styles.dropdownName}>{userData.name}</h3>
                  <p className={styles.dropdownRole}>{userData.role}</p>
                  <p className={styles.dropdownEmail}>{userData.email}</p>
                </div>
              </div>

              <div className="border-b border-border/50 py-2 px-4 flex items-center justify-center bg-muted/10 relative">
                <div className="relative w-full">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="w-full flex items-center justify-between pl-3 pr-2.5 py-1.5 bg-muted/30 border border-border rounded-full text-xs font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${presenceStatus === 'online' ? 'bg-emerald-500' :
                        presenceStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                      <span className="capitalize">{presenceStatus}</span>
                    </div>
                    <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {statusDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-110 animate-in fade-in slide-in-from-top-1 duration-150">
                      {([
                        { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                        { id: 'busy', label: 'Busy', color: 'bg-rose-500' },
                        { id: 'offline', label: 'Offline', color: 'bg-slate-400' },
                      ] as const).map((status) => (
                        <button
                          key={status.id}
                          onClick={() => {
                            handleStatusChange(status.id);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold hover:bg-muted transition-colors cursor-pointer ${presenceStatus === status.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                            }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${status.color}`} />
                          <span>{status.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.dropdownBody}>
                <button
                  onClick={() => {
                    router.push(pathname.startsWith('/admin') ? '/admin/profile' : '/profile');
                    setProfileOpen(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <div className={styles.dropdownItemLeft}>
                    <User size={14} className={styles.dropdownItemIcon} />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    router.push('/admin/settings');
                    setProfileOpen(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <div className={styles.dropdownItemLeft}>
                    <Settings size={14} className={styles.dropdownItemIcon} />
                    <span>Settings</span>
                  </div>
                </button>
                <button
                  onClick={toggleTheme}
                  className={styles.dropdownItem}
                >
                  <div className={styles.dropdownItemLeft}>
                    {isDark ? <Sun size={14} className={styles.dropdownItemIcon} /> : <Moon size={14} className={styles.dropdownItemIcon} />}
                    <span>Cycle Theme</span>
                  </div>
                  <span className={styles.themeValue} style={{ textTransform: 'capitalize' }}>
                    {mounted ? localStorage.getItem('theme') || 'light' : 'light'}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                >
                  <div className={styles.dropdownItemLeft}>
                    <LogOut size={14} className={styles.dropdownItemIcon} />
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isCpst && (
        <div className={styles.cpstTabsContainer}>
          {cpstTabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`${styles.cpstTab} ${active ? styles.cpstTabActive : ''}`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}