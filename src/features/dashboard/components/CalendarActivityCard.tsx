import React from 'react';
import { CalendarClock, Calendar, Video, Building2, Trash2, CheckCircle2 } from 'lucide-react';
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

  // Online details
  onlinePlatform?: string;
  onlineMeetingLink?: string;
  onlineMeetingId?: string;
  onlinePasscode?: string;

  // Onsite details
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

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (!activity.date) return 'Upcoming';

  if (activity.date === todayStr) {
    return 'Today';
  } else if (activity.date > todayStr) {
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
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Today
          </span>
        );
      case 'Upcoming':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
            Upcoming
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50">
            Overdue
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
            ✓ Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const MAX_AVATARS = 5;
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
      {/* 1. Header: Activity Title & Action Buttons */}
      <div className={styles.activityCardHeader}>
        <span className={styles.activityTitle}>
          <CalendarClock size={15} strokeWidth={2.2} style={{ color: 'var(--accent-strong)', flexShrink: 0 }} />
          {activity.title}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {getStatusBadge(lifecycleStatus)}

          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleColorClass(activity.assignedRole)}`}>
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
              <CheckCircle2 size={15} strokeWidth={2.2} />
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
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Date / Time & Mode info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 mb-1.5 text-[11.5px] text-gray-600 dark:text-gray-400 font-medium">
        <div className="flex items-center gap-1">
          <Calendar size={12} strokeWidth={1.8} />
          <span className="font-semibold">{formatDisplayDate(activity.date)}</span>
          {activity.time && <span className="text-gray-500">• {formatDisplayTime(activity.time)}</span>}
        </div>

        <div className="flex items-center gap-1">
          {activity.mode === 'Online' ? <Video size={12} strokeWidth={1.8} /> : <Building2 size={12} strokeWidth={1.8} />}
          <span className="font-semibold">{activity.mode}</span>
          {activity.location && (
            <>
              <span className="text-gray-400 mx-0.5">|</span>
              <span className="truncate max-w-[160px]" title={activity.location}>
                {activity.location}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Online Details (if Online mode) */}
      {activity.mode === 'Online' && (activity.onlinePlatform || activity.onlineMeetingLink) && (
        <div className="mt-1 text-[11px] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-2 flex flex-col gap-1">
          {activity.onlinePlatform && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Platform:</span>
              <span>{activity.onlinePlatform}</span>
            </div>
          )}
          {activity.onlineMeetingLink && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Link:</span>
              <a
                href={activity.onlineMeetingLink.startsWith('http') ? activity.onlineMeetingLink : `https://${activity.onlineMeetingLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate max-w-[240px]"
              >
                {activity.onlineMeetingLink}
              </a>
            </div>
          )}
          {(activity.onlineMeetingId || activity.onlinePasscode) && (
            <div className="flex items-center gap-3">
              {activity.onlineMeetingId && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">ID:</span>
                  <span>{activity.onlineMeetingId}</span>
                </div>
              )}
              {activity.onlinePasscode && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Passcode:</span>
                  <span>{activity.onlinePasscode}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Footer: Category & User Avatars */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30">
            {activity.category}
          </span>
        </div>

        {matchingProfiles.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden py-0.5">
            {displayedProfiles.map((profile) => (
              <div key={profile.id} className="relative z-10 inline-block rounded-full ring-2 ring-[var(--bg)] dark:ring-gray-900">
                <UserAvatar profile={profile} size={20} showTooltip />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="relative z-0 flex items-center justify-center w-[20px] h-[20px] rounded-full bg-gray-100 text-[8px] font-medium text-gray-500 ring-2 ring-[var(--bg)] dark:ring-gray-900 dark:bg-gray-800">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Notes */}
      {activity.notes && (
        <div className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 italic line-clamp-2">
          {activity.notes}
        </div>
      )}
    </div>
  );
}
