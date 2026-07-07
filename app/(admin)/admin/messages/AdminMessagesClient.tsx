'use client';

/**
 * AdminMessagesClient.tsx
 *
 * Main component module in features path: app/(admin)/admin/messages/AdminMessagesClient.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/messages/AdminMessagesClient.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import { useState, useEffect } from "react";
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import Messenger from "@/components/Messenger";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { getConversationDetails } from "@/app/lib/messages/getConversationDetails";
import { supabase } from "@/app/lib/supabase/client";

type User = {
    id: string;
    email: string;
    name: string;
    avatar: string;
    avatarMode: string;
    aiSeed: string;
};

type Props = {
    users: User[];
    currentUserId?: string;
};

type StatusState = "online" | "busy" | "offline";

/**
 * Executes operations logic for AiAvatar.
 *
 * @param { seed, size = 36 }: { seed: string; size?: number }
 * @returns State operations sequence.
 */
function AiAvatar({ seed, size = 36 }: { seed: string; size?: number }) {
  /**
 * Executes operations logic for hash.
 *
 * @param s: string
 * @returns State operations sequence.
 */
const hash = (s: string) =>
    [...s].reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
  const n = Math.abs(hash(seed));
  const palettes = [
    { bg: ["#FFF9E5", "#FFF7D6"], orb1: "#F4C542", orb2: "#E6A800", acc: "#000000" },
    { bg: ["#1a1a2e", "#16213e"], orb1: "#e94560", orb2: "#0f3460", acc: "#e94560" },
    { bg: ["#0d1117", "#161b22"], orb1: "#58a6ff", orb2: "#1f6feb", acc: "#79c0ff" },
    { bg: ["#0a0a0a", "#1a0a2e"], orb1: "#a855f7", orb2: "#7c3aed", acc: "#d8b4fe" },
  ];
  const shapes = [
    "M 20,50 Q 35,20 50,50 Q 65,80 80,50",
    "M 15,40 Q 40,10 60,40 Q 80,70 85,45",
  ];
  const pal = palettes[n % palettes.length];
  const cx1 = 20 + (n % 40);
  const cy1 = 20 + ((n >> 4) % 40);
  const cx2 = 60 + (n % 30);
  const cy2 = 50 + ((n >> 8) % 30);
  const shape = shapes[(n >> 2) % shapes.length];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={pal.bg[0]} />
          <stop offset="100%" stopColor={pal.bg[1]} />
        </linearGradient>
        <radialGradient id={`orb1-${seed}`} cx="30%" cy="30%" r="60%">
          <stop offset="0%" stopColor={pal.orb1} stopOpacity="0.7" />
          <stop offset="100%" stopColor={pal.orb1} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`orb2-${seed}`} cx="70%" cy="70%" r="60%">
          <stop offset="0%" stopColor={pal.orb2} stopOpacity="0.6" />
          <stop offset="100%" stopColor={pal.orb2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bg-${seed})`} />
      <circle cx={cx1} cy={cy1} r="55" fill={`url(#orb1-${seed})`} />
      <circle cx={cx2} cy={cy2} r="45" fill={`url(#orb2-${seed})`} />
      <path d={shape} fill="none" stroke={pal.acc} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="3" fill={pal.acc} fillOpacity="0.9" />
    </svg>
  );
}

/**
 * Executes operations logic for InitialsAvatar.
 *
 * @param { name, size = 36 }: { name: string; size?: number }
 * @returns State operations sequence.
 */
function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={styles.text_0}
    >
      {initials}
    </div>
  );
}

/**
 * Executes operations logic for AvatarDisplay.
 *
 * @param { avatar, avatarMode, aiSeed, name, size = 36 }: { avatar?: string; avatarMode?: string; aiSeed?: string; name: string; size?: number }
 * @returns State operations sequence.
 */
function AvatarDisplay({ avatar, avatarMode, aiSeed, name, size = 36 }: { avatar?: string; avatarMode?: string; aiSeed?: string; name: string; size?: number }) {
  if (avatarMode === "upload" && avatar) {
    return (
      <img src={avatar} alt={name} style={{ width: size, height: size }}
        className={styles.div_1} />
    );
  }
  if (avatarMode === "ai" && aiSeed) {
    return (
      <div className={styles.div_2} style={{ width: size, height: size }}>
        <AiAvatar seed={aiSeed} size={size} />
      </div>
    );
  }
  return <InitialsAvatar name={name} size={size} />;
}

/**
 * AdminMessagesClient
 *
 * Renders the AdminMessagesClient interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminMessagesClient.
 *
 * @param { users, currentUserId: propCurrentUserId }: Props
 * @returns State operations sequence.
 */
