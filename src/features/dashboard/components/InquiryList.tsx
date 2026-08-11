import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Plus,
    LayoutGrid,
    ChevronRight,
    Trash2,
    CheckCircle2,
    Hourglass,
} from 'lucide-react';
import { ClientInquiry } from '@src/features/dashboard/types/inquiry';
import { UserProfile } from '@src/features/dashboard/components/UserAvatar';
import { InquiryPreview } from '@src/features/dashboard/components/InquiryPreview';
import styles from '@/styles/admin/dashboard/page.module.css';

const PURPLE = '#6D28D9';
const PURPLE_TINT = 'rgba(109, 40, 217, 0.08)';
const STAGE_CLOSE_DELAY_MS = 200;
const PREVIEW_CLOSE_DELAY_MS = 200;

type InquiryStageId = 'addressed' | 'pending';

interface StageMeta {
    id: InquiryStageId;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const INQUIRY_STAGES: StageMeta[] = [
    { id: 'pending', label: 'Pending Response', icon: Hourglass },
    { id: 'addressed', label: 'Addressed Concerns', icon: CheckCircle2 },
];

const WORKFLOW_STATUS_OPTIONS = ['Addressed Concerns', 'Pending Response'];

function getInquiryStage(inquiry: ClientInquiry): InquiryStageId {
    switch (inquiry.inquiry_type) {
        case 'Address Concern':
            return 'addressed';
        case 'Pending Response':
            return 'pending';
        default:
            return 'pending';
    }
}

function stageToStatus(stage: InquiryStageId) {
    if (stage === 'addressed') return 'Addressed Concerns';
    if (stage === 'pending') return 'Pending Response';
}

interface InquiryTypeMeta {
    label: string;
    accent: string;
}

function getTypeMeta(type: string | null | undefined): InquiryTypeMeta {
    switch (type) {
        case 'Address Concern':
            return { label: 'Addressed Concerns', accent: '#4F46E5' };
        case 'Pending Response':
            return { label: 'Pending Response', accent: '#D97706' };
        default:
            return { label: 'Pending Response', accent: '#C9962E' };
    }
}

function resolveProfile(inquiry: ClientInquiry, allProfiles: UserProfile[]): UserProfile | undefined {
    return (
        allProfiles.find((p) => p.id === inquiry.processed_by) ??
        allProfiles.find((p) => p.id === inquiry.user_id)
    );
}

function useHoverController<T>() {
    const [active, setActive] = useState<T | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelClose = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const scheduleClose = (delay: number) => {
        cancelClose();
        closeTimerRef.current = setTimeout(() => {
            setActive(null);
            closeTimerRef.current = null;
        }, delay);
    };

    const open = (value: T) => {
        cancelClose();
        setActive(value);
    };

    const closeNow = () => {
        cancelClose();
        setActive(null);
    };

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    return { active, open, cancelClose, scheduleClose, closeNow };
}

interface StageCardProps {
    meta: StageMeta;
    count: number;
    active: boolean;
}

function StageCard({ meta, count, active }: StageCardProps) {
    const Icon = meta.icon;
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto',
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                borderRadius: '12px',
                border: active ? `1px solid ${PURPLE}` : '1px solid var(--border)',
                borderLeft: active ? `4px solid ${PURPLE}` : '4px solid transparent',
                background: active ? PURPLE_TINT : 'var(--surface)',
                boxShadow: active ? '0 2px 10px rgba(109, 40, 217, 0.15)' : 'none',
                cursor: 'default',
                padding: '14px 16px',
                gap: '4px',
                transition: 'all 0.2s ease',
            }}
            className="hover:shadow-md"
        >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? PURPLE : 'var(--text-tertiary)' }}>
                <Icon size={20} strokeWidth={2} />
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span
                    style={{
                        fontSize: '26px',
                        fontWeight: 800,
                        color: active ? PURPLE : 'var(--text)',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.03em',
                    }}
                >
                    {count}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{meta.label}</span>
            </span>
            <ChevronRight size={18} strokeWidth={2.5} color={active ? PURPLE : 'var(--text-tertiary)'} />
        </div>
    );
}

interface InquiryRowProps {
    inquiry: ClientInquiry;
    stageId: InquiryStageId;
    remainingOptions: string[];
    onDeleteInquiry: (id: string) => void;
    saveInquiryField: (id: string, updates: Record<string, any>) => Promise<void>;
    onSelectInquiry: (inquiry: ClientInquiry) => void;
    onHoverInquiry: (inquiry: ClientInquiry) => void;
    onLeaveInquiry: () => void;
    allProfiles: UserProfile[];
    onCopyToPending?: (inquiry: ClientInquiry) => void;
    onCopyToAddressed?: (inquiry: ClientInquiry) => void;
}

