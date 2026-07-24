import React, { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import TaskRow, { TaskItem, TASK_CATEGORIES, normalizeCategory } from './TaskRow';
import { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

interface TaskListProps {
  tasks: TaskItem[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onCreateTask: () => void;
  onToggleComplete: (task: TaskItem) => void;
  onSelectTask: (taskId: string) => void;
  isUserView?: boolean;
}

const CATEGORY_OPTIONS = ['All', ...TASK_CATEGORIES];
const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Done'];

export default function TaskList({
  tasks,
  allProfiles,
  bizDevProfiles,
  onCreateTask,
  onToggleComplete,
  onSelectTask,
  isUserView = false
}: TaskListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        selectedStatus === 'All' ||
        task.status.toLowerCase() === selectedStatus.toLowerCase();

      const normalizedCat = normalizeCategory(task.category);
      const matchesCategory =
        selectedCategory === 'All' ||
        normalizedCat.toLowerCase() === selectedCategory.toLowerCase() ||
        (task.category && task.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesAssignee =
        selectedAssignee === 'All' ||
        task.assigned_to === selectedAssignee;

      return matchesStatus && matchesCategory && matchesAssignee;
    });
  }, [tasks, selectedStatus, selectedCategory, selectedAssignee, allProfiles, bizDevProfiles]);

  const blankRowsCount = Math.max(0, 5 - filteredTasks.length);

  return (
    <div className={styles.monitoringCard}>
      {/* Header */}
      <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
        <div className="flex items-center gap-2">
          <Filter size={20} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
            Client Servicing Monitoring
          </h1>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[14px] px-3.5 py-1 rounded-full bg-slate-200 text-slate-900 font-bold dark:bg-slate-800 dark:text-slate-100 shadow-sm">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {!isUserView && (
            <button type="button" onClick={onCreateTask} className={`${styles.newTaskBtn} !py-1.5 !px-4 !text-[13px]`}>
              <Plus size={15} strokeWidth={2.5} />
              <span className="font-bold">New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 border-b border-border/40 space-y-2.5 bg-surface-2/40 backdrop-blur-md rounded-t-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-2/80 text-text-tertiary text-[11px] font-semibold shrink-0 border border-border/50">
            <Filter size={11} className="text-amber-500" strokeWidth={2.2} />
          </div>
          {STATUS_OPTIONS.map((st) => {
            const isActive = selectedStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-all shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                    : 'bg-surface/80 text-text-secondary border-border/70 hover:border-amber-500/50 hover:text-text hover:bg-surface'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Category & Assignee Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11.5px]">
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-2.5 pr-7 py-1.5 bg-surface/90 border border-border/80 rounded-lg text-text text-[11.5px] font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {!isUserView && allProfiles.length > 0 && (
            <div className="relative min-w-[130px] max-w-[160px]">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full pl-2.5 pr-7 py-1.5 bg-surface/90 border border-border/80 rounded-lg text-text text-[11.5px] font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer truncate"
              >
                <option value="All">All Assignees</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          )}

          {(selectedStatus !== 'All' || selectedCategory !== 'All' || selectedAssignee !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('All');
                setSelectedCategory('All');
                setSelectedAssignee('All');
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition-all shrink-0 cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className={styles.dashboardCardBody}>
        <div className={styles.taskWidgetList} style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No tasks found matching your filter criteria.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                assignedProfile={findProfileById(task.assigned_to)}
                processedProfile={findProfileById(task.processed_by)}
                onToggleComplete={onToggleComplete}
                onSelectTask={onSelectTask}
              />
            ))
          )}

          {/* Blank ruled rows for aesthetic enterprise layout structure */}
          {Array.from({ length: blankRowsCount }).map((_, idx) => (
            <div
              key={`blank-row-${idx}`}
              className={styles.blankRuledRow}
              onClick={!isUserView ? onCreateTask : undefined}
              title={!isUserView ? "Click to add task" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
