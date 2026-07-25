import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@src/lib/supabase/client';
import { TaskItem } from '@src/features/dashboard/components/TaskRow';
import { TodoTask } from '@src/features/dashboard/components/ClientServicingToDo';
import { ActivityEvent } from '@src/features/dashboard/components/ActivityCard';
import { CalendarActivityItem } from '@src/features/dashboard/components/CalendarActivityCard';
import { BirthdayItem } from '@src/features/dashboard/components/BirthdayCard';
import { UserProfile } from '@src/features/dashboard/components/UserAvatar';
import { initialActivities, emptyActivityForm } from '@src/features/dashboard/constants';
import {
  mapDbTaskToCalendarActivity,
  mapDbTaskToUiTask,
  getBirthdaysAroundNow,
  formatUiTaskToDbUpdates
} from '@src/features/dashboard/utils/dashboardUtils';
import createNotification from '@src/lib/notifications/createNotification';

export type KpiData = {
  members: number;
  cpst: number;
  acr: number;
  cpc: number;
  fst: number;
  mngt: number;
  ppu: number;
  attendance: number;
  announcements: number;
  designs: number;
  faqs: number;
};

export const useAdminDashboard = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('Administrator');
  const [customPortals, setCustomPortals] = useState<any[]>([]);
  const [clientBirthdays, setClientBirthdays] = useState<BirthdayItem[]>([]);

  const [userTasks, setUserTasks] = useState<TaskItem[]>([]);
  const [personalTodos, setPersonalTodos] = useState<TodoTask[]>([]);

  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [bizDevProfiles, setBizDevProfiles] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedTaskIdForModal, setSelectedTaskIdForModal] = useState<string | null>(null);

  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivities);

  const [calendarLogs, setCalendarLogs] = useState<CalendarActivityItem[]>([]);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarRoleFilter, setCalendarRoleFilter] = useState<'All' | 'Admin' | 'Advisor' | 'Bizdev'>('All');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(new Date());
  const [selectedMiniDate, setSelectedMiniDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [activityForm, setActivityForm] = useState<Omit<ActivityEvent, 'id'>>(emptyActivityForm);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [kpis, setKpis] = useState<KpiData>({
    members: 0, cpst: 0, acr: 0, cpc: 0, fst: 0, mngt: 0,
    ppu: 0, attendance: 0, announcements: 0, designs: 0, faqs: 0
  });

  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_external_portals');
      if (stored) setCustomPortals(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadProfiles = async (): Promise<UserProfile[]> => {
    try {
      const { data: allData, error: allErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .order('full_name');

      let currentAll: UserProfile[] = [];
      if (!allErr && allData) {
        const cleanProfiles = allData.filter(p =>
          p.email?.toLowerCase() !== 'admin@teampadua.com' &&
          p.full_name !== 'User' &&
          !(p.full_name?.toLowerCase() === 'user' && (p.role === 'Admin' || p.role === 'ADMIN'))
        );
        setAllProfiles(cleanProfiles);
        currentAll = cleanProfiles;
      }

      const { data: bizData, error: bizErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .eq('role', 'Bizdev')
        .order('full_name');

      if (!bizErr && bizData && bizData.length > 0) {
        setBizDevProfiles(bizData);
      } else {
        const { data: fbData, error: fbErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, role')
          .or('role.eq.Bizdev,role.eq.BizDev,role.ilike.bizdev')
          .order('full_name');

        if (!fbErr && fbData) {
          setBizDevProfiles(fbData);
        }
      }
      return currentAll;
    } catch (err) {
      console.error('Exception loading profiles:', err);
      return [];
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const loadedProfiles = await loadProfiles();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator');
        setAdminId(user.id);
        setCurrentUserId(user.id);
        currentUserIdRef.current = user.id;

        const userEmailLower = (user.email || '').toLowerCase();
        const userProfileIds = new Set<string>();
        userProfileIds.add(user.id);

        loadedProfiles.forEach(p => {
          if (p.id === user.id || (userEmailLower && p.email?.toLowerCase() === userEmailLower)) {
            userProfileIds.add(p.id);
          }
        });

        const { data: userProfileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const userRole = (userProfileData?.role || '').toLowerCase();
        const isAdmin = userRole === 'admin';

        const dbTasks: TaskItem[] = [];
        const dbCalendarLogs: CalendarActivityItem[] = [];

        const resCS = await supabase
          .from('client_servicing_tasks')
          .select('*')
          .order('updated_at', { ascending: false });

        if (resCS.data) {
          for (const t of resCS.data) {
            let isCal = false;
            try {
              // Calendar activities store their JSON in `notes` now
              const rawJson = t.notes && t.notes.trim().startsWith('{') ? t.notes : t.description;
              if (rawJson && rawJson.trim().startsWith('{')) {
                const parsed = JSON.parse(rawJson);
                if (parsed.isCalendarActivity) {
                  isCal = true;
                }
              }
            } catch (e) {}

            if (isCal) {
              dbCalendarLogs.push(mapDbTaskToCalendarActivity(t, 'client_servicing_tasks'));
            } else {
              dbTasks.push(mapDbTaskToUiTask(t, 'client_servicing_tasks'));
            }
          }
        }

        const filteredTasks = dbTasks.filter(t => {
          if (isAdmin) return true;
          if (t.assigned_to) {
            return userProfileIds.has(t.assigned_to);
          }
          return false;
        });

        setUserTasks(filteredTasks);

        setCalendarLogs(dbCalendarLogs);

        try {
          const { data: todoData, error: todoErr } = await supabase
            .from('todo_tasks')
            .select('*')
            .eq('completed', false)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!todoErr && todoData) {
            setPersonalTodos(todoData as TodoTask[]);
            localStorage.setItem('tp_personal_todos', JSON.stringify(todoData));
          } else {
            const cachedTodos = localStorage.getItem('tp_personal_todos');
            if (cachedTodos) setPersonalTodos(JSON.parse(cachedTodos));
          }
        } catch (e) {
          console.error('Error fetching personal todo_tasks:', e);
          const cachedTodos = localStorage.getItem('tp_personal_todos');
          if (cachedTodos) setPersonalTodos(JSON.parse(cachedTodos));
        }

        try {
          const { data: calData, error: calErr } = await supabase
            .from('calendar_events')
            .select('*')
            .order('created_at', { ascending: false });

          if (!calErr && calData && calData.length > 0) {
            const dbActivities: ActivityEvent[] = calData.map((evt: any) => ({
              id: evt.id,
              title: evt.title || 'Untitled Event',
              type: (evt.description && evt.description.split('\n')[0]) || 'Client Meeting',
              location: evt.location_name || '',
              date: evt.event_date || new Date().toISOString().split('T')[0],
              time: evt.start_time || '',
              notes: evt.description || '',
              status: 'Scheduled'
            }));

            const combinedActivities = [...dbActivities, ...initialActivities];
            const uniqueActivities = Array.from(new Map(combinedActivities.map(item => [item.id, item])).values());
            setActivities(uniqueActivities);
            localStorage.setItem('tp_user_activities', JSON.stringify(uniqueActivities));
          }
        } catch (e) {
          console.error('Error fetching calendar_events:', e);
        }
      }

      const { data: cpstClientsData } = await supabase.from('cpst_clients').select('id, client_name, birthdate');
      if (cpstClientsData && Array.isArray(cpstClientsData)) {
        const matched = getBirthdaysAroundNow(cpstClientsData);
        setClientBirthdays(matched);
      }

      const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: cpstCount } = await supabase.from('cpst_clients').select('*', { count: 'exact', head: true });
      const { count: acrCount } = await supabase.from('acr_clients').select('*', { count: 'exact', head: true });
      const { count: cpcCount } = await supabase.from('cpc_clients').select('*', { count: 'exact', head: true });
      const { count: fstCount } = await supabase.from('fst_clients').select('*', { count: 'exact', head: true });
      const { count: mngtCount } = await supabase.from('mngt_clients').select('*', { count: 'exact', head: true });
      const { count: ppuCount } = await supabase.from('ppu_clients').select('*', { count: 'exact', head: true });
      const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
      const { count: announcementsCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
      const { count: designsCount } = await supabase.from('design_templates').select('*', { count: 'exact', head: true });
      const { count: faqsCount } = await supabase.from('faqs').select('*', { count: 'exact', head: true });

      setKpis({
        members: membersCount || 0,
        cpst: cpstCount || 0,
        acr: acrCount || 0,
        cpc: cpcCount || 0,
        fst: fstCount || 0,
        mngt: mngtCount || 0,
        ppu: ppuCount || 0,
        attendance: attendanceCount || 0,
        announcements: announcementsCount || 0,
        designs: designsCount || 0,
        faqs: faqsCount || 0
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    console.log('Current userTasks:', userTasks);
  }, [userTasks]);

  const savePersonalTodosToCache = (todosList: TodoTask[]) => {
    try {
      localStorage.setItem('tp_personal_todos', JSON.stringify(todosList));
    } catch (err) {
      console.error('Failed to cache personal todos:', err);
    }
  };

  const saveTaskField = async (taskId: string, updates: Partial<TaskItem>) => {
    const currentTask = userTasks.find(t => t.id === taskId);

    setUserTasks(prev => {
      return prev.map(t => {
        if (t.id === taskId) {
          return { ...t, ...updates, updated_at: new Date().toISOString() };
        }
        return t;
      });
    });

    try {
      const dbUpdates = formatUiTaskToDbUpdates(updates, currentTask);
      dbUpdates.updated_at = new Date().toISOString();

      const res = await supabase.from('client_servicing_tasks').update(dbUpdates).eq('id', taskId);
      if (res.error) console.error('Error updating task in client_servicing_tasks:', res.error);
      else console.log('Updated Task:', res.data);
    } catch (err) {
      console.error('Error auto-saving task:', err);
    }
  };

  const handleToggleCheckbox = async (taskOrId: TaskItem | string) => {
    const task = typeof taskOrId === 'string' ? userTasks.find(t => t.id === taskOrId) : taskOrId;
    if (!task) return;
    const newCompleted = !task.completed;
    const newStatus = newCompleted ? 'Done' : (task.status === 'Done' ? 'Pending' : task.status);
    await saveTaskField(task.id, { completed: newCompleted, status: newStatus });
  };

  const handleCreateTask = async () => {
    let activeUserId = currentUserIdRef.current || currentUserId;
    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id || null;
    }
    if (!activeUserId) return;

    const newDbTask = {
      user_id: activeUserId,
      title: 'Untitled Task',
      notes: '',
      category: 'Others',
      status: 'Pending',
      assigned_to: activeUserId,
      processed_by: activeUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      let createdTask: TaskItem | null = null;
      const res1 = await supabase.from('client_servicing_tasks').insert([newDbTask]).select().single();
      
      if (res1.error) {
        console.error('Error inserting into client_servicing_tasks:', res1.error);
      } else if (res1.data) {
        console.log('Created Task:', res1.data);
        createdTask = mapDbTaskToUiTask(res1.data, 'client_servicing_tasks');
      }

      if (createdTask) {
        setUserTasks(prev => {
          return [createdTask!, ...prev.filter(t => t.id !== createdTask!.id)];
        });
        setSelectedTaskIdForModal(createdTask.id);
        createNotification({
          title: 'New Task Created',
          description: `Task "${createdTask.title}" has been created.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Error creating new task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setUserTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const resCS = await supabase.from('client_servicing_tasks').delete().eq('id', taskId);
      if (resCS.error) console.error('Error deleting from client_servicing_tasks:', resCS.error);
      else console.log('Deleted Task:', taskId);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleCreatePersonalTodo = async (todo: { title: string; description?: string; due_date?: string }) => {
    try {
      const activeUserId = currentUserIdRef.current || currentUserId || adminId;
      if (!activeUserId) return;

      const newTodo = {
        title: todo.title,
        description: todo.description || null,
        user_id: activeUserId,
        created_by: activeUserId,
        completed: false,
        due_date: todo.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('todo_tasks')
        .insert([newTodo])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setPersonalTodos(prev => {
          const newList = [data[0] as TodoTask, ...prev];
          savePersonalTodosToCache(newList);
          return newList;
        });
      } else {
        // Fallback optimistic UI update in case the DB doesn't return the row due to select policies
        const optimisticTodo: TodoTask = {
          id: `todo-${Date.now()}`,
          ...newTodo,
          description: newTodo.description || undefined,
          due_date: newTodo.due_date || undefined
        };
        setPersonalTodos(prev => {
          const newList = [optimisticTodo, ...prev];
          savePersonalTodosToCache(newList);
          return newList;
        });
      }
    } catch (err: any) {
      console.error('Failed to create personal todo:', err?.message || JSON.stringify(err));
    }
  };

  const handleTogglePersonalTodoComplete = async (todo: TodoTask) => {
    try {
      // Optimistically remove from local state since we only show uncompleted
      setPersonalTodos(prev => {
        const newList = prev.filter(t => t.id !== todo.id);
        savePersonalTodosToCache(newList);
        return newList;
      });

      await supabase
        .from('todo_tasks')
        .update({ completed: true })
        .eq('id', todo.id);
    } catch (err) {
      console.error('Failed to toggle personal todo:', err);
    }
  };

  const handleDeletePersonalTodo = async (todoId: string) => {
    setPersonalTodos(prev => {
      const next = prev.filter(t => t.id !== todoId);
      savePersonalTodosToCache(next);
      return next;
    });

    try {
      await supabase.from('todo_tasks').delete().eq('id', todoId);
    } catch (err) {
      console.error('Error deleting personal todo:', err);
    }
  };

  useEffect(() => {
    try {
      const cachedTodos = localStorage.getItem('tp_personal_todos');
      if (cachedTodos) {
        const parsed = JSON.parse(cachedTodos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPersonalTodos(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const channelId = `realtime-admin-tasks-${Math.random().toString(36).slice(2, 9)}`;

    const tasksChannel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_servicing_tasks' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_tasks' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    try {
      const storedActivities = localStorage.getItem('tp_user_activities');
      if (storedActivities) {
        const parsed = JSON.parse(storedActivities);
        if (Array.isArray(parsed)) {
          setActivities(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const timer = setTimeout(() => setShowSplash(false), 700);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openLogModal = () => {
    setActivityForm(emptyActivityForm);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
  };

  const handleFormChange = (field: keyof Omit<ActivityEvent, 'id'>, value: string) => {
    setActivityForm((prev) => ({ ...prev, [field]: value }) as Omit<ActivityEvent, 'id'>);
  };

  const handleSaveActivity = async () => {
    if (!activityForm.title.trim() || !activityForm.date) return;
    const newEvent: ActivityEvent = { id: `evt-${Date.now()}`, ...activityForm };

    try {
      const { data: dbEvt, error: dbErr } = await supabase.from('calendar_events').insert([{
        title: activityForm.title.trim(),
        description: activityForm.type + (activityForm.notes ? `\n${activityForm.notes}` : ''),
        event_date: activityForm.date,
        start_time: activityForm.time || '09:00:00',
        location_name: activityForm.location || ''
      }]).select().single();

      if (!dbErr && dbEvt) {
        newEvent.id = dbEvt.id;
      }
    } catch (err) {
      console.error('Error saving activity to calendar_events:', err);
    }

    setActivities((prev) => {
      const next = [newEvent, ...prev.filter(a => a.id !== newEvent.id)];
      try {
        localStorage.setItem('tp_user_activities', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    setSelectedMiniDate(newEvent.date);
    setIsLogModalOpen(false);
    setActivityForm(emptyActivityForm);
    createNotification({
      title: 'Activity Logged',
      description: `Activity "${newEvent.title}" was logged in Activity Tracker.`,
      type: 'info',
    });
  };

  const handleSaveCalendarActivity = async (activityData: Omit<CalendarActivityItem, 'id' | 'createdAt'>) => {
    const activeUserId = currentUserIdRef.current || currentUserId;

    const descriptionJson = JSON.stringify({
      isCalendarActivity: true,
      notes: activityData.notes || '',
      category: activityData.category || 'Others',
      assigned_to: null,
      processed_by: null,
      activityData: {
        date: activityData.date,
        time: activityData.time,
        mode: activityData.mode,
        location: activityData.location,
        assignedRole: activityData.assignedRole,
        onlinePlatform: activityData.onlinePlatform,
        onlineMeetingLink: activityData.onlineMeetingLink,
        onlineMeetingId: activityData.onlineMeetingId,
        onlinePasscode: activityData.onlinePasscode,
        onsiteVenue: activityData.onsiteVenue,
        onsiteBuilding: activityData.onsiteBuilding,
        onsiteStreet: activityData.onsiteStreet,
        onsiteBarangay: activityData.onsiteBarangay,
        onsiteCity: activityData.onsiteCity,
        onsiteProvince: activityData.onsiteProvince,
        onsiteZip: activityData.onsiteZip,
        onsiteIslandGroup: activityData.onsiteIslandGroup,
        onsiteRegion: activityData.onsiteRegion,
        region: activityData.region,
        latitude: activityData.latitude,
        longitude: activityData.longitude,
        googleMapsUrl: activityData.googleMapsUrl
      }
    });

    const newDbTask: any = {
      user_id: activeUserId,
      title: activityData.title,
      notes: descriptionJson,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (activeUserId) {
      newDbTask.user_id = activeUserId;
    }

    let savedId: string | null = null;
    let savedTable: 'client_servicing_tasks' | undefined;

    try {
      const { data: csData, error: csErr } = await supabase
        .from('client_servicing_tasks')
        .insert([newDbTask]).select('id').single();

      if (csErr) {
        console.error('Error inserting calendar activity into client_servicing_tasks:', csErr);
      } else if (csData) {
        console.log('Created Calendar Activity Task:', csData);
        savedId = csData.id;
        savedTable = 'client_servicing_tasks';
      }
    } catch (err) {
      console.error('Error saving calendar activity to Supabase:', err);
    }

    const newItem: CalendarActivityItem = {
      ...activityData,
      id: savedId || `cal-evt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      _sourceTable: savedTable
    };

    setCalendarLogs(prev => [newItem, ...prev.filter(log => log.id !== newItem.id)]);

    setIsCalendarModalOpen(false);

    createNotification({
      title: 'New Calendar Activity',
      description: `Calendar activity "${activityData.title}" was created.`,
      type: 'info',
    });
  };

  const promptDeleteCalendarActivity = (id: string) => {
    setActivityToDelete(id);
  };

  const executeDeleteCalendarActivity = async () => {
    if (!activityToDelete) return;

    const targetItem = calendarLogs.find(log => log.id === activityToDelete);
    const sourceTable = targetItem?._sourceTable;

    setCalendarLogs(prev => prev.filter(log => log.id !== activityToDelete));

    const idToDelete = activityToDelete;
    setActivityToDelete(null);

    try {
      const res = await supabase.from('client_servicing_tasks').delete().eq('id', idToDelete);
      if (res.error) console.error('Error deleting calendar activity from client_servicing_tasks:', res.error);
      else console.log('Deleted Calendar Activity Task:', idToDelete);
    } catch (err) {
      console.error('Error deleting calendar activity:', err);
    }
  };

  const goToPrevMiniMonth = () => {
    setMiniCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMiniMonth = () => {
    setMiniCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleEventClick = (evt: ActivityEvent) => {
    setSelectedEvent(evt);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent.id;
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== eventId);
      try {
        localStorage.setItem('tp_user_activities', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    setSelectedEvent(null);

    try {
      await supabase.from('calendar_events').delete().eq('id', eventId);
    } catch (err) {
      console.error('Error deleting from calendar_events:', err);
    }
  };

  return {
    showSplash,
    isRefreshing,
    adminId,
    adminName,
    customPortals,
    clientBirthdays,
    userTasks,
    personalTodos,
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
    handleCreatePersonalTodo,
    handleTogglePersonalTodoComplete,
    handleDeletePersonalTodo
  };
};
