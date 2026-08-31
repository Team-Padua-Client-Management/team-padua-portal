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

export default function DashboardLayout1({
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
    <div className={styles.boardGrid}>
      {/* Column 1: Client Servicing Monitoring + Client Inquiries */}
      <div className={styles.boardCol}>
        <TaskList
          tasks={userTasks}
          allProfiles={allProfiles}
          bizDevProfiles={bizDevProfiles}
          onCreateTask={onCreateTask}
          onToggleComplete={onToggleTaskComplete}
          onSelectTask={onSelectTask}
          onSaveTaskField={onSaveTaskField}
          onDeleteTask={onDeleteTask}
          variant="card"
        />
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
          variant="card"
        />
      </div>

      {/* Column 2: Client Birthdays + Calendar of Activities */}
      <div className={styles.centerCol}>
        <BirthdayCard
          birthdays={clientBirthdays}
          advisors={advisors}
        />

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

      {/* Column 3: Activity Tracker Calendar + Client Servicing Request */}
      <div className={styles.boardCol}>
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

        <RequestFormsAccordion
          kpis={kpis}
          userRole={userRole}
          userPermissions={userPermissions}
          variant="accordion"
        />
      </div>
    </div>
  );
}
