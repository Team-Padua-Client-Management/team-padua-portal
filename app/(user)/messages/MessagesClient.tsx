"use client";

/**
 * MessagesClient.tsx
 *
 * Main component module in features path: app/(user)/messages/MessagesClient.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/messages/MessagesClient.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from "react";
import Messenger from "@/components/Messenger";
import { Search, MessageSquare, Wifi, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";
import { getAdminConversationDetails } from "@/app/lib/messages/getAdminConversationDetails";

interface MessagesClientProps {
  userId?: string;
  username?: string;
}

/**
 * MessagesClient
 *
 * Renders the MessagesClient interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for MessagesClient.
 *
 * @param { userId: propUserId, username: propUsername }: MessagesClientProps
 * @returns State operations sequence.
 */
export default function MessagesClient({ userId: propUserId, username: propUsername }: MessagesClientProps) {
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [username, setUsername] = useState<string>(propUsername || 'User');
  const [search, setSearch] = useState("");
  const [conversationDetail, setConversationDetail] = useState<{
    id: string;
    last_message: string | null;
    last_message_at: string | null;
    unreadCount: number;
  } | null>(null);

  useEffect(() => {
    if (userId) return;
    /**
 * Executes operations logic for fetchUser.
 *
 * 
 * @returns State operations sequence.
 */
const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUsername(user.user_metadata?.full_name ?? user.email ?? 'User');
      }
    };
    fetchUser();
  }, [userId]);

  // Fetch conversation details with Admin
  useEffect(() => {
    /**
 * Executes operations logic for fetchDetails.
 *
 * 
 * @returns State operations sequence.
 */
const fetchDetails = async () => {
      try {
        const data = await getAdminConversationDetails();
        setConversationDetail(data);
      } catch (err) {
        console.error('Error fetching admin conversation details:', err);
      }
    };
    fetchDetails();
  }, [userId]);

  // Listen to realtime updates on this conversation
  useEffect(() => {
    if (!conversationDetail?.id) return;
    const channel = supabase
      .channel('user-conversation-sidebar-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationDetail.id}`
      }, (payload) => {
        setConversationDetail((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            last_message: (payload.new as any).last_message,
            last_message_at: (payload.new as any).last_message_at,
            unreadCount: 0
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationDetail?.id]);
  
  return (
    <div className={styles.text_0}>
      {/* Header */}
      <div className={styles.div_1}>
        <div className={styles.table_2} />
        <div className={styles.div_3}>
          <div className={styles.container_4}>
            <MessageSquare className={styles.text_5} />
            <span className={styles.table_6}>Communication Hub</span>
          </div>
          <h2 className={styles.table_7}>Messages</h2>
          <p className={styles.table_8}>Direct channels and discussion threads</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className={styles.card_9}>
        {/* Sidebar */}
        <aside className={styles.card_10}>
          <div className={styles.card_11}>
            <div className={styles.div_12}>
              <Search size={14} className={styles.text_13} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search channels..."
                className={styles.card_14}
                suppressHydrationWarning
              />
            </div>
          </div>
          <div className={styles.container_15}>
            <button
              type="button"
              className={styles.table_16}
              suppressHydrationWarning
            >
              <div className={styles.text_17}>
                AD
              </div>
              <div className={styles.container_18}>
                <div className={styles.container_19}>
                  <p className={styles.table_20}>
                    Admin Office
                  </p>
                  <span className={styles.table_21}>
                    <span className={styles.div_22} />
                    Online
                  </span>
                </div>
                <p className={styles.table_23}>
                  {conversationDetail?.last_message || "Support & Mentorship"}
                </p>
              </div>
            </button>
          </div>
        </aside>
        
        {/* Main Chat */}
        <main className={styles.container_24}>
          <div className={styles.card_25}>
            <div className={styles.text_26}>
              AD
            </div>
            <div>
              <p className={styles.table_27}>
                Admin Office
              </p>
              <p className={styles.table_28}>
                Direct Intern Assistance Channel
              </p>
            </div>
            <span className={styles.table_29}>
              <Wifi className={styles.div_30} />
              Live Connected
            </span>
          </div>
          <div className={styles.container_31}>
            {userId ? (
              <Messenger
                currentUserId={userId}
                currentUserRole="user"
              />
            ) : (
              <div className={styles.card_32}>
                <Loader2 className={styles.text_33} />
                <p className={styles.table_34}>Syncing Gateway...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
