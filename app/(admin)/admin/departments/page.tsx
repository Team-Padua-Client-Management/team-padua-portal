"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/departments/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/departments/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase/client";
import { DEPARTMENTS } from "@/app/lib/departments";
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import { Building2, Users, ArrowRight } from "lucide-react";

type MemberCount = Record<string, number>;

/**
 * AdminDepartmentsPage
 *
 * Renders the AdminDepartmentsPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminDepartmentsPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function AdminDepartmentsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [memberCounts, setMemberCounts] = useState<MemberCount>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    /**
 * Executes operations logic for fetchCounts.
 *
 * 
 * @returns State operations sequence.
 */
const fetchCounts = async () => {
      const { data } = await /* Query database records from active repository grid */ supabase.from("profiles").select("department");
      if (!data) return;
      const counts: MemberCount = {};
      DEPARTMENTS.forEach((d) => {
        counts[d.code] = data.filter((p) => p.department === d.code).length;
      });
      setMemberCounts(counts);
    };
    fetchCounts();

    const channel = supabase
      .channel("dept-member-counts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
 * Executes operations logic for handleSelect.
 *
 * @param code: string
 * @returns State operations sequence.
 */
const handleSelect = (code: string) => {
    setSelectedCode(code);
    setTimeout(() => {
      router.push(`/admin/departments/${code.toLowerCase()}`);
    }, 400);
  };

  return (
    <div className={styles.container_0}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_1}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.container_2}>
          <div className={styles.div_3}>
            <div className={styles.div_4}>
              <div className={styles.container_5}>
                <div className={styles.container_6}>
                  <Building2 size={20} className={styles.text_7} />
                </div>
                <div>
                  <h1 className={styles.table_8}>
                    Departments
                  </h1>
                  <p className={styles.table_9}>
                    Select a division to manage
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.container_10}>
              {DEPARTMENTS.map((dept, i) => {
                const isHovered = hoveredCode === dept.code;
                const isSelected = selectedCode === dept.code;
                const count = memberCounts[dept.code] || 0;

                return (
                  <button
                    key={dept.code}
                    onClick={() => handleSelect(dept.code)}
                    onMouseEnter={() => setHoveredCode(dept.code)}
                    onMouseLeave={() => setHoveredCode(null)}
                    className={`${styles.card_11} group`}
                    style={{
                      opacity: mounted ? 1 : 0,
                      transform: mounted
                        ? isHovered
                          ? "translateY(-8px) scale(1.02)"
                          : isSelected
                            ? "scale(0.95)"
                            : "translateY(0) scale(1)"
                        : "translateY(40px) scale(0.95)",
                      transitionDelay: `${i * 100}ms`,
                      boxShadow: isHovered
                        ? `0 0 40px ${dept.color}25, 0 20px 60px ${dept.color}15`
                        : "none",
                    }}
                  >
                    <div
                      className={`${styles.table_12} group`}
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${dept.color}15 0%, transparent 70%)`,
                      }}
                    />

                    <div
                      className={styles.table_13}
                      style={{
                        background: isHovered ? dept.color : "transparent",
                        boxShadow: isHovered
                          ? `0 0 20px ${dept.color}60`
                          : "none",
                      }}
                    />

                    <div className={styles.div_14}>
                      <div className={styles.container_15}>
                        <div
                          className={styles.table_16}
                          style={{
                            background: isHovered
                              ? `${dept.color}20`
                              : "var(--muted)",
                            boxShadow: isHovered
                              ? `0 0 30px ${dept.color}30`
                              : "none",
                          }}
                        >
                          {dept.icon}
                        </div>

                        <div className={styles.table_17}>
                          <Users size={10} />
                          <span>{count}</span>
                        </div>
                      </div>

                      <div className={styles.div_18}>
                        <h2
                          className={styles.table_19}
                          style={{
                            color: isHovered ? dept.color : "var(--foreground)",
                          }}
                        >
                          {dept.code}
                        </h2>
                        <p className={styles.text_20}>
                          {dept.name}
                        </p>
                      </div>

                      <p className={styles.text_21}>
                        {dept.description}
                      </p>

                      <div className={styles.container_22}>
                        <span
                          className={styles.table_23}
                          style={{
                            color: isHovered
                              ? dept.color
                              : "var(--muted-foreground)",
                          }}
                        >
                          {dept.tagline}
                        </span>
                        <div
                          className={styles.table_24}
                          style={{
                            background: isHovered ? dept.color : "var(--muted)",
                            color: isHovered ? "#000" : "var(--muted-foreground)",
                            transform: isHovered
                              ? "translateX(0)"
                              : "translateX(-4px)",
                            opacity: isHovered ? 1 : 0.5,
                          }}
                        >
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        className={styles.div_25}
                        style={{
                          background: `${dept.color}10`,
                          animation: "pulse 0.4s ease-out",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className={styles.container_26}>
              {DEPARTMENTS.map((dept) => {
                const count = memberCounts[dept.code] || 0;
                return (
                  <div
                    key={dept.code}
                    className={styles.card_27}
                  >
                    <div
                      className={styles.div_28}
                      style={{ background: dept.color }}
                    />
                    <div>
                      <p className={styles.text_29}>
                        {count}
                      </p>
                      <p className={styles.table_30}>
                        {dept.code} Members
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
