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

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/styles/admin/members/AdminMembersTable/AdminMembersTable.module.css";
import { X } from "lucide-react";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import { supabase } from "@/app/lib/supabase/client";

export type ClientServicingModule = "cpst" | "acr" | "fst" | "cpc" | "ppu" | "mngt" | "csmv" | "bcr" | "aca" | "sro" | "pdi";

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

export default function AdminMembersTable({ initialUsers = [] }: { initialUsers?: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<ClientServicingPermissions>(defaultClientServicingPermissions);

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
  const departments = ["ASA", "BSA", "CSA", "DSA"];

  // Helper function to extract First Name & Surname Initials
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    const firstInitial = parts[0].charAt(0).toUpperCase();
    const surnameInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${surnameInitial}`;
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
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save assignment changes.");
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
    }
  };

  const togglePermission = (moduleName: ClientServicingModule, action: keyof ModulePermissions) => {
    setTempPermissions(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [action]: !prev[moduleName][action]
      }
    }));
  };

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
    <div className={styles.div_0}>
      <div className={styles.container_1}>
        <div className={styles.div_2}>
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.card_3}
          />
        </div>
        <div className={styles.container_4}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.card_5}
          >
            <option value="All">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={styles.card_6}
          >
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.card_7}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
      </div>

      <div className={styles.card_8}>
        <div className={styles.div_9}>
          <table className={styles.text_10}>
            <thead>
              <tr className={styles.table_11}>
                <th className={styles.div_12}>Member</th>
                <th className={styles.div_14}>Role</th>
                <th className={styles.div_15}>Department</th>
                <th className={styles.div_16}>Status</th>
                <th className={styles.div_16}>Client Servicing</th>
                <th className={styles.text_17}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.card_18}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.text_19}>No database profiles mapped to parameters.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={styles.table_20}>
                    <td className={styles.div_21}>
                      <div className={styles.container_22} onClick={() => router.push(`/admin/users/${u.id}`)}>

                        {/* Avatar Wrap logic that manages automatic fallbacks */}
                        <div className="relative flex items-center justify-center shrink-0">
                          <ProfileAvatar
                            avatarUrl={u.avatar}
                            name={u.name}
                            size={36}
                            className={styles.div_23}
                          />
                          {u.presence_status && (
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${u.presence_status.toLowerCase() === "online"
                                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                                  : u.presence_status.toLowerCase() === "pending"
                                    ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                                    : u.presence_status.toLowerCase() === "busy"
                                      ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                                      : "bg-gray-400"
                                }`}
                              title={u.presence_status}
                            />
                          )}
                        </div>

                        <div className={styles.div_25}>
                          <span className={styles.table_26}>{u.name}</span>
                          <span className={styles.table_27}>{u.email}</span>
                          <span className={`text-[9px] font-bold mt-0.5 capitalize ${u.presence_status?.toLowerCase() === "online"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : u.presence_status?.toLowerCase() === "pending"
                                ? "text-amber-600 dark:text-amber-400"
                                : u.presence_status?.toLowerCase() === "busy"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}>● {u.presence_status}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.div_29}>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, "role", e.target.value)}
                        className={styles.card_30}
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className={styles.div_31}>
                      <select
                        value={u.department}
                        onChange={(e) => handleUpdateUser(u.id, "department", e.target.value)}
                        className={styles.card_32}
                      >
                        <option value="">None</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className={styles.div_33}>
                      {(() => {
                        const s = u.status?.toLowerCase();
                        const isGreen = s === "active" || s === "online";
                        const isYellow = s === "pending";
                        const isRed = s === "disabled" || s === "busy";
                        const badgeBg = isGreen
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/50"
                          : isYellow
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800/50"
                            : isRed
                              ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800/50"
                              : "bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700/50";
                        const dotBg = isGreen
                          ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                          : isYellow
                            ? "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                            : isRed
                              ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                              : "bg-gray-400";
                        return (
                          <span className={`${styles.text_36} ${badgeBg}`}>
                            <span className={`${styles.div_37} ${dotBg}`} />
                            {u.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className={styles.div_33}>
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex flex-wrap max-w-[150px] gap-1 text-[10px] text-muted-foreground font-semibold">
                          {u.client_servicing_permissions?.cpst?.view && <span className="text-emerald-500">☑ CPST</span>}
                          {u.client_servicing_permissions?.acr?.view && <span className="text-emerald-500">☑ ACR</span>}
                          {u.client_servicing_permissions?.fst?.view && <span className="text-emerald-500">☑ FST</span>}
                          {u.client_servicing_permissions?.cpc?.view && <span className="text-emerald-500">☑ CPC</span>}
                          {u.client_servicing_permissions?.ppu?.view && <span className="text-emerald-500">☑ PPU</span>}
                          {u.client_servicing_permissions?.mngt?.view && <span className="text-emerald-500">☑ MNGT</span>}
                        </div>
                        <button
                          onClick={() => openModal(u)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold mt-1"
                        >
                          Edit Permissions →
                        </button>
                      </div>
                    </td>
                    <td className={styles.text_34}>
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className={styles.card_35}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Section */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121318] border border-slate-200 dark:border-zinc-800/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Client Servicing Access Manager</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">{selectedUser.name}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-800/80">
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-wider uppercase">Module</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-wider uppercase text-center">View</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-wider uppercase text-center">Create</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-wider uppercase text-center">Edit</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-wider uppercase text-center">Delete</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-wider uppercase text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {[
                    { id: "cpst" as ClientServicingModule, label: "CPST" },
                    { id: "acr" as ClientServicingModule, label: "ACR" },
                    { id: "fst" as ClientServicingModule, label: "FST" },
                    { id: "cpc" as ClientServicingModule, label: "CPC" },
                    { id: "ppu" as ClientServicingModule, label: "PPU" },
                    { id: "mngt" as ClientServicingModule, label: "MNGT" },
                  ].map(module => (
                    <tr key={module.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/20 transition-all duration-150">
                      <td className="py-3.5 px-5 text-xs font-bold text-slate-700 dark:text-zinc-300">{module.label}</td>
                      {["view", "create", "edit", "delete", "export"].map((action) => (
                        <td key={action} className="py-3.5 px-4 text-center">
                          <label className="cursor-pointer flex items-center justify-center w-full h-full">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-[#F4C542] focus:ring-[#F4C542] focus:ring-offset-0 bg-white dark:bg-zinc-800 transition cursor-pointer"
                              checked={tempPermissions[module.id][action as keyof ModulePermissions]}
                              onChange={() => togglePermission(module.id, action as keyof ModulePermissions)}
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
              <button
                onClick={closeModal}
                className="px-4.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className="px-5 py-2 text-xs font-bold bg-[#F4C542] text-black rounded-xl shadow-sm hover:shadow hover:bg-[#d9af39] transition-all hover:-translate-y-0.5"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}