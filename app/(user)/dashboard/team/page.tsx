"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/dashboard/team/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/dashboard/team/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { Users, Shield, Plus, MessageSquare, ClipboardList, Target, TrendingUp } from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  avatar: string;
  progress: number;
  role?: string;
};

/**
 * TeamDashboard
 *
 * Renders the TeamDashboard interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for TeamDashboard.
 *
 * 
 * @returns State operations sequence.
 */
export default function TeamDashboard() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 1, name: "John Renz Bandianon", avatar: "JB", progress: 92, role: "Advisor Support Associate (ASA)" },
    { id: 2, name: "Dan Andrew Asis", avatar: "DA", progress: 88, role: "Design Content Associate (DCA)" },
    { id: 3, name: "Lorena Isabel Dela Cruz", avatar: "LD", progress: 95, role: "Client Relations Associate (CRA)" },
    { id: 4, name: "Trisha Mae De la Cruz", avatar: "TC", progress: 87, role: "Business Support Associate (BSA)" },
    { id: 5, name: "Krystel Joy Kapangyarihan", avatar: "KK", progress: 91, role: "Client Relations Associate (CRA)" },
    { id: 6, name: "Marilyn Cantada", avatar: "MC", progress: 89, role: "Advisor Support Associate (ASA)" },
    { id: 7, name: "Jazz Princess Noveno", avatar: "JN", progress: 90, role: "Design Content Associate (DCA)" },
    { id: 8, name: "Divine Valerie Reyes", avatar: "DR", progress: 86, role: "Business Support Associate (BSA)" }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
 * Executes operations logic for fetchTeamData.
 *
 * 
 * @returns State operations sequence.
 */
async function fetchTeamData() {
      try {
        const { data: membersData } = await supabase
          .from("team_members")
          .select("id, name, avatar, progress");

        if (membersData && membersData.length > 0) {
          setMembers(membersData as TeamMember[]);
        }
      } catch (error) {
        console.error("Error loading team data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeamData();
  }, []);

  return (
    <div className={styles.text_0}>
      {/* Header */}
      <div className={styles.container_1}>
        <div>
          <h2 className={styles.text_2}>Team Node</h2>
          <p className={styles.table_3}>Team Padua - Client Management Roster & Operations</p>
        </div>
        <div className={styles.container_4}>
          <span className={styles.text_5}>
            Active Cohort
          </span>
        </div>
      </div>

      {/* Team Roster Grid */}
      <div className={styles.div_6}>
        <div className={styles.container_7}>
          <h3 className={styles.table_8}>Team Associates</h3>
          <button className={styles.card_9}>
            <Plus size={12} />
            <span>Invite Intern</span>
          </button>
        </div>

        <div className={styles.container_10}>
          {members.map((member) => (
            <div key={member.id} className={styles.card_11}>
              <div className={styles.container_12}>
                <div className={styles.text_13}>
                  {member.avatar || member.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className={styles.text_14}>{member.name}</h4>
                  <p className={styles.text_15}>{member.role || "Intern Associate"}</p>
                </div>
              </div>

              <div className={styles.div_16}>
                <div className={styles.table_17}>
                  <span>Sprint Completion</span>
                  <span className={styles.text_18}>{member.progress}%</span>
                </div>
                <div className={styles.div_19}>
                  <div 
                    className={styles.table_20} 
                    style={{ width: `${member.progress}%` }}
                  />
                </div>
              </div>


            </div>
          ))}
        </div>
      </div>

      {/* Team Metrics & Status */}
      <div className={styles.container_21}>
        {/* Team Activity Feed */}
        <div className={styles.card_22}>
          <h4 className={styles.table_23}>
            <TrendingUp size={16} className={styles.text_24} />
            <span>Shared Roster Activity</span>
          </h4>
          <div className={styles.div_25}>
            <div className={styles.container_26}>
              <div className={styles.text_27}>
                LD
              </div>
              <div>
                <p className={styles.text_28}><span className={styles.text_29}>Lorena Isabel Dela Cruz</span> signed attendance ledger</p>
                <p className={styles.text_30}>15 minutes ago</p>
              </div>
            </div>
            <div className={styles.container_31}>
              <div className={styles.text_32}>
                JB
              </div>
              <div>
                <p className={styles.text_33}><span className={styles.text_34}>John Renz Bandianon</span> updated client profile records</p>
                <p className={styles.text_36}>1 hour ago</p>
              </div>
            </div>
            <div className={styles.container_37}>
              <div className={styles.text_38}>
                DA
              </div>
              <div>
                <p className={styles.text_39}><span className={styles.text_40}>Dan Andrew Asis</span> published new marketing templates</p>
                <p className={styles.text_41}>4 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
