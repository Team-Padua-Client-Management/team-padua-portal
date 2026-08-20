// C:\website\tp\app\components\admin\AdminSidebar\page.tsx
'use client';

import styles from "@/styles/components/admin/AdminSidebar/page.module.css";
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarCheck,
  ChevronDown, ChevronRight, X,
  Briefcase, Globe, Menu,
} from 'lucide-react';
import { useAdminLayoutContext } from '@src/components/layout';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type HoverPanelKey = 'cams' | 'portal' | null;

interface PanelPosition {
  top: number;
  left: number;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const layoutContext = useAdminLayoutContext();
  const effectiveIsOpen = isOpen ?? layoutContext?.isSidebarOpen;
  const effectiveOnClose = onClose ?? layoutContext?.closeSidebar;
  const effectiveOpen = layoutContext?.openSidebar;

  const [camsOpen, setCamsOpen] = useState(false);
  const [clientServicingOpen, setClientServicingOpen] = useState(false);
  const [sunlifeFormsOpen, setSunlifeFormsOpen] = useState(false);
  const [portalManagementOpen, setPortalManagementOpen] = useState(false);
  const [greeting, setGreeting] = useState('');

  const [mounted, setMounted] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState<HoverPanelKey>(null);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const camsRailRef = useRef<HTMLDivElement>(null);
  const portalRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computePosition = (
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!ref.current) return null;

    const rect = ref.current.getBoundingClientRect();

