import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { ActivityEvent, formatDisplayDate, formatDisplayTime, getStatusClass } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';

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
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.activityModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{event.title}</span>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} aria-label="Close">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.eventDetailRow}>
            <span className={styles.eventDetailLabel}>Type</span>
            <span className={styles.eventDetailValue}>{event.type}</span>
          </div>
          <div className={styles.eventDetailRow}>
            <span className={styles.eventDetailLabel}>Date</span>
            <span className={styles.eventDetailValue}>{formatDisplayDate(event.date)}</span>
          </div>
          <div className={styles.eventDetailRow}>
            <span className={styles.eventDetailLabel}>Time</span>
            <span className={styles.eventDetailValue}>{event.time ? formatDisplayTime(event.time) : '—'}</span>
          </div>
          <div className={styles.eventDetailRow}>
            <span className={styles.eventDetailLabel}>Location</span>
            <span className={styles.eventDetailValue}>{event.location || '—'}</span>
          </div>
          <div className={styles.eventDetailRow}>
            <span className={styles.eventDetailLabel}>Notes</span>
            <span className={styles.eventDetailValue}>{event.notes || '—'}</span>
          </div>
          <div className={styles.eventDetailRow}>
            <span className={styles.eventDetailLabel}>Status</span>
            <span className={`${styles.activityStatus} ${getStatusClass(event.status)}`}>{event.status}</span>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>Close</button>
          <button type="button" className={styles.deleteButton} onClick={onDelete}>
            <Trash2 size={13} strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
