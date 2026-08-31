import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title?: string;
  itemTitle?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  title = "Confirm Deletion",
  itemTitle,
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--surface, #ffffff)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.15s ease-out forwards',
        }}
      >
        <div style={{ height: '4px', background: '#EF4444', width: '100%' }} />

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)', letterSpacing: '-0.02em' }}>
                {title}
              </h3>
            </div>

            <button 
              type="button" 
              onClick={onCancel} 
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
              }}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary, #475569)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            {message}
          </p>

          {itemTitle && (
            <div
              style={{
                background: 'var(--surface-2, #f1f5f9)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: 'var(--text, #1e293b)',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                border: '1px solid var(--border, #e2e8f0)',
              }}
            >
              {itemTitle}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text, #334155)',
                background: 'var(--surface-2, #f1f5f9)',
                border: '1px solid var(--border, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#ffffff',
                background: '#EF4444',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-red-600"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
