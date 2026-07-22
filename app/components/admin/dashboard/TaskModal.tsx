import React, { useState } from 'react';
import {
  X,
  Clock,
  History,
  Trash2,
  MoreHorizontal,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { TaskItem, formatRelativeTime } from './TaskRow';
import UserAvatar, { UserProfile } from './UserAvatar';
import UserPickerSelect from './UserPickerSelect';
import StatusBadge, { getTaskStatusMeta, getStatusColorHex } from './StatusBadge';
import { formatDisplayDate } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';

const TASK_CATEGORIES = ['ACR', 'BCR', 'FSR', 'PPU', 'CPC', 'UID', 'PLT', 'CPST', 'Others'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Acknowledged', 'On Hold', 'Done', 'Cancelled'];
const TASK_PRIORITIES = ['Normal', 'High', 'Urgent'];

interface TaskModalProps {
  task: TaskItem;
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onSaveField: (taskId: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
  isUserView?: boolean;
}

export default function TaskModal({
  task,
  allProfiles,
  bizDevProfiles,
  onSaveField,
  onDeleteTask,
  onClose,
  isUserView = false
}: TaskModalProps) {
  const [newNoteText, setNewNoteText] = useState('');

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  const processedAuthor = findProfileById(task.processed_by);
  const assignedAuthor = findProfileById(task.assigned_to);
  const activeNoteAuthor = processedAuthor || assignedAuthor;
  const currentStatusColor = getStatusColorHex(task.status);
  const priority = task.priority || (task.status === 'Done' ? 'Normal' : 'High');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const authorName = assignedAuthor?.full_name || 'Agent';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedEntry = `[${timestamp}] ${authorName}: ${newNoteText.trim()}`;
    
    const updatedNotes = task.notes && task.notes.trim().length > 0 
      ? `${formattedEntry}\n\n${task.notes}`
      : formattedEntry;

    onSaveField(task.id, { notes: updatedNotes });
    setNewNoteText('');
  };

  return (
    <div className={styles.taskModalOverlay} onClick={onClose}>
      <div
        className={styles.taskModalCard}
        style={{ borderTop: `4px solid ${currentStatusColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.taskModalHeader}>
          <div className={styles.modalTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className={styles.modalTitleInput}
                value={task.title}
                onChange={(e) => onSaveField(task.id, { title: e.target.value })}
                placeholder="Untitled Task"
                autoFocus
              />
              <StatusBadge status={task.status} size="sm" />
            </div>
            <div className={styles.modalSubTitle}>
              <span className={styles.modalSubTitleItem}>
                <Clock size={11} />
                Updated {formatRelativeTime(task.updated_at)}
              </span>
              {task.created_at && (
                <span className={styles.modalSubTitleItem}>
                  <History size={11} />
                  Created {formatDisplayDate(task.created_at.slice(0, 10))}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBodyContent}>
          {/* Segmented Status Selector */}
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Status</label>
            <div className={styles.segmentedStatusRow}>
              {TASK_STATUSES.map((st) => {
                const { className } = getTaskStatusMeta(st);
                const isActive = task.status === st;
                const colorHex = getStatusColorHex(st);

                return (
                  <button
                    key={st}
                    type="button"
                    className={`${styles.statusSegmentBtn} ${isActive ? styles.statusSegmentActive : ''} ${className}`}
                    style={isActive ? {
                      background: colorHex,
                      color: '#FFFFFF',
                      borderColor: colorHex,
                      boxShadow: `0 2px 8px ${colorHex}55`
                    } : undefined}
                    onClick={() => onSaveField(task.id, {
                      status: st,
                      completed: st === 'Done'
                    })}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.modalTwoCol}>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Category</label>
              <select
                className={styles.formSelect}
                value={task.category}
                onChange={(e) => onSaveField(task.id, { category: e.target.value })}
              >
                {TASK_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Priority</label>
              <select
                className={styles.formSelect}
                value={priority}
                onChange={(e) => onSaveField(task.id, { priority: e.target.value })}
              >
                {TASK_PRIORITIES.map((p) => (<option key={p} value={p}>{p} Priority</option>))}
              </select>
            </div>
          </div>

          {/* Assignee & Processed By Row */}
          {!isUserView ? (
            <div className={styles.modalTwoCol}>
              <UserPickerSelect
                label="Processed By"
                value={task.processed_by}
                profiles={bizDevProfiles}
                onChange={(val) => onSaveField(task.id, { processed_by: val })}
              />

              <UserPickerSelect
                label="Assigned To"
                value={task.assigned_to}
                profiles={allProfiles}
                onChange={(val) => onSaveField(task.id, { assigned_to: val })}
              />
            </div>
          ) : (
            <div className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center justify-between my-2 text-xs">
              <div className="flex items-center gap-2">
                <UserAvatar profile={assignedAuthor} size={24} />
                <div>
                  <span className="font-semibold text-foreground">{assignedAuthor?.full_name || 'Assigned to You'}</span>
                  <p className="text-[11px] text-muted-foreground">Assigned Team Member</p>
                </div>
              </div>
              {processedAuthor && (
                <div className="flex items-center gap-2">
                  <UserAvatar profile={processedAuthor} size={24} />
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{processedAuthor.full_name}</span>
                    <p className="text-[11px] text-muted-foreground">Processed By</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat-Style Conversation Bubble Notes Section */}
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Messenger Timeline & Notes</label>
            {task.notes && task.notes.trim().length > 0 && (
              <div className={styles.notesTimeline} style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {task.notes.split('\n\n').filter(Boolean).map((noteBlock, idx) => (
                  <div key={`note-bubble-${idx}`} className={styles.noteBubble}>
                    <UserAvatar profile={activeNoteAuthor} size={28} />
                    <div className={styles.noteBubbleBody}>
                      <div className={styles.noteBubbleHeader}>
                        <span className={styles.noteBubbleAuthor}>
                          {activeNoteAuthor?.full_name || 'Servicing Agent'}
                        </span>
                        <span className={styles.noteBubbleTime}>{formatRelativeTime(task.updated_at)}</span>
                      </div>
                      <div className={styles.noteBubbleMessage}>{noteBlock}</div>
                    </div>
                    <button type="button" className={styles.noteBubbleOptionsBtn} title="More options">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative mt-2">
              <textarea
                className={styles.appleNotesTextarea}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type a new update note message..."
                rows={2}
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="absolute right-3 bottom-3 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-40 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Send size={12} />
                Send Note
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={styles.modalFooter}>
          {!isUserView ? (
            <button
              type="button"
              className={styles.deleteOutlinedBtn}
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
            >
              <Trash2 size={13} strokeWidth={2} />
              Delete Task
            </button>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle size={13} />
              Viewing as Assigned User
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={styles.ghostCancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.goldSaveBtn}
              style={{ background: currentStatusColor }}
              onClick={onClose}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
