import React from 'react';
import { CalendarClock, Calendar, Video, Building2, Trash2, CheckCircle2, MapPin } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';
import UserAvatar, { UserProfile } from './UserAvatar';

export type ActivityLifecycleStatus = 'Upcoming' | 'Today' | 'Overdue' | 'Completed' | 'Cancelled';

export type CalendarActivityItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  mode: 'Online' | 'Onsite';
  location: string;
  category: string;
  assignedRole: 'Admin' | 'Advisor' | 'Bizdev';
  notes?: string;
  createdAt: string;
  status?: ActivityLifecycleStatus | string;
  completed?: boolean;
  _sourceTable?: 'client_servicing_tasks' | 'tasks';
  onlinePlatform?: string;
  onlineMeetingLink?: string;
  onlineMeetingId?: string;
  onlinePasscode?: string;
  onsiteVenue?: string;
  onsiteBuilding?: string;
  onsiteStreet?: string;
  onsiteBarangay?: string;
  onsiteCity?: string;
  onsiteProvince?: string;
  onsiteZip?: string;
  onsiteIslandGroup?: string;
  onsiteRegion?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
};

interface CalendarActivityCardProps {
  activity: CalendarActivityItem;
  matchingProfiles?: UserProfile[];
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDisplayTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

export function getActivityLifecycleStatus(activity: CalendarActivityItem): ActivityLifecycleStatus {
  if (activity.completed || activity.status === 'Completed' || activity.status === 'Done') {
    return 'Completed';
  }
  if (activity.status === 'Cancelled') {
    return 'Cancelled';
  }

  if (!activity.date) return 'Upcoming';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let actDate: Date | null = null;
  const parts = activity.date.trim().split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      actDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      actDate = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
    }
  } else {
    const parsed = new Date(activity.date);
    if (!isNaN(parsed.getTime())) actDate = parsed;
  }

  if (!actDate || isNaN(actDate.getTime())) return 'Upcoming';

  const actStart = new Date(actDate.getFullYear(), actDate.getMonth(), actDate.getDate()).getTime();

  if (actStart === todayStart) {
    return 'Today';
  } else if (actStart > todayStart) {
    return 'Upcoming';
  } else {
    return 'Overdue';
  }
}

export default function CalendarActivityCard({
  activity,
  matchingProfiles = [],
  onDelete,
  onComplete,
}: CalendarActivityCardProps) {
  const lifecycleStatus = getActivityLifecycleStatus(activity);

  const getRoleColorClass = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50';
      case 'Advisor':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50';
      case 'Bizdev':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusBadge = (status: ActivityLifecycleStatus) => {
    switch (status) {
      case 'Today':
        return (
          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Today
          </span>
        );
      case 'Upcoming':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
            Upcoming
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50">
            Overdue
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
            ✓ Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const MAX_AVATARS = 3;
  const displayedProfiles = matchingProfiles.slice(0, MAX_AVATARS);
  const remainingCount = matchingProfiles.length - MAX_AVATARS;

  return (
    <div
      className={styles.activityCard}
      style={{
        borderLeft:
          lifecycleStatus === 'Today'
            ? '4px solid #D89B1D'
            : lifecycleStatus === 'Overdue'
              ? '4px solid #EF4444'
              : lifecycleStatus === 'Completed'
                ? '4px solid #10B981'
                : '4px solid #3B82F6',
      }}
    >
      <div className={styles.activityCardTopRow}>
        <span className={styles.activityCardCategory}>{activity.category}</span>

        <div className={styles.activityCardActions}>
          {getStatusBadge(lifecycleStatus)}

          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${getRoleColorClass(activity.assignedRole)}`}>
            {activity.assignedRole}
          </span>

          {lifecycleStatus !== 'Completed' && onComplete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onComplete(activity.id);
              }}
              className="text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              title="Mark Complete"
              type="button"
            >
              <CheckCircle2 size={14} strokeWidth={2.2} />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(activity.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete Activity"
              type="button"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.activityCardTitleRow}>
        <CalendarClock size={13} strokeWidth={2.2} style={{ color: 'var(--accent-strong)', flexShrink: 0 }} />
        <span className={styles.activityCardTitle}>{activity.title}</span>
      </div>

      <div className={styles.activityCardMetaRow}>
        <div className={styles.activityCardMetaLeft}>
          <span className={styles.activityCardMetaItem}>
            <Calendar size={11} strokeWidth={1.8} />
            {formatDisplayDate(activity.date)}
            {activity.time && <span className={styles.activityCardMetaDim}>• {formatDisplayTime(activity.time)}</span>}
          </span>

          <span className={styles.activityCardMetaDivider} />

          <span className={styles.activityCardMetaItem}>
            {activity.mode === 'Online' ? <Video size={11} strokeWidth={1.8} /> : <Building2 size={11} strokeWidth={1.8} />}
            {activity.mode}
            {activity.location && (
              <span className={styles.activityCardLocation} title={activity.location}>
                <MapPin size={10} strokeWidth={1.8} />
                {activity.location}
              </span>
            )}
          </span>
        </div>

        {matchingProfiles.length > 0 && (
          <div className={styles.activityCardAvatars}>
            {displayedProfiles.map((profile) => (
              <div key={profile.id} className={styles.activityCardAvatarSlot}>
                <UserAvatar profile={profile} size={18} showTooltip />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className={styles.activityCardAvatarMore}>+{remainingCount}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}