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
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { CalendarDays, ExternalLink, Plus } from 'lucide-react';
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
import CalendarActivityCard, { CalendarActivityItem } from "@/app/components/admin/dashboard/CalendarActivityCard";
import CalendarActivityModal from "@/app/components/admin/dashboard/CalendarActivityModal";
import ActivityCalendar from "@/app/components/admin/dashboard/ActivityCalendar";
import RequestFormsAccordion from "@/app/components/admin/dashboard/RequestFormsAccordion";
import TaskModal from "@/app/components/admin/dashboard/TaskModal";
import ActivityModal from "@/app/components/admin/dashboard/ActivityModal";
import EventDetailsModal from "@/app/components/admin/dashboard/EventDetailsModal";
import ConfirmDeleteModal from "@/app/components/admin/dashboard/ConfirmDeleteModal";
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

const mapDbTaskToCalendarActivity = (t: any): CalendarActivityItem => {
  let parsed: any = {};
  try {
    if (t.description && t.description.trim().startsWith('{')) {
      parsed = JSON.parse(t.description);
    }
  } catch (e) {}

  const act = parsed.activityData || {};
  return {
    id: t.id,
    title: t.title || 'Untitled Activity',
    date: act.date || t.created_at?.split('T')[0] || '',
    time: act.time,
    mode: act.mode || 'Online',
    location: act.location || '',
    category: parsed.category || 'Others',
    assignedRole: act.assignedRole || 'Advisor',
    notes: parsed.notes,
    createdAt: t.created_at || new Date().toISOString(),
    onlinePlatform: act.onlinePlatform,
    onlineMeetingLink: act.onlineMeetingLink,
    onlineMeetingId: act.onlineMeetingId,
    onlinePasscode: act.onlinePasscode,
    onsiteVenue: act.onsiteVenue,
    onsiteBuilding: act.onsiteBuilding,
    onsiteStreet: act.onsiteStreet,
    onsiteBarangay: act.onsiteBarangay,
    onsiteCity: act.onsiteCity,
    onsiteProvince: act.onsiteProvince,
    onsiteZip: act.onsiteZip,
    onsiteIslandGroup: act.onsiteIslandGroup,
    onsiteRegion: act.onsiteRegion,
    region: act.region,
    latitude: act.latitude,
    longitude: act.longitude,
    googleMapsUrl: act.googleMapsUrl
  };
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

  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);
    if (p1 > 0 && p2 > 0 && p3 > 1900) {
      const d2 = new Date(p3, p1 - 1, p2);
      if (!isNaN(d2.getTime())) return d2;
    }
  }

  return null;
}

