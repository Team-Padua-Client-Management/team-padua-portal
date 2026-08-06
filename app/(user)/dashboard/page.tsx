'use client';

/**
 * ============================================================================
 * TEAM PADUA USER PERSONAL DASHBOARD — SUPABASE & REALTIME INTEGRATION
 * ============================================================================
 * Clean component composition connected directly to Supabase:
 * - DashboardHero: Dynamic background decoration, quick portals, clock & Pomodoro
 * - ClientServicingMonitoring: Realtime Supabase tasks (client_servicing_tasks)
 * - To-do: Realtime Supabase to-do items (todo_tasks)
 * - Calendar of Activities: Log calendar activities (client_servicing_tasks / tasks)
 * - Activity Tracker Calendar: Realtime Supabase activity logs (calendar_events)
 * - RequestFormsAccordion: Enterprise accordion for all CSR request forms
 * ============================================================================
 */

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

import styles from "@/styles/admin/dashboard/page.module.css";
import WelcomeModal from "@src/components/modals/WelcomeModal";
import { CalendarDays, Plus } from 'lucide-react';
import { supabase } from "@src/lib/supabase/client";
import type { UserPermissions } from "@src/features/dashboard/components/RequestFormsAccordion";

import DashboardHero from "@src/features/dashboard/components/DashboardHero";
import ClientServicingToDo from "@src/features/dashboard/components/ClientServicingToDo";
import TaskList, { ClientInquiries } from "@src/features/dashboard/components/TaskList";
import BirthdayCard from "@src/features/dashboard/components/BirthdayCard";
import CalendarActivityCard from "@src/features/dashboard/components/CalendarActivityCard";
import CalendarActivityModal from "@src/features/dashboard/components/CalendarActivityModal";
import ActivityCalendar from "@src/features/dashboard/components/ActivityCalendar";
import RequestFormsAccordion from "@src/features/dashboard/components/RequestFormsAccordion";
import TaskModal from "@src/features/dashboard/components/TaskModal";
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

export default function UserPersonalDashboardPage() {
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
    personalTodos,
    handleCreatePersonalTodo,
    handleTogglePersonalTodoComplete,
    handleDeletePersonalTodo
  } = useAdminDashboard();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>(null);

  useEffect(() => {
    async function fetchUserAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, client_servicing_permissions")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserRole(profile.role ?? null);
        setUserPermissions(profile.client_servicing_permissions ?? null);
      }
    }
    fetchUserAccess();
  }, []);

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

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
  const currentUserProfile = allProfiles.find(p => p.id === currentUserId) || null;

  return (
    <>
      <WelcomeModal userName={adminName} role="Associate" />

      {showSplash && (
        <div className={styles.splash}>
          <div className={styles.splashRing}>
            <div className={styles.splashSpin} />
            <div className={styles.splashDot} />
          </div>
          <p className={styles.splashLabel}>Syncing personal workspace</p>
        </div>
      )}

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

            <ClientInquiries
              tasks={userTasks}
              onCreateTask={handleCreateTask}
              onCreateInquiry={handleCreateInquiry}
              onSelectTask={(id) => setSelectedTaskIdForModal(id)}
              onDeleteTask={handleDeleteTask}
            />

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
          <span>TeamPadua Personal Workspace &bull; 2026</span>
          <div className={styles.footerRight}>
            <span className={styles.footerPill}><span className={styles.footerDot} />SLA 99.99%</span>
            <span className={styles.footerPill}><span className={styles.footerDot} />Secure Supabase Connection</span>
            <span className={styles.footerPill}><span className={styles.footerDot} />{defaultPortals.length + customPortals.length} Portals Linked</span>
          </div>
        </motion.footer>
      </motion.main>

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
    </>
  );
}