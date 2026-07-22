import React, { useState } from 'react';
import { CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskItem } from './TaskRow';
import StatusBadge from './StatusBadge';
import UserAvatar, { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

interface ClientServicingToDoProps {
  tasks: TaskItem[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onToggleComplete: (task: TaskItem) => void;
  onSelectTask: (taskId: string) => void;
}

export default function ClientServicingToDo({
  tasks,
  allProfiles,
  bizDevProfiles,
  onToggleComplete,
  onSelectTask
}: ClientServicingToDoProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeTasks = tasks.filter(t =>
    !t.completed &&
    t.status !== 'Done' &&
    t.status !== 'Cancelled'
  );
  const dueCount = activeTasks.length;

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  return (
    <div className={`${styles.dashboardCard} ${styles.todoWidgetCard}`}>
      {/* Header Row: (✓) To-do ... collapse chevron */}
      <div className={styles.todoHeaderRow}>
        <div className={styles.todoHeaderTitleGroup}>
          <div className={styles.todoCheckIconBadge}>
            <CheckCircle2 size={18} strokeWidth={2.2} />
          </div>
          <h3 className={styles.todoWidgetTitle}>To-do</h3>
        </div>

        <div className={styles.todoHeaderActions}>
          <button
            type="button"
            className={styles.cardHeaderToggleBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse To-do list" : "Expand To-do list"}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Subtitle: 📄 N assignments due */}
      <div className={styles.todoSubtitleRow}>
        <FileText size={14} className={styles.todoDocIcon} />
        <span className={styles.todoAssignmentsDueText}>
          {dueCount} {dueCount === 1 ? 'assignment' : 'assignments'} due
        </span>
      </div>

      {/* Expanded list of to-do items */}
      {isExpanded && (
        <div className={styles.todoListContainer}>
          {activeTasks.length === 0 ? (
            <div className={styles.todoEmptyState}>
              <p>No active assignments due.</p>
            </div>
          ) : (
            <div className={styles.todoItemsStack}>
              {activeTasks.slice(0, 8).map((t) => {
                const assignedProfile = findProfileById(t.assigned_to);

                return (
                  <div
                    key={t.id}
                    className={`${styles.todoItemRow} ${t.completed ? styles.todoItemCompleted : ''}`}
                    onClick={() => onSelectTask(t.id)}
                  >
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleComplete(t);
                      }}
                      className={styles.todoCheckboxInput}
                    />

                    <span className={styles.todoItemText}>{t.title || 'Untitled Task'}</span>

                    <div className={styles.todoItemMetaRight}>
                      <StatusBadge status={t.status} size="sm" />
                      {assignedProfile && (
                        <UserAvatar profile={assignedProfile} size={18} showTooltip tooltipPrefix="Assigned" />
                      )}
                    </div>
                  </div>
                );
              })}

              {tasks.length > 6 && (
                <div className={styles.todoViewMoreRow}>
                  <span>+{tasks.length - 6} more assignments in Monitoring</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
