import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Clock,
  History,
  Trash2,
  MoreHorizontal,
  Send,
  AlertCircle,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { TaskItem, formatRelativeTime, TASK_CATEGORIES, normalizeCategory } from './TaskRow';
import {
  parseTaskMetadata,
  buildTaskNotes,
  INQUIRY_STATUS_OPTIONS,
  DEFAULT_INQUIRY_STATUS,
  WORKFLOW_STATUS_OPTIONS,
  DEFAULT_WORKFLOW_STATUS,
  PURPLE
} from './TaskList';
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

  const isSettingUpTask =
    (!task.notes || !task.notes.trim()) && (task.status === 'Pending' || !task.status);

  const handleClose = () => {
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

    const parsed = parseTaskMetadata(task.notes || '');
    const currentTimeline = parsed.timeline || '';
    const updatedTimeline = currentTimeline.trim().length > 0
      ? `${formattedEntry}\n\n${currentTimeline}`
      : formattedEntry;

    onSaveField(task.id, { notes: buildTaskNotes(parsed, updatedTimeline) });
    setNewNoteText('');
  };

  const parsedMeta = parseTaskMetadata(task.notes || '');
  const isCategoryInquiry = normalizeCategory(task.category) === 'Inquiry';

  const updateMetaField = (key: string, value: string) => {
    const updatedMeta = { ...parsedMeta, [key]: value };
    onSaveField(task.id, { notes: buildTaskNotes(updatedMeta, updatedMeta.timeline) });
  };

  const isNewInquiry = !task.notes || !task.notes.trim();

  const handleSaveInquiry = () => {
    if (!parsedMeta.workflow_status) {
      const updatedMeta = { ...parsedMeta, workflow_status: DEFAULT_INQUIRY_STATUS };
      onSaveField(task.id, { notes: buildTaskNotes(updatedMeta, updatedMeta.timeline) });
    }
    handleClose();
  };

  if (isCategoryInquiry) {
    return (
      <div className={styles.taskModalOverlay} onClick={handleClose}>
        <div
          className={styles.taskModalCard}
          style={{ borderTop: `4px solid ${PURPLE}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.taskModalHeader}>
            <div className={styles.modalTitleGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                  {isNewInquiry ? 'Log Inquiry' : 'Inquiry Details'}
                </span>
              </div>
              {!isNewInquiry && (
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
              )}
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

          <div className={styles.modalBodyContent}>
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>CMGC Name</label>
              <input
                type="text"
                placeholder="Last Name, First Name"
                value={parsedMeta.cmgc_name || ''}
                onChange={(e) => updateMetaField('cmgc_name', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
              />
            </div>

            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>Inquiry / Concern</label>
              <textarea
                placeholder="Enter client's inquiry or concern..."
                value={parsedMeta.inquiry_concern || ''}
                onChange={(e) => updateMetaField('inquiry_concern', e.target.value)}
                rows={5}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full resize-none"
              />
            </div>

            {!isNewInquiry && (
              <div className={styles.userPickerContainer}>
                <label className={styles.formFieldLabel}>Workflow Status</label>
                <select
                  value={parsedMeta.workflow_status || DEFAULT_INQUIRY_STATUS}
                  onChange={(e) => updateMetaField('workflow_status', e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold"
                >
                  {INQUIRY_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            {!isUserView && !isNewInquiry ? (
              <button
                type="button"
                className={styles.deleteOutlinedBtn}
                onClick={() => {
                  onDeleteTask(task.id);
                  onClose();
                }}
              >
                <Trash2 size={13} strokeWidth={2} />
                Delete Inquiry
              </button>
            ) : (
              <div />
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
                style={{ background: PURPLE }}
                onClick={handleSaveInquiry}
              >
                Save Inquiry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.taskModalOverlay} onClick={handleClose}>
      <div
        className={styles.taskModalCard}
        style={{ borderTop: `4px solid ${currentStatusColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className={styles.modalBodyContent}>
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
            <CategoryPickerSelect
              value={normalizeCategory(task.category)}
              onChange={(val) => {
                onSaveField(task.id, { category: val });
                if (val === 'Inquiry') {
                  updateMetaField('workflow_status', DEFAULT_INQUIRY_STATUS);
                } else {
                  updateMetaField('workflow_status', DEFAULT_WORKFLOW_STATUS);
                }
              }}
            />
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>Workflow Status</label>
              <select
                value={parsedMeta.workflow_status || DEFAULT_WORKFLOW_STATUS}
                onChange={(e) => updateMetaField('workflow_status', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold"
              >
                {WORKFLOW_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalTwoCol}>
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>Policy Owner</label>
              <input
                type="text"
                placeholder="Search or enter manually..."
                value={parsedMeta.policy_owner || ''}
                onChange={(e) => updateMetaField('policy_owner', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
              />
            </div>
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>Date of Request</label>
              <input
                type="date"
                value={parsedMeta.date_of_request || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateMetaField('date_of_request', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
              />
            </div>
          </div>
          <div className={styles.modalTwoCol}>
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>Number of Policy Insured</label>
              <select
                value={parsedMeta.policy_insured_count || '1'}
                onChange={(e) => updateMetaField('policy_insured_count', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium"
              >
                {['1', '2', '3', '4', '5+'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>Policy Number</label>
              <input
                type="text"
                placeholder="Enter Policy Number"
                value={parsedMeta.policy_number || ''}
                onChange={(e) => updateMetaField('policy_number', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
              />
            </div>
          </div>

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

          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>
              Messenger Timeline & Notes
            </label>
            {parsedMeta.timeline && parsedMeta.timeline.trim().length > 0 && (
              <div className={styles.notesTimeline} style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {parsedMeta.timeline.split('\n\n').filter(Boolean).map((noteBlock: string, idx: number) => (
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