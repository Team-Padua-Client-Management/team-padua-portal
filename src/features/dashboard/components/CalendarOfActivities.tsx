'use client';

import React from 'react';
import { CalendarDays, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import CalendarActivityCard from './CalendarActivityCard';
import { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface CalendarOfActivitiesProps {
  displayedCalendarLogs: any[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  calendarRoleFilter: string;
  setCalendarRoleFilter: (role: any) => void;
  showCalendarHistory: boolean;
  setShowCalendarHistory: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenCalendarModal: () => void;
  promptDeleteCalendarActivity: (id: string) => void;
  handleCompleteCalendarActivity: (id: string) => void;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  isUserView?: boolean;
}

export default function CalendarOfActivities({
  displayedCalendarLogs,
  allProfiles,
  bizDevProfiles,
  calendarRoleFilter,
  setCalendarRoleFilter,
  showCalendarHistory,
  setShowCalendarHistory,
  onOpenCalendarModal,
  promptDeleteCalendarActivity,
  handleCompleteCalendarActivity,
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}: CalendarOfActivitiesProps) {
  return (
    <div className={`${styles.activitiesCard} ${className}`}>
      <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300 shrink-0" />
            <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
              Calendar of Activities
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCalendarHistory((prev) => !prev)}
              className={`!py-1 !px-3 !text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${
                showCalendarHistory
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-surface/80 text-text-secondary border-border/70 hover:bg-surface'
              }`}
            >
              {showCalendarHistory ? 'Active Activities' : 'View History'}
            </button>

            <button
              type="button"
              onClick={onOpenCalendarModal}
              className={`${styles.newTaskBtn} !py-1 !px-3 !text-[11px]`}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="font-bold">Add Activity</span>
            </button>

            {collapsible && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-lg hover:bg-surface-2 text-text-secondary hover:text-text transition-colors border border-border/50"
                aria-label={isCollapsed ? 'Expand Calendar of Activities' : 'Collapse Calendar of Activities'}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {['All', 'Admin', 'Advisor', 'Bizdev'].map((role) => {
              const isActive = calendarRoleFilter === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setCalendarRoleFilter(role as any)}
                  className={`px-3 py-1 rounded-lg text-[10.5px] font-semibold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                      : 'bg-surface/80 text-text-secondary border-border/70 hover:border-amber-500/50 hover:text-text hover:bg-surface'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className={styles.dashboardCardBody}>
          {displayedCalendarLogs.length === 0 ? (
            <div
              className={styles.emptyStateContainer}
              onClick={onOpenCalendarModal}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.emptyStateIcon}>📅</div>
              <div className={styles.emptyStateTitle}>
                {showCalendarHistory ? 'No activity history' : 'No active activities scheduled'}
              </div>
              <div className={styles.emptyStateDescription}>
                {showCalendarHistory
                  ? 'Completed and cancelled activities will appear here.'
                  : 'Click to log a new activity for the team.'}
              </div>
            </div>
          ) : (
            <div className={styles.activityList}>
              {displayedCalendarLogs.map((log, idx) => {
                let matchingProfiles = [] as typeof allProfiles;
                if (log.assignedRole === 'Bizdev') {
                  matchingProfiles = bizDevProfiles;
                } else {
                  matchingProfiles = allProfiles.filter((p) =>
                    p.role?.toLowerCase().includes(log.assignedRole.toLowerCase())
                  );
                }

                return (
                  <CalendarActivityCard
                    key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
                    activity={log}
                    matchingProfiles={matchingProfiles}
                    onDelete={promptDeleteCalendarActivity}
                    onComplete={handleCompleteCalendarActivity}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
