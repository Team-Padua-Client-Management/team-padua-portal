import React, { useEffect, useState, useMemo } from 'react';
import UserAvatar, { UserProfile } from './UserAvatar';
import { normalizeCategory, formatRelativeTime } from './TaskRow';
import { formatDisplayDate } from './ActivityCard';
import {
    WorkflowTaskItem,
    DEFAULT_WORKFLOW_STATUS,
    policyRelationshipLabel,
    WORKFLOW_STATUS_OPTIONS,
    WorkflowStatus,
    buildWorkflowStatusUpdate,
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
    onSaveTaskField?: (taskId: string, updates: Record<string, unknown>) => void;
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

    // Local form field state for inline editing
    const [policyOwner, setPolicyOwner] = useState(meta.policy_owner || '');
    const [policyInsured, setPolicyInsured] = useState(meta.policy_insured || '');
    const [policyNumber, setPolicyNumber] = useState(meta.policy_number || '');
    const [dateOfRequest, setDateOfRequest] = useState(meta.date_of_request || '');
    const [timeline, setTimeline] = useState(meta.timeline || '');

    useEffect(() => {
        setPolicyOwner(meta.policy_owner || '');
        setPolicyInsured(meta.policy_insured || '');
        setPolicyNumber(meta.policy_number || '');
        setDateOfRequest(meta.date_of_request || '');
        setTimeline(meta.timeline || '');
    }, [meta.policy_owner, meta.policy_insured, meta.policy_number, meta.date_of_request, meta.timeline]);

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
    const estimatedCardHeight = 560;
    const rawTop = rect.top + rect.height / 2 - estimatedCardHeight / 2;
    const top = Math.min(
        Math.max(rawTop, VIEWPORT_MARGIN),
        viewportHeight - estimatedCardHeight - VIEWPORT_MARGIN
    );

    const currentWorkflowStatus = meta.workflow_status || DEFAULT_WORKFLOW_STATUS;
    const categoryLabel = normalizeCategory(task.category);

    // Combine & deduplicate profile list for Processed By / Assigned To dropdowns
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

    const handleSaveMetaField = (key: string, value: any) => {
        if (!onSaveTaskField) return;
        const currentMeta = parseTaskMetadata(task.notes || '');
        const updatedMeta = { ...currentMeta, [key]: value };
        if (
            key === 'policy_owner' &&
            (updatedMeta.policy_insured_relationship === 'SAME_AS_OWNER' || !updatedMeta.policy_insured_relationship)
        ) {
            updatedMeta.policy_insured = value;
        }
        const newNotes = buildTaskNotes(updatedMeta, updatedMeta.timeline || timeline);
        onSaveTaskField(task.id, { notes: newNotes });
    };

    const handleSaveTimeline = (newTimeline: string) => {
        if (!onSaveTaskField) return;
        const currentMeta = parseTaskMetadata(task.notes || '');
        const newNotes = buildTaskNotes(currentMeta, newTimeline);
        onSaveTaskField(task.id, { notes: newNotes });
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
                    top: `${Math.min(Math.max(rect.top + rect.height / 2 - top, 24), 536)}px`,
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
                        Interactive edit preview
                    </div>
                </div>
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

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ ...fieldBoxStyle, background: '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Policy Owner</div>
                        <input
                            type="text"
                            value={policyOwner}
                            onChange={(e) => setPolicyOwner(e.target.value)}
                            onBlur={() => handleSaveMetaField('policy_owner', policyOwner)}
                            placeholder="Enter Policy Owner..."
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ ...fieldBoxStyle, background: '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Policy Insured</div>
                        <input
                            type="text"
                            value={policyInsured}
                            onChange={(e) => setPolicyInsured(e.target.value)}
                            onBlur={() => handleSaveMetaField('policy_insured', policyInsured)}
                            placeholder="Enter Policy Insured..."
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Policy Number</div>
                        <input
                            type="text"
                            value={policyNumber}
                            onChange={(e) => setPolicyNumber(e.target.value)}
                            onBlur={() => handleSaveMetaField('policy_number', policyNumber)}
                            placeholder="Enter Policy Number..."
                            style={inputStyle}
                        />
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Workflow Status</div>
                        {onSaveTaskField ? (
                            <select
                                value={currentWorkflowStatus}
                                onChange={(e) => {
                                    const nextStatus = e.target.value as WorkflowStatus;
                                    onSaveTaskField(task.id, buildWorkflowStatusUpdate(task, nextStatus));
                                }}
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
                                {currentWorkflowStatus}
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
                        <UserAvatar profile={processedProfile} size={28} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={sectionLabelStyle}>Processed By</div>
                            {onSaveTaskField && availableProfiles.length > 0 ? (
                                <select
                                    value={task.processed_by || ''}
                                    onChange={(e) => {
                                        onSaveTaskField(task.id, { processed_by: e.target.value || null });
                                    }}
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
                                    {processedProfile?.full_name || processedProfile?.email || 'Unassigned'}
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
                        <UserAvatar profile={assignedProfile} size={28} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={sectionLabelStyle}>Assigned To</div>
                            {onSaveTaskField && availableProfiles.length > 0 ? (
                                <select
                                    value={task.assigned_to || ''}
                                    onChange={(e) => {
                                        onSaveTaskField(task.id, { assigned_to: e.target.value || null });
                                    }}
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
                                    {assignedProfile?.full_name || assignedProfile?.email || 'Unassigned'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ ...fieldBoxStyle, background: '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Date Requested</div>
                        <input
                            type="date"
                            value={dateOfRequest}
                            onChange={(e) => {
                                setDateOfRequest(e.target.value);
                                handleSaveMetaField('date_of_request', e.target.value);
                            }}
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
                    <textarea
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        onBlur={() => handleSaveTimeline(timeline)}
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
                </div>
            </div>
        </div>
    );
};

export default ClientServicingPreview;