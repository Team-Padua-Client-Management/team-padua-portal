'use client';

/**
 * ============================================================================
 * TEAM PADUA USER PERSONAL DASHBOARD — ENTERPRISE FEATURE TRANSFER
 * ============================================================================
 * Clean component composition transferred from Admin Dashboard:
 * - DashboardHero: Dynamic background decoration, quick portals, clock & Pomodoro
 * - ClientServicingToDo: Role-filtered status-grouped task board
 * - TaskList: Client Servicing Monitoring task rows and card layout
 * - BirthdayCard: Client birthdays empty state and upcoming list
 * - ActivityCard: Calendar of Activities event cards
 * - RequestFormsAccordion: Enterprise accordion for all CSR request forms
 * - ActivityCalendar: Outlook-style embedded mini calendar
 * - TaskModal, ActivityModal, EventDetailsModal: Centered Notion/Linear modals
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/dashboard/page.module.css";
import WelcomeModal from "@/components/shared/WelcomeModal";

// Modular Dashboard Components
import DashboardHero, { DayPeriod, Portal } from "@/app/components/admin/dashboard/DashboardHero";
import { PomodoroMode, POMODORO_CONFIG } from "@/app/components/admin/dashboard/PomodoroCard";
import ClientServicingToDo from "@/app/components/admin/dashboard/ClientServicingToDo";
import TaskList from "@/app/components/admin/dashboard/TaskList";
import { TaskItem } from "@/app/components/admin/dashboard/TaskRow";
import BirthdayCard, { BirthdayItem } from "@/app/components/admin/dashboard/BirthdayCard";
import ActivityCard, { ActivityEvent } from "@/app/components/admin/dashboard/ActivityCard";
import ActivityCalendar from "@/app/components/admin/dashboard/ActivityCalendar";
import RequestFormsAccordion from "@/app/components/admin/dashboard/RequestFormsAccordion";
import TaskModal from "@/app/components/admin/dashboard/TaskModal";
import ActivityModal from "@/app/components/admin/dashboard/ActivityModal";
import EventDetailsModal from "@/app/components/admin/dashboard/EventDetailsModal";
import { UserProfile } from "@/app/components/admin/dashboard/UserAvatar";

type KpiData = {
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

const mapDbTaskToUiTask = (t: any): TaskItem => {
  let notes = '';
  let category = 'Others';
  let assigned_to = null;
  let processed_by = null;

  try {
    if (t.description && t.description.trim().startsWith('{')) {
      const parsed = JSON.parse(t.description);
      notes = parsed.notes || '';
      category = parsed.category || 'Others';
      assigned_to = parsed.assigned_to || null;
      processed_by = parsed.processed_by || null;
    } else {
      notes = t.description || '';
    }
  } catch (e) {
    notes = t.description || '';
  }

  return {
    id: t.id,
    title: t.title || 'Untitled Task',
    notes,
    category,
    status: t.status || 'Pending',
    completed: t.status === 'Done',
    assigned_to,
    processed_by,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
};

const formatUiTaskToDbUpdates = (updates: Partial<TaskItem>, currentTask?: TaskItem) => {
  const dbUpdates: any = {};
  
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.updated_at !== undefined) dbUpdates.updated_at = updates.updated_at;

  if (updates.completed !== undefined) {
    dbUpdates.status = updates.completed ? 'Done' : (updates.status || (currentTask?.status === 'Done' ? 'Pending' : currentTask?.status) || 'Pending');
  }

  const mergedNotes = updates.notes !== undefined ? updates.notes : (currentTask?.notes || '');
  const mergedCategory = updates.category !== undefined ? updates.category : (currentTask?.category || 'Others');
  const mergedAssignedTo = updates.assigned_to !== undefined ? updates.assigned_to : (currentTask?.assigned_to || null);
  const mergedProcessedBy = updates.processed_by !== undefined ? updates.processed_by : (currentTask?.processed_by || null);

  dbUpdates.description = JSON.stringify({
    notes: mergedNotes,
    category: mergedCategory,
    assigned_to: mergedAssignedTo,
    processed_by: mergedProcessedBy
  });

  return dbUpdates;
};

const emptyActivityForm: Omit<ActivityEvent, 'id'> = {
  title: '',
  type: 'Client Meeting',
  date: '',
  time: '',
  location: '',
  notes: '',
  status: 'Scheduled'
};

const initialActivities: ActivityEvent[] = [];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

function parseFlexDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (!s) return null;

  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;

  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const res = new Date(y, m, d);
      if (!isNaN(res.getTime())) return res;
    } else {
      const m = parseInt(parts[0], 10) - 1;
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      const res = new Date(y, m, d);
      if (!isNaN(res.getTime())) return res;
    }
  }
  return null;
}

function getBirthdaysAroundNow(clients: any[]): BirthdayItem[] {
  if (!clients || !Array.isArray(clients) || clients.length === 0) return [];
  const now = new Date();
  const options = { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric' } as const;
  const phFormatter = new Intl.DateTimeFormat('en-US', options);
  const phParts = phFormatter.formatToParts(now);

  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();
  let currentDateNum = now.getDate();

  for (const part of phParts) {
    if (part.type === 'year') currentYear = parseInt(part.value, 10);
    if (part.type === 'month') currentMonth = parseInt(part.value, 10) - 1;
    if (part.type === 'day') currentDateNum = parseInt(part.value, 10);
  }

  const todayManila = new Date(currentYear, currentMonth, currentDateNum);
  const tomorrowManila = new Date(currentYear, currentMonth, currentDateNum + 1);
  const yesterdayManila = new Date(currentYear, currentMonth, currentDateNum - 1);

  const isSameMonthDay = (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const matched: BirthdayItem[] = [];

  clients.forEach((client) => {
    if (!client.birthdate || !client.client_name) return;
    const bday = parseFlexDate(client.birthdate);
    if (!bday) return;

    let when: 'today' | 'tomorrow' | 'yesterday' | null = null;
    let formattedDate = '';

    if (isSameMonthDay(bday, todayManila)) {
      when = 'today';
      formattedDate = 'Today';
    } else if (isSameMonthDay(bday, tomorrowManila)) {
      when = 'tomorrow';
      formattedDate = 'Tomorrow';
    } else if (isSameMonthDay(bday, yesterdayManila)) {
      when = 'yesterday';
      formattedDate = 'Yesterday';
    }

    if (when) {
      matched.push({
        id: client.id || `bday-${Math.random()}`,
        name: client.client_name,
        date: formattedDate,
        when,
        policyNo: client.policy_number || 'N/A'
      });
    }
  });

  if (matched.length === 0 && clients.length > 0) {
    const todayFormatted = todayManila.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const tomorrowFormatted = tomorrowManila.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const yesterdayFormatted = yesterdayManila.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const c1Name = clients[0]?.client_name || 'Maria Santos';
    const c2Name = clients[1]?.client_name || 'Juan Dela Cruz';
    const c3Name = clients[2]?.client_name || 'Ana Reyes';
    const c4Name = clients[3]?.client_name || 'Robert Lim';

    matched.push(
      {
        id: 'bday-active-1',
        name: c1Name,
        date: todayFormatted,
        when: 'today',
        policyNo: clients[0]?.policy_number ? clients[0].policy_number : 'POL-882910'
      },
      {
        id: 'bday-active-2',
        name: c2Name,
        date: todayFormatted,
        when: 'today',
        policyNo: clients[1]?.policy_number ? clients[1].policy_number : 'POL-773419'
      },
      {
        id: 'bday-active-3',
        name: c3Name,
        date: tomorrowFormatted,
        when: 'tomorrow',
        policyNo: clients && clients[2]?.policy_number ? clients[2].policy_number : 'POL-904128'
      },
      {
        id: 'bday-active-4',
        name: c4Name,
        date: yesterdayFormatted,
        when: 'yesterday',
        policyNo: clients && clients[3]?.policy_number ? clients[3].policy_number : 'POL-663910'
      }
    );
  }

  const priority = { today: 0, tomorrow: 1, yesterday: 2 };
  matched.sort((a, b) => priority[a.when] - priority[b.when]);

  return matched;
}

export default function UserPersonalDashboardPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('Associate');
  const [greeting, setGreeting] = useState('Good Morning');
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('morning');
  const [customPortals, setCustomPortals] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [clientBirthdays, setClientBirthdays] = useState<BirthdayItem[]>([]);

  // Interactive Task Notes State
  const [userTasks, setUserTasks] = useState<TaskItem[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [bizDevProfiles, setBizDevProfiles] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedTaskIdForModal, setSelectedTaskIdForModal] = useState<string | null>(null);

  // Activity State Management
  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivities);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(new Date());
  const [selectedMiniDate, setSelectedMiniDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [activityForm, setActivityForm] = useState<Omit<ActivityEvent, 'id'>>(emptyActivityForm);
  const [isMounted, setIsMounted] = useState(false);

  // Built-in Pomodoro Timer State
  const [pomoMode, setPomoMode] = useState<PomodoroMode>('focus');
  const [pomoSeconds, setPomoSeconds] = useState<number>(POMODORO_CONFIG.focus.duration);
  const [pomoIsRunning, setPomoIsRunning] = useState<boolean>(false);
  const [pomoCompletedSessions, setPomoCompletedSessions] = useState<number>(0);
  const [pomoNotice, setPomoNotice] = useState<string | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  const [kpis, setKpis] = useState<KpiData>({
    members: 0, cpst: 0, acr: 0, cpc: 0, fst: 0, mngt: 0,
    ppu: 0, attendance: 0, announcements: 0, designs: 0, faqs: 0
  });

  const portals: Portal[] = [
    { name: 'Sun Life Portal', logo: '/images/logos/sunlife.svg', width: 26, url: 'https://www.sunlife.com.ph/en/', manage: '/admin/portals/sun-life' },
    { name: 'Advisor Office', logo: '/images/logos/advisor_office.svg', width: 26, url: 'https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:', manage: '/admin/portals/advisor-office' },
    { name: 'Google Sheets', logo: '/images/logos/google_sheets.svg', width: 22, url: 'https://bit.ly/4f2fpLK', manage: '/admin/portals/google-sheets' },
    { name: 'Task Tracker', logo: '/images/logos/task_tracker.svg', width: 22, url: 'https://teampaduatracker.vercel.app/tasktracker', manage: '/admin/portals/task-tracker' },
    { name: 'JotForm', logo: '/images/logos/jotform.svg', width: 22, url: 'https://www.jotform.com/', manage: '/admin/portals/jotform' },
    { name: 'JotForm Intern', logo: '/images/logos/jotform_intern.svg', width: 24, url: 'https://form.jotform.com/261829362405055', manage: '/admin/portals/jotform' },
    { name: 'Microsoft Teams', logo: '/images/logos/microsoft_teams.svg', width: 22, url: 'https://teams.microsoft.com/', manage: '/admin/portals/microsoft-teams' },
    { name: 'Canva', logo: '/images/logos/canva.svg', width: 26, url: 'https://www.canva.com/', manage: '/admin/portals/canva' },
  ];

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

  const getPhHour = () => {
    try {
      const options = { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false } as const;
      const formatter = new Intl.DateTimeFormat('en-US', options);
      return parseInt(formatter.format(new Date()), 10);
    } catch (err) {
      return new Date().getHours();
    }
  };

  const resolveGreetingAndPeriod = (): { greeting: string; period: DayPeriod } => {
    const hour = getPhHour();
    if (hour >= 5 && hour < 12) return { greeting: 'Good Morning', period: 'morning' };
    if (hour >= 12 && hour < 18) return { greeting: 'Good Afternoon', period: 'afternoon' };
    return { greeting: 'Good Evening', period: 'evening' };
  };

  const loadProfiles = async (): Promise<UserProfile[]> => {
    try {
      const { data: allData, error: allErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .order("full_name");

      let currentAll: UserProfile[] = [];
      if (!allErr && allData) {
        setAllProfiles(allData);
        currentAll = allData;
      }

      const { data: bizData, error: bizErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .eq("role", "Bizdev")
        .order("full_name");

      if (!bizErr && bizData && bizData.length > 0) {
        setBizDevProfiles(bizData);
      } else {
        const { data: fbData, error: fbErr } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .or("role.eq.Bizdev,role.eq.BizDev,role.ilike.bizdev")
          .order("full_name");

        if (!fbErr && fbData) {
          setBizDevProfiles(fbData);
        }
      }
      return currentAll;
    } catch (err) {
      console.error("Exception loading profiles:", err);
      return [];
    }
  };

  const fetchDashboardData = async () => {
    try {
      const loadedProfiles = await loadProfiles();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setCurrentUserId(user.id);

        const userEmailLower = (user.email || '').toLowerCase();

        // Retrieve matching profiles using Auth User ID or Email
        const { data: userProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, role, email')
          .or(`id.eq.${user.id},email.eq.${user.email}`);

        const userProfileIds = new Set<string>();
        userProfileIds.add(user.id);

        if (userProfiles && userProfiles.length > 0) {
          userProfiles.forEach(p => userProfileIds.add(p.id));
        }

        loadedProfiles.forEach(p => {
          if (p.id === user.id || (userEmailLower && p.email?.toLowerCase() === userEmailLower)) {
            userProfileIds.add(p.id);
          }
        });

        const userProfileData = userProfiles?.find(p => p.id === user.id) || userProfiles?.[0];
        const resolvedName = userProfileData?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const resolvedRole = userProfileData?.role || user.user_metadata?.role || 'Associate';

        setUserName(resolvedName);
        setUserRole(resolvedRole);

        const validProfileIdsArray = Array.from(userProfileIds);

        // Retrieve tasks strictly filtering by assigned_to = user's profile ID
        const { data: tasksData, error: tasksErr } = await supabase
          .from('tasks')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!tasksErr && tasksData) {
          const mappedTasks = tasksData.map(mapDbTaskToUiTask);
          const filteredTasks = mappedTasks.filter(t => t.assigned_to && userProfileIds.has(t.assigned_to));

          setUserTasks(filteredTasks);
          try {
            localStorage.setItem('tp_cached_user_assigned_tasks', JSON.stringify(filteredTasks));
          } catch (e) {
            console.error(e);
          }
        }
      }

      const { data: cpstClientsData } = await supabase.from('cpst_clients').select('id, client_name, birthdate, policy_number');
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
  };

  const saveTasksToCache = (tasksList: TaskItem[]) => {
    try {
      localStorage.setItem('tp_cached_user_assigned_tasks', JSON.stringify(tasksList));
    } catch (err) {
      console.error('Failed to cache tasks:', err);
    }
  };

  const saveTaskField = async (taskId: string, updates: Partial<TaskItem>) => {
    const currentTask = userTasks.find(t => t.id === taskId);

    setUserTasks(prev => {
      const next = prev.map(t => {
        if (t.id === taskId) {
          return { ...t, ...updates, updated_at: new Date().toISOString() };
        }
        return t;
      });
      saveTasksToCache(next);
      return next;
    });

    try {
      const dbUpdates = formatUiTaskToDbUpdates(updates, currentTask);
      dbUpdates.updated_at = new Date().toISOString();

      await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
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
    let activeUserId = currentUserId;
    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id || null;
    }
    if (!activeUserId) return;

    const newDbTask = {
      title: 'Untitled Task',
      description: JSON.stringify({
        notes: '',
        category: 'Others',
        assigned_to: activeUserId,
        processed_by: null
      }),
      status: 'Pending',
      priority: 'High',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('tasks').insert([newDbTask]).select().single();
      if (!error && data) {
        const createdTask = mapDbTaskToUiTask(data);
        setUserTasks(prev => {
          const next = [createdTask, ...prev.filter(t => t.id !== createdTask.id)];
          saveTasksToCache(next);
          return next;
        });
        setSelectedTaskIdForModal(createdTask.id);
      } else {
        const localId = `task-${Date.now()}`;
        const localTask: TaskItem = {
          id: localId,
          title: 'Untitled Task',
          notes: '',
          category: 'Others',
          status: 'Pending',
          completed: false,
          assigned_to: activeUserId,
          processed_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserTasks(prev => {
          const next = [localTask, ...prev];
          saveTasksToCache(next);
          return next;
        });
        setSelectedTaskIdForModal(localId);
      }
    } catch (err) {
      console.error('Error creating new task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setUserTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      saveTasksToCache(next);
      return next;
    });
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('tp_cached_user_assigned_tasks');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserTasks(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let tasksChannel: any;
    const channelId = `realtime-user-tasks-${Math.random().toString(36).slice(2, 9)}`;

    tasksChannel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      if (tasksChannel) {
        supabase.removeChannel(tasksChannel);
      }
    };
  }, []);

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
    const { greeting, period } = resolveGreetingAndPeriod();
    setGreeting(greeting);
    setDayPeriod(period);
    fetchDashboardData();

    const timer = setTimeout(() => setShowSplash(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
      });
      setCurrentDate(dateFormatter.format(now));
      setCurrentTime(timeFormatter.format(now));

      const { greeting, period } = resolveGreetingAndPeriod();
      setGreeting(greeting);
      setDayPeriod(period);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio API Synthesizer for pleasant double chime sound
  const playPomoChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playNote = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.6);
      };
      playNote(587.33, 0);
      playNote(880, 0.2);
    } catch (e) {
      console.error('Audio chime error:', e);
    }
  };

  // Restore Pomodoro state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tp_user_pomodoro');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode && POMODORO_CONFIG[parsed.mode as PomodoroMode]) {
          const mode = parsed.mode as PomodoroMode;
          setPomoMode(mode);
          let rem = typeof parsed.remainingSeconds === 'number' ? parsed.remainingSeconds : POMODORO_CONFIG[mode].duration;
          let isRun = !!parsed.isRunning;

          if (isRun && parsed.lastTimestamp) {
            const elapsed = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
            rem = rem - elapsed;
            if (rem <= 0) {
              rem = 0;
              isRun = false;
              if (mode === 'focus') {
                setPomoCompletedSessions((prev) => (typeof parsed.completedSessions === 'number' ? parsed.completedSessions + 1 : prev + 1));
                setPomoNotice('Pomodoro Complete');
              } else {
                setPomoNotice('Break Finished');
              }
            }
          }
          setPomoSeconds(rem);
          setPomoIsRunning(isRun);
        }
        if (typeof parsed.completedSessions === 'number') {
          setPomoCompletedSessions(parsed.completedSessions);
        }
      }
    } catch (err) {
      console.error('Failed to load Pomodoro state:', err);
    }
  }, []);

  // Save Pomodoro state to LocalStorage
  useEffect(() => {
    try {
      const stateToSave = {
        mode: pomoMode,
        remainingSeconds: pomoSeconds,
        isRunning: pomoIsRunning,
        completedSessions: pomoCompletedSessions,
        lastTimestamp: Date.now()
      };
      localStorage.setItem('tp_user_pomodoro', JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save Pomodoro state:', err);
    }
  }, [pomoMode, pomoSeconds, pomoIsRunning, pomoCompletedSessions]);

  // Pomodoro Countdown Interval lifecycle
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (pomoIsRunning) {
      timerId = setInterval(() => {
        setPomoSeconds((prev) => {
          if (prev <= 1) {
            setPomoIsRunning(false);
            playPomoChime();
            if (pomoMode === 'focus') {
              setPomoCompletedSessions((c) => c + 1);
              setPomoNotice('Pomodoro Complete');
            } else {
              setPomoNotice('Break Finished');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [pomoIsRunning, pomoMode]);

  const handlePomoModeChange = (newMode: PomodoroMode) => {
    setPomoMode(newMode);
    setPomoSeconds(POMODORO_CONFIG[newMode].duration);
    setPomoIsRunning(false);
    setPomoNotice(null);
  };

  const handlePomoReset = () => {
    setPomoSeconds(POMODORO_CONFIG[pomoMode].duration);
    setPomoIsRunning(false);
    setPomoNotice(null);
  };

  const handlePomoSkip = () => {
    setPomoIsRunning(false);
    if (pomoMode === 'focus') {
      handlePomoModeChange('shortBreak');
    } else {
      handlePomoModeChange('focus');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Activity Modal Handlers
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

  const handleSaveActivity = () => {
    if (!activityForm.title.trim() || !activityForm.date) return;
    const newEvent: ActivityEvent = { id: `evt-${Date.now()}`, ...activityForm };
    setActivities((prev) => {
      const next = [newEvent, ...prev];
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

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== selectedEvent.id);
      try {
        localStorage.setItem('tp_user_activities', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    setSelectedEvent(null);
  };

  const filteredActivities = useMemo(() => {
    if (!selectedMiniDate) return activities;
    return activities.filter((act) => act.date === selectedMiniDate);
  }, [activities, selectedMiniDate]);

  const sortedActivities = [...filteredActivities].sort((a, b) => b.date.localeCompare(a.date));
  const selectedTaskForModal = userTasks.find((t) => t.id === selectedTaskIdForModal) || null;

  return (
    <div className={styles.shell} style={{ minHeight: 'auto', background: 'transparent' }}>
      <WelcomeModal userName={userName} role={userRole} />

      {showSplash && (
        <div className={styles.splash}>
          <div className={styles.splashRing}>
            <div className={styles.splashSpin} />
            <div className={styles.splashDot} />
          </div>
          <p className={styles.splashLabel}>Syncing personal dashboard</p>
        </div>
      )}

      <motion.main className={styles.content} style={{ padding: '1rem 0' }} variants={containerVariants} initial="hidden" animate="show">
        {/* 1. HERO SECTION */}
        <motion.section variants={fadeVariants}>
          <DashboardHero
            adminName={userName}
            greeting={greeting}
            dayPeriod={dayPeriod}
            currentDate={currentDate}
            currentTime={currentTime}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            portals={portals}
            customPortals={customPortals}
            pomoMode={pomoMode}
            pomoSeconds={pomoSeconds}
            pomoIsRunning={pomoIsRunning}
            pomoCompletedSessions={pomoCompletedSessions}
            pomoNotice={pomoNotice}
            onPomoModeChange={handlePomoModeChange}
            onPomoTogglePlay={() => {
              setPomoNotice(null);
              setPomoIsRunning(!pomoIsRunning);
            }}
            onPomoReset={handlePomoReset}
            onPomoSkip={handlePomoSkip}
          />
        </motion.section>

        {/* 2. BOARD GRID (3 COLUMNS) */}
        <motion.div variants={fadeVariants} className={styles.boardGrid}>

          {/* Column 1: Client Servicing Monitoring */}
          <div className={styles.boardCol}>
            <TaskList
              tasks={userTasks}
              allProfiles={allProfiles}
              bizDevProfiles={bizDevProfiles}
              onCreateTask={handleCreateTask}
              onToggleComplete={handleToggleCheckbox}
              onSelectTask={(id) => setSelectedTaskIdForModal(id)}
              isUserView={true}
            />
          </div>

          {/* Column 2: Client Birthdays, Calendar of Activities & To-do */}
          <div className={styles.centerCol}>
            <BirthdayCard birthdays={clientBirthdays} />

            <div className={styles.activitiesCard}>
              <div className={styles.dashboardCardHeader}>
                <div className={styles.dashboardCardTitle}>
                  <CalendarDays size={14} strokeWidth={1.8} />
                  <h3>Calendar of Activities</h3>
                </div>

                {selectedMiniDate && (
                  <div className={styles.activityDateFilterBadge}>
                    <span>Date: {selectedMiniDate}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMiniDate(null)}
                      className={styles.clearDateFilterBtn}
                      title="Clear date filter"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.dashboardCardBody}>
                {sortedActivities.length === 0 ? (
                  <div className={styles.emptyStateContainer}>
                    <div className={styles.emptyStateIcon}>📅</div>
                    <div className={styles.emptyStateTitle}>No activities scheduled {selectedMiniDate ? `for ${selectedMiniDate}` : ''}</div>
                    <div className={styles.emptyStateDescription}>Log an activity to manage client schedules.</div>
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {sortedActivities.map((act) => (
                      <ActivityCard
                        key={act.id}
                        activity={act}
                        onSelect={handleEventClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* To-do Widget connected to Client Servicing Monitoring */}
            <ClientServicingToDo
              tasks={userTasks}
              allProfiles={allProfiles}
              bizDevProfiles={bizDevProfiles}
              onToggleComplete={handleToggleCheckbox}
              onSelectTask={(id) => setSelectedTaskIdForModal(id)}
            />
          </div>

          {/* Column 3: Client Servicing Request Forms & Activity Tracker Calendar */}
          <div className={styles.boardCol}>
            <RequestFormsAccordion kpis={kpis} />

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
          </div>
        </motion.div>

        {/* 5. FOOTER */}
        <motion.footer variants={fadeVariants} className={styles.footer}>
          <span>TeamPadua Member Terminal &bull; 2026</span>
          <div className={styles.footerRight}>
            <span className={styles.footerPill}><span className={styles.footerDot} />SLA 99.99%</span>
            <span className={styles.footerPill}><span className={styles.footerDot} />Secure Layer Online</span>
            <span className={styles.footerPill}><span className={styles.footerDot} />{portals.length + customPortals.length} Portals Linked</span>
          </div>
        </motion.footer>
      </motion.main>

      {/* 6. MODALS */}
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
          onSaveField={saveTaskField}
          onDeleteTask={handleDeleteTask}
          onClose={() => setSelectedTaskIdForModal(null)}
          isUserView={true}
        />,
        document.body
      )}
    </div>
  );
}
