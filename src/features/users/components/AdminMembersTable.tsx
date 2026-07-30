'use client';

/**
 * AdminMembersTable.tsx
 *
 * Main component module in features path: app/(admin)/admin/members/AdminMembersTable/AdminMembersTable.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/styles/admin/members/AdminMembersTable/AdminMembersTable.module.css";
import { Search, X, Shield, ExternalLink, RotateCcw, Check, CheckSquare, Square, AlertTriangle, Info, ChevronDown, Briefcase, FileText, Camera, Upload, Eye } from "lucide-react";
import ProfileAvatar from "@src/components/shared/ProfileAvatar";
import { supabase } from "@src/lib/supabase/client";

export type ClientServicingModule = "cpst" | "acr" | "fst" | "cpc" | "ppu" | "mngt" | "csmv" | "bcr" | "aca" | "sro" | "pdi" | "form" | "fw" | "ada" | "acicr";

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export type ClientServicingPermissions = Record<ClientServicingModule, ModulePermissions>;

export const defaultModulePermissions: ModulePermissions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
};

export const defaultClientServicingPermissions: ClientServicingPermissions = {
  cpst: { ...defaultModulePermissions },
  acr: { ...defaultModulePermissions },
  fst: { ...defaultModulePermissions },
  cpc: { ...defaultModulePermissions },
  ppu: { ...defaultModulePermissions },
  mngt: { ...defaultModulePermissions },
  csmv: { ...defaultModulePermissions },
  bcr: { ...defaultModulePermissions },
  aca: { ...defaultModulePermissions },
  sro: { ...defaultModulePermissions },
  pdi: { ...defaultModulePermissions },
  form: { ...defaultModulePermissions },
  fw: { ...defaultModulePermissions },
  ada: { ...defaultModulePermissions },
  acicr: { ...defaultModulePermissions },
};

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  status: string;
  joined: string;
  lastActive: string;
  phone: string;
  provider: string;
  presence_status?: string;
  team?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  address?: string;
  client_servicing_permissions?: ClientServicingPermissions;
}

interface OptionItem {
  label: string;
  value: string;
}

interface RoundedSelectProps {
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function RoundedSelect({ label, value, options, onChange, placeholder = "Search..." }: RoundedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 min-w-[170px] relative" ref={dropdownRef}>
      <label className="text-[10.5px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-wider uppercase pl-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200/90 dark:border-zinc-700/80 rounded-full px-4 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-100 transition shadow-2xs h-9.5 cursor-pointer w-full text-left"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[220px] bg-white dark:bg-[#16181d] border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative mb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 focus:border-[#F4C542] focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 font-medium"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-slate-400 text-center font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542]"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={13} className="text-[#8a6b10] dark:text-[#F4C542] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TableSelectProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function TableSelect({ value, options, onChange, placeholder = "None" }: TableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || { label: placeholder, value: "" };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition shadow-2xs h-8.5 cursor-pointer min-w-[95px]"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[120px] bg-white dark:bg-[#16181d] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542]"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={12} className="text-[#8a6b10] dark:text-[#F4C542] shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMembersTable({ initialUsers = [], currentUserRole = "" }: { initialUsers?: User[]; currentUserRole?: string }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<ClientServicingPermissions>(defaultClientServicingPermissions);
  
  // Custom Modal States
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isVerifying: boolean } | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; isError?: boolean } | null>(null);

  // ── Avatar Upload State (NEW — purely additive) ──────────────────────────
  const [avatarUploadUser, setAvatarUploadUser] = useState<User | null>(null);
  const [avatarFileToUpload, setAvatarFileToUpload] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2>(1);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // ── Avatar Preview Modal (click avatar to view) ──────────────────────────
  const [avatarPreviewModalUser, setAvatarPreviewModalUser] = useState<User | null>(null);

  // ── Inline Toast ─────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'loading' | 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'loading' | 'success' | 'error', duration = 3500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    if (type !== 'loading') {
      toastTimerRef.current = setTimeout(() => setToast(null), duration);
    }
  };
  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  useEffect(() => {
    const uniqueId = Math.random().toString(36).slice(2, 9);
    const channel = supabase
      .channel(`profiles-status-table-sync-${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          if (updatedProfile && updatedProfile.id) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === updatedProfile.id
                  ? {
                    ...u,
                    presence_status: updatedProfile.status || "offline",
                    avatar: updatedProfile.avatar_url || u.avatar,
                    name: updatedProfile.full_name || u.name,
                    role: updatedProfile.role || u.role,
                    department: updatedProfile.department ?? u.department,
                    status: updatedProfile.status || u.status,
                    client_servicing_permissions:
                      updatedProfile.client_servicing_permissions ?? u.client_servicing_permissions,
                  }
                  : u
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const roles = ["Admin", "Advisor", "Bizdev", "Member"];
  const departments = ["ASA", "BSA", "CRA", "DCA"];

  const hasActiveFilters = search !== "" || roleFilter !== "All" || deptFilter !== "All" || statusFilter !== "All";

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setDeptFilter("All");
    setStatusFilter("All");
  };

  const handleVerifyAllEmails = () => {
    setConfirmModal({
      isOpen: true,
      title: "Verify All Pending Emails",
      message: "Are you sure you want to verify emails and activate ALL pending members?",
      isVerifying: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isVerifying: true } : null);
        try {
          const res = await fetch("/api/admin/members/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verifyAll: true })
          });
          if (res.ok) {
            setConfirmModal(null);
            setAlertModal({
              isOpen: true,
              title: "Success",
              message: "All pending emails have been verified. The table will reload to reflect changes.",
            });
            setTimeout(() => window.location.reload(), 2000);
          } else {
            const err = await res.json();
            setConfirmModal(null);
            setAlertModal({ isOpen: true, title: "Error", message: err.error, isError: true });
          }
        } catch (err) {
          console.error(err);
          setConfirmModal(null);
          setAlertModal({ isOpen: true, title: "Error", message: "An unexpected error occurred.", isError: true });
        }
      }
    });
  };

  const handleVerifyEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Verify Member Email",
      message: "Are you sure you want to verify the email and activate this specific member?",
      isVerifying: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isVerifying: true } : null);
        try {
          const res = await fetch("/api/admin/members/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
          });
          if (res.ok) {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "Active", presence_status: "Online" } : u));
            setConfirmModal(null);
            setAlertModal({ isOpen: true, title: "Success", message: "Email verified successfully." });
          } else {
            const err = await res.json();
            setConfirmModal(null);
            setAlertModal({ isOpen: true, title: "Error", message: err.error, isError: true });
          }
        } catch (err) {
          console.error(err);
          setConfirmModal(null);
          setAlertModal({ isOpen: true, title: "Error", message: "An unexpected error occurred.", isError: true });
        }
      }
    });
  };

  const saveUser = async (user: User) => {
    const res = await fetch("/api/admin/members/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: user.id,
        full_name: user.name,
        employee_id: user.employeeId,
        role: user.role,
        department: user.department,
        team: user.team || "",
        phone: user.phone,
        status: user.status,
        birthday: user.birthday?.trim() ? user.birthday : null,
        address: user.address || "",
        client_servicing_permissions: user.client_servicing_permissions
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("API Error:", data);
      throw new Error(data.error ?? "Unable to save");
    }

    return data;
  };

  const handleUpdateUser = async (id: string, key: keyof User, value: any) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    const updatedUser = {
      ...targetUser,
      [key]: value
    };

    setUsers(prev =>
      prev.map(u => u.id === id ? updatedUser : u)
    );

    try {
      await saveUser(updatedUser);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save assignment changes.");
      setUsers(prev =>
        prev.map(u => u.id === id ? targetUser : u)
      );
    }
  };

  const openModal = (user: User) => {
    setSelectedUser(user);
    const mergedPermissions = { ...defaultClientServicingPermissions };
    if (user.client_servicing_permissions) {
      (Object.keys(user.client_servicing_permissions) as ClientServicingModule[]).forEach((mod) => {
        mergedPermissions[mod] = { ...defaultModulePermissions, ...user.client_servicing_permissions![mod] };
      });
    }
    setTempPermissions(mergedPermissions);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    const updatedUser = {
      ...selectedUser,
      client_servicing_permissions: tempPermissions
    };

    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
    closeModal();

    try {
      await saveUser(updatedUser);
      setAlertModal({
        isOpen: true,
        title: "Permissions Saved",
        message: `Access permissions for ${selectedUser.name} have been updated successfully.`,
      });
    } catch (error) {
      console.error(error);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
      setAlertModal({
        isOpen: true,
        title: "Save Failed",
        message: error instanceof Error ? error.message : "Failed to save permissions. Please try again.",
        isError: true,
      });
    }
  };

  // ── Avatar Upload Handlers (NEW — purely additive) ─────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Only JPG, JPEG, PNG, and WebP are supported.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Image must be less than 5MB.', 'error');
      return;
    }
    setAvatarFileToUpload(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const confirmAvatarUpload = async () => {
    if (!avatarFileToUpload || !avatarUploadUser) return;
    setUploadingAvatar(true);
    showToast('Uploading profile picture...', 'loading');
    try {
      const fileExt = avatarFileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg';
      // Use the existing 'avatars' bucket — same as the user/admin profile pages
      // Path: avatars/{memberId}.{ext}  with upsert:true so re-uploads overwrite cleanly
      const path = `avatars/${avatarUploadUser.id}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFileToUpload, {
          upsert: true,
          contentType: avatarFileToUpload.type,
          cacheControl: '3600',
        });
      if (storageError) throw storageError;

      // Append cache-buster so the browser fetches the fresh image
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', avatarUploadUser.id);
      if (dbError) throw dbError;

      // Optimistic local refresh — no full page reload needed
      setUsers(prev => prev.map(u => u.id === avatarUploadUser.id ? { ...u, avatar: publicUrl } : u));

      // Close upload modal, clear state, show success toast
      setAvatarUploadUser(null);
      setAvatarFileToUpload(null);
      setAvatarPreviewUrl(null);
      showToast('Profile picture updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload profile picture.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleSection = (moduleIds: ClientServicingModule[]) => {
    setTempPermissions(prev => {
      const allEnabled = moduleIds.every(id => prev[id].view);
      const nextVal = !allEnabled;
      
      const newPermissions = { ...prev };
      moduleIds.forEach(id => {
        newPermissions[id] = {
          view: nextVal,
          create: nextVal,
          edit: nextVal,
          delete: nextVal,
          export: nextVal
        };
      });
      
      return newPermissions;
    });
  };

  const clientServicingModules: ClientServicingModule[] = ["mngt", "cpc", "ppu"];
  const sunLifeModules: ClientServicingModule[] = ["form", "acr", "bcr", "fst", "fw", "aca", "ada", "sro", "pdi", "cpst", "csmv", "acicr"];

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesDept = deptFilter === "All" || u.department === deptFilter;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [users, search, roleFilter, deptFilter, statusFilter]);

  return (
    <div className={styles.tableWrapper}>
      {/* Toolbar & Filter Options */}
      <div className={styles.filterBar}>
        <div className={styles.searchGroup}>
          <label className="text-[10.5px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block pl-1.5">
            Search Directory
          </label>
          <div className="relative">
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search members by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className={styles.clearSearchBtn} title="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.filtersGroup}>
          <RoundedSelect
            label="Role"
            value={roleFilter}
            options={[
              { label: `All Roles (${roles.length})`, value: "All" },
              ...roles.map(r => ({ label: r, value: r }))
            ]}
            onChange={setRoleFilter}
            placeholder="Search roles..."
          />

          <RoundedSelect
            label="Department"
            value={deptFilter}
            options={[
              { label: `All Departments (${departments.length})`, value: "All" },
              ...departments.map(d => ({ label: d, value: d }))
            ]}
            onChange={setDeptFilter}
            placeholder="Search departments..."
          />

          <RoundedSelect
            label="Status"
            value={statusFilter}
            options={[
              { label: "All Statuses", value: "All" },
              { label: "Active", value: "Active" },
              { label: "Pending", value: "Pending" },
              { label: "Disabled", value: "Disabled" },
            ]}
            onChange={setStatusFilter}
            placeholder="Search statuses..."
          />

          {hasActiveFilters && (
            <button type="button" onClick={handleResetFilters} className={`${styles.filterResetBtn} self-end mb-0.5`}>
              <RotateCcw size={12} />
              Reset
            </button>
          )}

          {users.filter(u => u.status?.toLowerCase() === "pending").length > 0 && (
            <button
              type="button"
              onClick={handleVerifyAllEmails}
              disabled={isVerifying}
              className="ml-auto self-end mb-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] uppercase tracking-wider font-extrabold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-md disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Check size={13} strokeWidth={2.5} />
              {isVerifying ? "Verifying..." : "Verify All Pending"}
            </button>
          )}
        </div>
      </div>

      {/* Main Members Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableScrollArea}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                <th className={styles.th}>Member Info</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Client Servicing Access</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyStateTd}>
                    <div className={styles.emptyStateWrap}>
                      <span className={styles.emptyStateIcon}>👥</span>
                      <p>No member profiles match the selected filters.</p>
                      {hasActiveFilters && (
                        <button type="button" onClick={handleResetFilters} className="text-xs text-[#F4C542] hover:underline font-semibold mt-1">
                          Clear search and filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={styles.tr}>
                    {/* Member Column */}
                    <td className={styles.td}>
                      <div className={styles.memberFlex} onClick={() => router.push(`/admin/users/${u.id}`)}>
                        <div
                          className={`${styles.avatarWrap} cursor-pointer group/av relative`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAvatarPreviewModalUser(u);
                          }}
                          title="Click to preview avatar"
                        >
                          <ProfileAvatar
                            avatarUrl={u.avatar}
                            name={u.name}
                            size={36}
                            className={styles.avatarImg}
                          />
                          {/* Hover overlay hint */}
                          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Eye size={14} className="text-white" />
                          </div>
                          {u.presence_status && (
                            <span
                              className={`${styles.presenceIndicator} ${u.presence_status.toLowerCase() === "online"
                                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                                  : u.presence_status.toLowerCase() === "pending"
                                    ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                                    : u.presence_status.toLowerCase() === "busy"
                                      ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                                      : "bg-gray-400"
                                }`}
                              title={`Status: ${u.presence_status}`}
                            />
                          )}
                        </div>

                        <div className={styles.memberMeta}>
                          <span className={styles.memberName}>{u.name}</span>
                          <span className={styles.memberEmail}>{u.email}</span>
                          {u.presence_status && (
                            <span className={`${styles.presenceTag} ${u.presence_status.toLowerCase() === "online"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : u.presence_status.toLowerCase() === "pending"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : u.presence_status.toLowerCase() === "busy"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-400"
                              }`}>
                              ● {u.presence_status}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td className={styles.td}>
                      <TableSelect
                        value={u.role}
                        options={roles.map(r => ({ label: r, value: r }))}
                        onChange={(val) => handleUpdateUser(u.id, "role", val)}
                      />
                    </td>

                    {/* Department Column */}
                    <td className={styles.td}>
                      <TableSelect
                        value={u.department}
                        options={[
                          { label: "None", value: "" },
                          ...departments.map(d => ({ label: d, value: d }))
                        ]}
                        onChange={(val) => handleUpdateUser(u.id, "department", val)}
                        placeholder="None"
                      />
                    </td>

                    {/* Status Column */}
                    <td className={styles.td}>
                      {(() => {
                        const s = u.status?.toLowerCase();
                        const isGreen = s === "active" || s === "online";
                        const isYellow = s === "pending";
                        const isRed = s === "disabled" || s === "busy";
                        const badgeBg = isGreen
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                          : isYellow
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                            : isRed
                              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60"
                              : "bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60";
                        const dotBg = isGreen
                          ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                          : isYellow
                            ? "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                            : isRed
                              ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                              : "bg-gray-400";
                        return (
                          <span className={`${styles.statusBadge} ${badgeBg}`}>
                            <span className={`${styles.statusDot} ${dotBg}`} />
                            {u.status}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Client Servicing Permissions Column */}
                    <td className={styles.td}>
                      <div className={styles.permissionsCell}>
                        <div className={styles.permissionChipsGroup}>
                          {u.client_servicing_permissions?.cpst?.view && <span className={styles.permissionChip}>CPST</span>}
                          {u.client_servicing_permissions?.acr?.view && <span className={styles.permissionChip}>ACR</span>}
                          {u.client_servicing_permissions?.fst?.view && <span className={styles.permissionChip}>FST</span>}
                          {u.client_servicing_permissions?.cpc?.view && <span className={styles.permissionChip}>CPC</span>}
                          {u.client_servicing_permissions?.ppu?.view && <span className={styles.permissionChip}>PPU</span>}
                          {u.client_servicing_permissions?.mngt?.view && <span className={styles.permissionChip}>MNGT</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => openModal(u)}
                          className={styles.editPermissionsBtn}
                        >
                          <Shield size={12} />
                          Manage Access →
                        </button>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className={styles.tdRight}>
                      <div className="flex items-center justify-end gap-2">
                        {u.status?.toLowerCase() === "pending" && (
                          <button
                            type="button"
                            onClick={(e) => handleVerifyEmail(u.id, e)}
                            className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-all border border-emerald-200 dark:border-emerald-800/60 shadow-2xs hover:-translate-y-0.5"
                            title="Verify Email & Activate"
                          >
                            <Check size={11} strokeWidth={2.5} /> Verify
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                          className={styles.viewProfileBtn}
                        >
                          <span>View Profile</span>
                          <ExternalLink size={11} />
                        </button>
                        {/* NEW: Edit Avatar — Admin only */}
                        {currentUserRole === 'Admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarUploadUser(u);
                              setUploadStep(1);
                              setAvatarFileToUpload(null);
                              setAvatarPreviewUrl(null);
                            }}
                            className={styles.editAvatarBtn}
                          >
                            <Camera size={11} />
                            <span>Edit Avatar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with total count */}
        <div className={styles.tableFooter}>
          <span>Showing {filteredUsers.length} of {users.length} total members</span>
          {hasActiveFilters && <span>Filters active</span>}
        </div>
      </div>

      {/* Permissions Modal Section */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121318] border border-slate-200 dark:border-zinc-800/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542] flex items-center justify-center font-bold">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Client Servicing Access Manager</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Configuring permissions for {selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 bg-slate-50/30 dark:bg-zinc-900/10 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Client Servicing Section */}
              <div className="flex flex-col p-5 border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50 shadow-2xs hover:border-[#F4C542]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542] flex items-center justify-center">
                      <Briefcase size={16} />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 tracking-wider">
                      Client Servicing Access
                    </h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={clientServicingModules.every(id => tempPermissions[id].view)} 
                      onChange={() => toggleSection(clientServicingModules)} 
                    />
                    <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F4C542]"></div>
                  </label>
                </div>
                <p className="mt-3.5 text-[11.5px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed pl-11">
                  <span className="font-bold text-slate-600 dark:text-zinc-300">Includes modules:</span> Client Management Tracker, Client Policy Card, Premium Payment, Client Welcome Note & Birthday Poster, Client Social Media Visibility
                </p>
              </div>

              {/* Sun Life Forms Section */}
              <div className="flex flex-col p-5 border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50 shadow-2xs hover:border-[#F4C542]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542] flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 tracking-wider">
                      Sun Life Forms Access
                    </h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={sunLifeModules.every(id => tempPermissions[id].view)} 
                      onChange={() => toggleSection(sunLifeModules)} 
                    />
                    <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F4C542]"></div>
                  </label>
                </div>
                <p className="mt-3.5 text-[11.5px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed pl-11">
                  <span className="font-bold text-slate-600 dark:text-zinc-300">Includes forms:</span> FORM, Advisor Change Request, Beneficiary Change Request, Fund Switching, Fund Withdrawal, Auto Credit Arrangement, Auto Debit Arrangement, Reinstatement SRO, Reinstatement PDI, Client Policy Status Tracking, Client Servicing Monitoring Verification, Address and Contact Information Change Request
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
              <button
                type="button"
                onClick={closeModal}
                className="px-4.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePermissions}
                className="px-5 py-2 text-xs font-bold bg-[#F4C542] text-black rounded-xl shadow-sm hover:shadow hover:bg-[#d9af39] transition-all hover:-translate-y-0.5"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Avatar Upload Modal (NEW — purely additive) ───────────────────── */}
      {avatarUploadUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121318] border border-slate-200 dark:border-zinc-800/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">

            {/* ── Step 1: Select & Preview ── */}
            {uploadStep === 1 && (
              <>
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542] flex items-center justify-center">
                      <Camera size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Upload Avatar</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">{avatarUploadUser.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvatarUploadUser(null)}
                    className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Side-by-side preview */}
                  <div className="flex gap-4">
                    {/* Current Avatar */}
                    <div className="flex-1 flex flex-col items-center gap-2.5 text-center">
                      <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-wider uppercase">Current Avatar</span>
                      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-200 dark:ring-zinc-700">
                        {avatarUploadUser.avatar ? (
                          <img src={avatarUploadUser.avatar} alt="Current" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            {avatarUploadUser.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-slate-400 dark:text-zinc-500 text-lg font-light">→</div>

                    {/* New Avatar Preview */}
                    <div className="flex-1 flex flex-col items-center gap-2.5 text-center">
                      <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-wider uppercase">New Preview</span>
                      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 ring-2 ring-[#F4C542]/60">
                        {avatarPreviewUrl ? (
                          <img src={avatarPreviewUrl} alt="New Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 border-2 border-dashed border-slate-300 dark:border-zinc-600 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                            <Camera size={20} opacity={0.5} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Chooser */}
                  <div>
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:border-[#F4C542]/60 hover:text-[#8a6b10] dark:hover:text-[#F4C542] transition-all flex items-center justify-center gap-2"
                    >
                      <Upload size={14} />
                      Choose Image File
                    </button>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center mt-2 font-medium">
                      Supported: JPG, JPEG, PNG, WEBP &nbsp;·&nbsp; Max: 5MB
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                  <button
                    type="button"
                    onClick={() => setAvatarUploadUser(null)}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadStep(2)}
                    disabled={!avatarPreviewUrl}
                    className="flex-1 px-4 py-2.5 text-xs font-bold bg-[#F4C542] text-black rounded-xl shadow-sm hover:bg-[#d9af39] hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: Confirm ── */}
            {uploadStep === 2 && (
              <>
                <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                  <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Confirm Avatar Update</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Please review before confirming</p>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold">
                    Member: <span className="font-extrabold text-slate-900 dark:text-zinc-100">{avatarUploadUser.name}</span>
                  </p>

                  {/* Comparison */}
                  <div className="flex items-center justify-center gap-6 py-2">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Current</span>
                      <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-zinc-700">
                        {avatarUploadUser.avatar ? (
                          <img src={avatarUploadUser.avatar} alt="Current" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base">
                            {avatarUploadUser.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-400 dark:text-zinc-500 text-xl font-light">→</div>

                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-extrabold text-[#8a6b10] dark:text-[#F4C542] uppercase tracking-wider">New</span>
                      <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#F4C542]">
                        <img src={avatarPreviewUrl!} alt="New Avatar" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-500 dark:text-zinc-400 font-medium">
                    Are you sure you want to update this profile picture?
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                  <button
                    type="button"
                    onClick={() => setUploadStep(1)}
                    disabled={uploadingAvatar}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl transition-all disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={confirmAvatarUpload}
                    disabled={uploadingAvatar}
                    className="flex-1 px-4 py-2.5 text-xs font-bold bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl shadow-sm hover:bg-slate-700 dark:hover:bg-zinc-200 hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingAvatar ? (
                      <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full" /> Uploading...</>
                    ) : 'Confirm Update'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Hidden file input for avatar picker ── */}
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarSelect}
      />

      {/* Custom Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121318] border border-slate-200 dark:border-zinc-800/80 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-2xs">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 gap-3">
              <button
                type="button"
                disabled={confirmModal.isVerifying}
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmModal.isVerifying}
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-[#F4C542] text-black rounded-xl shadow-sm hover:shadow hover:bg-[#d9af39] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {confirmModal.isVerifying ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal && alertModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121318] border border-slate-200 dark:border-zinc-800/80 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xs ${alertModal.isError ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                {alertModal.isError ? <AlertTriangle size={24} /> : <Check size={24} />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">{alertModal.title}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {alertModal.message}
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl shadow-sm transition-all ${alertModal.isError ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

