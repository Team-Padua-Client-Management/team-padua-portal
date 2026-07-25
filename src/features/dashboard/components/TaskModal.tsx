import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Clock,
  History,
  Trash2,
  MoreHorizontal,
  Send,
  Calendar,
  AlertCircle,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { TaskItem, formatRelativeTime, TASK_CATEGORIES, normalizeCategory } from './TaskRow';
import UserAvatar, { UserProfile } from './UserAvatar';
import UserPickerSelect from './UserPickerSelect';
import StatusBadge, { getTaskStatusMeta, getStatusColorHex } from './StatusBadge';
import { formatDisplayDate } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';

const TASK_STATUSES = ['Pending', 'In Progress', 'Done'];

interface TaskModalProps {
  task: TaskItem;
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  currentUserProfile?: UserProfile | null;
  onSaveField: (taskId: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
  isUserView?: boolean;
}

/**
 * CategoryPickerSelect — mirrors the "Assigned To" UserPickerSelect UI
 * for the Category field in TaskModal.
 */
function CategoryPickerSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalized = normalizeCategory(value);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return TASK_CATEGORIES;
    return TASK_CATEGORIES.filter((cat) =>
      cat.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={styles.userPickerContainer}>
      <label className={styles.formFieldLabel}>Category</label>
      <button
        type="button"
        className={styles.userPickerTrigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.userPickerName} style={{ fontWeight: 500 }}>
          {normalized}
        </span>
        <ChevronDown size={14} className={styles.userPickerChevron} />
      </button>

      {isOpen && (
        <div className={styles.userPickerDropdown}>
          <div className={styles.userPickerSearchRow}>
            <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className={styles.userPickerSearchInput}
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.userPickerList}>
            {filteredCategories.map((cat) => {
              const isSelected = normalizeCategory(cat) === normalized;
              return (
                <div
                  key={cat}
                  className={`${styles.userPickerOption} ${isSelected ? styles.userPickerOptionSelected : ''}`}
                  onClick={() => {
                    onChange(cat);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className={styles.userInfoCol}>
                    <span className={styles.userName}>{cat}</span>
                  </div>
                  {isSelected && <Check size={13} style={{ color: 'var(--amber-500, #f59e0b)', flexShrink: 0 }} />}
                </div>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-muted-foreground">No categories found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskModal({
  task,
  allProfiles,
  bizDevProfiles,
  currentUserProfile,
  onSaveField,
  onDeleteTask,
  onClose,
  isUserView = false
}: TaskModalProps) {
  const [newNoteText, setNewNoteText] = useState('');

  const adminProfiles = useMemo(() => {
    const admins = allProfiles.filter((p) => (p.role || '').toLowerCase() === 'admin');
    return admins.length > 0 ? admins : allProfiles;
  }, [allProfiles]);

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  const processedAuthor = findProfileById(task.processed_by) || currentUserProfile || null;
  const assignedAuthor = findProfileById(task.assigned_to);
  const activeNoteAuthor = processedAuthor || assignedAuthor;
  const currentStatusColor = getStatusColorHex(task.status);

  /**
   * A task is considered to be in initial setup ("mag seset pa lang ng task") if:
   * - it has no timeline notes/updates yet AND its status is default 'Pending'
   * In this phase, Status selector and badge are hidden as they are not needed yet.
   */
  const isSettingUpTask =
    (!task.notes || !task.notes.trim()) && (task.status === 'Pending' || !task.status);

  const handleClose = () => {
    // If closing an uncompleted new task that still has no notes and default title/pending status, clean it up if needed
    const isUncompletedNewTask =
      !task.completed &&
      task.status === 'Pending' &&
      (!task.notes || !task.notes.trim()) &&
      task.title === 'Untitled Task';

    if (isUncompletedNewTask) {
      onDeleteTask(task.id);
    }
    onClose();
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const authorName = processedAuthor?.full_name || currentUserProfile?.full_name || assignedAuthor?.full_name || 'Admin';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedEntry = `[${timestamp}] ${authorName}: ${newNoteText.trim()}`;
    
    const updatedNotes = task.notes && task.notes.trim().length > 0 
      ? `${formattedEntry}\n\n${task.notes}`
      : formattedEntry;

    onSaveField(task.id, { notes: updatedNotes });
    setNewNoteText('');
  };

  return (
    <div className={styles.taskModalOverlay} onClick={handleClose}>
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
              {!isSettingUpTask && <StatusBadge status={task.status} size="sm" />}
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
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBodyContent}>
          {/* Segmented Status Selector — hidden while initially setting up a task */}
          {!isSettingUpTask && (
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
          )}

          <div className={styles.modalTwoCol}>
            {/* Category — now uses custom picker matching "Assigned To" UI */}
            <CategoryPickerSelect
              value={normalizeCategory(task.category)}
              onChange={(val) => onSaveField(task.id, { category: val })}
            />
          </div>

          {/* Assignee & Processed By Row */}
          {!isUserView ? (
            <div className={styles.modalTwoCol}>
              <div className={styles.userPickerContainer}>
                <label className={styles.formFieldLabel}>Processed By</label>
                <div className={styles.fixedUserTrigger}>
                  <div className={styles.userPickerBadge}>
                    <UserAvatar profile={processedAuthor} size={20} />
                    <span className={styles.userPickerName}>
                      {processedAuthor?.full_name || processedAuthor?.email || 'Admin'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border">
                    {processedAuthor?.role || 'Admin'}
                  </span>
                </div>
              </div>

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
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.goldSaveBtn}
              style={{ background: currentStatusColor }}
              onClick={handleClose}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

