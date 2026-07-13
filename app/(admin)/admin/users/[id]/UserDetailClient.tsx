'use client';

/**
 * UserDetailClient.tsx
 *
 * Main component module in features path: app/(admin)/admin/users/[id]/UserDetailClient.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/users/[id]/UserDetailClient.module.css";
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";

// ======================================================
// State Initialization & Hooks
// ======================================================
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, Cake, MapPin, Briefcase, Shield,
  Activity, Users, Award, Globe, FileText, ExternalLink, QrCode, Navigation,
  Compass, Home, Hash, Milestone, Route, Binary
} from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface UserDetailProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    role: string;
    department: string;
    team: string;
    phone: string;
    gender: string;
    birthday: string;
    address: string;
    avatar: string;
    status: string;
    bio: string;
    website: string;
    gcashQr: string | null;
    bannerTheme: string;
    avatarMode: string;
    aiSeed: string;
    region: string;
    province: string;
    city: string;
    barangay: string;
    subdivision: string;
    street: string;
    houseNo: string;
    postalCode: string;
    latitude: string;
    longitude: string;
    mapUrl: string;
  };
  socialLinks: SocialLink[];
  attendance: any[];
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
}

const PLATFORM_META: Record<string, { label: string; color: string; icon: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", icon: "f" },
  indigo: { label: "Instagram", color: "#E1306C", icon: "ig" },
  github: { label: "GitHub", color: "#24292e", icon: "gh" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", icon: "in" },
  x: { label: "X", color: "#000000", icon: "𝕏" },
  tiktok: { label: "TikTok", color: "#010101", icon: "tt" },
  youtube: { label: "YouTube", color: "#FF0000", icon: "yt" },
  discord: { label: "Discord", color: "#5865F2", icon: "dc" },
  telegram: { label: "Telegram", color: "#26A5E4", icon: "tg" },
  website: { label: "Website", color: "#6B7280", icon: "🌐" },
};

/**
 * Executes operations logic for PlatformBadge.
 *
 * @param { platform, size = 28 }: { platform: string; size?: number }
 * @returns State operations sequence.
 */
function PlatformBadge({ platform, size = 28 }: { platform: string; size?: number }) {
  const platformKey = platform.toLowerCase();
  const meta = PLATFORM_META[platformKey] || PLATFORM_META.website;
  return (
    <div
      style={{ width: size, height: size, background: meta.color, fontSize: size * 0.32 }}
      className={styles.text_0}
    >
      {meta.icon}
    </div>
  );
}

/**
 * Executes operations logic for AiAvatar.
 *
 * @param { seed, size = 96 }: { seed: string; size?: number }
 * @returns State operations sequence.
 */
