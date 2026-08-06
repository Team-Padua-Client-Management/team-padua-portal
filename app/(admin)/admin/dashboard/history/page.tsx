'use client';

import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import styles from "@/styles/admin/dashboard/page.module.css";
import { History, ArrowLeft, Search, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';

import { useAdminDashboard } from '@src/features/dashboard/hooks/useAdminDashboard';
import { containerVariants, itemVariants, itemVariantsReduced } from '@src/features/dashboard/constants';
import { normalizeCategory } from '@src/features/dashboard/components/TaskRow';
import type { UserProfile } from '@src/features/dashboard/components/UserAvatar';
import {
  parseTaskMetadata,
  PURPLE,
  DEFAULT_WORKFLOW_STATUS,
  DEFAULT_POLICY_RELATIONSHIP,
  KNOWN_CATEGORIES,
  type WorkflowTaskItem,
} from '@src/features/dashboard/components/TaskList';

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getWorkflowStatusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('approv')) {
    return { bg: 'rgba(34, 197, 94, 0.15)', color: '#166534' };
  }
  if (normalized.includes('pending')) {
    return { bg: 'rgba(234, 179, 8, 0.15)', color: '#854d0e' };
  }
  return { bg: 'rgba(109, 40, 217, 0.12)', color: PURPLE };
}

function getCategoryMeta(category?: string | null) {
  const raw = category || 'Others';
  const known = KNOWN_CATEGORIES.find((c) => c.badge === raw);
  if (known) {
    return {
      badge: known.badge,
      title: known.title,
      accent: known.accent,
      tint: known.tint,
    };
  }
  return {
    badge: raw,
    title: raw,
    accent: PURPLE,
    tint: 'rgba(109, 40, 217, 0.10)',
  };
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
      <span
        style={{
          fontSize: '10.5px',
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={typeof value === 'string' ? value : undefined}
      >
        {value ?? 'N/A'}
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const { userTasks, allProfiles, bizDevProfiles } = useAdminDashboard();
  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  const workflowTasks = userTasks as WorkflowTaskItem[];

  const profiles: UserProfile[] = useMemo(
    () => [...(allProfiles || []), ...(bizDevProfiles || [])],
    [allProfiles, bizDevProfiles]
  );

  const findProfileById = (id: string | null | undefined): UserProfile | null => {
    if (!id) return null;
    return profiles.find((p) => p.id === id) || null;
  };

  const servicingTasks = useMemo(
    () => workflowTasks.filter((t) => normalizeCategory(t.category) !== 'Inquiry'),
    [workflowTasks]
  );

  const historyTasks = useMemo(() => {
    return servicingTasks
      .filter((t) => {
        const meta = parseTaskMetadata(t.notes || '');
        const haystack = `${t.title || ''} ${meta.policy_owner || ''} ${meta.policy_insured || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
  }, [servicingTasks, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(servicingTasks.map((t) => t.category));
    return ['All', ...Array.from(cats).filter(Boolean)];
  }, [servicingTasks]);

  const toggleTimeline = (taskId: string) => {
    setExpandedTimelines((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.mainCol}>
        <Header />
        <motion.main className={styles.content} variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={fadeVariants} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

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
                  placeholder="Search requests by policy owner or insured..."
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
                  {categories.map((cat) => {
                    const label = cat === 'All' ? 'All' : getCategoryMeta(cat).title;
                    return (
                      <option key={cat} value={cat}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {historyTasks.length > 0 ? (
                historyTasks.map((task) => {
                  const meta = parseTaskMetadata(task.notes || '');
                  const workflowStatus = meta.workflow_status || task.workflow_status || DEFAULT_WORKFLOW_STATUS;
                  const statusColor = getWorkflowStatusColor(workflowStatus);
                  const relationship = meta.policy_insured_relationship || DEFAULT_POLICY_RELATIONSHIP;
                  const showInsured = relationship === 'DIFFERENT_FROM_OWNER' && meta.policy_insured;
                  const processedBy = findProfileById(task.processed_by);
                  const assignedTo = findProfileById(task.assigned_to);
                  const categoryMeta = getCategoryMeta(task.category);
                  const hasTimeline = !!(meta.timeline && meta.timeline.trim().length > 0);
                  const isTimelineOpen = !!expandedTimelines[task.id];

                  return (
                    <div
                      key={task.id}
                      style={{
                        background: 'var(--surface)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        padding: '22px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '16px',
                          paddingBottom: '16px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span
                            style={{
                              fontSize: '19px',
                              fontWeight: 800,
                              color: categoryMeta.accent,
                              lineHeight: 1.2,
                            }}
                          >
                            {categoryMeta.badge}
                          </span>
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {categoryMeta.title}
                          </span>
                        </div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 14px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: statusColor.bg,
                            color: statusColor.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {workflowStatus}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                          columnGap: '20px',
                          rowGap: '18px',
                        }}
                      >
                        <InfoField label="Policy Owner" value={meta.policy_owner} />
                        <InfoField label="Policy Number" value={meta.policy_number} />
                        {showInsured && <InfoField label="Policy Insured" value={meta.policy_insured} />}
                        <InfoField label="Date Requested" value={formatDate(meta.date_of_request)} />
                        <InfoField label="Processed By" value={processedBy?.full_name || processedBy?.email || 'N/A'} />
                        <InfoField label="Assigned To" value={assignedTo?.full_name || assignedTo?.email || 'Unassigned'} />
                        <InfoField label="Created" value={formatDateTime(task.created_at)} />
                        <InfoField label="Updated" value={formatDateTime(task.updated_at)} />
                      </div>

                      {hasTimeline && (
                        <div
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleTimeline(task.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--bg-muted)',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Timeline / Notes
                            <ChevronDown
                              size={16}
                              style={{
                                transform: isTimelineOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                          </button>
                          {isTimelineOpen && (
                            <div
                              style={{
                                background: 'var(--bg-muted)',
                                padding: '4px 14px 14px 14px',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '220px',
                                overflowY: 'auto',
                              }}
                            >
                              {meta.timeline}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '15px',
                  }}
                >
                  No requests found matching your criteria.
                </div>
              )}
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}