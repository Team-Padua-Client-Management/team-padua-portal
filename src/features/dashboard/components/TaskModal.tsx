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
  Check,
} from 'lucide-react';

import { TaskItem, formatRelativeTime, TASK_CATEGORIES, normalizeCategory } from './TaskRow';
import {
  parseTaskMetadata,
  buildTaskNotes,
  buildWorkflowStatusUpdate,
  WorkflowTaskItem,
  WorkflowStatus,
  DEFAULT_INQUIRY_STATUS,
  DEFAULT_WORKFLOW_STATUS,
  getRemainingWorkflowOptions,
  POLICY_RELATIONSHIP_OPTIONS,
  DEFAULT_POLICY_RELATIONSHIP,
  policyRelationshipLabel,
} from './TaskList';
import UserAvatar, { UserProfile } from './UserAvatar';
import UserPickerSelect from './UserPickerSelect';
import { formatDisplayDate } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';
import { getStatusColorHex } from './StatusBadge';

const ACCENT = '#D69E00';
const ACCENT_STRONG = '#92650A';
const ACCENT_SOFT_BG = '#FFFBEB';
const ACCENT_SOFT_BORDER = '#F3E3B9';
const RADIUS = '16px';

const cardShellStyle: React.CSSProperties = {
  border: `1px solid ${ACCENT_SOFT_BORDER}`,
  borderRadius: RADIUS,
  padding: '14px',
  background: '#FFFFFF',
};

const inputStyle: React.CSSProperties = {
  borderRadius: RADIUS,
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: ACCENT_STRONG,
        marginBottom: '6px',
        display: 'block',
      }}
    >
      {children}
      {required && <span style={{ color: '#DC2626' }}> *</span>}
    </label>
  );
}

function StageBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        display: 'inline-block',
        background: active ? ACCENT : '#E5E7EB',
        flexShrink: 0,
      }}
    />
  );
}

interface PolicyOwnerGroup {
  owner: string;
  insured: string;
  policyNumber: string;
  serviceRequestNumber?: string;
}

export const INQUIRY_TYPE_OPTIONS = ['Address Concern', 'Pending Response', 'Client Servicing'] as const;
export type InquiryType = typeof INQUIRY_TYPE_OPTIONS[number];

export const INQUIRY_TYPE_TO_WORKFLOW_STATUS: Record<string, string> = {
  'Address Concern': 'Addressed Concerns',
  'Pending Response': 'Pending Response',
};

const WORKFLOW_STAGES = [
  'Pending for Submission',
  'Submitted Requests',
  'Submitted with Pending Requirements',
  'Approved Requests',
] as const;

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
          serviceRequestNumber: typeof g?.serviceRequestNumber === 'string'
            ? g.serviceRequestNumber
            : (typeof g?.service_request_number === 'string' ? g.service_request_number : (parsedMeta.service_request_number || '')),
        }));
      }
    } catch {
      return [
        {
          owner: parsedMeta.policy_owner || '',
          insured: parsedMeta.policy_insured || '',
          policyNumber: parsedMeta.policy_number || '',
          serviceRequestNumber: parsedMeta.service_request_number || '',
        },
      ];
    }
  }

  return [
    {
      owner: parsedMeta.policy_owner || '',
      insured: parsedMeta.policy_insured || '',
      policyNumber: parsedMeta.policy_number || '',
      serviceRequestNumber: parsedMeta.service_request_number || '',
    },
  ];
}

function serializePolicyGroups(groups: PolicyOwnerGroup[]): string {
  return JSON.stringify(groups.map((g) => ({
    owner: g.owner,
    insured: g.insured,
    policyNumber: g.policyNumber,
    serviceRequestNumber: g.serviceRequestNumber || '',
  })));
}