export default function AdminMessagesClient({ users, currentUserId: propCurrentUserId }: Props) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId || null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [search, setSearch] = useState("");
    const [adminStatus, setAdminStatus] = useState<StatusState>("online");
    const [conversationDetails, setConversationDetails] = useState<Record<string, {
        id: string;
        last_message: string | null;
        last_message_at: string | null;
        unreadCount: number;
    }>>({});

    // Fetch current user ID if not provided as a prop
    useEffect(() => {
        if (currentUserId) return;
        /**
 * Executes operations logic for fetchUser.
 *
 * 
 * @returns State operations sequence.
 */
const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        fetchUser();
    }, [currentUserId]);

    // Fetch initial details on mount
    useEffect(() => {
        /**
 * Executes operations logic for fetchDetails.
 *
 * 
 * @returns State operations sequence.
 */
const fetchDetails = async () => {
            try {
                const data = await getConversationDetails();
                setConversationDetails(data);
            } catch (err) {
                console.error('Error fetching conversation details:', err);
            }
        };
        fetchDetails();
    }, []);

    // Listen to real-time conversation updates to update the sidebar messages dynamically
    useEffect(() => {
        const channel = supabase
            .channel('conversations-sidebar-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'conversations'
            }, (payload) => {
                const parts = (payload.new as any).conversation_key?.split(':');
                if (parts && parts.length === 2) {
                    const targetUserId = parts[1];
                    setConversationDetails((prev) => {
                        const current = prev[targetUserId] || { unreadCount: 0 };
                        const isCurrentlyActive = selectedUser?.id === targetUserId;
                        return {
                            ...prev,
                            [targetUserId]: {
                                id: (payload.new as any).id,
                                last_message: (payload.new as any).last_message,
                                last_message_at: (payload.new as any).last_message_at,
                                unreadCount: isCurrentlyActive ? 0 : current.unreadCount + 1
                            }
                        };
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedUser]);

    /**
 * Executes operations logic for handleSelectUser.
 *
 * @param user: User
 * @returns State operations sequence.
 */
const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setConversationDetails((prev) => {
            if (!prev[user.id]) return prev;
            return {
                ...prev,
                [user.id]: {
                    ...prev[user.id],
                    unreadCount: 0
                }
            };
        });
    };

    const filteredUsers = users.filter((u) => {
        return u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className={styles.input_3}>
            <Sidebar />
            <div className={styles.container_4}>
                <Header />
                <div className={styles.card_5}>
                    <aside className={styles.card_6}>
                        <div className={styles.div_7}>
                            <div className={styles.container_8}>
                                <h1 className={styles.table_9}>
                                    Chats
                                </h1>
                                <div className={styles.container_10}>
                                    {(["online", "busy", "offline"] as StatusState[]).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setAdminStatus(status)}
                                            className={`${styles.table_39} ${
                                                adminStatus === status
                                                    ? status === "online" ? "bg-green-500 text-white shadow-2xs" :
                                                      status === "busy" ? "bg-red-500 text-white shadow-2xs" : "bg-muted-foreground/30 text-foreground dark:text-muted-foreground shadow-2xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.div_11}>
                                <Search className={styles.text_12} size={14} />
                                <Input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations..."
                                    className={styles.card_13}
                                />
                            </div>
                        </div>

                        <div className={styles.container_14}>
                            {filteredUsers.length === 0 ? (
                                <p className={styles.text_15}>
                                    No direct conversations mapped.
                                </p>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isActive = selectedUser?.id === user.id;
                                    const detail = conversationDetails[user.id];
                                    const hasUnread = detail && detail.unreadCount > 0 && !isActive;
                                    const displayMessage = detail?.last_message || user.email;

                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className={`${styles.table_40} ${
                                                isActive ? "bg-[#FFF7D6]/60 dark:bg-[#2E2818]/30 border-r-2 border-[#F4C542]" : "hover:bg-muted/50"
                                            }`}
                                        >
                                            <div className={styles.div_16}>
                                                <AvatarDisplay 
                                                    avatar={user.avatar} 
                                                    avatarMode={user.avatarMode} 
                                                    aiSeed={user.aiSeed} 
                                                    name={user.name} 
                                                    size={40} 
                                                />
                                                <span className={styles.card_17} />
                                            </div>
                                            <div className={styles.container_18}>
                                                <div className={styles.container_19}>
                                                    <p className={`${styles.table_41} ${hasUnread ? "font-bold text-black dark:text-white" : "font-semibold"}`}>
                                                        {user.name}
                                                    </p>
                                                    {hasUnread ? (
                                                        <span className={styles.div_20} />
                                                    ) : (
                                                        <span className={styles.text_21}>Live</span>
                                                    )}
                                                </div>
                                                <p className={`${styles.table_42} ${hasUnread ? "text-foreground font-bold" : "text-muted-foreground font-medium"}`}>
                                                    {displayMessage}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    <main className={styles.container_22}>
                        {!selectedUser ? (
                            <div className={styles.card_23}>
                                <div className={styles.container_24}>
                                    <span className={styles.text_25}>💬</span>
                                </div>
                                <p className={styles.text_26}>
                                    Select a user configuration node to route conversation logs
                                </p>
                                <p className={styles.text_27}>
                                    Active communication pipelines are secured via enterprise gateway mapping.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.card_28}>
                                    <div className={styles.div_29}>
                                        <AvatarDisplay 
                                            avatar={selectedUser.avatar} 
                                            avatarMode={selectedUser.avatarMode} 
                                            aiSeed={selectedUser.aiSeed} 
                                            name={selectedUser.name} 
                                            size={40} 
                                        />
                                    </div>
                                    <div className={styles.div_30}>
                                        <p className={styles.table_31}>
                                            {selectedUser.name}
                                        </p>
                                        <p className={styles.table_32}>
                                            User Object ID: {selectedUser.id}
                                        </p>
                                    </div>
                                    <span className={styles.text_33}>
                                        <span className={styles.div_34} />
                                        CHANNEL ONLINE
                                    </span>
                                </div>

                                <div className={styles.container_35}>
                                    {currentUserId ? (
                                        <Messenger
                                            currentUserId={currentUserId}
                                            currentUserRole="admin"
                                            targetUserId={selectedUser.id}
                                            targetUserName={selectedUser.name}
                                        />
                                    ) : (
                                        <div className={styles.card_36}>
                                            <Loader2 className={styles.text_37} />
                                            <p className={styles.table_38}>Syncing Gateway...</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
