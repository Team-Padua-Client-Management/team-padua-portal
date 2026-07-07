'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/layouts/root/page.module.css";

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import { useEffect } from 'react';
import Main from './Landing/Main';

/**
 * Home
 *
 * Renders the Home interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for Home.
 *
 * 
 * @returns State operations sequence.
 */
export default function Home() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <main className={styles.div_0}>
      <Main />
    </main>
  );
}
