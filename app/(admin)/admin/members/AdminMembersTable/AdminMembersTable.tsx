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

;

import styles from "@/styles/admin/members/AdminMembersTable/AdminMembersTable.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface User {
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
}

/**
 * AdminMembersTable
 *
 * Renders the AdminMembersTable interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminMembersTable.
 *
 * @param { initialUsers = [] }: { initialUsers?: User[] }
 * @returns State operations sequence.
 */
export default function AdminMembersTable({ initialUsers = [] }: { initialUsers?: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();

  const roles = ["Administrator", "Manager", "Intern", "Member"];
  const departments = ["ASA", "BSA", "CSA", "DSA"];

  /**
 * Executes operations logic for saveUser.
 *
 * @param user: User
 * @returns State operations sequence.
 */
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
        birthday: user.birthday || "",
        address: user.address || ""
      })
    });

    if (!res.ok) {
      throw new Error("Unable to save");
    }

    return await res.json();
  };

  /**
 * Executes operations logic for handleUpdateUser.
 *
 * @param id: string, key: keyof User, value: string
 * @returns State operations sequence.
 */
const handleUpdateUser = async (id: string, key: keyof User, value: string) => {
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
      alert("Failed to save assignment changes.");
      setUsers(prev =>
        prev.map(u => u.id === id ? targetUser : u)
      );
    }
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
                <th className={styles.div_13}>Employee ID</th>
                <th className={styles.div_14}>Role</th>
                <th className={styles.div_15}>Department</th>
                <th className={styles.div_16}>Status</th>
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
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className={styles.div_23} />
                        ) : (
                          <div className={styles.text_24}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={styles.div_25}>
                          <span className={styles.table_26}>{u.name}</span>
                          <span className={styles.table_27}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.table_28}>{u.employeeId || "—"}</td>
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
                      <span className={`${styles.text_36} ${
                        u.status === "Active" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-[#4ade80]" :
                        u.status === "Pending" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-[#fef08a]" : "bg-muted text-muted-foreground"
                      }`}>
                        <span className={`${styles.div_37} ${u.status === "Active" ? "bg-emerald-500" : u.status === "Pending" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                        {u.status}
                      </span>
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
    </div>
  );
}
