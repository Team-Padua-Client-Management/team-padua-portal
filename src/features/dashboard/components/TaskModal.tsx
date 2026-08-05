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
  POLICY_RELATIONSHIP_OPTIONS,
  DEFAULT_POLICY_RELATIONSHIP,
  policyRelationshipLabel,
  PURPLE
} from './TaskList';
import UserAvatar, { UserProfile } from './UserAvatar';
import UserPickerSelect from './UserPickerSelect';
import { formatDisplayDate } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';
import { getStatusColorHex } from './StatusBadge';


interface PolicyOwnerGroup {
  owner: string;
  insured: string;
  policyNumber: string;
}

function parsePolicyGroups(parsedMeta: any): PolicyOwnerGroup[] {
  if (parsedMeta.policy_groups) {
    try {
      const parsed = JSON.parse(parsedMeta.policy_groups);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: any) => ({
          owner: typeof g?.owner === 'string' ? g.owner : '',
          insured: typeof g?.insured === 'string'
            ? g.insured
            : (Array.isArray(g?.insureds) && typeof g.insureds[0] === 'string' ? g.insureds[0] : ''),
          policyNumber: typeof g?.policyNumber === 'string'
            ? g.policyNumber
            : (typeof g?.policy_number === 'string' ? g.policy_number : ''),
        }));
      }
    } catch {
      return [
        {
          owner: parsedMeta.policy_owner || '',
          insured: parsedMeta.policy_insured || '',
          policyNumber: parsedMeta.policy_number || '',
        },
      ];
    }
  }

  return [
    {
      owner: parsedMeta.policy_owner || '',
      insured: parsedMeta.policy_insured || '',
      policyNumber: parsedMeta.policy_number || '',
    },
  ];
}

function serializePolicyGroups(groups: PolicyOwnerGroup[]): string {
  return JSON.stringify(groups.map((g) => ({ owner: g.owner, insured: g.insured, policyNumber: g.policyNumber })));
}

interface PolicyOwnerGroupCardProps {
  group: PolicyOwnerGroup;
  relationship: string;
  showRemoveGroup: boolean;
  isSettingUpTask: boolean;
  onOwnerChange: (val: string) => void;
  onInsuredChange: (val: string) => void;
  onPolicyNumberChange: (val: string) => void;
  onRemoveGroup: () => void;
}

