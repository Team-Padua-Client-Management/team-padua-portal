'use client';

import React, { useState } from 'react';
import { Briefcase, Users, Layers, Activity } from 'lucide-react';
import TaskList from '../TaskList';
import InquiryList from '../InquiryList';
import BirthdayCard from '../BirthdayCard';
import CalendarOfActivities from '../CalendarOfActivities';
import ActivityCalendar from '../ActivityCalendar';
import RequestFormsAccordion from '../RequestFormsAccordion';
import { DashboardLayoutProps } from '../../types/layoutProps';
import styles from '@/styles/admin/dashboard/page.module.css';

export default function DashboardLayout3({
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
  const [isActivitiesCollapsed, setIsActivitiesCollapsed] = useState(false);
  const [isBirthdaysCollapsed, setIsBirthdaysCollapsed] = useState(false);

  return (
    <div className={styles.layout3DualCockpit}>
      {/* LEFT COLUMN: OPERATIONS & SERVICING */}
      <div className={styles.layout3CockpitCol}>
        <div className={styles.cockpitSectionHeader}>
          <div className="flex items-center gap-2">
            <div className={styles.cockpitSectionIconBadge}>
              <Briefcase size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className={styles.cockpitSectionTitle}>OPERATIONS & SERVICING</h2>
              <p className={styles.cockpitSectionSubtitle}>Requests processing, inquiries & servicing pipeline</p>
            </div>
          </div>
          <span className={styles.cockpitSectionTag}>Workflow Hub</span>
        </div>

        <div className={styles.cockpitWidgetGroup}>
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

          <RequestFormsAccordion
            kpis={kpis}
            userRole={userRole}
            userPermissions={userPermissions}
            variant="accordion"
            defaultExpanded={true}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: PEOPLE & ACTIVITIES */}
      <div className={styles.layout3CockpitCol}>
        <div className={styles.cockpitSectionHeader}>
          <div className="flex items-center gap-2">
            <div className={`${styles.cockpitSectionIconBadge} ${styles.cockpitSectionIconBadgeAmber}`}>
              <Users size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className={styles.cockpitSectionTitle}>PEOPLE & ACTIVITIES</h2>
              <p className={styles.cockpitSectionSubtitle}>Activity tracking, team schedule & client relationships</p>
            </div>
          </div>
          <span className={`${styles.cockpitSectionTag} ${styles.cockpitSectionTagAmber}`}>Schedule Hub</span>
        </div>

        <div className={styles.cockpitWidgetGroup}>
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
            collapsible={true}
            isCollapsed={isActivitiesCollapsed}
            onToggleCollapse={() => setIsActivitiesCollapsed(!isActivitiesCollapsed)}
          />

          <BirthdayCard
            birthdays={clientBirthdays}
            advisors={advisors}
            collapsible={true}
            isCollapsed={isBirthdaysCollapsed}
            onToggleCollapse={() => setIsBirthdaysCollapsed(!isBirthdaysCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}
