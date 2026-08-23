'use client';

import React from 'react';
import TaskList from '../TaskList';
import InquiryList from '../InquiryList';
import ActivityCalendar from '../ActivityCalendar';
import BirthdayCard from '../BirthdayCard';
import { DashboardLayoutProps } from '../../types/layoutProps';
import styles from '@/styles/admin/dashboard/page.module.css';

export default function DashboardLayout4({
  userTasks,
  allProfiles,
  bizDevProfiles,
  clientInquiries,
  clientBirthdays,
  advisors,
  activities,
  miniCalendarMonth,
  selectedMiniDate,
  onCreateTask,
  onToggleTaskComplete,
  onSelectTask,
  onSaveTaskField,
  onDeleteTask,
  onCreateInquiry,
  onDeleteInquiry,
  onSaveInquiryField,
  onSelectInquiry,
  onCopyToPending,
  onCopyToAddressed,
  onPrevMiniMonth,
  onNextMiniMonth,
  onSelectMiniDate,
  onOpenLogModal,
  onSelectEvent,
}: DashboardLayoutProps) {
  return (
    <div className={styles.layout4Focus}>
      {/* TOP ROW: Compact KPI Strips — Requests + Inquiries */}
      <div className={styles.layout4TopRow}>
        <div className="flex-1 min-w-0">
          <TaskList
            tasks={userTasks}
            allProfiles={allProfiles}
            bizDevProfiles={bizDevProfiles}
            onCreateTask={onCreateTask}
            onToggleComplete={onToggleTaskComplete}
            onSelectTask={onSelectTask}
            onSaveTaskField={onSaveTaskField}
            onDeleteTask={onDeleteTask}
            variant="compact-strip"
          />
        </div>
        <div className="flex-1 min-w-0">
          <InquiryList
            inquiries={clientInquiries}
            allProfiles={allProfiles}
            onCreateInquiry={onCreateInquiry}
            onDeleteInquiry={onDeleteInquiry}
            saveInquiryField={onSaveInquiryField}
            onSelectInquiry={onSelectInquiry}
            onCopyToPending={onCopyToPending}
            onCopyToAddressed={onCopyToAddressed}
            variant="compact-strip"
          />
        </div>
      </div>

      {/* BOTTOM ROW: Activity Calendar + Birthday Card */}
      <div className={styles.layout4BottomRow}>
        <div className={styles.layout4CalendarCol}>
          <ActivityCalendar
            activities={activities}
            miniCalendarMonth={miniCalendarMonth}
            selectedMiniDate={selectedMiniDate}
            onPrevMonth={onPrevMiniMonth}
            onNextMonth={onNextMiniMonth}
            onSelectDate={onSelectMiniDate}
            onOpenLogModal={onOpenLogModal}
            onSelectEvent={onSelectEvent}
          />
        </div>
        <div className={styles.layout4BirthdayCol}>
          <BirthdayCard
            birthdays={clientBirthdays}
            advisors={advisors}
          />
        </div>
      </div>
    </div>
  );
}
