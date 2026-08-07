import React from 'react';
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
}

export const InquiryPreview: React.FC<InquiryPreviewProps> = ({ inquiry, processedByProfile }) => {
    const typeLabel = getInquiryTypeLabel(inquiry.inquiry_type);
    const processedByName =
        processedByProfile?.full_name || processedByProfile?.email || 'Unassigned';
    const processedByInitial = (processedByProfile?.full_name || processedByProfile?.email || 'U')
        .charAt(0)
        .toUpperCase();

    return (
        <>
            <style>{`
                @keyframes ipFadeIn {
                    from { opacity: 0; transform: translateX(6px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            <div
                style={{
                    width: '440px',
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    border: `1px solid ${GOLD_BORDER}`,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                    animation: 'ipFadeIn 150ms ease',
                    flexShrink: 0,
                    overflow: 'hidden',
                }}
            >
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
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>
                            {inquiry.cmgc_name || 'Untitled Client'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9A7A2E', marginTop: '2px', fontWeight: 600 }}>
                            Client Inquiry Preview
                        </div>
                    </div>
                    <span
                        style={{
                            marginLeft: 'auto',
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

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A', marginTop: '3px' }}>
                                {inquiry.status || 'Pending'}
                            </div>
                        </div>

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
                            <div style={{ minWidth: 0 }}>
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
                            </div>
                        </div>
                    </div>

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
                    </div>

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
                                    borderRadius: '9px',
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
                                    borderRadius: '9px',
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
                </div>
            </div>
        </>
    );
};

export default InquiryPreview;