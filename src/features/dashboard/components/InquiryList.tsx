import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    LayoutGrid,
    ChevronRight,
    ChevronDown,
    Trash2,
    CheckCircle2,
    Hourglass,
    FileCheck2,
} from 'lucide-react';
import { ClientInquiry } from '@src/features/dashboard/types/inquiry';
import { UserProfile } from '@src/features/dashboard/components/UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

const PURPLE = '#6D28D9';
const PURPLE_TINT = 'rgba(109, 40, 217, 0.08)';
const STAGE_CLOSE_DELAY_MS = 200;

type InquiryStageId = 'addressed' | 'pending' | 'for_servicing';

interface StageMeta {
    id: InquiryStageId;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const INQUIRY_STAGES: StageMeta[] = [
    { id: 'addressed', label: 'Addressed Concerns', icon: CheckCircle2 },
    { id: 'pending', label: 'Pending Response', icon: Hourglass },
    { id: 'for_servicing', label: 'For Client Servicing', icon: FileCheck2 },
];

const WORKFLOW_STATUS_OPTIONS = ['Addressed Concerns', 'Pending Response', 'For Client Servicing'];

function getInquiryStage(inquiry: ClientInquiry): InquiryStageId {
    switch (inquiry.inquiry_type) {
        case "Address Concern":
            return "addressed";

        case "Pending Response":
            return "pending";

        case "Client Servicing":
            return "for_servicing";

        default:
            return "pending";
    }
}

function stageToStatus(stage: InquiryStageId): string {
    if (stage === 'addressed') return 'Addressed Concerns';
    if (stage === 'pending') return 'Pending Response';
    return 'For Client Servicing';
}

function getRemainingOptions(current: string): string[] {
    return WORKFLOW_STATUS_OPTIONS.filter((opt) => opt !== current);
}

interface InquiryTypeMeta {
    label: string;
    accent: string;
}

const INQUIRY_TYPES: Record<string, InquiryTypeMeta> = {
    'Address Concern': { label: 'Address Concern', accent: '#4F46E5' },
    'Pending Response': { label: 'Pending Response', accent: '#D97706' },
    'Client Servicing': { label: 'Client Servicing', accent: '#059669' },
};

function getTypeMeta(type: string | null | undefined): InquiryTypeMeta {
    switch (type) {
        case "Address Concern":
            return {
                label: "Addressed Concerns",
                accent: "#4F46E5",
            };

        case "Pending Response":
            return {
                label: "Pending Response",
                accent: "#D97706",
            };

        case "Client Servicing":
            return {
                label: "For Client Servicing",
                accent: "#059669",
            };

        default:
            return {
                label: "Pending Response",
                accent: "#C9962E",
            };
    }
}
function useStageHoverController() {
    const [activeStage, setActiveStage] = useState<InquiryStageId | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelClose = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const scheduleClose = () => {
        cancelClose();
        closeTimerRef.current = setTimeout(() => {
            setActiveStage(null);
            closeTimerRef.current = null;
        }, STAGE_CLOSE_DELAY_MS);
    };

    const openStage = (stageId: InquiryStageId) => {
        cancelClose();
        setActiveStage(stageId);
    };

    const closeNow = () => {
        cancelClose();
        setActiveStage(null);
    };

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    return { activeStage, openStage, cancelClose, scheduleClose, closeNow };
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

interface TypeGroupRowProps {
    typeMeta: InquiryTypeMeta;
    count: number;
    stage: InquiryStageId;
    inquiries: ClientInquiry[];
    expanded: boolean;
    onToggle: () => void;
    onDeleteInquiry: (id: string) => void;
    saveInquiryField: (id: string, updates: Record<string, any>) => Promise<void>;
    onSelectInquiry: (inquiry: ClientInquiry) => void;
    allProfiles: UserProfile[];
}

function TypeGroupRow({
    typeMeta,
    count,
    stage,
    inquiries,
    expanded,
    onToggle,
    onDeleteInquiry,
    saveInquiryField,
    onSelectInquiry,
    allProfiles,
}: TypeGroupRowProps) {
    const currentStatus = stageToStatus(stage);
    const remainingOptions = WORKFLOW_STATUS_OPTIONS.filter(
        (option) => option !== currentStatus
    );
    return (
        <div
            style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                overflow: 'hidden',
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '68px 1fr 40px',
                    alignItems: 'stretch',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit',
                }}
            >
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px 0',
                        fontSize: '28px',
                        fontWeight: 800,
                        color: typeMeta.accent,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.03em',
                        borderRight: '1px solid var(--border)',
                        backgroundColor: 'rgba(0, 0, 0, 0.01)',
                        alignSelf: 'stretch',
                    }}
                >
                    {count}
                </span>

                <span
                    style={{
                        padding: '16px 20px',
                        fontSize: '15.5px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        lineHeight: 1.3,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        display: 'flex',
                        alignItems: 'center',
                        borderLeft: `4px solid ${typeMeta.accent}`,
                    }}
                >
                    {typeMeta.label}
                </span>

                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-tertiary)',
                    }}
                >
                    <ChevronDown
                        size={16}
                        strokeWidth={2.5}
                        style={{
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                        }}
                    />
                </span>
            </button>

            {expanded && inquiries.length > 0 && (
                <div
                    style={{
                        borderTop: '1px solid var(--border)',
                        padding: '8px 12px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-muted)',
                    }}
                >
                    {inquiries.map((inquiry) => {
                        const profile =
                            allProfiles.find((p) => p.id === inquiry.processed_by) ??
                            allProfiles.find((p) => p.id === inquiry.user_id);

                        return (
                            <div
                                key={inquiry.id}
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
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            (profile?.full_name || 'U')
                                                .charAt(0)
                                                .toUpperCase()
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minWidth: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: 'var(--text)',
                                            }}
                                        >
                                            {profile?.full_name || 'Unknown User'}
                                        </span>

                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                                marginTop: '2px',
                                            }}
                                        >
                                            {profile?.role || 'USER'}
                                        </span>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                marginTop: 2,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "#b8860b",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {profile?.role || "USER"}
                                            </span>

                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "#9ca3af",
                                                }}
                                            >
                                                •
                                            </span>

                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "#6b7280",
                                                }}
                                            >
                                                {inquiry.cmgc_name || "Untitled Client"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        flexShrink: 0,
                                    }}
                                >
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

                                                case 'For Client Servicing':
                                                    inquiryType = 'Client Servicing';
                                                    break;

                                                default:
                                                    return;
                                            }

                                            saveInquiryField(inquiry.id, {
                                                inquiry_type: inquiryType,
                                            });
                                        }}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '7px',
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
                    })}
                </div>
            )}
        </div>
    );
}

