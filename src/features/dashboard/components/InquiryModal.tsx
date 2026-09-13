import React, { useState, useEffect, useRef } from 'react';
import { ClientInquiry } from '@src/features/dashboard/types/inquiry';
import { UserProfile } from '@src/features/dashboard/components/UserAvatar';

export interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    inquiry: ClientInquiry | null;
    saveInquiryField: (inquiryId: string, updates: Record<string, any>) => Promise<void>;
    handleDeleteInquiry: (inquiryId: string) => Promise<void>;
    allProfiles: UserProfile[];
    currentUserProfile: UserProfile | null;
    copyInquiryToPendingSubmission?: (inquiry: ClientInquiry, category: string) => Promise<void>;
}

const GOLD = '#D89B1D';
const GOLD_HOVER = '#C58A12';
const GOLD_LIGHT = '#FFF8E8';
const GOLD_BORDER = '#EAD7AE';
const DANGER = '#EF4444';

const INQUIRY_STATUS_OPTIONS = ['Pending Response', 'Addressed Concerns'];
const TASK_STATUS_OPTIONS = ['Pending', 'Done'];

const SERVICING_CATEGORIES = [
    { value: 'ACR', label: 'ACR — Advisor Change Request' },
    { value: 'BCR', label: 'BCR — Beneficiary Change Request' },
    { value: 'FSR', label: 'FSR — Fund Switching Request' },
    { value: 'FW', label: 'FW — Fund Withdrawal Request' },
    { value: 'ACA', label: 'ACA — Auto Credits Arrangement' },
    { value: 'CPST', label: 'CPST — Client Policy Status Tracking' },
    { value: 'ACICR', label: 'ACICR — Address and Contact Information Change Request' },
    { value: 'MNGT', label: 'MNGT' },
    { value: 'PPU', label: 'PPU' },
    { value: 'Others', label: 'Others / Miscellaneous' },
];

