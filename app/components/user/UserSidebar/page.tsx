"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/components/user/UserSidebar/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/components/user/UserSidebar/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Users, MessageSquare, Gamepad2, X, Sun, Moon, ChevronDown, ChevronRight, CircleHelp } from "lucide-react";

interface UserSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * UserSidebar
 *
 * Renders the UserSidebar interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for UserSidebar.
 *
 * @param { isOpen, onClose }: UserSidebarProps
 * @returns State operations sequence.
 */
export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      setTimeout(() => {
        setIsDashboardOpen(true);
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
        { name: "Team", href: "/dashboard/team" },
        { name: "Department", href: "/dashboard/department" }
      ]
    },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Playground", href: "/playground", icon: Gamepad2 },
    { name: "Knowledge Base", href: "/faq", icon: CircleHelp }
  ];

  const sidebarContent = (
    <div className={styles.card_0}>
      <div className={styles.card_1}>
        <div>
          <h1 className={styles.table_2}>Team Padua</h1>
          <p className={styles.table_3}>Intern Workspace</p>
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.table_4}>
            <X size={16} />
          </button>
        )}
      </div>
      <nav className={styles.card_5}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isDashboard = item.href === "/dashboard";
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isParentActive = active || (isDashboard && pathname.startsWith("/dashboard"));

          if (item.subItems) {
            return (
              <div key={item.href} className={styles.div_6}>
                <div
                  className={`${styles.table_16} ${
                    isParentActive
                      ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border-l-2 border-[#F4C542] font-bold"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={styles.container_7}
                  >
                    <Icon size={16} className={isParentActive ? "text-[#F4C542]" : "text-muted-foreground"} />
                    <span>{item.name}</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsDashboardOpen(!isDashboardOpen);
                    }}
                    className={styles.table_8}
                  >
                    {isDashboardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>
                {isDashboardOpen && (
                  <div className={styles.div_9}>
                    {item.subItems.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onClose}
                          className={`${styles.table_17} ${
                            subActive
                              ? "bg-[#FFF7D6]/50 dark:bg-[#2E2818]/50 text-black dark:text-[#F4C542] font-bold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              className={`${styles.table_18} ${
                active
                  ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border-l-2 border-[#F4C542] font-bold"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} className={active ? "text-[#F4C542]" : "text-muted-foreground"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.card_10}>
        <p className={styles.text_11}>Intern Portal Secures Online</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className={styles.card_12}>
        {sidebarContent}
      </aside>
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
