// C:\website\tp\app\components\user\UserSidebar\page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Gamepad2, X, ChevronDown, ChevronRight, ChevronLeft, Briefcase } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user-sidebar-collapsed') === 'true';
    setIsCollapsed(saved);
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

        <div className="flex items-center gap-3">
          <Image
            src="/Image/icon/TPC.png"
            alt="Team Padua Logo"
            width={32}
            height={32}
            className={`object-contain shrink-0 ${styles.logoFade} ${isCollapsed ? styles.logoFadeHidden : ''}`}
          />
          <div className={`${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
            <h1 className={styles.table_2}>Team Padua</h1>
            <p className={styles.table_3}>Intern Workspace</p>
          </div>
        </div>
        {onClose && !isCollapsed && (
          <button onClick={onClose} className={styles.table_4}>
            <X size={16} />
          </button>
        )}
      </div>

      <nav className={`${styles.card_5} ${isCollapsed ? 'px-2' : 'p-4'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isDashboard = item.href === "/dashboard";
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isParentActive = active || (isDashboard && pathname.startsWith("/dashboard"));

          if (item.subItems) {
            const isOpenSection = item.name === "Dashboard" ? isDashboardOpen : isClientServicingOpen;
            return (
              <div key={item.href} className={styles.div_6}>
                <div
                  className={`${isCollapsed ? styles.navItemCollapsed : styles.table_16} ${isParentActive ? styles.navItemActive : styles.navItemInactive
                    }`}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.name : undefined}
                    className={isCollapsed ? 'flex items-center justify-center w-full' : styles.container_7}
                  >
                    <Icon size={16} className={`shrink-0 ${isParentActive ? styles.navIconActive : styles.navIconInactive}`} />
                    <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
                  </Link>
                  {!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (item.name === "Dashboard") setIsDashboardOpen(!isDashboardOpen);
                        if (item.name === "Client Servicing") setIsClientServicingOpen(!isClientServicingOpen);
                      }}
                      className={styles.table_8}
                    >
                      {isOpenSection ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {!isCollapsed && isOpenSection && (
                  <div className={styles.div_9}>
                    {item.subItems.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onClose}
                          className={`${styles.table_17} ${subActive ? styles.navSubActive : styles.navSubInactive
                            }`}
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
              title={isCollapsed ? item.name : undefined}
              className={`${isCollapsed ? styles.navItemCollapsed : styles.table_18} ${active ? styles.navItemActive : styles.navItemInactive
                }`}
            >
              <div className={isCollapsed ? 'flex items-center justify-center' : styles.container_7}>
                <Icon size={16} className={`shrink-0 ${active ? styles.navIconActive : styles.navIconInactive}`} />
                <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ''}`}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className={styles.card_10}>
        <p className={`${styles.text_11} ${styles.textFade} ${isCollapsed ? styles.textFadeHidden : ''}`}>
          Intern Portal Secures Online
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${styles.card_12} ${isCollapsed ? styles.collapsedSidebar : ''}`}>
        {sidebarContent}
      </aside>
      {/* Mobile drawer support */}
      {isOpen && (
        <div className={styles.container_13}>
          <div className={styles.div_14} onClick={onClose} />
          <aside className={styles.card_15}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}