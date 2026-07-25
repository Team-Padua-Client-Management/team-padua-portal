'use client';

/**
 * ============================================================================
 * TEAM PADUA ADMIN DASHBOARD OVERVIEW PAGE ?" MODULAR ENTERPRISE REDESIGN
 * ============================================================================
 * Redesign inspired by Linear, Notion, Stripe, Arc, Framer, and Apple HIG.
 * 
 * Clean component composition:
 * - DashboardHero: Dynamic background decoration, quick portals, clock & Pomodoro
 * - ClientServicingStats: Key metrics (Total, Pending, In Progress, Done, On Hold, Cancelled)
 * - ClientServicingToDo: Status-grouped task board
 * - TaskList: Client Servicing Monitoring task rows and card layout
 * - BirthdayCard: Client birthdays empty state and upcoming list
 * - ActivityCard: Calendar of Activities event cards
 * - RequestFormsAccordion: Enterprise accordion for all CSR request forms
 * - ActivityCalendar: Outlook-style embedded mini calendar
 * - TaskModal, ActivityModal, EventDetailsModal: Centered Notion/Linear modals
 * 
 * All business logic, Supabase integrations, React hooks, Web Audio chimes,
 * and LocalStorage side-effects are preserved 100% unchanged.
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Plus } from 'lucide-react';
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import styles from "@/styles/admin/dashboard/page.module.css";
import WelcomeModal from "@src/components/modals/WelcomeModal";

// Modular Dashboard Components
import DashboardHero from "@src/features/dashboard/components/DashboardHero";
import ClientServicingStats from "@src/features/dashboard/components/ClientServicingStats";
import ClientServicingToDo from "@src/features/dashboard/components/ClientServicingToDo";
import TaskList from "@src/features/dashboard/components/TaskList";
import BirthdayCard from "@src/features/dashboard/components/BirthdayCard";
import CalendarActivityCard from "@src/features/dashboard/components/CalendarActivityCard";
import CalendarActivityModal from "@src/features/dashboard/components/CalendarActivityModal";
import ActivityCalendar from "@src/features/dashboard/components/ActivityCalendar";
import RequestFormsAccordion from "@src/features/dashboard/components/RequestFormsAccordion";
import TaskModal from "@src/features/dashboard/components/TaskModal";
import ActivityModal from "@src/features/dashboard/components/ActivityModal";
import EventDetailsModal from "@src/features/dashboard/components/EventDetailsModal";
import ConfirmDeleteModal from "@src/features/dashboard/components/ConfirmDeleteModal";

// Extracted Hooks and Constants
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
    allProfiles,
    bizDevProfiles,
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
    handleDeleteTask,
    personalTodos,
    handleCreatePersonalTodo,
    handleTogglePersonalTodoComplete,
    handleDeletePersonalTodo
  } = useAdminDashboard();

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

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
          {/* 1. HERO SECTION */}
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

          {/* 2. BOARD GRID (3 COLUMNS) */}
          <motion.div variants={fadeVariants} className={styles.boardGrid}>

            {/* Column 1: Client Servicing Monitoring */}
            <div className={styles.boardCol}>
              <TaskList
                tasks={userTasks}
                allProfiles={allProfiles}
                bizDevProfiles={bizDevProfiles}
                onCreateTask={handleCreateTask}
                onToggleComplete={handleToggleCheckbox}
                onSelectTask={(id) => setSelectedTaskIdForModal(id)}
                onSaveTaskField={saveTaskField}
              />              {/* To-do Widget with Client Servicing Tasks & Personal To-Dos */}
              <ClientServicingToDo
                tasks={userTasks}
                personalTodos={personalTodos}
                allProfiles={allProfiles}
                bizDevProfiles={bizDevProfiles}
                onCreatePersonalTodo={handleCreatePersonalTodo}
                onToggleComplete={handleToggleCheckbox}
                onTogglePersonalTodoComplete={handleTogglePersonalTodoComplete}
                onDeletePersonalTodo={handleDeletePersonalTodo}
                onSelectTask={(id) => setSelectedTaskIdForModal(id)}
              />
            </div>

            {/* Column 2: Client Birthdays & Calendar of Activities */}
            <div className={styles.centerCol}>
              <BirthdayCard birthdays={clientBirthdays} />

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

                  {/* Lightweight Role Filter */}
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

            {/* Column 3: Activity Tracker Calendar & Client Servicing Request Forms */}
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

              <RequestFormsAccordion kpis={kpis} />
            </div>
          </motion.div>

          {/* 5. FOOTER */}
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

      {/* 6. MODALS */}
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
          currentUserProfile={allProfiles.find(p => p.id === currentUserId) || null}
          onSaveField={saveTaskField}
          onDeleteTask={handleDeleteTask}
          onClose={() => setSelectedTaskIdForModal(null)}
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
