"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Gamepad2, X, ChevronDown, ChevronRight, Briefcase, LayoutGrid, Menu } from "lucide-react";
import { supabase } from "@src/lib/supabase/client";
import styles from "@/styles/components/user/UserSidebar/page.module.css";
import Image from "next/image";

interface UserSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface PanelPosition {
  top: number;
  left: number;
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname();
  const [isClientServicingOpen, setIsClientServicingOpen] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientServicingRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const openPanel = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (clientServicingRailRef.current) {
      const rect = clientServicingRailRef.current.getBoundingClientRect();
      setPanelPosition({ top: rect.top, left: rect.right + 12 });
    }
    setHoveredPanel(true);
  };

  const scheduleClosePanel = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredPanel(false);
    }, 150);
  };

  const keepPanelOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role, client_servicing_permissions")
          .eq("id", user.id)
          .single();

        if (data) {
          setUserRole(data.role ?? null);
          if (data.client_servicing_permissions) {
            setPermissions(data.client_servicing_permissions);
          }
        }
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin/")) {
      setTimeout(() => {
        setIsClientServicingOpen(true);
      }, 0);
    }
  }, [pathname]);

  type MenuItem = {
    name: string;
    href: string;
    icon: any;
    subItems?: { name: string; href: string }[];
  };

  const menuItems: MenuItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/calendar", icon: CalendarCheck },
    { name: "Portals", href: "/portals", icon: LayoutGrid },
    { name: "Playground", href: "/playground", icon: Gamepad2 },
  ];

  const isAdvisor = userRole === "Advisor";

  if (isAdvisor || permissions) {
    const subItems: { name: string; href: string }[] = [];
    if (isAdvisor || permissions?.cpst?.view) subItems.push({ name: "CPST", href: "/admin/cpst" });
    if (isAdvisor || permissions?.acr?.view) subItems.push({ name: "ACR", href: "/admin/acr" });
    if (isAdvisor || permissions?.fst?.view) subItems.push({ name: "FST", href: "/admin/fund-switching" });
    if (isAdvisor || permissions?.cpc?.view) subItems.push({ name: "CPC", href: "/admin/cpc" });
    if (isAdvisor || permissions?.ppu?.view) subItems.push({ name: "PPU", href: "/admin/ppu" });
    if (isAdvisor || permissions?.mngt?.view) subItems.push({ name: "MNGT", href: "/admin/mngt" });
    if (isAdvisor || permissions?.bcr?.view) subItems.push({ name: "BCR", href: "/admin/bcr" });
    if (isAdvisor || permissions?.aca?.view) subItems.push({ name: "ACA", href: "/admin/aca" });
    if (isAdvisor || permissions?.ada?.view) subItems.push({ name: "ADA", href: "/admin/ada" });
    if (isAdvisor || permissions?.sro?.view) subItems.push({ name: "SRO", href: "/admin/reinstatement-sro" });
    if (isAdvisor || permissions?.pdi?.view) subItems.push({ name: "PPI", href: "/admin/reinstatement-pdi" });
    if (isAdvisor || permissions?.csmv?.view) subItems.push({ name: "CSMV", href: "/admin/csmv" });
    if (isAdvisor || permissions?.form?.view) subItems.push({ name: "FORM", href: "/admin/form" });

    if (subItems.length > 0) {
      menuItems.push({
        name: "Client Servicing",
        href: subItems[0].href,
        icon: Briefcase,
        subItems
      });
    }
  }

  const clientServicingItem = menuItems.find((item) => item.subItems);
  const clientServicingActive = clientServicingItem
    ? clientServicingItem.subItems!.some((sub) => pathname === sub.href)
    : false;

  const flyoutPortal = () => {
    if (!mounted || !hoveredPanel || !clientServicingItem) return null;

    return createPortal(
      <div
        className={`${styles.hoverPanel} ${styles.hoverPanelVisible}`}
        style={{ top: panelPosition.top, left: panelPosition.left }}
        onMouseEnter={keepPanelOpen}
        onMouseLeave={scheduleClosePanel}
      >
        <div className={styles.hoverPanelHeader}>
          <div className={styles.hoverPanelIconBadge}>
            <Briefcase size={16} />
          </div>
          <div>
            <div className={styles.hoverPanelTitle}>Client Servicing</div>
            <div className={styles.hoverPanelSubtitle}>Client & policy tools</div>
          </div>
        </div>

        <div className={styles.hoverPanelSection}>
          {clientServicingItem.subItems!.map((sub) => {
            const subActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onClose}
                className={`${styles.hoverPanelItem} ${subActive ? styles.hoverPanelItemActive : ''}`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      </div>,
      document.body
    );
  };

  const DesktopSidebar = (
    <aside className={styles.sidebarAside}>
      <div className={styles.sidebarInner}>
        <div className={styles.railHeader}>
          <Link href="/dashboard" className={styles.railLogoLink} title="Team Padua Dashboard">
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
          {menuItems.map((item) => {
            const Icon = item.icon;

            if (item.subItems) {
              return (
                <div
                  key={item.href}
                  ref={clientServicingRailRef}
                  className={styles.railItemWrapper}
                  onMouseEnter={openPanel}
                  onMouseLeave={scheduleClosePanel}
                >
                  <Link
                    href={item.subItems[0].href}
                    className={`${styles.navItemCollapsed} ${clientServicingActive ? styles.navItemActive : styles.navItemInactive}`}
                  >
                    <Icon size={18} className={clientServicingActive ? styles.navIconActive : styles.navIconInactive} />
                  </Link>
                  <span className={styles.tooltip}>{item.name}</span>
                </div>
              );
            }

            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

      {flyoutPortal()}
    </aside>
  );

  const mobileSidebarContent = (
    <div className={styles.sidebarInner}>
      <div className="pt-10 pb-5 flex flex-col items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={styles.sidebarHeaderContainer}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className="object-contain shrink-0"
            />
            <div>
              <h1 className={styles.sidebarTitle}>Team Padua</h1>
              <p className={styles.sidebarSubtitle}>Intern Workspace</p>
            </div>
          </Link>
        </div>
      </div>

      <nav className={`${styles.sidebarNav} p-4`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.subItems) {
            return (
              <div key={item.href} className={styles.sidebarNavGroup}>
                <div className={`${styles.navItem} ${clientServicingActive ? styles.navItemActive : styles.navItemInactive}`}>
                  <button
                    onClick={() => setIsClientServicingOpen(!isClientServicingOpen)}
                    className={styles.navItemLink}
                  >
                    <Icon size={16} className={`shrink-0 ${clientServicingActive ? styles.navIconActive : styles.navIconInactive}`} />
                    <span className={styles.navLabel}>{item.name}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsClientServicingOpen(!isClientServicingOpen); }}
                    className={styles.dropdownToggleBtn}
                  >
                    {isClientServicingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>

                {isClientServicingOpen && (
                  <div className={`${styles.sidebarSubNav} flex flex-col gap-1.5`}>
                    <div className="pl-2 ml-1.5 mt-1 space-y-0.5" style={{ borderLeft: '1px solid var(--border)' }}>
                      {item.subItems.map((sub) => {
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
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.href} className={styles.sidebarNavGroup}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`${styles.navItem} ${active ? styles.navItemActive : styles.navItemInactive}`}
              >
                <div className={styles.navItemLink}>
                  <Icon size={16} className={`shrink-0 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                  <span className={styles.navLabel}>{item.name}</span>
                </div>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={styles.sidebarFooterText}>Intern Portal Secures Online</p>
      </div>
    </div>
  );

  return (
    <>
      {DesktopSidebar}

      {isOpen && (
        <div className={styles.sidebarMobileWrapper}>
          <div className={styles.sidebarOverlay} onClick={onClose} />
          <aside className={styles.sidebarDrawer}>
            <button
              onClick={onClose}
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