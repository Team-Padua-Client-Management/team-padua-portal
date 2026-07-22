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
  const priority = task.priority || (task.status === 'Done' ? 'Normal' : 'High');

  return (
    <div
      className={`${styles.taskListRow} group transition-all duration-200 hover:shadow-md hover:border-l-6 cursor-pointer`}
      style={{ borderLeft: `4px solid ${statusColor}` }}
      onClick={() => onSelectTask(task.id)}
    >
      {/* Checkbox on left */}
      <button
        type="button"
        className={styles.noteCheckboxBtn}
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        aria-label="Toggle completion"
      >
        {task.completed ? (
          <CheckSquare size={18} className={styles.checkedIcon} />
        ) : (
          <Square size={18} className={styles.uncheckedIcon} />
        )}
      </button>

      {/* Main info column */}
      <div className={styles.taskRowMainCol}>
        <div className={styles.taskRowTitleLine}>
          <span className={`${styles.noteTitleText} ${task.completed ? styles.noteCompletedTitle : ''}`}>
            {task.title || 'Untitled Task'}
          </span>
          {task.category && (
            <span className={styles.noteCategoryBadge}>{task.category}</span>
          )}
          {priority && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
              priority === 'Urgent' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
              priority === 'High' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
              'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
            }`}>
              {priority}
            </span>
          )}
        </div>

        <div className={styles.taskRowUserLine}>
          <UserAvatar
            profile={activeProfile}
            size={20}
            showTooltip
          />
          <span className={styles.taskRowUserName}>{userName}</span>
          {processedName && processedName !== userName && (
            <>
              <span className="text-[10px] text-muted-foreground ml-1">/ Processed by:</span>
              <UserAvatar profile={processedProfile} size={18} showTooltip />
              <span className={styles.taskRowUserName}>{processedName}</span>
            </>
          )}
          <span className={styles.taskRowDot}>&bull;</span>
          <span className={styles.taskRowTimeText}>{timestampText}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className={styles.taskRowRightCol}>
        <StatusBadge status={task.status} size="sm" />
        {task.notes && task.notes.trim().length > 0 && (
          <span title="Has notes" className={styles.taskRowNotesIcon}>
            <FileText size={13} />
          </span>
        )}
        <ChevronRight size={15} className={`${styles.rowChevron} transition-transform group-hover:translate-x-0.5`} />
      </div>
    </div>
  );
}
