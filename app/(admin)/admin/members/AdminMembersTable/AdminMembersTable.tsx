'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/styles/admin/members/AdminMembersTable/AdminMembersTable.module.css";
import { X, Camera, Upload, Shield } from "lucide-react";
import { supabase } from "@src/lib/supabase/client";

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
  relationship?: string;
  beneficiaryName?: string;
}

const RELATIONSHIP_OPTIONS = ["Spouse", "Wife", "Husband", "Mother", "Father", "Son", "Daughter", "Sister", "Brother", "Guardian", "Other"];

export default function AdminMembersTable({ initialUsers = [], currentUserRole = "Member" }: { initialUsers?: User[], currentUserRole?: string }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<ClientServicingPermissions>(defaultClientServicingPermissions);

  const [avatarUploadUser, setAvatarUploadUser] = useState<User | null>(null);
  const [avatarFileToUpload, setAvatarFileToUpload] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2>(1);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const roles = ["Admin", "Manager", "Intern", "Member"];
  const departments = ["ASA", "BSA", "CSA", "DSA"];

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
        client_servicing_permissions: user.client_servicing_permissions,
        relationship: user.relationship || "",
        beneficiary_name: user.beneficiaryName || ""
      })
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errData = contentType?.includes("application/json") ? await res.json() : null;
      console.error("API Error:", errData);
      throw new Error(errData?.error ?? `Unable to save (${res.status})`);
    }

    return res.json();
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WebP are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB.");
      return;
    }
    setUploadError("");
    setAvatarFileToUpload(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmAvatarUpload = async () => {
    if (!avatarFileToUpload || !avatarUploadUser) return;
    setUploadingAvatar(true);
    setUploadError("");
    try {
      const fileExt = avatarFileToUpload.name.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = Date.now();
      const path = `${avatarUploadUser.id}/${timestamp}.${fileExt}`;

      const { error: storageError } = await supabase.storage.from("avatars").upload(path, avatarFileToUpload, {
        upsert: false,
        contentType: avatarFileToUpload.type,
      });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from("profiles").update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", avatarUploadUser.id);
      if (dbError) throw dbError;

      setUsers(prev => prev.map(u => u.id === avatarUploadUser.id ? { ...u, avatar: publicUrl } : u));

      alert("Profile picture updated successfully.");
      setAvatarUploadUser(null);
      setAvatarFileToUpload(null);
      setAvatarPreviewUrl(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to update profile picture.");
    } finally {
      setUploadingAvatar(false);
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

  const pendingUsers = useMemo(() => users.filter(u => u.status === "Pending"), [users]);

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

      {pendingUsers.length > 0 && (
        <div className="mx-6 mt-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm">Action Required: Pending Approvals</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">There {pendingUsers.length === 1 ? "is 1 member" : `are ${pendingUsers.length} members`} waiting for administrator approval.</p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("Pending")}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            Review Now
          </button>
        </div>
      )}

      <div className={styles.card_8}>
        <div className={styles.div_9}>
          <table className={styles.text_10}>
            <thead>
              <tr className={styles.table_11}>
                <th className={styles.div_12}>Member</th>
                <th className={styles.div_14}>Role</th>
                <th className={styles.div_15}>Department</th>
                <th className={styles.div_16}>Status</th>
                <th className={styles.div_16}>Relationship</th>
                <th className={styles.div_16}>Beneficiary</th>
                <th className={styles.div_16}>Client Servicing</th>
                <th className={styles.text_17}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.card_18}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.text_19}>No database profiles mapped to parameters.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={styles.table_20}>
                    <td className={styles.div_21}>
                      <div className={styles.container_22} onClick={() => router.push(`/admin/users/${u.id}`)}>
                        <div className="relative flex items-center justify-center shrink-0 group">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className={styles.div_23}
                              onError={(e) => {
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
                          <div className="flex items-center gap-2">
                            <span className={styles.table_26}>{u.name}</span>
                            {u.status === "Pending" && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider">New</span>
                            )}
                          </div>
                          <span className={styles.table_27}>{u.email}</span>
                          {u.relationship && u.beneficiaryName && (
                            <span className="block text-[11px] text-muted-foreground italic mt-0.5">
                              ({u.beneficiaryName}'s {u.relationship})
                            </span>
                          )}
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
                      <select
                        value={u.relationship || ""}
                        onChange={(e) => handleUpdateUser(u.id, "relationship", e.target.value)}
                        className={styles.card_32}
                      >
                        <option value="">-</option>
                        {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className={styles.div_33}>
                      <input
                        type="text"
                        placeholder="-"
                        defaultValue={u.beneficiaryName || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (u.beneficiaryName || "")) {
                            handleUpdateUser(u.id, "beneficiaryName", e.target.value);
                          }
                        }}
                        className={styles.card_3}
                      />
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
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                          className={styles.card_35}
                        >
                          View Profile
                        </button>
                        {currentUserRole === "Admin" && (
                          <button
                            onClick={() => {
                              setAvatarUploadUser(u);
                              setUploadStep(1);
                              setAvatarFileToUpload(null);
                              setAvatarPreviewUrl(null);
                              setUploadError("");
                            }}
                            className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold rounded transition-colors"
                          >
                            Edit Avatar
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
      </div>

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

      {avatarUploadUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col">

            {uploadStep === 1 && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Update Profile Picture</h3>
                    <p className="text-sm text-muted-foreground mt-1">Upload a new profile photo for this member.</p>
                  </div>
                  <button onClick={() => setAvatarUploadUser(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex gap-6 mb-6">
                  <div className="flex-1 flex flex-col items-center text-center">
                    <span className="text-sm font-semibold text-muted-foreground mb-3">Current Avatar</span>
                    {avatarUploadUser.avatar ? (
                      <img src={avatarUploadUser.avatar} alt="Current" className="w-24 h-24 rounded-full object-cover border-4 border-muted" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border-4 border-border">
                        {getInitials(avatarUploadUser.name)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center text-center border-l border-border pl-6">
                    <span className="text-sm font-semibold text-muted-foreground mb-3">New Avatar Preview</span>
                    {avatarPreviewUrl ? (
                      <img src={avatarPreviewUrl} alt="New Preview" className="w-24 h-24 rounded-full object-cover border-4 border-[#F4C542]" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted/50 border-4 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Camera size={24} opacity={0.5} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    className="w-full py-2 border-2 border-dashed border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={16} /> Choose File
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Supported: JPG, JPEG, PNG, WEBP. Max: 5MB.</p>
                </div>

                {uploadError && <p className="text-red-500 text-xs text-center mb-4">{uploadError}</p>}

                <div className="flex items-center gap-3 w-full border-t border-border pt-4">
                  <button
                    onClick={() => setAvatarUploadUser(null)}
                    className="flex-1 py-2 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setUploadStep(2)}
                    disabled={!avatarPreviewUrl}
                    className="flex-1 py-2 text-sm font-bold bg-[#F4C542] text-black rounded-lg hover:bg-[#d9af39] transition-colors disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {uploadStep === 2 && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-foreground">Confirm Avatar Update</h3>
                </div>

                <div className="mb-4 text-center">
                  <p className="text-sm text-foreground">Member: <strong className="font-bold">{avatarUploadUser.name}</strong></p>
                </div>

                <div className="flex items-center justify-center gap-4 mb-6">
                  {avatarUploadUser.avatar ? (
                    <img src={avatarUploadUser.avatar} alt="Current" className="w-16 h-16 rounded-full object-cover border-2 border-muted" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground border-2 border-border">
                      {getInitials(avatarUploadUser.name)}
                    </div>
                  )}

                  <span className="text-muted-foreground">→</span>

                  <img src={avatarPreviewUrl!} alt="New" className="w-16 h-16 rounded-full object-cover border-2 border-[#F4C542]" />
                </div>

                <p className="text-sm text-center text-muted-foreground mb-6">Are you sure you want to update this profile picture?</p>
                {uploadError && <p className="text-red-500 text-xs text-center mb-4">{uploadError}</p>}

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setUploadStep(1)}
                    disabled={uploadingAvatar}
                    className="flex-1 py-2 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmAvatarUpload}
                    disabled={uploadingAvatar}
                    className="flex-1 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-black/80 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? "Uploading..." : "Confirm Update"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      <input
        ref={avatarFileRef}
        type="file"
        accept="image/jpeg, image/jpg, image/png, image/webp"
        className="hidden"
        onChange={handleAvatarSelect}
      />
    </div>
  );
}