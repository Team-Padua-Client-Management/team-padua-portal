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
    <div className={styles.tableWrapper}>
      <div className={styles.filterBar}>
        <div className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filtersGroup}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div className={styles.pendingBanner}>
          <div className={styles.pendingBannerContent}>
            <div className={styles.pendingBannerIcon}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className={styles.pendingBannerTitle}>Action Required: Pending Approvals</h3>
              <p className={styles.pendingBannerDesc}>There {pendingUsers.length === 1 ? "is 1 member" : `are ${pendingUsers.length} members`} waiting for administrator approval.</p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("Pending")}
            className={styles.pendingBannerBtn}
          >
            Review Now
          </button>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableScrollArea}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                <th className={styles.th}>Member</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Relationship</th>
                <th className={styles.th}>Beneficiary</th>
                <th className={styles.th}>Client Servicing</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyStateTd}>No database profiles mapped to parameters.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.memberFlex} onClick={() => router.push(`/admin/users/${u.id}`)}>
                        <div className={styles.avatarWrap}>
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className={styles.avatarImg}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallbackEl) fallbackEl.style.display = 'flex';
                              }}
                            />
                          ) : null}

                          <div
                            className={styles.avatarFallback}
                            style={{ display: u.avatar ? 'none' : 'flex' }}
                          >
                            {getInitials(u.name)}
                          </div>
                        </div>

                        <div className={styles.memberMeta}>
                          <div className={styles.memberNameRow}>
                            <span className={styles.memberName}>{u.name}</span>
                            {u.status === "Pending" && (
                              <span className={styles.newBadge}>New</span>
                            )}
                          </div>
                          <span className={styles.memberEmail}>{u.email}</span>
                          {u.relationship && u.beneficiaryName && (
                            <span className={styles.memberRelationship}>
                              ({u.beneficiaryName}&apos;s {u.relationship})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, "role", e.target.value)}
                        className={styles.roleSelect}
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className={styles.td}>
                      <select
                        value={u.department}
                        onChange={(e) => handleUpdateUser(u.id, "department", e.target.value)}
                        className={styles.deptSelect}
                      >
                        <option value="">None</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${u.status === "Active" ? styles.statusActive :
                          u.status === "Pending" ? styles.statusPending : styles.statusDisabled
                        }`}>
                        <span className={`${styles.statusDot} ${u.status === "Active" ? styles.dotActive :
                            u.status === "Pending" ? styles.dotPending : styles.dotDisabled
                          }`} />
                        {u.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <select
                        value={u.relationship || ""}
                        onChange={(e) => handleUpdateUser(u.id, "relationship", e.target.value)}
                        className={styles.deptSelect}
                      >
                        <option value="">-</option>
                        {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className={styles.td}>
                      <input
                        type="text"
                        placeholder="-"
                        defaultValue={u.beneficiaryName || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (u.beneficiaryName || "")) {
                            handleUpdateUser(u.id, "beneficiaryName", e.target.value);
                          }
                        }}
                        className={styles.searchInput}
                      />
                    </td>
                    <td className={styles.td}>
                      <div className={styles.permissionsCell}>
                        <div className={styles.permissionChipsGroup}>
                          {u.client_servicing_permissions?.cpst?.view && <span className={styles.permissionChip}>☑ CPST</span>}
                          {u.client_servicing_permissions?.acr?.view && <span className={styles.permissionChip}>☑ ACR</span>}
                          {u.client_servicing_permissions?.fst?.view && <span className={styles.permissionChip}>☑ FST</span>}
                          {u.client_servicing_permissions?.cpc?.view && <span className={styles.permissionChip}>☑ CPC</span>}
                          {u.client_servicing_permissions?.ppu?.view && <span className={styles.permissionChip}>☑ PPU</span>}
                          {u.client_servicing_permissions?.mngt?.view && <span className={styles.permissionChip}>☑ MNGT</span>}
                        </div>
                        <button
                          onClick={() => openModal(u)}
                          className={styles.editPermissionsBtn}
                        >
                          Edit Permissions →
                        </button>
                      </div>
                    </td>
                    <td className={styles.tdRight}>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                          className={styles.viewProfileBtn}
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
                            className={styles.editAvatarBtn}
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Client Servicing Access Manager</h3>
                <p className={styles.modalSubtitle}>{selectedUser.name}</p>
              </div>
              <button onClick={closeModal} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <table className={styles.modalTable}>
                <thead>
                  <tr className={styles.modalTableHead}>
                    <th className={styles.modalTh}>Module</th>
                    <th className={styles.modalThCenter}>View</th>
                    <th className={styles.modalThCenter}>Create</th>
                    <th className={styles.modalThCenter}>Edit</th>
                    <th className={styles.modalThCenter}>Delete</th>
                    <th className={styles.modalThCenter}>Export</th>
                  </tr>
                </thead>
                <tbody className={styles.modalTableBody}>
                  {[
                    { id: "cpst" as ClientServicingModule, label: "CPST" },
                    { id: "acr" as ClientServicingModule, label: "ACR" },
                    { id: "fst" as ClientServicingModule, label: "FST" },
                    { id: "cpc" as ClientServicingModule, label: "CPC" },
                    { id: "ppu" as ClientServicingModule, label: "PPU" },
                    { id: "mngt" as ClientServicingModule, label: "MNGT" },
                  ].map(module => (
                    <tr key={module.id} className={styles.modalTr}>
                      <td className={styles.modalTdModule}>{module.label}</td>
                      {["view", "create", "edit", "delete", "export"].map((action) => (
                        <td key={action} className={styles.modalTdCheck}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
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

            <div className={styles.modalFooter}>
              <button
                onClick={closeModal}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className={styles.modalSaveBtn}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {avatarUploadUser && (
        <div className={styles.modalOverlay} style={{ zIndex: 60 }}>
          <div className={styles.avatarModalCard}>

            {uploadStep === 1 && (
              <>
                <div className={styles.avatarModalHeader}>
                  <div>
                    <h3 className={styles.modalTitle}>Update Profile Picture</h3>
                    <p className={styles.modalSubtitle}>Upload a new profile photo for this member.</p>
                  </div>
                  <button onClick={() => setAvatarUploadUser(null)} className={styles.modalCloseBtn}>
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.avatarPreviewRow}>
                  <div className={styles.avatarPreviewCol}>
                    <span className={styles.avatarPreviewLabel}>Current Avatar</span>
                    {avatarUploadUser.avatar ? (
                      <img src={avatarUploadUser.avatar} alt="Current" className={styles.avatarPreviewImg} />
                    ) : (
                      <div className={styles.avatarPreviewFallback}>
                        {getInitials(avatarUploadUser.name)}
                      </div>
                    )}
                  </div>

                  <div className={styles.avatarPreviewColRight}>
                    <span className={styles.avatarPreviewLabel}>New Avatar Preview</span>
                    {avatarPreviewUrl ? (
                      <img src={avatarPreviewUrl} alt="New Preview" className={styles.avatarPreviewImgNew} />
                    ) : (
                      <div className={styles.avatarPreviewEmpty}>
                        <Camera size={24} opacity={0.5} />
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.avatarUploadArea}>
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    className={styles.avatarUploadBtn}
                  >
                    <Upload size={16} /> Choose File
                  </button>
                  <p className={styles.avatarUploadHint}>Supported: JPG, JPEG, PNG, WEBP. Max: 5MB.</p>
                </div>

                {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

                <div className={styles.avatarFooter}>
                  <button
                    onClick={() => setAvatarUploadUser(null)}
                    className={styles.modalCancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setUploadStep(2)}
                    disabled={!avatarPreviewUrl}
                    className={styles.modalSaveBtn}
                    style={{ opacity: !avatarPreviewUrl ? 0.5 : 1 }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {uploadStep === 2 && (
              <>
                <div className={styles.avatarModalHeader}>
                  <h3 className={styles.modalTitle}>Confirm Avatar Update</h3>
                </div>

                <div className={styles.confirmMemberInfo}>
                  <p className={styles.confirmMemberText}>Member: <strong>{avatarUploadUser.name}</strong></p>
                </div>

                <div className={styles.confirmPreviewRow}>
                  {avatarUploadUser.avatar ? (
                    <img src={avatarUploadUser.avatar} alt="Current" className={styles.confirmPreviewSmall} />
                  ) : (
                    <div className={styles.confirmPreviewFallback}>
                      {getInitials(avatarUploadUser.name)}
                    </div>
                  )}

                  <span className={styles.confirmArrow}>→</span>

                  <img src={avatarPreviewUrl!} alt="New" className={styles.confirmPreviewSmallNew} />
                </div>

                <p className={styles.confirmText}>Are you sure you want to update this profile picture?</p>
                {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

                <div className={styles.avatarFooter}>
                  <button
                    onClick={() => setUploadStep(1)}
                    disabled={uploadingAvatar}
                    className={styles.modalCancelBtn}
                    style={{ opacity: uploadingAvatar ? 0.5 : 1 }}
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmAvatarUpload}
                    disabled={uploadingAvatar}
                    className={styles.confirmUploadBtn}
                    style={{ opacity: uploadingAvatar ? 0.5 : 1 }}
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