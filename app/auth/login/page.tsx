"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/auth/login/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/auth/login/page.module.css";
import Image from "next/image";
import { AuthForm } from "../AuthForm";
import { SignIn } from "../../action/auth";
import { ChevronLeft } from "lucide-react";

/**
 * LoginPage
 *
 * Renders the LoginPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for LoginPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function LoginPage() {
  return (
    <div className={styles.container_0}>
      <div className={styles.table_1}>
        {/* Glow accent */}
        <div className={styles.div_2} />

        {/* Back Link */}
        <a
          href="/"
          className={`${styles.table_3} group`}
        >
          <ChevronLeft className={`${styles.table_4} group`} />
          <span>Landing</span>
        </a>

        <div className={styles.text_5}>
          <Image
            src="/Image/icon/TPC.png"
            alt="Team Padua Logo"
            width={100}
            height={100}
            priority
            className={styles.div_6}
          />
          <div>
            <h1 className={styles.table_7}>TeamPadua</h1>
            <p className={styles.table_8}>Secure Access Portal</p>
          </div>
        </div>

        <AuthForm action={SignIn} />
      </div>
    </div>
  );
}
