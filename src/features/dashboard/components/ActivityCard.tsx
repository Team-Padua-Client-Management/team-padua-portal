import React from 'react';
import { CalendarClock, Calendar, MapPin, Video, ExternalLink } from 'lucide-react';
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

function formatUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(zoom\.us|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed.includes('.') && !trimmed.includes(' ') ? `https://${trimmed}` : null;
}

export default function ActivityCard({ activity, onSelect }: ActivityCardProps) {
  const meetingUrl = formatUrl(activity.location);
  const isOnlineUrl = !!meetingUrl;
  const googleMapsUrl = activity.location && !isOnlineUrl
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`
    : null;

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
          {isOnlineUrl ? (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-[200px] truncate"
              title={`Open meeting: ${meetingUrl}`}
            >
              <Video size={11} strokeWidth={1.8} className="text-blue-500 shrink-0" />
              <span className="truncate">Join Meeting</span>
              <ExternalLink size={9} className="text-blue-400 shrink-0" />
            </a>
          ) : googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-[200px] truncate"
              title={`Open in Google Maps: ${activity.location}`}
            >
              <MapPin size={11} strokeWidth={1.8} className="text-blue-500 shrink-0" />
              <span className="truncate">{activity.location}</span>
              <ExternalLink size={9} className="text-blue-400 shrink-0" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} strokeWidth={1.8} />
              <span>{activity.location}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
