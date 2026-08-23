import React, { useState } from 'react';
import { Pencil, ChevronDown, Clock, User, Shield, Hash, Calendar, FileText } from 'lucide-react';
import { WorkflowTaskItem, parseTaskMetadata, DEFAULT_WORKFLOW_STATUS, DEFAULT_POLICY_RELATIONSHIP } from '../TaskList';
import { UserProfile } from '../UserAvatar';
import LogStatusBadge from './LogStatusBadge';
import { formatDate, formatDateTime, getCategoryMeta } from './types';

interface ServicingLogCardProps {
  task: WorkflowTaskItem;
  allProfiles: UserProfile[];
  onEdit?: (taskId: string) => void;
  canEdit?: boolean;
}

function MetadataField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[105px] flex-1">
      <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {Icon && <Icon size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />}
        {label}
      </span>
      <span
        className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate"
        title={typeof value === 'string' ? value : undefined}
      >
        {value ?? 'N/A'}
      </span>
    </div>
  );
}

export default function ServicingLogCard({
  task,
  allProfiles,
  onEdit,
  canEdit = true,
}: ServicingLogCardProps) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const meta = parseTaskMetadata(task.notes || '');
  const workflowStatus = meta.workflow_status || (task as any).workflow_status || task.status || DEFAULT_WORKFLOW_STATUS;
  const relationship = meta.policy_insured_relationship || DEFAULT_POLICY_RELATIONSHIP;
  const showInsured = relationship === 'DIFFERENT_FROM_OWNER' && meta.policy_insured;

  const findProfile = (id: string | null | undefined): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || null;
  };

  const processedBy = findProfile(task.processed_by);
  const assignedTo = findProfile(task.assigned_to);
  const categoryMeta = getCategoryMeta(task.category);
  const hasTimeline = !!(meta.timeline && meta.timeline.trim().length > 0);

  return (
    <div className="group bg-white dark:bg-surface rounded-xl border border-slate-200/80 dark:border-border/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-100 dark:border-border/60">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[18px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA] leading-tight tracking-tight">
            {categoryMeta.badge || categoryMeta.title}
          </span>
          <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {categoryMeta.title}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <LogStatusBadge status={workflowStatus} />

          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E8A33D] bg-white dark:bg-surface border border-[#E8A33D] hover:bg-[#E8A33D]/10 transition-all cursor-pointer shadow-2xs"
            >
              <Pencil size={12} strokeWidth={2.5} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Metadata in ONE Single Straight Horizontal Row on Desktop */}
      <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-x-4 gap-y-3.5 pt-0.5">
        <MetadataField
          label="Policy Owner"
          value={meta.policy_owner || task.title}
          icon={User}
        />
        <MetadataField
          label="Policy Number"
          value={meta.policy_number}
          icon={Hash}
        />
        {showInsured && (
          <MetadataField
            label="Policy Insured"
            value={meta.policy_insured}
            icon={Shield}
          />
        )}
        <MetadataField
          label="Date Requested"
          value={formatDate(meta.date_of_request)}
          icon={Calendar}
        />
        <MetadataField
          label="Processed By"
          value={processedBy?.full_name || processedBy?.email || 'N/A'}
          icon={User}
        />
        <MetadataField
          label="Assigned To"
          value={assignedTo?.full_name || assignedTo?.email || 'Unassigned'}
          icon={User}
        />
        <MetadataField
          label="Created"
          value={formatDateTime(task.created_at)}
          icon={Clock}
        />
        <MetadataField
          label="Updated"
          value={formatDateTime(task.updated_at)}
          icon={Clock}
        />
      </div>

      {/* Collapsible Timeline / Notes */}
      {hasTimeline && (
        <div className="rounded-xl border border-slate-200/70 dark:border-border/70 overflow-hidden mt-1">
          <button
            type="button"
            onClick={() => setIsTimelineOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-surface-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-none"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={12} />
              <span>Timeline / Details</span>
            </span>
            <ChevronDown
              size={14}
              className={`transform transition-transform duration-200 ${
                isTimelineOpen ? 'rotate-180 text-[#E8A33D]' : ''
              }`}
            />
          </button>
          {isTimelineOpen && (
            <div className="p-3.5 bg-slate-50/60 dark:bg-surface-2/60 text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto border-t border-slate-200/60 dark:border-border/60">
              {meta.timeline}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
