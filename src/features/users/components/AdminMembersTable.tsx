'use client';

/**
 * AdminMembersTable.tsx
 *
 * Real-Time Member Management Table for Team Padua Portal (/admin/members)
 *
 * Features:
 * - Drag-and-drop sortable member reordering with database persistence
 * - Real-time Supabase Presence tracking (Online/Offline + Last Seen)
 * - Granular Client Servicing permissions management
 * - Avatar upload & AI avatar generation
 * - Fast multi-attribute filtering & search
 * - Responsive desktop table & mobile cards layout
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import styles from '@/styles/admin/members/AdminMembersTable/AdminMembersTable.module.css';
import {
  Search,
  X,
  Shield,
  ExternalLink,
  RotateCcw,
  Check,
  ChevronDown,
  Camera,
  Eye,
  GripVertical,
  Radio,
  Clock,
  Sparkles,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import ProfileAvatar from '@src/components/shared/ProfileAvatar';
import { supabase } from '@src/lib/supabase/client';
import { usePresence } from '@src/lib/presence/usePresence';

export type ClientServicingModule =
  | 'cpst'
  | 'acr'
  | 'fst'
  | 'cpc'
  | 'ppu'
  | 'mngt'
  | 'csmv'
  | 'bcr'
  | 'aca'
  | 'sro'
  | 'pdi'
  | 'form'
  | 'fw'
  | 'ada'
  | 'acicr';

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
  last_seen_at?: string;
  display_order?: number;
  team?: string;
  avatar?: string;
  avatarMode?: string;
  aiSeed?: string;
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

function RoundedSelect({ label, value, options, onChange, placeholder = 'Search...' }: RoundedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 min-w-[150px] relative" ref={dropdownRef}>
      <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-wider uppercase pl-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200/90 dark:border-zinc-700/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 transition shadow-2xs h-9 cursor-pointer w-full text-left"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown
          size={13}
          className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[200px] bg-white dark:bg-[#16181d] border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative mb-1.5 group">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#F4C542] transition-colors duration-200" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80 focus:border-[#F4C542] focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 font-medium"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium">No matching options</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542]'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={12} className="text-[#8a6b10] dark:text-[#F4C542] shrink-0" />}
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

function TableSelect({ value, options, onChange, placeholder = 'None' }: TableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || { label: placeholder, value: '' };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition shadow-2xs h-8 cursor-pointer min-w-[90px]"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
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
                      ? 'bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542]'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
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

// ── Sortable Reorder Table Row ───────────────────────────────────────────────
interface MemberRowProps {
  user: User;
  isOnline: boolean;
  formatLastSeen: (timestamp?: string | null) => string;
  isReorderingAllowed: boolean;
  roles: string[];
  departments: string[];
  onUpdateUser: (id: string, key: keyof User, value: any) => void;
  onOpenPermissions: (u: User) => void;
  onOpenAvatarModal: (u: User) => void;
  onPreviewAvatar: (u: User) => void;
  onVerifyEmail: (id: string, e: React.MouseEvent) => void;
  currentUserRole: string;
}

function MemberRow({
  user,
  isOnline,
  formatLastSeen,
  isReorderingAllowed,
  roles,
  departments,
  onUpdateUser,
  onOpenPermissions,
  onOpenAvatarModal,
  onPreviewAvatar,
  onVerifyEmail,
  currentUserRole,
}: MemberRowProps) {
  const router = useRouter();
  const dragControls = useDragControls();

  const isPending = user.status?.toLowerCase() === 'pending';
  const isSuspended = user.status?.toLowerCase() === 'disabled' || user.status?.toLowerCase() === 'suspended';

  return (
    <Reorder.Item
      as="tr"
      value={user}
      dragListener={false}
      dragControls={dragControls}
      className={styles.tr}
      whileDrag={{
        scale: 1.01,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'var(--surface-2)',
      }}
    >
      {/* 1. Dedicated Drag Handle */}
      <td className={styles.dragTd}>
        <div
          onPointerDown={(e) => {
            if (isReorderingAllowed) dragControls.start(e);
          }}
          className={`${styles.dragHandle} ${!isReorderingAllowed ? styles.dragDisabled : ''}`}
          title={isReorderingAllowed ? 'Click & drag to reorder' : 'Reordering disabled while filters/search active'}
          aria-label="Drag handle to reorder"
        >
          <GripVertical size={16} />
        </div>
      </td>

      {/* 2. Member Info: Avatar, Full Name, Email, Presence Status */}
      <td className={styles.td}>
        <div className={styles.memberFlex} onClick={() => router.push(`/admin/users/${user.id}`)}>
          <div
            className={`${styles.avatarWrap} cursor-pointer group/av relative`}
            onClick={(e) => {
              e.stopPropagation();
              onPreviewAvatar(user);
            }}
            title="Click to view avatar"
          >
            <ProfileAvatar avatarUrl={user.avatar} name={user.name} size={40} className={styles.avatarImg} />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <Eye size={14} className="text-white" />
            </div>
            {/* Realtime Presence Dot on Avatar */}
            <span
              className={`${styles.presenceIndicator} ${
                isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-400 dark:bg-zinc-600'
              }`}
              title={isOnline ? 'Online now' : 'Offline'}
            />
          </div>

          <div className={styles.memberMeta}>
            <span className={styles.memberName}>{user.name}</span>
            <span className={styles.memberEmail}>{user.email}</span>

            {/* Realtime Online / Offline + Last Seen */}
            <div className={styles.presenceRow}>
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className={styles.presenceDotOnline} /> Online
                  <span className="text-slate-400 dark:text-zinc-500 font-normal">• Active now</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  <span className={styles.presenceDotOffline} /> Offline
                  <span className="text-slate-400 dark:text-zinc-500 text-[10.5px]">
                    • {formatLastSeen(user.last_seen_at || user.lastActive)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 3. Role */}
      <td className={styles.td}>
        <TableSelect
          value={user.role}
          options={roles.map((r) => ({ label: r, value: r }))}
          onChange={(val) => onUpdateUser(user.id, 'role', val)}
        />
      </td>

      {/* 4. Department */}
      <td className={styles.td}>
        <TableSelect
          value={user.department}
          options={[{ label: 'None', value: '' }, ...departments.map((d) => ({ label: d, value: d }))]}
          onChange={(val) => onUpdateUser(user.id, 'department', val)}
          placeholder="None"
        />
      </td>

      {/* 5. Account Status (Distinct from Online/Offline!) */}
      <td className={styles.td}>
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
            Pending
          </span>
        ) : isSuspended ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
            Disabled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
            Active
          </span>
        )}
      </td>

      {/* 6. Client Servicing Access */}
      <td className={styles.td}>
        <div className={styles.permissionsCell}>
          <div className={styles.permissionChipsGroup}>
            {user.client_servicing_permissions?.cpst?.view && <span className={styles.permissionChip}>CPST</span>}
            {user.client_servicing_permissions?.acr?.view && <span className={styles.permissionChip}>ACR</span>}
            {user.client_servicing_permissions?.fst?.view && <span className={styles.permissionChip}>FST</span>}
            {user.client_servicing_permissions?.cpc?.view && <span className={styles.permissionChip}>CPC</span>}
            {user.client_servicing_permissions?.ppu?.view && <span className={styles.permissionChip}>PPU</span>}
            {user.client_servicing_permissions?.mngt?.view && <span className={styles.permissionChip}>MNGT</span>}
          </div>
          <button type="button" onClick={() => onOpenPermissions(user)} className={styles.editPermissionsBtn}>
            <Shield size={12} />
            Manage Access →
          </button>
        </div>
      </td>

      {/* 7. Actions: Manage Access, View Profile, Edit Avatar */}
      <td className={styles.tdRight}>
        <div className="flex items-center justify-end gap-1.5">
          {isPending && (
            <button
              type="button"
              onClick={(e) => onVerifyEmail(user.id, e)}
              className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-all border border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
              title="Verify Email & Activate"
            >
              <Check size={11} strokeWidth={2.5} /> Verify
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenPermissions(user)}
            className="p-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 transition-colors"
            title="Manage Access"
          >
            <Shield size={13} />
          </button>

          <button
            type="button"
            onClick={() => router.push(`/admin/users/${user.id}`)}
            className={styles.viewProfileBtn}
            title="View User Profile"
          >
            <span>View Profile</span>
            <ExternalLink size={11} />
          </button>

          {currentUserRole === 'Admin' && (
            <button
              type="button"
              onClick={() => onOpenAvatarModal(user)}
              className={styles.editAvatarBtn}
              title="Edit User Avatar"
            >
              <Camera size={11} />
              <span>Edit Avatar</span>
            </button>
          )}
        </div>
      </td>
    </Reorder.Item>
  );
}