interface PolicyOwnerGroupCardProps {
  group: PolicyOwnerGroup;
  relationship: string;
  showRemoveGroup: boolean;
  isSettingUpTask: boolean;
  onOwnerChange: (val: string) => void;
  onInsuredChange: (val: string) => void;
  onPolicyNumberChange: (val: string) => void;
  onServiceRequestNumberChange: (val: string) => void;
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
  onServiceRequestNumberChange,
  onRemoveGroup,
}: PolicyOwnerGroupCardProps) {
  const isDifferentFromOwner = relationship === 'DIFFERENT_FROM_OWNER';
  const ownerMissing = !isSettingUpTask && group.owner.trim().length === 0;
  const insuredMissing = !isSettingUpTask && isDifferentFromOwner && group.insured.trim().length === 0;
  const policyNumberMissing = !isSettingUpTask && group.policyNumber.trim().length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ ...cardShellStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div className={styles.userPickerContainer} style={{ flexGrow: 1 }}>
            <FieldLabel required={!isSettingUpTask}>Policy Owner</FieldLabel>
            <input
              type="text"
              placeholder="Enter the Name of the Policy Owner"
              value={group.owner}
              onChange={(e) => onOwnerChange(e.target.value)}
              className="px-3 py-2.5 border border-border bg-surface text-sm font-medium w-full"
              style={{ ...inputStyle, borderColor: ownerMissing ? '#DC2626' : undefined }}
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
                borderRadius: RADIUS,
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
              <FieldLabel required={!isSettingUpTask}>Policy Insured</FieldLabel>
              <input
                type="text"
                placeholder="Enter the Name of the Policy Insured"
                value={group.insured}
                onChange={(e) => onInsuredChange(e.target.value)}
                className="px-3 py-2.5 border border-border bg-surface text-sm font-medium w-full"
                style={{ ...inputStyle, borderColor: insuredMissing ? '#DC2626' : undefined }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={cardShellStyle}>
        <div className={styles.userPickerContainer}>
          <FieldLabel required={!isSettingUpTask}>Policy Number</FieldLabel>
          <input
            type="number"
            placeholder="Enter Policy Number"
            value={group.policyNumber}
            onChange={(e) => onPolicyNumberChange(e.target.value)}
            className="px-3 py-2.5 border border-border bg-surface text-sm font-medium w-full"
            style={{ ...inputStyle, borderColor: policyNumberMissing ? '#DC2626' : undefined }}
          />
        </div>
      </div>

      <div style={cardShellStyle}>
        <div className={styles.userPickerContainer}>
          <FieldLabel>Service Request Number</FieldLabel>
          <input
            type="text"
            placeholder="Enter Service Request Number (e.g. SR-12345678)"
            value={group.serviceRequestNumber || ''}
            onChange={(e) => onServiceRequestNumberChange(e.target.value)}
            className="px-3 py-2.5 border border-border bg-surface text-sm font-medium w-full"
            style={inputStyle}
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

  const updateServiceRequestNumber = (groupIdx: number, value: string) => {
    onGroupsChange(groups.map((g, i) => (i === groupIdx ? { ...g, serviceRequestNumber: value } : g)));
  };

  const removeOwnerGroup = (groupIdx: number) => {
    const next = groups.filter((_, i) => i !== groupIdx);
    onGroupsChange(next.length > 0 ? next : [{ owner: '', insured: '', policyNumber: '', serviceRequestNumber: '' }]);
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
          onServiceRequestNumberChange={(val) => updateServiceRequestNumber(idx, val)}
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
      <FieldLabel>Category</FieldLabel>
      <button
        type="button"
        className={styles.userPickerTrigger}
        style={inputStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.userPickerName} style={{ fontWeight: 500 }}>
          {normalized}
        </span>
        <ChevronDown size={14} className={styles.userPickerChevron} />
      </button>

      {isOpen && (
        <div className={styles.userPickerDropdown} style={{ borderRadius: RADIUS, overflow: 'hidden' }}>
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
                  style={isSelected ? { background: ACCENT_SOFT_BG } : undefined}
                  onClick={() => {
                    onChange(cat);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className={styles.userInfoCol}>
                    <span className={styles.userName}>{cat}</span>
                  </div>
                  {isSelected && <Check size={13} style={{ color: ACCENT, flexShrink: 0 }} />}
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

function WorkflowStatusDropdown({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = WORKFLOW_STAGES.indexOf(current as typeof WORKFLOW_STAGES[number]);

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
      <FieldLabel>Workflow Status</FieldLabel>
      <button
        type="button"
        className={styles.userPickerTrigger}
        style={inputStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.userPickerName} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <StageBadge active />
          {current}
        </span>
        <ChevronDown size={14} className={styles.userPickerChevron} />
      </button>

      {isOpen && (
        <div className={styles.userPickerDropdown} style={{ borderRadius: RADIUS, overflow: 'hidden' }}>
          <div className={styles.userPickerList}>
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isSelected = stage === current;
              return (
                <div
                  key={stage}
                  className={`${styles.userPickerOption} ${isSelected ? styles.userPickerOptionSelected : ''}`}
                  style={isSelected ? { background: ACCENT_SOFT_BG } : undefined}
                  onClick={() => {
                    onSelect(stage);
                    setIsOpen(false);
                  }}
                >
                  <div className={styles.userInfoCol} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StageBadge active={isSelected} />
                    <span className={styles.userName}>{stage}</span>
                  </div>
                  {isSelected && <Check size={13} style={{ color: ACCENT, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientServicingModal({
  task,
  allProfiles,
  bizDevProfiles,
  currentUserProfile,
  onSaveField,
  onDeleteTask,
  onClose,
  isUserView,
}: {
  task: TaskItem;
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  currentUserProfile?: UserProfile | null;
  onSaveField: (taskId: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
  isUserView: boolean;
}) {
  const [newNoteText, setNewNoteText] = useState('');

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

  const updateMetaField = (key: string, value: string) => {
    const updatedMeta = { ...parsedMeta, [key]: value };
    onSaveField(task.id, { notes: buildTaskNotes(updatedMeta, updatedMeta.timeline) });
  };

  const updateWorkflowStatus = (nextStatus: string) => {
    onSaveField(task.id, buildWorkflowStatusUpdate(task as WorkflowTaskItem, nextStatus as WorkflowStatus));
  };

  const policyRelationship = parsedMeta.policy_insured_relationship || DEFAULT_POLICY_RELATIONSHIP;
  const policyGroups = useMemo(
    () => parsePolicyGroups(parsedMeta),
    [parsedMeta.policy_groups, parsedMeta.policy_owner, parsedMeta.policy_insured, parsedMeta.policy_number, parsedMeta.service_request_number]
  );

  const savePolicyGroups = (newGroups: PolicyOwnerGroup[]) => {
    const updatedMeta: any = { ...parsedMeta };
    delete updatedMeta.policy_insured_count;
    updatedMeta.policy_groups = serializePolicyGroups(newGroups);
    updatedMeta.policy_owner = newGroups[0]?.owner || '';
    updatedMeta.policy_insured = newGroups[0]?.insured || '';
    updatedMeta.policy_number = newGroups[0]?.policyNumber || '';
    updatedMeta.service_request_number = newGroups[0]?.serviceRequestNumber || '';
    onSaveField(task.id, { notes: buildTaskNotes(updatedMeta, updatedMeta.timeline) });
  };

  const handlePolicyRelationshipChange = (value: string) => {
    let nextGroups = policyGroups;
    if (value === 'SAME_AS_OWNER') {
      nextGroups = policyGroups.slice(0, 1);
      if (nextGroups.length === 0) nextGroups = [{ owner: '', insured: '', policyNumber: '', serviceRequestNumber: '' }];
    }
    const updatedMeta: any = { ...parsedMeta };
    delete updatedMeta.policy_insured_count;
    updatedMeta.policy_insured_relationship = value;
    updatedMeta.policy_groups = serializePolicyGroups(nextGroups);
    updatedMeta.policy_owner = nextGroups[0]?.owner || '';
    updatedMeta.policy_insured = nextGroups[0]?.insured || '';
    updatedMeta.policy_number = nextGroups[0]?.policyNumber || '';
    updatedMeta.service_request_number = nextGroups[0]?.serviceRequestNumber || '';
    onSaveField(task.id, { notes: buildTaskNotes(updatedMeta, updatedMeta.timeline) });
  };

  const currentWorkflowStatus = parsedMeta.workflow_status || DEFAULT_WORKFLOW_STATUS;
  const remainingWorkflowOptions = getRemainingWorkflowOptions(currentWorkflowStatus);
  const usesFourStageWorkflow = WORKFLOW_STAGES.includes(currentWorkflowStatus as typeof WORKFLOW_STAGES[number]);

  return (
    <div className={styles.taskModalOverlay} onClick={handleClose}>
      <style jsx>{`
        .modalScrollArea {
          scrollbar-width: thin;
          scrollbar-color: rgba(214, 158, 0, 0.35) transparent;
        }
        .modalScrollArea::-webkit-scrollbar {
          width: 6px;
        }
        .modalScrollArea::-webkit-scrollbar-track {
          background: transparent;
        }
        .modalScrollArea::-webkit-scrollbar-thumb {
          background-color: rgba(214, 158, 0, 0.35);
          border-radius: 999px;
        }
        .modalScrollArea::-webkit-scrollbar-thumb:hover {
          background-color: rgba(214, 158, 0, 0.55);
        }
      `}</style>
      <div
        className={styles.taskModalCard}
        style={{ borderTop: `4px solid ${currentStatusColor}`, borderRadius: RADIUS, background: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.taskModalHeader}>
          <div className={styles.modalTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className={styles.modalTitleInput}
                style={inputStyle}
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
            style={{ borderRadius: RADIUS, background: ACCENT_SOFT_BG }}
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <div className={`${styles.modalBodyContent} modalScrollArea`}>
          <div className={styles.modalTwoCol}>
            <CategoryPickerSelect
              value={normalizeCategory(task.category)}
              onChange={(val) => {
                onSaveField(task.id, { category: val });
                if (val === 'Inquiry') {
                  updateMetaField('workflow_status', DEFAULT_INQUIRY_STATUS);
                } else {
                  updateWorkflowStatus(DEFAULT_WORKFLOW_STATUS);
                }
              }}
            />
            {usesFourStageWorkflow ? (
              <WorkflowStatusDropdown current={currentWorkflowStatus} onSelect={updateWorkflowStatus} />
            ) : (
              <div className={styles.userPickerContainer}>
                <FieldLabel>Workflow Status</FieldLabel>
                <select
                  value={currentWorkflowStatus}
                  onChange={(e) => updateWorkflowStatus(e.target.value)}
                  className="px-3 py-2.5 border border-border bg-surface text-sm font-semibold"
                  style={inputStyle}
                >
                  <option value={currentWorkflowStatus} disabled hidden>
                    {currentWorkflowStatus}
                  </option>
                  {remainingWorkflowOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.userPickerContainer}>
            <FieldLabel>Policy Insured Relationship</FieldLabel>
            <select
              value={policyRelationship}
              onChange={(e) => handlePolicyRelationshipChange(e.target.value)}
              className="px-3 py-2.5 border border-border bg-surface text-sm font-semibold w-full"
              style={inputStyle}
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
            <FieldLabel>Date of Request</FieldLabel>
            <input
              type="date"
              value={parsedMeta.date_of_request || new Date().toISOString().split('T')[0]}
              onChange={(e) => updateMetaField('date_of_request', e.target.value)}
              className="px-3 py-2.5 border border-border bg-surface text-sm font-medium w-full"
              style={inputStyle}
            />
          </div>

          {!isUserView ? (
            <div className={styles.modalTwoCol}>
              <div className={styles.userPickerContainer}>
                <FieldLabel>Processed By</FieldLabel>
                <div className={styles.fixedUserTrigger} style={inputStyle}>
                  <div className={styles.userPickerBadge}>
                    <UserAvatar profile={processedAuthor} size={20} />
                    <span className={styles.userPickerName}>
                      {processedAuthor?.full_name || processedAuthor?.email || 'Admin'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 border border-border"
                    style={{ borderRadius: RADIUS, background: ACCENT_SOFT_BG, color: ACCENT_STRONG }}
                  >
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
            <div
              className="p-3 border border-border/50 flex items-center justify-between my-2 text-xs"
              style={{ borderRadius: RADIUS, background: ACCENT_SOFT_BG }}
            >
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
            <FieldLabel>Messenger Timeline &amp; Notes</FieldLabel>
            {parsedMeta.timeline && parsedMeta.timeline.trim().length > 0 && (
              <div className={`${styles.notesTimeline} modalScrollArea`} style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {parsedMeta.timeline.split('\n\n').filter(Boolean).map((noteBlock: string, idx: number) => (
                  <div
                    key={`note-bubble-${idx}`}
                    className={styles.noteBubble}
                    style={{ borderRadius: RADIUS, background: ACCENT_SOFT_BG }}
                  >
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
                style={inputStyle}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type a new update note message..."
                rows={2}
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="absolute right-3 bottom-3 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
                style={{ borderRadius: RADIUS, background: ACCENT, color: '#FFFFFF' }}
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
              style={{ borderRadius: RADIUS }}
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
              style={{ borderRadius: RADIUS }}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.goldSaveBtn}
              style={{ background: currentStatusColor, borderRadius: RADIUS }}
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
  return (
    <ClientServicingModal
      task={task}
      allProfiles={allProfiles}
      bizDevProfiles={bizDevProfiles}
      currentUserProfile={currentUserProfile}
      onSaveField={onSaveField}
      onDeleteTask={onDeleteTask}
      onClose={onClose}
      isUserView={isUserView}
    />
  );
}