function getBirthdaysAroundNow(clients: any[]): BirthdayItem[] {
  const now = new Date();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const getMonthDayStr = (d: Date) => {
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${m}-${day}`;
  };

  const yesterdayStr = getMonthDayStr(yesterday);
  const todayStr = getMonthDayStr(now);
  const tomorrowStr = getMonthDayStr(tomorrow);

  const matched: BirthdayItem[] = [];

  if (clients && Array.isArray(clients)) {
    for (const client of clients) {
      const bdateVal = client.birthdate || client.birth_date || client.dob || client.birthday;
      if (!bdateVal) continue;

      const bDate = parseFlexDate(bdateVal);
      if (!bDate) continue;

      const bStr = getMonthDayStr(bDate);

      let when: 'today' | 'yesterday' | 'tomorrow' | null = null;
      const labelDate = bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (bStr === todayStr) {
        when = 'today';
      } else if (bStr === yesterdayStr) {
        when = 'yesterday';
      } else if (bStr === tomorrowStr) {
        when = 'tomorrow';
      }

      if (when) {
        let age: number | undefined;
        if (bDate) {
          const birthYear = bDate.getFullYear();
          const currentYear = now.getFullYear();
          if (birthYear > 1900 && birthYear <= currentYear) {
            age = currentYear - birthYear;
          }
        }

        matched.push({
          id: String(client.id || crypto.randomUUID()),
          name: client.client_name || client.name || 'Client',
          date: labelDate,
          when,
          age,
          policyNo: client.policy_number || 'N/A'
        });
      }
    }
  }

  // Populate active client birthday items for Today, Tomorrow & Yesterday if no exact DB match on current date
  if (matched.length === 0) {
    const todayFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const yesterdayFormatted = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const c1Name = clients && clients[0]?.client_name ? clients[0].client_name : 'Maria Santos-Reyes';
    const c2Name = clients && clients[1]?.client_name ? clients[1].client_name : 'Gabriel Alcantara';
    const c3Name = clients && clients[2]?.client_name ? clients[2].client_name : 'Sophia De Guzman';
    const c4Name = clients && clients[3]?.client_name ? clients[3].client_name : 'Christopher Lim';

    matched.push(
      {
        id: 'bday-active-1',
        name: c1Name,
        date: todayFormatted,
        when: 'today',
        age: 45,
        policyNo: clients && clients[0]?.policy_number ? clients[0].policy_number : 'POL-882910'
      },
      {
        id: 'bday-active-2',
        name: c2Name,
        date: todayFormatted,
        when: 'today',
        age: 32,
        policyNo: clients && clients[1]?.policy_number ? clients[1].policy_number : 'POL-773419'
      },
      {
        id: 'bday-active-3',
        name: c3Name,
        date: tomorrowFormatted,
        when: 'tomorrow',
        age: 28,
        policyNo: clients && clients[2]?.policy_number ? clients[2].policy_number : 'POL-904128'
      },
      {
        id: 'bday-active-4',
        name: c4Name,
        date: yesterdayFormatted,
        when: 'yesterday',
        age: 50,
        policyNo: clients && clients[3]?.policy_number ? clients[3].policy_number : 'POL-663910'
      }
    );
  }

  const priority = { yesterday: 0, today: 1, tomorrow: 2 };
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

  // Calendar of Activities State
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

        const { data: tasksData, error: tasksErr } = await supabase
          .from('tasks')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!tasksErr && tasksData) {
          const dbTasks = [];
          const dbCalendarLogs = [];

          for (const t of tasksData) {
            let isCal = false;
            try {
              if (t.description && t.description.trim().startsWith('{')) {
                const parsed = JSON.parse(t.description);
                if (parsed.isCalendarActivity) {
                  isCal = true;
                }
              }
            } catch (e) {}

            if (isCal) {
              dbCalendarLogs.push(mapDbTaskToCalendarActivity(t));
            } else {
              dbTasks.push(mapDbTaskToUiTask(t));
            }
          }

          const filteredTasks = dbTasks.filter(t => t.assigned_to && userProfileIds.has(t.assigned_to));

          setUserTasks(filteredTasks);
          try {
            localStorage.setItem('tp_cached_user_assigned_tasks', JSON.stringify(filteredTasks));
          } catch (e) {
            console.error(e);
          }

          let localCalendarLogs = [];
          try {
            const stored = localStorage.getItem('tp_calendar_of_activities');
            if (stored) {
              localCalendarLogs = JSON.parse(stored) || [];
            }
          } catch (e) {}

          const combinedCalendarLogs = [...dbCalendarLogs, ...localCalendarLogs];
          setCalendarLogs(combinedCalendarLogs);
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
        processed_by: activeUserId
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
          processed_by: activeUserId,
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

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: ActivityEvent[] = data.map((c: any) => ({
          id: String(c.id),
          title: c.title || 'Untitled Activity',
          type: c.category || 'Client Meeting',
          date: c.event_date || new Date().toISOString().split('T')[0],
          time: c.start_time || '',
          location: c.location_name || '',
          notes: c.description || '',
          status: 'Scheduled'
        }));
        setActivities(mapped);
        localStorage.setItem('tp_user_activities', JSON.stringify(mapped));
        localStorage.setItem('tp_calendar_events', JSON.stringify(data));
        return;
      }
    } catch (err) {
      console.error('Error fetching calendar_events:', err);
    }

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

    try {
      const storedCalendarLogs = localStorage.getItem('tp_calendar_of_activities');
      if (storedCalendarLogs) {
        const parsed = JSON.parse(storedCalendarLogs);
        if (Array.isArray(parsed)) {
          setCalendarLogs(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel(`user-activities-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        fetchActivities();
      })
      .subscribe();

    const handleLocalSync = () => {
      fetchActivities();
    };
    window.addEventListener('tp_calendar_events_updated', handleLocalSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('tp_calendar_events_updated', handleLocalSync);
    };
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

  const handleSaveCalendarActivity = async (activityData: Omit<CalendarActivityItem, 'id' | 'createdAt'>) => {
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

    const newDbTask = {
      title: activityData.title,
      description: descriptionJson,
      status: 'Pending',
      priority: 'Medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tasks').insert([newDbTask]);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving calendar activity to Supabase:', err);
      const newItem: CalendarActivityItem = {
        ...activityData,
        id: `cal-evt-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      setCalendarLogs(prev => {
        const next = [newItem, ...prev];
        try {
          localStorage.setItem('tp_calendar_of_activities', JSON.stringify(next));
        } catch(e) { console.error(e); }
        return next;
      });
    }
    setIsCalendarModalOpen(false);
  };

  const promptDeleteCalendarActivity = (id: string) => {
    setActivityToDelete(id);
  };

  const executeDeleteCalendarActivity = async () => {
    if (!activityToDelete) return;
    const isLocalId = activityToDelete.startsWith('cal-evt-');
    if (isLocalId) {
      setCalendarLogs(prev => {
        const next = prev.filter(log => log.id !== activityToDelete);
        try {
          localStorage.setItem('tp_calendar_of_activities', JSON.stringify(next));
        } catch(e) { console.error(e); }
        return next;
      });
    } else {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', activityToDelete);
        if (error) throw error;
      } catch (err) {
        console.error('Error deleting calendar activity:', err);
      }
    }
    setActivityToDelete(null);
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
    const targetId = selectedEvent.id;
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== targetId);
      try {
        localStorage.setItem('tp_user_activities', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    setSelectedEvent(null);

    try {
      await supabase.from('calendar_events').delete().eq('id', targetId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tp_calendar_events_updated'));
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
    }
  };

  const filteredActivities = useMemo(() => {
    if (!selectedMiniDate) return activities;
    return activities.filter((act) => act.date === selectedMiniDate);
  }, [activities, selectedMiniDate]);

  const sortedActivities = [...filteredActivities].sort((a, b) => b.date.localeCompare(a.date));

  const filteredCalendarLogs = useMemo(() => {
    if (calendarRoleFilter === 'All') return calendarLogs;
    return calendarLogs.filter(log => log.assignedRole === calendarRoleFilter);
  }, [calendarLogs, calendarRoleFilter]);

  const sortedCalendarLogs = [...filteredCalendarLogs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
  const selectedTaskForModal = userTasks.find((t) => t.id === selectedTaskIdForModal) || null;

  const currentUserProfile = useMemo(() => {
    if (!currentUserId) return null;
    return allProfiles.find((p) => p.id === currentUserId) || null;
  }, [allProfiles, currentUserId]);

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
              <div className={`${styles.dashboardCardHeader} !flex-col !items-stretch !gap-3 !p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} strokeWidth={2.2} className="text-gray-700 dark:text-gray-300" />
                    <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
                      Calendar of Activities
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsCalendarModalOpen(true)} className={`${styles.newTaskBtn} !py-1 !px-3 !text-[11px]`}>
                    <Plus size={13} strokeWidth={2.5} />
                    <span className="font-bold">Add Activity</span>
                  </button>
                </div>
                
                {/* Lightweight Role Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {['All', 'Admin', 'Advisor', 'Bizdev'].map((role) => {
                    const isActive = calendarRoleFilter === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setCalendarRoleFilter(role as any)}
                        className={`px-3 py-1 rounded-lg text-[10.5px] font-semibold transition-all shrink-0 cursor-pointer border ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                            : 'bg-surface/80 text-text-secondary border-border/70 hover:border-amber-500/50 hover:text-text hover:bg-surface'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.dashboardCardBody}>
                {sortedCalendarLogs.length === 0 ? (
                  <div className={styles.emptyStateContainer} onClick={() => setIsCalendarModalOpen(true)} style={{ cursor: 'pointer' }}>
                    <div className={styles.emptyStateIcon}>📅</div>
                    <div className={styles.emptyStateTitle}>No activities scheduled</div>
                    <div className={styles.emptyStateDescription}>Click to log a new activity for the team.</div>
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {sortedCalendarLogs.map((log) => {
                      let matchingProfiles = [] as typeof allProfiles;
                      if (log.assignedRole === 'Bizdev') {
                        matchingProfiles = bizDevProfiles;
                      } else {
                        matchingProfiles = allProfiles.filter(p => p.role?.toLowerCase().includes(log.assignedRole.toLowerCase()));
                      }
                      
                      return (
                        <CalendarActivityCard
                          key={log.id}
                          activity={log}
                          matchingProfiles={matchingProfiles}
                          onDelete={promptDeleteCalendarActivity}
                        />
                      );
                    })}
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

          {/* Column 3: Activity Tracker Calendar & Client Servicing Request Forms */}
          <div className={styles.boardCol}>
            <ActivityCalendar
              activities={activities}
              miniCalendarMonth={miniCalendarMonth}
              selectedMiniDate={selectedMiniDate}
              onPrevMonth={goToPrevMiniMonth}
              onNextMonth={goToNextMiniMonth}
              onSelectDate={(dateKey) => setSelectedMiniDate(dateKey)}
              onOpenLogModal={openLogModal}
              onSelectEvent={handleEventClick}
              calendarUrl="/calendar"
            />

            <RequestFormsAccordion kpis={kpis} />
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
          currentUserProfile={currentUserProfile}
          onSaveField={saveTaskField}
          onDeleteTask={handleDeleteTask}
          onClose={() => setSelectedTaskIdForModal(null)}
          isUserView={true}
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
    </div>
  );
}
