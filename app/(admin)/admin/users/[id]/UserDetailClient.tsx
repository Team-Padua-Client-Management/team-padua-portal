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
import Header from "@/app/components/admin/AdminHeader";
import Sidebar from "@/app/components/admin/AdminSidebar";
import UserStatusBadge from "@/components/shared/UserStatusBadge";
import { supabase } from "@/app/lib/supabase/client";

// ======================================================
// State Initialization & Hooks
// ======================================================
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, Cake, MapPin, Briefcase, Shield,
  Activity, Users, Award, Globe, FileText, ExternalLink, QrCode, Navigation,
  Compass, Home, Hash, Milestone, Route, Binary
} from "lucide-react";
import ProfileAvatar from "@/components/shared/ProfileAvatar";

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
    presenceStatus?: string;
    avatar: string;
    status: string;
    bio: string;
    website: string;
    gcashQr: string | null;
    bannerTheme: string;
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

// Shared components imported above

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
  const [presenceStatus, setPresenceStatus] = useState(initialUser.presenceStatus || 'offline');

  useEffect(() => {
    const uniqueId = Math.random().toString(36).slice(2, 9);
    const channel = supabase
      .channel(`user-detail-presence-${initialUser.id}-${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${initialUser.id}`,
        },
        (payload) => {
          if (payload.new && 'status' in payload.new) {
            setPresenceStatus((payload.new as any).status || 'offline');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialUser.id]);

  // Local AvatarDisplay helper removed

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

            <div className="relative z-10 flex flex-col items-center text-center px-8 pb-8 pt-4 bg-card/20 backdrop-blur-sm">
              <div className="relative shrink-0 -mt-20 sm:-mt-28 border-4 border-white dark:border-slate-900 rounded-full shadow-xl bg-background transition-transform duration-300 hover:scale-105 z-20 w-28 h-28 overflow-hidden">
                <ProfileAvatar
                  avatarUrl={user.avatar}
                  name={user.name}
                  size={112}
                  className="w-full h-full object-cover rounded-full"
                />
                <span className={`absolute bottom-1 right-1 w-4.5 h-4.5 border-3 border-card rounded-full shadow-md animate-pulse ${
                  presenceStatus === 'online' ? 'bg-emerald-500' :
                  presenceStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'
                }`} />
              </div>

              <div className="mt-4 flex flex-col items-center gap-2">
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
                  <UserStatusBadge status={presenceStatus as any} />
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4">

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
