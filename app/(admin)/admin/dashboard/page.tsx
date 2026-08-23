'use client';

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Plus } from 'lucide-react';
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import styles from "@/styles/admin/dashboard/page.module.css";
import WelcomeModal from "@src/components/modals/WelcomeModal";

import DashboardHero from "@src/features/dashboard/components/DashboardHero";
import DashboardLayoutSwitcher, { DashboardLayoutMode } from "@src/features/dashboard/components/DashboardLayoutSwitcher";
import DashboardLayout1 from "@src/features/dashboard/components/layouts/DashboardLayout1";
import DashboardLayout2 from "@src/features/dashboard/components/layouts/DashboardLayout2";
import DashboardLayout3 from "@src/features/dashboard/components/layouts/DashboardLayout3";
import DashboardLayout4 from "@src/features/dashboard/components/layouts/DashboardLayout4";
import CalendarActivityModal from "@src/features/dashboard/components/CalendarActivityModal";
import TaskModal from "@src/features/dashboard/components/TaskModal";
import InquiryModal from "@src/features/dashboard/components/InquiryModal";
import ActivityModal from "@src/features/dashboard/components/ActivityModal";
import EventDetailsModal from "@src/features/dashboard/components/EventDetailsModal";
import ConfirmDeleteModal from "@src/features/dashboard/components/ConfirmDeleteModal";
import { getActivityLifecycleStatus } from "@src/features/dashboard/components/CalendarActivityCard";

import { useDashboardClock } from '@src/features/dashboard/hooks/useDashboardClock';
import { usePomodoroTimer } from '@src/features/dashboard/hooks/usePomodoroTimer';
import { useAdminDashboard } from '@src/features/dashboard/hooks/useAdminDashboard';
import {
  containerVariants,
  itemVariants,
  itemVariantsReduced,
  defaultPortals,
} from '@src/features/dashboard/constants';

