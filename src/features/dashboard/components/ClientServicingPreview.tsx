import React, { useEffect, useState, useMemo } from 'react';
import { Edit2, Save, Check, Loader2 } from 'lucide-react';
import UserAvatar, { UserProfile } from './UserAvatar';
import { normalizeCategory, formatRelativeTime } from './TaskRow';
import { formatDisplayDate } from './ActivityCard';
import {
    WorkflowTaskItem,
    DEFAULT_WORKFLOW_STATUS,
    WORKFLOW_STATUS_OPTIONS,
    WorkflowStatus,
    buildTaskNotes,
    parseTaskMetadata,
} from './TaskList';

const GOLD = '#D89B1D';
const GOLD_HOVER = '#C58A12';
const GOLD_LIGHT = '#FFF8E8';
const GOLD_BORDER = '#EAD7AE';

export interface PreviewRect {
    top: number;
    left: number;
    right: number;
    height: number;
}

const PREVIEW_CARD_WIDTH = 560;
const PREVIEW_CARD_GAP = 18;
const VIEWPORT_MARGIN = 16;

export interface ClientServicingPreviewProps {
    task: WorkflowTaskItem;
    meta: any;
    assignedProfile: UserProfile | null;
    processedProfile: UserProfile | null;
    allProfiles?: UserProfile[];
    bizDevProfiles?: UserProfile[];
    rect: PreviewRect;
    onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void | Promise<void>;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const ClientServicingPreview: React.FC<ClientServicingPreviewProps> = ({
    task,
    meta,
    assignedProfile,
    processedProfile,
    allProfiles = [],
    bizDevProfiles = [],
    rect,
    onSaveTaskField,
    onMouseEnter,
    onMouseLeave,
}) => {
    const [entered, setEntered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Form field states
    const [policyOwner, setPolicyOwner] = useState(meta.policy_owner || '');
    const [policyInsured, setPolicyInsured] = useState(meta.policy_insured || '');
    const [policyNumber, setPolicyNumber] = useState(meta.policy_number || '');
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>(meta.workflow_status || DEFAULT_WORKFLOW_STATUS);
    const [processedBy, setProcessedBy] = useState(task.processed_by || '');
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
    const [dateOfRequest, setDateOfRequest] = useState(meta.date_of_request || '');
    const [timeline, setTimeline] = useState(meta.timeline || '');

    const resetForm = () => {
        setPolicyOwner(meta.policy_owner || '');
        setPolicyInsured(meta.policy_insured || '');
        setPolicyNumber(meta.policy_number || '');
        setWorkflowStatus(meta.workflow_status || DEFAULT_WORKFLOW_STATUS);
        setProcessedBy(task.processed_by || '');
        setAssignedTo(task.assigned_to || '');
        setDateOfRequest(meta.date_of_request || '');
        setTimeline(meta.timeline || '');
        setSaveError(null);
    };

    useEffect(() => {
        resetForm();
        setIsEditing(false);
    }, [task.id]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const spaceRight = window.innerWidth - rect.right;
    const isRight = spaceRight >= PREVIEW_CARD_WIDTH + PREVIEW_CARD_GAP;

    const rawLeft = isRight ? rect.right + PREVIEW_CARD_GAP : rect.left - PREVIEW_CARD_WIDTH - PREVIEW_CARD_GAP;
    const left = Math.min(
        Math.max(rawLeft, VIEWPORT_MARGIN),
        window.innerWidth - PREVIEW_CARD_WIDTH - VIEWPORT_MARGIN
    );

    const viewportHeight = window.innerHeight;
    const estimatedCardHeight = 580;
    const rawTop = rect.top + rect.height / 2 - estimatedCardHeight / 2;
    const top = Math.min(
        Math.max(rawTop, VIEWPORT_MARGIN),
        viewportHeight - estimatedCardHeight - VIEWPORT_MARGIN
    );

    const categoryLabel = normalizeCategory(task.category);

    // Combine & deduplicate profile list
    const availableProfiles = useMemo(() => {
        const list: UserProfile[] = [];
        const seen = new Set<string>();
        [...allProfiles, ...bizDevProfiles].forEach((p) => {
            if (p && p.id && !seen.has(p.id)) {
                seen.add(p.id);
                list.push(p);
            }
        });
        return list.sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
    }, [allProfiles, bizDevProfiles]);

    const currentProcessedProfile = useMemo(() => {
        if (processedBy) {
            return availableProfiles.find((p) => p.id === processedBy) || processedProfile;
        }
        return processedProfile;
    }, [processedBy, availableProfiles, processedProfile]);

    const currentAssignedProfile = useMemo(() => {
        if (assignedTo) {
            return availableProfiles.find((p) => p.id === assignedTo) || assignedProfile;
        }
        return assignedProfile;
    }, [assignedTo, availableProfiles, assignedProfile]);

    const handleCancel = () => {
        resetForm();
        setIsEditing(false);
    };

    const handleSaveAllChanges = async () => {
        if (!onSaveTaskField) return;
        setIsSaving(true);
        setSaveError(null);

        try {
            const currentMeta = parseTaskMetadata(task.notes || '');
            const updatedMeta = {
                ...currentMeta,
                policy_owner: policyOwner,
                policy_insured: policyInsured,
                policy_number: policyNumber,
                workflow_status: workflowStatus,
                date_of_request: dateOfRequest,
            };

            const newNotes = buildTaskNotes(updatedMeta, timeline);
            const taskUpdates: Record<string, unknown> = {
                notes: newNotes,
            };

            if (processedBy !== (task.processed_by || '')) {
                taskUpdates.processed_by = processedBy || null;
            }
            if (assignedTo !== (task.assigned_to || '')) {
                taskUpdates.assigned_to = assignedTo || null;
            }

            await onSaveTaskField(task.id, taskUpdates);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error saving servicing task:', err);
            setSaveError(err?.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '0.66rem',
        fontWeight: 800,
        letterSpacing: '0.06em',
        color: GOLD_HOVER,
        textTransform: 'uppercase',
        marginBottom: '4px',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        fontSize: '0.88rem',
        fontWeight: 700,
        color: '#1A1A1A',
        fontFamily: 'inherit',
        padding: 0,
    };

    const fieldBoxStyle: React.CSSProperties = {
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: '12px',
        padding: '10px 12px',
        background: '#FFFFFF',
        minWidth: 0,
        boxSizing: 'border-box',
    };

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                width: `${PREVIEW_CARD_WIDTH}px`,
                maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
                boxSizing: 'border-box',
                background: '#FFFFFF',
                borderRadius: '18px',
                border: `1px solid ${GOLD_BORDER}`,
                boxShadow: '0 18px 40px rgba(15,23,42,.14)',
                borderLeft: `4px solid ${GOLD}`,
                zIndex: 9999,
                opacity: entered ? 1 : 0,
                transform: `translateY(0) translateX(${entered ? 0 : isRight ? 10 : -10}px)`,
                transition: 'opacity 0.18s ease-out, transform 0.18s ease-out',
                pointerEvents: 'auto',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: `${Math.min(Math.max(rect.top + rect.height / 2 - top, 24), 550)}px`,
                    ...(isRight ? { left: '-7px' } : { right: '-7px' }),
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '14px',
                    height: '14px',
                    background: '#ffffff',
                    borderLeft: isRight ? `1px solid ${GOLD_BORDER}` : 'none',
                    borderBottom: isRight ? `1px solid ${GOLD_BORDER}` : 'none',
                    borderRight: !isRight ? `1px solid ${GOLD_BORDER}` : 'none',
                    borderTop: !isRight ? `1px solid ${GOLD_BORDER}` : 'none',
                }}
            />

            {/* Header */}
            <div
                style={{
                    padding: '18px 24px',
                    borderBottom: `1px solid ${GOLD_BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: GOLD_LIGHT,
                    borderRadius: '17px 17px 0 0',
                }}
            >
                <div
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '11px',
                        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_HOVER})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '16px',
                    }}
                >
                    📋
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>
                        Client Servicing Request
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#9A7A2E', marginTop: '2px', fontWeight: 600 }}>
                        {isEditing ? 'Editing Servicing Request' : 'Interactive Preview'}
                    </div>
                </div>

                {!isEditing && onSaveTaskField && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            background: '#FFFFFF',
                            border: `1px solid ${GOLD_BORDER}`,
                            cursor: 'pointer',
                        }}
                        className="hover:bg-amber-50"
                        title="Edit Request"
                    >
                        <Edit2 size={13} color={GOLD_HOVER} />
                        Edit
                    </button>
                )}

                <span
                    style={{
                        flexShrink: 0,
                        padding: '5px 12px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        background: GOLD,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {categoryLabel}
                </span>
            </div>

            {/* Banners */}
            {saveSuccess && (
                <div style={{ padding: '8px 20px', background: '#DEF7EC', color: '#03543F', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Changes saved successfully!
                </div>
            )}

            {saveError && (
                <div style={{ padding: '8px 20px', background: '#FDE8E8', color: '#9B1C1C', fontSize: '0.75rem', fontWeight: 700 }}>
                    {saveError}
                </div>
            )}

            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ ...fieldBoxStyle, background: isEditing ? '#FFFFFF' : '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Policy Owner</div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={policyOwner}
                                onChange={(e) => setPolicyOwner(e.target.value)}
                                placeholder="Enter Policy Owner..."
                                style={inputStyle}
                            />
                        ) : (
                            <div style={{ ...inputStyle, fontSize: '0.85rem' }}>
                                {policyOwner || 'N/A'}
                            </div>
                        )}
                    </div>

                    <div style={{ ...fieldBoxStyle, background: isEditing ? '#FFFFFF' : '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Policy Insured</div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={policyInsured}
                                onChange={(e) => setPolicyInsured(e.target.value)}
                                placeholder="Enter Policy Insured..."
                                style={inputStyle}
                            />
                        ) : (
                            <div style={{ ...inputStyle, fontSize: '0.85rem' }}>
                                {policyInsured || 'N/A'}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Policy Number</div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={policyNumber}
                                onChange={(e) => setPolicyNumber(e.target.value)}
                                placeholder="Enter Policy Number..."
                                style={inputStyle}
                            />
                        ) : (
                            <div style={{ ...inputStyle, fontSize: '0.85rem' }}>
                                {policyNumber || 'N/A'}
                            </div>
                        )}
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Workflow Status</div>
                        {isEditing ? (
                            <select
                                value={workflowStatus}
                                onChange={(e) => setWorkflowStatus(e.target.value as WorkflowStatus)}
                                style={{
                                    display: 'inline-block',
                                    marginTop: '2px',
                                    padding: '3px 22px 3px 9px',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    background: `${GOLD_HOVER} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 5px center / 12px`,
                                    border: 'none',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    appearance: 'none',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {WORKFLOW_STATUS_OPTIONS.map((statusOpt) => (
                                    <option key={statusOpt} value={statusOpt} style={{ color: '#111827', background: '#FFFFFF' }}>
                                        {statusOpt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span
                                style={{
                                    display: 'inline-block',
                                    marginTop: '2px',
                                    padding: '3px 9px',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    background: GOLD_HOVER,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {workflowStatus}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                        style={{
                            ...fieldBoxStyle,
                            background: GOLD_LIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <UserAvatar profile={currentProcessedProfile} size={28} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={sectionLabelStyle}>Processed By</div>
                            {isEditing && availableProfiles.length > 0 ? (
                                <select
                                    value={processedBy}
                                    onChange={(e) => setProcessedBy(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: '#1A1A1A',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value="">Unassigned</option>
                                    {availableProfiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name || p.email}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ ...inputStyle, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {currentProcessedProfile?.full_name || currentProcessedProfile?.email || 'Unassigned'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            ...fieldBoxStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <UserAvatar profile={currentAssignedProfile} size={28} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={sectionLabelStyle}>Assigned To</div>
                            {isEditing && availableProfiles.length > 0 ? (
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: '#1A1A1A',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value="">Unassigned</option>
                                    {availableProfiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name || p.email}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ ...inputStyle, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {currentAssignedProfile?.full_name || currentAssignedProfile?.email || 'Unassigned'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ ...fieldBoxStyle, background: '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Date Requested</div>
                        {isEditing ? (
                            <input
                                type="date"
                                value={dateOfRequest}
                                onChange={(e) => setDateOfRequest(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: '#1A1A1A',
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                }}
                            />
                        ) : (
                            <div style={{ ...inputStyle, fontSize: '0.78rem', paddingTop: '2px' }}>
                                {dateOfRequest || 'N/A'}
                            </div>
                        )}
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Created</div>
                        <div style={{ ...inputStyle, fontSize: '0.78rem', paddingTop: '2px' }}>
                            {task.created_at ? formatDisplayDate(task.created_at.slice(0, 10)) : 'N/A'}
                        </div>
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Updated</div>
                        <div style={{ ...inputStyle, fontSize: '0.78rem', paddingTop: '2px' }}>
                            {task.updated_at ? formatRelativeTime(task.updated_at) : 'N/A'}
                        </div>
                    </div>
                </div>

                <div>
                    <div style={sectionLabelStyle}>Messenger Timeline</div>
                    {isEditing ? (
                        <textarea
                            value={timeline}
                            onChange={(e) => setTimeline(e.target.value)}
                            placeholder="Log notes or messenger updates..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: `1px solid ${GOLD_BORDER}`,
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#1A1A1A',
                                background: '#FFFFFF',
                                lineHeight: 1.5,
                                outline: 'none',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: `1px solid ${GOLD_BORDER}`,
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#1A1A1A',
                                background: '#FCFAF4',
                                lineHeight: 1.5,
                                maxHeight: '84px',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {timeline || 'No messenger timeline logged.'}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#4B5563',
                                background: '#F3F4F6',
                                border: '1px solid #E5E7EB',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAllChanges}
                            disabled={isSaving}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_HOVER})`,
                                border: 'none',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 6px rgba(216, 155, 29, 0.3)',
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={13} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientServicingPreview;