'use client';

import React from 'react';
import { Modal } from './Modal';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  description?: string;
}

export function LoadingModal({
  isOpen,
  message = 'Processing...',
  description = 'Please wait while we complete this action.',
}: LoadingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => { }} maxWidth="sm" hideCloseButton>
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="relative w-16 h-16 flex items-center justify-center mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          {message}
        </h3>
        <p className="text-sm text-slate-500 mt-1.5">
          {description}
        </p>
      </div>
    </Modal>
  );
}