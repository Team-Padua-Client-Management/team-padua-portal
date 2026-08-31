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
import { KpiData } from '@src/features/dashboard/hooks/useAdminDashboard';

/**
 * useUserDashboard
 * 
 * Role-based and data-scoped hook for the Personal User Dashboard (/dashboard).
 * Scopes all database queries strictly according to the authenticated user's role:
 * - Advisor: Only their own clients, birthdays, inquiries, tasks, calendar events, activities.
 * - Bizdev: Only data for advisors assigned/authorized to them, plus their own tasks/inquiries.
 * - Member: Only their own tasks, inquiries, personal to-dos, and activities.
 * - Admin: Full access if viewing user personal dashboard.
 * 
 * Dynamic mapping: NEVER hardcodes advisor names or IDs.
 */
export const useUserDashboard = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [customPortals, setCustomPortals] = useState<any[]>([]);

  const [clientBirthdays, setClientBirthdays] = useState<BirthdayItem[]>([]);
  const [userTasks, setUserTasks] = useState<TaskItem[]>([]);
  const [clientInquiries, setClientInquiries] = useState<ClientInquiry[]>([]);
  const [personalTodos, setPersonalTodos] = useState<TodoTask[]>([]);

  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [bizDevProfiles, setBizDevProfiles] = useState<UserProfile[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorItem[]>([]);
  const [matchedAdvisorId, setMatchedAdvisorId] = useState<string | null>(null);

  const [selectedTaskIdForModal, setSelectedTaskIdForModal] = useState<string | null>(null);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  const [activities, setActivities] = useState<ActivityEvent[]>([]);
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
    members: 0, cpst: 0, acr: 0, bcr: 0, cpc: 0, fst: 0, fw: 0,
    ada: 0, aca: 0, sro: 0, ppi: 0, acicr: 0,
    mngt: 0, ppu: 0, attendance: 0, announcements: 0, designs: 0, faqs: 0
  });

  const currentUserIdRef = useRef<string | null>(null);
  const userRoleRef = useRef<string | null>(null);
  const matchedAdvisorIdRef = useRef<string | null>(null);

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
          p => !(p.full_name?.toLowerCase() === "user" && (p.role === "Admin" || p.role === "ADMIN"))
        );
        setAllProfiles(cleanProfiles);
        currentAll = cleanProfiles;
      }

      const { data: bizData, error: bizErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .or('role.eq.Bizdev,role.eq.BizDev,role.ilike.bizdev')
        .order('full_name');

      if (!bizErr && bizData) {
        setBizDevProfiles(bizData);
      }
      return currentAll;
    } catch (err) {
      console.error('Exception loading profiles:', err);
      return [];
    }
  };

  const loadAllAdvisors = async (): Promise<AdvisorItem[]> => {
    try {
      const { data, error } = await supabase
        .from('advisors')
        .select('id, advisor_name, advisor_code, email')
        .order('advisor_name');

      if (!error && data) {
        return data as (AdvisorItem & { email?: string })[];
      }
      return [];
    } catch (err) {
      console.error('Exception loading advisors:', err);
      return [];
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const loadedProfiles = await loadProfiles();
      const allAdvisorsData = await loadAllAdvisors();

      const { getAuthScope } = await import('@src/lib/authScope');
      const scope = await getAuthScope();

      if (!scope.user) return;

      const uid = scope.user.id;
      setCurrentUserId(uid);
      currentUserIdRef.current = uid;

      const profile = scope.profile;
      const role = scope.role;
      const isAdmin = scope.isAdmin;
      const isAdvisor = scope.isAdvisor;
      const isBizdev = scope.isBizdev;
      const isMember = scope.isMember;

      setUserRole(role);
      userRoleRef.current = role;
      setUserPermissions(profile?.client_servicing_permissions || null);

      const displayName = profile?.full_name || scope.user.user_metadata?.full_name || scope.user.user_metadata?.name || scope.user.email?.split('@')[0] || 'User';
      setUserName(displayName);

      const resolvedAdvisorId = scope.advisorId;
      const authorizedAdvisorIds = scope.authorizedAdvisorIds;
      const visibleAdvisors: AdvisorItem[] = scope.visibleAdvisors.map(a => ({
        id: a.id,
        advisor_name: a.advisor_name,
        advisor_code: a.advisor_code,
      }));

      setMatchedAdvisorId(resolvedAdvisorId);
      matchedAdvisorIdRef.current = resolvedAdvisorId;
      setAdvisors(visibleAdvisors);

      // ── 1. SCOPED CLIENT SERVICING TASKS ──────────────────────────────────
      const dbTasks: TaskItem[] = [];
      const dbCalendarLogs: CalendarActivityItem[] = [];

      let tasksQuery = supabase
        .from('client_servicing_tasks')
        .select('*')
        .order('updated_at', { ascending: false });

      if (isAdmin) {
        // Full admin view
      } else if (isAdvisor) {
        // Advisor: only tasks created by, assigned to, or processed by this advisor
        tasksQuery = tasksQuery.or(`user_id.eq.${uid},assigned_to.eq.${uid},processed_by.eq.${uid}`);
      } else if (isBizdev) {
        // Bizdev: tasks assigned to or processed by this bizdev, or created by them
        tasksQuery = tasksQuery.or(`assigned_to.eq.${uid},processed_by.eq.${uid},user_id.eq.${uid}`);
      } else {
        // Member: only their own tasks
        tasksQuery = tasksQuery.or(`user_id.eq.${uid},assigned_to.eq.${uid},processed_by.eq.${uid}`);
      }

      const resCS = await tasksQuery;

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

      setUserTasks(dbTasks);

      // ── 2. SCOPED CLIENT INQUIRIES ─────────────────────────────────────────
      let inquiriesQuery = supabase
        .from('client_inquiries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (isAdmin) {
        // Full admin view
      } else if (isAdvisor || isBizdev) {
        inquiriesQuery = inquiriesQuery.or(`user_id.eq.${uid},processed_by.eq.${uid}`);
      } else {
        inquiriesQuery = inquiriesQuery.eq('user_id', uid);
      }

      const resInquiry = await inquiriesQuery;
      if (resInquiry.data) {
        setClientInquiries(resInquiry.data as ClientInquiry[]);
      } else {
        setClientInquiries([]);
      }

      // ── 3. PERSONAL TODOS ──────────────────────────────────────────────────
      try {
        const { data: todoData, error: todoErr } = await supabase
          .from('todo_tasks')
          .select('*')
          .eq('completed', false)
          .eq('user_id', uid)
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
      }

      // ── 4. SCOPED CALENDAR EVENTS & ACTIVITIES ─────────────────────────────
      try {
        let calQuery = supabase
          .from('calendar_events')
          .select('*')
          .order('created_at', { ascending: false });

        if (isAdmin) {
          // Full admin view
        } else if (isAdvisor) {
          if (resolvedAdvisorId && resolvedAdvisorId !== uid) {
            calQuery = calQuery.or(`advisor_id.eq.${resolvedAdvisorId},advisor_id.eq.${uid}`);
          } else {
            calQuery = calQuery.eq('advisor_id', uid);
          }
        } else if (isBizdev) {
          if (authorizedAdvisorIds.length > 0) {
            calQuery = calQuery.or(`advisor_id.in.(${authorizedAdvisorIds.join(',')}),advisor_id.eq.${uid}`);
          } else {
            calQuery = calQuery.eq('advisor_id', uid);
          }
        } else {
          calQuery = calQuery.eq('advisor_id', uid);
        }

        const { data: calData, error: calErr } = await calQuery;

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

          setActivities(dbActivities);
          localStorage.setItem('tp_user_activities', JSON.stringify(dbActivities));

          const extraCalLogs: CalendarActivityItem[] = calData.map((evt: any) => ({
            id: evt.id,
            title: evt.title || 'Untitled Activity',
            date: evt.event_date || evt.date || evt.created_at?.split('T')[0] || '',
            time: evt.start_time || evt.time || '',
            mode: (evt.mode || (evt.location_name ? 'Onsite' : 'Online')) as 'Online' | 'Onsite',
            location: evt.location_name || evt.location || '',
            category: evt.category || (evt.description && evt.description.split('\n')[0]) || 'Client Meeting',
            assignedRole: (evt.assigned_role || evt.role || (isAdvisor ? 'Advisor' : isBizdev ? 'Bizdev' : 'Admin')) as 'Admin' | 'Advisor' | 'Bizdev',
            notes: evt.description || evt.notes || '',
            createdAt: evt.created_at || new Date().toISOString(),
            completed: evt.status === 'Completed' || evt.status === 'Done' || evt.completed === true,
            status: evt.status,
            _sourceTable: 'calendar_events' as any
          }));

          const combinedCalendarLogs = [...dbCalendarLogs, ...extraCalLogs];
          const map = new Map<string, CalendarActivityItem>();
          for (const item of combinedCalendarLogs) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          setCalendarLogs(Array.from(map.values()));
        } else {
          setActivities([]);
          setCalendarLogs(dbCalendarLogs);
        }
      } catch (e) {
        console.error('Error fetching calendar_events:', e);
        setCalendarLogs(dbCalendarLogs);
      }

      // ── 5. SCOPED CLIENT BIRTHDAYS ─────────────────────────────────────────
      let scopedBirthdays: BirthdayItem[] = [];

      const advisorSearchIds = isAdvisor && resolvedAdvisorId
        ? Array.from(new Set([resolvedAdvisorId, uid]))
        : isBizdev && authorizedAdvisorIds.length > 0
          ? authorizedAdvisorIds
          : [];

      if (isAdvisor && advisorSearchIds.length > 0) {
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
          `)
          .in('advisor_id', advisorSearchIds);

        if (cpstErr || !cpstClientsData || cpstClientsData.length === 0) {
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
            `)
            .in('advisor_id', advisorSearchIds);

          if (fallbackRes.data && fallbackRes.data.length > 0) {
            cpstClientsData = fallbackRes.data;
            cpstErr = null;
          }
        }

        if (!cpstErr && cpstClientsData && Array.isArray(cpstClientsData)) {
          scopedBirthdays = getBirthdaysAroundNow(cpstClientsData);
        }
      } else if (isBizdev && advisorSearchIds.length > 0) {
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
          `)
          .in('advisor_id', advisorSearchIds);

        if (cpstErr || !cpstClientsData || cpstClientsData.length === 0) {
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
            `)
            .in('advisor_id', advisorSearchIds);

          if (fallbackRes.data && fallbackRes.data.length > 0) {
            cpstClientsData = fallbackRes.data;
            cpstErr = null;
          }
        }

        if (!cpstErr && cpstClientsData && Array.isArray(cpstClientsData)) {
          scopedBirthdays = getBirthdaysAroundNow(cpstClientsData);
        }
      } else if (isAdmin) {
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

        if (cpstErr || !cpstClientsData || cpstClientsData.length === 0) {
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
          if (fallbackRes.data) cpstClientsData = fallbackRes.data;
        }

        if (cpstClientsData && Array.isArray(cpstClientsData)) {
          scopedBirthdays = getBirthdaysAroundNow(cpstClientsData);
        }
      }

      setClientBirthdays(scopedBirthdays);

      // ── 6. SCOPED KPIS ─────────────────────────────────────────────────────
      let scopedCpstCount = 0;
      let scopedClientIds: string[] = [];

      if (isAdvisor && advisorSearchIds.length > 0) {
        const { data: cData, count } = await supabase.from('cgpt_clients').select('id', { count: 'exact' }).in('advisor_id', advisorSearchIds);
        scopedCpstCount = count || 0;
        scopedClientIds = (cData || []).map(c => c.id);
        if (scopedCpstCount === 0) {
          const fb = await supabase.from('cpst_clients').select('id', { count: 'exact' }).in('advisor_id', advisorSearchIds);
          scopedCpstCount = fb.count || 0;
          scopedClientIds = (fb.data || []).map(c => c.id);
        }
      } else if (isBizdev && advisorSearchIds.length > 0) {
        const { data: cData, count } = await supabase.from('cgpt_clients').select('id', { count: 'exact' }).in('advisor_id', advisorSearchIds);
        scopedCpstCount = count || 0;
        scopedClientIds = (cData || []).map(c => c.id);
        if (scopedCpstCount === 0) {
          const fb = await supabase.from('cpst_clients').select('id', { count: 'exact' }).in('advisor_id', advisorSearchIds);
          scopedCpstCount = fb.count || 0;
          scopedClientIds = (fb.data || []).map(c => c.id);
        }
      } else if (isAdmin) {
        const { data: cData, count } = await supabase.from('cgpt_clients').select('id', { count: 'exact' });
        scopedCpstCount = count || 0;
        scopedClientIds = (cData || []).map(c => c.id);
      }

      // Count scoped request forms
      let acrCount = 0;
      let bcrCount = 0;
      let fstCount = 0;
      let fwCount = 0;
      let adaCount = 0;
      let acaCount = 0;
      let sroCount = 0;
      let ppiCount = 0;
      let acicrCount = 0;

      try {
        if (isAdmin) {
          const [acrRes, bcrRes, fstRes, fwRes, adaRes, acaRes, sroRes, ppiRes, acicrRes] = await Promise.all([
            supabase.from('advisor_change_requests').select('*', { count: 'exact', head: true }),
            supabase.from('beneficiary_change_requests').select('*', { count: 'exact', head: true }),
            supabase.from('fund_switching_requests').select('*', { count: 'exact', head: true }),
            supabase.from('fund_withdrawal_requests').select('*', { count: 'exact', head: true }),
            supabase.from('ada_requests').select('*', { count: 'exact', head: true }),
            supabase.from('auto_change_arrangements').select('*', { count: 'exact', head: true }),
            supabase.from('reinstatement_sro_requests').select('*', { count: 'exact', head: true }),
            supabase.from('reinstatement_pdi_requests').select('*', { count: 'exact', head: true }),
            supabase.from('acicr_requests').select('*', { count: 'exact', head: true })
          ]);
          acrCount = acrRes.count || 0;
          bcrCount = bcrRes.count || 0;
          fstCount = fstRes.count || 0;
          fwCount = fwRes.count || 0;
          adaCount = adaRes.count || 0;
          acaCount = acaRes.count || 0;
          sroCount = sroRes.count || 0;
          ppiCount = ppiRes.count || 0;
          acicrCount = acicrRes.count || 0;
        } else if (scopedClientIds.length > 0) {
          const [acrRes, bcrRes, fstRes, fwRes, adaRes, acaRes, sroRes, ppiRes, acicrRes] = await Promise.all([
            supabase.from('advisor_change_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('beneficiary_change_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('fund_switching_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('fund_withdrawal_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('ada_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('auto_change_arrangements').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('reinstatement_sro_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('reinstatement_pdi_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds),
            supabase.from('acicr_requests').select('*', { count: 'exact', head: true }).in('client_id', scopedClientIds)
          ]);
          acrCount = acrRes.count || 0;
          bcrCount = bcrRes.count || 0;
          fstCount = fstRes.count || 0;
          fwCount = fwRes.count || 0;
          adaCount = adaRes.count || 0;
          acaCount = acaRes.count || 0;
          sroCount = sroRes.count || 0;
          ppiCount = ppiRes.count || 0;
          acicrCount = acicrRes.count || 0;
        }
      } catch (cntErr) {
        console.error('Error fetching request form counts:', cntErr);
      }

      setKpis({
        members: isAdvisor || isBizdev ? 1 : loadedProfiles.length,
        cpst: scopedCpstCount,
        acr: acrCount,
        bcr: bcrCount,
        fst: fstCount,
        fw: fwCount,
        ada: adaCount,
        aca: acaCount,
        sro: sroCount,
        ppi: ppiCount,
        acicr: acicrCount,
        cpc: 0,
        mngt: 0,
        ppu: 0,
        attendance: 0,
        announcements: 0,
        designs: 0,
        faqs: 0
      });

    } catch (err) {
      console.error('Error fetching user dashboard data:', err);
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
    if (!inquiryId) return;

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

      if ("cmgc_name" in updates) dbUpdates.cmgc_name = updates.cmgc_name ?? null;
      if ("inquiry_concern" in updates) dbUpdates.inquiry_concern = updates.inquiry_concern ?? null;
      if ("inquiry_type" in updates) dbUpdates.inquiry_type = updates.inquiry_type ?? null;
      if ("status" in updates) dbUpdates.status = updates.status ?? null;
      if ("processed_by" in updates) {
        dbUpdates.processed_by = (typeof updates.processed_by === 'string' && updates.processed_by.trim().length > 0)
          ? updates.processed_by.trim()
          : null;
      }
      if ("user_id" in updates && updates.user_id) dbUpdates.user_id = updates.user_id;

      const { error } = await supabase
        .from("client_inquiries")
        .update(dbUpdates)
        .eq("id", inquiryId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Error auto-saving inquiry:", err);
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

      const createdTask = mapDbTaskToUiTask(data, "client_servicing_tasks");
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
      const activeUserId = currentUserIdRef.current || currentUserId;
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
    const channelId = `realtime-user-tasks-${Math.random().toString(36).slice(2, 9)}`;

    const tasksChannel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_servicing_tasks' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_inquiries' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_tasks' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchDashboardData]);

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
    const activeUserId = currentUserIdRef.current || currentUserId;
    const advisorIdToAttach = matchedAdvisorIdRef.current || activeUserId;

    try {
      const { data: dbEvt, error: dbErr } = await supabase.from('calendar_events').insert([{
        title: activityForm.title.trim(),
        description: activityForm.type + (activityForm.notes ? `\n${activityForm.notes}` : ''),
        event_date: activityForm.date,
        start_time: activityForm.time || '09:00:00',
        location_name: activityForm.location || '',
        advisor_id: advisorIdToAttach
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
    const advisorIdToAttach = matchedAdvisorIdRef.current || activeUserId;

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
        console.error('Error updating calendar activity:', err);
      }
    } else {
      try {
        const newDbTask = {
          user_id: activeUserId,
          title: activityData.title,
          notes: descriptionJson,
          category: activityData.category || 'Others',
          status: 'Pending',
          assigned_to: activeUserId,
          processed_by: activeUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: dbTask, error: insertErr } = await supabase
          .from('client_servicing_tasks')
          .insert([newDbTask])
          .select()
          .single();

        if (insertErr) {
          console.error('Error inserting calendar activity into client_servicing_tasks:', insertErr);
        }

        // Also record in calendar_events for multi-view calendar synchronization
        try {
          await supabase.from('calendar_events').insert([{
            title: activityData.title,
            description: `${activityData.category || 'Activity'}\n${activityData.notes || ''}`,
            event_date: activityData.date,
            start_time: activityData.time || '09:00:00',
            location_name: activityData.location || '',
            advisor_id: advisorIdToAttach
          }]);
        } catch (calEvtErr) {
          console.error('Error syncing to calendar_events:', calEvtErr);
        }

        if (dbTask) {
          const newCalLog = mapDbTaskToCalendarActivity(dbTask, 'client_servicing_tasks');
          setCalendarLogs(prev => [newCalLog, ...prev]);
        }
      } catch (err) {
        console.error('Error saving calendar activity:', err);
      }
    }

    setIsCalendarModalOpen(false);
    createNotification({
      title: 'Calendar Activity Added',
      description: `Activity "${activityData.title}" was saved.`,
      type: 'info',
    });
  };

  const promptDeleteCalendarActivity = (activityId: string) => {
    setActivityToDelete(activityId);
  };

  const executeDeleteCalendarActivity = async () => {
    if (!activityToDelete) return;
    const targetId = activityToDelete;
    const targetItem = calendarLogs.find(log => log.id === targetId);

    setCalendarLogs(prev => prev.filter(log => log.id !== targetId));
    setActivityToDelete(null);

    try {
      if (targetItem?._sourceTable === 'calendar_events') {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', targetId);
        if (error) console.error('Error deleting from calendar_events:', error);
      } else {
        const { error } = await supabase
          .from('client_servicing_tasks')
          .delete()
          .eq('id', targetId);
        if (error) console.error('Error deleting from client_servicing_tasks:', error);
      }
    } catch (err) {
      console.error('Error deleting calendar activity:', err);
    }
  };

  const handleCompleteCalendarActivity = async (activityId: string) => {
    const targetItem = calendarLogs.find(log => log.id === activityId);
    const newCompleted = !(targetItem?.completed || targetItem?.status === 'Completed');

    setCalendarLogs(prev => prev.map(log => {
      if (log.id === activityId) {
        return {
          ...log,
          completed: newCompleted,
          status: newCompleted ? 'Completed' : 'Pending'
        };
      }
      return log;
    }));

    try {
      if (targetItem?._sourceTable === 'calendar_events') {
        await supabase
          .from('calendar_events')
          .update({
            status: newCompleted ? 'Completed' : 'Scheduled',
          })
          .eq('id', activityId);
      } else if (targetItem) {
        let existingNotesObj: any = {};
        try {
          const parsed = JSON.parse(targetItem.notes || '{}');
          if (parsed && typeof parsed === 'object') existingNotesObj = parsed;
        } catch { }

        existingNotesObj.completed = newCompleted;
        existingNotesObj.status = newCompleted ? 'Completed' : 'Pending';

        await supabase
          .from('client_servicing_tasks')
          .update({
            completed: newCompleted,
            status: newCompleted ? 'Done' : 'Pending',
            notes: JSON.stringify(existingNotesObj),
            updated_at: new Date().toISOString()
          })
          .eq('id', activityId);
      }
    } catch (err) {
      console.error('Error completing activity in Supabase:', err);
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
    adminName: userName,
    userName,
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
