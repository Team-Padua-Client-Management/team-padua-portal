'use client';

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CalendarDays, Plus, CheckCircle2, RotateCcw, AlertTriangle, X, Trash2 } from 'lucide-react';
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import styles from "@/styles/admin/dashboard/page.module.css";
import AdminRouteGuard from "@src/components/guards/AdminRouteGuard";
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

interface PendingDeleteItem {
  id: string;
  type: 'task' | 'inquiry';
  title: string;
  secondsLeft: number;
  timerId: NodeJS.Timeout;
  intervalId: NodeJS.Timeout;
}

interface ConfirmDeleteItem {
  id: string;
  type: 'task' | 'inquiry';
  title: string;
}

/**
 * Inner component — contains all data hooks and admin UI.
 * Only rendered when the user is confirmed Admin by AdminRouteGuard.
 */
function AdminDashboardContent() {
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

  // Pending Deletes & Confirmation Modal State
  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState<ConfirmDeleteItem | null>(null);
  const [pendingDeletes, setPendingDeletes] = React.useState<PendingDeleteItem[]>([]);
  const pendingDeletesRef = React.useRef<PendingDeleteItem[]>([]);
  pendingDeletesRef.current = pendingDeletes;

  const [showCalendarHistory, setShowCalendarHistory] = React.useState(false);

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  const currentUserProfile = useMemo(() => {
    return allProfiles.find((p) => p.id === currentUserId) || null;
  }, [allProfiles, currentUserId]);

  // Execute permanent delete after countdown ends
  const executePermanentDelete = React.useCallback(async (id: string, type: 'task' | 'inquiry') => {
    setPendingDeletes((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        clearTimeout(target.timerId);
        clearInterval(target.intervalId);
      }
      return prev.filter((p) => p.id !== id);
    });

    if (type === 'task') {
      await handleDeleteTask(id);
    } else if (type === 'inquiry') {
      await handleDeleteInquiry(id);
    }
  }, [handleDeleteTask, handleDeleteInquiry]);

  // Undo delete handler
  const handleUndoDelete = React.useCallback((id: string) => {
    setPendingDeletes((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        clearTimeout(target.timerId);
        clearInterval(target.intervalId);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Request deletion (opens confirmation modal)
  const requestDeleteTask = React.useCallback(async (taskId: string) => {
    const task = userTasks.find((t) => t.id === taskId);
    setConfirmDeleteItem({
      id: taskId,
      type: 'task',
      title: task?.title || 'Client Servicing Task',
    });
  }, [userTasks]);

  const requestDeleteInquiry = React.useCallback(async (inquiryId: string) => {
    const inquiry = clientInquiries.find((i: any) => i.id === inquiryId);
    setConfirmDeleteItem({
      id: inquiryId,
      type: 'inquiry',
      title: inquiry?.cmgc_name || inquiry?.inquiry_concern || 'Client Inquiry',
    });
  }, [clientInquiries]);

  // Confirm delete from modal
  const handleConfirmDelete = () => {
    if (!confirmDeleteItem) return;
    const { id, type, title } = confirmDeleteItem;

    if (type === 'task' && selectedTaskIdForModal === id) {
      setSelectedTaskIdForModal(null);
    }
    if (type === 'inquiry' && selectedInquiryId === id) {
      setSelectedInquiryId(null);
    }

    setConfirmDeleteItem(null);

    const timerId = setTimeout(() => {
      executePermanentDelete(id, type);
    }, 5000);

    const intervalId = setInterval(() => {
      setPendingDeletes((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return { ...item, secondsLeft: Math.max(0, item.secondsLeft - 1) };
          }
          return item;
        })
      );
    }, 1000);

    setPendingDeletes((prev) => [
      ...prev.filter((p) => p.id !== id),
      {
        id,
        type,
        title,
        secondsLeft: 5,
        timerId,
        intervalId,
      },
    ]);
  };

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      pendingDeletesRef.current.forEach((item) => {
        clearTimeout(item.timerId);
        clearInterval(item.intervalId);
      });
    };
  }, []);

  // Filter out pending deleted items from visible UI lists
  const activePendingIds = useMemo(() => new Set(pendingDeletes.map((p) => p.id)), [pendingDeletes]);

  const displayedUserTasks = useMemo(() => {
    return userTasks.filter((t) => !activePendingIds.has(t.id));
  }, [userTasks, activePendingIds]);

  const displayedClientInquiries = useMemo(() => {
    return clientInquiries.filter((i: any) => !activePendingIds.has(i.id));
  }, [clientInquiries, activePendingIds]);

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

  const selectedTaskForModal = displayedUserTasks.find((t) => t.id === selectedTaskIdForModal) || null;
  const selectedInquiry = (hookSelectedInquiry && !activePendingIds.has(hookSelectedInquiry.id) ? hookSelectedInquiry : null) || displayedClientInquiries.find((i: any) => i.id === selectedInquiryId) || null;

  const sharedLayoutProps = {
    userTasks: displayedUserTasks,
    allProfiles,
    bizDevProfiles,
    clientInquiries: displayedClientInquiries,
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
    onDeleteTask: requestDeleteTask,
    onCreateInquiry: handleCreateInquiry,
    onDeleteInquiry: requestDeleteInquiry,
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
          onDeleteTask={requestDeleteTask}
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
          handleDeleteInquiry={requestDeleteInquiry}
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

      {/* Delete Confirmation Modal for Inquiries & Client Servicing Monitoring */}
      {isMounted && confirmDeleteItem && createPortal(
        <div
          onClick={() => setConfirmDeleteItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 15, 15, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '18px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#EF4444',
              }}
            >
              <AlertTriangle size={28} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181B', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Confirm Delete
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#52525B', margin: '0 0 16px 0', lineHeight: 1.5, fontWeight: 500 }}>
              Are you sure you want to delete this item? This action can be undone within 5 seconds.
            </p>

            {confirmDeleteItem.title && (
              <div
                style={{
                  background: '#F4F4F5',
                  borderRadius: '12px',
                  padding: '9px 14px',
                  marginBottom: '22px',
                  fontSize: '0.82rem',
                  color: '#3F3F46',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {confirmDeleteItem.title}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: '999px',
                  border: '1px solid #E4E4E7',
                  background: '#FFFFFF',
                  color: '#3F3F46',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Undo Delete Modals / Toasts (Bottom-Right) */}
      {isMounted && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '12px',
            pointerEvents: 'none',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <AnimatePresence>
            {pendingDeletes.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.2 } }}
                layout
                style={{
                  pointerEvents: 'auto',
                  width: '380px',
                  maxWidth: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#059669',
                        marginTop: '1px',
                      }}
                    >
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                        Item deleted successfully.
                      </div>
                      {item.title && (
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '3px' }}>
                          {item.title}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleUndoDelete(item.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#F9FAFB',
                        color: '#B45309',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: '1px solid #FDE68A',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF3C7';
                        e.currentTarget.style.borderColor = '#F59E0B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#FDE68A';
                      }}
                    >
                      <RotateCcw size={13} strokeWidth={2.5} />
                      <span>Undo ({item.secondsLeft}s)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => executePermanentDelete(item.id, item.type)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: '#9CA3AF',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F3F4F6';
                        e.currentTarget.style.color = '#4B5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9CA3AF';
                      }}
                      title="Dismiss"
                    >
                      <X size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                {/* 5-second animated countdown bar */}
                <div
                  style={{
                    height: '3px',
                    background: '#F3F4F6',
                    width: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#D97706',
                      width: `${(item.secondsLeft / 5) * 100}%`,
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * Page entry point.
 * Wraps AdminDashboardContent in AdminRouteGuard so the hook and admin data
 * are never loaded for unauthorized users.
 */
export default function DashboardOverviewPage() {
  return (
    <AdminRouteGuard>
      <AdminDashboardContent />
    </AdminRouteGuard>
  );
}