function PolicyOwnerGroupCard({
  group,
  relationship,
  showRemoveGroup,
  isSettingUpTask,
  onOwnerChange,
  onInsuredChange,
  onPolicyNumberChange,
  onRemoveGroup,
}: PolicyOwnerGroupCardProps) {
  const isDifferentFromOwner = relationship === 'DIFFERENT_FROM_OWNER';
  const ownerMissing = !isSettingUpTask && group.owner.trim().length === 0;
  const insuredMissing = !isSettingUpTask && isDifferentFromOwner && group.insured.trim().length === 0;
  const policyNumberMissing = !isSettingUpTask && group.policyNumber.trim().length === 0;

  const cardShellStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderLeft: `3px solid ${PURPLE}`,
    borderRadius: '12px',
    padding: '14px',
    background: 'var(--bg-muted)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ ...cardShellStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div className={styles.userPickerContainer} style={{ flexGrow: 1 }}>
            <label className={styles.formFieldLabel}>
              Policy Owner{!isSettingUpTask && <span style={{ color: '#DC2626' }}> *</span>}
            </label>
            <input
              type="text"
              placeholder="Enter the Name of the Policy Owner"
              value={group.owner}
              onChange={(e) => onOwnerChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
              style={ownerMissing ? { borderColor: '#DC2626' } : undefined}
            />
          </div>
          {showRemoveGroup && (
            <button
              type="button"
              onClick={onRemoveGroup}
              style={{
                marginTop: '22px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              className="hover:text-red-500 hover:bg-red-50"
              title="Remove Policy Owner Group"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateRows: isDifferentFromOwner ? '1fr' : '0fr',
            opacity: isDifferentFromOwner ? 1 : 0,
            transform: isDifferentFromOwner ? 'translateY(0)' : 'translateY(-6px)',
            transition: 'grid-template-rows 0.3s ease, opacity 0.25s ease, transform 0.3s ease',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div className={styles.userPickerContainer}>
              <label className={styles.formFieldLabel}>
                Policy Insured{!isSettingUpTask && <span style={{ color: '#DC2626' }}> *</span>}
              </label>
              <input
                type="text"
                placeholder="Enter the Name of the Policy Insured"
                value={group.insured}
                onChange={(e) => onInsuredChange(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
                style={insuredMissing ? { borderColor: '#DC2626' } : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={cardShellStyle}>
        <div className={styles.userPickerContainer}>
          <label className={styles.formFieldLabel}>
            Policy Number{!isSettingUpTask && <span style={{ color: '#DC2626' }}> *</span>}
          </label>
          <input
            type="number"
            placeholder="Enter Policy Number"
            value={group.policyNumber}
            onChange={(e) => onPolicyNumberChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
            style={policyNumberMissing ? { borderColor: '#DC2626' } : undefined}
          />
        </div>
      </div>
    </div>
  );
}

interface PolicyOwnerSectionProps {
  relationship: string;
  groups: PolicyOwnerGroup[];
  isSettingUpTask: boolean;
  onGroupsChange: (groups: PolicyOwnerGroup[]) => void;
}

function PolicyOwnerSection({ relationship, groups, isSettingUpTask, onGroupsChange }: PolicyOwnerSectionProps) {
  const isSameAsOwner = relationship === 'SAME_AS_OWNER';
  const visibleGroups = isSameAsOwner ? groups.slice(0, 1) : groups;

  const updateOwner = (groupIdx: number, value: string) => {
    onGroupsChange(groups.map((g, i) => (i === groupIdx ? { ...g, owner: value } : g)));
  };

  const updateInsured = (groupIdx: number, value: string) => {
    onGroupsChange(groups.map((g, i) => (i === groupIdx ? { ...g, insured: value } : g)));
  };

  const updatePolicyNumber = (groupIdx: number, value: string) => {
    onGroupsChange(groups.map((g, i) => (i === groupIdx ? { ...g, policyNumber: value } : g)));
  };

  const removeOwnerGroup = (groupIdx: number) => {
    const next = groups.filter((_, i) => i !== groupIdx);
    onGroupsChange(next.length > 0 ? next : [{ owner: '', insured: '', policyNumber: '' }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {visibleGroups.map((group, idx) => (
        <PolicyOwnerGroupCard
          key={`owner-group-${idx}`}
          group={group}
          relationship={relationship}
          showRemoveGroup={!isSameAsOwner && groups.length > 1}
          isSettingUpTask={isSettingUpTask}
          onOwnerChange={(val) => updateOwner(idx, val)}
          onInsuredChange={(val) => updateInsured(idx, val)}
          onPolicyNumberChange={(val) => updatePolicyNumber(idx, val)}
          onRemoveGroup={() => removeOwnerGroup(idx)}
        />
      ))}
    </div>
  );
}

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

  const policyRelationship = parsedMeta.policy_insured_relationship || DEFAULT_POLICY_RELATIONSHIP;
  const policyGroups = useMemo(
    () => parsePolicyGroups(parsedMeta),
    [parsedMeta.policy_groups, parsedMeta.policy_owner, parsedMeta.policy_insured, parsedMeta.policy_number]
  );

  const savePolicyGroups = (newGroups: PolicyOwnerGroup[]) => {
    const updatedMeta: any = { ...parsedMeta };
    delete updatedMeta.policy_insured_count;
    updatedMeta.policy_groups = serializePolicyGroups(newGroups);
    updatedMeta.policy_owner = newGroups[0]?.owner || '';
    updatedMeta.policy_insured = newGroups[0]?.insured || '';
    updatedMeta.policy_number = newGroups[0]?.policyNumber || '';
    onSaveField(task.id, { notes: buildTaskNotes(updatedMeta, updatedMeta.timeline) });
  };

  const handlePolicyRelationshipChange = (value: string) => {
    let nextGroups = policyGroups;
    if (value === 'SAME_AS_OWNER') {
      nextGroups = policyGroups.slice(0, 1);
      if (nextGroups.length === 0) nextGroups = [{ owner: '', insured: '', policyNumber: '' }];
    }
    const updatedMeta: any = { ...parsedMeta };
    delete updatedMeta.policy_insured_count;
    updatedMeta.policy_insured_relationship = value;
    updatedMeta.policy_groups = serializePolicyGroups(nextGroups);
    updatedMeta.policy_owner = nextGroups[0]?.owner || '';
    updatedMeta.policy_insured = nextGroups[0]?.insured || '';
    updatedMeta.policy_number = nextGroups[0]?.policyNumber || '';
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

          <div className={styles.userPickerContainer}>
            <label className={styles.formFieldLabel}>Policy Insured Relationship</label>
            <select
              value={policyRelationship}
              onChange={(e) => handlePolicyRelationshipChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold w-full"
            >
              {POLICY_RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {policyRelationshipLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <PolicyOwnerSection
            relationship={policyRelationship}
            groups={policyGroups}
            isSettingUpTask={isSettingUpTask}
            onGroupsChange={savePolicyGroups}
          />

          <div className={styles.userPickerContainer} style={{ maxWidth: '260px' }}>
            <label className={styles.formFieldLabel}>Date of Request</label>
            <input
              type="date"
              value={parsedMeta.date_of_request || new Date().toISOString().split('T')[0]}
              onChange={(e) => updateMetaField('date_of_request', e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium w-full"
            />
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