import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Trash2,
  FileCheck2,
  Hourglass,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { TaskItem, normalizeCategory, formatRelativeTime } from './TaskRow';
import UserAvatar, { UserProfile } from './UserAvatar';
import { formatDisplayDate } from './ActivityCard';
import ClientServicingPreview, { PreviewRect } from './ClientServicingPreview';
import styles from '@/styles/admin/dashboard/page.module.css';

export const POLICY_RELATIONSHIP_OPTIONS = ['SAME_AS_OWNER', 'DIFFERENT_FROM_OWNER'] as const;
export type PolicyInsuredRelationship = typeof POLICY_RELATIONSHIP_OPTIONS[number];
export const DEFAULT_POLICY_RELATIONSHIP: PolicyInsuredRelationship = 'SAME_AS_OWNER';

export function policyRelationshipLabel(value: string | null | undefined): string {
  return value === 'DIFFERENT_FROM_OWNER' ? 'DIFFERENT FROM OWNER' : 'SAME AS OWNER';
}

export function parseTaskMetadata(notes: string) {
  const meta: any = { timeline: notes || '' };
  if (!notes) return meta;
  const match = notes.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    const yaml = match[1];
    meta.timeline = match[2].trim();
    yaml.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        meta[k] = v;
      }
    });
  }

  const hasPolicyData =
    meta.policy_owner !== undefined ||
    meta.policy_insured !== undefined ||
    meta.policy_insured_count !== undefined ||
    meta.policy_insured_relationship !== undefined;

  if (hasPolicyData) {
    if (meta.policy_insured_count !== undefined && meta.policy_insured_relationship === undefined) {
      meta.policy_insured_relationship = DEFAULT_POLICY_RELATIONSHIP;
      meta.policy_insured = meta.policy_owner || '';
    }

    delete meta.policy_insured_count;

    if (!meta.policy_insured_relationship) {
      meta.policy_insured_relationship = DEFAULT_POLICY_RELATIONSHIP;
    }

    if (meta.policy_insured_relationship === 'SAME_AS_OWNER') {
      meta.policy_insured = meta.policy_owner || '';
    }
  }

  return meta;
}

export function buildTaskNotes(meta: any, timeline: string) {
  let yaml = '';
  for (const k in meta) {
    if (k === 'timeline' || k === 'policy_insured_count') continue;
    if (meta[k] !== undefined && meta[k] !== null) {
      yaml += `${k}: ${meta[k]}\n`;
    }
  }
  if (!yaml) return timeline;
  return `---\n${yaml}---\n${timeline}`;
}

interface CategoryMeta {
  badge: string;
  title: string;
  accent: string;
  tint: string;
}

export const KNOWN_CATEGORIES: CategoryMeta[] = [
  { badge: 'ACA', title: 'Auto Charging Arrangement', accent: '#7C3AED', tint: 'rgba(124, 58, 237, 0.12)' },
  { badge: 'ACICR', title: 'Address and Contact Information Change Request', accent: '#D946EF', tint: 'rgba(217, 70, 239, 0.12)' },
  { badge: 'ACR', title: 'Advisor Change Request', accent: '#4F46E5', tint: 'rgba(79, 70, 229, 0.12)' },
  { badge: 'ADA / MOA', title: 'Auto Debit Arrangement', accent: '#8B5CF6', tint: 'rgba(139, 92, 246, 0.12)' },
  { badge: 'BCR', title: 'Beneficiary Change Request', accent: '#2563EB', tint: 'rgba(37, 99, 235, 0.12)' },
  { badge: 'CPC', title: 'Client Policy Card', accent: '#0369A1', tint: 'rgba(3, 105, 161, 0.12)' },
  { badge: 'CPST', title: 'Client Policy Status Tracking', accent: '#0D9488', tint: 'rgba(13, 148, 136, 0.12)' },
  { badge: 'CSMV', title: 'Client Servicing Monitoring Verification', accent: '#099268', tint: 'rgba(9, 146, 104, 0.12)' },
  { badge: 'FSR', title: 'Fund Switching Request', accent: '#059669', tint: 'rgba(5, 150, 105, 0.12)' },
  { badge: 'FW', title: 'Fund Withdrawal Request', accent: '#10B981', tint: 'rgba(16, 185, 129, 0.12)' },
  { badge: 'Others', title: 'Others / Miscellaneous', accent: '#71717A', tint: 'rgba(113, 113, 122, 0.12)' },
  { badge: 'PPI', title: 'Reinstatement (PPI)', accent: '#EA580C', tint: 'rgba(234, 88, 12, 0.12)' },
  { badge: 'SRO', title: 'Reinstatement (SRO)', accent: '#D97706', tint: 'rgba(217, 119, 6, 0.12)' },
];

