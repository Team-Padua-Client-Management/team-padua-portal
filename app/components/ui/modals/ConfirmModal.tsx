'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

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

const variantStyles = {
  danger: {
    icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    button: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    button: 'bg-amber-600 hover:bg-amber-700 text-white border-transparent focus:ring-amber-500',
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    button: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent focus:ring-blue-500',
  },
  success: {
    icon: <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent focus:ring-emerald-500',
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
      <div className="sm:flex sm:items-start">
        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 sm:mt-5 sm:flex sm:flex-row-reverse gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`inline-flex w-full justify-center rounded-md border px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-colors ${styles.button} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            confirmText
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
}
