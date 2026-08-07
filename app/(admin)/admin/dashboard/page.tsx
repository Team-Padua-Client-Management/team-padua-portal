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
import ClientServicingStats from "@src/features/dashboard/components/ClientServicingStats";
// import ClientServicingToDo from "@src/features/dashboard/components/ClientServicingToDo";
import TaskList from "@src/features/dashboard/components/TaskList";
import InquiryList from "@src/features/dashboard/components/InquiryList";
import BirthdayCard from "@src/features/dashboard/components/BirthdayCard";
import CalendarActivityCard from "@src/features/dashboard/components/CalendarActivityCard";
import CalendarActivityModal from "@src/features/dashboard/components/CalendarActivityModal";
import ActivityCalendar from "@src/features/dashboard/components/ActivityCalendar";
import RequestFormsAccordion from "@src/features/dashboard/components/RequestFormsAccordion";
import TaskModal from "@src/features/dashboard/components/TaskModal";
import InquiryModal from "@src/features/dashboard/components/InquiryModal";
import ActivityModal from "@src/features/dashboard/components/ActivityModal";
import EventDetailsModal from "@src/features/dashboard/components/EventDetailsModal";
import ConfirmDeleteModal from "@src/features/dashboard/components/ConfirmDeleteModal";

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
    goToPrevMiniMonth,
    goToNextMiniMonth,
    handleEventClick,
    handleDeleteEvent,
    saveTaskField,
    handleToggleCheckbox,
    handleCreateTask,
    handleCreateInquiry,
    handleDeleteTask,
    // personalTodos,
    // handleCreatePersonalTodo,
    // handleTogglePersonalTodoComplete,
    // handleDeletePersonalTodo,
    userRole,
    userPermissions
  } = useAdminDashboard();

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

  const sortedCalendarLogs = [...filteredCalendarLogs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const selectedTaskForModal = userTasks.find((t) => t.id === selectedTaskIdForModal) || null;
  const selectedInquiry = hookSelectedInquiry || clientInquiries.find((i: any) => i.id === selectedInquiryId) || null;

  return (
    <div className={styles.shell}>
      <WelcomeModal userName={adminName} role="Admin" />

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

          <motion.div variants={fadeVariants} className={styles.boardGrid}>

            <div className={styles.boardCol}>
              <TaskList
                tasks={userTasks}
                allProfiles={allProfiles}
                bizDevProfiles={bizDevProfiles}
                onCreateTask={handleCreateTask}
                onToggleComplete={handleToggleCheckbox}
                onSelectTask={(id) => setSelectedTaskIdForModal(id)}
                onSaveTaskField={saveTaskField}
                onDeleteTask={handleDeleteTask}
              />
              <InquiryList
                inquiries={clientInquiries}
                allProfiles={allProfiles}
                onCreateInquiry={handleCreateInquiry}
                onDeleteInquiry={handleDeleteInquiry}
                saveInquiryField={saveInquiryField}
                onSelectInquiry={(item) => setSelectedInquiryId(item.id)}
              />
              {/* <ClientServicingToDo
                tasks={userTasks}
                personalTodos={personalTodos}
                allProfiles={allProfiles}
                bizDevProfiles={bizDevProfiles}
                onCreatePersonalTodo={handleCreatePersonalTodo}
                onToggleComplete={handleToggleCheckbox}
                onTogglePersonalTodoComplete={handleTogglePersonalTodoComplete}
                onDeletePersonalTodo={handleDeletePersonalTodo}
                onSelectTask={(id) => setSelectedTaskIdForModal(id)}
              /> */}
            </div>

            <div className={styles.centerCol}>
              <BirthdayCard
                birthdays={clientBirthdays}
                advisors={advisors}
              />

              <div className={styles.activitiesCard}>
                <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={18} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300" />
                      <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
                        Calendar of Activities
                      </h3>
                    </div>
                    <button type="button" onClick={() => setIsCalendarModalOpen(true)} className={`${styles.newTaskBtn} !py-1 !px-3 !text-[11px]`}>
                      <Plus size={13} strokeWidth={2.5} />
                      <span className="font-bold">Add Activity</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {['All', 'Admin', 'Advisor', 'Bizdev'].map((role) => {
                      const isActive = calendarRoleFilter === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setCalendarRoleFilter(role as any)}
                          className={`px-3 py-1 rounded-lg text-[10.5px] font-semibold transition-all shrink-0 cursor-pointer border ${isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                            : 'bg-surface/80 text-text-secondary border-border/70 hover:border-amber-500/50 hover:text-text hover:bg-surface'
                            }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.dashboardCardBody}>
                  {sortedCalendarLogs.length === 0 ? (
                    <div className={styles.emptyStateContainer} onClick={() => setIsCalendarModalOpen(true)} style={{ cursor: 'pointer' }}>
                      <div className={styles.emptyStateIcon}>📅</div>
                      <div className={styles.emptyStateTitle}>No activities scheduled</div>
                      <div className={styles.emptyStateDescription}>Click to log a new activity for the team.</div>
                    </div>
                  ) : (
                    <div className={styles.activityList}>
                      {sortedCalendarLogs.map((log, idx) => {
                        let matchingProfiles = [] as typeof allProfiles;
                        if (log.assignedRole === 'Bizdev') {
                          matchingProfiles = bizDevProfiles;
                        } else {
                          matchingProfiles = allProfiles.filter(p => p.role?.toLowerCase().includes(log.assignedRole.toLowerCase()));
                        }

                        return (
                          <CalendarActivityCard
                            key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
                            activity={log}
                            matchingProfiles={matchingProfiles}
                            onDelete={promptDeleteCalendarActivity}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.boardCol}>
              <ActivityCalendar
                activities={activities}
                miniCalendarMonth={miniCalendarMonth}
                selectedMiniDate={selectedMiniDate}
                onPrevMonth={goToPrevMiniMonth}
                onNextMonth={goToNextMiniMonth}
                onSelectDate={(dateKey) => setSelectedMiniDate(dateKey)}
                onOpenLogModal={openLogModal}
                onSelectEvent={handleEventClick}
              />

              <RequestFormsAccordion kpis={kpis} userRole={userRole} userPermissions={userPermissions} />
            </div>
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