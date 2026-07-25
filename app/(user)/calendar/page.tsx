'use client';

import CalendarContent from '@src/features/calendar/components/CalendarContent';
import styles from '@/styles/components/calendar/CalendarContent.module.css';

export default function UserCalendarPage() {
  return (
    <div className={styles.page}>
      <CalendarContent
        title="Personal Event Schedule"
        subtitle="Dynamic Multi-View Synchronization Matrix"
      />
    </div>
  );
}


