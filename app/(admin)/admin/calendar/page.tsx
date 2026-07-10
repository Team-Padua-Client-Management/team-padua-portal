'use client';

import Sidebar from '@/app/components/admin/AdminSidebar/page';
import Header from '@/app/components/admin/AdminHeader/page';
import CalendarContent from '@/app/components/calendar/CalendarContent';
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