"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/profile/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/profile/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase/client";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import UserStatusBadge from "@/components/shared/UserStatusBadge";
import {
  Shield, Bell, Lock, Camera, Sparkles, Upload, X, ImageIcon,
  Pencil, User, Phone, Globe, Cake, MapPin, FileText, Plus, Trash2,
  ExternalLink, QrCode, Navigation, Copy, Check,
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

const PLATFORM_OPTIONS = Object.entries(PLATFORM_META).map(([id, meta]) => ({ id, ...meta }));

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

interface PSGCRegion { code: string; name: string; }
interface PSGCProvince { code: string; name: string; regionCode: string; }
interface PSGCCity { code: string; name: string; provinceCode: string; isCity: boolean; }
interface PSGCBarangay { code: string; name: string; cityCode: string; }

interface AddressForm {
  region: string;
  province: string;
  city: string;
  barangay: string;
  subdivision: string;
  street: string;
  house_no: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  map_url: string;
}

const SUBDIVISIONS: { city: string; name: string }[] = [
  { city: "Marilao", name: "Marilao Grand Villas" },
  { city: "Marilao", name: "Villa Luisa" },
  { city: "Marilao", name: "Town and Country" },
  { city: "Marilao", name: "Marilao Meadows" },
  { city: "Marilao", name: "Marilao Heights" },
  { city: "Marilao", name: "Kingspoint Subdivision" },
  { city: "Meycauayan", name: "Citrus Village" },
  { city: "Meycauayan", name: "Spring Country" },
  { city: "Bocaue", name: "Bocaue Villas" },
  { city: "Valenzuela", name: "Caruhatan Village" },
  { city: "Caloocan", name: "Camarin Homes" },
  { city: "Quezon City", name: "Commonwealth Villas" },
  { city: "Quezon City", name: "Fairview Park" },
  { city: "Makati", name: "Bel-Air Village" },
  { city: "Pasig", name: "Valle Verde" },
];

/**
 * Executes operations logic for useAddressData.
 *
 * 
 * @returns State operations sequence.
 */
function useAddressData() {
  const [regions, setRegions] = useState<PSGCRegion[]>([]);
  const [provinces, setProvinces] = useState<PSGCProvince[]>([]);
  const [cities, setCities] = useState<PSGCCity[]>([]);
  const [barangays, setBarangays] = useState<PSGCBarangay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /**
 * Executes operations logic for fetchRegions.
 *
 * 
 * @returns State operations sequence.
 */
const fetchRegions = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://psgc.gitlab.io/api/regions/");
        const data = await res.json();
        setRegions(
          data
            .map((r: any) => ({ code: r.code, name: r.name }))
            .sort((a: PSGCRegion, b: PSGCRegion) => a.name.localeCompare(b.name))
        );
      } catch {
        setRegions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  const fetchProvinces = useCallback(async (regionCode: string) => {
    setProvinces([]);
    setCities([]);
    setBarangays([]);
    if (!regionCode) return;
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`);
      const data = await res.json();
      setProvinces(
        data
          .map((p: any) => ({ code: p.code, name: p.name, regionCode }))
          .sort((a: PSGCProvince, b: PSGCProvince) => a.name.localeCompare(b.name))
      );
    } catch {
      setProvinces([]);
    }
  }, []);

  const fetchCities = useCallback(async (regionCode: string, provinceCode: string) => {
    setCities([]);
    setBarangays([]);
    if (!regionCode || !provinceCode) return;
    try {
      const [citiesRes, munsRes] = await Promise.all([
        fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities/`),
        fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities/`),
      ]);
      const citiesData = citiesRes.ok ? await citiesRes.json() : [];
      const munsData = munsRes.ok ? await munsRes.json() : [];
      const combined = [
        ...citiesData.map((c: any) => ({ code: c.code, name: c.name, provinceCode, isCity: true })),
        ...munsData.map((m: any) => ({ code: m.code, name: m.name, provinceCode, isCity: false })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      setCities(combined);
    } catch {
      setCities([]);
    }
  }, []);

  const fetchBarangays = useCallback(async (cityCode: string, isCity: boolean) => {
    setBarangays([]);
    if (!cityCode) return;
    try {
      const endpoint = isCity
        ? `https://psgc.gitlab.io/api/cities/${cityCode}/barangays/`
        : `https://psgc.gitlab.io/api/municipalities/${cityCode}/barangays/`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setBarangays(
        data
          .map((b: any) => ({ code: b.code, name: b.name, cityCode }))
          .sort((a: PSGCBarangay, b: PSGCBarangay) => a.name.localeCompare(b.name))
      );
    } catch {
      setBarangays([]);
    }
  }, []);

  return { regions, provinces, cities, barangays, loading, fetchProvinces, fetchCities, fetchBarangays };
}

