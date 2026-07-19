"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/profile/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/profile/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import Sidebar from "@/app/components/admin/AdminSidebar";
import Header from "@/app/components/admin/AdminHeader";
import UserStatusBadge from "@/components/shared/UserStatusBadge";
import {
  Shield, Bell, Lock, Camera, Sparkles, Upload, X, ImageIcon,
  Pencil, User, Phone, Globe, Cake, MapPin, FileText, Plus, Trash2,
  ExternalLink, QrCode,
} from "lucide-react";



type AvatarMode = "upload" | "ai" | "initials";

const AI_BG_PRESETS = [
  { id: "gold", label: "Gold Glow", style: "linear-gradient(135deg, #FFFFFF 0%, #FFF7D6 100%)" },
  { id: "aurora", label: "Midnight", style: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" },
  { id: "sunset", label: "Sunset", style: "linear-gradient(135deg, #f093fb, #f5576c)" },
  { id: "ocean", label: "Ocean", style: "linear-gradient(135deg, #0575e6, #021b79)" },
];

const PLATFORM_META: Record<string, { label: string; color: string; icon: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", icon: "f" },
  instagram: { label: "Instagram", color: "#E1306C", icon: "ig" },
  github: { label: "GitHub", color: "#24292e", icon: "gh" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", icon: "in" },
  x: { label: "X", color: "#000000", icon: "𝕏" },
  tiktok: { label: "TikTok", color: "#010101", icon: "tt" },
  youtube: { label: "YouTube", color: "#FF0000", icon: "yt" },
  discord: { label: "Discord", color: "#5865F2", icon: "dc" },
  telegram: { label: "Telegram", color: "#26A5E4", icon: "tg" },
  website: { label: "Website", color: "#6B7280", icon: "🌐" },
};

const PLATFORM_OPTIONS = Object.entries(PLATFORM_META).map(([id, meta]) => ({
  id,
  ...meta,
}));

/**
 * Executes operations logic for detectPlatform.
 *
 * @param url: string
 * @returns State operations sequence.
 */
function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("facebook.com") || lower.includes("fb.com")) return "facebook";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("github.com")) return "github";
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "x";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("discord.gg") || lower.includes("discord.com")) return "discord";
  if (lower.includes("t.me") || lower.includes("telegram.me")) return "telegram";
  return "website";
}

/**
 * Executes operations logic for PlatformBadge.
 *
 * @param { platform, size = 28 }: { platform: string; size?: number }
 * @returns State operations sequence.
 */
function PlatformBadge({ platform, size = 28 }: { platform: string; size?: number }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.website;
  return (
    <div
      style={{ width: size, height: size, background: meta.color, fontSize: size * 0.32 }}
      className={styles.text_1}
    >
      {meta.icon}
    </div>
  );
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

/**
 * ProfilePage
 *
 * Renders the ProfilePage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for ProfilePage.
 *
 * 
 * @returns State operations sequence.
 */
export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userStatus, setUserStatus] = useState("online");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [accountNotes, setAccountNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [avatarMode, setAvatarMode] = useState<AvatarMode>("initials");
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const [aiSeed, setAiSeed] = useState("");
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [avatarFileToUpload, setAvatarFileToUpload] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [bgGradient, setBgGradient] = useState(AI_BG_PRESETS[0].style);
  const [showBgPanel, setShowBgPanel] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: "", bio: "", birthday: "", address: "", phone: "", website: "",
  });

  const [gcashQr, setGcashQr] = useState<string | null>(null);
  const [gcashUploading, setGcashUploading] = useState(false);
  const [gcashError, setGcashError] = useState("");
  const gcashFileRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkPlatform, setNewLinkPlatform] = useState("website");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [savingLinks, setSavingLinks] = useState(false);
  const [profileRole, setProfileRole] = useState("Administrator");

  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    /**
 * Executes operations logic for loadProfile.
 *
 * 
 * @returns State operations sequence.
 */
