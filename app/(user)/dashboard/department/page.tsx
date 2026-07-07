"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/dashboard/department/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/dashboard/department/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";
import { Building2, Layers, Megaphone, Link2, BookOpen, ShieldCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";

type Announcement = {
  id: string;
  title: string;
  summary: string;
  date: string;
  tag: string;
};

/**
 * DepartmentDashboard
 *
 * Renders the DepartmentDashboard interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for DepartmentDashboard.
 *
 * 
 * @returns State operations sequence.
 */
export default function DepartmentDashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
 * Executes operations logic for loadAnnouncements.
 *
 * 
 * @returns State operations sequence.
 */
async function loadAnnouncements() {
      try {
        const { data } = await supabase
          .from("announcements")
          .select("*")
          .eq("status", "Published")
          .order("created_at", { ascending: false });

        if (data) {
          setAnnouncements(data.map((a: any) => ({
            id: a.id,
            title: a.title,
            summary: a.subtitle || a.content || "",
            date: a.publish_date ? new Date(a.publish_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            tag: a.category || "Notice"
          })));
        }
      } catch (err) {
        console.error("Error loading announcements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();
  }, []);

  return (
    <div className={styles.text_0}>
      {/* Header */}
      <div className={styles.container_1}>
        <div>
          <h2 className={styles.text_2}>Department Hub</h2>
          <p className={styles.table_3}>Institutional Operations, Shared Assets & Announcements</p>
        </div>
        <div className={styles.container_4}>
          <span className={styles.text_5}>
            Engineering Division
          </span>
        </div>
      </div>

      {/* Grid of department overview cards */}
      <div className={styles.container_6}>
        {/* Core Mission */}
        <div className={styles.card_7}>
          <div className={styles.text_8}>
            <Building2 size={20} />
          </div>
          <h3 className={styles.table_9}>Padua Engineering</h3>
          <p className={styles.text_10}>
            The Padua Engineering division is tasked with building high-concurrency client ledgers, authentication nodes, and workflow pipelines.
          </p>
        </div>

        {/* System Architecture */}
        <div className={styles.card_11}>
          <div className={styles.text_12}>
            <Layers size={20} />
          </div>
          <h3 className={styles.table_13}>Shared Platforms</h3>
          <p className={styles.text_14}>
            Our codebase sits on Next.js 16 app directory structures, communicating with Supabase real-time PostgreSQL database grids and Framer Motion micro-animations.
          </p>
        </div>

        {/* Security Compliance */}
        <div className={styles.card_15}>
          <div className={styles.text_16}>
            <ShieldCheck size={20} />
          </div>
          <h3 className={styles.table_17}>Compliance Ledger</h3>
          <p className={styles.text_18}>
            Every commit and database access token is authenticated and logged. Unauthorized attempts are instantly flagged by the Padua security agent.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Announcements and Resources */}
      <div className={styles.container_19}>
        {/* Department Announcements */}
        <div className={styles.card_20}>
          <h4 className={styles.table_21}>
            <Megaphone size={16} className={styles.text_22} />
            <span>Operational Broadcasts</span>
          </h4>
          <div className={styles.div_23}>
            {loading ? (
              <p className={styles.table_24}>Loading broadcasts...</p>
            ) : announcements.length === 0 ? (
              <p className={styles.table_25}>No active broadcasts found</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className={styles.div_26}>
                  <div className={styles.container_27}>
                    <span className={`${styles.text_51} ${
                      announcement.tag === "Notice"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {announcement.tag}
                    </span>
                    <span className={styles.text_28}>{announcement.date}</span>
                  </div>
                  <h5 className={styles.text_29}>{announcement.title}</h5>
                  <p className={styles.text_30}>{announcement.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resources & Handbooks */}
        <div className={styles.card_31}>
          <h4 className={styles.table_32}>
            <BookOpen size={16} className={styles.text_33} />
            <span>Shared Division Resources</span>
          </h4>
          <div className={styles.div_34}>
            <a href="#" className={styles.table_35}>
              <span className={styles.text_36}>
                <Link2 size={14} className={styles.text_37} />
                <span>Intern Operations Handbook.pdf</span>
              </span>
              <ChevronRight size={14} className={styles.text_38} />
            </a>
            <a href="#" className={styles.table_39}>
              <span className={styles.text_40}>
                <Link2 size={14} className={styles.text_41} />
                <span>Padua Core API Documentation</span>
              </span>
              <ChevronRight size={14} className={styles.text_42} />
            </a>
            <a href="#" className={styles.table_43}>
              <span className={styles.text_44}>
                <Link2 size={14} className={styles.text_45} />
                <span>Security Compliance Checklists</span>
              </span>
              <ChevronRight size={14} className={styles.text_46} />
            </a>
            <a href="#" className={styles.table_47}>
              <span className={styles.text_48}>
                <Link2 size={14} className={styles.text_49} />
                <span>Supabase Sync Guide & Configuration</span>
              </span>
              <ChevronRight size={14} className={styles.text_50} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
