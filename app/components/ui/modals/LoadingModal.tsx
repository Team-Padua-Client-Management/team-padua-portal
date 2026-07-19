'use client';

import React from 'react';
import { Modal } from './Modal';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export function LoadingModal({ isOpen, message = 'Processing...' }: LoadingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} maxWidth="sm" hideCloseButton>
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <svg className="animate-spin h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {message}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Please wait while we complete this action.
        </p>
      </div>
    </Modal>
  );
}
