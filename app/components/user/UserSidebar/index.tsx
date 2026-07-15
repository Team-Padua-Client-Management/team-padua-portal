// C:\website\tp\app\components\user\UserSidebar\page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Gamepad2, X, ChevronDown, ChevronRight, ChevronLeft, Briefcase, LayoutGrid } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/components/user/UserSidebar/page.module.css";
import Image from "next/image";

interface UserSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isClientServicingOpen, setIsClientServicingOpen] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isEffectivelyCollapsed = isCollapsed && !isHovered;

  useEffect(() => {
    const saved = localStorage.getItem('user-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    } else {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('user-sidebar-collapsed', String(next));
    window.dispatchEvent(new CustomEvent('user-sidebar-collapse-change', { detail: { collapsed: next } }));
  };

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("client_servicing_permissions")
          .eq("id", user.id)
          .single();

        if (data?.client_servicing_permissions) {
          setPermissions(data.client_servicing_permissions);
        }
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      setTimeout(() => {
        setIsDashboardOpen(true);
      }, 0);
    }

    if (pathname.startsWith("/admin/")) {
      setTimeout(() => {
        setIsClientServicingOpen(true);
      }, 0);
    }
  }, [pathname]);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      subItems: [
        { name: "Personal", href: "/dashboard/personal" },
      ]
    },
    { name: "Calendar", href: "/calendar", icon: CalendarCheck },
    { name: "Portals", href: "/portals", icon: LayoutGrid },
    { name: "Playground", href: "/playground", icon: Gamepad2 },
  ];

  if (permissions) {
    const subItems = [];
    if (permissions.cpst?.view) subItems.push({ name: "CPST", href: "/admin/cpst" });
    if (permissions.acr?.view) subItems.push({ name: "ACR", href: "/admin/acr" });
    if (permissions.fst?.view) subItems.push({ name: "FST", href: "/admin/fst" });
    if (permissions.cpc?.view) subItems.push({ name: "CPC", href: "/admin/cpc" });
    if (permissions.ppu?.view) subItems.push({ name: "PPU", href: "/admin/ppu" });
    if (permissions.mngt?.view) subItems.push({ name: "MNGT", href: "/admin/mngt" });

    if (subItems.length > 0) {
      menuItems.push({
        name: "Client Servicing",
        href: subItems[0].href,
        icon: Briefcase,
        subItems
      });
    }
  }

  const sidebarContent = (
    <div className={styles.sidebarInner}>
      {/* Header */}
      <div className={`${styles.sidebarHeader} ${isEffectivelyCollapsed ? styles.sidebarHeaderCollapsed : ''}`}>
        <div className={styles.sidebarHeaderContainer}>
          <div className="flex items-center gap-3">
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className={`object-contain shrink-0 ${styles.logoFade} ${isEffectivelyCollapsed ? styles.logoFadeHidden : ''}`}
            />
            <div className={`${styles.textFade} ${isEffectivelyCollapsed ? styles.textFadeHidden : ''}`}>
              <h1 className={styles.sidebarTitle}>Team Padua</h1>
              <p className={styles.sidebarSubtitle}>Intern Workspace</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {onClose && !isEffectivelyCollapsed && (
              <button type="button" onClick={onClose} className={styles.mobileCloseBtn}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <nav className={`${styles.sidebarNav} ${isEffectivelyCollapsed ? 'px-2' : 'p-4'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isDashboard = item.href === "/dashboard";
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isParentActive = active || (isDashboard && pathname.startsWith("/dashboard"));

          if (item.subItems) {
            const isOpenSection = item.name === "Dashboard" ? isDashboardOpen : isClientServicingOpen;
            return (
              <div key={item.href} className={styles.sidebarNavGroup}>
                <div
                  className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${isParentActive ? styles.navItemActive : styles.navItemInactive}`}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={isEffectivelyCollapsed ? item.name : undefined}
                    className={isEffectivelyCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
                  >
                    <Icon size={16} className={`shrink-0 ${isParentActive ? styles.navIconActive : styles.navIconInactive}`} />
                    <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
                  </Link>
                  {!isEffectivelyCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (item.name === "Dashboard") setIsDashboardOpen(!isDashboardOpen);
                        if (item.name === "Client Servicing") setIsClientServicingOpen(!isClientServicingOpen);
                      }}
                      className={styles.dropdownToggleBtn}
                    >
                      {isOpenSection ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {!isEffectivelyCollapsed && isOpenSection && (
                  <div className={styles.sidebarSubNav}>
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
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={isEffectivelyCollapsed ? item.name : undefined}
              className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${active ? styles.navItemActive : styles.navItemInactive}`}
            >
              <div className={isEffectivelyCollapsed ? 'flex items-center justify-center' : styles.navItemLink}>
                <Icon size={16} className={`shrink-0 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarFooter}>
        <p className={`${styles.sidebarFooterText} ${styles.textFade} ${isEffectivelyCollapsed ? styles.textFadeHidden : ''}`}>
          Intern Portal Secures Online
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${styles.sidebarAside} ${isEffectivelyCollapsed ? styles.collapsedSidebar : ''}`}
      >
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