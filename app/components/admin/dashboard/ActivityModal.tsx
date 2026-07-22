import React from 'react';
import { X } from 'lucide-react';
import { ActivityEvent, ActivityType, ActivityStatus } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';

const ACTIVITY_TYPES: ActivityType[] = [
  'Client Meeting', 'Follow Up', 'Presentation', 'Recruitment',
  'Training', 'Policy Delivery', 'Event', 'Other'
];

const ACTIVITY_STATUSES: ActivityStatus[] = ['Scheduled', 'Completed', 'Cancelled'];

interface ActivityModalProps {
  activityForm: Omit<ActivityEvent, 'id'>;
  onChangeForm: (field: keyof Omit<ActivityEvent, 'id'>, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ActivityModal({
  activityForm,
  onChangeForm,
  onSave,
  onClose
}: ActivityModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.activityModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Log Activity</span>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} aria-label="Close">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formField}>
            <label className={styles.formFieldLabel}>Activity Title</label>
            <input
              type="text"
              className={styles.formInput}
              value={activityForm.title}
              onChange={(e) => onChangeForm('title', e.target.value)}
              placeholder="e.g. Client Onboarding Meeting"
            />
          </div>
          <div className={styles.formFieldRow}>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Activity Type</label>
              <select
                className={styles.formSelect}
                value={activityForm.type}
                onChange={(e) => onChangeForm('type', e.target.value)}
              >
                {ACTIVITY_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Status</label>
              <select
                className={styles.formSelect}
                value={activityForm.status}
                onChange={(e) => onChangeForm('status', e.target.value)}
              >
                {ACTIVITY_STATUSES.map((status) => (<option key={status} value={status}>{status}</option>))}
              </select>
            </div>
          </div>
          <div className={styles.formFieldRow}>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Activity Date</label>
              <input
                type="date"
                className={styles.formInput}
                value={activityForm.date}
                onChange={(e) => onChangeForm('date', e.target.value)}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Activity Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={activityForm.time}
                onChange={(e) => onChangeForm('time', e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formFieldLabel}>Location</label>
            <input
              type="text"
              className={styles.formInput}
              value={activityForm.location}
              onChange={(e) => onChangeForm('location', e.target.value)}
              placeholder="e.g. Sun Life Head Office"
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formFieldLabel}>Notes</label>
            <textarea
              className={styles.formTextarea}
              value={activityForm.notes}
              onChange={(e) => onChangeForm('notes', e.target.value)}
              placeholder="Additional details"
            />
          </div>
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.activityButton} onClick={onSave}>Save Activity</button>
        </div>
      </div>
    </div>
  );
}
