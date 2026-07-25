import React, { useState } from 'react';
import { CheckCircle2, FileText, ChevronDown, ChevronUp, Plus, Calendar, Trash2, X, Briefcase, UserCheck } from 'lucide-react';
import { TaskItem } from './TaskRow';
import StatusBadge from './StatusBadge';
import UserAvatar, { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface TodoTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  user_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ClientServicingToDoProps {
  tasks: TaskItem[]; // Client Servicing tasks
  personalTodos?: TodoTask[]; // Personal todo items
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  onCreatePersonalTodo?: (todo: { title: string; description?: string; due_date?: string }) => void;
  onToggleComplete: (task: TaskItem) => void;
  onTogglePersonalTodoComplete?: (todo: TodoTask) => void;
  onDeletePersonalTodo?: (todoId: string) => void;
  onSelectTask: (taskId: string) => void;
}

export default function ClientServicingToDo({
  tasks,
  personalTodos = [],
  allProfiles,
  bizDevProfiles,
  onCreatePersonalTodo,
  onToggleComplete,
  onTogglePersonalTodoComplete,
  onDeletePersonalTodo,
  onSelectTask
}: ClientServicingToDoProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Active Client Servicing tasks (not done/cancelled)
  const activeClientTasks = tasks.filter(t =>
    !t.completed &&
    t.status !== 'Done' &&
    t.status !== 'Cancelled'
  );

  // Active Personal Todos (not completed)
  const activePersonalTodos = personalTodos.filter(t => !t.completed);

  const dueCount = activeClientTasks.length + activePersonalTodos.length;

  const findProfileById = (id: string | null): UserProfile | null => {
    if (!id) return null;
    return allProfiles.find((p) => p.id === id) || bizDevProfiles.find((p) => p.id === id) || null;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onCreatePersonalTodo) {
      onCreatePersonalTodo({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        due_date: newDueDate || undefined
      });
    }
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setShowAddForm(false);
  };

  return (
    <div className={`${styles.dashboardCard} ${styles.todoWidgetCard}`}>
      {/* Header Row: (✓) To-do ... collapse chevron & plus button */}
      <div className={styles.todoHeaderRow}>
        <div className={styles.todoHeaderTitleGroup}>
          <div className={styles.todoCheckIconBadge}>
            <CheckCircle2 size={18} strokeWidth={2.2} />
          </div>
          <h3 className={styles.todoWidgetTitle}>To-do</h3>
        </div>

        <div className={`${styles.todoHeaderActions} flex items-center gap-1`}>
          <button
            type="button"
            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors flex items-center gap-1 text-[11px] font-bold"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddForm(prev => !prev);
              if (!isExpanded) setIsExpanded(true);
            }}
            title="Add Personal To-Do"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add To-Do</span>
          </button>

          <button
            type="button"
            className={styles.cardHeaderToggleBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse To-do list" : "Expand To-do list"}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Subtitle: 📄 N assignments & reminders due */}
      <div className={styles.todoSubtitleRow}>
        <FileText size={14} className={styles.todoDocIcon} />
        <span className={styles.todoAssignmentsDueText}>
          {dueCount} {dueCount === 1 ? 'item' : 'items'} due ({activeClientTasks.length} servicing, {activePersonalTodos.length} personal)
        </span>
      </div>

      {/* Inline Form to add Personal To-Do */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="m-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-amber-600 dark:text-amber-400">
            <span>New Personal To-Do</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="To-Do title (e.g., Buy Printer Ink)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs outline-none focus:border-amber-500"
            autoFocus
            required
          />
          <input
            type="text"
            placeholder="Description / Notes (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs outline-none focus:border-amber-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border bg-surface text-text text-[11px] outline-none"
            />
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors"
              >
                Save To-Do
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Expanded list of to-do items */}
      {isExpanded && (
        <div className={styles.todoListContainer}>
          {activeClientTasks.length === 0 && activePersonalTodos.length === 0 ? (
            <div className={styles.todoEmptyState}>
              <p>No active assignments or personal reminders due.</p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {/* SECTION 1: CLIENT SERVICING TASKS */}
              <div>
                <div className="flex items-center justify-between px-2 py-1 mb-1.5 border-b border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Briefcase size={12} />
                    <span>Client Servicing Tasks</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">
                    {activeClientTasks.length}
                  </span>
                </div>

                {activeClientTasks.length === 0 ? (
                  <p className="px-2 py-1.5 text-[11px] text-muted-foreground italic">No active client servicing tasks.</p>
                ) : (
                  <div className={styles.todoItemsStack}>
                    {activeClientTasks.slice(0, 6).map((t) => {
                      const assignedProfile = findProfileById(t.assigned_to);

                      return (
                        <div
                          key={`client-task-${t.id}`}
                          className={`${styles.todoItemRow} ${t.completed ? styles.todoItemCompleted : ''} !bg-[#FFF9E5] dark:!bg-[#2E2818] !border-[#F4C542]/40 hover:!border-[#F4C542] transition-colors`}
                          onClick={() => onSelectTask(t.id)}
                        >
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              onToggleComplete(t);
                            }}
                            className={styles.todoCheckboxInput}
                          />

                          <span className={`${styles.todoItemText} !text-[#1A1A1A] dark:!text-[#EAEAEA] !font-bold`}>{t.title || 'Untitled Task'}</span>

                          <div className={styles.todoItemMetaRight}>
                            <StatusBadge status={t.status} size="sm" />
                            {assignedProfile && (
                              <UserAvatar profile={assignedProfile} size={18} showTooltip tooltipPrefix="Assigned" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {activeClientTasks.length > 6 && (
                      <div className={styles.todoViewMoreRow}>
                        <span>+{activeClientTasks.length - 6} more servicing tasks in Monitoring</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: PERSONAL TODOS */}
              <div>
                <div className="flex items-center justify-between px-2 py-1 mb-1.5 border-b border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <UserCheck size={12} />
                    <span>Personal To-Dos</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-bold">
                    {activePersonalTodos.length}
                  </span>
                </div>

                {activePersonalTodos.length === 0 ? (
                  <p className="px-2 py-1.5 text-[11px] text-muted-foreground italic">No personal to-dos. Click + above to add one.</p>
                ) : (
                  <div className={styles.todoItemsStack}>
                    {activePersonalTodos.map((todo) => (
                      <div
                        key={`personal-todo-${todo.id}`}
                        className={`${styles.todoItemRow} group flex items-center justify-between !bg-[#FFF9E5] dark:!bg-[#2E2818] !border-[#F4C542]/40 hover:!border-[#F4C542] transition-colors`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => onTogglePersonalTodoComplete && onTogglePersonalTodoComplete(todo)}
                            className={styles.todoCheckboxInput}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className={`${styles.todoItemText} !text-[#1A1A1A] dark:!text-[#EAEAEA] !font-bold ${todo.completed ? 'line-through opacity-50' : ''}`}>
                              {todo.title}
                            </span>
                            {todo.description && (
                              <span className="text-[10.5px] !text-[#4A4A4A] dark:!text-[#A0A0A0] truncate font-semibold">{todo.description}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {todo.due_date && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4C542]/20 text-[#8a6b10] dark:text-[#F4C542] font-bold border border-[#F4C542]/30 flex items-center gap-1">
                              <Calendar size={10} />
                              {todo.due_date.slice(0, 10)}
                            </span>
                          )}
                          {onDeletePersonalTodo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePersonalTodo(todo.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Delete Personal To-Do"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
