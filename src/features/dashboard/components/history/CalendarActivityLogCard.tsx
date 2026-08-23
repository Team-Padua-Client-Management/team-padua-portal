import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  MapPin,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Users,
} from 'lucide-react';
import { CalendarActivityItem, getActivityLifecycleStatus, formatDisplayDate, formatDisplayTime } from '../CalendarActivityCard';
import UserAvatar, { UserProfile } from '../UserAvatar';
import LogStatusBadge from './LogStatusBadge';
import { getCategoryMeta, formatDateTime } from './types';

interface CalendarActivityLogCardProps {
  activity: CalendarActivityItem;
  matchingProfiles: UserProfile[];
  onEdit?: (activity: CalendarActivityItem) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

function formatUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(zoom\.us|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed.includes('.') ? `https://${trimmed}` : null;
}

export default function CalendarActivityLogCard({
  activity,
  matchingProfiles = [],
  onEdit,
  onDelete,
  onComplete,
}: CalendarActivityLogCardProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const lifecycleStatus = getActivityLifecycleStatus(activity);
  const categoryMeta = getCategoryMeta(activity.category);

  // Compute location/maps URL for Onsite — uses OpenStreetMap
  const onsiteLocationText = activity.venue_name || activity.onsiteVenue || activity.location || '';
  const hasOsmCoords = typeof activity.venue_lat === 'number' && typeof activity.venue_lng === 'number';
  const googleMapsUrl =
    activity.venue_maps_url ||
    activity.googleMapsUrl ||
    (hasOsmCoords
      ? `https://www.openstreetmap.org/?mlat=${activity.venue_lat}&mlon=${activity.venue_lng}#map=17/${activity.venue_lat}/${activity.venue_lng}`
      : onsiteLocationText
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(
          [activity.venue_name, activity.venue_address, activity.onsiteVenue, activity.location, activity.onsiteCity, activity.onsiteProvince]
            .filter(Boolean)
            .join(', ') || onsiteLocationText
        )}`
      : null);

  // Compute online meeting link for Online
  const rawMeetingLink = activity.onlineMeetingLink || (activity.location?.startsWith('http') ? activity.location : undefined);
  const formattedMeetingUrl = formatUrl(rawMeetingLink);
  const onlinePlatformName =
    activity.onlinePlatform ||
    (formattedMeetingUrl?.includes('zoom')
      ? 'Zoom Meeting'
      : formattedMeetingUrl?.includes('meet.google')
      ? 'Google Meet'
      : formattedMeetingUrl?.includes('teams')
      ? 'MS Teams'
      : activity.location || 'Online');

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
      case 'Advisor':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      case 'Bizdev':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const MAX_AVATARS = 4;
  const displayedProfiles = matchingProfiles.slice(0, MAX_AVATARS);
  const remainingCount = matchingProfiles.length - MAX_AVATARS;
  const hasNotes = !!(activity.notes && activity.notes.trim().length > 0);

  return (
    <div className="group bg-white dark:bg-surface rounded-xl border border-slate-200/80 dark:border-border/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-100 dark:border-border/60">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA] leading-tight tracking-tight">
              {activity.title || 'Untitled Activity'}
            </span>
            <span className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md border ${getRoleBadgeClass(activity.assignedRole)}`}>
              {activity.assignedRole}
            </span>
          </div>
          <span className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {activity.category || 'Activity'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <LogStatusBadge status={lifecycleStatus} />

          {lifecycleStatus !== 'Completed' && onComplete && (
            <button
              type="button"
              onClick={() => onComplete(activity.id)}
              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
              title="Mark as Complete"
            >
              <CheckCircle2 size={15} strokeWidth={2.2} />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(activity)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E8A33D] bg-white dark:bg-surface border border-[#E8A33D] hover:bg-[#E8A33D]/10 transition-all cursor-pointer shadow-2xs"
            >
              <Pencil size={12} strokeWidth={2.5} />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(activity.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-border/70 hover:border-red-200 transition-colors cursor-pointer"
              title="Delete Activity"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Metadata in ONE Single Straight Horizontal Row on Desktop */}
      <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-x-4 gap-y-3.5 pt-0.5">
        {/* Date & Time */}
        <div className="flex flex-col gap-1 min-w-[110px] flex-1">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <Calendar size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />
            Date & Time
          </span>
          <span className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">
            {formatDisplayDate(activity.date)}
            {activity.time && (
              <span className="text-slate-500 font-normal text-xs ml-1">
                • {formatDisplayTime(activity.time)}
              </span>
            )}
          </span>
        </div>

        {/* Location / Meeting Link */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {activity.mode === 'Online' ? (
              <Video size={11} className="text-blue-500 shrink-0" />
            ) : (
              <Building2 size={11} className="text-amber-600 shrink-0" />
            )}
            Location / Link
          </span>
          <div className="text-[13.5px] font-bold truncate">
            {activity.mode === 'Online' ? (
              formattedMeetingUrl ? (
                <a
                  href={formattedMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  title={`Join Online: ${formattedMeetingUrl}`}
                >
                  <span className="truncate">{onlinePlatformName}</span>
                  <ExternalLink size={11} className="shrink-0" />
                </a>
              ) : (
                <span className="text-slate-900 dark:text-white">{onlinePlatformName}</span>
              )
            ) : googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                title={`Open in Google Maps: ${onsiteLocationText}`}
              >
                <MapPin size={11} className="shrink-0 text-amber-500" />
                <span className="truncate">{onsiteLocationText || 'Onsite Venue'}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
            ) : (
              <span className="text-slate-900 dark:text-white">{onsiteLocationText || 'Onsite'}</span>
            )}
          </div>
        </div>

        {/* Assigned Team Members */}
        <div className="flex flex-col gap-1 min-w-[110px] flex-1">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <Users size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />
            Assigned Team
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {displayedProfiles.length > 0 ? (
              <>
                <div className="flex items-center -space-x-1.5">
                  {displayedProfiles.map((profile) => (
                    <div key={profile.id} className="relative z-10 hover:z-20 transition-transform hover:scale-110">
                      <UserAvatar profile={profile} size={20} showTooltip />
                    </div>
                  ))}
                </div>
                {remainingCount > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-200">
                    +{remainingCount}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                {activity.assignedRole} Team
              </span>
            )}
          </div>
        </div>

        {/* Created Date */}
        <div className="flex flex-col gap-1 min-w-[110px] flex-1">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <Clock size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />
            Created
          </span>
          <span className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">
            {formatDateTime(activity.createdAt)}
          </span>
        </div>
      </div>

      {/* Online ID & Passcode info if available */}
      {activity.mode === 'Online' && (activity.onlineMeetingId || activity.onlinePasscode) && (
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-2 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-border/60">
          {activity.onlineMeetingId && <span>Meeting ID: <strong className="text-slate-900 dark:text-white">{activity.onlineMeetingId}</strong></span>}
          {activity.onlinePasscode && <span>Passcode: <strong className="text-slate-900 dark:text-white">{activity.onlinePasscode}</strong></span>}
        </div>
      )}

      {/* Collapsible Notes / Agenda */}
      {hasNotes && (
        <div className="rounded-xl border border-slate-200/70 dark:border-border/70 overflow-hidden mt-1">
          <button
            type="button"
            onClick={() => setIsNotesOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-surface-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-none"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={12} />
              <span>Notes & Agenda</span>
            </span>
            <ChevronDown
              size={14}
              className={`transform transition-transform duration-200 ${
                isNotesOpen ? 'rotate-180 text-[#E8A33D]' : ''
              }`}
            />
          </button>
          {isNotesOpen && (
            <div className="p-3.5 bg-slate-50/60 dark:bg-surface-2/60 text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto border-t border-slate-200/60 dark:border-border/60">
              {activity.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