function getBadgeFromNormalized(normalized: string): string {
  if (normalized.startsWith('ACA')) return 'ACA';
  if (normalized.startsWith('ACICR')) return 'ACICR';
  if (normalized.startsWith('ACR')) return 'ACR';
  if (normalized.startsWith('ADA') || normalized.startsWith('MOA')) return 'ADA / MOA';
  if (normalized.startsWith('BCR')) return 'BCR';
  if (normalized.startsWith('CPC') || normalized.startsWith('PLT')) return 'CPC';
  if (normalized.startsWith('CPST')) return 'CPST';
  if (normalized.startsWith('CSMV') || normalized.startsWith('UID')) return 'CSMV';
  if (normalized.startsWith('FSR')) return 'FSR';
  if (normalized.startsWith('FW')) return 'FW';
  if (normalized.startsWith('PPI') || normalized.startsWith('PDI')) return 'PPI';
  if (normalized.startsWith('SRO')) return 'SRO';

  return normalized.split(' - ')[0].trim() || normalized;
}

export type WorkflowStatus =
  | 'Pending for Submission'
  | 'Submitted Requests'
  | 'Submitted with Pending Requirements'
  | 'Approved Requests';

export const WORKFLOW_STATUS_OPTIONS: WorkflowStatus[] = [
  'Pending for Submission',
  'Submitted Requests',
  'Submitted with Pending Requirements',
  'Approved Requests',
];

export const DEFAULT_WORKFLOW_STATUS: WorkflowStatus = 'Pending for Submission';

export function getRemainingWorkflowOptions(current?: string | null): WorkflowStatus[] {
  const currentStatus = (current as WorkflowStatus) || DEFAULT_WORKFLOW_STATUS;
  return WORKFLOW_STATUS_OPTIONS.filter((opt) => opt !== currentStatus);
}

type WorkflowStage = 'pending_submission' | 'submitted' | 'submitted_pending' | 'approved';

export interface WorkflowTaskItem extends TaskItem {
  workflow_status?: string | null;
}

export function buildWorkflowStatusUpdate(
  task: WorkflowTaskItem,
  nextStatus: WorkflowStatus
): Partial<WorkflowTaskItem> {
  const meta = parseTaskMetadata(task.notes || '');
  const updatedMeta = { ...meta, workflow_status: nextStatus };
  const notes = buildTaskNotes(updatedMeta, updatedMeta.timeline || '');
  return { notes, workflow_status: nextStatus };
}

function getWorkflowStage(task: WorkflowTaskItem): WorkflowStage {
  const meta = parseTaskMetadata(task.notes || '');
  const rawStatus = (meta.workflow_status || task.workflow_status || DEFAULT_WORKFLOW_STATUS) as string;
  const status = rawStatus.trim().toLowerCase();
  switch (status) {
    case 'submitted requests':
      return 'submitted';
    case 'submitted with pending requirements':
      return 'submitted_pending';
    case 'approved requests':
      return 'approved';
    case 'pending for submission':
    default:
      return 'pending_submission';
  }
}

function workflowStageToStatus(stage: WorkflowStage): WorkflowStatus {
  switch (stage) {
    case 'submitted':
      return 'Submitted Requests';
    case 'submitted_pending':
      return 'Submitted with Pending Requirements';
    case 'approved':
      return 'Approved Requests';
    case 'pending_submission':
    default:
      return 'Pending for Submission';
  }
}

