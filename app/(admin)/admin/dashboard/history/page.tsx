'use client';

import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import styles from "@/styles/admin/dashboard/page.module.css";
import { History, ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';

import { useAdminDashboard } from '@src/features/dashboard/hooks/useAdminDashboard';
import { containerVariants, itemVariants, itemVariantsReduced } from '@src/features/dashboard/constants';
import {
  parseTaskMetadata,
  PURPLE,
  type WorkflowTaskItem,
} from '@src/features/dashboard/components/TaskList';

export default function HistoryPage() {
  const { userTasks } = useAdminDashboard();
  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Cast to WorkflowTaskItem so workflow_status is typed correctly
  const workflowTasks = userTasks as WorkflowTaskItem[];

  const historyTasks = useMemo(() => {
    return workflowTasks
      .filter((t) => {
        const meta = parseTaskMetadata(t.notes || '');
        const matchesSearch =
          t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meta.cmgc_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
  }, [workflowTasks, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(workflowTasks.map((t) => t.category));
    return ['All', ...Array.from(cats).filter(Boolean)];
  }, [workflowTasks]);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.mainCol}>
        <Header />
        <motion.main className={styles.content} variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={fadeVariants} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 24px' }}>
              <Link
                href="/admin/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s',
                }}
                className="hover:bg-surface-2 hover:text-text"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
              <h1
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <History size={24} color={PURPLE} /> Request History
              </h1>
            </div>

            {/* Search + filter */}
            <div style={{ padding: '0 24px', display: 'flex', gap: '16px' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '0 16px',
                  gap: '12px',
                }}
              >
                <Search size={18} color="var(--text-tertiary)" />
                <input
                  type="text"
                  placeholder="Search requests by title or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '14px 0',
                    fontSize: '15px',
                    color: 'var(--text)',
                    fontWeight: 500,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '0 16px',
                  gap: '12px',
                }}
              >
                <Filter size={18} color="var(--text-tertiary)" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '14px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 24px' }}>
              <div
                style={{
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                      {['Request Title', 'Client / CMGC Name', 'Category', 'Status', 'Date Created'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '16px 20px',
                            textAlign: 'left',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyTasks.length > 0 ? (
                      historyTasks.map((task) => {
                        const meta = parseTaskMetadata(task.notes || '');
                        const isApproved =
                          task.workflow_status === 'Approved Request' ||
                          task.workflow_status === 'Done';
                        return (
                          <tr
                            key={task.id}
                            style={{ borderBottom: '1px solid var(--border)' }}
                            className="hover:bg-surface-2 transition-colors"
                          >
                            <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                              {task.title || meta.inquiry_concern || 'Untitled Request'}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                              {meta.cmgc_name || 'N/A'}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  background: 'var(--surface-3)',
                                  color: 'var(--text)',
                                }}
                              >
                                {task.category || 'Uncategorized'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  background: isApproved
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : 'rgba(234, 179, 8, 0.15)',
                                  color: isApproved ? '#166534' : '#854d0e',
                                }}
                              >
                                {task.workflow_status || 'Submitted Request'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                              {task.created_at
                                ? new Date(task.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                                : 'Unknown'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: 'var(--text-tertiary)',
                            fontSize: '15px',
                          }}
                        >
                          No requests found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}