const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        setUser(user);
        if (user) {
          let { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code === "PGRST116") {
            const googleName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              (user.user_metadata?.given_name
                ? `${user.user_metadata.given_name} ${user.user_metadata.family_name || ""}`.trim()
                : "");
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                full_name: googleName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
            if (insertError) throw insertError;
            profile = newProfile;
          } else if (profileError) {
            throw profileError;
          }

          const { data: fetchedSocialLinks, error: linksError } = await supabase
            .from("social_links")
            .select("*")
            .eq("user_id", user.id)
            .order("display_order");
          if (linksError) throw linksError;

          const providerAvatar = user.user_metadata?.avatar_url;
          setUploadedAvatar(profile?.avatar_url || providerAvatar || null);
          if (profile?.avatar_url || providerAvatar) {
            setAvatarMode(profile?.avatar_mode || "upload");
          }

          setAiSeed(profile?.ai_seed || user.id || user.email || "default");
          setBgGradient(profile?.banner_theme || AI_BG_PRESETS[0].style);
          setGcashQr(profile?.gcash_qr || null);
          setSocialLinks(fetchedSocialLinks || []);
          setProfileRole(profile?.role || "Administrator");
          setUserStatus(profile?.status || "online");
          const notesVal = user.user_metadata?.profile_notes || localStorage.getItem(`tp_notes_${user.id}`) || "";
          setAccountNotes(notesVal);

          setForm({
            full_name: profile?.full_name || "",
            bio: profile?.bio || "",
            birthday: profile?.birthday || "",
            address: profile?.address || "",
            phone: profile?.phone || "",
            website: profile?.website || "",
          });
        }
      } catch (err: any) {
        setProfileError(err.message || "Failed to load profile.");
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const uniqueId = Math.random().toString(36).slice(2, 9);
    const channel = supabase
      .channel(`profiles-status-admin-page-${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'status' in payload.new) {
            setUserStatus((payload.new as any).status || "online");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  /**
 * Executes operations logic for copyId.
 *
 * 
 * @returns State operations sequence.
 */
const copyId = () => {
    navigator.clipboard.writeText(user?.id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Executes operations logic for handleAvatarSelect.
   *
   * @param e: React.ChangeEvent<HTMLInputElement>
   * @returns State operations sequence.
   */
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFileToUpload(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreviewUrl(reader.result as string);
      setIsPreviewModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /**
   * Uploads the selected avatar file to Supabase and updates user profile.
   */
  const confirmAvatarUpload = async () => {
    if (!avatarFileToUpload) return;
    setUploading(true);
    setUploadError("");
    try {
      const fileExt = avatarFileToUpload.name.split(".").pop()?.toLowerCase() || "png";
      const path = `avatars/${user.id}.${fileExt}`;
      const { error: storageError } = await supabase.storage.from("avatars").upload(path, avatarFileToUpload, { 
        upsert: true,
        contentType: avatarFileToUpload.type,
        cacheControl: "3600",
      });
      if (storageError) throw storageError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      await supabase.from("profiles").update({
        avatar_url: publicUrl,
        avatar_mode: "upload",
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      setUploadedAvatar(publicUrl);
      setAvatarMode("upload");
      setShowAvatarPanel(false);
      setIsPreviewModalOpen(false);
      setAvatarFileToUpload(null);
      setAvatarPreviewUrl(null);
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  /**
 * Executes operations logic for handleGcashSelect.
 *
 * @param e: React.ChangeEvent<HTMLInputElement>
 * @returns State operations sequence.
 */
const handleGcashSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGcashUploading(true);
    setGcashError("");
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `gcash-qr/${user.id}.${fileExt}`;
      const { error: storageError } = await supabase.storage.from("gcash-qr").upload(path, file, { 
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });
      if (storageError) throw storageError;
      const { data: urlData } = supabase.storage.from("gcash-qr").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      await /* Query database records from active repository grid */ supabase.from("profiles").update({
        gcash_qr: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      setGcashQr(publicUrl);
    } catch (err: any) {
      setGcashError(err.message || "Upload failed.");
    } finally {
      setGcashUploading(false);
      e.target.value = "";
    }
  };

  /**
 * Executes operations logic for removeGcashQr.
 *
 * 
 * @returns State operations sequence.
 */
const removeGcashQr = async () => {
    const { error } = await /* Query database records from active repository grid */ supabase.from("profiles").update({
      gcash_qr: null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) setGcashQr(null);
  };

  /**
 * Executes operations logic for regenerateAi.
 *
 * 
 * @returns State operations sequence.
 */
const regenerateAi = async () => {
    const newSeed = Math.random().toString(36).substring(7);
    const aiUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;
    const { error } = await /* Query database records from active repository grid */ supabase.from("profiles").update({
      ai_seed: newSeed,
      avatar_url: aiUrl,
      avatar_mode: "ai",
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) {
      setAiSeed(newSeed);
      setUploadedAvatar(aiUrl);
      setAvatarMode("ai");
      window.dispatchEvent(new CustomEvent("profile-updated"));
    }
    setShowAvatarPanel(false);
  };

  /**
 * Executes operations logic for saveProfile.
 *
 * 
 * @returns State operations sequence.
 */
const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        bio: form.bio,
        birthday: form.birthday,
        address: form.address,
        phone: form.phone,
        website: form.website,
        avatar_url: uploadedAvatar,
        gcash_qr: gcashQr,
        avatar_mode: avatarMode,
        ai_seed: aiSeed,
        banner_theme: bgGradient,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      setSaved(true);
      setIsModalOpen(false);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const saveAccountNotes = async () => {
    if (!user) return;
    setIsSavingNotes(true);
    try {
      localStorage.setItem(`tp_notes_${user.id}`, accountNotes);
      const { error } = await supabase.auth.updateUser({
        data: { profile_notes: accountNotes }
      });
      if (error) throw error;
      alert("Secure notes saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save secure notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  /**
 * Executes operations logic for openAddLink.
 *
 * 
 * @returns State operations sequence.
 */
const openAddLink = () => {
    setEditingLinkId(null);
    setNewLinkUrl("");
    setNewLinkPlatform("website");
    setShowLinkForm(true);
  };

  /**
 * Executes operations logic for openEditLink.
 *
 * @param link: SocialLink
 * @returns State operations sequence.
 */
const openEditLink = (link: SocialLink) => {
    setEditingLinkId(link.id);
    setNewLinkUrl(link.url);
    setNewLinkPlatform(link.platform);
    setShowLinkForm(true);
  };

  /**
 * Executes operations logic for handleLinkUrlChange.
 *
 * @param val: string
 * @returns State operations sequence.
 */
const handleLinkUrlChange = (val: string) => {
    setNewLinkUrl(val);
    if (val.startsWith("http")) {
      setNewLinkPlatform(detectPlatform(val));
    }
  };

  /**
 * Executes operations logic for saveLink.
 *
 * 
 * @returns State operations sequence.
 */
const saveLink = async () => {
    if (!newLinkUrl.trim()) return;
    setSavingLinks(true);

    if (editingLinkId) {
      await supabase
        .from("social_links")
        .update({ platform: newLinkPlatform, url: newLinkUrl.trim() })
        .eq("id", editingLinkId);

      setSocialLinks((prev) =>
        prev.map((l) =>
          l.id === editingLinkId ? { ...l, url: newLinkUrl.trim(), platform: newLinkPlatform } : l
        )
      );
    } else {
      const { data: inserted } = await supabase
        .from("social_links")
        .insert({
          user_id: user.id,
          platform: newLinkPlatform,
          url: newLinkUrl.trim(),
          icon: newLinkPlatform,
          display_order: socialLinks.length + 1,
        })
        .select()
        .single();

      if (inserted) {
        setSocialLinks((prev) => [...prev, inserted]);
      }
    }

    setShowLinkForm(false);
    setNewLinkUrl("");
    setEditingLinkId(null);
    setSavingLinks(false);
  };

  /**
 * Executes operations logic for deleteLink.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const deleteLink = async (id: string) => {
    await /* Query database records from active repository grid */ supabase.from("social_links").delete().eq("id", id);
    setSocialLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const displayName =
    form.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
    : "—";

  const provider =
    user?.app_metadata?.provider === "google" ? "Google" :
      user?.app_metadata?.provider === "github" ? "GitHub" : "Email / Password";

  const tabs = ["overview", "security", "notifications"];
  const bannerStyle: React.CSSProperties = { background: bgGradient };

  if (profileLoading) {
    return (
      <div className={styles.container_2}>
        <div className={styles.container_3}>
          <div className={styles.container_4}>
            <div className={styles.div_5} />
            <div className={styles.div_6} />
            <div className={styles.table_7} />
            <div className={styles.div_8} />
          </div>
          <p className={styles.table_9}>Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={styles.container_10}>
        <div className={styles.container_11}>
          <p className={styles.text_12}>{profileError}</p>
          <button type="button" onClick={() => window.location.reload()}
            className={styles.table_13}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }



  return (
    <div className={styles.text_16}>
      <Sidebar />
      <div className={styles.container_17}>
        <Header />
        <main className={styles.text_18}>
          <div className={styles.div_19}>
            <h2 className={styles.text_20}>Profile Settings</h2>
            <p className={styles.table_21}>Update information and preferences</p>
          </div>

          <div className={styles.card_22}>
            <div className={styles.div_23} style={bannerStyle}>
              <div className={styles.div_24}>
                <button type="button" onClick={() => setShowBgPanel(!showBgPanel)}
                  className={styles.table_25}>
                  <ImageIcon className={styles.div_26} /> Theme Banner
                </button>
                {showBgPanel && (
                  <div className={styles.card_27}>
                    <div className={styles.container_28}>
                      <p className={styles.table_29}>Select Theme Banner</p>
                      <button type="button" onClick={() => setShowBgPanel(false)}>
                        <X className={styles.text_30} />
                      </button>
                    </div>
                    <div className={styles.container_31}>
                      {AI_BG_PRESETS.map((preset) => (
                        <button key={preset.id} type="button"
                          onClick={async () => {
                            const { error } = await /* Query database records from active repository grid */ supabase.from("profiles").update({
                              banner_theme: preset.style,
                              updated_at: new Date().toISOString(),
                            }).eq("id", user.id);
                            if (!error) {
                              setBgGradient(preset.style);
                              setShowBgPanel(false);
                            }
                          }}
                          className={`${styles.container_32} group`}>
                          <div className={`${styles.table_33} group`}
                            style={{ background: preset.style }} />
                          <span className={styles.table_34}>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-8 pb-8 pt-4 bg-card/20 backdrop-blur-sm">
              <div className="relative shrink-0 -mt-20 sm:-mt-28 z-20">
                <div className="border-4 border-white dark:border-slate-900 rounded-full shadow-xl bg-background transition-transform duration-300 hover:scale-105">
                  <ProfileAvatar avatarUrl={uploadedAvatar} name={displayName} size={112} className="w-28 h-28 object-cover rounded-full" />
                </div>
                <button type="button" onClick={() => setShowAvatarPanel(!showAvatarPanel)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-black border border-border rounded-md flex items-center justify-center hover:bg-[#F4C542] transition-colors shadow cursor-pointer z-30">
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {showAvatarPanel && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 z-[60] w-56 bg-card rounded-2xl border border-border shadow-2xl p-3 space-y-1 text-foreground">
                    <div className="flex justify-between items-center px-1 pb-2 border-b border-border">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Change Avatar</p>
                      <button type="button" onClick={() => setShowAvatarPanel(false)} className="text-muted-foreground hover:text-foreground p-0.5 rounded transition">
                        <X size={12} />
                      </button>
                    </div>
                    <button type="button" onClick={() => avatarFileRef.current?.click()} disabled={uploading}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-semibold hover:bg-muted text-foreground cursor-pointer disabled:opacity-50 transition">
                      <Upload size={14} className="text-[#F4C542] shrink-0" />
                      <div>
                        <p>{uploading ? "Uploading..." : "Upload Photo"}</p>
                        <p className="text-[8px] text-muted-foreground">JPG or PNG</p>
                      </div>
                    </button>
                    <button type="button" onClick={regenerateAi}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-semibold hover:bg-muted text-foreground cursor-pointer transition">
                      <Sparkles size={14} className="text-[#F4C542] shrink-0 animate-pulse" />
                      <div>
                        <p>AI Avatar</p>
                        <p className="text-[8px] text-muted-foreground">Generate Unique</p>
                      </div>
                    </button>
                    <button type="button" onClick={async () => {
                      const { error } = await supabase.from("profiles").update({
                        avatar_url: null,
                        avatar_mode: "initials",
                        updated_at: new Date().toISOString(),
                      }).eq("id", user.id);
                      if (!error) {
                        setUploadedAvatar(null);
                        setAvatarMode("initials");
                        window.dispatchEvent(new CustomEvent("profile-updated"));
                      }
                      setShowAvatarPanel(false);
                    }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-semibold hover:bg-muted text-foreground cursor-pointer transition">
                      <span className="w-5 h-5 flex items-center justify-center bg-[#F4C542]/10 text-[#F4C542] rounded text-[9px] font-bold shrink-0">AB</span>
                      <div>
                        <p>Use Initials</p>
                        <p className="text-[8px] text-muted-foreground">Name letters</p>
                      </div>
                    </button>
                    {uploadError && <p className="text-[10px] text-red-500 text-center font-bold">{uploadError}</p>}
                    <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{profileRole}</p>
                <div className="py-1">
                  <UserStatusBadge status={userStatus as any} />
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 bg-card/20 backdrop-blur-sm relative">
              <div className={styles.container_62}>
                {tabs.map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={`${styles.table_192} ${activeTab === tab
                        ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}>
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className={styles.container_63}>
                  <div className={styles.div_64}>
                    <div className={styles.card_65}>
                      <div className={styles.container_66}>
                        <h2 className={styles.text_67}>Personal Info</h2>
                        <button type="button" onClick={() => setIsModalOpen(true)}
                          className={styles.table_68}>
                          <Pencil size={11} /> Edit Profile
                        </button>
                      </div>
                      <div className={styles.div_69}>
                        {[
                          { label: "Full Name", key: "full_name", icon: User },
                          { label: "Phone", key: "phone", icon: Phone },
                          { label: "Website", key: "website", icon: Globe },
                          { label: "Birthday", key: "birthday", icon: Cake },
                          { label: "Address", key: "address", icon: MapPin },
                        ].map(({ label, key, icon: Icon }) => (
                          <div key={key} className={styles.container_70}>
                            <div className={styles.container_71}>
                              <Icon size={12} className={styles.text_72} />
                            </div>
                            <div className={styles.container_73}>
                              <p className={styles.table_74}>{label}</p>
                              <p className={styles.table_75}>
                                {form[key as keyof typeof form] || <span className={styles.text_76}>Not set</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className={styles.container_77}>
                          <div className={styles.container_78}>
                            <FileText size={12} className={styles.text_79} />
                          </div>
                          <div className={styles.container_80}>
                            <p className={styles.table_81}>Bio</p>
                            <p className={styles.text_82}>
                              {form.bio || <span className={styles.text_83}>Not set</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.card_84}>
                      <h2 className={styles.text_85}>
                        <Shield className={styles.text_86} /> Account Credentials
                      </h2>
                      <div className={styles.div_87}>
                        <div className={styles.container_88}>
                          <div>
                            <p className={styles.table_89}>Email Address</p>
                            <p className={styles.text_90}>{user.email}</p>
                          </div>
                          <span className={styles.table_91}>
                            Verified
                          </span>
                        </div>
                        <div className={styles.container_92}>
                          <div>
                            <p className={styles.table_93}>Auth Provider</p>
                            <p className={styles.text_94}>{provider}</p>
                          </div>
                        </div>
                        <div className={styles.container_95}>
                          <div>
                            <p className={styles.table_96}>Member Since</p>
                            <p className={styles.text_97}>{joinedDate}</p>
                          </div>
                        </div>
                        <div className={styles.container_98}>
                          <div className={styles.div_99}>
                            <p className={styles.table_100}>Workspace Account ID</p>
                            <p className={styles.table_101}>{user.id}</p>
                          </div>
                          <button type="button" onClick={copyId}
                            className={styles.table_102}>
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={styles.card_103}>
                      <div className={styles.container_104}>
                        <h2 className={styles.text_105}>
                          <ExternalLink className={styles.text_106} /> Third Party Links
                        </h2>
                        <button type="button" onClick={openAddLink}
                          className={styles.table_107}>
                          <Plus size={11} /> Add Link
                        </button>
                      </div>
                      {socialLinks.length === 0 ? (
                        <div className={styles.container_108}>
                          <ExternalLink className={styles.text_109} />
                          <p className={styles.table_110}>No links added yet</p>
                          <button type="button" onClick={openAddLink}
                            className={styles.text_111}>
                            Add your first link
                          </button>
                        </div>
                      ) : (
                        <div className={styles.div_112}>
                          {socialLinks.map((link) => (
                            <div key={link.id} className={`${styles.container_113} group`}>
                              <PlatformBadge platform={link.platform} size={30} />
                              <div className={styles.container_114}>
                                <p className={styles.table_115}>
                                  {PLATFORM_META[link.platform]?.label || "Website"}
                                </p>
                                <p className={styles.table_116}>{link.url}</p>
                              </div>
                              <div className={`${styles.table_117} group`}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                  className={styles.card_118}>
                                  <ExternalLink size={10} className={styles.text_119} />
                                </a>
                                <button type="button" onClick={() => openEditLink(link)}
                                  className={styles.card_120}>
                                  <Pencil size={10} className={styles.text_121} />
                                </button>
                                <button type="button" onClick={() => deleteLink(link.id)}
                                  className={styles.card_122}>
                                  <Trash2 size={10} className={styles.text_123} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.div_124}>
                    <div className={styles.card_125}>
                      <div className={styles.container_126}>
                        <h3 className={styles.table_127}>
                          <QrCode size={12} className={styles.text_128} /> GCash QR Code
                        </h3>
                        {gcashQr && (
                          <button type="button" onClick={removeGcashQr}
                            className={styles.table_129}>
                            Remove
                          </button>
                        )}
                      </div>
                      {gcashQr ? (
                        <div className={styles.container_130}>
                          <div className={styles.div_131}>
                            <img src={gcashQr} alt="GCash QR" className={styles.div_132} />
                          </div>
                          <button type="button" onClick={() => gcashFileRef.current?.click()}
                            className={styles.table_133}>
                            <Upload size={10} /> Replace QR
                          </button>
                        </div>
                      ) : (
                        <div className={styles.container_134}>
                          <div className={styles.container_135}>
                            <QrCode className={styles.text_136} />
                          </div>
                          <button type="button" onClick={() => gcashFileRef.current?.click()} disabled={gcashUploading}
                            className={styles.table_137}>
                            <Upload size={10} /> {gcashUploading ? "Uploading..." : "Upload QR"}
                          </button>
                          <p className={styles.text_138}>
                            Upload your GCash QR so teammates can send payments
                          </p>
                        </div>
                      )}
                      {gcashError && <p className={styles.text_139}>{gcashError}</p>}
                      <input ref={gcashFileRef} type="file" accept="image/*" className={styles.div_140} onChange={handleGcashSelect} />
                    </div>

                    <div className={styles.card_141}>
                      <h2 className={styles.table_142}>Session Details</h2>
                      <div className={styles.text_143}>
                        <div className={styles.div_144}>
                          <p className={styles.table_145}>Last Login</p>
                          <p className={styles.text_146}>{lastSignIn}</p>
                        </div>
                        <div className={styles.div_147}>
                          <p className={styles.table_148}>Current Role</p>
                          <p className={styles.table_149}>{profileRole}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className={styles.card_150}>
                    <h2 className={styles.text_151}>
                      <Lock className={styles.text_152} /> Security Credentials
                    </h2>
                    <div className={styles.container_153}>
                      <div>
                        <p className={styles.table_154}>Two-factor authentication</p>
                        <p className={styles.table_155}>Add an extra layer of security to your account</p>
                      </div>
                      <button type="button" onClick={() => setTwoFactor(!twoFactor)}
                        className={`${styles.table_193} ${twoFactor ? "bg-[#F4C542]" : "bg-muted border border-border"}`}>
                        <span className={`${styles.table_194} ${twoFactor ? "left-5" : "left-1"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <div className="p-1.5 bg-[#F4C542]/10 rounded-lg text-[#F4C542] flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Secure Credentials Vault</h3>
                        <p className="text-[10px] text-muted-foreground">Keep private notes for passwords, emails, and account details here. Saved to your cloud metadata.</p>
                      </div>
                    </div>
                    <textarea
                      value={accountNotes}
                      onChange={(e) => setAccountNotes(e.target.value)}
                      placeholder="Enter emails, passwords, or recovery codes here..."
                      rows={6}
                      className="w-full text-sm font-mono text-foreground bg-muted border border-border rounded-lg p-3 focus:outline-none focus:border-[#F4C542]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={saveAccountNotes}
                        disabled={isSavingNotes}
                        className="px-4 py-2 bg-[#F4C542] hover:bg-[#d8ad2d] text-black text-xs font-bold rounded-lg transition"
                      >
                        {isSavingNotes ? "Saving Vault..." : "Save Vault Notes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className={styles.card_156}>
                  <h2 className={styles.text_157}>
                    <Bell className={styles.text_158} /> Notification Preferences
                  </h2>
                  <div className={styles.div_159}>
                    {[
                      { label: "Email Notifications", desc: "Receive automated team ledger updates and summaries", state: notifEmail, toggle: () => setNotifEmail(!notifEmail) },
                      { label: "Push Notifications", desc: "Receive instant browser announcements and message alerts", state: notifPush, toggle: () => setNotifPush(!notifPush) },
                    ].map((item) => (
                      <div key={item.label} className={styles.container_160}>
                        <div>
                          <p className={styles.table_161}>{item.label}</p>
                          <p className={styles.table_162}>{item.desc}</p>
                        </div>
                        <button type="button" onClick={item.toggle}
                          className={`${styles.table_195} ${item.state ? "bg-[#F4C542]" : "bg-muted border border-border"}`}>
                          <span className={`${styles.table_196} ${item.state ? "left-5" : "left-1"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className={styles.container_163}>
          <div className={styles.card_164}>
            <button type="button" onClick={() => setIsModalOpen(false)}
              className={styles.table_165}>
              <X size={16} />
            </button>
            <h3 className={styles.text_166}>Edit Personal Info</h3>
            <div className={styles.div_167}>
              {[
                { label: "Full Name", key: "full_name", placeholder: "Your full name" },
                { label: "Phone", key: "phone", placeholder: "+63 9XX XXX XXXX" },
                { label: "Website", key: "website", placeholder: "https://yoursite.com" },
                { label: "Birthday", key: "birthday", placeholder: "YYYY-MM-DD", type: "date" },
                { label: "Address", key: "address", placeholder: "City, Country" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className={styles.table_168}>{label}</label>
                  <input type={type || "text"} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={styles.card_169} />
                </div>
              ))}
              <div>
                <label className={styles.table_170}>Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="A short bio about yourself…" rows={3}
                  className={styles.card_171} />
              </div>
            </div>
            <div className={styles.container_172}>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className={styles.table_173}>
                Cancel
              </button>
              <button type="button" onClick={saveProfile} disabled={saving}
                className={styles.table_174}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkForm && (
        <div className={styles.container_175}>
          <div className={styles.card_176}>
            <button type="button" onClick={() => setShowLinkForm(false)}
              className={styles.table_177}>
              <X size={16} />
            </button>
            <h3 className={styles.text_178}>
              {editingLinkId ? "Edit Link" : "Add New Link"}
            </h3>
            <div className={styles.div_179}>
              <div>
                <label className={styles.table_180}>URL</label>
                <input type="url" value={newLinkUrl} onChange={(e) => handleLinkUrlChange(e.target.value)}
                  placeholder="https://facebook.com/yourprofile"
                  className={styles.card_181} />
              </div>
              <div>
                <label className={styles.table_182}>Platform</label>
                <div className={styles.container_183}>
                  {PLATFORM_OPTIONS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setNewLinkPlatform(p.id)}
                      title={p.label}
                      className={`${styles.table_197} ${newLinkPlatform === p.id
                          ? "border-[#F4C542] bg-[#FFF7D6] dark:bg-[#2E2818]"
                          : "border-border bg-muted hover:border-[#F4C542]/50"
                        }`}>
                      <PlatformBadge platform={p.id} size={22} />
                      <span className={styles.table_184}>{p.label.slice(0, 4)}</span>
                    </button>
                  ))}
                </div>
              </div>
              {newLinkUrl && (
                <div className={styles.container_185}>
                  <PlatformBadge platform={newLinkPlatform} size={28} />
                  <div className={styles.container_186}>
                    <p className={styles.table_187}>
                      {PLATFORM_META[newLinkPlatform]?.label}
                    </p>
                    <p className={styles.table_188}>{newLinkUrl}</p>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.container_189}>
              <button type="button" onClick={() => setShowLinkForm(false)}
                className={styles.table_190}>
                Cancel
              </button>
              <button type="button" onClick={saveLink} disabled={savingLinks || !newLinkUrl.trim()}
                className={styles.table_191}>
                {savingLinks ? "Saving…" : editingLinkId ? "Update Link" : "Add Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Preview Modal */}
      {isPreviewModalOpen && avatarPreviewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#121318] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-zinc-900/30">
              <h3 className="text-sm font-bold text-zinc-100">Check Profile Image</h3>
              <button 
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setAvatarFileToUpload(null);
                  setAvatarPreviewUrl(null);
                }} 
                className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-zinc-800 rounded-xl transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center bg-zinc-950/40">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-900 shadow-inner flex items-center justify-center">
                <img 
                  src={avatarPreviewUrl} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-4 text-center">
                This is how your new profile image will appear in the workspace.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800 bg-zinc-900/20">
              <button
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setAvatarFileToUpload(null);
                  setAvatarPreviewUrl(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAvatarUpload}
                disabled={uploading}
                className="px-5 py-2 text-xs font-bold bg-[#F4C542] text-black hover:bg-[#d8ad2d] rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
