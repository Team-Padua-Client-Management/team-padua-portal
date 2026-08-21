'use client';

import styles from "@/styles/components/admin/AdminHeader/page.module.css";
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, ChevronDown, Bell, Sun, Moon, Search, Settings, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@src/lib/supabase/client';
import NotificationBell from "@src/components/shared/NotificationBell";
import { useAdminLayoutContext } from '@src/components/layout';
import ProfileAvatar from "@src/components/shared/ProfileAvatar";
import { isDarkTheme, useThemeTransition } from "@src/lib/theme";

// Search hook & dropdown
// import { useAdminSearch } from '@src/lib/search/useAdminSearch';
import AdminSearchDropdown from '@src/components/admin/AdminHeader/AdminSearchDropdown';

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

// --- Real brand logo SVGs (official marks, not generic Lucide glyphs) ---



export default function AdminHeader({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const layoutContext = useAdminLayoutContext();
  const [isMobile, setIsMobile] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [presenceStatus, setPresenceStatus] = useState<'online' | 'offline' | 'busy'>('online');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // const {
  //   query: searchQuery,
  //   setQuery: setSearchQuery,
  //   groupedResults,
  //   isLoading: isSearchLoading,
  //   hasResults: hasSearchResults,
  // } = useAdminSearch(300);

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

    const name = profileData?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
    const email = session.user.email || '';
    const avatar = profileData?.avatar_url || googleAvatar || '';
    const provider = session.user.app_metadata?.provider;

    if (provider === 'google') {
      localStorage.setItem("tp_saved_google", JSON.stringify({ name, email, avatar }));
    }

    setUserData({
      name,
      email,
      avatar,
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

  const { applyThemeWithTransition, theme: currentTheme } = useThemeTransition();

  const toggleTheme = (e?: React.MouseEvent) => {
    const current = currentTheme || 'light';
    const isCurrentDark = isDarkTheme(current);
    const nextTheme = isCurrentDark ? 'light' : 'dark';

    setIsDark(!isCurrentDark);
    setIsThemeSpinning(true);
    setTimeout(() => setIsThemeSpinning(false), 550);
    applyThemeWithTransition(nextTheme, e);
  };

  const initials =
    userData.name
      ?.split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'US';

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
          <Link href="/admin/dashboard" className="flex items-center gap-3.5 group transition-opacity hover:opacity-90">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={38}
              height={38}
              className="object-contain shrink-0"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight whitespace-nowrap text-foreground dark:text-white leading-tight">
                Team Padua
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest font-mono mt-0.5 whitespace-nowrap text-muted-foreground">
                Control Terminal
              </p>
            </div>
          </Link>
        </div>

        {/* <div className={styles.centerSection}>
          <div className={styles.searchContainerWrapper}>
            <div className={styles.searchContainer}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search clients, requests, activities, tasks..."
                className={styles.searchInput}
                value={searchQuery}   
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <AdminSearchDropdown
              isOpen={isSearchOpen}
              query={searchQuery}
              isLoading={isSearchLoading}
              groupedResults={groupedResults}
              hasResults={hasSearchResults}
              onClose={() => setIsSearchOpen(false)}
              onSelectResult={() => setSearchQuery('')}
            />
          </div>
        </div> */}

        <div className={styles.rightSection}>

          <NotificationBell />

          <div ref={dropdownRef} className={styles.profileContainer}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={styles.profileBtn}
            >
              {renderAvatar(styles.avatar, true)}
              <div className={styles.profileInfo}>
                <span className={`${styles.profileName} dark:text-white`}>{userData.name}</span>
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
                  <h3 className={`${styles.dropdownName} dark:text-white`}>{userData.name}</h3>
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
                  onClick={(e) => toggleTheme(e)}
                  className={styles.dropdownItem}
                >
                  <div className={styles.dropdownItemLeft}>
                    {isDark ? (
                      <Sun size={14} className={`${styles.dropdownItemIcon} ${isThemeSpinning ? 'theme-icon-spin' : ''}`} />
                    ) : (
                      <Moon size={14} className={`${styles.dropdownItemIcon} ${isThemeSpinning ? 'theme-icon-spin' : ''}`} />
                    )}
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