interface TypeGroupData {
    typeMeta: InquiryTypeMeta;
    typeKey: string;
    count: number;
    inquiries: ClientInquiry[];
}

interface StagePopoverProps {
    stage: StageMeta;
    inquiries: ClientInquiry[];
    onDeleteInquiry: (id: string) => void;
    saveInquiryField: (id: string, updates: Record<string, any>) => Promise<void>;
    onSelectInquiry: (inquiry: ClientInquiry) => void;
    allProfiles: UserProfile[];
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
    onMouseEnter,
    onMouseLeave,
}: StagePopoverProps) {

    const total = inquiries.length;
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    const toggleType = (typeKey: string) => {
        setExpandedTypes((prev) => {
            const next = new Set(prev);
            if (next.has(typeKey)) {
                next.delete(typeKey);
            } else {
                next.add(typeKey);
            }
            return next;
        });
    };

    const typeGroups = useMemo(() => {
        const map = new Map<string, ClientInquiry[]>();
        for (const inq of inquiries) {
            const key = inq.inquiry_type || 'Pending Response';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(inq);
        }
        const groups: TypeGroupData[] = [];
        for (const [key, items] of map.entries()) {
            groups.push({
                typeMeta: getTypeMeta(key),
                typeKey: key,
                count: items.length,
                inquiries: items,
            });
        }
        return groups;
    }, [inquiries]);

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: '16px',
                width: '460px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'var(--surface)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid var(--border)',
                zIndex: 100,
            }}
            className="stage-popover"
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
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{stage.label}</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {total} Inquir{total !== 1 ? 'ies' : 'y'}
                    </p>
                </div>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {typeGroups.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                        No inquiries in this stage yet.
                    </div>
                ) : (
                    typeGroups.map(({ typeMeta, typeKey, count, inquiries: typeInquiries }) => (
                        <TypeGroupRow
                            key={typeKey}
                            typeMeta={typeMeta}
                            count={count}
                            stage={stage.id}
                            inquiries={typeInquiries}
                            expanded={expandedTypes.has(typeKey)}
                            onToggle={() => toggleType(typeKey)}
                            onDeleteInquiry={onDeleteInquiry}
                            saveInquiryField={saveInquiryField}
                            onSelectInquiry={onSelectInquiry}
                            allProfiles={allProfiles}
                        />
                    ))
                )}
            </div>
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
}

export const InquiryList: React.FC<InquiryListProps> = ({
    inquiries,
    onSelectInquiry,
    onCreateInquiry,
    onDeleteInquiry,
    saveInquiryField,
    allProfiles,
}) => {
    const { activeStage, openStage, cancelClose, scheduleClose } = useStageHoverController();

    const stageBuckets = useMemo(() => {
        const buckets: Record<InquiryStageId, ClientInquiry[]> = {
            addressed: [],
            pending: [],
            for_servicing: [],
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
                    <div
                        className={styles.emptyStateContainer}
                        onClick={onCreateInquiry}
                        style={{ cursor: 'pointer' }}
                    >
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
                                onMouseLeave={scheduleClose}
                            >
                                <StageCard
                                    meta={stage}
                                    count={stageBuckets[stage.id].length}
                                    active={activeStage === stage.id}
                                />
                                {activeStage === stage.id && (
                                    <StagePopover
                                        stage={stage}
                                        inquiries={stageBuckets[stage.id]}
                                        onDeleteInquiry={onDeleteInquiry}
                                        saveInquiryField={saveInquiryField}
                                        onSelectInquiry={onSelectInquiry}
                                        allProfiles={allProfiles}
                                        onMouseEnter={cancelClose}
                                        onMouseLeave={scheduleClose}
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