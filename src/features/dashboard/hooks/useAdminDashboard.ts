import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@src/lib/supabase/client';
import { TaskItem } from '@src/features/dashboard/components/TaskRow';
import { TodoTask } from '@src/features/dashboard/components/ClientServicingToDo';
import { ActivityEvent } from '@src/features/dashboard/components/ActivityCard';
import { CalendarActivityItem } from '@src/features/dashboard/components/CalendarActivityCard';
import { BirthdayItem, AdvisorItem } from '@src/features/dashboard/components/BirthdayCard';
import { UserProfile } from '@src/features/dashboard/components/UserAvatar';
import { initialActivities, emptyActivityForm } from '@src/features/dashboard/constants';
import {
  mapDbTaskToCalendarActivity,
  mapDbTaskToUiTask,
  getBirthdaysAroundNow,
  formatUiTaskToDbUpdates
} from '@src/features/dashboard/utils/dashboardUtils';
import { parseTaskMetadata, buildTaskNotes } from '@src/features/dashboard/components/TaskList';
import createNotification from '@src/lib/notifications/createNotification';
import { ClientInquiry } from '@src/features/dashboard/types/inquiry';

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
  const [clientInquiries, setClientInquiries] = useState<ClientInquiry[]>([]);
  const [personalTodos, setPersonalTodos] = useState<TodoTask[]>([]);

  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [bizDevProfiles, setBizDevProfiles] = useState<UserProfile[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  const [selectedTaskIdForModal, setSelectedTaskIdForModal] = useState<string | null>(null);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

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

  const selectedInquiry = useMemo(() => {
    if (!selectedInquiryId) return null;
    return clientInquiries.find(item => item.id === selectedInquiryId) || null;
  }, [selectedInquiryId, clientInquiries]);

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
        const cleanProfiles = allData.filter(
          p =>
            !(
              p.full_name?.toLowerCase() === "user" &&
              (p.role === "Admin" || p.role === "ADMIN")
            )
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

  const loadAdvisors = async () => {
    try {
      const { data, error } = await supabase
        .from('advisors')
        .select('id, advisor_name, advisor_code')
        .order('advisor_name');

      if (!error && data) {
        setAdvisors(data as AdvisorItem[]);
      }
    } catch (err) {
      console.error('Exception loading advisors:', err);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const loadedProfiles = await loadProfiles();
      await loadAdvisors();

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
          .select('role, client_servicing_permissions')
          .eq('id', user.id)
          .maybeSingle();

        const fetchedRole = userProfileData?.role || '';
        setUserRole(fetchedRole);
        setUserPermissions(userProfileData?.client_servicing_permissions || null);

        const userRoleLower = fetchedRole.toLowerCase();
        const isAdmin = userRoleLower === 'admin';

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
              const rawJson = t.notes && t.notes.trim().startsWith('{') ? t.notes : t.description;
              if (rawJson && rawJson.trim().startsWith('{')) {
                const parsed = JSON.parse(rawJson);
                if (parsed.isCalendarActivity) {
                  isCal = true;
                }
              }
            } catch (e) { }

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

        const resInquiry = await supabase
          .from('client_inquiries')
          .select('*')
          .order('updated_at', { ascending: false });

        if (resInquiry.data) {
          setClientInquiries(resInquiry.data as ClientInquiry[]);
        }

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

            const extraCalLogs: CalendarActivityItem[] = calData.map((evt: any) => ({
              id: evt.id,
              title: evt.title || 'Untitled Activity',
              date: evt.event_date || evt.date || evt.created_at?.split('T')[0] || '',
              time: evt.start_time || evt.time || '',
              mode: (evt.mode || (evt.location_name ? 'Onsite' : 'Online')) as 'Online' | 'Onsite',
              location: evt.location_name || evt.location || '',
              category: evt.category || (evt.description && evt.description.split('\n')[0]) || 'Client Meeting',
              assignedRole: (evt.assigned_role || evt.role || 'Advisor') as 'Admin' | 'Advisor' | 'Bizdev',
              notes: evt.description || evt.notes || '',
              createdAt: evt.created_at || new Date().toISOString(),
              completed: evt.status === 'Completed' || evt.status === 'Done' || evt.completed === true,
              status: evt.status,
              _sourceTable: 'calendar_events' as any
            }));

            setCalendarLogs((prev) => {
              const combined = [...prev, ...extraCalLogs];
              const map = new Map<string, CalendarActivityItem>();
              for (const item of combined) {
                if (!map.has(item.id)) {
                  map.set(item.id, item);
                }
              }
              return Array.from(map.values());
            });
          }
        } catch (e) {
          console.error('Error fetching calendar_events:', e);
        }
      }

      let { data: cpstClientsData, error: cpstErr } = await supabase
        .from('cgpt_clients')
        .select(`
          id,
          client_name,
          birthdate,
          advisor_id,
          advisor:advisors(
            id,
            advisor_name,
            advisor_code
          )
        `);

      if (cpstErr || (!cpstClientsData || cpstClientsData.length === 0)) {
        const fallbackRes = await supabase
          .from('cpst_clients')
          .select(`
            id,
            client_name,
            birthdate,
            advisor_id,
            advisor:advisors(
              id,
              advisor_name,
              advisor_code
            )
          `);
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          cpstClientsData = fallbackRes.data;
          cpstErr = null;
        }
      }

      if (!cpstErr && cpstClientsData && Array.isArray(cpstClientsData)) {
        const matched = getBirthdaysAroundNow(cpstClientsData);
        setClientBirthdays(matched);
      }

      const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      let { count: cpstCount } = await supabase.from('cgpt_clients').select('*', { count: 'exact', head: true });
      if (!cpstCount) {
        const { count: fallbackCpstCount } = await supabase.from('cpst_clients').select('*', { count: 'exact', head: true });
        cpstCount = fallbackCpstCount;
      }
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
    } catch (err) {
      console.error('Error auto-saving task:', err);
    }
  };

  const saveInquiryField = async (
    inquiryId: string,
    updates: Record<string, any>
  ) => {
    if (!inquiryId) {
      console.error("saveInquiryField called without inquiryId");
      return;
    }

    setClientInquiries(prev =>
      prev.map(item =>
        item.id === inquiryId
          ? {
            ...item,
            ...updates,
            updated_at: new Date().toISOString(),
          }
          : item
      )
    );

    try {
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if ("cmgc_name" in updates)
        dbUpdates.cmgc_name = updates.cmgc_name ?? null;

      if ("inquiry_concern" in updates)
        dbUpdates.inquiry_concern = updates.inquiry_concern ?? null;

      if ("inquiry_type" in updates)
        dbUpdates.inquiry_type = updates.inquiry_type ?? null;

      if ("status" in updates)
        dbUpdates.status = updates.status ?? null;

      if ("processed_by" in updates)
        dbUpdates.processed_by = (typeof updates.processed_by === 'string' && updates.processed_by.trim().length > 0)
          ? updates.processed_by.trim()
          : null;

      if ("user_id" in updates && updates.user_id)
        dbUpdates.user_id = updates.user_id;

      console.log("========== UPDATE INQUIRY ==========");
      console.log("Inquiry ID:", inquiryId);
      console.log("Updates:", dbUpdates);

      const { data, error } = await supabase
        .from("client_inquiries")
        .update(dbUpdates)
        .eq("id", inquiryId)
        .select();

      console.log("Returned Data:", data);

      if (error) {
        console.error("Supabase Update Error:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        });
        throw error;
      }
    } catch (err: any) {
      console.error("Error auto-saving inquiry:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      });
      throw err;
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
      title: "Untitled Task",
      notes: "",
      category: "Others",
      status: "Pending",
      assigned_to: activeUserId,
      processed_by: activeUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from("client_servicing_tasks")
        .insert([newDbTask])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      const createdTask = mapDbTaskToUiTask(
        data,
        "client_servicing_tasks"
      );

      setUserTasks(prev => [createdTask, ...prev]);
      setSelectedTaskIdForModal(createdTask.id);

    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInquiry = async () => {
    let activeUserId = currentUserIdRef.current || currentUserId;

    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id || null;
    }

    if (!activeUserId) return;

    try {
      const { data, error } = await supabase
        .from("client_inquiries")
        .insert([
          {
            user_id: activeUserId,
            processed_by: activeUserId,
            cmgc_name: "",
            inquiry_type: "Pending Response",
            inquiry_concern: "",
            status: "Pending"
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setClientInquiries(prev => [data as ClientInquiry, ...prev]);
      setSelectedInquiryId(data.id);

    } catch (err) {
      console.error(err);
    }
  };

  const copyInquiryToPendingSubmission = async (inquiry: ClientInquiry) => {
    let activeUserId = currentUserIdRef.current || currentUserId;

    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id || null;
    }

    if (!activeUserId) return;

    const rawNotes = inquiry.inquiry_concern || (inquiry as any).notes || '';
    const currentMeta = parseTaskMetadata(rawNotes);
    const clientName = inquiry.cmgc_name || (inquiry as any).title || 'Untitled Client';
    const updatedMeta = {
      ...currentMeta,
      workflow_status: 'Pending for Submission',
      policy_owner: currentMeta.policy_owner || clientName,
      policy_insured: currentMeta.policy_insured || clientName,
      date_of_request: currentMeta.date_of_request || new Date().toISOString().split('T')[0],
    };

    const newNotes = buildTaskNotes(updatedMeta, currentMeta.timeline || rawNotes);

    const newDbTask = {
      user_id: activeUserId,
      title: clientName,
      notes: newNotes,
      category: (inquiry as any).category || 'Others',
      status: 'Pending',
      service_request_number: currentMeta.service_request_number || (inquiry as any).service_request_number || null,
      assigned_to: (inquiry as any).assigned_to || activeUserId,
      processed_by: inquiry.processed_by || activeUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('client_servicing_tasks')
        .insert([newDbTask])
        .select()
        .single();

      if (error) {
        console.error('Error copying inquiry to Pending for Submission:', error);
        return;
      }

      const createdTask = mapDbTaskToUiTask(data, 'client_servicing_tasks');
      setUserTasks((prev) => [createdTask, ...prev]);
    } catch (err) {
      console.error('Error copying inquiry:', err);
    }
  };

  const copyInquiryToAddressedConcerns = async (inquiry: ClientInquiry) => {
    let activeUserId = currentUserIdRef.current || currentUserId;

    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id || null;
    }

    if (!activeUserId) return;

    try {
      const { data, error } = await supabase
        .from('client_inquiries')
        .insert([
          {
            user_id: activeUserId,
            processed_by: inquiry.processed_by || activeUserId,
            cmgc_name: inquiry.cmgc_name || '',
            inquiry_type: 'Address Concern',
            inquiry_concern: inquiry.inquiry_concern || '',
            status: inquiry.status || 'Pending',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error copying inquiry to Addressed Concerns:', error);
        return;
      }

      setClientInquiries((prev) => [data as ClientInquiry, ...prev]);
    } catch (err) {
      console.error('Error copying inquiry:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setUserTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const resCS = await supabase.from('client_servicing_tasks').delete().eq('id', taskId);
      if (resCS.error) console.error('Error deleting from client_servicing_tasks:', resCS.error);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    setClientInquiries(prev => prev.filter(item => item.id !== inquiryId));

    try {
      const resInq = await supabase.from('client_inquiries').delete().eq('id', inquiryId);
      if (resInq.error) console.error('Error deleting from client_inquiries:', resInq.error);
    } catch (err) {
      console.error('Error deleting inquiry:', err);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_inquiries' }, () => fetchDashboardData())
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

  const handleSaveCalendarActivity = async (
    activityData: Omit<CalendarActivityItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
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
        meeting_link_raw: activityData.meeting_link_raw,
        onlineMeetingId: activityData.onlineMeetingId,
        onlinePasscode: activityData.onlinePasscode,
        onsiteVenue: activityData.onsiteVenue || activityData.venue_name,
        venue_name: activityData.venue_name || activityData.onsiteVenue,
        venue_address: activityData.venue_address,
        venue_place_id: activityData.venue_place_id,
        venue_lat: activityData.venue_lat ?? activityData.latitude,
        venue_lng: activityData.venue_lng ?? activityData.longitude,
        venue_maps_url: activityData.venue_maps_url || activityData.googleMapsUrl,
        onsiteBuilding: activityData.onsiteBuilding,
        onsiteStreet: activityData.onsiteStreet,
        onsiteBarangay: activityData.onsiteBarangay,
        onsiteCity: activityData.onsiteCity,
        onsiteProvince: activityData.onsiteProvince,
        onsiteZip: activityData.onsiteZip,
        onsiteIslandGroup: activityData.onsiteIslandGroup,
        onsiteRegion: activityData.onsiteRegion,
        region: activityData.region,
        latitude: activityData.latitude ?? activityData.venue_lat,
        longitude: activityData.longitude ?? activityData.venue_lng,
        googleMapsUrl: activityData.googleMapsUrl || activityData.venue_maps_url
      }
    });

    if (existingId) {
      try {
        const { error: updateErr } = await supabase
          .from('client_servicing_tasks')
          .update({
            title: activityData.title,
            notes: descriptionJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingId);

        if (updateErr) {
          console.error('Error updating calendar activity in client_servicing_tasks:', updateErr);
        }
      } catch (err) {
        console.error('Error saving updated calendar activity to Supabase:', err);
      }

      setCalendarLogs(prev =>
        prev.map(item =>
          item.id === existingId
            ? { ...item, ...activityData }
            : item
        )
      );
      setIsCalendarModalOpen(false);

      createNotification({
        title: 'Calendar Activity Updated',
        description: `Calendar activity "${activityData.title}" was updated.`,
        type: 'info',
      });
      return;
    }

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

    setCalendarLogs(prev => prev.filter(log => log.id !== activityToDelete));
    const idToDelete = activityToDelete;
    setActivityToDelete(null);

    try {
      const res = await supabase.from('client_servicing_tasks').delete().eq('id', idToDelete);
      if (res.error) console.error('Error deleting calendar activity from client_servicing_tasks:', res.error);
    } catch (err) {
      console.error('Error deleting calendar activity:', err);
    }
  };

  const handleCompleteCalendarActivity = async (id: string) => {
    setCalendarLogs(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'Completed', completed: true } : item
      )
    );

    try {
      const { error } = await supabase
        .from('client_servicing_tasks')
        .update({ status: 'Done', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error completing activity in Supabase:', error);
      }
    } catch (err) {
      console.error('Error marking activity as complete:', err);
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
    clientInquiries,
    personalTodos,
    allProfiles,
    bizDevProfiles,
    advisors,
    currentUserId,
    selectedTaskIdForModal,
    setSelectedTaskIdForModal,
    selectedInquiryId,
    setSelectedInquiryId,
    selectedInquiry,
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
    saveInquiryField,
    handleToggleCheckbox,
    handleCreateTask,
    handleCreateInquiry,
    copyInquiryToPendingSubmission,
    copyInquiryToAddressedConcerns,
    handleDeleteTask,
    handleDeleteInquiry,
    handleCreatePersonalTodo,
    handleTogglePersonalTodoComplete,
    handleDeletePersonalTodo,
    userRole,
    userPermissions
  };
};