export default function DashboardOverviewPage() {
  const { greeting, dayPeriod, currentDate, currentTime } = useDashboardClock();

  const [layoutMode, setLayoutMode] = React.useState<DashboardLayoutMode>('layout-1');

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('team_padua_admin_layout') as DashboardLayoutMode;
      if (saved && ['layout-1', 'layout-2', 'layout-3', 'layout-4'].includes(saved)) {
        setLayoutMode(saved);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleSelectLayout = (layout: DashboardLayoutMode) => {
    setLayoutMode(layout);
    try {
      localStorage.setItem('team_padua_admin_layout', layout);
    } catch {
      // ignore
    }
  };

  const {

    pomoMode,
    pomoSeconds,
    pomoIsRunning,
    pomoCompletedSessions,
    pomoNotice,
    handlePomoModeChange,
    handlePomoReset,
    handlePomoSkip,
    onPomoTogglePlay
  } = usePomodoroTimer();

  const {
    showSplash,
    isRefreshing,
    adminName,
    customPortals,
    clientBirthdays,
    userTasks,
    clientInquiries = [],
    saveInquiryField,
    handleDeleteInquiry,
    selectedInquiryId,
    setSelectedInquiryId,
    selectedInquiry: hookSelectedInquiry,
    allProfiles,
    bizDevProfiles,
    advisors,
    currentUserId,
    selectedTaskIdForModal,
    setSelectedTaskIdForModal,
    activities,
    calendarLogs,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    calendarRoleFilter,
    setCalendarRoleFilter,
    isLogModalOpen,
    miniCalendarMonth,
    selectedMiniDate,
    setSelectedMiniDate,
    selectedEvent,
    setSelectedEvent,
    activityForm,
    activityToDelete,
    setActivityToDelete,
    isMounted,
    kpis,
    handleRefresh,
    openLogModal,
    closeLogModal,
    handleFormChange,
    handleSaveActivity,
    handleSaveCalendarActivity,
    promptDeleteCalendarActivity,
    executeDeleteCalendarActivity,
    handleCompleteCalendarActivity,
    goToPrevMiniMonth,
    goToNextMiniMonth,
    handleEventClick,
    handleDeleteEvent,
    saveTaskField,
    handleToggleCheckbox,
    handleCreateTask,
    handleCreateInquiry,
    copyInquiryToPendingSubmission,
    copyInquiryToAddressedConcerns,
    handleDeleteTask,
    // personalTodos,
    // handleCreatePersonalTodo,
    // handleTogglePersonalTodoComplete,
    // handleDeletePersonalTodo,
    userRole,
    userPermissions
  } = useAdminDashboard();

  const [showCalendarHistory, setShowCalendarHistory] = React.useState(false);

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  const currentUserProfile = useMemo(() => {
    return allProfiles.find((p) => p.id === currentUserId) || null;
  }, [allProfiles, currentUserId]);

  const filteredActivities = useMemo(() => {
    if (!selectedMiniDate) return activities;
    return activities.filter((act) => act.date === selectedMiniDate);
  }, [activities, selectedMiniDate]);

  const sortedActivities = [...filteredActivities].sort((a, b) => b.date.localeCompare(a.date));

  const filteredCalendarLogs = useMemo(() => {
    if (calendarRoleFilter === 'All') return calendarLogs;
    return calendarLogs.filter(log => log.assignedRole === calendarRoleFilter);
  }, [calendarLogs, calendarRoleFilter]);

  const sortedCalendarLogs = useMemo(() => {
    const parseDateToTime = (dStr: string) => {
      if (!dStr) return 0;
      const parts = dStr.trim().split(/[\/\-\.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
        } else {
          return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])).getTime();
        }
      }
      const t = new Date(dStr).getTime();
      return isNaN(t) ? 0 : t;
    };

    return [...filteredCalendarLogs].sort((a, b) => {
      const tA = parseDateToTime(a.date);
      const tB = parseDateToTime(b.date);
      if (tA === tB && a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (showCalendarHistory) {
        return tB - tA;
      }
      return tA - tB;
    });
  }, [filteredCalendarLogs, showCalendarHistory]);

  const displayedCalendarLogs = useMemo(() => {
    return sortedCalendarLogs.filter((log) => {
      const status = getActivityLifecycleStatus(log);
      if (showCalendarHistory) {
        return status === 'Completed' || status === 'Cancelled';
      }
      return status !== 'Completed' && status !== 'Cancelled';
    });
  }, [sortedCalendarLogs, showCalendarHistory]);

  const selectedTaskForModal = userTasks.find((t) => t.id === selectedTaskIdForModal) || null;
  const selectedInquiry = hookSelectedInquiry || clientInquiries.find((i: any) => i.id === selectedInquiryId) || null;

  const sharedLayoutProps = {
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
    onCreateTask: handleCreateTask,
    onToggleTaskComplete: handleToggleCheckbox,
    onSelectTask: (id: string) => setSelectedTaskIdForModal(id),
    onSaveTaskField: saveTaskField,
    onDeleteTask: handleDeleteTask,
    onCreateInquiry: handleCreateInquiry,
    onDeleteInquiry: handleDeleteInquiry,
    onSaveInquiryField: saveInquiryField,
    onSelectInquiry: (item: any) => setSelectedInquiryId(item.id),
    onCopyToPending: copyInquiryToPendingSubmission,
    onCopyToAddressed: copyInquiryToAddressedConcerns,
    setShowCalendarHistory,
    onOpenCalendarModal: () => setIsCalendarModalOpen(true),
    setCalendarRoleFilter,
    promptDeleteCalendarActivity,
    handleCompleteCalendarActivity,
    onPrevMiniMonth: goToPrevMiniMonth,
    onNextMiniMonth: goToNextMiniMonth,
    onSelectMiniDate: (dateKey: string | null) => setSelectedMiniDate(dateKey),
    onOpenLogModal: openLogModal,
    onSelectEvent: handleEventClick,
  };

  return (
    <div className={styles.shell}>
      <WelcomeModal
        userName={adminName}
        role="Admin"
      />

      {showSplash && (
        <div className={styles.splash}>
          <div className={styles.splashRing}>
            <div className={styles.splashSpin} />
            <div className={styles.splashDot} />
          </div>
          <p className={styles.splashLabel}>Syncing admin dashboard</p>
        </div>
      )}

      <Sidebar />

      <div className={styles.mainCol}>
        <Header />

        <motion.main className={styles.content} variants={containerVariants} initial="hidden" animate="show">

          <motion.section variants={fadeVariants}>
            <DashboardHero
              adminName={adminName}
              greeting={greeting}
              dayPeriod={dayPeriod}
              currentDate={currentDate}
              currentTime={currentTime}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              portals={defaultPortals}
              customPortals={customPortals}
              pomoMode={pomoMode}
              pomoSeconds={pomoSeconds}
              pomoIsRunning={pomoIsRunning}
              pomoCompletedSessions={pomoCompletedSessions}
              pomoNotice={pomoNotice}
              onPomoModeChange={handlePomoModeChange}
              onPomoTogglePlay={onPomoTogglePlay}
              onPomoReset={handlePomoReset}
              onPomoSkip={handlePomoSkip}
            />
          </motion.section>

          {/* Layout Mode Selector */}
          <motion.section variants={fadeVariants}>
            <DashboardLayoutSwitcher
              currentLayout={layoutMode}
              onSelectLayout={handleSelectLayout}
            />
          </motion.section>

          {/* Active Dashboard Layout */}
          <motion.div variants={fadeVariants} key={layoutMode}>
            {layoutMode === 'layout-2' && (
              <DashboardLayout2 {...sharedLayoutProps} />
            )}
            {layoutMode === 'layout-3' && (
              <DashboardLayout3 {...sharedLayoutProps} />
            )}
            {layoutMode === 'layout-4' && (
              <DashboardLayout4 {...sharedLayoutProps} />
            )}
            {(layoutMode === 'layout-1' || (!['layout-2', 'layout-3', 'layout-4'].includes(layoutMode))) && (
              <DashboardLayout1 {...sharedLayoutProps} />
            )}
          </motion.div>

          <motion.footer variants={fadeVariants} className={styles.footer}>
            <span>TeamPadua Operations Control Terminal &bull; 2026</span>
            <div className={styles.footerRight}>
              <span className={styles.footerPill}><span className={styles.footerDot} />SLA 99.99%</span>
              <span className={styles.footerPill}><span className={styles.footerDot} />Secure Layer Online</span>
              <span className={styles.footerPill}><span className={styles.footerDot} />{defaultPortals.length + customPortals.length} Portals Linked</span>
            </div>
          </motion.footer>
        </motion.main>
      </div>

      {isMounted && isLogModalOpen && createPortal(
        <ActivityModal
          activityForm={activityForm}
          onChangeForm={handleFormChange}
          onSave={handleSaveActivity}
          onClose={closeLogModal}
        />,
        document.body
      )}

      {isMounted && selectedEvent && createPortal(
        <EventDetailsModal
          event={selectedEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setSelectedEvent(null)}
        />,
        document.body
      )}

      {isMounted && selectedTaskForModal && createPortal(
        <TaskModal
          task={selectedTaskForModal}
          allProfiles={allProfiles}
          bizDevProfiles={bizDevProfiles}
          currentUserProfile={currentUserProfile}
          onSaveField={saveTaskField}
          onDeleteTask={handleDeleteTask}
          onClose={() => setSelectedTaskIdForModal(null)}
        />,
        document.body
      )}

      {isMounted && selectedInquiry && createPortal(
        <InquiryModal
          isOpen={true}
          inquiry={selectedInquiry}
          allProfiles={allProfiles}
          currentUserProfile={currentUserProfile}
          saveInquiryField={saveInquiryField}
          handleDeleteInquiry={handleDeleteInquiry}
          onClose={() => setSelectedInquiryId(null)}
        />,
        document.body
      )}

      {isMounted && isCalendarModalOpen && createPortal(
        <CalendarActivityModal
          onSave={handleSaveCalendarActivity}
          onClose={() => setIsCalendarModalOpen(false)}
        />,
        document.body
      )}

      {isMounted && activityToDelete && createPortal(
        <ConfirmDeleteModal
          onConfirm={executeDeleteCalendarActivity}
          onCancel={() => setActivityToDelete(null)}
        />,
        document.body
      )}
    </div>
  );
}