interface AddressSectionProps {
  address: AddressForm;
  onChange: (addr: AddressForm) => void;
  compact?: boolean;
}

/**
 * Executes operations logic for AddressSection.
 *
 * @param { address, onChange, compact = false }: AddressSectionProps
 * @returns State operations sequence.
 */
function AddressSection({ address, onChange, compact = false }: AddressSectionProps) {
  const { regions, provinces, cities, barangays, fetchProvinces, fetchCities, fetchBarangays } = useAddressData();
  const [subdivisionSearch, setSubdivisionSearch] = useState(address.subdivision || "");
  const [showSubdivisionDropdown, setShowSubdivisionDropdown] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [copiedMap, setCopiedMap] = useState(false);
  const subdivisionRef = useRef<HTMLDivElement>(null);

  const selectedRegion = regions.find(r => r.name === address.region);
  const selectedProvince = provinces.find(p => p.name === address.province);
  const selectedCity = cities.find(c => c.name === address.city);

  useEffect(() => {
    if (selectedRegion) fetchProvinces(selectedRegion.code);
  }, [selectedRegion?.code]);

  useEffect(() => {
    if (selectedRegion && selectedProvince) fetchCities(selectedRegion.code, selectedProvince.code);
  }, [selectedProvince?.code]);

  useEffect(() => {
    if (selectedCity) fetchBarangays(selectedCity.code, selectedCity.isCity);
  }, [selectedCity?.code]);

  useEffect(() => {
    setSubdivisionSearch(address.subdivision || "");
  }, [address.subdivision]);

  useEffect(() => {
    /**
 * Executes operations logic for handleClick.
 *
 * @param e: MouseEvent
 * @returns State operations sequence.
 */
const handleClick = (e: MouseEvent) => {
      if (subdivisionRef.current && !subdivisionRef.current.contains(e.target as Node)) {
        setShowSubdivisionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredSubdivisions = SUBDIVISIONS.filter(s => {
    const cityMatch = !address.city || s.city.toLowerCase().includes(address.city.toLowerCase().split(" ")[0]);
    const searchMatch = !subdivisionSearch || s.name.toLowerCase().includes(subdivisionSearch.toLowerCase());
    return cityMatch && searchMatch;
  });

  /**
 * Executes operations logic for handleRegionChange.
 *
 * @param name: string
 * @returns State operations sequence.
 */
const handleRegionChange = (name: string) => {
    onChange({ ...address, region: name, province: "", city: "", barangay: "" });
  };

  /**
 * Executes operations logic for handleProvinceChange.
 *
 * @param name: string
 * @returns State operations sequence.
 */
const handleProvinceChange = (name: string) => {
    onChange({ ...address, province: name, city: "", barangay: "" });
  };

  /**
 * Executes operations logic for handleCityChange.
 *
 * @param name: string
 * @returns State operations sequence.
 */
const handleCityChange = (name: string) => {
    onChange({ ...address, city: name, barangay: "" });
  };

  /**
 * Executes operations logic for handleBarangayChange.
 *
 * @param name: string
 * @returns State operations sequence.
 */
const handleBarangayChange = (name: string) => {
    onChange({ ...address, barangay: name });
  };

  /**
 * Executes operations logic for handleSubdivisionInput.
 *
 * @param val: string
 * @returns State operations sequence.
 */
const handleSubdivisionInput = (val: string) => {
    setSubdivisionSearch(val);
    onChange({ ...address, subdivision: val });
    setShowSubdivisionDropdown(true);
  };

  /**
 * Executes operations logic for selectSubdivision.
 *
 * @param name: string
 * @returns State operations sequence.
 */
const selectSubdivision = (name: string) => {
    setSubdivisionSearch(name);
    onChange({ ...address, subdivision: name });
    setShowSubdivisionDropdown(false);
  };

  /**
 * Executes operations logic for setCurrentLocation.
 *
 * 
 * @returns State operations sequence.
 */
const setCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
        onChange({ ...address, latitude: lat, longitude: lng, map_url: mapUrl });
        setGettingLocation(false);
      },
      (err) => {
        setLocationError("Location access denied. Please enable it in your browser.");
        setGettingLocation(false);
      }
    );
  };

  /**
 * Executes operations logic for handleLatLngChange.
 *
 * @param field: "latitude" | "longitude", val: string
 * @returns State operations sequence.
 */
const handleLatLngChange = (field: "latitude" | "longitude", val: string) => {
    const updated = { ...address, [field]: val };
    if (updated.latitude && updated.longitude) {
      updated.map_url = `https://maps.google.com/?q=${updated.latitude},${updated.longitude}`;
    }
    onChange(updated);
  };

  const addressPreview = [
    address.house_no,
    address.subdivision,
    address.street ? `${address.street} St.` : "",
    address.barangay ? `Brgy. ${address.barangay}` : "",
    address.city,
    address.province,
    address.region,
    address.postal_code,
    "Philippines",
  ].filter(Boolean).join(", ");

  const inputClass = "w-full text-sm text-foreground bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F4C542] transition";
  const selectClass = "w-full text-sm text-foreground bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F4C542] transition appearance-none cursor-pointer";
  const labelClass = "text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1";

  return (
    <div className={styles.div_2}>
      <div className={styles.div_3}>
        <p className={styles.table_4}>📍 Address Information</p>
      </div>

      <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        <div>
          <label className={labelClass}>Region</label>
          <select
            value={address.region}
            onChange={e => handleRegionChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select Region</option>
            {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Province</label>
          <select
            value={address.province}
            onChange={e => handleProvinceChange(e.target.value)}
            disabled={!address.region || provinces.length === 0}
            className={selectClass + (!address.region ? " opacity-50 cursor-not-allowed" : "")}
          >
            <option value="">Select Province</option>
            {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>City / Municipality</label>
          <select
            value={address.city}
            onChange={e => handleCityChange(e.target.value)}
            disabled={!address.province || cities.length === 0}
            className={selectClass + (!address.province ? " opacity-50 cursor-not-allowed" : "")}
          >
            <option value="">Select City / Municipality</option>
            {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Barangay</label>
          <select
            value={address.barangay}
            onChange={e => handleBarangayChange(e.target.value)}
            disabled={!address.city || barangays.length === 0}
            className={selectClass + (!address.city ? " opacity-50 cursor-not-allowed" : "")}
          >
            <option value="">Select Barangay</option>
            {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div ref={subdivisionRef} className={styles.div_5}>
        <label className={labelClass}>Subdivision / Village</label>
        <input
          type="text"
          value={subdivisionSearch}
          onChange={e => handleSubdivisionInput(e.target.value)}
          onFocus={() => setShowSubdivisionDropdown(true)}
          placeholder="Type to search or enter subdivision name…"
          className={inputClass}
          autoComplete="off"
        />
        {showSubdivisionDropdown && filteredSubdivisions.length > 0 && (
          <div className={styles.card_6}>
            {filteredSubdivisions.map(s => (
              <button
                key={s.name}
                type="button"
                onMouseDown={() => selectSubdivision(s.name)}
                className={styles.table_7}
              >
                <span className={styles.text_8}>{s.name}</span>
                <span className={styles.text_9}>{s.city}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        <div>
          <label className={labelClass}>Street</label>
          <input
            type="text"
            value={address.street}
            onChange={e => onChange({ ...address, street: e.target.value })}
            placeholder="Street name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>House / Block / Lot</label>
          <input
            type="text"
            value={address.house_no}
            onChange={e => onChange({ ...address, house_no: e.target.value })}
            placeholder="e.g. Block 12 Lot 8"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Postal Code</label>
        <input
          type="text"
          value={address.postal_code}
          onChange={e => onChange({ ...address, postal_code: e.target.value })}
          placeholder="e.g. 3019"
          maxLength={4}
          className={inputClass + " max-w-[160px]"}
        />
      </div>

      <div className={styles.div_10}>
        <p className={styles.table_11}>📍 Location Coordinates</p>

        <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="text"
              value={address.latitude}
              onChange={e => handleLatLngChange("latitude", e.target.value)}
              placeholder="e.g. 14.75632"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="text"
              value={address.longitude}
              onChange={e => handleLatLngChange("longitude", e.target.value)}
              placeholder="e.g. 120.94812"
              className={inputClass}
            />
          </div>
        </div>

        {address.map_url && (
          <div>
            <label className={labelClass}>Google Maps Link</label>
            <div className={styles.container_12}>
              <input
                type="text"
                value={address.map_url}
                readOnly
                className={inputClass + " bg-muted text-muted-foreground cursor-default flex-1"}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(address.map_url);
                  setCopiedMap(true);
                  setTimeout(() => setCopiedMap(false), 2000);
                }}
                className={styles.table_13}
                title="Copy link"
              >
                {copiedMap ? <Check size={14} className={styles.text_14} /> : <Copy size={14} className={styles.text_15} />}
              </button>
            </div>
          </div>
        )}

        <div className={styles.container_16}>
          <button
            type="button"
            onClick={setCurrentLocation}
            disabled={gettingLocation}
            className={styles.table_17}
          >
            <Navigation size={11} />
            {gettingLocation ? "Getting location…" : "Set Current Location"}
          </button>

          {address.map_url && (
            <a
              href={address.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.table_18}
            >
              <ExternalLink size={11} />
              Open in Maps
            </a>
          )}
        </div>

        {locationError && (
          <p className={styles.text_19}>{locationError}</p>
        )}
      </div>

      {addressPreview.length > 10 && (
        <div className={styles.div_20}>
          <p className={styles.table_21}>Address Preview</p>
          <div className={styles.div_22}>
            <p className={styles.text_23}>{addressPreview}</p>
          </div>
        </div>
      )}
    </div>
  );
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
  const [profileRole, setProfileRole] = useState("Member");
  const [userStatus, setUserStatus] = useState("online");

  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    birthday: "",
    phone: "",
    website: "",
  });

  const [address, setAddress] = useState<AddressForm>({
    region: "",
    province: "",
    city: "",
    barangay: "",
    subdivision: "",
    street: "",
    house_no: "",
    postal_code: "",
    latitude: "",
    longitude: "",
    map_url: "",
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
          setProfileRole(profile?.role || "Member");
          setUserStatus(profile?.status || "online");
          const notesVal = user.user_metadata?.profile_notes || localStorage.getItem(`tp_notes_${user.id}`) || "";
          setAccountNotes(notesVal);

          setForm({
            full_name: profile?.full_name || "",
            bio: profile?.bio || "",
            birthday: profile?.birthday || "",
            phone: profile?.phone || "",
            website: profile?.website || "",
          });

          setAddress({
            region: profile?.region || "",
            province: profile?.province || "",
            city: profile?.city || "",
            barangay: profile?.barangay || "",
            subdivision: profile?.subdivision || "",
            street: profile?.street || "",
            house_no: profile?.house_no || "",
            postal_code: profile?.postal_code || "",
            latitude: profile?.latitude || "",
            longitude: profile?.longitude || "",
            map_url: profile?.map_url || "",
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
      .channel(`profiles-status-user-page-${uniqueId}`)
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

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        bio: form.bio,
        birthday: form.birthday,
        phone: form.phone,
        website: form.website,

        region: address.region,
        province: address.province,
        city: address.city,
        barangay: address.barangay,
        subdivision: address.subdivision,
        street: address.street,
        house_no: address.house_no,
        postal_code: address.postal_code,
        latitude: address.latitude,
        longitude: address.longitude,
        map_url: address.map_url,

        avatar_url: uploadedAvatar,
        gcash_qr: gcashQr,
        avatar_mode: avatarMode,
        ai_seed: aiSeed,
        banner_theme: bgGradient,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select();

    console.log("SAVE PROFILE DATA:", data);
    console.log("SAVE PROFILE ERROR:", error);

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setIsModalOpen(false);
    window.dispatchEvent(new CustomEvent("profile-updated"));
    setTimeout(() => setSaved(false), 3000);

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
      setSocialLinks(prev =>
        prev.map(l => l.id === editingLinkId ? { ...l, url: newLinkUrl.trim(), platform: newLinkPlatform } : l)
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
      if (inserted) setSocialLinks(prev => [...prev, inserted]);
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
    setSocialLinks(prev => prev.filter(l => l.id !== id));
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

  const addressDisplayParts = [
    address.house_no,
    address.subdivision,
    address.street ? `${address.street} St.` : "",
    address.barangay ? `Brgy. ${address.barangay}` : "",
    address.city,
    address.province,
  ].filter(Boolean);
  const addressDisplay = addressDisplayParts.length > 0 ? addressDisplayParts.join(", ") : null;

  const tabs = ["overview", "security", "notifications"];
  const bannerStyle: React.CSSProperties = { background: bgGradient };

  if (profileLoading) {
    return (
      <div className={styles.container_24}>
        <div className={styles.container_25}>
          <div className={styles.container_26}>
            <div className={styles.div_27} />
            <div className={styles.div_28} />
            <div className={styles.table_29} />
            <div className={styles.div_30} />
          </div>
          <p className={styles.table_31}>Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={styles.container_32}>
        <div className={styles.container_33}>
          <p className={styles.text_34}>{profileError}</p>
          <button type="button" onClick={() => window.location.reload()}
            className={styles.table_35}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;



  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
      {/* Top Header Card */}
      <div className="p-4 md:p-8 w-full space-y-6">
        
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight">Profile Settings</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Update your digital details, social platforms, and account configs.</p>
        </div>

        {/* Banner Preset & Card Wrapper */}
        <div className="rounded-3xl overflow-hidden border shadow-lg bg-card" style={{ borderColor: 'var(--border)' }}>
          {/* Banner Container */}
          <div className="relative h-44 sm:h-56 md:h-64 transition-all duration-500" style={bannerStyle}>
            <div className="absolute top-4 right-4">
              <button 
                type="button" 
                onClick={() => setShowBgPanel(!showBgPanel)}
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/20 text-white rounded-full transition cursor-pointer shadow-sm"
              >
                <ImageIcon size={12} /> Theme Banner
              </button>
              {showBgPanel && (
                <div className="absolute right-0 mt-2 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 animate-in fade-in-50 slide-in-from-top-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Banner Preset</span>
                    <button type="button" onClick={() => setShowBgPanel(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_BG_PRESETS.map(preset => (
                      <button 
                        key={preset.id} 
                        type="button"
                        onClick={async () => {
                          const { error } = await supabase.from("profiles").update({
                            banner_theme: preset.style,
                            updated_at: new Date().toISOString(),
                          }).eq("id", user.id);
                          if (!error) {
                            setBgGradient(preset.style);
                            setShowBgPanel(false);
                          }
                        }}
                        className={`flex flex-col gap-1.5 p-1.5 rounded-lg border-2 hover:scale-[1.02] transition cursor-pointer text-left ${
                          bgGradient === preset.style ? 'border-amber-500 bg-amber-500/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950'
                        }`}
                      >
                        <div className="w-full h-10 rounded-md" style={{ background: preset.style }} />
                        <span className="text-[9px] font-bold text-center w-full truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Header Details block - Redesigned to match Admin Profile Layout (centered & overlapping) */}
          <div className="relative z-10 flex flex-col items-center text-center px-8 pb-8 pt-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <div className="relative shrink-0 -mt-20 sm:-mt-28 z-20">
              <div className="border-4 border-white dark:border-slate-900 rounded-full shadow-xl bg-background transition-transform duration-300 hover:scale-105 w-28 h-28 group overflow-hidden">
                <ProfileAvatar avatarUrl={uploadedAvatar} name={displayName} size={112} className="w-full h-full object-cover rounded-full" />
                <button
                  type="button"
                  onClick={() => setShowAvatarPanel(!showAvatarPanel)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-extrabold uppercase tracking-widest transition-opacity cursor-pointer duration-200 z-30"
                >
                  <Camera size={20} className="mb-1" />
                  Change Photo
                </button>
              </div>
              {showAvatarPanel && (
                <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 z-[60] w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 space-y-1 text-left">
                  <div className="flex justify-between items-center px-1 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Change Avatar</span>
                    <button type="button" onClick={() => setShowAvatarPanel(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition">
                      <X size={12} />
                    </button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => avatarFileRef.current?.click()} 
                    disabled={uploading}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition"
                  >
                    <Upload size={14} className="text-amber-500 shrink-0" />
                    <div>
                      <p>{uploading ? "Uploading..." : "Upload Photo"}</p>
                      <p className="text-[8px] opacity-60">JPG or PNG</p>
                    </div>
                  </button>
                  <button 
                    type="button" 
                    onClick={regenerateAi}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer transition"
                  >
                    <Sparkles size={14} className="text-amber-500 animate-pulse shrink-0" />
                    <div>
                      <p>AI Avatar</p>
                      <p className="text-[8px] opacity-60">Generate abstract</p>
                    </div>
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
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
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer transition"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold shrink-0">AB</span>
                    <div>
                      <p>Use Initials</p>
                      <p className="text-[8px] opacity-60">Letters from name</p>
                    </div>
                  </button>
                  {uploadError && <p className="text-[10px] text-red-500 text-center font-bold">{uploadError}</p>}
                  <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-col items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {displayName}
              </h2>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">{profileRole}</p>
              <div className="py-1">
                <UserStatusBadge status={userStatus as any} />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{user.email}</p>
            </div>
          </div>

          {/* Profile Action Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1.5 md:pb-0 px-6 md:px-8 pt-4">
              {tabs.map(tab => (
                <button 
                  key={tab} 
                  type="button" 
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

          {/* TAB CONTENTS CONTAINER */}
          <div style={{ backgroundColor: 'var(--surface)' }}>
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8">
                
                {/* Left Column: Personal Info & Credentials */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Info Card */}
                  <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Personal Info</h3>
                      <button 
                        type="button" 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all hover:opacity-90 cursor-pointer"
                      >
                        <Pencil size={10} /> Edit Profile
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: form.full_name, icon: User },
                        { label: "Phone", value: form.phone, icon: Phone },
                        { label: "Website", value: form.website, icon: Globe },
                        { label: "Birthday", value: form.birthday, icon: Cake },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex gap-3 p-3.5 rounded-xl border bg-card" style={{ borderColor: 'var(--border)' }}>
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                              {value || <span className="text-slate-400 font-normal italic">Not set</span>}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-3 p-3.5 rounded-xl border bg-card md:col-span-2" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                          <MapPin size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Address</p>
                          {addressDisplay ? (
                            <div className="mt-0.5">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{addressDisplay}</p>
                              {address.map_url && (
                                <a 
                                  href={address.map_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-500 hover:text-amber-600 font-extrabold uppercase tracking-wider"
                                >
                                  <ExternalLink size={9} /> View on Map
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-0.5">Not set</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 p-3.5 rounded-xl border bg-card md:col-span-2" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                          <FileText size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bio</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">
                            {form.bio || <span className="text-slate-400 font-normal italic">Not set</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Credentials Card */}
                  <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                      <Shield size={16} className="text-amber-500" /> Account Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border bg-card" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{user.email}</p>
                        <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Verified
                        </span>
                      </div>
                      <div className="p-4 rounded-xl border bg-card" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Auth Provider</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 capitalize truncate">{provider}</p>
                      </div>
                      <div className="p-4 rounded-xl border bg-card" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{joinedDate}</p>
                      </div>
                      <div className="p-4 rounded-xl border bg-card flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Workspace Account ID</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">{user.id}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={copyId}
                          className="mt-2 text-left self-start text-[9px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {copied ? "✓ Copied ID" : "Copy Account ID"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Social Links, QR Code, Session Info */}
                <div className="space-y-6">
                  
                  {/* Third Party Links Card */}
                  <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <ExternalLink size={16} className="text-amber-500" /> Web Links
                      </h3>
                      <button 
                        type="button" 
                        onClick={openAddLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all hover:opacity-90 cursor-pointer"
                      >
                        <Plus size={10} /> Add Link
                      </button>
                    </div>

                    {socialLinks.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-xl" style={{ borderColor: 'var(--border)' }}>
                        <ExternalLink size={24} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">No web links added yet</p>
                        <button 
                          type="button" 
                          onClick={openAddLink}
                          className="mt-2 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          Add first link
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {socialLinks.map(link => (
                          <div 
                            key={link.id} 
                            className="flex items-center justify-between p-3 rounded-xl border bg-card group relative" 
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <PlatformBadge platform={link.platform} size={28} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wide">{PLATFORM_META[link.platform]?.label || "Website"}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 max-w-[120px] sm:max-w-[180px]">{link.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                              >
                                <ExternalLink size={12} />
                              </a>
                              <button 
                                type="button" 
                                onClick={() => openEditLink(link)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 cursor-pointer"
                              >
                                <Pencil size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => deleteLink(link.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GCash QR Card */}
                  <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <QrCode size={16} className="text-amber-500" /> GCash QR
                      </h3>
                      {gcashQr && (
                        <button 
                          type="button" 
                          onClick={removeGcashQr}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {gcashQr ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-2 border bg-white rounded-xl shadow-inner max-w-[160px]">
                          <img src={gcashQr} alt="GCash QR" className="w-full object-contain rounded-lg" />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => gcashFileRef.current?.click()}
                          className="w-full py-2.5 rounded-xl border font-bold text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-center"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Upload size={12} className="inline mr-1" /> Replace QR Code
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-xl" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mx-auto flex items-center justify-center mb-3">
                          <QrCode size={20} />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => gcashFileRef.current?.click()} 
                          disabled={gcashUploading}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                        >
                          <Upload size={12} className="inline mr-1" /> {gcashUploading ? "Uploading..." : "Upload QR"}
                        </button>
                        <p className="text-[9px] text-slate-400 font-semibold max-w-[200px] mx-auto mt-2 leading-relaxed">
                          Provide GCash QR so teammates can scan and send details.
                        </p>
                      </div>
                    )}
                    {gcashError && <p className="text-[10px] text-red-500 text-center font-bold mt-2">{gcashError}</p>}
                    <input ref={gcashFileRef} type="file" accept="image/*" className="hidden" onChange={handleGcashSelect} />
                  </div>

                  {/* Session Details Card */}
                  <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">Session Info</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-slate-400 font-semibold">Last Log In</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{lastSignIn}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-semibold">Platform Access</span>
                        <span className="font-extrabold text-amber-500 uppercase tracking-widest">{user.role || "intern"}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="p-6 md:p-8 space-y-6">
                
                {/* Two-factor authentication Toggle Card */}
                <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm">Two-Factor Authentication</h3>
                      <p className="text-xs opacity-75 mt-1">Configure an additional authentication shield for your workspace profile.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                        twoFactor ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        twoFactor ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Secure Credentials Vault Notes */}
                <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20 space-y-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Secure Credentials Vault</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Maintain personal credentials or keys securely in the cloud.</p>
                    </div>
                  </div>
                  <textarea
                    value={accountNotes}
                    onChange={(e) => setAccountNotes(e.target.value)}
                    placeholder="Write emails, passwords, notes or details here securely..."
                    rows={6}
                    className="w-full text-sm font-mono bg-card border border-border rounded-xl p-4 focus:outline-none focus:border-amber-500 outline-none transition-all"
                  />
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={saveAccountNotes}
                      disabled={isSavingNotes}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer"
                    >
                      {isSavingNotes ? "Saving Vault..." : "Save Secure Notes"}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="p-6 md:p-8 space-y-4">
                <div className="rounded-2xl p-6 border bg-slate-50/50 dark:bg-slate-950/20" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                    <Bell size={16} className="text-amber-500" /> Notifications Settings
                  </h3>
                  <div className="space-y-4">
                    {[
                      { 
                        label: "Email Notifications", 
                        desc: "Receive ledger updates, action alerts and automated team summaries.", 
                        state: notifEmail, 
                        toggle: () => setNotifEmail(!notifEmail) 
                      },
                      { 
                        label: "Push Notifications", 
                        desc: "Receive instant real-time browser prompts and active message alerts.", 
                        state: notifPush, 
                        toggle: () => setNotifPush(!notifPush) 
                      },
                    ].map(item => (
                      <div 
                        key={item.label} 
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-card" 
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div>
                          <h4 className="font-bold text-sm">{item.label}</h4>
                          <p className="text-xs opacity-75 mt-0.5">{item.desc}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={item.toggle}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                            item.state ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.state ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODALS */}
      
      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in-30">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold">Edit Personal Info</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Update details visible on your profile.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
              {[
                { label: "Full Name", key: "full_name", placeholder: "Your full name" },
                { label: "Phone", key: "phone", placeholder: "+63 9XX XXX XXXX" },
                { label: "Website", key: "website", placeholder: "https://yoursite.com" },
                { label: "Birthday", key: "birthday", placeholder: "YYYY-MM-DD", type: "date" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{label}</label>
                  <input 
                    type={type || "text"} 
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-amber-500 text-sm"
                    style={{ borderColor: 'var(--border)' }} 
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Bio</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="A short bio about yourself..." 
                  rows={3}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-amber-500 text-sm"
                  style={{ borderColor: 'var(--border)' }} 
                />
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <AddressSection address={address} onChange={setAddress} compact />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={saveProfile} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Social Link Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in-30">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
            <button 
              type="button" 
              onClick={() => setShowLinkForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold">{editingLinkId ? "Edit Web Link" : "Add Web Link"}</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Link a personal portfolio or web channel.</p>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">URL</label>
                <input 
                  type="url" 
                  value={newLinkUrl} 
                  onChange={e => handleLinkUrlChange(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-amber-500 text-sm"
                  style={{ borderColor: 'var(--border)' }} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Platform</label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border rounded-xl" style={{ borderColor: 'var(--border)' }}>
                  {PLATFORM_OPTIONS.map(p => (
                    <button 
                      key={p.id} 
                      type="button" 
                      onClick={() => setNewLinkPlatform(p.id)}
                      title={p.label}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition gap-1 cursor-pointer ${
                        newLinkPlatform === p.id
                          ? "border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                          : "border-border bg-slate-50 dark:bg-slate-950 hover:border-amber-500/30"
                      }`}
                    >
                      <PlatformBadge platform={p.id} size={20} />
                      <span className="text-[9px] font-bold truncate w-full">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {newLinkUrl && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-slate-50 dark:bg-slate-950" style={{ borderColor: 'var(--border)' }}>
                  <PlatformBadge platform={newLinkPlatform} size={28} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide">{PLATFORM_META[newLinkPlatform]?.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">{newLinkUrl}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
              <button 
                type="button" 
                onClick={() => setShowLinkForm(false)}
                className="px-5 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={saveLink} 
                disabled={savingLinks || !newLinkUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                {savingLinks ? "Saving..." : editingLinkId ? "Update Link" : "Add Link"}
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

