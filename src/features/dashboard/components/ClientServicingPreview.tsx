import React, { useEffect, useState } from 'react';
import UserAvatar, { UserProfile } from './UserAvatar';
import { normalizeCategory, formatRelativeTime } from './TaskRow';
import { formatDisplayDate } from './ActivityCard';
import { WorkflowTaskItem, DEFAULT_WORKFLOW_STATUS, policyRelationshipLabel } from './TaskList';

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
    rect: PreviewRect;
}

export const ClientServicingPreview: React.FC<ClientServicingPreviewProps> = ({
    task,
    meta,
    assignedProfile,
    processedProfile,
    rect,
}) => {
    const [entered, setEntered] = useState(false);

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
    const relationshipLabel = meta.policy_insured_relationship
        ? policyRelationshipLabel(meta.policy_insured_relationship)
        : null;

    const assignedName = assignedProfile?.full_name || assignedProfile?.email || 'Unassigned';
    const processedName = processedProfile?.full_name || processedProfile?.email || 'Unassigned';

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '0.66rem',
        fontWeight: 800,
        letterSpacing: '0.06em',
        color: GOLD_HOVER,
        textTransform: 'uppercase',
        marginBottom: '4px',
    };

    const fieldValueStyle: React.CSSProperties = {
        fontSize: '0.88rem',
        fontWeight: 700,
        color: '#1A1A1A',
        wordBreak: 'break-word',
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
                pointerEvents: 'none',
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
                        Read-only preview
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
                        <div style={fieldValueStyle}>{meta.policy_owner || 'N/A'}</div>
                    </div>

                    <div style={{ ...fieldBoxStyle, background: '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Policy Insured</div>
                        <div style={fieldValueStyle}>
                            {relationshipLabel === 'SAME AS OWNER' || !meta.policy_insured
                                ? meta.policy_owner || 'N/A'
                                : meta.policy_insured}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Policy Number</div>
                        <div style={fieldValueStyle}>{meta.policy_number || 'N/A'}</div>
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Workflow Status</div>
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
                            <div style={{ ...fieldValueStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {processedName}
                            </div>
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
                            <div style={{ ...fieldValueStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {assignedName}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ ...fieldBoxStyle, background: '#FCFAF4' }}>
                        <div style={sectionLabelStyle}>Date Requested</div>
                        <div style={{ ...fieldValueStyle, fontSize: '0.78rem' }}>
                            {meta.date_of_request ? formatDisplayDate(meta.date_of_request) : 'N/A'}
                        </div>
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Created</div>
                        <div style={{ ...fieldValueStyle, fontSize: '0.78rem' }}>
                            {task.created_at ? formatDisplayDate(task.created_at.slice(0, 10)) : 'N/A'}
                        </div>
                    </div>

                    <div style={fieldBoxStyle}>
                        <div style={sectionLabelStyle}>Updated</div>
                        <div style={{ ...fieldValueStyle, fontSize: '0.78rem' }}>
                            {task.updated_at ? formatRelativeTime(task.updated_at) : 'N/A'}
                        </div>
                    </div>
                </div>

                <div>
                    <div style={sectionLabelStyle}>Messenger Timeline</div>
                    <div
                        style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: `1px solid ${GOLD_BORDER}`,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#1A1A1A',
                            background: '#FFFFFF',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {meta.timeline && meta.timeline.trim().length > 0
                            ? meta.timeline
                            : 'No notes logged yet.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientServicingPreview;