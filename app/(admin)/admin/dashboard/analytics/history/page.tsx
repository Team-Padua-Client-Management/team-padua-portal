'use client';

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { AdminHeader as Header } from '@src/components/layout';
import { AdminSidebar as Sidebar } from '@src/components/layout';
import styles from '@/styles/admin/dashboard/page.module.css';

import { useAdminDashboard } from '@src/features/dashboard/hooks/useAdminDashboard';
import { containerVariants, itemVariants, itemVariantsReduced } from '@src/features/dashboard/constants';
import { normalizeCategory } from '@src/features/dashboard/components/TaskRow';
import TaskModal from '@src/features/dashboard/components/TaskModal';
import { InquiryModal } from '@src/features/dashboard/components/InquiryModal';
import CalendarActivityModal from '@src/features/dashboard/components/CalendarActivityModal';
import ConfirmDeleteModal from '@src/features/dashboard/components/ConfirmDeleteModal';
import type { UserProfile } from '@src/features/dashboard/components/UserAvatar';
import {
  parseTaskMetadata,
  DEFAULT_WORKFLOW_STATUS,
  type WorkflowTaskItem,
} from '@src/features/dashboard/components/TaskList';
import {
  CalendarActivityItem,
  getActivityLifecycleStatus,
} from '@src/features/dashboard/components/CalendarActivityCard';

import {
  LogTabs,
  LogToolbar,
  LogGroupHeader,
  ServicingLogCard,
  CalendarActivityLogCard,
  EmptyLogState,
  LogSkeleton,
  LogTabType,
  getCategoryMeta,
} from '@src/features/dashboard/components/history';

export default function AnalyticsHistoryPage() {
  const {
    userTasks,
    clientInquiries = [],
    calendarLogs = [],
    allProfiles,
    bizDevProfiles,
    currentUserId,
    saveTaskField,
    saveInquiryField,
    handleDeleteTask,
    handleDeleteInquiry,
    handleSaveCalendarActivity,
    handleCompleteCalendarActivity,
    isMounted,
  } = useAdminDashboard();

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  // Filter and search states
  const [activeTab, setActiveTab] = useState<LogTabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');

  // Modal states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null);
  const [editingCalendarActivity, setEditingCalendarActivity] = useState<CalendarActivityItem | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  const workflowTasks = userTasks as WorkflowTaskItem[];

  const profiles: UserProfile[] = useMemo(
    () => [...(allProfiles || []), ...(bizDevProfiles || [])],
    [allProfiles, bizDevProfiles]
  );

  const findProfileById = (id: string | null | undefined): UserProfile | null => {
    if (!id) return null;
    return profiles.find((p) => p.id === id) || null;
  };

  const currentUserProfile = useMemo(
    () => findProfileById(currentUserId),
    [profiles, currentUserId]
  );

  // 1. Servicing Tasks
  const servicingTasks = useMemo(
    () => workflowTasks.filter((t) => normalizeCategory(t.category) !== 'Inquiry'),
    [workflowTasks]
  );

  // 2. Client Inquiries (mapped as workflow items for unified view)
  const mappedInquiries = useMemo<WorkflowTaskItem[]>(() => {
    return (clientInquiries || []).map((inq: any) => ({
      id: `inq-${inq.id}`,
      title: inq.title || inq.client_name || inq.cmgc_name || 'Client Inquiry',
      category: 'Client Inquiry',
      status: inq.status || 'Pending',
      notes: JSON.stringify({
        policy_owner: inq.client_name || inq.cmgc_name || inq.title || 'Client',
        policy_number: inq.inquiry_type || 'General Inquiry',
        date_of_request: inq.created_at,
        workflow_status: inq.status || 'Pending',
        timeline: inq.inquiry_concern || inq.notes || inq.details || inq.description || 'No additional inquiry details logged.',
      }),
      created_at: inq.created_at || new Date().toISOString(),
      updated_at: inq.updated_at || new Date().toISOString(),
      assigned_to: inq.assigned_to || null,
      processed_by: inq.processed_by || null,
      completed: inq.status === 'Addressed' || inq.status === 'Done' || inq.status === 'Resolved',
    }));
  }, [clientInquiries]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: servicingTasks.length + mappedInquiries.length + calendarLogs.length,
      servicing: servicingTasks.length,
      inquiries: mappedInquiries.length,
      calendar: calendarLogs.length,
    };
  }, [servicingTasks, mappedInquiries, calendarLogs]);

  // Filtered Servicing Tasks
  const filteredServicingTasks = useMemo(() => {
    return servicingTasks.filter((task) => {
      const meta = parseTaskMetadata(task.notes || '');
      const status = meta.workflow_status || task.status || DEFAULT_WORKFLOW_STATUS;
      const haystack = `${task.title || ''} ${meta.policy_owner || ''} ${meta.policy_number || ''} ${meta.policy_insured || ''} ${task.category || ''} ${meta.timeline || ''}`.toLowerCase();

      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
      const matchesStatus =
        filterStatus === 'All' ||
        status.toLowerCase() === filterStatus.toLowerCase() ||
        (filterStatus === 'Approved' && (status.toLowerCase().includes('approv') || status.toLowerCase().includes('done'))) ||
        (filterStatus === 'Submitted' && status.toLowerCase().includes('submit')) ||
        (filterStatus === 'Pending' && status.toLowerCase().includes('pending'));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [servicingTasks, searchTerm, filterCategory, filterStatus]);

  // Filtered Inquiries
  const filteredInquiries = useMemo(() => {
    return mappedInquiries.filter((task) => {
      const meta = parseTaskMetadata(task.notes || '');
      const status = meta.workflow_status || task.status || 'Pending';
      const haystack = `${task.title || ''} ${meta.policy_owner || ''} ${meta.policy_number || ''} ${meta.timeline || ''}`.toLowerCase();

      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || filterCategory === 'Client Inquiry';
      const matchesStatus =
        filterStatus === 'All' ||
        status.toLowerCase() === filterStatus.toLowerCase() ||
        (filterStatus === 'Approved' && (status.toLowerCase().includes('addressed') || status.toLowerCase().includes('done') || status.toLowerCase().includes('resolv'))) ||
        (filterStatus === 'Pending' && status.toLowerCase().includes('pending'));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [mappedInquiries, searchTerm, filterCategory, filterStatus]);

  // Filtered Calendar Activities
  const filteredCalendarActivities = useMemo(() => {
    return calendarLogs.filter((activity) => {
      const lifecycleStatus = getActivityLifecycleStatus(activity);
      const haystack = `${activity.title || ''} ${activity.category || ''} ${activity.location || ''} ${activity.assignedRole || ''} ${activity.notes || ''} ${activity.venue_name || ''} ${activity.onlinePlatform || ''}`.toLowerCase();

      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || activity.category === filterCategory;
      const matchesRole = filterRole === 'All' || activity.assignedRole === filterRole;
      const matchesStatus =
        filterStatus === 'All' ||
        lifecycleStatus.toLowerCase() === filterStatus.toLowerCase() ||
        (filterStatus === 'Approved' && lifecycleStatus === 'Completed') ||
        (filterStatus === 'Upcoming' && lifecycleStatus === 'Upcoming') ||
        (filterStatus === 'Overdue' && lifecycleStatus === 'Overdue');

      return matchesSearch && matchesCategory && matchesRole && matchesStatus;
    });
  }, [calendarLogs, searchTerm, filterCategory, filterRole, filterStatus]);

  // Available categories based on active tab
  const availableCategories = useMemo(() => {
    let rawList: string[] = [];
    if (activeTab === 'servicing') {
      rawList = servicingTasks.map((t) => t.category).filter(Boolean) as string[];
    } else if (activeTab === 'inquiries') {
      rawList = ['Client Inquiry'];
    } else if (activeTab === 'calendar') {
      rawList = calendarLogs.map((a) => a.category).filter(Boolean) as string[];
    } else {
      rawList = [
        ...servicingTasks.map((t) => t.category),
        'Client Inquiry',
        ...calendarLogs.map((a) => a.category),
      ].filter(Boolean) as string[];
    }

    const unique = Array.from(new Set(rawList)).sort((a, b) => {
      const metaA = getCategoryMeta(a).title;
      const metaB = getCategoryMeta(b).title;
      return metaA.localeCompare(metaB);
    });

    return ['All', ...unique];
  }, [activeTab, servicingTasks, calendarLogs]);

  // Available status options based on active tab
  const availableStatuses = useMemo(() => {
    if (activeTab === 'servicing') {
      return ['All', 'Approved Requests', 'Submitted Requests', 'Pending Requirements', 'Pending for Submission', 'Pending'];
    }
    if (activeTab === 'inquiries') {
      return ['All', 'Pending', 'Pending Response', 'Addressed Concerns', 'Resolved'];
    }
    if (activeTab === 'calendar') {
      return ['All', 'Upcoming', 'Today', 'Overdue', 'Completed', 'Cancelled'];
    }
    return ['All', 'Approved', 'Submitted', 'Pending', 'Upcoming', 'Overdue', 'Completed'];
  }, [activeTab]);

  // Total filtered count
  const totalFilteredCount = useMemo(() => {
    if (activeTab === 'servicing') return filteredServicingTasks.length;
    if (activeTab === 'inquiries') return filteredInquiries.length;
    if (activeTab === 'calendar') return filteredCalendarActivities.length;
    return filteredServicingTasks.length + filteredInquiries.length + filteredCalendarActivities.length;
  }, [activeTab, filteredServicingTasks, filteredInquiries, filteredCalendarActivities]);

  // Grouped logs for rendering
  type GroupedLogItem =
    | { type: 'servicing'; data: WorkflowTaskItem }
    | { type: 'inquiry'; data: WorkflowTaskItem }
    | { type: 'calendar'; data: CalendarActivityItem };

  const groupedLogs = useMemo(() => {
    const groupsMap = new Map<string, GroupedLogItem[]>();

    const addToGroup = (category: string, item: GroupedLogItem) => {
      const catKey = category || 'Others';
      if (!groupsMap.has(catKey)) {
        groupsMap.set(catKey, []);
      }
      groupsMap.get(catKey)!.push(item);
    };

    if (activeTab === 'servicing' || activeTab === 'all') {
      for (const task of filteredServicingTasks) {
        addToGroup(task.category || 'Others', { type: 'servicing', data: task });
      }
    }

    if (activeTab === 'inquiries' || activeTab === 'all') {
      for (const inq of filteredInquiries) {
        addToGroup('Client Inquiry', { type: 'inquiry', data: inq });
      }
    }

    if (activeTab === 'calendar' || activeTab === 'all') {
      for (const act of filteredCalendarActivities) {
        addToGroup(act.category || 'Others', { type: 'calendar', data: act });
      }
    }

    // Convert map to sorted group array
    const sortedCategories = Array.from(groupsMap.keys()).sort((a, b) => {
      const metaA = getCategoryMeta(a).title;
      const metaB = getCategoryMeta(b).title;
      return metaA.localeCompare(metaB);
    });

    return sortedCategories.map((cat) => {
      const items = groupsMap.get(cat)!;
      items.sort((a, b) => {
        const dateA = a.type === 'calendar' ? a.data.date || a.data.createdAt : a.data.created_at;
        const dateB = b.type === 'calendar' ? b.data.date || b.data.createdAt : b.data.created_at;
        return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
      });

      return {
        category: cat,
        meta: getCategoryMeta(cat),
        items,
      };
    });
  }, [activeTab, filteredServicingTasks, filteredInquiries, filteredCalendarActivities]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterRole('All');
  };

  const handleTabChange = (tab: LogTabType) => {
    setActiveTab(tab);
    setFilterCategory('All');
    setFilterStatus('All');
  };

  // Find item for editing modals
  const editingTask = workflowTasks.find((t) => t.id === editingTaskId) || null;
  const editingInquiryRaw = useMemo(() => {
    if (!editingInquiryId) return null;
    const rawId = editingInquiryId.startsWith('inq-') ? editingInquiryId.slice(4) : editingInquiryId;
    return clientInquiries.find((i: any) => i.id === rawId || i.id === editingInquiryId) || null;
  }, [editingInquiryId, clientInquiries]);

  return (
    <div className={`${styles.shell} bg-[#FAF8F5] dark:bg-background`}>
      <Sidebar />
      <div className={styles.mainCol}>
        <Header />
        <motion.main className={styles.content} variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={fadeVariants} className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto w-full">

            {/* 1. PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 pb-1">
              <div className="flex items-center gap-3.5">
                {/* Breadcrumb-style "Dashboard" Button */}
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-surface border border-slate-200/90 dark:border-border/80 shadow-2xs hover:bg-slate-50 dark:hover:bg-surface-2 transition-all cursor-pointer select-none"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} />
                  <span>Dashboard</span>
                </Link>

                {/* Circular Gold Icon Badge & Titles */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8A33D] text-white flex items-center justify-center shadow-md shadow-[#E8A33D]/25 shrink-0">
                    <History size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight m-0 leading-tight">
                      Request & Activity Logs
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0 mt-0.5">
                      Audit history of servicing tasks, client inquiries, and team activities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TABS in Lavender/Gray Container */}
            <LogTabs
              activeTab={activeTab}
              onChangeTab={handleTabChange}
              counts={tabCounts}
            />

            {/* 3. TOOLBAR in Single Unified White Container Card */}
            <LogToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={filterCategory}
              onCategoryChange={setFilterCategory}
              categories={availableCategories}
              selectedStatus={filterStatus}
              onStatusChange={setFilterStatus}
              statuses={availableStatuses}
              selectedRole={filterRole}
              onRoleChange={setFilterRole}
              activeTab={activeTab}
              totalFilteredCount={totalFilteredCount}
              onResetFilters={handleResetFilters}
            />

            {/* 4-7. LOG GROUPS AND CARDS */}
            <div className="flex flex-col gap-6 pt-1 pb-16">
              {!isMounted ? (
                <LogSkeleton count={4} />
              ) : groupedLogs.length === 0 ? (
                <EmptyLogState
                  hasFilters={
                    searchTerm.trim().length > 0 ||
                    filterCategory !== 'All' ||
                    filterStatus !== 'All' ||
                    filterRole !== 'All'
                  }
                  onResetFilters={handleResetFilters}
                  tabLabel={
                    activeTab === 'servicing'
                      ? 'Servicing Requests'
                      : activeTab === 'inquiries'
                      ? 'Client Inquiries'
                      : activeTab === 'calendar'
                      ? 'Calendar of Activities'
                      : 'Logs'
                  }
                />
              ) : (
                groupedLogs.map((group) => (
                  <section key={group.category} className="flex flex-col gap-3.5">
                    {/* 4. Group Header */}
                    <LogGroupHeader
                      meta={group.meta}
                      count={group.items.length}
                      unitLabel={
                        group.meta.badge === 'INQ'
                          ? 'inquiry'
                          : group.items[0]?.type === 'calendar'
                          ? 'activity'
                          : 'request'
                      }
                    />

                    {/* 5 & 7. Group Cards */}
                    <div className="flex flex-col gap-3">
                      {group.items.map((item, idx) => {
                        if (item.type === 'calendar') {
                          let matchingProfiles = [] as typeof allProfiles;
                          if (item.data.assignedRole === 'Bizdev') {
                            matchingProfiles = bizDevProfiles;
                          } else {
                            matchingProfiles = allProfiles.filter((p) =>
                              p.role?.toLowerCase().includes(item.data.assignedRole.toLowerCase())
                            );
                          }

                          return (
                            <CalendarActivityLogCard
                              key={item.data.id ? `${item.data.id}-${idx}` : `cal-${idx}`}
                              activity={item.data}
                              matchingProfiles={matchingProfiles}
                              onEdit={(act) => setEditingCalendarActivity(act)}
                              onDelete={(id) => setActivityToDelete(id)}
                              onComplete={handleCompleteCalendarActivity}
                            />
                          );
                        }

                        if (item.type === 'inquiry') {
                          return (
                            <ServicingLogCard
                              key={item.data.id}
                              task={item.data}
                              allProfiles={profiles}
                              onEdit={(id) => setEditingInquiryId(id)}
                              canEdit={true}
                            />
                          );
                        }

                        return (
                          <ServicingLogCard
                            key={item.data.id}
                            task={item.data}
                            allProfiles={profiles}
                            onEdit={(id) => setEditingTaskId(id)}
                            canEdit={true}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

          </motion.div>
        </motion.main>
      </div>

      {/* Servicing Task Edit Modal */}
      {isMounted && editingTask && createPortal(
        <TaskModal
          task={editingTask}
          allProfiles={allProfiles}
          bizDevProfiles={bizDevProfiles}
          currentUserProfile={currentUserProfile}
          onSaveField={saveTaskField}
          onDeleteTask={(taskId) => {
            handleDeleteTask(taskId);
            setEditingTaskId(null);
          }}
          onClose={() => setEditingTaskId(null)}
        />,
        document.body
      )}

      {/* Client Inquiry Edit Modal */}
      {isMounted && editingInquiryRaw && createPortal(
        <InquiryModal
          isOpen={true}
          inquiry={editingInquiryRaw}
          allProfiles={allProfiles}
          currentUserProfile={currentUserProfile}
          saveInquiryField={saveInquiryField}
          handleDeleteInquiry={async (id) => {
            await handleDeleteInquiry(id);
            setEditingInquiryId(null);
          }}
          onClose={() => setEditingInquiryId(null)}
        />,
        document.body
      )}

      {/* Calendar Activity Edit Modal */}
      {isMounted && editingCalendarActivity && createPortal(
        <CalendarActivityModal
          initialActivity={editingCalendarActivity}
          onSave={(activityData, existingId) => {
            handleSaveCalendarActivity(activityData, existingId || editingCalendarActivity.id);
            setEditingCalendarActivity(null);
          }}
          onClose={() => setEditingCalendarActivity(null)}
        />,
        document.body
      )}

      {/* Confirm Delete Activity Modal */}
      {isMounted && activityToDelete && createPortal(
        <ConfirmDeleteModal
          onConfirm={async () => {
            if (activityToDelete) {
              const id = activityToDelete;
              setActivityToDelete(null);
              await handleDeleteTask(id);
            }
          }}
          onCancel={() => setActivityToDelete(null)}
        />,
        document.body
      )}
    </div>
  );
}