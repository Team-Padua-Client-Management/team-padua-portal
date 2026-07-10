// C:\website\tp\app\components\admin\AdminSidebar\page.tsx
'use client';

import styles from "@/styles/components/admin/AdminSidebar/page.module.css";
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarCheck,
  ChevronDown, ChevronRight, ChevronLeft, X,
  Briefcase,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [clientServicingOpen, setClientServicingOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed') === 'true';
    setIsCollapsed(saved);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
    window.dispatchEvent(new CustomEvent('admin-sidebar-collapse-change', { detail: { collapsed: next } }));
  };

  // Setup Philippines time greeting
  useEffect(() => {
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
    const clientServicingPaths = ['/admin/cpst', '/admin/acr', '/admin/cpc', '/admin/fst', '/admin/mngt', '/admin/ppu'];
    if (clientServicingPaths.some(p => pathname.startsWith(p))) {
      setTimeout(() => {
        setClientServicingOpen(true);
      }, 0);
    }
  }, [pathname]);

  const dashboardItems = [
    { name: 'Overview', href: '/admin/dashboard' },
  ];

  const clientServicingItems = [
    { name: 'CPST', href: '/admin/cpst' },
    { name: 'ACR', href: '/admin/acr' },
    { name: 'CPC', href: '/admin/cpc' },
    { name: 'FST', href: '/admin/fst' },
    { name: 'MNGT', href: '/admin/mngt' },
    { name: 'PPU', href: '/admin/ppu' },
  ];

  const menuItems = [
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarCheck },
  ];

  const sidebarContent = (
    <div className={styles.card_0}>
      {/* Header */}
      <div className={`${styles.card_1} ${isCollapsed ? styles.card_1_collapsed : ''}`}>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={styles.toggleChevron}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className={styles.container_2}>
          <div className="flex items-center gap-3">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className={`object-contain shrink-0 ${styles.logoFade} ${isCollapsed ? styles.logoFadeHidden : ''}`}
            />
            <div className={`${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
              <h1 className={styles.table_3}>Team Padua</h1>
              <p className={styles.table_4}>Control Terminal</p>
            </div>
          </div>
          {onClose && !isCollapsed && (
            <button onClick={onClose} className={styles.table_5}>
              <X size={16} />
            </button>
          )}
        </div>

        {greeting && (
          <p className={`${styles.table_6} ${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
            ● {greeting}
          </p>
        )}
      </div>

      <nav className={`${styles.card_7} ${isCollapsed ? 'px-2' : 'p-4'}`}>
        {/* Dashboard Node with sub-menu */}
        <div className={styles.div_8}>
          <div
            className={`${isCollapsed ? styles.navItemCollapsed : styles.table_18} ${pathname.startsWith('/admin/dashboard')
              ? 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border-l-2 border-[#F4C542] font-bold'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              }`}
          >
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              title={isCollapsed ? "Dashboard" : undefined}
              className={isCollapsed ? 'flex items-center justify-center w-full' : styles.container_9}
            >
              <LayoutDashboard size={16} className={`shrink-0 ${pathname.startsWith('/admin/dashboard') ? 'text-[#F4C542]' : 'text-muted-foreground'}`} />
              <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>Dashboard</span>
            </Link>
            {!isCollapsed && (
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
            )}
          </div>

          {!isCollapsed && dashboardOpen && (
            <div className={styles.div_11}>
              {dashboardItems.map((sub) => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    className={`${styles.table_19} transition-all duration-300 ease-in-out ${subActive
                      ? 'bg-primary/10 text-primary font-bold shadow-[0_0_15px_rgba(244,197,66,0.15)] rounded-full px-4'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground rounded-full px-4'
                      }`}
                  >
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Client Servicing Node with sub-menu */}
        <div className={styles.div_8}>
          <div
            className={`${isCollapsed ? styles.navItemCollapsed : styles.table_18} ${clientServicingItems.some(item => pathname.startsWith(item.href))
              ? 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border-l-2 border-[#F4C542] font-bold'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              }`}
          >
            <button
              onClick={() => {
                if (isCollapsed) {
                  window.location.href = clientServicingItems[0].href;
                } else {
                  setClientServicingOpen(!clientServicingOpen);
                }
              }}
              title={isCollapsed ? "Client Servicing" : undefined}
              className={isCollapsed ? 'flex items-center justify-center w-full' : styles.container_9}
            >
              <Briefcase size={16} className={`shrink-0 ${clientServicingItems.some(item => pathname.startsWith(item.href)) ? 'text-[#F4C542]' : 'text-muted-foreground'}`} />
              <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>Client Servicing</span>
            </button>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setClientServicingOpen(!clientServicingOpen);
                }}
                className={styles.table_10}
              >
                {clientServicingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>

          {!isCollapsed && clientServicingOpen && (
            <div className={styles.div_11}>
              {clientServicingItems.map((sub) => {
                const subActive = pathname === sub.href || pathname.startsWith(sub.href);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    className={`${styles.table_19} transition-all duration-300 ease-in-out ${subActive
                      ? 'bg-primary/10 text-primary font-bold shadow-[0_0_15px_rgba(244,197,66,0.15)] rounded-full px-4'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground rounded-full px-4'
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
              title={isCollapsed ? item.name : undefined}
              className={`${isCollapsed ? styles.navItemCollapsed : styles.table_20} ${active
                ? 'bg-primary/10 text-primary font-bold shadow-[0_0_15px_rgba(244,197,66,0.15)]'
                : 'text-foreground/80 hover:bg-surface-2 hover:text-foreground'
                }`}
            >
              <Icon size={16} className={`shrink-0 transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.card_12}>
        <p className={`${styles.text_13} ${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
          Admin Portal Secures Online
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${styles.card_14} ${isCollapsed ? styles.collapsedSidebar : ''}`}>
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