import React from 'react';
import { CheckSquare, Square, FileText, ChevronRight, User, AlertCircle } from 'lucide-react';
import StatusBadge, { getStatusColorHex } from './StatusBadge';
import UserAvatar, { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

export type TaskItem = {
  id: string;
  user_id?: string;
  title: string;
  notes: string;
  category: string;
  status: string;
  priority?: 'Normal' | 'High' | 'Urgent' | string;
  assigned_to: string | null;
  processed_by: string | null;
  completed: boolean;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const TASK_CATEGORIES = [
  'ACR - Advisor Change Request',
  'BCR - Beneficiary Change Request',
  'CPC - Client Policy Change',
  'CPST - Client Policy Status Tracking',
  'FSR - Fund Switching Request',
  'FWR - Fund Withdrawal Request',
  'ACA - Auto Charge Arrangement',
  'SRO - Reinstatement (SRO)',
  'PDI - Reinstatement (PDI)',
  'CSMV - Client Servicing Monitoring Verification',
  'Others'
];

export function normalizeCategory(cat?: string | null): string {
  if (!cat) return 'Others';
  const c = cat.trim().toUpperCase();

  if (c === 'ACR' || c.startsWith('ACR -') || c.startsWith('ACA - ADVISOR')) return 'ACR - Advisor Change Request';
  if (c === 'BCR' || c.startsWith('BCR -')) return 'BCR - Beneficiary Change Request';
  if (c === 'CPC' || c.startsWith('CPC -')) return 'CPC - Client Policy Change';
  if (c === 'CPST' || c.startsWith('CPST -')) return 'CPST - Client Policy Status Tracking';
  if (c === 'FSR' || c === 'FST' || c.startsWith('FSR -')) return 'FSR - Fund Switching Request';
  if (c === 'FWR' || c === 'PPU' || c.startsWith('FWR -')) return 'FWR - Fund Withdrawal Request';
  if (c === 'ACA' || c.startsWith('ACA - AUTO')) return 'ACA - Auto Charge Arrangement';
  if (c === 'SRO' || c.startsWith('SRO -')) return 'SRO - Reinstatement (SRO)';
  if (c === 'PDI' || c.startsWith('PDI -')) return 'PDI - Reinstatement (PDI)';
  if (c === 'CSMV' || c === 'UID' || c.startsWith('CSMV -')) return 'CSMV - Client Servicing Monitoring Verification';
  if (c === 'PLT') return 'CPC - Client Policy Change';

  return cat.trim();
}

interface TaskRowProps {
  task: TaskItem;
  assignedProfile: UserProfile | null;
  processedProfile: UserProfile | null;
  onToggleComplete: (task: TaskItem) => void;
  onSelectTask: (taskId: string) => void;
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '—';
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFormattedTime(isoString?: string): string {
  if (!isoString) return 'Today at 2:30 PM';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Today at 2:30 PM';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeStr}`;
  }

  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

export default function TaskRow({
  task,
  assignedProfile,
  processedProfile,
  onToggleComplete,
  onSelectTask
}: TaskRowProps) {
  const statusColor = getStatusColorHex(task.status);
  const activeProfile = assignedProfile || processedProfile;
  const userName = activeProfile ? (activeProfile.full_name || activeProfile.email) : 'Unassigned';
  const processedName = processedProfile ? (processedProfile.full_name || processedProfile.email) : null;
  const timestampText = formatFormattedTime(task.updated_at);

  return (
    <div
      className="flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-surface hover:bg-surface-2/70 border border-border/60 rounded-2xl transition-all duration-200 hover:shadow-md cursor-pointer group my-1.5"
      style={{ borderLeft: `4px solid ${statusColor}` }}
      onClick={() => onSelectTask(task.id)}
    >
      {/* Checkbox on left */}
      <button
        type="button"
        className="p-1 rounded-md text-text-tertiary hover:text-amber-500 hover:bg-amber-500/10 transition-colors shrink-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        aria-label="Toggle completion"
      >
        {task.completed ? (
          <CheckSquare size={18} className="text-amber-500" />
        ) : (
          <Square size={18} className="text-text-tertiary" />
        )}
      </button>

      {/* Main info column */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Row 1: Title & Category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold text-xs sm:text-sm text-text leading-tight ${task.completed ? 'line-through text-text-tertiary' : ''}`}>
            {task.title || 'Untitled Task'}
          </span>
          {task.category && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap">
              {normalizeCategory(task.category)}
            </span>
          )}
        </div>

        {/* Row 2: User information & timestamp */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary flex-wrap">
          <UserAvatar
            profile={activeProfile}
            size={18}
            showTooltip
          />
          <span className="font-semibold text-text truncate max-w-[140px] sm:max-w-[200px]">{userName}</span>
          {processedName && processedName !== userName && (
            <>
              <span className="text-text-tertiary text-[10px] mx-0.5">•</span>
              <span className="text-[11px] text-text-tertiary font-medium">Processed by:</span>
              <UserAvatar profile={processedProfile} size={16} showTooltip />
              <span className="font-semibold text-text truncate max-w-[140px] sm:max-w-[200px]">{processedName}</span>
            </>
          )}
          <span className="text-text-tertiary text-[10px] mx-0.5">•</span>
          <span className="text-[11px] text-text-tertiary font-medium whitespace-nowrap">{timestampText}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <StatusBadge status={task.status} size="sm" />
        {task.notes && task.notes.trim().length > 0 && (
          <span title="Has notes" className="p-1 text-text-tertiary hover:text-text">
            <FileText size={14} />
          </span>
        )}
        <ChevronRight size={15} className="text-text-tertiary transition-transform group-hover:translate-x-0.5 shrink-0" />
      </div>
    </div>
  );
}