interface StageMeta {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const WORKFLOW_STAGES: StageMeta[] = [
  { id: 'pending_submission', label: 'Pending for Submission', icon: Clock },
  { id: 'submitted', label: 'Submitted Requests', icon: FileCheck2 },
  { id: 'submitted_pending', label: 'Submitted with Pending Requirements', icon: Hourglass },
  { id: 'approved', label: 'Approved Requests', icon: CheckCircle2 },
];

export const PURPLE = '#6D28D9';
const PURPLE_TINT = 'rgba(109, 40, 217, 0.08)';

const STAGE_CLOSE_DELAY_MS = 200;

function useStageHoverController<T extends string>() {
  const [activeStage, setActiveStage] = useState<T | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setActiveStage(null);
      closeTimerRef.current = null;
    }, STAGE_CLOSE_DELAY_MS);
  };

  const openStage = (stageId: T) => {
    cancelClose();
    setActiveStage(stageId);
  };

  const closeNow = () => {
    cancelClose();
    setActiveStage(null);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return { activeStage, openStage, cancelClose, scheduleClose, closeNow };
}

function findProfileInLists(id: string | null | undefined, allProfiles: UserProfile[], bizDevProfiles: UserProfile[]): UserProfile | null {
  if (!id) return null;
  return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
}

interface ServicingTaskRowProps {
  task: WorkflowTaskItem;
  stage: WorkflowStage;
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onDeleteTask?: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
}

function ServicingTaskRow({
  task,
  stage,
  allProfiles,
  bizDevProfiles,
  onDeleteTask,
  onSaveTaskField,
}: ServicingTaskRowProps) {
  const meta = parseTaskMetadata(task.notes || '');

  const clientName =
    meta.policy_insured ||
    meta.policy_owner ||
    task.title ||
    'Untitled Task';
  const currentStatus = workflowStageToStatus(stage);
  const remainingOptions = getRemainingWorkflowOptions(currentStatus);

  const [showPreview, setShowPreview] = useState(false);
  const [previewRect, setPreviewRect] = useState<PreviewRect | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const measureRect = () => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    setPreviewRect({ top: rect.top, left: rect.left, right: rect.right, height: rect.height });
  };

  const handleMouseEnter = () => {
    measureRect();
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  useEffect(() => {
    if (!showPreview) return;
    const handleReposition = () => measureRect();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [showPreview]);

  const assignedProfile = findProfileInLists(task.assigned_to, allProfiles, bizDevProfiles);
  const processedProfile = findProfileInLists(task.processed_by, allProfiles, bizDevProfiles);

  return (
    <div
      ref={rowRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
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
        {clientName}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onSaveTaskField && (
          <select
            value={currentStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onSaveTaskField(task.id, buildWorkflowStatusUpdate(task, e.target.value as WorkflowStatus))
            }
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '11px',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <option value={currentStatus} disabled hidden>
              {currentStatus}
            </option>
            {remainingOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask?.(task.id);
          }}
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

      {showPreview && previewRect && typeof document !== 'undefined'
        ? createPortal(
          <ClientServicingPreview
            task={task}
            meta={meta}
            assignedProfile={assignedProfile}
            processedProfile={processedProfile}
            rect={previewRect}
          />,
          document.body
        )
        : null}
    </div>
  );
}

interface CategoryRowProps {
  meta: CategoryMeta;
  count: number;
  stage: WorkflowStage;
  categoryTasks: WorkflowTaskItem[];
  expanded: boolean;
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onToggle: () => void;
  onDeleteTask?: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
}

function CategoryRow({
  meta,
  count,
  stage,
  categoryTasks,
  expanded,
  allProfiles,
  bizDevProfiles,
  onToggle,
  onDeleteTask,
  onSaveTaskField,
}: CategoryRowProps) {
  const displayTitle = `${meta.title} (${meta.badge})`;

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '68px 1fr 40px',
          alignItems: 'stretch',
          width: '100%',
          borderLeft: `4px solid ${meta.accent}`,
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
        }}
      >
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
            alignSelf: 'stretch',
          }}
        >
          {count}
        </span>

        <span
          style={{
            padding: '16px 20px',
            fontSize: '15.5px',
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.3,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayTitle}
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}
        >
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </span>
      </button>

      {expanded && categoryTasks.length > 0 && (
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
            <ServicingTaskRow
              key={task.id}
              task={task}
              stage={stage}
              allProfiles={allProfiles}
              bizDevProfiles={bizDevProfiles}
              onDeleteTask={onDeleteTask}
              onSaveTaskField={onSaveTaskField}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StageCardProps {
  meta: StageMeta;
  count: number;
  active: boolean;
}

function StageCard({ meta, count, active }: StageCardProps) {
  const Icon = meta.icon;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        borderRadius: '12px',
        border: active ? `1px solid ${PURPLE}` : '1px solid var(--border)',
        borderLeft: active ? `4px solid ${PURPLE}` : '4px solid transparent',
        background: active ? PURPLE_TINT : 'var(--surface)',
        boxShadow: active ? '0 2px 10px rgba(109, 40, 217, 0.15)' : 'none',
        cursor: 'default',
        padding: '14px 16px',
        gap: '4px',
        transition: 'all 0.2s ease',
      }}
      className="hover:shadow-md"
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? PURPLE : 'var(--text-tertiary)' }}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: active ? PURPLE : 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
          }}
        >
          {count}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{meta.label}</span>
      </span>
      <ChevronRight size={18} strokeWidth={2.5} color={active ? PURPLE : 'var(--text-tertiary)'} />
    </div>
  );
}