// ── Main AdminMembersTable Component ─────────────────────────────────────────
export default function AdminMembersTable({
  initialUsers = [],
  currentUserRole = '',
  currentUserId = '',
}: {
  initialUsers?: User[];
  currentUserRole?: string;
  currentUserId?: string;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [presenceFilter, setPresenceFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Presence hook
  const { isUserOnline, formatLastSeen } = usePresence(currentUserId);

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);

  // Permissions Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<ClientServicingPermissions>(defaultClientServicingPermissions);

  // Custom Modal States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isVerifying: boolean;
  } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isError?: boolean;
  } | null>(null);

  // Avatar Upload State
  const [avatarUploadUser, setAvatarUploadUser] = useState<User | null>(null);
  const [avatarFileToUpload, setAvatarFileToUpload] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2>(1);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Avatar Preview Modal
  const [avatarPreviewModalUser, setAvatarPreviewModalUser] = useState<User | null>(null);

  // Inline Toast
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

  // Sync with initialUsers if server updates
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Realtime updates for profiles
  useEffect(() => {
    const uniqueId = Math.random().toString(36).slice(2, 9);
    const channel = supabase
      .channel(`profiles-sync-${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          if (updatedProfile && updatedProfile.id) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === updatedProfile.id
                  ? {
                      ...u,
                      avatar: updatedProfile.avatar_url ?? u.avatar,
                      avatarMode: updatedProfile.avatar_mode ?? u.avatarMode,
                      aiSeed: updatedProfile.ai_seed ?? u.aiSeed,
                      name: updatedProfile.full_name || u.name,
                      role: updatedProfile.role || u.role,
                      department: updatedProfile.department ?? u.department,
                      status: updatedProfile.status || u.status,
                      display_order: updatedProfile.display_order ?? u.display_order,
                      last_seen_at: updatedProfile.last_seen_at ?? u.last_seen_at,
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

  const roles = ['Admin', 'Advisor', 'Bizdev', 'Member'];
  const departments = ['ASA', 'BSA', 'CRA', 'DCA'];

  const hasActiveFilters =
    search !== '' || presenceFilter !== 'All' || roleFilter !== 'All' || deptFilter !== 'All' || statusFilter !== 'All';

  const isReorderingAllowed = !hasActiveFilters && currentUserRole === 'Admin';

  const handleResetFilters = () => {
    setSearch('');
    setPresenceFilter('All');
    setRoleFilter('All');
    setDeptFilter('All');
    setStatusFilter('All');
  };

  // Handle Drag-and-Drop Reorder
  const handleReorder = async (newOrder: User[]) => {
    if (!isReorderingAllowed) return;

    const previousOrder = [...users];
    setUsers(newOrder);
    setIsSavingOrder(true);
    showToast('Saving member order...', 'loading');

    try {
      const res = await fetch('/api/admin/members/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: newOrder.map((u) => u.id) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save member order.');
      }

      showToast('Member order updated successfully.', 'success', 2500);
    } catch (err: any) {
      console.error('Reorder error:', err);
      setUsers(previousOrder);
      showToast(err.message || 'Failed to save order. Restored original order.', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const saveUser = async (user: User) => {
    const res = await fetch('/api/admin/members/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        full_name: user.name,
        employee_id: user.employeeId,
        role: user.role,
        department: user.department,
        team: user.team || '',
        phone: user.phone,
        status: user.status,
        birthday: user.birthday?.trim() ? user.birthday : null,
        address: user.address || '',
        client_servicing_permissions: user.client_servicing_permissions,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error ?? `Unable to save (${res.status})`);
    }

    return await res.json();
  };

  const handleUpdateUser = async (id: string, key: keyof User, value: any) => {
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, [key]: value };
    setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));

    try {
      await saveUser(updatedUser);
      showToast(`Updated ${targetUser.name}'s ${String(key)}.`, 'success', 2000);
    } catch (error) {
      console.error(error);
      setUsers((prev) => prev.map((u) => (u.id === id ? targetUser : u)));
      showToast(error instanceof Error ? error.message : 'Failed to save changes.', 'error');
    }
  };

  const handleVerifyEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Verify Member Email',
      message: 'Are you sure you want to verify the email and activate this member?',
      isVerifying: false,
      onConfirm: async () => {
        setConfirmModal((prev) => (prev ? { ...prev, isVerifying: true } : null));
        try {
          const res = await fetch('/api/admin/members/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (res.ok) {
            setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'Active' } : u)));
            setConfirmModal(null);
            showToast('Email verified and member activated.', 'success');
          } else {
            const err = await res.json().catch(() => null);
            setConfirmModal(null);
            showToast(err?.error || 'Verification failed.', 'error');
          }
        } catch (err) {
          console.error(err);
          setConfirmModal(null);
          showToast('An unexpected error occurred.', 'error');
        }
      },
    });
  };

  const handleVerifyAllEmails = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Verify All Pending Emails',
      message: 'Are you sure you want to verify emails and activate ALL pending members?',
      isVerifying: false,
      onConfirm: async () => {
        setConfirmModal((prev) => (prev ? { ...prev, isVerifying: true } : null));
        try {
          const res = await fetch('/api/admin/members/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verifyAll: true }),
          });
          if (res.ok) {
            setConfirmModal(null);
            showToast('All pending members verified successfully.', 'success');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            const err = await res.json().catch(() => null);
            setConfirmModal(null);
            showToast(err?.error || 'Verification failed.', 'error');
          }
        } catch (err) {
          console.error(err);
          setConfirmModal(null);
          showToast('An unexpected error occurred.', 'error');
        }
      },
    });
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
      client_servicing_permissions: tempPermissions,
    };

    setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
    closeModal();
    showToast('Saving permissions...', 'loading');

    try {
      await saveUser(updatedUser);
      showToast(`Permissions updated for ${selectedUser.name}.`, 'success');
    } catch (error) {
      console.error(error);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? selectedUser : u)));
      showToast(error instanceof Error ? error.message : 'Failed to save permissions.', 'error');
    }
  };

  // Avatar Upload Handlers
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
    e.target.value = '';
  };

  const confirmAvatarUpload = async () => {
    if (!avatarFileToUpload || !avatarUploadUser) return;
    setUploadingAvatar(true);
    showToast('Uploading profile avatar...', 'loading');
    try {
      const fileExt = avatarFileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `avatars/${avatarUploadUser.id}.${fileExt}`;

      const { error: storageError } = await supabase.storage.from('avatars').upload(path, avatarFileToUpload, {
        upsert: true,
        contentType: avatarFileToUpload.type,
        cacheControl: '3600',
      });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          avatar_mode: 'upload',
          updated_at: new Date().toISOString(),
        })
        .eq('id', avatarUploadUser.id);
      if (dbError) throw dbError;

      setUsers((prev) =>
        prev.map((u) => (u.id === avatarUploadUser.id ? { ...u, avatar: publicUrl, avatarMode: 'upload' } : u))
      );

      setAvatarUploadUser(null);
      setAvatarFileToUpload(null);
      setAvatarPreviewUrl(null);
      window.dispatchEvent(new CustomEvent('profile-updated'));
      showToast('Profile picture updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload profile picture.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const generateAiAvatarForUser = async () => {
    if (!avatarUploadUser) return;
    setUploadingAvatar(true);
    showToast('Generating AI avatar...', 'loading');
    try {
      const newSeed = Math.random().toString(36).substring(7);
      const aiUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: aiUrl,
          ai_seed: newSeed,
          avatar_mode: 'ai',
          updated_at: new Date().toISOString(),
        })
        .eq('id', avatarUploadUser.id);
      if (dbError) throw dbError;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === avatarUploadUser.id ? { ...u, avatar: aiUrl, avatarMode: 'ai', aiSeed: newSeed } : u
        )
      );

      setAvatarUploadUser(null);
      setAvatarFileToUpload(null);
      setAvatarPreviewUrl(null);
      window.dispatchEvent(new CustomEvent('profile-updated'));
      showToast('AI Avatar generated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate AI avatar.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resetToInitials = async () => {
    if (!avatarUploadUser) return;
    setUploadingAvatar(true);
    showToast('Resetting avatar...', 'loading');
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          avatar_mode: 'initials',
          updated_at: new Date().toISOString(),
        })
        .eq('id', avatarUploadUser.id);
      if (dbError) throw dbError;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === avatarUploadUser.id ? { ...u, avatar: '', avatarMode: 'initials' } : u
        )
      );

      setAvatarUploadUser(null);
      setAvatarFileToUpload(null);
      setAvatarPreviewUrl(null);
      window.dispatchEvent(new CustomEvent('profile-updated'));
      showToast('Avatar reset to initials.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset avatar.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const clientServicingModules: ClientServicingModule[] = ['mngt', 'cpc', 'ppu'];
  const sunLifeModules: ClientServicingModule[] = [
    'form',
    'acr',
    'bcr',
    'fst',
    'fw',
    'aca',
    'ada',
    'sro',
    'pdi',
    'cpst',
    'csmv',
    'acicr',
  ];

  const isMemberOnline = useCallback(
    (u: User) => {
      // 1. Live presence from Supabase Realtime channel
      if (isUserOnline(u.id)) return true;
      // 2. Currently logged in user viewing this table
      if (currentUserId && u.id === currentUserId) return true;
      // 3. Explicit presence_status
      const presence = (u.presence_status || '').toLowerCase();
      if (presence === 'online') return true;
      if (presence === 'offline') return false;
      // 4. Account status is Active
      const st = (u.status || '').toLowerCase();
      if (st === 'active' || st === 'online') return true;
      return false;
    },
    [isUserOnline, currentUserId]
  );

  const onlineCount = useMemo(() => {
    return users.filter((u) => isMemberOnline(u)).length;
  }, [users, isMemberOnline]);

  const offlineCount = useMemo(() => {
    return users.length - onlineCount;
  }, [users, onlineCount]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const isOnline = isMemberOnline(u);

      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(search.toLowerCase());

      const matchesPresence =
        presenceFilter === 'All' ||
        (presenceFilter === 'Online' && isOnline) ||
        (presenceFilter === 'Offline' && !isOnline);

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesDept = deptFilter === 'All' || u.department === deptFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesPresence && matchesRole && matchesDept && matchesStatus;
    });
  }, [users, search, presenceFilter, roleFilter, deptFilter, statusFilter, isMemberOnline]);

  return (
    <div className={styles.tableWrapper}>
      {/* Inline Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/90 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                : toast.type === 'loading'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {toast.type === 'loading' && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {toast.type === 'success' && <Check size={14} className="text-emerald-500" />}
            <span>{toast.message}</span>
            <button onClick={dismissToast} className="ml-1 text-slate-400 hover:text-white">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar & Filter Options */}
      <div className={styles.filterBar}>
        <div className={styles.searchGroup}>
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block pl-1.5">
            Search Directory
          </label>
          <div className="relative">
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={styles.clearSearchBtn}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.filtersGroup}>
          {/* Presence Filter */}
          <RoundedSelect
            label="Presence"
            value={presenceFilter}
            options={[
              { label: 'All Presence', value: 'All' },
              { label: `● Online (${onlineCount})`, value: 'Online' },
              { label: `○ Offline (${offlineCount})`, value: 'Offline' },
            ]}
            onChange={setPresenceFilter}
            placeholder="Presence..."
          />

          {/* Role Filter */}
          <RoundedSelect
            label="Role"
            value={roleFilter}
            options={[{ label: `All Roles (${roles.length})`, value: 'All' }, ...roles.map((r) => ({ label: r, value: r }))]}
            onChange={setRoleFilter}
            placeholder="Search roles..."
          />

          {/* Department Filter */}
          <RoundedSelect
            label="Department"
            value={deptFilter}
            options={[
              { label: `All Departments (${departments.length})`, value: 'All' },
              ...departments.map((d) => ({ label: d, value: d })),
            ]}
            onChange={setDeptFilter}
            placeholder="Search departments..."
          />

          {/* Account Status Filter */}
          <RoundedSelect
            label="Account Status"
            value={statusFilter}
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Disabled', value: 'Disabled' },
            ]}
            onChange={setStatusFilter}
            placeholder="Search statuses..."
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={`${styles.filterResetBtn} self-end mb-0.5`}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}

          {users.filter((u) => u.status?.toLowerCase() === 'pending').length > 0 && (
            <button
              type="button"
              onClick={handleVerifyAllEmails}
              disabled={isVerifying}
              className="ml-auto self-end mb-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] uppercase tracking-wider font-extrabold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-md disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Check size={13} strokeWidth={2.5} />
              {isVerifying ? 'Verifying...' : 'Verify All Pending'}
            </button>
          )}
        </div>
      </div>

      {/* Drag & Reorder Info Banner */}
      {currentUserRole === 'Admin' && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl text-[11.5px] text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={13} className="text-[#F4C542]" />
            <span>
              {isReorderingAllowed
                ? 'Drag handle (⋮⋮) enabled. Drag rows to change display order — order is saved automatically.'
                : 'Custom drag reordering is paused while filters/search are active. Click "Reset" to reorder.'}
            </span>
          </div>
          {isSavingOrder && <span className="text-[#F4C542] font-semibold animate-pulse">Saving order...</span>}
        </div>
      )}

      {/* Main Table Container (Desktop / Tablet) */}
      <div className={styles.tableCard}>
        <div className={styles.tableScrollArea}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                <th className={styles.dragTh} title="Drag handle">
                  ⋮⋮
                </th>
                <th className={styles.th}>Member Info</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Client Servicing Access</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>

            {filteredUsers.length === 0 ? (
              <tbody className={styles.tableBody}>
                <tr>
                  <td colSpan={7} className={styles.emptyStateTd}>
                    <div className={styles.emptyStateWrap}>
                      <span className={styles.emptyStateIcon}>👥</span>
                      <p>No member profiles match the selected filters.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs text-[#F4C542] hover:underline font-semibold mt-1"
                        >
                          Clear search and filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <Reorder.Group
                as="tbody"
                axis="y"
                values={filteredUsers}
                onReorder={handleReorder}
                className={styles.tableBody}
              >
                {filteredUsers.map((u) => (
                  <MemberRow
                    key={u.id}
                    user={u}
                    isOnline={isMemberOnline(u)}
                    formatLastSeen={formatLastSeen}
                    isReorderingAllowed={isReorderingAllowed}
                    roles={roles}
                    departments={departments}
                    onUpdateUser={handleUpdateUser}
                    onOpenPermissions={openModal}
                    onOpenAvatarModal={(user) => {
                      setAvatarUploadUser(user);
                      setUploadStep(1);
                      setAvatarFileToUpload(null);
                      setAvatarPreviewUrl(null);
                    }}
                    onPreviewAvatar={setAvatarPreviewModalUser}
                    onVerifyEmail={handleVerifyEmail}
                    currentUserRole={currentUserRole}
                  />
                ))}
              </Reorder.Group>
            )}
          </table>
        </div>

        {/* Table Footer */}
        <div className={styles.tableFooter}>
          <div className="flex items-center gap-3">
            <span>
              Showing {filteredUsers.length} of {users.length} total members
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• {onlineCount} online now</span>
          </div>
          {hasActiveFilters && <span>Filters active</span>}
        </div>
      </div>

      {/* Permissions Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#16181d] border border-slate-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                    Client Servicing Access Control
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Configuring granular module rights for <span className="font-semibold text-slate-700 dark:text-zinc-200">{selectedUser.name}</span>
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs">
              {/* Client Servicing Core Modules */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                  Core Modules
                </h3>
                <div className="space-y-3">
                  {clientServicingModules.map((mod) => (
                    <div
                      key={mod}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                          {mod} Module
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempPermissions[mod]?.view || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setTempPermissions((prev) => ({
                                ...prev,
                                [mod]: { ...prev[mod], view: checked },
                              }));
                            }}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Enable View</span>
                        </label>
                      </div>

                      {tempPermissions[mod]?.view && (
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
                          {(['create', 'edit', 'delete', 'export'] as (keyof ModulePermissions)[]).map((action) => (
                            <label key={action} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tempPermissions[mod]?.[action] || false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setTempPermissions((prev) => ({
                                    ...prev,
                                    [mod]: { ...prev[mod], [action]: checked },
                                  }));
                                }}
                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="capitalize text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                                {action}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sun Life Standard Servicing Modules */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                  Sun Life Servicing Forms & Modules
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {sunLifeModules.map((mod) => (
                    <div
                      key={mod}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">{mod}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempPermissions[mod]?.view || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setTempPermissions((prev) => ({
                              ...prev,
                              [mod]: { ...prev[mod], view: checked },
                            }));
                          }}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Access</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
              <button onClick={closeModal} className={styles.modalCancelBtn}>
                Cancel
              </button>
              <button onClick={savePermissions} className={styles.modalSaveBtn}>
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload / AI Generation Modal */}
      {avatarUploadUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#16181d] border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                  {uploadStep === 1 ? 'Edit Member Avatar' : 'Confirm Avatar'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Update profile picture for <span className="font-semibold text-slate-700 dark:text-zinc-200">{avatarUploadUser.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setAvatarUploadUser(null);
                  setAvatarFileToUpload(null);
                  setAvatarPreviewUrl(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center py-2">
                <ProfileAvatar avatarUrl={avatarPreviewUrl || avatarUploadUser.avatar} name={avatarUploadUser.name} size={96} />
              </div>

              <div className="space-y-2">
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />

                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Camera size={15} />
                  Choose New Photo
                </button>

                <button
                  type="button"
                  onClick={generateAiAvatarForUser}
                  disabled={uploadingAvatar}
                  className="w-full py-2.5 px-4 bg-[#FFF7D6] dark:bg-[#2E2818] text-[#8a6b10] dark:text-[#F4C542] hover:bg-[#ffefb0] dark:hover:bg-[#3d3420] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-[#F4C542]/30 disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  {uploadingAvatar ? 'Generating...' : 'Generate Random AI Avatar'}
                </button>

                <button
                  type="button"
                  onClick={resetToInitials}
                  disabled={uploadingAvatar}
                  className="w-full py-2.5 px-4 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-zinc-700 disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  Reset to Initials
                </button>
              </div>

              {avatarFileToUpload && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={confirmAvatarUpload}
                    disabled={uploadingAvatar}
                    className="w-full py-2.5 px-4 bg-primary text-black font-bold rounded-2xl text-xs shadow transition cursor-pointer hover:brightness-95 disabled:opacity-50"
                  >
                    {uploadingAvatar ? 'Uploading...' : 'Save Uploaded Avatar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {avatarPreviewModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setAvatarPreviewModalUser(null)}
        >
          <div
            className="bg-white dark:bg-[#16181d] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 flex flex-col items-center max-w-sm w-full animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <ProfileAvatar avatarUrl={avatarPreviewModalUser.avatar} name={avatarPreviewModalUser.name} size={120} />
            <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 mt-4">
              {avatarPreviewModalUser.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
              {avatarPreviewModalUser.email}
            </p>
            <button
              onClick={() => setAvatarPreviewModalUser(null)}
              className="mt-5 w-full py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#16181d] border border-slate-200 dark:border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-5 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                disabled={confirmModal.isVerifying}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 shadow-2xs"
              >
                {confirmModal.isVerifying ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
