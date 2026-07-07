"use client";

/**
 * layout.tsx
 *
 * Main component module in features path: app/(admin)/layout.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/layouts/admin/layout.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";

/**
 * AdminLayout
 *
 * Renders the AdminLayout interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminLayout.
 *
 * @param { children }: { children: React.ReactNode }
 * @returns State operations sequence.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);

    /**
 * Executes operations logic for handleThemeChange.
 *
 * @param e: any
 * @returns State operations sequence.
 */
const handleThemeChange = (e: any) => {
      setTheme(e.detail.theme);
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, []);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className={styles.text_0}>
        {children}
      </div>
    </div>
  );
}