interface CategoryRowGroup {
  meta: CategoryMeta;
  count: number;
  assignedProfiles: UserProfile[];
  categoryTasks: WorkflowTaskItem[];
}

interface StagePopoverProps {
  stage: StageMeta;
  rows: CategoryRowGroup[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onDeleteTask?: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function StagePopover({
  stage,
  rows,
  allProfiles,
  bizDevProfiles,
  onDeleteTask,
  onSaveTaskField,
  onMouseEnter,
  onMouseLeave,
}: StagePopoverProps) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (badge: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(badge)) {
        next.delete(badge);
      } else {
        next.add(badge);
      }
      return next;
    });
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: '100%',
        marginLeft: '16px',
        width: '460px',
        maxHeight: '400px',
        overflowY: 'auto',
        background: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid var(--border)',
        zIndex: 100,
      }}
      className="stage-popover"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{stage.label}</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {total} Request{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No requests in this stage yet.
          </div>
        ) : (
          rows.map(({ meta, count, categoryTasks }) => (
            <CategoryRow
              key={meta.badge}
              meta={meta}
              count={count}
              stage={stage.id as WorkflowStage}
              categoryTasks={categoryTasks}
              expanded={expandedCategories.has(meta.badge)}
              allProfiles={allProfiles}
              bizDevProfiles={bizDevProfiles}
              onToggle={() => toggleCategory(meta.badge)}
              onDeleteTask={onDeleteTask}
              onSaveTaskField={onSaveTaskField}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface WorkflowStatusSelectProps {
  value: string | null | undefined;
  onChange: (status: WorkflowStatus) => void;
  disabled?: boolean;
}

export function WorkflowStatusSelect({ value, onChange, disabled }: WorkflowStatusSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Workflow Status
      </label>
      <select
        value={value || DEFAULT_WORKFLOW_STATUS}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as WorkflowStatus)}
        style={{
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {WORKFLOW_STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TaskListProps {
  tasks: WorkflowTaskItem[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onCreateTask: () => void;
  onToggleComplete: (task: TaskItem) => void;
  onSelectTask: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Partial<TaskItem>) => void;
  onDeleteTask?: (taskId: string) => void;
  isUserView?: boolean;
  showCreateButton?: boolean;
}

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
  showCreateButton = true,
}: TaskListProps) {
  const servicingTasks = useMemo(() => {
    return tasks.filter(t => normalizeCategory(t.category) !== 'Inquiry');
  }, [tasks]);

  const { activeStage, openStage, cancelClose, scheduleClose } = useStageHoverController<WorkflowStage>();

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  const buildCategoryRows = (subset: WorkflowTaskItem[]): CategoryRowGroup[] => {
    const map = new Map<string, TaskItem[]>();
    for (const task of subset) {
      const normalized = normalizeCategory(task.category);
      const badge = getBadgeFromNormalized(normalized);
      if (!map.has(badge)) map.set(badge, []);
      map.get(badge)!.push(task);
    }

    const knownBadges = new Set(KNOWN_CATEGORIES.map((c) => c.badge));
    const rows: CategoryRowGroup[] = [];

    for (const meta of KNOWN_CATEGORIES) {
      const catTasks = map.get(meta.badge) || [];
      if (catTasks.length > 0) {
        const profileIds = Array.from(new Set(catTasks.map((t) => t.assigned_to).filter(Boolean))) as string[];
        const profiles = profileIds.map(findProfileById).filter(Boolean) as UserProfile[];
        rows.push({ meta, count: catTasks.length, assignedProfiles: profiles, categoryTasks: catTasks });
      }
    }

    for (const [badge, catTasks] of map.entries()) {
      if (!knownBadges.has(badge) && catTasks.length > 0) {
        const profileIds = Array.from(new Set(catTasks.map((t) => t.assigned_to).filter(Boolean))) as string[];
        const profiles = profileIds.map(findProfileById).filter(Boolean) as UserProfile[];
        rows.push({
          meta: { badge, title: badge, accent: '#C9962E', tint: 'rgba(201, 150, 46, 0.12)' },
          count: catTasks.length,
          assignedProfiles: profiles,
          categoryTasks: catTasks,
        });
      }
    }

    return rows;
  };

  const stageBuckets = useMemo(() => {
    const buckets: Record<WorkflowStage, WorkflowTaskItem[]> = {
      pending_submission: [],
      submitted: [],
      submitted_pending: [],
      approved: [],
    };
    for (const task of servicingTasks) {
      buckets[getWorkflowStage(task)].push(task);
    }
    return buckets;
  }, [servicingTasks]);

  const activeStageRows = useMemo(() => {
    if (!activeStage) return [];
    return buildCategoryRows(stageBuckets[activeStage]);
  }, [activeStage, stageBuckets, allProfiles, bizDevProfiles]);

  const totalLogged = servicingTasks.length;

  return (
    <div className={styles.monitoringCard}>
      <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
        <div className="flex items-center gap-2.5">
          <LayoutGrid size={20} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300 shrink-0" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
            Client Servicing Monitoring
          </h1>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="text-[22px] font-extrabold mr-1.5"
              style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {totalLogged}
            </span>
            Total Logged Request{totalLogged !== 1 ? 's' : ''}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={isUserView ? "/dashboard/history" : "/admin/dashboard/history"}
              style={{ textDecoration: 'none' }}
              className={`${styles.newTaskBtn} !py-1.5 !px-4 !text-[13px] !bg-surface-2 !text-text hover:!bg-surface-3 !border-border !border`}
            >
              <History size={15} strokeWidth={2.5} />
              <span className="font-bold">View History</span>
            </Link>
            {showCreateButton && (
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
      </div>

      <div className={styles.dashboardCardBody} style={{ padding: '0 16px 16px', gap: '8px' }}>
        {totalLogged === 0 ? (
          <div
            className={styles.emptyStateContainer}
            onClick={showCreateButton ? onCreateTask : undefined}
            style={{ cursor: showCreateButton ? 'pointer' : 'default' }}
          >
            <div className={styles.emptyStateIcon}>📋</div>
            <div className={styles.emptyStateTitle}>No requests logged yet</div>
            <div className={styles.emptyStateDescription}>
              {showCreateButton
                ? 'Click "Log Request" to record your first client servicing request.'
                : 'No client servicing requests have been logged.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {WORKFLOW_STAGES.map((stage) => (
              <div
                key={stage.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => openStage(stage.id as WorkflowStage)}
                onMouseLeave={scheduleClose}
              >
                <StageCard
                  meta={stage}
                  count={stageBuckets[stage.id as WorkflowStage].length}
                  active={activeStage === stage.id}
                />
                {activeStage === stage.id && (
                  <StagePopover
                    stage={stage}
                    rows={activeStageRows}
                    allProfiles={allProfiles}
                    bizDevProfiles={bizDevProfiles}
                    onDeleteTask={onDeleteTask}
                    onSaveTaskField={_onSaveTaskField}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export type InquiryStage = 'addressed' | 'pending' | 'for_servicing';
export const INQUIRY_STATUS_OPTIONS = ['Addressed Concerns', 'Pending Response', 'For Client Servicing'];
export const DEFAULT_INQUIRY_STATUS = 'For Client Servicing';

export function getRemainingInquiryOptions(current?: string | null): string[] {
  const currentStatus = current || DEFAULT_INQUIRY_STATUS;
  return INQUIRY_STATUS_OPTIONS.filter((opt) => opt !== currentStatus);
}

const INQUIRY_STAGES: StageMeta[] = [
  { id: 'addressed', label: 'Addressed Concerns', icon: CheckCircle2 },
  { id: 'pending', label: 'Pending Response', icon: Hourglass },
  { id: 'for_servicing', label: 'For Client Servicing', icon: FileCheck2 },
];

function getInquiryStage(task: WorkflowTaskItem): InquiryStage {
  const meta = parseTaskMetadata(task.notes || "");

  const type = (meta.inquiry_type || "").toLowerCase();

  if (type === "address concern")
    return "addressed";

  if (type === "client servicing")
    return "for_servicing";

  return "pending";
}

function inquiryStageToStatus(stage: InquiryStage): string {
  if (stage === 'addressed') return 'Addressed Concerns';
  if (stage === 'pending') return 'Pending Response';
  return 'For Client Servicing';
}

export interface NewInquiryPayload {
  category: string;
  title: string;
  notes: string;
  workflow_status: string;
}

function formatDateLoggedValue(createdAt: string | null | undefined): { datePart: string; timePart: string } | null {
  if (!createdAt) return null;
  const datePart = formatDisplayDate(createdAt.slice(0, 10));
  const timePart = new Date(createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { datePart, timePart };
}

interface InquiryPreviewRect {
  top: number;
  left: number;
  right: number;
  height: number;
}

const PREVIEW_CARD_WIDTH = 440;
const PREVIEW_CARD_GAP = 18;

interface InquiryPreviewCardProps {
  task: WorkflowTaskItem;
  meta: any;
  processedProfile: UserProfile | null;
  loggedByLabel: string;
  rect: InquiryPreviewRect;
}

function InquiryPreviewCard({ task, meta, processedProfile, loggedByLabel, rect }: InquiryPreviewCardProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const spaceRight = window.innerWidth - rect.right;
  const isRight = spaceRight >= PREVIEW_CARD_WIDTH + PREVIEW_CARD_GAP;

  const top = rect.top + rect.height / 2;
  const left = isRight ? rect.right + PREVIEW_CARD_GAP : rect.left - PREVIEW_CARD_WIDTH - PREVIEW_CARD_GAP;

  const dateLogged = formatDateLoggedValue(task.created_at);
  const lastUpdated = task.updated_at ? formatRelativeTime(task.updated_at) : 'N/A';

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    color: '#6B7280',
    marginBottom: '4px',
  };

  const mainValueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.7,
    color: '#374151',
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(0,0,0,.06)',
    margin: '14px 0',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${PREVIEW_CARD_WIDTH}px`,
        minHeight: '180px',
        padding: '20px',
        borderRadius: '16px',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,.06)',
        boxShadow: '0 18px 40px rgba(15,23,42,.14)',
        borderLeft: '4px solid #6D28D9',
        zIndex: 9999,
        opacity: entered ? 1 : 0,
        transform: `translateY(-50%) translateX(${entered ? 0 : isRight ? 10 : -10}px)`,
        transition: 'opacity 0.18s ease-out, transform 0.18s ease-out',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          ...(isRight ? { left: '-7px' } : { right: '-7px' }),
          transform: 'translateY(-50%) rotate(45deg)',
          width: '14px',
          height: '14px',
          background: '#ffffff',
          borderLeft: isRight ? '1px solid rgba(0,0,0,.06)' : 'none',
          borderBottom: isRight ? '1px solid rgba(0,0,0,.06)' : 'none',
          borderRight: !isRight ? '1px solid rgba(0,0,0,.06)' : 'none',
          borderTop: !isRight ? '1px solid rgba(0,0,0,.06)' : 'none',
        }}
      />

      <div style={sectionLabelStyle}>CMGC Name</div>
      <div style={mainValueStyle}>{meta.cmgc_name || 'N/A'}</div>

      <div style={dividerStyle} />

      <div style={sectionLabelStyle}>Inquiry / Concern</div>
      <div
        style={{
          ...bodyStyle,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxHeight: '120px',
          overflow: 'auto',
        }}
      >
        {meta.inquiry_concern || 'N/A'}
      </div>

      <div style={dividerStyle} />

      <div style={sectionLabelStyle}>Processed By</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserAvatar profile={processedProfile} size={32} />
        <div style={mainValueStyle}>{loggedByLabel}</div>
      </div>

      <div style={dividerStyle} />

      <div style={sectionLabelStyle}>Date Logged</div>
      <div style={bodyStyle}>
        {dateLogged ? (
          <>
            {dateLogged.datePart}
            <br />
            {dateLogged.timePart}
          </>
        ) : (
          'N/A'
        )}
      </div>

      <div style={dividerStyle} />

      <div style={sectionLabelStyle}>Last Updated</div>
      <div style={bodyStyle}>{lastUpdated}</div>
    </div>
  );
}

interface InquiryRowProps {
  task: WorkflowTaskItem;
  stage: InquiryStage;
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onClick: () => void;
  onDeleteTask?: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
}

function InquiryRow({ task, stage, allProfiles, bizDevProfiles, onClick, onDeleteTask, onSaveTaskField }: InquiryRowProps) {
  const meta = parseTaskMetadata(task.notes || '');
  const currentStatus = inquiryStageToStatus(stage);
  const remainingOptions = getRemainingInquiryOptions(currentStatus);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRect, setPreviewRect] = useState<InquiryPreviewRect | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const measureRect = () => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    setPreviewRect({ top: rect.top, left: rect.left, right: rect.right, height: rect.height });
  };

  const handleMouseEnter = () => {
    measureRect();
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  useEffect(() => {
    if (!showPreview) return;
    const handleReposition = () => measureRect();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [showPreview]);

  const processedProfile = findProfileInLists(task.processed_by, allProfiles, bizDevProfiles);
  const fallbackCreatedBy = (task as any).created_by_name || (task as any).created_by || null;
  const loggedByLabel =
    processedProfile?.full_name || processedProfile?.email || fallbackCreatedBy || 'System';

  return (
    <div
      ref={rowRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        padding: '16px 20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        alignItems: 'center',
        transition: 'all 0.15s ease',
        borderLeft: `4px solid ${PURPLE}`,
        gap: '12px'
      }}
      className="hover:bg-surface-2 hover:shadow-sm"
    >
      <div onClick={onClick} style={{ cursor: 'pointer', flexGrow: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          CMGC Name
        </div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
          {meta.cmgc_name || task.title || 'Untitled Inquiry'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onSaveTaskField && (
          <select
            value={currentStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSaveTaskField(task.id, { workflow_status: e.target.value })}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '11px',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <option value={currentStatus} disabled hidden>
              {currentStatus}
            </option>
            {remainingOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
        <ChevronRight size={18} className="text-text-tertiary shrink-0" strokeWidth={2.5} onClick={onClick} style={{ cursor: 'pointer' }} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask?.(task.id);
          }}
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

      {showPreview && previewRect && typeof document !== 'undefined'
        ? createPortal(
          <InquiryPreviewCard
            task={task}
            meta={meta}
            processedProfile={processedProfile}
            loggedByLabel={loggedByLabel}
            rect={previewRect}
          />,
          document.body
        )
        : null}
    </div>
  );
}

interface InquiryStagePopoverProps {
  stage: typeof INQUIRY_STAGES[0];
  inquiries: WorkflowTaskItem[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function InquiryStagePopover({
  stage,
  inquiries,
  allProfiles,
  bizDevProfiles,
  onSelectTask,
  onDeleteTask,
  onSaveTaskField,
  onMouseEnter,
  onMouseLeave,
}: InquiryStagePopoverProps) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: '100%',
        marginLeft: '16px',
        width: '460px',
        maxHeight: '480px',
        overflowY: 'auto',
        background: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid var(--border)',
        zIndex: 100,
      }}
      className="stage-popover"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{stage.label}</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {inquiries.length} Inquir{inquiries.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {inquiries.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No inquiries in this stage yet.
          </div>
        ) : (
          [...inquiries]
            .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
            .map((task) => (
              <InquiryRow
                key={task.id}
                task={task}
                stage={stage.id as InquiryStage}
                allProfiles={allProfiles}
                bizDevProfiles={bizDevProfiles}
                onClick={() => onSelectTask(task.id)}
                onDeleteTask={onDeleteTask}
                onSaveTaskField={onSaveTaskField}
              />
            ))
        )}
      </div>
    </div>
  );
}

interface ClientInquiriesProps {
  tasks: WorkflowTaskItem[];
  allProfiles?: UserProfile[];
  bizDevProfiles?: UserProfile[];
  onCreateTask: () => void;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
  onCreateInquiry?: () => void | Promise<void>;
  isUserView?: boolean;
  showCreateButton?: boolean;
}

export function ClientInquiries({
  tasks,
  allProfiles = [],
  bizDevProfiles = [],
  onCreateTask,
  onSelectTask,
  onDeleteTask,
  onSaveTaskField,
  onCreateInquiry,
  isUserView = false,
  showCreateButton = true,
}: ClientInquiriesProps) {
  const { activeStage, openStage, cancelClose, scheduleClose } = useStageHoverController<InquiryStage>();

  const inquiryTasks = useMemo(() => {
    return tasks.filter(
      (t) => normalizeCategory(t.category) === "Inquiry"
    );
  }, [tasks]);

  const validInquiryTasks = useMemo(() => {
    return inquiryTasks.filter((task) => {
      const meta = parseTaskMetadata(task.notes || "");

      return (
        (meta.cmgc_name ?? "").trim() !== "" &&
        (meta.inquiry_concern ?? "").trim() !== ""
      );
    });
  }, [inquiryTasks]);

  const stageBuckets = useMemo(() => {
    const buckets: Record<InquiryStage, WorkflowTaskItem[]> = {
      addressed: [],
      pending: [],
      for_servicing: [],
    };

    for (const task of validInquiryTasks) {
      buckets[getInquiryStage(task)].push(task);
    }

    return buckets;
  }, [validInquiryTasks]);

  const totalLogged = validInquiryTasks.length;

  return (
    <div className={styles.monitoringCard}>
      <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LayoutGrid size={20} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300 shrink-0" />
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
              Client Inquiries
            </h1>
          </div>

          {showCreateButton && (
            <button
              type="button"
              onClick={onCreateInquiry || onCreateTask}
              className={`${styles.newTaskBtn} !py-1.5 !px-4 !text-[13px]`}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="font-bold">Log Inquiry</span>
            </button>
          )}
        </div>

        <div className="flex items-center mt-0.5">
          <span className="text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="text-[22px] font-extrabold mr-1.5"
              style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {totalLogged}
            </span>
            Total Logged Inquir{totalLogged !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </div>

      <div className={styles.dashboardCardBody} style={{ padding: '0 16px 16px', gap: '8px' }}>
        {totalLogged === 0 ? (
          <div
            className={styles.emptyStateContainer}
            onClick={showCreateButton ? (onCreateInquiry || onCreateTask) : undefined}
            style={{ cursor: showCreateButton ? 'pointer' : 'default' }}
          >
            <div className={styles.emptyStateIcon}>📋</div>
            <div className={styles.emptyStateTitle}>No inquiries logged yet</div>
            <div className={styles.emptyStateDescription}>
              {showCreateButton
                ? 'Click "Log Inquiry" to record your first client inquiry.'
                : 'No client inquiries have been logged.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {INQUIRY_STAGES.map((stage) => (
              <div
                key={stage.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => openStage(stage.id as InquiryStage)}
                onMouseLeave={scheduleClose}
              >
                <StageCard
                  meta={stage}
                  count={stageBuckets[stage.id as InquiryStage].length}
                  active={activeStage === stage.id}
                />
                {activeStage === stage.id && (
                  <InquiryStagePopover
                    stage={stage}
                    inquiries={stageBuckets[stage.id as InquiryStage]}
                    allProfiles={allProfiles}
                    bizDevProfiles={bizDevProfiles}
                    onSelectTask={onSelectTask}
                    onDeleteTask={onDeleteTask}
                    onSaveTaskField={onSaveTaskField}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}