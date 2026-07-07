"use client";

/**
 * layout.tsx
 *
 * Main component module in features path: app/(user)/layout.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;


  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import styles from "@/styles/layouts/user/layout.module.css";import React, { useState, useEffect } from "react";
import UserSidebar from "@/app/components/user/UserSidebar/page";
import UserHeader from "@/app/components/user/UserHeader/page";

/**
 * UserLayout
 *
 * Renders the UserLayout interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for UserLayout.
 *
 * @param { children }: { children: React.ReactNode }
 * @returns State operations sequence.
 */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTimeout(() => {
      setTheme(saved);
    }, 0);

    /**
 * Executes operations logic for handleThemeChange.
 *
 * @param e: Event
 * @returns State operations sequence.
 */
const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.theme === "string") {
        setTheme(customEvent.detail.theme);
      }
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, []);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className={styles.text_0}>
        <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={styles.container_1}>
          <UserHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className={styles.container_2}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
