import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Filter, ChevronDown, Check } from 'lucide-react';
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
  onSaveTaskField?: (taskId: string, updates: Partial<TaskItem>) => void;
  isUserView?: boolean;
}

const CATEGORY_OPTIONS = ['All', ...TASK_CATEGORIES];
const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Done'];

interface FilterOption {
  label: string;
  value: string;
}

function RoundedFilterSelect({
  value,
  options,
  onChange,
  placeholder,
  className = ''
}: {
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-surface/90 hover:bg-surface border border-border/80 hover:border-amber-500/60 rounded-xl text-text text-[11.5px] font-semibold transition-all cursor-pointer shadow-xs"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <ChevronDown size={13} className={`text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[180px] z-50 bg-surface/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto space-y-0.5 [scrollbar-width:thin]">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11.5px] font-medium transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-text-secondary hover:text-text hover:bg-surface-2/80'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={13} className="text-amber-500 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskList({
  tasks,
  allProfiles,
  bizDevProfiles,
  onCreateTask,
  onToggleComplete,
  onSelectTask,
  onSaveTaskField,
  isUserView = false
}: TaskListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');

  const categoryOptions = useMemo(() => {
    return CATEGORY_OPTIONS.map((c) => ({
      label: c === 'All' ? 'All Categories' : c,
      value: c
    }));
  }, []);

  const assigneeOptions = useMemo(() => {
    return [
      { label: 'All Assignees', value: 'All' },
      ...allProfiles.map((p) => ({
        label: p.full_name || p.email || 'Unknown User',
        value: p.id
      }))
    ];
  }, [allProfiles]);

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
      <div className="p-3.5 border-b border-border/40 space-y-2.5 bg-surface-2/40 backdrop-blur-md rounded-t-2xl">
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
          <RoundedFilterSelect
            value={selectedCategory}
            options={categoryOptions}
            onChange={(val) => setSelectedCategory(val)}
            placeholder="All Categories"
            className="flex-1 min-w-[140px]"
          />

          {!isUserView && allProfiles.length > 0 && (
            <RoundedFilterSelect
              value={selectedAssignee}
              options={assigneeOptions}
              onChange={(val) => setSelectedAssignee(val)}
              placeholder="All Assignees"
              className="min-w-[130px] max-w-[160px]"
            />
          )}

          {(selectedStatus !== 'All' || selectedCategory !== 'All' || selectedAssignee !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('All');
                setSelectedCategory('All');
                setSelectedAssignee('All');
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition-all shrink-0 cursor-pointer ml-auto"
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
                onSaveTaskField={onSaveTaskField}
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

