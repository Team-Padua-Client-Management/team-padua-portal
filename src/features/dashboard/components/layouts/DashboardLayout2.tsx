'use client';

import React from 'react';
import TaskList from '../TaskList';
import InquiryList from '../InquiryList';
import BirthdayCard from '../BirthdayCard';
import CalendarOfActivities from '../CalendarOfActivities';
import ActivityCalendar from '../ActivityCalendar';
import RequestFormsAccordion from '../RequestFormsAccordion';
import { DashboardLayoutProps } from '../../types/layoutProps';
import styles from '@/styles/admin/dashboard/page.module.css';

export default function DashboardLayout2({
  userTasks,
  allProfiles,
  bizDevProfiles,
  clientInquiries,
  clientBirthdays,
  advisors,
  activities,
  miniCalendarMonth,
  selectedMiniDate,
  displayedCalendarLogs,
  calendarRoleFilter,
  showCalendarHistory,
  kpis,
  userRole,
  userPermissions,
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
  onMoveToPending,
  onCopyToAddressed,
  setShowCalendarHistory,
  onOpenCalendarModal,
  setCalendarRoleFilter,
  promptDeleteCalendarActivity,
  handleCompleteCalendarActivity,
  onPrevMiniMonth,
  onNextMiniMonth,
  onSelectMiniDate,
  onOpenLogModal,
  onSelectEvent,
}: DashboardLayoutProps) {
  return (
    <div className={styles.layout2Container}>
      {/* 1. TOP ROW: Compact Horizontal KPI Strips */}
      <div className={styles.layout2TopKpiRow}>
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
            onMoveToPending={onMoveToPending}
            onCopyToAddressed={onCopyToAddressed}
            variant="compact-strip"
          />
        </div>
      </div>

      {/* 2. PRIMARY ACTION HUB: Client Servicing Requests (Large Multi-Column) + Activity Tracker Calendar */}
      <div className={styles.layout2MainActionRow}>
        <div className={styles.layout2PrimaryHub}>
          <RequestFormsAccordion
            kpis={kpis}
            userRole={userRole}
            userPermissions={userPermissions}
            variant="grid"
            defaultExpanded={true}
          />
        </div>
        <div className={styles.layout2CalendarHub}>
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
      </div>

      {/* 3. BOTTOM ROW: Wide Calendar of Activities + Client Birthdays */}
      <div className={styles.layout2BottomRow}>
        <div className={styles.layout2WideActivities}>
          <CalendarOfActivities
            displayedCalendarLogs={displayedCalendarLogs}
            allProfiles={allProfiles}
            bizDevProfiles={bizDevProfiles}
            calendarRoleFilter={calendarRoleFilter}
            setCalendarRoleFilter={setCalendarRoleFilter}
            showCalendarHistory={showCalendarHistory}
            setShowCalendarHistory={setShowCalendarHistory}
            onOpenCalendarModal={onOpenCalendarModal}
            promptDeleteCalendarActivity={promptDeleteCalendarActivity}
            handleCompleteCalendarActivity={handleCompleteCalendarActivity}
          />
        </div>
        <div className={styles.layout2Birthdays}>
          <BirthdayCard
            birthdays={clientBirthdays}
            advisors={advisors}
          />
        </div>
      </div>
    </div>
  );
}
