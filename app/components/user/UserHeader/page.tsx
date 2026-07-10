'use client';

import styles from "@/styles/components/user/UserHeader/page.module.css";
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, ChevronDown, Bell, Sun, Moon, Menu, Search } from 'lucide-react';
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

export default function UserHeader({ onMenuClick }: UserHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
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
    const savedStatus = localStorage.getItem('presence-status') as 'online' | 'offline' | 'busy';
    if (savedStatus) {
      setPresenceStatus(savedStatus);
    }
  }, []);

  const handleStatusChange = (status: 'online' | 'offline' | 'busy') => {
    setPresenceStatus(status);
    localStorage.setItem('presence-status', status);
    window.dispatchEvent(new CustomEvent('presence-status-change', { detail: { status } }));
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    setTimeout(() => {
      setIsDark(theme === "dark");
      document.documentElement.setAttribute('data-theme', theme);
    }, 0);
  }, []);

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
  };

  useEffect(() => {
    setTimeout(() => {
      loadUser();
    }, 0);
  }, []);

  useEffect(() => {
    const refresh = () => loadUser();
    window.addEventListener("profile-updated", refresh);
    return () => {
      window.removeEventListener("profile-updated", refresh);
    };
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
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
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
    title: 'Workspace',
    description: 'Internal System Node',
  };

  const renderAvatar = (wrapperClass: string, showStatusDot: boolean = false) => (
    <div className="relative shrink-0">
      <div className={wrapperClass}>
        {userData.avatar ? (
          <img src={userData.avatar} alt={userData.name} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showStatusDot && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-white dark:border-background rounded-full shadow-2xs ${
          presenceStatus === 'online' ? 'bg-emerald-500' :
          presenceStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'
        }`} />
      )}
    </div>
  );

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.leftSection}>
        {onMenuClick && (
          <button onClick={onMenuClick} className={styles.mobileMenuBtn}>
            <Menu size={16} />
          </button>
        )}
        <div className="flex md:hidden items-center">
          <Image
            src="/Image/Tp.png"
            alt="Team Padua Logo"
            width={28}
            height={28}
            priority
            className="object-contain"
          />
        </div>
        <div className={styles.titleContainer}>
          <span className={styles.breadcrumb}>Workspace / {currentPage.title}</span>
          <h1 className={styles.pageTitle}>{currentPage.title}</h1>
          <p className={styles.pageDescription}>{currentPage.description}</p>
        </div>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.searchContainer}>
          <Search size={14} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search workspace, files, tools..." 
            className={styles.searchInput} 
          />
        </div>
      </div>

      <div className={styles.rightSection}>
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
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      presenceStatus === 'online' ? 'bg-emerald-500' :
                      presenceStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'
                    }`} />
                    <span className="capitalize">{presenceStatus}</span>
                  </div>
                  <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-[110] animate-in fade-in slide-in-from-top-1 duration-150">
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold hover:bg-muted transition-colors cursor-pointer ${
                          presenceStatus === status.id ? 'bg-primary/10 text-primary' : 'text-foreground'
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
                onClick={() => { router.push('/profile'); setProfileOpen(false); }}
                className={styles.dropdownItem}
              >
                <div className={styles.dropdownItemLeft}>
                  <User size={14} className={styles.dropdownItemIcon} /> <span>Profile</span>
                </div>
              </button>

              <button
                onClick={toggleTheme}
                className={styles.dropdownItem}
              >
                <div className={styles.dropdownItemLeft}>
                  {isDark ? <Sun size={14} className={styles.dropdownItemIcon} /> : <Moon size={14} className={styles.dropdownItemIcon} />}
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </div>
                <span className={styles.themeValue}>{isDark ? "Dark" : "Light"}</span>
              </button>
              <button
                onClick={handleLogout}
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              >
                <div className={styles.dropdownItemLeft}>
                  <LogOut size={14} className={styles.dropdownItemIcon} /> <span>Sign Out</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
