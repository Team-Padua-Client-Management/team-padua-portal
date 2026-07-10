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
  Briefcase, Globe
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [clientServicingOpen, setClientServicingOpen] = useState(false);
  const [portalManagementOpen, setPortalManagementOpen] = useState(false);
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
    if (pathname.startsWith('/admin/portals')) {
      setTimeout(() => {
        setPortalManagementOpen(true);
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

  const portalItems = [
    { name: 'Overview', href: '/admin/portals' },
    { name: 'Canva', href: '/admin/portals/canva' },
    { name: 'Google Drive', href: '/admin/portals/google-drive' },
    { name: 'Google Sheets', href: '/admin/portals/google-sheets' },
    { name: 'JotForm', href: '/admin/portals/jotform' },
    { name: 'Microsoft Teams', href: '/admin/portals/microsoft-teams' },
    { name: 'Zoom', href: '/admin/portals/zoom' },
    { name: 'Task Tracker', href: '/admin/portals/task-tracker' },
    { name: 'Sun Life', href: '/admin/portals/sun-life' },
    { name: 'Advisor Office', href: '/admin/portals/advisor-office' },
  ];

  const menuItems = [
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarCheck },
  ];

  const sidebarContent = (
    <div className={styles.sidebarInner}>
      {/* Header */}
      <div className={`${styles.sidebarHeader} ${isCollapsed ? styles.sidebarHeaderCollapsed : ''}`}>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={styles.toggleChevron}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className={styles.sidebarHeaderContainer}>
          <div className="flex items-center gap-3">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className={`object-contain shrink-0 ${styles.logoFade} ${isCollapsed ? styles.logoFadeHidden : ''}`}
            />
            <div className={`${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
              <h1 className={styles.sidebarTitle}>Team Padua</h1>
              <p className={styles.sidebarSubtitle}>Control Terminal</p>
            </div>
          </div>
          {onClose && !isCollapsed && (
            <button onClick={onClose} className={styles.mobileCloseBtn}>
              <X size={16} />
            </button>
          )}
        </div>

        {greeting && (
          <p className={`${styles.sidebarGreeting} ${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
            ● {greeting}
          </p>
        )}
      </div>

      <nav className={`${styles.sidebarNav} ${isCollapsed ? 'px-2' : 'p-4'}`}>
        {/* Dashboard Node with sub-menu */}
        <div className={styles.sidebarNavGroup}>
          <div
            className={`${isCollapsed ? styles.navItemCollapsed : styles.navItem} ${pathname.startsWith('/admin/dashboard')
              ? styles.navItemActive
              : styles.navItemInactive
              }`}
          >
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              title={isCollapsed ? "Dashboard" : undefined}
              className={isCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
            >
              <LayoutDashboard size={16} className={`shrink-0 ${pathname.startsWith('/admin/dashboard') ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>Dashboard</span>
            </Link>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDashboardOpen(!dashboardOpen);
                }}
                className={styles.dropdownToggleBtn}
              >
                {dashboardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>

          {!isCollapsed && dashboardOpen && (
            <div className={styles.sidebarSubNav}>
              {dashboardItems.map((sub) => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    className={`${styles.sidebarSubNavItem} ${subActive ? styles.navSubActive : styles.navSubInactive}`}
                  >
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Client Servicing Node with sub-menu */}
        <div className={styles.sidebarNavGroup}>
          <div
            className={`${isCollapsed ? styles.navItemCollapsed : styles.navItem} ${clientServicingItems.some(item => pathname.startsWith(item.href))
              ? styles.navItemActive
              : styles.navItemInactive
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
              className={isCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
            >
              <Briefcase size={16} className={`shrink-0 ${clientServicingItems.some(item => pathname.startsWith(item.href)) ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>Client Servicing</span>
            </button>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setClientServicingOpen(!clientServicingOpen);
                }}
                className={styles.dropdownToggleBtn}
              >
                {clientServicingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>

          {!isCollapsed && clientServicingOpen && (
            <div className={styles.sidebarSubNav}>
              {clientServicingItems.map((sub) => {
                const subActive = pathname === sub.href || pathname.startsWith(sub.href);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    className={`${styles.sidebarSubNavItem} ${subActive ? styles.navSubActive : styles.navSubInactive}`}
                  >
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Portal Management Node with sub-menu */}
        <div className={styles.sidebarNavGroup}>
          <div
            className={`${isCollapsed ? styles.navItemCollapsed : styles.navItem} ${pathname.startsWith('/admin/portals')
              ? styles.navItemActive
              : styles.navItemInactive
              }`}
          >
            <button
              onClick={() => {
                if (isCollapsed) {
                  window.location.href = '/admin/portals';
                } else {
                  setPortalManagementOpen(!portalManagementOpen);
                }
              }}
              title={isCollapsed ? "Portal Management" : undefined}
              className={isCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
            >
              <Globe size={16} className={`shrink-0 ${pathname.startsWith('/admin/portals') ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>Portal Management</span>
            </button>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPortalManagementOpen(!portalManagementOpen);
                }}
                className={styles.dropdownToggleBtn}
              >
                {portalManagementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>

          {!isCollapsed && portalManagementOpen && (
            <div className={`${styles.sidebarSubNav} max-h-[300px] overflow-y-auto pr-1`}>
              {portalItems.map((sub) => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    className={`${styles.sidebarSubNavItem} ${subActive ? styles.navSubActive : styles.navSubInactive}`}
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
              className={`${isCollapsed ? styles.navItemCollapsed : styles.navItem} ${active
                ? styles.navItemActive
                : styles.navItemInactive
                }`}
            >
              <div className={isCollapsed ? 'flex items-center justify-center' : styles.navItemLink}>
                <Icon size={16} className={`shrink-0 transition-colors duration-200 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={`${styles.sidebarFooterText} ${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
          Admin Portal Secures Online
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${styles.sidebarAside} ${isCollapsed ? styles.collapsedSidebar : ''}`}>
        {sidebarContent}
      </aside>
      {/* Mobile drawer support */}
      {isOpen && (
        <div className={styles.sidebarMobileWrapper}>
          <div className={styles.sidebarOverlay} onClick={onClose} />
          <aside className={styles.sidebarDrawer}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}