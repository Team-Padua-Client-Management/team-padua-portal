import React from 'react';
import Link from 'next/link';
import { CalendarClock, Plus, ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ActivityEvent, formatDisplayDate, formatDisplayTime } from './ActivityCard';
import styles from '@/styles/admin/dashboard/page.module.css';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ActivityCalendarProps {
  activities: ActivityEvent[];
  miniCalendarMonth: Date;
  selectedMiniDate: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string | null) => void;
  onOpenLogModal: () => void;
  onSelectEvent: (event: ActivityEvent) => void;
  calendarUrl?: string;
}

export function formatDateKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function getMiniCalendarCells(viewDate: Date): { dateKey: string; day: number }[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { dateKey: string; day: number }[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ dateKey: '', day: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateKey: formatDateKey(year, month, d), day: d });
  }
  return cells;
}

export default function ActivityCalendar({
  activities,
  miniCalendarMonth,
  selectedMiniDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onOpenLogModal,
  onSelectEvent,
  calendarUrl
}: ActivityCalendarProps) {
  const now = new Date();
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const getEventsForDate = (dateKey: string) => activities.filter((a) => a.date === dateKey);
  const hasActivitiesOnDate = (dateKey: string) => activities.some((a) => a.date === dateKey);

  const selectedDateEvents = selectedMiniDate ? getEventsForDate(selectedMiniDate) : [];

  return (
    <div className={styles.trackerCalendarCard}>
      <div className={styles.dashboardCardHeader}>
        <div className={styles.dashboardCardTitle}>
          <CalendarClock size={14} strokeWidth={1.8} />
          <h3>Activity Tracker Calendar</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {calendarUrl && (
            <Link href={calendarUrl} className={styles.trackerLink} style={{ opacity: 0.85 }}>
              <ExternalLink size={12} strokeWidth={2} />
              Full Calendar
            </Link>
          )}
          <button type="button" onClick={onOpenLogModal} className={styles.trackerLink}>
            <Plus size={13} strokeWidth={2} />
            Log Activity
          </button>
        </div>
      </div>

      <div className={styles.dashboardCardBody}>
        <div className={styles.miniCalendar}>
          <div className={styles.miniCalendarHeader}>
            <button type="button" className={styles.miniCalendarNavBtn} onClick={onPrevMonth} aria-label="Previous Month">
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <span className={styles.miniCalendarTitle}>
              {miniCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" className={styles.miniCalendarNavBtn} onClick={onNextMonth} aria-label="Next Month">
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          <div className={styles.miniCalendarGrid}>
            <div className={styles.miniCalendarWeekdays}>
              {WEEKDAY_LABELS.map((w) => (<span key={w}>{w}</span>))}
            </div>
            <div className={styles.miniCalendarDaysGrid}>
              {getMiniCalendarCells(miniCalendarMonth).map((cell, idx) => {
                if (!cell.day) {
                  return <div key={`blank-${idx}`} className={`${styles.miniCalendarDay} ${styles.miniCalendarDayEmpty}`} />;
                }
                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedMiniDate;
                const hasEvents = hasActivitiesOnDate(cell.dateKey);

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => onSelectDate(selectedMiniDate === cell.dateKey ? null : cell.dateKey)}
                    className={`${styles.miniCalendarDay} ${isToday ? styles.miniCalendarToday : ''} ${isSelected ? styles.selectedMiniDay : ''} ${hasEvents ? styles.miniCalendarHasEvent : ''}`}
                  >
                    {cell.day}
                    {hasEvents && <span className={styles.miniCalendarDot} />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMiniDate && (
            <div className={styles.selectedDateActivities}>
              <div className={styles.selectedDateHeader}>
                <span>Selected Date • {formatDisplayDate(selectedMiniDate)}</span>
                <button type="button" className={styles.selectedDateClose} onClick={() => onSelectDate(null)} title="Close preview">
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
              {selectedDateEvents.length === 0 ? (
                <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>No activities logged for this date</span>
              ) : (
                selectedDateEvents.map((evt) => (
                  <div key={evt.id} className={styles.selectedActivityItem} onClick={() => onSelectEvent(evt)}>
                    <span className={styles.selectedActivityTitle}>• {evt.title}</span>
                    <span className={styles.selectedActivityMeta}>
                      {evt.time ? formatDisplayTime(evt.time) : 'All Day'} {evt.location ? `• ${evt.location}` : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
