import React from 'react';
import { X, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { ActivityEvent, ActivityType, ActivityStatus } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';
import { getStatusColorHex } from './StatusBadge';

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
  // Use Scheduled as default color if empty
  const currentStatusColor = getStatusColorHex(activityForm.status || 'Scheduled');

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
              <input
                type="text"
                className={styles.modalTitleInput}
                value={activityForm.title}
                onChange={(e) => onChangeForm('title', e.target.value)}
                placeholder="Log Activity Title..."
                autoFocus
              />
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        
        <div className={styles.modalBodyContent}>
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Status</label>
            <div className={styles.segmentedStatusRow}>
              {ACTIVITY_STATUSES.map((st) => {
                const isActive = activityForm.status === st;
                const colorHex = getStatusColorHex(st);

                return (
                  <button
                    key={st}
                    type="button"
                    className={`${styles.statusSegmentBtn} ${isActive ? styles.statusSegmentActive : ''}`}
                    style={isActive ? {
                      background: colorHex,
                      color: '#FFFFFF',
                      borderColor: colorHex,
                      boxShadow: `0 2px 8px ${colorHex}55`
                    } : undefined}
                    onClick={() => onChangeForm('status', st)}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.modalTwoCol}>
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
              <label className={styles.formFieldLabel}>Location</label>
              <input
                type="text"
                className={styles.formInput}
                value={activityForm.location}
                onChange={(e) => onChangeForm('location', e.target.value)}
                placeholder="e.g. Sun Life Head Office"
              />
            </div>
          </div>
          
          <div className={styles.modalTwoCol}>
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
          
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Notes</label>
            <textarea
              className={styles.appleNotesTextarea}
              value={activityForm.notes}
              onChange={(e) => onChangeForm('notes', e.target.value)}
              placeholder="Type additional details..."
              rows={3}
            />
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <div /> {/* Spacer to push buttons right */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className={styles.ghostCancelBtn} onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className={styles.goldSaveBtn} 
              style={{ background: currentStatusColor }}
              onClick={onSave}
            >
              Save Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
