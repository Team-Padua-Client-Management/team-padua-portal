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
  Briefcase, Globe, Menu
} from 'lucide-react';
import { useAdminLayoutContext } from '@/app/components/admin/AdminLayoutContext';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const layoutContext = useAdminLayoutContext();
  const effectiveIsOpen = isOpen ?? layoutContext?.isSidebarOpen;
  const effectiveOnClose = onClose ?? layoutContext?.closeSidebar;
  const effectiveOpen = layoutContext?.openSidebar;
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [camsOpen, setCamsOpen] = useState(false);
  const [clientServicingOpen, setClientServicingOpen] = useState(false);
  const [trackersOpen, setTrackersOpen] = useState(false);
  const [sunlifeFormsOpen, setSunlifeFormsOpen] = useState(false);
  const [portalManagementOpen, setPortalManagementOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 700);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  const isEffectivelyCollapsed = isCollapsed && !isHovered && !(isMobile && effectiveIsOpen);

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    } else {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
    window.dispatchEvent(new CustomEvent('admin-sidebar-collapse-change', { detail: { collapsed: next } }));
  };

  const handleBurgerClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 700) {
      if (effectiveIsOpen) {
        effectiveOnClose?.();
      } else {
        effectiveOpen?.();
      }
      return;
    }
    toggleCollapse();
  };

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
    const clientServicingPaths = ['/admin/cpst', '/admin/cv', '/admin/pptm', '/admin/cgpt', '/admin/csmv'];
    const trackerPaths = ['/admin/jf-application', '/admin/jf-bizdev'];
    const sunlifeFormPaths = [
      '/admin/acr', '/admin/bcr', '/admin/fund-switching', '/admin/fund-withdrawal',
      '/admin/aca', '/admin/reinstatement-sro', '/admin/reinstatement-pdi'
    ];

    const isClientServicing = clientServicingPaths.some(p => pathname.startsWith(p));
    const isTracker = trackerPaths.some(p => pathname.startsWith(p));
    const isSunlifeForm = sunlifeFormPaths.some(p => pathname.startsWith(p));

    if (isClientServicing || isTracker || isSunlifeForm) {
      setTimeout(() => {
        setCamsOpen(true);
        if (isClientServicing) setClientServicingOpen(true);
        if (isTracker) setTrackersOpen(true);
        if (isSunlifeForm) setSunlifeFormsOpen(true);
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
    { name: 'Client Management Tracker', href: '/admin/cpst' },
    { name: 'Client Policy Card', href: '/admin/cpc' },
    { name: 'Premium Payment', href: '/admin/pptm' },
    { name: 'Client Welcome Note & Birthday Poster', href: '/admin/cgpt' },
    { name: 'Client Social Media Visibility', href: '/admin/csmv' },
  ];

  // const trackerItems = [
  //   { name: 'JotForm Application Form', href: '/admin/jf-application' },
  //   { name: 'JotForm BizDev Recruitment', href: '/admin/jf-bizdev' },
  // ];

  const sunlifeFormItems = [
    { name: 'FORM', href: '/admin/form' },
    { name: 'Advisor Change Request', href: '/admin/acr' },
    { name: 'Beneficiary Change Request', href: '/admin/bcr' },
    { name: 'Fund Switching', href: '/admin/fund-switching' },
    { name: 'Fund Withdrawal', href: '/admin/fund-withdrawal' },
    { name: 'Auto Change Arrangement', href: '/admin/aca' },
    { name: 'Reinstatement SRO', href: '/admin/reinstatement-sro' },
    { name: 'Reinstatement PDI', href: '/admin/reinstatement-pdi' },
    // { name: 'Advisor Daily Activity Tracker', href: '/admin/adat' },
  ];

  const camsActive = [
    ...clientServicingItems,
    ...sunlifeFormItems
  ].some(item => pathname.startsWith(item.href));

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
      <div className={`pt-10 pb-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-col items-center ${styles.sidebarHeader} ${isEffectivelyCollapsed ? styles.sidebarHeaderCollapsed : ''}`}>
        <div className={`${styles.sidebarHeaderContainer} ${isEffectivelyCollapsed ? styles.sidebarHeaderContainerCollapsed : ''}`}>
          <div className={`flex items-center gap-3 ${isEffectivelyCollapsed ? styles.headerBrandCollapsed : ''}`}>
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className={`object-contain shrink-0 ${styles.logoFade} ${isEffectivelyCollapsed ? styles.logoFadeHidden : ''}`}
            />
            <div className={`${styles.textFade} ${isEffectivelyCollapsed ? styles.textFadeHidden : ''}`}>
              <h1 className={styles.sidebarTitle}>Team Padua</h1>
              <p className={styles.sidebarSubtitle}>Control Terminal</p>
            </div>
          </div>
        </div>

        {greeting && (
          <p className={`${styles.sidebarGreeting} ${styles.textFade} ${isEffectivelyCollapsed ? styles.textFadeHidden : ''}`}>
            ● {greeting}
          </p>
        )}
      </div>

      <nav className={`${styles.sidebarNav} ${isEffectivelyCollapsed ? 'px-2' : 'p-4'}`}>
        <div className={styles.sidebarNavGroup}>
          <div
            className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${pathname.startsWith('/admin/dashboard')
              ? styles.navItemActive
              : styles.navItemInactive
              }`}
          >
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              title={isEffectivelyCollapsed ? "Dashboard" : undefined}
              className={isEffectivelyCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
            >
              <LayoutDashboard size={16} className={`shrink-0 ${pathname.startsWith('/admin/dashboard') ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>Dashboard</span>
            </Link>
            {!isEffectivelyCollapsed && (
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

          {!isEffectivelyCollapsed && dashboardOpen && (
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

        <div className={styles.sidebarNavGroup}>
          <div
            className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${camsActive
              ? styles.navItemActive
              : styles.navItemInactive
              }`}
          >
            <button
              onClick={() => {
                if (isEffectivelyCollapsed) {
                  window.location.href = '/admin/cpst';
                } else {
                  setCamsOpen(!camsOpen);
                }
              }}
              title={isEffectivelyCollapsed ? "CAMS" : undefined}
              className={isEffectivelyCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
            >
              <Briefcase size={16} className={`shrink-0 ${camsActive ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>CAMS</span>
            </button>
            {!isEffectivelyCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCamsOpen(!camsOpen);
                }}
                className={styles.dropdownToggleBtn}
              >
                {camsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>

          {!isEffectivelyCollapsed && camsOpen && (
            <div className={`${styles.sidebarSubNav} flex flex-col gap-1.5`}>
              {/* Category 1: Client Servicing */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setClientServicingOpen(!clientServicingOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-0 cursor-pointer bg-transparent text-left"
                >
                  <span>Client Servicing</span>
                  {clientServicingOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {clientServicingOpen && (
                  <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1.5 mt-1 space-y-0.5">
                    {clientServicingItems.map((sub) => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.name}
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

              {/* Category 2: Trackers */}
              {/* <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setTrackersOpen(!trackersOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-0 cursor-pointer bg-transparent text-left"
                >
                  <span>Trackers</span>
                  {trackersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {trackersOpen && (
                  <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1.5 mt-1 space-y-0.5">
                    {trackerItems.map((sub) => {
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
              </div> */}

              {/* Category 3: Sun Life Forms */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setSunlifeFormsOpen(!sunlifeFormsOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-0 cursor-pointer bg-transparent text-left"
                >
                  <span>Sun Life Forms</span>
                  {sunlifeFormsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {sunlifeFormsOpen && (
                  <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1.5 mt-1 space-y-0.5">
                    {sunlifeFormItems.map((sub) => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.name}
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
            </div>
          )}
        </div>

        <div className={styles.sidebarNavGroup}>
          <div
            className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${pathname.startsWith('/admin/portals')
              ? styles.navItemActive
              : styles.navItemInactive
              }`}
          >
            <button
              onClick={() => {
                if (isEffectivelyCollapsed) {
                  window.location.href = '/admin/portals';
                } else {
                  setPortalManagementOpen(!portalManagementOpen);
                }
              }}
              title={isEffectivelyCollapsed ? "Portal Management" : undefined}
              className={isEffectivelyCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
            >
              <Globe size={16} className={`shrink-0 ${pathname.startsWith('/admin/portals') ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>Portal Management</span>
            </button>
            {!isEffectivelyCollapsed && (
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

          {!isEffectivelyCollapsed && portalManagementOpen && (
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

        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={effectiveOnClose}
              title={isEffectivelyCollapsed ? item.name : undefined}
              className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${active
                ? styles.navItemActive
                : styles.navItemInactive
                }`}
            >
              <div className={isEffectivelyCollapsed ? 'flex items-center justify-center' : styles.navItemLink}>
                <Icon size={16} className={`shrink-0 transition-colors duration-200 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={`${styles.sidebarFooterText} ${styles.textFade} ${isEffectivelyCollapsed ? styles.textFadeHidden : ''}`}>
          Admin Portal Secures Online
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${styles.sidebarAside} ${isEffectivelyCollapsed ? styles.collapsedSidebar : ''}`}
      >
        {sidebarContent}
      </aside>
      {!effectiveIsOpen && effectiveOpen && (
        <button
          type="button"
          aria-label="Open sidebar menu"
          className={styles.mobileSidebarOpenBtn}
          onClick={effectiveOpen}
        >
          <Menu size={16} />
        </button>
      )}
      {effectiveIsOpen && (
        <div className={styles.sidebarMobileWrapper}>
          <div className={styles.sidebarOverlay} onClick={effectiveOnClose} />
          <aside className={styles.sidebarDrawer}>
            <button
              onClick={effectiveOnClose}
              className="absolute top-4 right-4 z-50 p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition border-0 flex items-center justify-center shadow-sm"
              aria-label="Close sidebar menu"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}