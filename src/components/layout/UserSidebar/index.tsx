"use client";

import React, { useState, useEffect } from "react";
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

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isClientServicingOpen, setIsClientServicingOpen] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 700);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  const isEffectivelyCollapsed = !isHovered && !(isMobile && isOpen);

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
      <div className={`pt-10 pb-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-col items-center ${styles.sidebarHeader} ${isEffectivelyCollapsed ? styles.sidebarHeaderCollapsed : ''}`}>
        <div className={`${styles.sidebarHeaderContainer} ${isEffectivelyCollapsed ? styles.sidebarHeaderContainerCollapsed : ''}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 ${isEffectivelyCollapsed ? styles.headerBrandCollapsed : ''}`}>
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
          </Link>
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
                  <button
                    onClick={() => {
                      if (isEffectivelyCollapsed) {
                        window.location.href = item.subItems![0].href;
                      } else {
                        if (item.name === "Dashboard") setIsDashboardOpen(!isDashboardOpen);
                        if (item.name === "Client Servicing") setIsClientServicingOpen(!isClientServicingOpen);
                      }
                    }}
                    title={isEffectivelyCollapsed ? item.name : undefined}
                    className={isEffectivelyCollapsed ? 'flex items-center justify-center w-full bg-transparent border-0' : styles.navItemLink}
                  >
                    <Icon size={16} className={`shrink-0 ${isParentActive ? styles.navIconActive : styles.navIconInactive}`} />
                    <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
                  </button>
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
                  <div className={`${styles.sidebarSubNav} flex flex-col gap-1.5`}>
                    <div className="flex flex-col">
                      <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1.5 mt-1 space-y-0.5">
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
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.href} className={styles.sidebarNavGroup}>
              <div
                className={`${isEffectivelyCollapsed ? styles.navItemCollapsed : styles.navItem} ${active ? styles.navItemActive : styles.navItemInactive}`}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={isEffectivelyCollapsed ? item.name : undefined}
                  className={isEffectivelyCollapsed ? 'flex items-center justify-center w-full' : styles.navItemLink}
                >
                  <Icon size={16} className={`shrink-0 transition-colors duration-200 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                  <span className={`${styles.navLabel} ${isEffectivelyCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
                </Link>
              </div>
            </div>
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
            <button
              onClick={onClose}
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
