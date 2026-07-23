import React from 'react';
import { X, Trash2, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { ActivityEvent, formatDisplayDate, formatDisplayTime, getStatusClass } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';
import { getStatusColorHex } from './StatusBadge';

interface EventDetailsModalProps {
  event: ActivityEvent;
  onDelete: () => void;
  onClose: () => void;
}

export default function EventDetailsModal({
  event,
  onDelete,
  onClose
}: EventDetailsModalProps) {
  const currentStatusColor = getStatusColorHex(event.status || 'Scheduled');

  return (
    <div className={styles.taskModalOverlay} onClick={onClose}>
      <div 
        className={styles.taskModalCard} 
        style={{ borderTop: `4px solid ${currentStatusColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.taskModalHeader}>
          <div className={styles.modalTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div className="text-xl font-bold text-gray-900 dark:text-white mr-2">
                {event.title}
              </div>
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${currentStatusColor}20`, color: currentStatusColor, border: `1px solid ${currentStatusColor}40` }}
              >
                {event.status}
              </span>
            </div>
            <div className={styles.modalSubTitle}>
              <span className={styles.modalSubTitleItem}>
                <CalendarIcon size={11} />
                {formatDisplayDate(event.date)}
              </span>
              {event.time && (
                <span className={styles.modalSubTitleItem}>
                  <Clock size={11} />
                  {formatDisplayTime(event.time)}
                </span>
              )}
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        
        <div className={styles.modalBodyContent}>
          <div className={styles.modalTwoCol}>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Activity Type</label>
              <div className="font-medium text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                {event.type}
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Location</label>
              <div className="font-medium text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                {event.location || 'No location specified'}
              </div>
            </div>
          </div>
          
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Notes</label>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 min-h-[80px] whitespace-pre-wrap">
              {event.notes || 'No notes provided.'}
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button type="button" className={styles.deleteOutlinedBtn} onClick={onDelete}>
            <Trash2 size={13} strokeWidth={2} />
            Delete Activity
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className={styles.ghostCancelBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