export const InquiryModal: React.FC<InquiryModalProps> = ({
    isOpen,
    onClose,
    inquiry,
    saveInquiryField,
    handleDeleteInquiry,
    allProfiles,
    currentUserProfile,
    copyInquiryToPendingSubmission
}) => {
    const [formData, setFormData] = useState<Partial<ClientInquiry>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Others');
    const [isMoving, setIsMoving] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const categoryRef = useRef<HTMLDivElement>(null);
    const categorySearchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inquiry) {
            setFormData({
                cmgc_name: inquiry.cmgc_name || '',
                inquiry_type: inquiry.inquiry_type || 'Pending Response',
                inquiry_concern: inquiry.inquiry_concern || '',
                status: inquiry.status || 'Pending',
                processed_by: inquiry.processed_by || currentUserProfile?.id || null
            });
            setSelectedCategory((inquiry as any).category || 'Others');
        }
    }, [inquiry, currentUserProfile]);

    useEffect(() => {
        if (!isCategoryOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
                setIsCategoryOpen(false);
                setCategorySearch('');
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setIsCategoryOpen(false);
                setCategorySearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape, true);
        };
    }, [isCategoryOpen]);

    useEffect(() => {
        if (isCategoryOpen) {
            requestAnimationFrame(() => {
                categorySearchInputRef.current?.focus();
            });
        }
    }, [isCategoryOpen]);

    if (!isOpen || !inquiry) return null;

    const handleChange = (field: keyof ClientInquiry, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'inquiry_type') {
                if (value === 'Address Concern') {
                    next.status = 'Addressed';
                } else if (value === 'Pending Response' && prev.status === 'Addressed') {
                    next.status = 'Pending';
                }
            }
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const processedByVal = formData.processed_by || currentUserProfile?.id || null;
            await saveInquiryField(inquiry.id, {
                ...formData,
                processed_by: processedByVal ? processedByVal : null
            });
            onClose();
        } catch (err) {
            console.error('Failed to save inquiry from modal:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setShowDeleteConfirm(false);
        setIsCategoryOpen(false);
        setCategorySearch('');
        onClose();
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        await handleDeleteInquiry(inquiry.id);
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleMoveToPendingSubmission = async () => {
        if (!inquiry || !copyInquiryToPendingSubmission) return;
        setIsMoving(true);
        try {
            await copyInquiryToPendingSubmission(inquiry, selectedCategory);
            onClose();
        } catch (err) {
            console.error('Failed to move inquiry to Pending for Submission:', err);
        } finally {
            setIsMoving(false);
        }
    };

    const inputBaseClass =
        'w-full h-11 px-3.5 rounded-xl border text-sm font-medium bg-white transition-all duration-200 outline-none';

    const processedByInitial = (currentUserProfile?.full_name || currentUserProfile?.email || 'U')
        .charAt(0)
        .toUpperCase();

    const isAddressedConcern = formData.inquiry_type === 'Address Concern';

    const selectedCategoryLabel =
        SERVICING_CATEGORIES.find((cat) => cat.value === selectedCategory)?.label || 'Select category';

    const normalizedSearch = categorySearch.trim().toLowerCase();
    const filteredCategories = normalizedSearch
        ? SERVICING_CATEGORIES.filter(
            (cat) =>
                cat.label.toLowerCase().includes(normalizedSearch) ||
                cat.value.toLowerCase().includes(normalizedSearch)
        )
        : SERVICING_CATEGORIES;

    const toggleCategoryDropdown = () => {
        setIsCategoryOpen((prev) => {
            const next = !prev;
            if (!next) {
                setCategorySearch('');
            }
            return next;
        });
    };

    const handleSelectCategory = (value: string) => {
        setSelectedCategory(value);
        setIsCategoryOpen(false);
        setCategorySearch('');
    };

    return (
        <>
            <style>{`
                @keyframes imOverlayIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes imCardIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .im-input:focus {
                    border-color: ${GOLD} !important;
                    box-shadow: 0 0 0 3px ${GOLD_LIGHT};
                }
                .im-card-hover {
                    transition: border-color 200ms ease, box-shadow 200ms ease;
                }
                .im-card-hover:hover {
                    border-color: ${GOLD_BORDER};
                }
                .im-btn-lift {
                    transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease, opacity 200ms ease;
                }
                .im-btn-lift:hover {
                    transform: translateY(-1px);
                }
                .im-category-option:hover {
                    background: ${GOLD_LIGHT} !important;
                }
                .im-category-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .im-category-scroll::-webkit-scrollbar-thumb {
                    background: ${GOLD_BORDER};
                    border-radius: 999px;
                }
            `}</style>

            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 15, 15, 0.45)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 60,
                    padding: '16px',
                    animation: 'imOverlayIn 200ms ease',
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '760px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: '#FFFFFF',
                        borderRadius: '28px',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                        animation: 'imCardIn 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div
                        style={{
                            padding: '28px 32px 20px 32px',
                            borderBottom: `1px solid ${GOLD_BORDER}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_HOVER})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: `0 6px 16px ${GOLD_LIGHT}`,
                                    fontSize: '20px',
                                }}
                            >
                                📋
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>
                                    Client Inquiry
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#8A8A8A', marginTop: '2px', fontWeight: 500 }}>
                                    Log and manage client inquiries.
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="im-btn-lift"
                            style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#9A9A9A',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                fontSize: '16px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = GOLD_LIGHT;
                                e.currentTarget.style.color = GOLD;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#9A9A9A';
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: GOLD_HOVER, textTransform: 'uppercase' }}>
                                Client Information
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A4A4A', marginBottom: '6px', display: 'block' }}>
                                    CMGC Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.cmgc_name || ''}
                                    onChange={(e) => handleChange('cmgc_name', e.target.value)}
                                    placeholder="Enter Client Full Name"
                                    className={`${inputBaseClass} im-input`}
                                    style={{ borderColor: GOLD_BORDER }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: GOLD_HOVER, textTransform: 'uppercase' }}>
                                Inquiry Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                <div>
                                    <label
                                        style={{
                                            fontSize: "0.78rem",
                                            fontWeight: 600,
                                            color: "#4A4A4A",
                                            marginBottom: "6px",
                                            display: "block",
                                        }}
                                    >
                                        Inquiry Status
                                    </label>

                                    <select
                                        value={formData.inquiry_type || "Pending Response"}
                                        onChange={(e) => handleChange("inquiry_type", e.target.value)}
                                        className={`${inputBaseClass} im-input`}
                                        style={{
                                            borderColor: GOLD_BORDER,
                                            cursor: "pointer",
                                            appearance: "none",
                                            WebkitAppearance: "none",
                                            MozAppearance: "none",
                                            backgroundColor: "#fff",
                                        }}
                                    >
                                        <option value="Address Concern">
                                            Addressed Concerns
                                        </option>

                                        <option value="Pending Response">
                                            Pending Response
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A4A4A', marginBottom: '6px', display: 'block' }}>
                                        Status
                                    </label>
                                    {isAddressedConcern ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: '44px',
                                                borderRadius: '12px',
                                                border: `1px solid ${GOLD_BORDER}`,
                                                background: GOLD_LIGHT,
                                                padding: '0 14px',
                                                fontSize: '0.82rem',
                                                fontWeight: 700,
                                                color: GOLD_HOVER,
                                            }}
                                        >
                                            Addressed
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.status || 'Pending'}
                                            onChange={(e) => handleChange('status', e.target.value)}
                                            className={`${inputBaseClass} im-input`}
                                            style={{ borderColor: GOLD_BORDER, cursor: 'pointer' }}
                                        >
                                            {TASK_STATUS_OPTIONS.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A4A4A', marginBottom: '6px', display: 'block' }}>
                                        Processed By
                                    </label>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: '44px',
                                            borderRadius: '12px',
                                            border: `1px solid ${GOLD_BORDER}`,
                                            background: GOLD_LIGHT,
                                            padding: '0 12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '999px',
                                                background: GOLD,
                                                color: '#FFFFFF',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '10px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {processedByInitial}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <span
                                                style={{
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    color: '#1A1A1A',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {currentUserProfile?.full_name || currentUserProfile?.email || 'Unknown User'}
                                            </span>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: GOLD_HOVER }}>
                                                Logged-in User
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: GOLD_HOVER, textTransform: 'uppercase' }}>
                                Inquiry Concern
                            </div>
                            <textarea
                                rows={3}
                                value={formData.inquiry_concern || ''}
                                onChange={(e) => handleChange('inquiry_concern', e.target.value)}
                                placeholder="Describe the client's concern..."
                                className="im-input"
                                style={{
                                    width: '100%',
                                    minHeight: '160px',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: `1px solid ${GOLD_BORDER}`,
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    resize: 'vertical',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </div>

                        {isAddressedConcern && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: GOLD_HOVER, textTransform: 'uppercase' }}>
                                    Client Servicing Monitoring
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div ref={categoryRef} style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A4A4A', marginBottom: '6px', display: 'block' }}>
                                            Category
                                        </label>

                                        <button
                                            type="button"
                                            onClick={toggleCategoryDropdown}
                                            className="im-input"
                                            style={{
                                                width: '100%',
                                                height: '44px',
                                                padding: '0 14px',
                                                borderRadius: '12px',
                                                border: `1px solid ${GOLD_BORDER}`,
                                                background: '#FFFFFF',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: '#1A1A1A',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '8px',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {selectedCategoryLabel}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: GOLD_HOVER,
                                                    flexShrink: 0,
                                                    transform: isCategoryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 150ms ease',
                                                }}
                                            >
                                                ▼
                                            </span>
                                        </button>

                                        {isCategoryOpen && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 'calc(100% + 6px)',
                                                    left: 0,
                                                    right: 0,
                                                    background: '#FFFFFF',
                                                    border: `1px solid ${GOLD_BORDER}`,
                                                    borderRadius: '12px',
                                                    boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
                                                    zIndex: 100,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '8px',
                                                        borderBottom: `1px solid ${GOLD_BORDER}`,
                                                        background: GOLD_LIGHT,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            background: '#FFFFFF',
                                                            border: `1px solid ${GOLD_BORDER}`,
                                                            borderRadius: '8px',
                                                            padding: '6px 10px',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '0.8rem', color: GOLD_HOVER }}>🔍</span>
                                                        <input
                                                            ref={categorySearchInputRef}
                                                            type="text"
                                                            value={categorySearch}
                                                            onChange={(e) => setCategorySearch(e.target.value)}
                                                            placeholder="Search categories..."
                                                            style={{
                                                                flex: 1,
                                                                border: 'none',
                                                                outline: 'none',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 500,
                                                                color: '#1A1A1A',
                                                                background: 'transparent',
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div
                                                    className="im-category-scroll"
                                                    style={{
                                                        maxHeight: '220px',
                                                        overflowY: 'auto',
                                                    }}
                                                >
                                                    {filteredCategories.length === 0 ? (
                                                        <div
                                                            style={{
                                                                padding: '14px',
                                                                fontSize: '0.8rem',
                                                                color: '#9A9A9A',
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            No categories found
                                                        </div>
                                                    ) : (
                                                        filteredCategories.map((cat) => {
                                                            const isSelected = cat.value === selectedCategory;
                                                            return (
                                                                <div
                                                                    key={cat.value}
                                                                    onClick={() => handleSelectCategory(cat.value)}
                                                                    className="im-category-option"
                                                                    style={{
                                                                        padding: '10px 14px',
                                                                        fontSize: '0.82rem',
                                                                        fontWeight: isSelected ? 700 : 500,
                                                                        color: isSelected ? GOLD_HOVER : '#1A1A1A',
                                                                        background: isSelected ? GOLD_LIGHT : 'transparent',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        gap: '8px',
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                        }}
                                                                    >
                                                                        {cat.label}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <span style={{ color: GOLD_HOVER, flexShrink: 0 }}>✓</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleMoveToPendingSubmission}
                                        disabled={isMoving || !copyInquiryToPendingSubmission}
                                        className="im-btn-lift"
                                        style={{
                                            height: '44px',
                                            padding: '0 20px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_HOVER})`,
                                            color: '#FFFFFF',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: isMoving ? 'default' : 'pointer',
                                            opacity: isMoving || !copyInquiryToPendingSubmission ? 0.6 : 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {isMoving ? 'Moving...' : 'Move to Pending for Submission'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div
                                className="im-card-hover"
                                style={{
                                    border: `1px solid ${GOLD_BORDER}`,
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: GOLD_LIGHT,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        fontSize: '15px',
                                    }}
                                >
                                    📅
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Created
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1A1A1A', marginTop: '2px' }}>
                                        {inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="im-card-hover"
                                style={{
                                    border: `1px solid ${GOLD_BORDER}`,
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: GOLD_LIGHT,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        fontSize: '15px',
                                    }}
                                >
                                    🕐
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Updated
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1A1A1A', marginTop: '2px' }}>
                                        {inquiry.updated_at ? new Date(inquiry.updated_at).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '20px 32px 28px 32px',
                            borderTop: `1px solid ${GOLD_BORDER}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="im-btn-lift"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 18px',
                                borderRadius: '999px',
                                border: `1px solid ${DANGER}`,
                                background: '#FFFFFF',
                                color: DANGER,
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            🗑 Delete
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleClose}
                                className="im-btn-lift"
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '999px',
                                    border: '1px solid #E0E0E0',
                                    background: '#FFFFFF',
                                    color: '#4A4A4A',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="im-btn-lift"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 22px',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_HOVER})`,
                                    color: '#FFFFFF',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: isSaving ? 'default' : 'pointer',
                                    opacity: isSaving ? 0.6 : 1,
                                    boxShadow: `0 4px 14px ${GOLD_LIGHT}`,
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save Inquiry'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div
                    onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 15, 15, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 70,
                        padding: '16px',
                        animation: 'imOverlayIn 180ms ease',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '380px',
                            background: '#FFFFFF',
                            borderRadius: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                            padding: '28px',
                            textAlign: 'center',
                            animation: 'imCardIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <div
                            style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                background: GOLD_LIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px auto',
                                fontSize: '22px',
                            }}
                        >
                            ⚠️
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1A1A1A' }}>
                            Delete Client Inquiry?
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#8A8A8A', marginTop: '6px', fontWeight: 500 }}>
                            This action cannot be undone.
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="im-btn-lift"
                                style={{
                                    flex: 1,
                                    padding: '11px 0',
                                    borderRadius: '999px',
                                    border: '1px solid #E0E0E0',
                                    background: '#FFFFFF',
                                    color: '#4A4A4A',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: isDeleting ? 'default' : 'pointer',
                                    opacity: isDeleting ? 0.6 : 1,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="im-btn-lift"
                                style={{
                                    flex: 1,
                                    padding: '11px 0',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: DANGER,
                                    color: '#FFFFFF',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: isDeleting ? 'default' : 'pointer',
                                    opacity: isDeleting ? 0.6 : 1,
                                }}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Inquiry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InquiryModal;