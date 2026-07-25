'use client';

import { AdminSidebar as Sidebar, AdminHeader as Header } from '@src/components/layout';
import CalendarContent from '@src/features/calendar/components/CalendarContent';
import styles from '@/styles/components/calendar/CalendarContent.module.css';

export default function AdminCalendarPage() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <CalendarContent
        title="Enterprise Master Calendar"
        subtitle="Dynamic Multi-View Synchronization Matrix"
      />
    </div>
  );
}
