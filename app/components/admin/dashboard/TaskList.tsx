import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, X, User } from 'lucide-react';
import TaskRow, { TaskItem } from './TaskRow';
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

const CATEGORY_OPTIONS = ['All', 'ACR', 'BCR', 'FSR', 'PPU', 'CPC', 'UID', 'PLT', 'CPST', 'Others'];
const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Acknowledged', 'On Hold', 'Done', 'Cancelled'];
const PRIORITY_OPTIONS = ['All', 'Normal', 'High', 'Urgent'];

export default function TaskList({
  tasks,
  allProfiles,
  bizDevProfiles,
  onCreateTask,
  onToggleComplete,
  onSelectTask,
  isUserView = false
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const assigned = findProfileById(task.assigned_to);
      const processed = findProfileById(task.processed_by);
      const assignedName = (assigned?.full_name || assigned?.email || '').toLowerCase();
      const processedName = (processed?.full_name || processed?.email || '').toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        (task.notes && task.notes.toLowerCase().includes(q)) ||
        (task.category && task.category.toLowerCase().includes(q)) ||
        assignedName.includes(q) ||
        processedName.includes(q);

      const matchesStatus =
        selectedStatus === 'All' ||
        task.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesCategory =
        selectedCategory === 'All' ||
        (task.category && task.category.toLowerCase() === selectedCategory.toLowerCase());

      const taskPriority = task.priority || (task.status === 'Done' ? 'Normal' : 'High');
      const matchesPriority =
        selectedPriority === 'All' ||
        taskPriority.toLowerCase() === selectedPriority.toLowerCase();

      const matchesAssignee =
        selectedAssignee === 'All' ||
        task.assigned_to === selectedAssignee;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, selectedStatus, selectedCategory, selectedPriority, selectedAssignee, allProfiles, bizDevProfiles]);

  const blankRowsCount = Math.max(0, 5 - filteredTasks.length);

  return (
    <div className={styles.monitoringCard}>
      {/* Header */}
      <div className={styles.dashboardCardHeader}>
        <div className={styles.dashboardCardTitle}>
          <Search size={14} strokeWidth={1.8} />
          <h3>Client Servicing Monitoring</h3>
          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        {!isUserView && (
          <button type="button" onClick={onCreateTask} className={styles.newTaskBtn}>
            <Plus size={13} strokeWidth={2} />
            New Task
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-border/40 space-y-2 bg-muted/10">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, category, notes, person..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <Filter size={11} className="text-muted-foreground mr-1 shrink-0" />
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                selectedStatus === st
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Category, Priority & Assignee Selectors */}
        <div className="flex items-center gap-2 pt-1 text-[11px]">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 bg-background border border-border rounded-md text-foreground text-[11px] focus:outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2 py-1 bg-background border border-border rounded-md text-foreground text-[11px] focus:outline-none"
          >
            <option value="All">All Priorities</option>
            {PRIORITY_OPTIONS.filter(p => p !== 'All').map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {!isUserView && allProfiles.length > 0 && (
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2 py-1 bg-background border border-border rounded-md text-foreground text-[11px] focus:outline-none max-w-[140px] truncate"
            >
              <option value="All">All Assignees</option>
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
              ))}
            </select>
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
