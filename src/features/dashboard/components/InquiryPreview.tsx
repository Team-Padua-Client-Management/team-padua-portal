import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, Save, Check, Loader2 } from 'lucide-react';
import { ClientInquiry } from '@src/features/dashboard/types/inquiry';
import { UserProfile } from '@src/features/dashboard/components/UserAvatar';

const GOLD = '#D89B1D';
const GOLD_HOVER = '#C58A12';
const GOLD_LIGHT = '#FFF8E8';
const GOLD_BORDER = '#EAD7AE';

interface InquiryTypeLabel {
    label: string;
    accent: string;
}

function getInquiryTypeLabel(type: string | null | undefined): InquiryTypeLabel {
    switch (type) {
        case 'Address Concern':
            return { label: 'Addressed Concerns', accent: '#4F46E5' };
        case 'Pending Response':
            return { label: 'Pending Response', accent: '#D97706' };
        default:
            return { label: 'Pending Response', accent: '#C9962E' };
    }
}

export interface InquiryPreviewProps {
    inquiry: ClientInquiry;
    processedByProfile?: UserProfile | null;
    allProfiles?: UserProfile[];
    saveInquiryField?: (inquiryId: string, updates: Record<string, any>) => Promise<void>;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const InquiryPreview: React.FC<InquiryPreviewProps> = ({
    inquiry,
    processedByProfile,
    allProfiles = [],
    saveInquiryField,
    onMouseEnter,
    onMouseLeave,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Form field states
    const [clientName, setClientName] = useState(inquiry.cmgc_name || '');
    const [inquiryType, setInquiryType] = useState(inquiry.inquiry_type || 'Pending Response');
    const [status, setStatus] = useState(inquiry.status || 'Pending');
    const [processedBy, setProcessedBy] = useState(inquiry.processed_by || '');
    const [inquiryConcern, setInquiryConcern] = useState(inquiry.inquiry_concern || '');

    // Synchronize form values when inquiry prop updates
    const resetForm = () => {
        setClientName(inquiry.cmgc_name || '');
        setInquiryType(inquiry.inquiry_type || 'Pending Response');
        setStatus(inquiry.status || 'Pending');
        setProcessedBy(inquiry.processed_by || '');
        setInquiryConcern(inquiry.inquiry_concern || '');
        setSaveError(null);
    };

    useEffect(() => {
        resetForm();
        setIsEditing(false);
    }, [inquiry.id]);

    const handleCancel = () => {
        resetForm();
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!saveInquiryField) return;
        setIsSaving(true);
        setSaveError(null);

        const updates: Record<string, any> = {};
        if (clientName !== (inquiry.cmgc_name || '')) updates.cmgc_name = clientName;
        if (inquiryType !== (inquiry.inquiry_type || '')) updates.inquiry_type = inquiryType;
        if (status !== (inquiry.status || '')) updates.status = status;
        if (processedBy !== (inquiry.processed_by || '')) updates.processed_by = processedBy || null;
        if (inquiryConcern !== (inquiry.inquiry_concern || '')) updates.inquiry_concern = inquiryConcern;

        try {
            if (Object.keys(updates).length > 0) {
                await saveInquiryField(inquiry.id, updates);
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error saving inquiry:', err);
            setSaveError(err?.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const currentProcessedProfile = useMemo(() => {
        if (processedBy) {
            return allProfiles.find((p) => p.id === processedBy) || processedByProfile;
        }
        return processedByProfile;
    }, [processedBy, allProfiles, processedByProfile]);

    const typeLabel = getInquiryTypeLabel(isEditing ? inquiryType : inquiry.inquiry_type);
    const processedByName =
        currentProcessedProfile?.full_name || currentProcessedProfile?.email || 'Unassigned';
    const processedByInitial = (currentProcessedProfile?.full_name || currentProcessedProfile?.email || 'U')
        .charAt(0)
        .toUpperCase();

    return (
        <div
            data-cmp-popover="true"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                width: '440px',
                background: '#FFFFFF',
                borderRadius: '18px',
                border: `1px solid ${GOLD_BORDER}`,
                boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                animation: 'ipFadeIn 150ms ease',
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <style>{`
                @keyframes ipFadeIn {
                    from { opacity: 0; transform: translateX(6px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {/* Header */}
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: `1px solid ${GOLD_BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: GOLD_LIGHT,
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '11px',
                        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_HOVER})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '15px',
                    }}
                >
                    📋
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                    {isEditing ? (
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Client Name..."
                            style={{
                                width: '100%',
                                fontSize: '0.92rem',
                                fontWeight: 800,
                                color: '#1A1A1A',
                                border: `1px solid ${GOLD_BORDER}`,
                                borderRadius: '6px',
                                padding: '3px 8px',
                                outline: 'none',
                                background: '#FFFFFF',
                                fontFamily: 'inherit',
                            }}
                        />
                    ) : (
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>
                            {inquiry.cmgc_name || 'Untitled Client'}
                        </div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: '#9A7A2E', marginTop: '2px', fontWeight: 600 }}>
                        {isEditing ? 'Editing Client Inquiry' : 'Client Inquiry Preview'}
                    </div>
                </div>

                {!isEditing && saveInquiryField && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            background: '#FFFFFF',
                            border: `1px solid ${GOLD_BORDER}`,
                            cursor: 'pointer',
                        }}
                        className="hover:bg-amber-50"
                        title="Edit Inquiry"
                    >
                        <Edit2 size={13} color={GOLD_HOVER} />
                        Edit
                    </button>
                )}

                <span
                    style={{
                        flexShrink: 0,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        background: typeLabel.accent,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {typeLabel.label}
                </span>
            </div>

            {/* Success & Error Banners */}
            {saveSuccess && (
                <div style={{ padding: '8px 16px', background: '#DEF7EC', color: '#03543F', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Changes saved successfully!
                </div>
            )}

            {saveError && (
                <div style={{ padding: '8px 16px', background: '#FDE8E8', color: '#9B1C1C', fontSize: '0.75rem', fontWeight: 700 }}>
                    {saveError}
                </div>
            )}

            {/* Body */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Status */}
                    <div
                        style={{
                            border: `1px solid ${GOLD_BORDER}`,
                            borderRadius: '12px',
                            padding: '10px 12px',
                            background: '#FCFAF4',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: '#9A9A9A',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Status
                        </div>
                        {isEditing ? (
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                style={{
                                    width: '100%',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: '#1A1A1A',
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    marginTop: '2px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Done">Done</option>
                            </select>
                        ) : (
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A', marginTop: '3px' }}>
                                {inquiry.status || 'Pending'}
                            </div>
                        )}
                    </div>

                    {/* Processed By */}
                    <div
                        style={{
                            border: `1px solid ${GOLD_BORDER}`,
                            borderRadius: '12px',
                            padding: '10px 12px',
                            background: GOLD_LIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '999px',
                                background: GOLD,
                                color: '#FFFFFF',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {processedByInitial}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                                style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    color: '#9A7A2E',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                Processed By
                            </div>
                            {isEditing && allProfiles.length > 0 ? (
                                <select
                                    value={processedBy}
                                    onChange={(e) => setProcessedBy(e.target.value)}
                                    style={{
                                        width: '100%',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        color: '#1A1A1A',
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        marginTop: '1px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value="">Unassigned</option>
                                    {allProfiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name || p.email}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div
                                    style={{
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        color: '#1A1A1A',
                                        marginTop: '2px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {processedByName}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inquiry Stage Dropdown in Edit Mode */}
                {isEditing && (
                    <div
                        style={{
                            border: `1px solid ${GOLD_BORDER}`,
                            borderRadius: '12px',
                            padding: '10px 12px',
                            background: '#FFFFFF',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: '#9A9A9A',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Inquiry Section / Stage
                        </div>
                        <select
                            value={inquiryType}
                            onChange={(e) => setInquiryType(e.target.value)}
                            style={{
                                width: '100%',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#1A1A1A',
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                marginTop: '2px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <option value="Pending Response">Pending Response</option>
                            <option value="Address Concern">Addressed Concerns</option>
                        </select>
                    </div>
                )}

                {/* Inquiry Concern */}
                <div>
                    <div
                        style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            color: GOLD_HOVER,
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                        }}
                    >
                        Inquiry Concern
                    </div>
                    {isEditing ? (
                        <textarea
                            value={inquiryConcern}
                            onChange={(e) => setInquiryConcern(e.target.value)}
                            placeholder="Enter inquiry concern details..."
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
                            {inquiry.inquiry_concern || 'No concern details provided.'}
                        </div>
                    )}
                </div>

                {/* Timestamps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                        style={{
                            border: `1px solid ${GOLD_BORDER}`,
                            borderRadius: '12px',
                            padding: '10px 12px',
                            background: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '99px',
                                background: GOLD_LIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '12px',
                            }}
                        >
                            📅
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: '#9A9A9A',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                Created
                            </div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#1A1A1A',
                                    marginTop: '2px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {inquiry.created_at ? new Date(inquiry.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            border: `1px solid ${GOLD_BORDER}`,
                            borderRadius: '12px',
                            padding: '10px 12px',
                            background: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '99px',
                                background: GOLD_LIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '12px',
                            }}
                        >
                            🕐
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: '#9A9A9A',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                Updated
                            </div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#1A1A1A',
                                    marginTop: '2px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {inquiry.updated_at ? new Date(inquiry.updated_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save & Cancel Buttons */}
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
                            onClick={handleSave}
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

export default InquiryPreview;