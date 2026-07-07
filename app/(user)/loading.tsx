'use client';

/**
 * loading.tsx
 *
 * Main component module in features path: app/(user)/loading.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/loading.module.css";
import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Executes operations logic for SunLifeLogo.
 *
 * 
 * @returns State operations sequence.
 */
function SunLifeLogo() {
  return (
    <svg className={styles.text_0} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold-grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="50%" stopColor="#F4C542" />
          <stop offset="100%" stopColor="#E6A800" />
        </linearGradient>
      </defs>
      
      {/* Left Globe Half */}
      <path 
        d="M50,15 C30.7,15 15,30.7 15,50 C15,69.3 30.7,85 50,85 Z" 
        fill="url(#gold-grad-user)" 
      />
      {/* Globe longitudinal and latitudinal lines cutouts */}
      <path d="M50,15 A35,35 0 0,0 50,85 Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" className={styles.table_1} />
      <path d="M50,15 A22,35 0 0,0 50,85 Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" className={styles.table_2} />
      <path d="M50,15 A10,35 0 0,0 50,85 Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" className={styles.table_3} />
      <path d="M15,50 H50" stroke="white" strokeWidth="2.5" fill="none" className={styles.table_4} />
      <path d="M20,32.5 C30,35 40,35 50,32.5" stroke="white" strokeWidth="1.5" fill="none" className={styles.table_5} />
      <path d="M20,67.5 C30,65 40,65 50,67.5" stroke="white" strokeWidth="1.5" fill="none" className={styles.table_6} />

      {/* Right Sun Rays Half */}
      <path 
        d="M50,15 L53,23 L59,17 L60,25 L67,21 L66,29 L74,27 L71,35 L79,35 L74,42 L81,44 L75,50 L81,56 L74,58 L79,65 L71,65 L74,73 L66,71 L67,79 L60,75 L59,83 L53,77 L50,85 Z" 
        fill="url(#gold-grad-user)" 
      />
      <circle cx="50" cy="50" r="18" fill="url(#gold-grad-user)" stroke="white" strokeWidth="2" className={styles.table_7} />
    </svg>
  );
}

/**
 * Loading
 *
 * Renders the Loading interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for Loading.
 *
 * 
 * @returns State operations sequence.
 */
export default function Loading() {
  const pathname = usePathname() || "";
  const isAdmin = pathname.includes('/admin');

  return (
    <div className={styles.table_8}>
      <div className={styles.container_9}>
        
        {/* Sun-Globe surrounding loading ring spinner */}
        <div className={styles.container_10}>
          <div 
            className={styles.table_11} 
            style={{ animationDuration: '1.2s' }} 
          />
          <div className={styles.table_12}>
            <SunLifeLogo />
          </div>
        </div>

        {/* Syncing capsule text container */}
        <div className={styles.container_13}>
          <span className={styles.table_14}>
            {isAdmin ? 'Syncing Admin Dashboard...' : 'Syncing User Workspace...'}
          </span>
        </div>
      </div>
    </div>
  );
}
