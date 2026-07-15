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

  const [bgGradient, setBgGradient] = useState(AI_BG_PRESETS[0].style);
  const [showBgPanel, setShowBgPanel] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: storageError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (storageError) throw storageError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      await /* Query database records from active repository grid */ supabase.from("profiles").update({
        avatar_url: publicUrl,
        avatar_mode: "upload",
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      setUploadedAvatar(publicUrl);
      setAvatarMode("upload");
      setShowAvatarPanel(false);
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
      const ext = file.name.split(".").pop();
      const path = `gcash-qr/${user.id}.${ext}`;
      const { error: storageError } = await supabase.storage.from("gcash-qr").upload(path, file, { upsert: true });
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
    const newSeed = user?.id + Date.now().toString();
    const { error } = await /* Query database records from active repository grid */ supabase.from("profiles").update({
      ai_seed: newSeed,
      avatar_mode: "ai",
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) {
      setAiSeed(newSeed);
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
    <div className={styles.text_38}>
      <div className={styles.div_39}>
        <h2 className={styles.text_40}>Profile Settings</h2>
        <p className={styles.table_41}>Update information and preferences</p>
      </div>

      <div className={styles.card_42}>
        <div className={styles.div_43} style={bannerStyle}>
          <div className={styles.div_44}>
            <button type="button" onClick={() => setShowBgPanel(!showBgPanel)}
              className={styles.table_45}>
              <ImageIcon className={styles.div_46} /> Theme Banner
            </button>
            {showBgPanel && (
              <div className={styles.card_47}>
                <div className={styles.container_48}>
                  <p className={styles.table_49}>Select Theme Banner</p>
                  <button type="button" onClick={() => setShowBgPanel(false)}>
                    <X className={styles.text_50} />
                  </button>
                </div>
                <div className={styles.container_51}>
                  {AI_BG_PRESETS.map(preset => (
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
                      className={`${styles.container_52} group`}>
                      <div className={`${styles.table_53} group`}
                        style={{ background: preset.style }} />
                      <span className={styles.table_54}>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card_55}>
          <div className={styles.container_56}>
            <div className={styles.div_57}>
               <ProfileAvatar avatarUrl={uploadedAvatar} name={displayName} size={96} className={styles.div_36} />
              <button type="button" onClick={() => setShowAvatarPanel(!showAvatarPanel)}
                className={styles.table_58}>
                <Camera className={styles.text_59} />
              </button>
              {showAvatarPanel && (
                <div className={styles.card_60}>
                  <div className={styles.container_61}>
                    <p className={styles.table_62}>Change Avatar</p>
                    <button type="button" onClick={() => setShowAvatarPanel(false)}>
                      <X className={styles.text_63} />
                    </button>
                  </div>
                  <button type="button" onClick={() => avatarFileRef.current?.click()} disabled={uploading}
                    className={styles.table_64}>
                    <Upload className={styles.text_65} />
                    <div>
                      <p className={styles.table_66}>{uploading ? "Uploading..." : "Upload Photo"}</p>
                      <p className={styles.table_67}>JPG or PNG</p>
                    </div>
                  </button>
                  <button type="button" onClick={regenerateAi}
                    className={styles.table_68}>
                    <Sparkles className={styles.text_69} />
                    <div>
                      <p className={styles.table_70}>AI Avatar</p>
                      <p className={styles.table_71}>Generate Unique</p>
                    </div>
                  </button>
                  <button type="button" onClick={async () => {
                    const { error } = await /* Query database records from active repository grid */ supabase.from("profiles").update({
                      avatar_mode: "initials",
                      updated_at: new Date().toISOString(),
                    }).eq("id", user.id);
                    if (!error) {
                      setAvatarMode("initials");
                      window.dispatchEvent(new CustomEvent("profile-updated"));
                    }
                    setShowAvatarPanel(false);
                  }}
                    className={styles.table_72}>
                    <div className={styles.container_73}>
                      <span className={styles.text_74}>AB</span>
                    </div>
                    <div>
                      <p className={styles.table_75}>Use Initials</p>
                      <p className={styles.table_76}>Name letters</p>
                    </div>
                  </button>
                  {uploadError && <p className={styles.text_77}>{uploadError}</p>}
                  <input ref={avatarFileRef} type="file" accept="image/*" className={styles.div_78} onChange={handleAvatarSelect} />
                </div>
              )}
            </div>
            <div className={styles.div_79}>
              <h1 className={styles.text_80}>{displayName}</h1>
              <p className={styles.table_81}>{user.email}</p>
            </div>
          </div>

          <div className={styles.container_82}>
            {tabs.map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`${styles.table_221} ${activeTab === tab
                  ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className={styles.container_83}>
              <div className={styles.div_84}>

                <div className={styles.card_85}>
                  <div className={styles.container_86}>
                    <h2 className={styles.text_87}>Personal Info</h2>
                    <button type="button" onClick={() => setIsModalOpen(true)}
                      className={styles.table_88}>
                      <Pencil size={11} /> Edit Profile
                    </button>
                  </div>
                  <div className={styles.div_89}>
                    {[
                      { label: "Full Name", value: form.full_name, icon: User },
                      { label: "Phone", value: form.phone, icon: Phone },
                      { label: "Website", value: form.website, icon: Globe },
                      { label: "Birthday", value: form.birthday, icon: Cake },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className={styles.container_90}>
                        <div className={styles.container_91}>
                          <Icon size={12} className={styles.text_92} />
                        </div>
                        <div className={styles.container_93}>
                          <p className={styles.table_94}>{label}</p>
                          <p className={styles.table_95}>
                            {value || <span className={styles.text_96}>Not set</span>}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className={styles.container_97}>
                      <div className={styles.container_98}>
                        <MapPin size={12} className={styles.text_99} />
                      </div>
                      <div className={styles.container_100}>
                        <p className={styles.table_101}>Address</p>
                        {addressDisplay ? (
                          <div>
                            <p className={styles.text_102}>{addressDisplay}</p>
                            {address.map_url && (
                              <a href={address.map_url} target="_blank" rel="noopener noreferrer"
                                className={styles.table_103}>
                                <ExternalLink size={9} /> View on Map
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className={styles.text_104}>Not set</p>
                        )}
                      </div>
                    </div>

                    <div className={styles.container_105}>
                      <div className={styles.container_106}>
                        <FileText size={12} className={styles.text_107} />
                      </div>
                      <div className={styles.container_108}>
                        <p className={styles.table_109}>Bio</p>
                        <p className={styles.text_110}>
                          {form.bio || <span className={styles.text_111}>Not set</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.card_112}>
                  <h2 className={styles.text_113}>
                    <Shield className={styles.text_114} /> Account Credentials
                  </h2>
                  <div className={styles.div_115}>
                    <div className={styles.container_116}>
                      <div>
                        <p className={styles.table_117}>Email Address</p>
                        <p className={styles.text_118}>{user.email}</p>
                      </div>
                      <span className={styles.table_119}>
                        Verified
                      </span>
                    </div>
                    <div className={styles.container_120}>
                      <div>
                        <p className={styles.table_121}>Auth Provider</p>
                        <p className={styles.text_122}>{provider}</p>
                      </div>
                    </div>
                    <div className={styles.container_123}>
                      <div>
                        <p className={styles.table_124}>Member Since</p>
                        <p className={styles.text_125}>{joinedDate}</p>
                      </div>
                    </div>
                    <div className={styles.container_126}>
                      <div className={styles.div_127}>
                        <p className={styles.table_128}>Workspace Account ID</p>
                        <p className={styles.table_129}>{user.id}</p>
                      </div>
                      <button type="button" onClick={copyId}
                        className={styles.table_130}>
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.card_131}>
                  <div className={styles.container_132}>
                    <h2 className={styles.text_133}>
                      <ExternalLink className={styles.text_134} /> Third Party Links
                    </h2>
                    <button type="button" onClick={openAddLink}
                      className={styles.table_135}>
                      <Plus size={11} /> Add Link
                    </button>
                  </div>
                  {socialLinks.length === 0 ? (
                    <div className={styles.container_136}>
                      <ExternalLink className={styles.text_137} />
                      <p className={styles.table_138}>No links added yet</p>
                      <button type="button" onClick={openAddLink}
                        className={styles.text_139}>
                        Add your first link
                      </button>
                    </div>
                  ) : (
                    <div className={styles.div_140}>
                      {socialLinks.map(link => (
                        <div key={link.id} className={`${styles.container_141} group`}>
                          <PlatformBadge platform={link.platform} size={30} />
                          <div className={styles.container_142}>
                            <p className={styles.table_143}>
                              {PLATFORM_META[link.platform]?.label || "Website"}
                            </p>
                            <p className={styles.table_144}>{link.url}</p>
                          </div>
                          <div className={`${styles.table_145} group`}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                              className={styles.card_146}>
                              <ExternalLink size={10} className={styles.text_147} />
                            </a>
                            <button type="button" onClick={() => openEditLink(link)}
                              className={styles.card_148}>
                              <Pencil size={10} className={styles.text_149} />
                            </button>
                            <button type="button" onClick={() => deleteLink(link.id)}
                              className={styles.card_150}>
                              <Trash2 size={10} className={styles.text_151} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.div_152}>
                <div className={styles.card_153}>
                  <div className={styles.container_154}>
                    <h3 className={styles.table_155}>
                      <QrCode size={12} className={styles.text_156} /> GCash QR Code
                    </h3>
                    {gcashQr && (
                      <button type="button" onClick={removeGcashQr}
                        className={styles.table_157}>
                        Remove
                      </button>
                    )}
                  </div>
                  {gcashQr ? (
                    <div className={styles.container_158}>
                      <div className={styles.div_159}>
                        <img src={gcashQr} alt="GCash QR" className={styles.div_160} />
                      </div>
                      <button type="button" onClick={() => gcashFileRef.current?.click()}
                        className={styles.table_161}>
                        <Upload size={10} /> Replace QR
                      </button>
                    </div>
                  ) : (
                    <div className={styles.container_162}>
                      <div className={styles.container_163}>
                        <QrCode className={styles.text_164} />
                      </div>
                      <button type="button" onClick={() => gcashFileRef.current?.click()} disabled={gcashUploading}
                        className={styles.table_165}>
                        <Upload size={10} /> {gcashUploading ? "Uploading..." : "Upload QR"}
                      </button>
                      <p className={styles.text_166}>
                        Upload your GCash QR so teammates can send payments
                      </p>
                    </div>
                  )}
                  {gcashError && <p className={styles.text_167}>{gcashError}</p>}
                  <input ref={gcashFileRef} type="file" accept="image/*" className={styles.div_168} onChange={handleGcashSelect} />
                </div>

                <div className={styles.card_169}>
                  <h2 className={styles.table_170}>Session Details</h2>
                  <div className={styles.text_171}>
                    <div className={styles.div_172}>
                      <p className={styles.table_173}>Last Login</p>
                      <p className={styles.text_174}>{lastSignIn}</p>
                    </div>
                    <div className={styles.div_175}>
                      <p className={styles.table_176}>Current Role</p>
                      <p className={styles.table_177}>{user.role || "intern"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className={styles.card_178}>
                <h2 className={styles.text_179}>
                  <Lock className={styles.text_180} /> Security Credentials
                </h2>
                <div className={styles.container_181}>
                  <div>
                    <p className={styles.table_182}>Two-factor authentication</p>
                    <p className={styles.table_183}>Add an extra layer of security to your account</p>
                  </div>
                  <button type="button" onClick={() => setTwoFactor(!twoFactor)}
                    className={`${styles.table_222} ${twoFactor ? "bg-[#F4C542]" : "bg-muted border border-border"}`}>
                    <span className={`${styles.table_223} ${twoFactor ? "left-5" : "left-1"}`} />
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
            <div className={styles.card_184}>
              <h2 className={styles.text_185}>
                <Bell className={styles.text_186} /> Notification Preferences
              </h2>
              <div className={styles.div_187}>
                {[
                  { label: "Email Notifications", desc: "Receive automated team ledger updates and summaries", state: notifEmail, toggle: () => setNotifEmail(!notifEmail) },
                  { label: "Push Notifications", desc: "Receive instant browser announcements and message alerts", state: notifPush, toggle: () => setNotifPush(!notifPush) },
                ].map(item => (
                  <div key={item.label} className={styles.container_188}>
                    <div>
                      <p className={styles.table_189}>{item.label}</p>
                      <p className={styles.table_190}>{item.desc}</p>
                    </div>
                    <button type="button" onClick={item.toggle}
                      className={`${styles.table_224} ${item.state ? "bg-[#F4C542]" : "bg-muted border border-border"}`}>
                      <span className={`${styles.table_225} ${item.state ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.container_191}>
          <div className={styles.card_192}>
            <button type="button" onClick={() => setIsModalOpen(false)}
              className={styles.table_193}>
              <X size={16} />
            </button>
            <h3 className={styles.text_194}>Edit Personal Info</h3>
            <div className={styles.div_195}>
              {[
                { label: "Full Name", key: "full_name", placeholder: "Your full name" },
                { label: "Phone", key: "phone", placeholder: "+63 9XX XXX XXXX" },
                { label: "Website", key: "website", placeholder: "https://yoursite.com" },
                { label: "Birthday", key: "birthday", placeholder: "YYYY-MM-DD", type: "date" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className={styles.table_196}>{label}</label>
                  <input type={type || "text"} value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={styles.card_197} />
                </div>
              ))}
              <div>
                <label className={styles.table_198}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="A short bio about yourself…" rows={3}
                  className={styles.card_199} />
              </div>

              <div className={styles.div_200}>
                <AddressSection address={address} onChange={setAddress} compact />
              </div>
            </div>
            <div className={styles.container_201}>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className={styles.table_202}>
                Cancel
              </button>
              <button type="button" onClick={saveProfile} disabled={saving}
                className={styles.table_203}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkForm && (
        <div className={styles.container_204}>
          <div className={styles.card_205}>
            <button type="button" onClick={() => setShowLinkForm(false)}
              className={styles.table_206}>
              <X size={16} />
            </button>
            <h3 className={styles.text_207}>
              {editingLinkId ? "Edit Link" : "Add New Link"}
            </h3>
            <div className={styles.div_208}>
              <div>
                <label className={styles.table_209}>URL</label>
                <input type="url" value={newLinkUrl} onChange={e => handleLinkUrlChange(e.target.value)}
                  placeholder="https://facebook.com/yourprofile"
                  className={styles.card_210} />
              </div>
              <div>
                <label className={styles.table_211}>Platform</label>
                <div className={styles.container_212}>
                  {PLATFORM_OPTIONS.map(p => (
                    <button key={p.id} type="button" onClick={() => setNewLinkPlatform(p.id)}
                      title={p.label}
                      className={`${styles.table_226} ${newLinkPlatform === p.id
                        ? "border-[#F4C542] bg-[#FFF7D6] dark:bg-[#2E2818]"
                        : "border-border bg-muted hover:border-[#F4C542]/50"
                        }`}>
                      <PlatformBadge platform={p.id} size={22} />
                      <span className={styles.table_213}>{p.label.slice(0, 4)}</span>
                    </button>
                  ))}
                </div>
              </div>
              {newLinkUrl && (
                <div className={styles.container_214}>
                  <PlatformBadge platform={newLinkPlatform} size={28} />
                  <div className={styles.container_215}>
                    <p className={styles.table_216}>
                      {PLATFORM_META[newLinkPlatform]?.label}
                    </p>
                    <p className={styles.table_217}>{newLinkUrl}</p>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.container_218}>
              <button type="button" onClick={() => setShowLinkForm(false)}
                className={styles.table_219}>
                Cancel
              </button>
              <button type="button" onClick={saveLink} disabled={savingLinks || !newLinkUrl.trim()}
                className={styles.table_220}>
                {savingLinks ? "Saving…" : editingLinkId ? "Update Link" : "Add Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