    return {
      top: rect.top,
      left: rect.right + 12,
    };
  };

  const openPanel = (
    key: HoverPanelKey,
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    const pos = computePosition(ref);

    if (pos) {
      setPanelPosition(pos);
    }

    setHoveredPanel(key);
  };

  const scheduleClosePanel = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredPanel(null);
    }, 150);
  };

  const keepPanelOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

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
    const clientServicingPaths = ['/admin/cpst', '/admin/cpc', '/admin/pptm', '/admin/cgpt', '/admin/csmv'];
    const sunlifeFormPaths = [
      '/admin/acr', '/admin/acicr', '/admin/bcr', '/admin/fund-switching', '/admin/fund-withdrawal',
      '/admin/aca', '/admin/ada', '/admin/reinstatement-sro', '/admin/reinstatement-pdi'
    ];

    const isClientServicing = clientServicingPaths.some(p => pathname.startsWith(p));
    const isSunlifeForm = sunlifeFormPaths.some(p => pathname.startsWith(p));

    if (isClientServicing || isSunlifeForm) {
      setTimeout(() => {
        setCamsOpen(true);
        if (isClientServicing) setClientServicingOpen(true);
        if (isSunlifeForm) setSunlifeFormsOpen(true);
      }, 0);
    }
    if (pathname.startsWith('/admin/portals')) {
      setTimeout(() => {
        setPortalManagementOpen(true);
      }, 0);
    }
  }, [pathname]);

  const clientServicingItems = [
    { name: 'Client Management Tracker', href: '/admin/cpst' },
    { name: 'Client Policy Card', href: '/admin/cpc' },
    { name: 'Premium Payment', href: '/admin/pptm' },
    { name: 'Welcome Note & Poster', href: '/admin/cgpt' },
    { name: 'Social Media Visibility', href: '/admin/csmv' },
  ];

  const sunlifeFormItems = [
    { name: 'ACR', href: '/admin/acr' },
    { name: 'ACICR', href: '/admin/acicr' },
    { name: 'BCR', href: '/admin/bcr' },
    { name: 'FSR', href: '/admin/fund-switching' },
    { name: 'FWR', href: '/admin/fund-withdrawal' },
    { name: 'ACA', href: '/admin/aca' },
    { name: 'ADA', href: '/admin/ada' },
    { name: 'Reinstatement SRO', href: '/admin/reinstatement-sro' },
    { name: 'Reinstatement PDI', href: '/admin/reinstatement-pdi' },
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
    { name: 'Client Policy Card', href: '/admin/portals/client-policy-card' },
    { name: 'Daniel Padua Portfolio', href: '/admin/portals/daniel-padua-portfolio' },
  ];

  const portalActive = pathname.startsWith('/admin/portals');

  const menuItems = [
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarCheck },
  ];

  const dashboardActive = pathname.startsWith('/admin/dashboard');

  const flyoutPortal = (key: Exclude<HoverPanelKey, null>) => {
    if (!mounted || hoveredPanel !== key) return null;

    const content = key === 'cams' ? (
      <>
        <div className={styles.hoverPanelHeader}>
          <div className={styles.hoverPanelIconBadge}>
            <Briefcase size={16} />
          </div>
          <div>
            <div className={styles.hoverPanelTitle}>CAMS</div>
            <div className={styles.hoverPanelSubtitle}>Client & Account Management</div>
          </div>
        </div>

        <div className={styles.hoverPanelSection}>
          <div className={styles.hoverPanelSectionLabel}>Client Servicing</div>
          {clientServicingItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={effectiveOnClose}
                className={`${styles.hoverPanelItem} ${active ? styles.hoverPanelItemActive : ''}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className={styles.hoverPanelDivider} />

        <div className={styles.hoverPanelSection}>
          <div className={styles.hoverPanelSectionLabel}>Client Servicing Forms</div>
          {sunlifeFormItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={effectiveOnClose}
                className={`${styles.hoverPanelItem} ${active ? styles.hoverPanelItemActive : ''}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </>
    ) : (
      <>
        <div className={styles.hoverPanelHeader}>
          <div className={styles.hoverPanelIconBadge}>
            <Globe size={16} />
          </div>
          <div>
            <div className={styles.hoverPanelTitle}>Portal Management</div>
            <div className={styles.hoverPanelSubtitle}>Connected tools & portals</div>
          </div>
        </div>

        <div className={styles.hoverPanelSection}>
          {portalItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={effectiveOnClose}
                className={`${styles.hoverPanelItem} ${active ? styles.hoverPanelItemActive : ''}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </>
    );

    return createPortal(
      <div
        className={`${styles.hoverPanel} ${styles.hoverPanelVisible}`}
        style={{ top: panelPosition.top, left: panelPosition.left }}
        onMouseEnter={keepPanelOpen}
        onMouseLeave={scheduleClosePanel}
      >
        {content}
      </div>,
      document.body
    );
  };

  const DesktopSidebar = (
    <aside className={styles.sidebarAside}>
      <div className={styles.sidebarInner}>
        <div className={styles.railHeader}>
          <Link href="/admin/dashboard" className={styles.railLogoLink} title="Team Padua Dashboard">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className="object-contain shrink-0"
            />
          </Link>
        </div>

        <nav className={styles.railNav}>
          <div className={styles.railItemWrapper}>
            <Link
              href="/admin/dashboard"
              className={`${styles.navItemCollapsed} ${dashboardActive ? styles.navItemActive : styles.navItemInactive}`}
            >
              <LayoutDashboard size={18} className={dashboardActive ? styles.navIconActive : styles.navIconInactive} />
            </Link>
            <span className={styles.tooltip}>Dashboard</span>
          </div>

          <div
            ref={camsRailRef}
            className={styles.railItemWrapper}
            onMouseEnter={() => openPanel('cams', camsRailRef)}
            onMouseLeave={scheduleClosePanel}
          >
            <Link
              href="/admin/cpst"
              className={`${styles.navItemCollapsed} ${camsActive ? styles.navItemActive : styles.navItemInactive}`}
            >
              <Briefcase size={18} className={camsActive ? styles.navIconActive : styles.navIconInactive} />
            </Link>
            <span className={styles.tooltip}>CAMS</span>
          </div>

          <div
            ref={portalRailRef}
            className={styles.railItemWrapper}
            onMouseEnter={() => openPanel('portal', portalRailRef)}
            onMouseLeave={scheduleClosePanel}
          >
            <Link
              href="/admin/portals"
              className={`${styles.navItemCollapsed} ${portalActive ? styles.navItemActive : styles.navItemInactive}`}
            >
              <Globe size={18} className={portalActive ? styles.navIconActive : styles.navIconInactive} />
            </Link>
            <span className={styles.tooltip}>Portal Management</span>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.toLowerCase() === item.href.toLowerCase()
              || pathname.toLowerCase().startsWith(item.href.toLowerCase());
            return (
              <div className={styles.railItemWrapper} key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItemCollapsed} ${active ? styles.navItemActive : styles.navItemInactive}`}
                >
                  <Icon size={18} className={active ? styles.navIconActive : styles.navIconInactive} />
                </Link>
                <span className={styles.tooltip}>{item.name}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {flyoutPortal('cams')}
      {flyoutPortal('portal')}
    </aside>
  );

  const mobileSidebarContent = (
    <div className={styles.sidebarInner}>
      <div className="pt-10 pb-5 flex flex-col items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={styles.sidebarHeaderContainer}>
          <Link href="/admin/dashboard" className="flex items-center justify-center p-1" title="Team Padua Dashboard">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={34}
              height={34}
              className="object-contain shrink-0 opacity-100 block"
            />
          </Link>
        </div>

        {greeting && (
          <p className={styles.sidebarGreeting}>● {greeting}</p>
        )}
      </div>

      <nav className={`${styles.sidebarNav} p-4`}>
        <div className={styles.sidebarNavGroup}>
          <div className={`${styles.navItem} ${dashboardActive ? styles.navItemActive : styles.navItemInactive}`}>
            <Link href="/admin/dashboard" onClick={effectiveOnClose} className={styles.navItemLink}>
              <LayoutDashboard size={16} className={`shrink-0 ${dashboardActive ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={styles.navLabel}>Dashboard</span>
            </Link>
          </div>
        </div>

        <div className={styles.sidebarNavGroup}>
          <div className={`${styles.navItem} ${camsActive ? styles.navItemActive : styles.navItemInactive}`}>
            <button onClick={() => setCamsOpen(!camsOpen)} className={styles.navItemLink}>
              <Briefcase size={16} className={`shrink-0 ${camsActive ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={styles.navLabel}>CAMS</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCamsOpen(!camsOpen); }}
              className={styles.dropdownToggleBtn}
            >
              {camsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {camsOpen && (
            <div className={`${styles.sidebarSubNav} flex flex-col gap-1.5`}>
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setClientServicingOpen(!clientServicingOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-bold rounded transition-colors border-0 cursor-pointer bg-transparent text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>Client Servicing</span>
                  {clientServicingOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {clientServicingOpen && (
                  <div className="pl-2 ml-1.5 mt-1 space-y-0.5" style={{ borderLeft: '1px solid var(--border)' }}>
                    {clientServicingItems.map((sub) => {
                      const subActive = pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={effectiveOnClose}
                          className={`${styles.sidebarSubNavItem} ${subActive ? styles.navSubActive : styles.navSubInactive}`}
                        >
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setSunlifeFormsOpen(!sunlifeFormsOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-bold rounded transition-colors border-0 cursor-pointer bg-transparent text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>Client Servicing Request Forms</span>
                  {sunlifeFormsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {sunlifeFormsOpen && (
                  <div className="pl-2 ml-1.5 mt-1 space-y-0.5" style={{ borderLeft: '1px solid var(--border)' }}>
                    {sunlifeFormItems.map((sub) => {
                      const subActive = pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={effectiveOnClose}
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
          <div className={`${styles.navItem} ${portalActive ? styles.navItemActive : styles.navItemInactive}`}>
            <button onClick={() => setPortalManagementOpen(!portalManagementOpen)} className={styles.navItemLink}>
              <Globe size={16} className={`shrink-0 ${portalActive ? styles.navIconActive : styles.navIconInactive}`} />
              <span className={styles.navLabel}>Portal Management</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPortalManagementOpen(!portalManagementOpen); }}
              className={styles.dropdownToggleBtn}
            >
              {portalManagementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {portalManagementOpen && (
            <div className={`${styles.sidebarSubNav} max-h-[300px] overflow-y-auto pr-1`}>
              {portalItems.map((sub) => {
                const subActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={effectiveOnClose}
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
          const active = pathname.toLowerCase() === item.href.toLowerCase()
            || pathname.toLowerCase().startsWith(item.href.toLowerCase());
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={effectiveOnClose}
              className={`${styles.navItem} ${active ? styles.navItemActive : styles.navItemInactive}`}
            >
              <div className={styles.navItemLink}>
                <Icon size={16} className={`shrink-0 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                <span className={styles.navLabel}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={styles.sidebarFooterText}>Admin Portal Secures Online</p>
      </div>
    </div>
  );

  return (
    <>
      {DesktopSidebar}

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
              className="absolute top-4 right-4 z-50 p-2 rounded-full cursor-pointer transition border-0 flex items-center justify-center shadow-sm"
              style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}
              aria-label="Close sidebar menu"
            >
              <X size={16} />
            </button>
            {mobileSidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}