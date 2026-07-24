import React from 'react';
import { CalendarClock, Calendar, MapPin, Video, Building2, Trash2 } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';
import UserAvatar, { UserProfile } from './UserAvatar';

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

export default function CalendarActivityCard({ activity, matchingProfiles = [], onDelete }: CalendarActivityCardProps) {
  const getRoleColorClass = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50';
      case 'Advisor': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50';
      case 'Bizdev': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const MAX_AVATARS = 5;
  const displayedProfiles = matchingProfiles.slice(0, MAX_AVATARS);
  const remainingCount = matchingProfiles.length - MAX_AVATARS;

  return (
    <div className={styles.activityCard}>
      <div className={styles.activityCardHeader}>
        <span className={styles.activityTitle}>
          <CalendarClock size={13} strokeWidth={2} style={{ color: 'var(--accent-strong)', flexShrink: 0 }} />
          {activity.title}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleColorClass(activity.assignedRole)}`}>
            {activity.assignedRole}
          </span>
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
      
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 mb-1.5 text-[11.5px] text-gray-600 dark:text-gray-400 font-medium">
        <div className="flex items-center gap-1">
          <Calendar size={11} strokeWidth={1.8} />
          <span>{formatDisplayDate(activity.date)} {activity.time ? `• ${formatDisplayTime(activity.time)}` : ''}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {activity.mode === 'Online' ? <Video size={11} strokeWidth={1.8} /> : <Building2 size={11} strokeWidth={1.8} />}
          <span className="font-semibold">{activity.mode}</span>
          {activity.location && (
            <>
              <span className="text-gray-400 mx-0.5">|</span>
              <span className="truncate max-w-[120px]" title={activity.location}>{activity.location}</span>
            </>
          )}
        </div>
      </div>

      {activity.mode === 'Online' && (activity.onlinePlatform || activity.onlineMeetingLink) && (
        <div className="mt-1 text-[11px] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded p-1.5 flex flex-col gap-1">
          {activity.onlinePlatform && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Platform:</span>
              <span>{activity.onlinePlatform}</span>
            </div>
          )}
          {activity.onlineMeetingLink && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Link:</span>
              <a href={activity.onlineMeetingLink.startsWith('http') ? activity.onlineMeetingLink : `https://${activity.onlineMeetingLink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">
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

      {activity.mode === 'Onsite' && (activity.onsiteVenue || activity.onsiteStreet || activity.onsiteCity) && (
        <div className="mt-1 text-[11px] bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded p-1.5 flex flex-col gap-1">
          {activity.onsiteVenue && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Venue:</span>
              <span>{activity.onsiteVenue}</span>
            </div>
          )}
          <div className="flex items-start gap-1">
            <MapPin size={11} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <span className="leading-tight">
              {[activity.onsiteBuilding, activity.onsiteStreet, activity.onsiteBarangay, activity.onsiteCity, activity.onsiteProvince, activity.onsiteZip].filter(Boolean).join(', ')}
            </span>
          </div>
          <a 
            href={activity.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent([activity.onsiteVenue, activity.onsiteBuilding, activity.onsiteStreet, activity.onsiteBarangay, activity.onsiteCity, activity.onsiteProvince, activity.onsiteZip].filter(Boolean).join(', '))}`}
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
          >
            Open in Google Maps
          </a>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30">
            {activity.category}
          </span>
        </div>

        {matchingProfiles.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden py-0.5">
            {displayedProfiles.map((profile) => (
              <div key={profile.id} className="relative z-10 inline-block rounded-full ring-2 ring-[var(--bg)] dark:ring-gray-900">
                <UserAvatar profile={profile} size={18} showTooltip />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="relative z-0 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-gray-100 text-[8px] font-medium text-gray-500 ring-2 ring-[var(--bg)] dark:ring-gray-900 dark:bg-gray-800">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </div>
      
      {activity.notes && (
        <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 italic line-clamp-2">
          {activity.notes}
        </div>
      )}
    </div>
  );
}
