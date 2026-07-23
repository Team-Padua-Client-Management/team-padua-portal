import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

interface ConfirmDeleteModalProps {
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  title = "Delete Activity",
  message = "Are you sure you want to delete this activity? This action cannot be undone.",
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
  return (
    <div className={styles.taskModalOverlay} onClick={onCancel}>
      <div 
        className={`${styles.taskModalCard} !max-w-[400px]`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-red-500" />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <AlertTriangle size={20} strokeWidth={2.5} />
              <h3 className="text-[17px] font-extrabold tracking-tight m-0">{title}</h3>
            </div>
            <button 
              type="button" 
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
          
          <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-6 leading-relaxed font-medium">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2.5 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[12px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 rounded-lg transition-colors cursor-pointer"
            >
              Delete Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
