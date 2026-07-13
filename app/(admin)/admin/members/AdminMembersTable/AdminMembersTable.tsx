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

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/styles/admin/members/AdminMembersTable/AdminMembersTable.module.css";
import { X } from "lucide-react";

export type ClientServicingModule = "cpst" | "acr" | "fst" | "cpc" | "ppu" | "mngt";

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

  const roles = ["Admin", "Manager", "Intern", "Member"];
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
                          {u.avatar ? (
                            <img 
                              src={u.avatar} 
                              alt={u.name} 
                              className={styles.div_23} 
                              onError={(e) => {
                                // If image link breaks, hide it and force fallback to show
                                e.currentTarget.style.display = 'none';
                                const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallbackEl) fallbackEl.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          <div 
                            className={styles.text_24}
                            style={{ display: u.avatar ? 'none' : 'flex' }}
                          >
                            {getInitials(u.name)}
                          </div>
                        </div>

                        <div className={styles.div_25}>
                          <span className={styles.table_26}>{u.name}</span>
                          <span className={styles.table_27}>{u.email}</span>
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
                      <span className={`${styles.text_36} ${u.status === "Active" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-[#4ade80]" :
                          u.status === "Pending" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-[#fef08a]" : "bg-muted text-muted-foreground"
                        }`}>
                        <span className={`${styles.div_37} ${u.status === "Active" ? "bg-emerald-500" : u.status === "Pending" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                        {u.status}
                      </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <div>
                <h3 className="font-semibold text-foreground">Client Servicing Access Manager</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.name}</p>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="p-3 text-xs font-semibold text-muted-foreground">Module</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground text-center">View</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground text-center">Create</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground text-center">Edit</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground text-center">Delete</th>
                    <th className="p-3 text-xs font-semibold text-muted-foreground text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: "cpst" as ClientServicingModule, label: "CPST" },
                    { id: "acr" as ClientServicingModule, label: "ACR" },
                    { id: "fst" as ClientServicingModule, label: "FST" },
                    { id: "cpc" as ClientServicingModule, label: "CPC" },
                    { id: "ppu" as ClientServicingModule, label: "PPU" },
                    { id: "mngt" as ClientServicingModule, label: "MNGT" },
                  ].map(module => (
                    <tr key={module.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 text-sm font-semibold text-foreground border-r border-border">{module.label}</td>
                      {["view", "create", "edit", "delete", "export"].map((action) => (
                        <td key={action} className="p-3 text-center border-r border-border last:border-0">
                          <label className="cursor-pointer flex items-center justify-center w-full h-full">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-border text-[#F4C542] focus:ring-[#F4C542]"
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

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={savePermissions}
                className="px-4 py-2 text-sm font-bold bg-[#F4C542] text-black rounded-lg shadow hover:bg-[#d9af39] transition-colors"
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