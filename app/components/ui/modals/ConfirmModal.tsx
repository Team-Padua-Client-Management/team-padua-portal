'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ConfirmVariant, { icon: React.ReactNode; iconBg: string; button: string }> = {
  danger: {
    icon: <AlertCircle className="h-6 w-6 text-red-600" />,
    iconBg: 'bg-red-50',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    iconBg: 'bg-amber-50',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" />,
    iconBg: 'bg-blue-50',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
    iconBg: 'bg-emerald-50',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" hideCloseButton>
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row sm:gap-4">
        <div className={`mx-auto sm:mx-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="mt-3 sm:mt-0">
          <h3 className="text-lg font-bold text-slate-900">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-[0.97] transition-all duration-200 ${styles.button} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}