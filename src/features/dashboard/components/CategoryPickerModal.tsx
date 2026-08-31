import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderPlus, ArrowRight } from 'lucide-react';

export interface CategoryOption {
  code: string;
  badge: string;
  name: string;
  categoryGroup: string;
  accent: string;
  tint: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    code: 'ACR - Advisor Change Request',
    badge: 'ACR',
    name: 'Advisor Change Request',
    categoryGroup: 'Transfers & Policy',
    accent: '#4F46E5',
    tint: 'rgba(79, 70, 229, 0.1)',
  },
  {
    code: 'BCR - Beneficiary Change Request',
    badge: 'BCR',
    name: 'Beneficiary Change Request',
    categoryGroup: 'Transfers & Policy',
    accent: '#2563EB',
    tint: 'rgba(37, 99, 235, 0.1)',
  },
  {
    code: 'FW - Fund Withdrawal Request',
    badge: 'FW',
    name: 'Fund Withdrawal Request',
    categoryGroup: 'Funds & Investments',
    accent: '#10B981',
    tint: 'rgba(16, 185, 129, 0.1)',
  },
  {
    code: 'FSR - Fund Switching Request',
    badge: 'FSR',
    name: 'Fund Switching Request',
    categoryGroup: 'Funds & Investments',
    accent: '#059669',
    tint: 'rgba(5, 150, 105, 0.1)',
  },
  {
    code: 'ADA - Auto Debit Arrangement (MOA)',
    badge: 'ADA / MOA',
    name: 'Auto Debit Arrangement',
    categoryGroup: 'Billing & Payment',
    accent: '#8B5CF6',
    tint: 'rgba(139, 92, 246, 0.1)',
  },
  {
    code: 'ACA - Auto Charging Arrangement',
    badge: 'ACA',
    name: 'Auto Charging Arrangement',
    categoryGroup: 'Billing & Payment',
    accent: '#7C3AED',
    tint: 'rgba(124, 58, 237, 0.1)',
  },
  {
    code: 'CPST - Client Policy Status Tracking',
    badge: 'CPST',
    name: 'Client Policy Status Tracking',
    categoryGroup: 'Transfers & Policy',
    accent: '#0D9488',
    tint: 'rgba(13, 148, 136, 0.1)',
  },
  {
    code: 'CSMV - Client Servicing Monitoring Verification',
    badge: 'CSMV',
    name: 'Client Servicing Monitoring Verification',
    categoryGroup: 'Compliance & Verification',
    accent: '#099268',
    tint: 'rgba(9, 146, 104, 0.1)',
  },
  {
    code: 'ACICR - Address and Contact Information Change Request',
    badge: 'ACICR',
    name: 'Address & Contact Info Change Request',
    categoryGroup: 'Client Profile',
    accent: '#D946EF',
    tint: 'rgba(217, 70, 239, 0.1)',
  },
  {
    code: 'Reinstatement - SRO',
    badge: 'SRO',
    name: 'Reinstatement (SRO)',
    categoryGroup: 'Billing & Reinstatement',
    accent: '#D97706',
    tint: 'rgba(217, 119, 6, 0.1)',
  },
  {
    code: 'Reinstatement - PDI',
    badge: 'PDI / PPI',
    name: 'Reinstatement (PPI / PDI)',
    categoryGroup: 'Billing & Reinstatement',
    accent: '#EA580C',
    tint: 'rgba(234, 88, 12, 0.1)',
  },
  {
    code: 'Others',
    badge: 'Others',
    name: 'Others / Miscellaneous',
    categoryGroup: 'General',
    accent: '#71717A',
    tint: 'rgba(113, 113, 122, 0.1)',
  },
];

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'move' | 'copy';
  clientName?: string;
  itemCount?: number;
  onSelectCategory: (categoryCode: string) => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  isOpen,
  onClose,
  actionType,
  clientName,
  itemCount = 1,
  onSelectCategory,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isMove = actionType === 'move';
  const actionTitle = isMove ? 'Move to Pending for Submission' : 'Copy to Pending for Submission';
  const subtitle = itemCount > 1
    ? `Select destination category for ${itemCount} inquiries`
    : clientName
    ? `Select destination category for ${clientName}`
    : 'Select destination category for this inquiry';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'var(--surface, #ffffff)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'var(--surface, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(109, 40, 217, 0.1)',
                color: '#6D28D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FolderPlus size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text, #0f172a)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                }}
              >
                {actionTitle}
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #64748b)',
                }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary, #94a3b8)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Category Cards Grid */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            background: 'var(--surface-2, #f8fafc)',
            maxHeight: 'calc(90vh - 120px)',
          }}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <div
              key={cat.code}
              onClick={() => onSelectCategory(cat.code)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderLeft: `4px solid ${cat.accent}`,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
              className="hover:shadow-lg hover:-translate-y-0.5 hover:border-purple-300 group"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: cat.tint,
                    color: cat.accent,
                    letterSpacing: '0.03em',
                  }}
                >
                  {cat.badge}
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-tertiary, #94a3b8)' }}>
                  {cat.categoryGroup}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--text, #0f172a)',
                    lineHeight: 1.3,
                  }}
                >
                  {cat.name}
                </span>
                <ArrowRight
                  size={16}
                  style={{
                    color: cat.accent,
                    opacity: 0.7,
                    flexShrink: 0,
                    transition: 'transform 0.15s ease, opacity 0.15s ease',
                  }}
                  className="group-hover:translate-x-1 group-hover:opacity-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
