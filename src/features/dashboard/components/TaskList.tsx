import React, { useMemo } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, ChevronRight, Trash2 } from 'lucide-react';
import { TaskItem, normalizeCategory } from './TaskRow';
import UserAvatar, { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

// ─── Category metadata ────────────────────────────────────────────────────────
// Each entry maps a short badge key to its display title, color, and admin route.
// href: null means there is no dedicated page for that category.

interface CategoryMeta {
  badge: string;
  title: string;
  accent: string;
  tint: string;
  href: string | null;
}

const KNOWN_CATEGORIES: CategoryMeta[] = [
  { badge: 'ACR',       title: 'Advisor Change Request',                  accent: '#4F46E5', tint: 'rgba(79, 70, 229, 0.12)',   href: '/admin/acr'               },
  { badge: 'BCR',       title: 'Beneficiary Change Request',               accent: '#2563EB', tint: 'rgba(37, 99, 235, 0.12)',   href: '/admin/bcr'               },
  { badge: 'FSR',       title: 'Fund Switching Request',                   accent: '#059669', tint: 'rgba(5, 150, 105, 0.12)',   href: '/admin/fund-switching'    },
  { badge: 'FW',        title: 'Fund Withdrawal Request',                  accent: '#10B981', tint: 'rgba(16, 185, 129, 0.12)',  href: '/admin/fund-withdrawal'   },
  { badge: 'ACA',       title: 'Auto Credits Arrangement',                 accent: '#7C3AED', tint: 'rgba(124, 58, 237, 0.12)',  href: '/admin/aca'               },
  { badge: 'ADA / MOA', title: 'Auto Debit Arrangement',                   accent: '#8B5CF6', tint: 'rgba(139, 92, 246, 0.12)',  href: '/admin/ada'               },
  { badge: 'SRO',       title: 'Reinstatement (SRO)',                      accent: '#D97706', tint: 'rgba(217, 119, 6, 0.12)',   href: '/admin/reinstatement-sro' },
  { badge: 'PPI',       title: 'Reinstatement (PPI)',                      accent: '#EA580C', tint: 'rgba(234, 88, 12, 0.12)',   href: '/admin/reinstatement-pdi' },
  { badge: 'CPST',      title: 'Client Policy Status Tracking',            accent: '#0D9488', tint: 'rgba(13, 148, 136, 0.12)',  href: '/admin/cpst'              },
  { badge: 'CSMV',      title: 'Client Servicing Monitoring Verification', accent: '#099268', tint: 'rgba(9, 146, 104, 0.12)',   href: '/admin/csmv'              },
  { badge: 'CPC',       title: 'Client Policy Card',                       accent: '#0369A1', tint: 'rgba(3, 105, 161, 0.12)',   href: null                       },
  { badge: 'Inquiry',   title: 'Inquiry',                                  accent: '#C9962E', tint: 'rgba(201, 150, 46, 0.12)',  href: null                       },
  { badge: 'Others',    title: 'Others / Miscellaneous',                   accent: '#71717A', tint: 'rgba(113, 113, 122, 0.12)', href: null                       },
];

/** Map a normalized full-category string back to a short badge key. */
function getBadgeFromNormalized(normalized: string): string {
  if (normalized.startsWith('ACR'))                                    return 'ACR';
  if (normalized.startsWith('BCR'))                                    return 'BCR';
  if (normalized.startsWith('FSR'))                                    return 'FSR';
  if (normalized.startsWith('FW'))                                     return 'FW';
  if (normalized.startsWith('ACA'))                                    return 'ACA';
  if (normalized.startsWith('ADA') || normalized.startsWith('MOA'))   return 'ADA / MOA';
  if (normalized.startsWith('SRO'))                                    return 'SRO';
  if (normalized.startsWith('PPI') || normalized.startsWith('PDI'))   return 'PPI';
  if (normalized.startsWith('CPC'))                                    return 'CPC';
  if (normalized.startsWith('CPST'))                                   return 'CPST';
  if (normalized.startsWith('CSMV'))                                   return 'CSMV';
  if (normalized.toLowerCase().startsWith('inquiry'))                  return 'Inquiry';
  return normalized.split(' - ')[0].trim() || normalized;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskListProps {
  tasks: TaskItem[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onCreateTask: () => void;
  onToggleComplete: (task: TaskItem) => void;
  onSelectTask: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Partial<TaskItem>) => void;
  onDeleteTask?: (taskId: string) => void;
  isUserView?: boolean;
}

// ─── Category Row ─────────────────────────────────────────────────────────────
// Clicking navigates to the dedicated admin page for that category.
// No inline expansion — the dropdown and task list are on the target page.

interface CategoryRowProps {
  meta: CategoryMeta;
  count: number;
  assignedProfiles: UserProfile[];
  categoryTasks: TaskItem[];
  onDeleteTask?: (taskId: string) => void;
}

function CategoryRow({ meta, count, assignedProfiles, categoryTasks, onDeleteTask }: CategoryRowProps) {
  const displayTitle = `${meta.title} (${meta.badge})`;

  const rowContent = (
    <>
      {/* Col 1 — Count */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0',
          fontSize: '28px',
          fontWeight: 800,
          color: meta.accent,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.03em',
          borderRight: '1px solid var(--border)',
          backgroundColor: 'rgba(0, 0, 0, 0.01)',
        }}
      >
        {count}
      </span>

      {/* Col 2 — Full title with badge abbreviation */}
      <span
        style={{
          padding: '16px 20px',
          fontSize: '15.5px',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayTitle}
      </span>

      {/* Col 3 — Overlapping Assigned To Avatars */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0 12px',
        }}
      >
        {assignedProfiles.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', flexFlow: 'row-reverse' }}>
            {assignedProfiles.slice(0, 4).map((profile, i) => (
              <div
                key={profile.id}
                style={{
                  marginRight: i === 0 ? '0' : '-8px',
                  zIndex: i,
                  position: 'relative',
                  border: '2px solid var(--surface)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  background: 'var(--surface)',
                }}
              >
                <UserAvatar profile={profile} size={28} showTooltip={true} />
              </div>
            ))}
            {assignedProfiles.length > 4 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-muted)',
                  border: '2px solid var(--surface)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  zIndex: 5,
                  marginRight: '-8px',
                }}
                title={`${assignedProfiles.length - 4} more assigned`}
              >
                +{assignedProfiles.length - 4}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Unassigned</span>
        )}
      </span>

      {/* Col 4 — Arrow (only when clickable) */}
      {meta.href && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 20px',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
            transition: 'color 0.15s ease, transform 0.15s ease',
          }}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </span>
      )}
    </>
  );

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: meta.href ? '68px 1fr auto auto' : '68px 1fr auto',
    alignItems: 'center',
    width: '100%',
    borderLeft: `4px solid ${meta.accent}`,
  };

  const wrapperStyle: React.CSSProperties = {
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    overflow: 'hidden',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  };

  if (meta.href) {
    return (
      <div style={wrapperStyle} className="group">
        <Link
          href={meta.href}
          style={{
            ...gridStyle,
            textDecoration: 'none',
            display: 'grid',
          }}
          className="hover:bg-surface-2/60 transition-colors"
        >
          {rowContent}
        </Link>
      </div>
    );
  }

  // No route — render as plain row with sub-list of tasks for inline management (deletion)
  return (
    <div style={wrapperStyle}>
      <div style={{ ...gridStyle, display: 'grid' }}>
        {rowContent}
      </div>
      {categoryTasks.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '8px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'var(--bg-muted)',
          }}
        >
          {categoryTasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                {task.title || 'Untitled Task'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserAvatar
                  profile={assignedProfiles.find(p => p.id === task.assigned_to) || null}
                  size={20}
                />
                <button
                  type="button"
                  onClick={() => onDeleteTask?.(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="hover:text-red-500 hover:bg-red-50"
                  title="Delete Task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function TaskList({
  tasks,
  allProfiles,
  bizDevProfiles,
  onCreateTask,
  onToggleComplete: _onToggleComplete,
  onSelectTask: _onSelectTask,
  onSaveTaskField: _onSaveTaskField,
  onDeleteTask,
  isUserView = false,
}: TaskListProps) {

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  /** Group tasks by badge key — computed from existing userTasks, no DB calls. */
  const categoryGroups = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const task of tasks) {
      const normalized = normalizeCategory(task.category);
      const badge = getBadgeFromNormalized(normalized);
      if (!map.has(badge)) {
        map.set(badge, []);
      }
      map.get(badge)!.push(task);
    }
    return map;
  }, [tasks]);

  /**
   * Build ordered display rows:
   *  1. Known categories in fixed order (only those with records)
   *  2. Any future/unknown categories discovered dynamically
   */
  const displayRows = useMemo(() => {
    const knownBadges = new Set(KNOWN_CATEGORIES.map((c) => c.badge));
    const rows: Array<{ meta: CategoryMeta; count: number; assignedProfiles: UserProfile[]; categoryTasks: TaskItem[] }> = [];

    for (const meta of KNOWN_CATEGORIES) {
      const catTasks = categoryGroups.get(meta.badge) || [];
      if (catTasks.length > 0) {
        const profileIds = Array.from(new Set(catTasks.map((t) => t.assigned_to).filter(Boolean))) as string[];
        const profiles = profileIds.map(findProfileById).filter(Boolean) as UserProfile[];
        rows.push({ meta, count: catTasks.length, assignedProfiles: profiles, categoryTasks: catTasks });
      }
    }

    for (const [badge, catTasks] of categoryGroups.entries()) {
      if (!knownBadges.has(badge) && catTasks.length > 0) {
        const profileIds = Array.from(new Set(catTasks.map((t) => t.assigned_to).filter(Boolean))) as string[];
        const profiles = profileIds.map(findProfileById).filter(Boolean) as UserProfile[];
        rows.push({
          meta: { badge, title: badge, accent: '#C9962E', tint: 'rgba(201, 150, 46, 0.12)', href: null },
          count: catTasks.length,
          assignedProfiles: profiles,
          categoryTasks: catTasks,
        });
      }
    }

    return rows;
  }, [categoryGroups, allProfiles, bizDevProfiles]);

  const totalLogged = tasks.length;

  return (
    <div className={styles.monitoringCard}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
        <div className="flex items-center gap-2.5">
          <LayoutGrid size={20} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300 shrink-0" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
            Client Servicing Monitoring
          </h1>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          {/* Dynamic total */}
          <span className="text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="text-[22px] font-extrabold mr-1.5"
              style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {totalLogged}
            </span>
            Total Logged Request{totalLogged !== 1 ? 's' : ''}
          </span>

          {/* Log Request button — reuses existing onCreateTask workflow unchanged */}
          {!isUserView && (
            <button
              type="button"
              onClick={onCreateTask}
              className={`${styles.newTaskBtn} !py-1.5 !px-4 !text-[13px]`}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="font-bold">Log Request</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Category Summary Rows ──────────────────────────────── */}
      <div
        className={styles.dashboardCardBody}
        style={{ padding: '0 16px 16px', gap: '8px' }}
      >
        {totalLogged === 0 ? (
          <div
            className={styles.emptyStateContainer}
            onClick={!isUserView ? onCreateTask : undefined}
            style={{ cursor: !isUserView ? 'pointer' : 'default' }}
          >
            <div className={styles.emptyStateIcon}>📋</div>
            <div className={styles.emptyStateTitle}>No requests logged yet</div>
            <div className={styles.emptyStateDescription}>
              {!isUserView
                ? 'Click "Log Request" to record your first client servicing request.'
                : 'No client servicing requests have been logged.'}
            </div>
          </div>
        ) : (
          displayRows.map(({ meta, count, assignedProfiles, categoryTasks }) => (
            <CategoryRow
              key={meta.badge}
              meta={meta}
              count={count}
              assignedProfiles={assignedProfiles}
              categoryTasks={categoryTasks}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}


