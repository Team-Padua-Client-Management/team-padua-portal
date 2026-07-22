import React from 'react';
import { CalendarClock, Calendar, MapPin } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type ActivityType =
  | 'Client Meeting'
  | 'Follow Up'
  | 'Presentation'
  | 'Recruitment'
  | 'Training'
  | 'Policy Delivery'
  | 'Event'
  | 'Other';

export type ActivityStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export type ActivityEvent = {
  id: string;
  title: string;
  type: ActivityType;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm
  location: string;
  notes: string;
  status: ActivityStatus;
};

interface ActivityCardProps {
  activity: ActivityEvent;
  onSelect: (activity: ActivityEvent) => void;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

export function getStatusClass(status: ActivityStatus): string {
  if (status === 'Completed') return styles.statusCompleted;
  if (status === 'Cancelled') return styles.statusCancelled;
  return styles.statusScheduled;
}

export default function ActivityCard({ activity, onSelect }: ActivityCardProps) {
  return (
    <div
      className={styles.activityCard}
      onClick={() => onSelect(activity)}
    >
      <div className={styles.activityCardHeader}>
        <span className={styles.activityTitle}>
          <CalendarClock size={13} strokeWidth={2} style={{ color: 'var(--accent-strong)', flexShrink: 0 }} />
          {activity.title}
        </span>
        <span className={`${styles.activityStatus} ${getStatusClass(activity.status)}`}>
          {activity.status}
        </span>
      </div>
      <div className={styles.activityMeta}>
        <Calendar size={11} strokeWidth={1.8} />
        <span>{formatDisplayDate(activity.date)} {activity.time ? `• ${formatDisplayTime(activity.time)}` : ''}</span>
      </div>
      {activity.location && (
        <div className={styles.activityLocation}>
          <MapPin size={11} strokeWidth={1.8} />
          <span>{activity.location}</span>
        </div>
      )}
    </div>
  );
}