function InquiryRow({
    inquiry,
    stageId,
    remainingOptions,
    onDeleteInquiry,
    saveInquiryField,
    onSelectInquiry,
    onHoverInquiry,
    onLeaveInquiry,
    allProfiles,
    onCopyToPending,
    onCopyToAddressed,
}: InquiryRowProps) {
    const profile = resolveProfile(inquiry, allProfiles);
    const typeMeta = getTypeMeta(inquiry.inquiry_type);

    return (
        <div
            onMouseEnter={() => onHoverInquiry(inquiry)}
            onMouseLeave={onLeaveInquiry}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${PURPLE}`,
                cursor: 'pointer',
                gap: '14px',
            }}
        >
            <div
                onClick={() => onSelectInquiry(inquiry)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        background: '#D4A017',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        flexShrink: 0,
                    }}
                >
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name || ''}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        (profile?.full_name || 'U').charAt(0).toUpperCase()
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                        {profile?.full_name || 'Unknown User'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#b8860b', fontWeight: 700 }}>
                            {profile?.role || 'USER'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>•</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                            {inquiry.cmgc_name || 'Untitled Client'}
                        </span>
                    </div>

                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: typeMeta.accent,
                            marginTop: 4,
                        }}
                    >
                        {typeMeta.label}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select
                        value=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            if (!value) return;

                            let inquiryType: ClientInquiry['inquiry_type'];
                            switch (value) {
                                case 'Addressed Concerns':
                                    inquiryType = 'Address Concern';
                                    break;
                                case 'Pending Response':
                                    inquiryType = 'Pending Response';
                                    break;
                                default:
                                    return;
                            }

                            saveInquiryField(inquiry.id, { inquiry_type: inquiryType });
                        }}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            background: 'var(--surface)',
                            cursor: 'pointer',
                            minWidth: '140px',
                        }}
                    >
                        <option value="" disabled>
                            Move to...
                        </option>
                        {remainingOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>

                    <select
                        value=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            if (!value) return;
                            if (value === 'Pending for Submission') {
                                onCopyToPending?.(inquiry);
                            } else if (value === 'Addressed Concerns') {
                                onCopyToAddressed?.(inquiry);
                            }
                        }}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            background: 'var(--surface)',
                            cursor: 'pointer',
                            minWidth: '140px',
                        }}
                    >
                        <option value="" disabled>
                            Copy to...
                        </option>
                        {stageId === 'addressed' ? (
                            <option value="Pending for Submission">
                                Pending for Submission
                            </option>
                        ) : (
                            <option value="Addressed Concerns">
                                Addressed Concerns
                            </option>
                        )}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteInquiry(inquiry.id);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    className="hover:text-red-500 hover:bg-red-50"
                    title="Delete Inquiry"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}

interface StagePopoverProps {
    stage: StageMeta;
    inquiries: ClientInquiry[];
    onDeleteInquiry: (id: string) => void;
    saveInquiryField: (id: string, updates: Record<string, any>) => Promise<void>;
    onSelectInquiry: (inquiry: ClientInquiry) => void;
    allProfiles: UserProfile[];
    onCopyToPending?: (inquiry: ClientInquiry) => void;
    onCopyToAddressed?: (inquiry: ClientInquiry) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function StagePopover({
    stage,
    inquiries,
    onDeleteInquiry,
    saveInquiryField,
    onSelectInquiry,
    allProfiles,
    onCopyToPending,
    onCopyToAddressed,
    onMouseEnter,
    onMouseLeave,
}: StagePopoverProps) {
    const total = inquiries.length;
    const { active: hoveredInquiry, open: openPreview, cancelClose: cancelPreviewClose, scheduleClose: schedulePreviewClose } =
        useHoverController<ClientInquiry>();

    const currentStatus = stageToStatus(stage.id);
    const remainingOptions = useMemo(
        () => WORKFLOW_STATUS_OPTIONS.filter((option) => option !== currentStatus),
        [currentStatus]
    );

    const previewProfile = hoveredInquiry ? resolveProfile(hoveredInquiry, allProfiles) : undefined;

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                zIndex: 100,
            }}
            className="stage-popover"
        >
            <div
                style={{
                    width: '460px',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    background: 'var(--surface)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border)',
                        position: 'sticky',
                        top: 0,
                        background: 'var(--surface)',
                        borderRadius: '16px 16px 0 0',
                        zIndex: 10,
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{stage.label}</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {total} Inquir{total !== 1 ? 'ies' : 'y'}
                        </p>
                    </div>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {inquiries.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                            No inquiries in this stage yet.
                        </div>
                    ) : (
                        inquiries.map((inquiry) => (
                            <InquiryRow
                                key={inquiry.id}
                                inquiry={inquiry}
                                stageId={stage.id}
                                remainingOptions={remainingOptions}
                                onDeleteInquiry={onDeleteInquiry}
                                saveInquiryField={saveInquiryField}
                                onSelectInquiry={onSelectInquiry}
                                onHoverInquiry={openPreview}
                                onLeaveInquiry={() => schedulePreviewClose(PREVIEW_CLOSE_DELAY_MS)}
                                allProfiles={allProfiles}
                                onCopyToPending={onCopyToPending}
                                onCopyToAddressed={onCopyToAddressed}
                            />
                        ))
                    )}
                </div>

                <div
                    style={{
                        padding: '12px 20px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--surface)',
                        borderRadius: '0 0 16px 16px',
                        position: 'sticky',
                        bottom: 0,
                    }}
                >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Copy section to...
                    </span>
                    <select
                        value=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            if (value === 'Pending for Submission') {
                                inquiries.forEach((inquiry) => onCopyToPending?.(inquiry));
                            } else if (value === 'Addressed Concerns') {
                                inquiries.forEach((inquiry) => onCopyToAddressed?.(inquiry));
                            }
                        }}
                        style={{
                            padding: '5px 12px',
                            borderRadius: '7px',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            background: 'var(--surface)',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        <option value="" disabled>
                            Select target...
                        </option>
                        {stage.id === 'addressed' ? (
                            <option value="Pending for Submission">
                                Pending for Submission
                            </option>
                        ) : (
                            <option value="Addressed Concerns">
                                Addressed Concerns
                            </option>
                        )}
                    </select>
                </div>
            </div>

            {hoveredInquiry && (
                <div onMouseEnter={cancelPreviewClose} onMouseLeave={() => schedulePreviewClose(PREVIEW_CLOSE_DELAY_MS)}>
                    <InquiryPreview inquiry={hoveredInquiry} processedByProfile={previewProfile} />
                </div>
            )}
        </div>
    );
}

export interface InquiryListProps {
    inquiries: ClientInquiry[];
    onSelectInquiry: (inquiry: ClientInquiry) => void;
    onCreateInquiry: () => void;
    onDeleteInquiry: (inquiryId: string) => void;
    saveInquiryField: (inquiryId: string, updates: Record<string, any>) => Promise<void>;
    allProfiles: UserProfile[];
    onCopyToPending?: (inquiry: ClientInquiry) => void;
    onCopyToAddressed?: (inquiry: ClientInquiry) => void;
}

export const InquiryList: React.FC<InquiryListProps> = ({
    inquiries,
    onSelectInquiry,
    onCreateInquiry,
    onDeleteInquiry,
    saveInquiryField,
    allProfiles,
    onCopyToPending,
    onCopyToAddressed,
}) => {
    const { active: activeStage, open: openStage, cancelClose, scheduleClose } = useHoverController<InquiryStageId>();

    const stageBuckets = useMemo(() => {
        const buckets: Record<InquiryStageId, ClientInquiry[]> = {
            addressed: [],
            pending: [],
        };
        for (const inquiry of inquiries) {
            buckets[getInquiryStage(inquiry)].push(inquiry);
        }
        return buckets;
    }, [inquiries]);

    const totalLogged = inquiries.length;

    return (
        <div className={styles.monitoringCard}>
            <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <LayoutGrid size={20} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300 shrink-0" />
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
                            Client Inquiries
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={onCreateInquiry}
                        className={`${styles.newTaskBtn} !py-1.5 !px-4 !text-[13px]`}
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        <span className="font-bold">Log Inquiry</span>
                    </button>
                </div>

                <div className="flex items-center mt-0.5">
                    <span className="text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                        <span
                            className="text-[22px] font-extrabold mr-1.5"
                            style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
                        >
                            {totalLogged}
                        </span>
                        Total Logged Inquir{totalLogged !== 1 ? 'ies' : 'y'}
                    </span>
                </div>
            </div>

            <div className={styles.dashboardCardBody} style={{ padding: '0 16px 16px', gap: '8px' }}>
                {totalLogged === 0 ? (
                    <div className={styles.emptyStateContainer} onClick={onCreateInquiry} style={{ cursor: 'pointer' }}>
                        <div className={styles.emptyStateIcon}>📋</div>
                        <div className={styles.emptyStateTitle}>No inquiries logged yet</div>
                        <div className={styles.emptyStateDescription}>
                            Click &quot;Log Inquiry&quot; to record your first client inquiry.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {INQUIRY_STAGES.map((stage) => (
                            <div
                                key={stage.id}
                                style={{ position: 'relative' }}
                                onMouseEnter={() => openStage(stage.id)}
                                onMouseLeave={() => scheduleClose(STAGE_CLOSE_DELAY_MS)}
                            >
                                <StageCard meta={stage} count={stageBuckets[stage.id].length} active={activeStage === stage.id} />
                                {activeStage === stage.id && (
                                    <StagePopover
                                        stage={stage}
                                        inquiries={stageBuckets[stage.id]}
                                        onDeleteInquiry={onDeleteInquiry}
                                        saveInquiryField={saveInquiryField}
                                        onSelectInquiry={onSelectInquiry}
                                        allProfiles={allProfiles}
                                        onCopyToPending={onCopyToPending}
                                        onCopyToAddressed={onCopyToAddressed}
                                        onMouseEnter={cancelClose}
                                        onMouseLeave={() => scheduleClose(STAGE_CLOSE_DELAY_MS)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InquiryList;