function AiAvatar({ seed, size = 96 }: { seed: string; size?: number }) {
  /**
 * Executes operations logic for hash.
 *
 * @param s: string
 * @returns State operations sequence.
 */
  const hash = (s: string) => [...s].reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
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
 * @param { name, size = 96 }: { name: string; size?: number }
 * @returns State operations sequence.
 */
function InitialsAvatar({ name, size = 96 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={styles.text_1}
    >
      {initials}
    </div>
  );
}

/**
 * UserDetailClient
 *
 * Renders the UserDetailClient interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for UserDetailClient.
 *
 * @param { initialUser, socialLinks, attendance, tasks }: UserDetailProps
 * @returns State operations sequence.
 */
export default function UserDetailClient({ initialUser, socialLinks, attendance, tasks }: UserDetailProps) {
  const [user] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("overview");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const router = useRouter();

  /**
 * Executes operations logic for AvatarDisplay.
 *
 * @param { size = 96 }: { size?: number }
 * @returns State operations sequence.
 */
  const AvatarDisplay = ({ size = 96 }: { size?: number }) => {
    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: size, height: size }}
          className={styles.div_2}
        />
      );
    }
    if (user.avatarMode === "ai" && user.aiSeed) {
      return (
        <div className={styles.div_3} style={{ width: size, height: size }}>
          <AiAvatar seed={user.aiSeed} size={size} />
        </div>
      );
    }
    return <InitialsAvatar name={user.name} size={size} />;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "personal", label: "Personal Info", icon: User },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "tasks", label: "Tasks Stream", icon: Shield }
  ];

  /**
 * Executes operations logic for LocationInformationCard.
 *
 * 
 * @returns State operations sequence.
 */
  const LocationInformationCard = () => (
    <div className={styles.card_4}>
      <h2 className={styles.text_5}>
        <MapPin className={styles.text_6} /> Location Information
      </h2>
      <div className={styles.text_7}>
        {[
          { label: "Region", value: user.region, icon: Globe },
          { label: "Province", value: user.province, icon: Compass },
          { label: "City / Municipality", value: user.city, icon: Home },
          { label: "Barangay", value: user.barangay, icon: Milestone },
          { label: "Subdivision", value: user.subdivision, icon: Route },
          { label: "Street", value: user.street, icon: Navigation },
          { label: "House / Block / Lot", value: user.houseNo, icon: Hash },
          { label: "Postal Code", value: user.postalCode, icon: Binary },
          { label: "Latitude", value: user.latitude, icon: MapPin },
          { label: "Longitude", value: user.longitude, icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={styles.div_8}>
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              <Icon size={11} className="text-[#F4C542]/80 shrink-0" />
              <span>{label}</span>
            </div>
            <p className={styles.text_10}>{value || "—"}</p>
          </div>
        ))}
      </div>
      {user.mapUrl && (
        <a
          href={user.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.table_11}
        >
          <Navigation size={14} className={styles.text_12} /> Open in Google Maps
        </a>
      )}
    </div>
  );

  return (
    <div className={styles.adminLayoutWrapper}>
      <Sidebar />
      <div className={styles.adminContentContainer}>
        <Header />
        <div className={styles.adminPageBody}>
          <div className={styles.container_14}>
            <button
              onClick={() => router.back()}
              className={styles.table_15}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>

          <div className={styles.card_16}>
            <div className={styles.div_17} style={{ background: user.bannerTheme }} />

            <div className={styles.card_18}>
              <div className={styles.container_19}>
                <div className={styles.div_20}>
                  <AvatarDisplay size={96} />
                  <span className={`${styles.card_113} ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>

                <div className={styles.container_21}>
                  <h1 className={styles.text_22}>{user.name}</h1>
                  <div className={styles.container_23}>
                    <span className={styles.table_24}>
                      {user.role}
                    </span>
                    <span className={`${styles.table_114} ${user.status === "Active" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" :
                      user.status === "Pending" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" :
                        "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400"
                      }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.container_25}>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${styles.table_115} ${activeTab === tab.id
                        ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      <Icon size={13} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeTab === "overview" && (
                <div className={styles.container_26}>
                  <div className={styles.div_27}>
                    <div className={styles.card_28}>
                      <div className={styles.container_29}>
                        <h2 className={styles.text_30}>Personal Info</h2>
                      </div>
                      <div className={styles.div_31}>
                        {[
                          { label: "Full Name", value: user.name, icon: User },
                          { label: "Phone", value: user.phone || "—", icon: Phone },
                          { label: "Website", value: user.website || "—", icon: Globe },
                          { label: "Birthday", value: user.birthday || "—", icon: Cake },
                          { label: "Address", value: user.address || "—", icon: MapPin },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className={styles.container_32}>
                            <div className={styles.container_33}>
                              <Icon size={12} className={styles.text_34} />
                            </div>
                            <div className={styles.container_35}>
                              <p className={styles.table_36}>{label}</p>
                              <p className={styles.table_37}>{value}</p>
                            </div>
                          </div>
                        ))}
                        <div className={styles.container_38}>
                          <div className={styles.container_39}>
                            <FileText size={12} className={styles.text_40} />
                          </div>
                          <div className={styles.container_41}>
                            <p className={styles.table_42}>Bio</p>
                            <p className={styles.text_43}>
                              {user.bio || <span className={styles.text_44}>Not set</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <LocationInformationCard />

                    <div className={styles.card_45}>
                      <div className={styles.container_46}>
                        <h2 className={styles.text_47}>
                          <ExternalLink className={styles.text_48} /> Third Party Links
                        </h2>
                      </div>
                      {socialLinks.length === 0 ? (
                        <div className={styles.container_49}>
                          <ExternalLink className={styles.text_50} />
                          <p className={styles.table_51}>No links added yet</p>
                        </div>
                      ) : (
                        <div className={styles.div_52}>
                          {socialLinks.map((link) => (
                            <div key={link.id} className={`${styles.container_53} group`}>
                              <PlatformBadge platform={link.platform} size={30} />
                              <div className={styles.container_54}>
                                <p className={styles.table_55}>
                                  {PLATFORM_META[link.platform.toLowerCase()]?.label || "Website"}
                                </p>
                                <p className={styles.table_56}>{link.url}</p>
                              </div>
                              <div className={`${styles.table_57} group`}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                  className={styles.card_58}>
                                  <ExternalLink size={10} className={styles.text_59} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.div_60}>
                    <div className={styles.card_61}>
                      <div className={styles.container_62}>
                        <h3 className={styles.table_63}>
                          <QrCode size={12} className={styles.text_64} /> GCash QR Code
                        </h3>
                      </div>
                      {user.gcashQr ? (
                        <div className={styles.container_65}>
                          <div
                            onClick={() => setIsQrModalOpen(true)}
                            className={styles.table_66}
                          >
                            <img src={user.gcashQr} alt="GCash QR" className={styles.div_67} />
                          </div>
                        </div>
                      ) : (
                        <div className={styles.container_68}>
                          <div className={styles.container_69}>
                            <QrCode className={styles.text_70} />
                          </div>
                          <p className={styles.text_71}>
                            No GCash QR Code uploaded
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "personal" && (
                <div className={styles.container_81}>
                  <div className={styles.card_82}>
                    <h3 className={styles.text_83}>Personal Information</h3>
                    <div className={styles.text_84}>
                      {[
                        { label: "Full Name", value: user.name, icon: User },
                        { label: "Email Address", value: user.email, icon: Mail },
                        { label: "Contact Phone", value: user.phone || "—", icon: Phone },
                        { label: "Birthday", value: user.birthday || "—", icon: Cake },
                        { label: "Gender Orientation", value: user.gender || "—", icon: Users },
                        { label: "Mailing Address", value: user.address || "—", icon: MapPin },
                        { label: "Website Link", value: user.website || "—", icon: Globe },
                      ].map((item, idx) => (
                        <div key={idx} className={styles.container_85}>
                          <span className={styles.text_86}>
                            <item.icon size={13} className={styles.text_87} /> {item.label}
                          </span>
                          <span className={styles.table_88}>{item.value}</span>
                        </div>
                      ))}
                      <div className={styles.container_89}>
                        <span className={styles.text_90}>
                          <FileText size={13} className={styles.text_91} /> Bio
                        </span>
                        <p className={styles.text_92}>
                          {user.bio || "No bio description provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <LocationInformationCard />
                </div>
              )}

              {activeTab === "employment" && (
                <div className={styles.card_93}>
                  <h3 className={styles.text_94}>Organization & Role Details</h3>
                  <div className={styles.text_95}>
                    {[
                      { label: "Role Architecture", value: user.role || "—", icon: Shield },
                      { label: "Assigned Department", value: user.department || "—", icon: Briefcase },
                      { label: "Assigned Team Node", value: user.team || "—", icon: Users },
                      { label: "Current Status", value: user.status || "—", icon: Activity },
                    ].map((item, idx) => (
                      <div key={idx} className={styles.container_96}>
                        <span className={styles.text_97}>
                          <item.icon size={13} className={styles.text_98} /> {item.label}
                        </span>
                        <span className={styles.text_99}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className={styles.card_100}>
                  <h3 className={styles.text_101}>Assigned Tasks</h3>
                  {tasks.length === 0 ? (
                    <div className={styles.text_102}>
                      No tasks assigned to this user.
                    </div>
                  ) : (
                    <div className={styles.div_103}>
                      {tasks.map((task) => (
                        <div key={task.id} className={styles.container_104}>
                          <div>
                            <h4 className={styles.text_105}>{task.title}</h4>
                            <p className={styles.text_106}>{task.description || "No description provided."}</p>
                            <div className={styles.text_107}>
                              <span className={styles.card_108}>
                                Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Limit"}
                              </span>
                              <span className={`${styles.div_116} ${task.priority === "High" ? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                                task.priority === "Medium" ? "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-[#F4C542]" :
                                  "border-primary/20 bg-primary/5 text-primary/80"
                                }`}>
                                {task.priority} Priority
                              </span>
                            </div>
                          </div>
                          <span className={`${styles.table_117} ${task.status === "Completed" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" :
                            task.status === "In Progress" ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/20" :
                              "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isQrModalOpen && user.gcashQr && (
            <div
              onClick={() => setIsQrModalOpen(false)}
              className={styles.container_109}
            >
              <div className={styles.container_110} onClick={(e) => e.stopPropagation()}>
                <div className={styles.div_111}>
                  <img
                    src={user.gcashQr}
                    alt="GCash QR Fullscreen"
                    className={styles.div_112}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
