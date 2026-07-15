'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Clock,
  MapPin, X, Search, Sparkles, Menu, AlignLeft, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/app/lib/supabase/client';
import styles from '@/styles/components/calendar/CalendarContent.module.css';

type ViewMode = 'Month' | 'Week' | 'Day' | 'Agenda' | 'Gallery' | 'Timeline' | 'Year' | 'Quarter';

type Category = string;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  category: Category;
  module_source?: 'manual' | 'tasks' | 'attendance' | 'cpst' | 'acr' | 'birthdays';
}

const DEFAULT_CATEGORIES: Category[] = [
  "Client Meeting",
  "Client Follow-up",
  "Client Call",
  "Financial Consultation",
  "Policy Review",
  "Premium Reminder",
  "Document Processing",
  "Policy Delivery",
  "Birthday Greeting",
  "Welcome Call",
  "Team Meeting",
  "Training",
  "Business Development",
  "Administrative Task",
  "Task",
  "Reminder",
  "Leave",
  "Holiday",
  "Other"
];

const VIEW_MODES: ViewMode[] = ['Month', 'Week', 'Day', 'Agenda', 'Gallery', 'Timeline', 'Year', 'Quarter'];

const CONFETTI_COLORS = ['#ff007f', '#ffaa00', '#00ffaa', '#00aaff', '#cc00ff', '#f4c542'];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LABELS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6);

const catClass = (cat: Category) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('meeting') || c.includes('consultation')) return styles.catMeeting;
  if (c.includes('birthday') || c.includes('greeting')) return styles.catBirthday;
  if (c.includes('client') || c.includes('call')) return styles.catClient;
  if (c.includes('deadline') || c.includes('reminder')) return styles.catDeadline;
  if (c.includes('holiday') || c.includes('leave')) return styles.catHoliday;
  if (c.includes('interview') || c.includes('training')) return styles.catInterview;
  if (c.includes('processing') || c.includes('delivery')) return styles.catAcr;
  if (c.includes('task') || c.includes('admin')) return styles.catTask;
  return styles.catMeeting; // fallback
};

const formatAMPM = (timeStr: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hInt = parseInt(h, 10);
  const ampm = hInt >= 12 ? 'PM' : 'AM';
  const h12 = hInt % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

const DEFAULT_EVENTS: CalendarEvent[] = [
  { id: 't1', title: 'Monthly Team Planning', event_date: '2026-07-09', start_time: '14:00', end_time: '15:00', category: 'Meeting', description: 'Review operational performance metrics' },
  { id: 't2', title: 'Client Servicing Alignment', event_date: '2026-07-10', start_time: '10:30', end_time: '11:30', category: 'Client', description: 'Discuss CPST and ACR synchronization items' },
  { id: 't3', title: 'Juan Dela Cruz - Birthday', event_date: '2026-07-09', category: 'Birthday' },
  { id: 't4', title: 'ACR Deadline Submission', event_date: '2026-07-11', category: 'Deadline' },
  { id: 't5', title: 'Time In Matchup Audit', event_date: '2026-07-09', start_time: '08:00', end_time: '09:00', category: 'Attendance' }
];

interface CalendarContentProps {
  title: string;
  subtitle: string;
}

export default function CalendarContent({ title, subtitle }: CalendarContentProps): React.JSX.Element {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/admin/');
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    category: 'Client Meeting', start_time: '', end_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [selectedYearMonth, setSelectedYearMonth] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedEvent, setCelebratedEvent] = useState<CalendarEvent | null>(null);
  const [isEditCelebration, setIsEditCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [smartScheduleQuery, setSmartScheduleQuery] = useState('');
  const [smartScheduling, setSmartScheduling] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAISmartSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartScheduleQuery.trim()) return;
    setSmartScheduling(true);
    try {
      const prompt = `Parse this calendar event into JSON: "${smartScheduleQuery}". The JSON must have exactly these keys: title (string), event_date (YYYY-MM-DD), start_time (HH:MM 24-hr format if provided), category (choose one: Meeting, Birthday, Client, Deadline, Holiday, Interview, Task, Attendance, ACR). If no date provided, assume ${new Date().toISOString().split('T')[0]}. Output ONLY valid JSON without markdown formatting.`;
      
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      try {
        const parsedText = data.reply.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(parsedText);
        
        setNewEvent({
          title: parsed.title || '',
          event_date: parsed.event_date || new Date().toISOString().split('T')[0],
          start_time: parsed.start_time || '',
          end_time: '',
          category: parsed.category || 'Meeting'
        });
        setEditingId(null);
        setShowAddModal(true);
        setSmartScheduleQuery('');
      } catch (err) {
        showToast('Could not parse AI response. Please try again.');
      }
      
    } catch {
      showToast('Error connecting to AI service.');
    } finally {
      setSmartScheduling(false);
    }
  };

  const handleGenerateDescription = async () => {
    const category = newEvent.category || 'Meeting';
    setGeneratingDesc(true);
    
    const fallbacks: Record<Category, string[]> = {
      Meeting: [
        "Reviewing advisor performance metrics and coordinating regional recruitment pipelines.",
        "Discussing auto-charge setups and policy switching requests for key clients.",
        "Strategic sync on digital tools and mentorship program expansion plans.",
        "Client case alignment and change request review with the coordinator.",
        "Quarterly business review and planning for branch production goals."
      ],
      Birthday: [
        "Prepare birthday greetings and coordinate welcome gifts for celebrates.",
        "Send personalized card and policy anniversary note to the client.",
        "Coordinate birthday client outreach log and greeting checkups.",
        "Execute automated birthday SMS greetings scheduler check.",
        "Deliver a warm birthday token and plan policy checkups."
      ],
      Client: [
        "Aligning on portfolio allocations and policy card updates.",
        "Processing beneficiary realignments and change request logs.",
        "Conducting comprehensive policy review session for family coverage.",
        "Onboarding new advisor reassignment request for active policies.",
        "Drafting personalized advisory notes and financial growth plan review."
      ],
      Deadline: [
        "Submit all advisor change request (ACR) documents to the unit office.",
        "Verify premium updates and grace period logs before billing run.",
        "Reinstatement validation and document upload final check.",
        "Recruitment metrics reporting and intern cohort onboarding checklist.",
        "Upload all signed switching forms to central database storage."
      ],
      Holiday: [
        "Sun Life operational holiday - advisor servicing systems on auto-reply.",
        "National non-working holiday. Emergency request routing active.",
        "System maintenance window and database index verification.",
        "Team rest day - client communications queued for next working day.",
        "End of year holiday. Standard operations resume on next weekday."
      ],
      Interview: [
        "Evaluate candidate for the Advisor Support Associate internship position.",
        "Recruitment cohort screening and initial mentorship program sync.",
        "Unit coordinator interview for prospective financial advisor leads.",
        "Final interview panel for business support associate applicants.",
        "Recruiting coordination call and screening feedback review."
      ],
      Task: [
        "Onboarding new advisor credentials and system permissions.",
        "Reconciling premium payments and updating grace period calendar logs.",
        "Archiving signed change requests and document scan validation.",
        "Generate monthly client engagement logs and activity report.",
        "Verify auto-charge arrangements and upload confirmation files."
      ],
      Attendance: [
        "Daily attendance log and operational sync meeting kickoff.",
        "Weekly branch status sync and activity check-in.",
        "Mentor-advisor coordination check and shift validation.",
        "Quarterly internship attendance review and onboarding check.",
        "Log hours and submit performance sheets for unit tracking."
      ],
      ACR: [
        "Audit advisor change requests and update active assignees.",
        "Verify reassignment consent documents and log system changes.",
        "Sync realigned clients list with Sun Life portal system database.",
        "Process pending advisor reassignment queues for client policy cards.",
        "Prepare transition logs for realigned policyholders."
      ]
    };

    const list = fallbacks[category] || fallbacks['Meeting'];
    const randomFallback = list[Math.floor(Math.random() * list.length)];

    try {
      const prompt = `Generate a short, professional, friendly 1-sentence description for a calendar event under the category: "${category}". Keep it focused on client servicing, advisory workflow, or Sun Life operational context. Do not mention code, databases, or tech stacks.`;
      
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.reply) {
        setNewEvent(p => ({ ...p, description: data.reply.trim() }));
      } else {
        setNewEvent(p => ({ ...p, description: randomFallback }));
      }
    } catch {
      setNewEvent(p => ({ ...p, description: randomFallback }));
    } finally {
      setGeneratingDesc(false);
    }
  };

  const generateCelebrationMessage = async (category: Category, title: string) => {
    const categorySuccessMessages: Record<Category, string[]> = {
      Meeting: [
        "Great sync session logged! Let's translate these notes into advisor production. 🤝",
        "Meeting successfully scheduled. Productive team alignments are the key to BizDev success! 📈",
        "Collaboration is power! Your team sync session is now on the master calendar. 🌟",
        "Meeting logged! Operational excellence starts with clear scheduling. 📅",
        "Strategy meeting booked. Ready to align our goals and support the advisory practice! 🚀"
      ],
      Birthday: [
        "Happy birthday tracker logged! Time to celebrate our valued clients and team members. 🎂",
        "Birthday added! Let's make their special day memorable with warm greetings and care. 🎈",
        "Special day logged. Make sure to schedule client birthday outreach messages! 🎉",
        "Birthday reminder saved. Connecting with clients on their special day builds lifelong trust! ❤️",
        "Celebration logged! Prepare the greetings template and bring a smile to their day. 🎁"
      ],
      Client: [
        "Client review logged! Helping our clients achieve financial security is our core mission. 💼",
        "Advisory session scheduled. Client trust is built one meaningful conversation at a time. ✨",
        "Portfolio sync logged. Delivering excellent financial support is what we do best! 💛",
        "Client servicing log added. Keep up the high-touch servicing and strategic advice! 🎯",
        "Client meeting successfully scheduled. Strong client relations lead to lifetime security. 🤝"
      ],
      Deadline: [
        "Deadline tracker logged. Action fast and stay focused to get these filings finalized! ⚡",
        "Deadline added. Staying ahead of schedule keeps our operations running smoothly! ⏰",
        "Important milestone logged. Clear scheduling helps us execute advisor goals on time! 🏁",
        "Operational deadline saved. Keep up the great pace to ensure zero processing friction. 📁",
        "Filing deadline logged. Let's get the paperwork checked, approved, and submitted! 📝"
      ],
      Holiday: [
        "Holiday logged! Time for a well-deserved rest and rejuvenation. Enjoy the break! 🌴",
        "Operational break scheduled. Resting is just as important as working hard! ☕",
        "Holiday marked. Hope everyone has a peaceful, relaxing, and pleasant day off! ☀️",
        "Vacation day saved. Take some time to disconnect, unwind, and recharge! 🌊",
        "Public holiday logged. Master calendar updated to reflect operational break hours. 🍂"
      ],
      Interview: [
        "Interview scheduled! Let's welcome the next wave of talent to the internship cohort. 🎓",
        "Intern screening logged. Nurturing future leaders starts with the very first chat! 💡",
        "Recruiting call added. Finding the right talent drives Team Padua's operational success. 🔍",
        "Coordinator interview saved. Let's make candidate onboarding smooth and inspiring! 🤝",
        "Candidate talk logged. Looking forward to reviewing their skills and advisor sync fit. 👥"
      ],
      Task: [
        "Task successfully added. Checking off items on our list keeps the office running like clockwork! ⚙️",
        "Action item saved. Stay focused, work smart, and complete it with high quality! 🛠️",
        "Productivity task logged. Every single checked item moves our business development goals forward! 🚀",
        "Workspace task scheduled. Clear priorities lead to high-level business results! 📊",
        "Task logged. Let's tackle it efficiently and keep up the high momentum! ⚡"
      ],
      Attendance: [
        "Attendance sync scheduled. Thank you for maintaining operational check-in accountability! 🔑",
        "Daily attendance slot logged. Synchronization keeps our support teams perfectly aligned. 👥",
        "Log verified. Building operational transparency helps us support financial advisors best. 📊",
        "Weekly check-in logged. High productivity is built on continuous team presence! 🏃",
        "Shift slots added. Looking forward to a highly productive and collaborative schedule. 🗓️"
      ],
      ACR: [
        "Advisor Change Request (ACR) logged. Ensuring smooth policy realignments maintains client confidence! 🔄",
        "Advisor reassignment scheduled. Proper transition tracking guarantees zero client servicing gaps. 🛡️",
        "ACR slot saved. Fast, organized realignments are a key part of operational support. 🗂️",
        "Policy alignment log added. Client support remains steady during advisor realignments. 🤝",
        "Reassignment log logged. Helping advisors transition files is critical for our BizDev workflow. 📂"
      ]
    };

    const c = (category || '').toLowerCase();
    let matchedKey: Category = 'Meeting';
    if (c.includes('meeting') || c.includes('consultation')) matchedKey = 'Meeting';
    else if (c.includes('birthday') || c.includes('greeting')) matchedKey = 'Birthday';
    else if (c.includes('client') || c.includes('call')) matchedKey = 'Client';
    else if (c.includes('deadline') || c.includes('reminder')) matchedKey = 'Deadline';
    else if (c.includes('holiday') || c.includes('leave')) matchedKey = 'Holiday';
    else if (c.includes('interview') || c.includes('training')) matchedKey = 'Interview';
    else if (c.includes('task') || c.includes('admin')) matchedKey = 'Task';
    else if (c.includes('attendance')) matchedKey = 'Attendance';
    else if (c.includes('processing') || c.includes('delivery') || c.includes('acr')) matchedKey = 'ACR';

    const options = categorySuccessMessages[matchedKey];
    let successMessage = options[Math.floor(Math.random() * options.length)];
    setCelebrationMessage(successMessage);

    try {
      const prompt = `Generate a short 1-sentence celebration or notification text for logging a calendar event. Category: "${category}", Title: "${title}". Make it professional, friendly, and highly category-specific (e.g. if category is Birthday, say Happy Birthday or celebrate the client). Do not include markdown or quotes. Keep it brief.`;
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) setCelebrationMessage(data.reply.trim());
      }
    } catch {}
  };

  const handleAddCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('Category already exists.');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setSelectedCategories(updated);
    localStorage.setItem('tp_calendar_categories', JSON.stringify(updated));
    setNewCategoryName('');
    showToast('Category added.');
  };

  const handleDeleteCategory = (name: string) => {
    if (categories.length <= 1) {
      showToast('At least one category is required.');
      return;
    }
    const updated = categories.filter(c => c !== name);
    setCategories(updated);
    setSelectedCategories(updated);
    localStorage.setItem('tp_calendar_categories', JSON.stringify(updated));
    if (newEvent.category === name) {
      setNewEvent(p => ({ ...p, category: updated[0] }));
    }
    showToast('Category deleted.');
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      setEvents(data && data.length ? data : DEFAULT_EVENTS);
    } catch {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('tp_calendar_events') : null;
      if (saved) {
        setEvents(JSON.parse(saved));
      } else {
        setEvents(DEFAULT_EVENTS);
        localStorage.setItem('tp_calendar_events', JSON.stringify(DEFAULT_EVENTS));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const subscription = supabase
      .channel('calendar_events_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, payload => {
        fetchEvents();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchEvents]);

  useEffect(() => {
    const savedCats = localStorage.getItem('tp_calendar_categories');
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats);
        setCategories(parsed);
        setSelectedCategories(parsed);
      } catch {}
    } else {
      localStorage.setItem('tp_calendar_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAddModal(currentDate.toISOString().split('T')[0]);
      }
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setSelectedEvent(null);
        setSelectedYearMonth(null);
        setSidebarOpen(false);
        setShowViewDropdown(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showViewDropdown) return;
    const handler = () => setShowViewDropdown(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showViewDropdown]);

  const openAddModal = (dateStr: string) => {
    setEditingId(null);
    setNewEvent({ event_date: dateStr, category: 'Meeting', start_time: '', end_time: '' });
    setShowAddModal(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEditingId(ev.id);
    setNewEvent({ ...ev });
    setSelectedEvent(null);
    setShowAddModal(true);
  };

  const persistLocal = (list: CalendarEvent[]) => {
    setEvents(list);
    localStorage.setItem('tp_calendar_events', JSON.stringify(list));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date) return;

    const payload = {
      title: newEvent.title,
      description: newEvent.description || '',
      event_date: newEvent.event_date,
      end_date: newEvent.event_date,
      start_time: newEvent.start_time || '',
      end_time: newEvent.end_time || '',
      location_name: newEvent.location_name || '',
      category: newEvent.category || 'Meeting'
    };

    if (editingId) {
      let updatedObj: CalendarEvent | null = null;
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (error) throw error;
        updatedObj = data as CalendarEvent;
        setEvents(prev => prev.map(ev => (ev.id === editingId ? updatedObj! : ev)));
        showToast('Event updated successfully.');

        // Trigger notification
        await supabase.from('notifications').insert({
          title: "📅 Calendar Event Modified! 🔄",
          description: `The event "${payload.title}" scheduled for ${payload.event_date} has been updated.`,
          type: "calendar",
        });
      } catch {
        updatedObj = { ...payload, id: editingId } as CalendarEvent;
        const updated = events.map(ev => (ev.id === editingId ? updatedObj! : ev));
        persistLocal(updated);
        showToast('Updated event locally.');
      }
      if (updatedObj) {
        setCelebratedEvent(updatedObj);
        setIsEditCelebration(true);
        generateCelebrationMessage(updatedObj.category, updatedObj.title);
        setShowCelebration(true);
      }
    } else {
      let createdObj: CalendarEvent | null = null;
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          createdObj = data as CalendarEvent;
          setEvents(prev => [...prev, createdObj!]);
          showToast('Event scheduled successfully.');

          // Trigger notification
          await supabase.from('notifications').insert({
            title: "📅 New Calendar Event Scheduled! 🎉",
            description: `"${payload.title}" has been scheduled for ${payload.event_date} at ${payload.start_time || '00:00'}.`,
            type: "calendar",
          });
        }
      } catch {
        createdObj = { ...payload, id: String(Date.now()) } as CalendarEvent;
        persistLocal([...events, createdObj]);
        showToast('Scheduled event locally.');
      }
      if (createdObj) {
        setCelebratedEvent(createdObj);
        setIsEditCelebration(false);
        generateCelebrationMessage(createdObj.category, createdObj.title);
        setShowCelebration(true);
      }
    }
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleDeleteEvent = (id: string) => {
    setDeleteEventId(id);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteEvent = async () => {
    if (!deleteEventId) return;
    const id = deleteEventId;
    setDeleteConfirmOpen(false);
    setDeleteEventId(null);
    const targetEvent = events.find(ev => ev.id === id);
    const eventTitle = targetEvent?.title ? `"${targetEvent.title}"` : "A calendar event";

    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(ev => ev.id !== id));
      showToast('Event discarded.');

      // Trigger notification
      await supabase.from('notifications').insert({
        title: "📅 Calendar Event Discarded ❌",
        description: `${eventTitle} has been removed from the schedule.`,
        type: "calendar",
      });
    } catch {
      persistLocal(events.filter(ev => ev.id !== id));
      showToast('Discarded event locally.');
    }
    setSelectedEvent(null);
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return events.filter(ev => {
      const matchesCategory = selectedCategories.includes(ev.category);
      const matchesSearch = !q || ev.title.toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [events, selectedCategories, searchQuery]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filteredEvents) {
      const list = map.get(ev.event_date) || [];
      list.push(ev);
      map.set(ev.event_date, list);
    }
    for (const list of map.values()) list.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return map;
  }, [filteredEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const goPrev = () => {
    if (viewMode === 'Week') setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    else if (viewMode === 'Day') setCurrentDate(new Date(currentDate.getTime() - 86400000));
    else if (viewMode === 'Year') setCurrentDate(new Date(year - 1, month, 1));
    else if (viewMode === 'Quarter') setCurrentDate(new Date(year, month - 3, 1));
    else setCurrentDate(new Date(year, month - 1, 1));
  };

  const goNext = () => {
    if (viewMode === 'Week') setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    else if (viewMode === 'Day') setCurrentDate(new Date(currentDate.getTime() + 86400000));
    else if (viewMode === 'Year') setCurrentDate(new Date(year + 1, month, 1));
    else if (viewMode === 'Quarter') setCurrentDate(new Date(year, month + 3, 1));
    else setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (viewMode === 'Year') return `${year}`;
    if (viewMode === 'Week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleString('default', { month: 'short', day: 'numeric' })} – ${end.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (viewMode === 'Day') return currentDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (viewMode === 'Quarter') {
      const endMonth = new Date(year, month + 2, 1);
      return `${currentDate.toLocaleString('default', { month: 'short' })} – ${endMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [viewMode, currentDate, year, month]);

  const getMonthMetrics = useCallback((mIdx: number, yr = year) => {
    const monthEvs = filteredEvents.filter(e => {
      const d = new Date(e.event_date);
      return d.getFullYear() === yr && d.getMonth() === mIdx;
    });
    return {
      total: monthEvs.length,
      birthdays: monthEvs.filter(e => e.category === 'Birthday').length,
      tasks: monthEvs.filter(e => e.category === 'Task').length,
      meetings: monthEvs.filter(e => e.category === 'Meeting').length,
      holidays: monthEvs.filter(e => e.category === 'Holiday').length
    };
  }, [filteredEvents, year]);

  const renderMiniGrid = (targetYear: number, targetMonth: number, size: 'sm' | 'lg') => {
    const total = daysInMonth(targetYear, targetMonth);
    const first = firstDayOfMonth(targetYear, targetMonth);
    const cells: (number | null)[] = Array(first).fill(null).concat(Array.from({ length: total }, (_, i) => i + 1));
    const dayCls = size === 'sm' ? styles.yearMiniDay : styles.quarterDay;
    const emptyCls = size === 'sm' ? styles.yearMiniDayEmpty : styles.quarterDayEmpty;
    const todayCls = size === 'sm' ? styles.yearMiniDayToday : styles.quarterDayToday;
    const dotCls = size === 'sm' ? styles.yearMiniDayDot : styles.quarterDayDot;

    return (
      <div className={size === 'sm' ? styles.yearMiniGrid : styles.quarterGrid}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className={`${dayCls} ${emptyCls}`} />;
          const dStr = toDateStr(targetYear, targetMonth, day);
          const hasEvents = eventsByDate.has(dStr);
          const isToday = isSameDay(today, new Date(targetYear, targetMonth, day));
          return (
            <div
              key={`d-${day}`}
              onClick={(e) => { e.stopPropagation(); openAddModal(dStr); }}
              className={`${dayCls} ${isToday ? todayCls : ''}`}
            >
              {day}
              {hasEvents && <span className={dotCls} />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const total = daysInMonth(year, month);
    const first = firstDayOfMonth(year, month);
    const cells = Array(first).fill(null).concat(Array.from({ length: total }, (_, i) => i + 1));

    return (
      <>
        <div className={styles.weekdaysRow}>
          {WEEKDAY_LABELS_LONG.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className={styles.monthGrid}>
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className={styles.dayCellEmpty} />;
            const dateStr = toDateStr(year, month, day);
            const isToday = isSameDay(today, new Date(year, month, day));
            const dayEvents = eventsByDate.get(dateStr) || [];
            return (
              <div
                key={`d-${day}`}
                onClick={() => openAddModal(dateStr)}
                className={`${styles.dayCell} ${isToday ? styles.dayCellToday : ''}`}
              >
                <span className={styles.dayNumber}>{day}</span>

                <div className={styles.dayEvents}>
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      className={`${styles.eventChip} ${catClass(ev.category)}`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={styles.eventOverflow}>+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderWeekView = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className={styles.weekView}>
        {days.map((d, i) => {
          const dateStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
          const isToday = isSameDay(today, d);
          const dayEvents = eventsByDate.get(dateStr) || [];
          return (
            <div key={i} className={`${styles.weekColumn} ${isToday ? styles.weekColumnToday : ''}`} onClick={() => openAddModal(dateStr)}>
              <div className={styles.weekColumnHeader}>
                <div className={styles.weekColumnDay}>{WEEKDAY_LABELS_LONG[i]}</div>
                <div className={styles.weekColumnDate}>{d.getDate()}</div>
                <time dateTime={dateStr}>{dateStr}</time>
              </div>


              <div className={styles.weekEventList}>
                {dayEvents.length === 0 && <span className={styles.emptyStateSub}>No events</span>}
                {dayEvents.map(ev => (
                  <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }} className={`${styles.weekEvent} ${catClass(ev.category)}`}>
                    {ev.start_time && <span className={styles.weekEventTime}>{ev.start_time}</span>}
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = toDateStr(year, month, currentDate.getDate());
    const dayEvents = eventsByDate.get(dateStr) || [];
    const timed = dayEvents.filter(e => e.start_time);
    const untimed = dayEvents.filter(e => !e.start_time);

    return (
      <div className={styles.dayView}>
        <div className={styles.dayViewHeader}>
          <span className={styles.dayViewDate}>{currentDate.getDate()}</span>
          <span className={styles.dayViewSub}>{dayEvents.length} scheduled item{dayEvents.length === 1 ? '' : 's'}</span>
        </div>
        {untimed.length > 0 && (
          <div className={styles.dayEvents}>
            {untimed.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`${styles.hourEvent} ${catClass(ev.category)}`}>{ev.title}</div>
            ))}
          </div>
        )}
        <div className={styles.hourGrid}>
          {HOURS.map(h => {
            const label = h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
            const hourEvents = timed.filter(e => parseInt((e.start_time || '0:0').split(':')[0], 10) === h);
            return (
              <div key={h} className={styles.hourRow}>
                <div className={styles.hourLabel}>{label}</div>
                <div className={styles.hourSlot} onClick={() => openAddModal(dateStr)}>
                  {hourEvents.map(ev => (
                    <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }} className={`${styles.hourEvent} ${catClass(ev.category)}`}>
                      {ev.start_time} · {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const upcoming = [...filteredEvents]
      .sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.start_time || '').localeCompare(b.start_time || ''))
      .filter(e => e.event_date >= toDateStr(year, month, 1));
    const grouped = new Map<string, CalendarEvent[]>();
    for (const ev of upcoming) {
      const list = grouped.get(ev.event_date) || [];
      list.push(ev);
      grouped.set(ev.event_date, list);
    }

    if (grouped.size === 0) {
      return (
        <div className={styles.emptyState}>
          <AlignLeft size={26} />
          <span className={styles.emptyStateTitle}>Nothing scheduled</span>
          <span className={styles.emptyStateSub}>Events from this month onward will appear here.</span>
        </div>
      );
    }

    return (
      <div className={styles.agendaView}>
        {Array.from(grouped.entries()).map(([dateStr, evs]) => {
          const d = new Date(dateStr);
          return (
            <div key={dateStr} className={styles.agendaGroup}>
              <div className={styles.agendaDateHeader}>
                <span className={styles.agendaDateBadge}>{d.toLocaleString('default', { day: 'numeric' })}</span>
                {d.toLocaleString('default', { weekday: 'long', month: 'long', year: 'numeric' })}
              </div>
              {evs.map(ev => (
                <div key={ev.id} className={styles.agendaEvent} onClick={() => setSelectedEvent(ev)}>
                  <span className={`${styles.agendaEventDot} ${catClass(ev.category)}`} />
                  <div>
                    <div className={styles.agendaEventTitle}>{ev.title}</div>
                    <div className={styles.agendaEventMeta}>{ev.category}{ev.location_name ? ` · ${ev.location_name}` : ''}</div>
                  </div>
                  {ev.start_time && <span className={styles.agendaEventTime}>{ev.start_time}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimelineView = () => {
    const total = daysInMonth(year, month);
    const days = Array.from({ length: total }, (_, i) => i + 1);
    const activeCategories = categories.filter(cat => filteredEvents.some(e => {
      const d = new Date(e.event_date);
      return e.category === cat && d.getFullYear() === year && d.getMonth() === month;
    }));

    if (activeCategories.length === 0) {
      return (
        <div className={styles.emptyState}>
          <CalendarDays size={26} />
          <span className={styles.emptyStateTitle}>No activity this month</span>
          <span className={styles.emptyStateSub}>Adjust filters or add an event to populate the timeline.</span>
        </div>
      );
    }

    return (
      <div className={styles.timelineView}>
        <div className={styles.timelineDays}>
          {days.map(day => (
            <div key={day} className={`${styles.timelineDayLabel} ${isSameDay(today, new Date(year, month, day)) ? styles.timelineDayLabelToday : ''}`}>{day}</div>
          ))}
        </div>
        {activeCategories.map(cat => (
          <div key={cat} className={styles.timelineRow}>
            <div className={styles.timelineRowLabel}>
              <span className={`${styles.filterDot} ${catClass(cat)}`} />
              {cat}
            </div>
            <div className={styles.timelineTrack}>
              {days.map(day => {
                const dStr = toDateStr(year, month, day);
                const has = (eventsByDate.get(dStr) || []).some(e => e.category === cat);
                const ev = (eventsByDate.get(dStr) || []).find(e => e.category === cat);
                return (
                  <div key={day} className={styles.timelineCell}>
                    {has && <span className={`${styles.timelineDot} ${catClass(cat)}`} onClick={() => ev && setSelectedEvent(ev)} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuarterView = () => (
    <div className={styles.quarterView}>
      {[0, 1, 2].map(offset => {
        const d = new Date(year, month + offset, 1);
        return (
          <div key={offset} className={styles.quarterMonth}>
            <div className={styles.quarterMonthTitle}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            <div className={styles.quarterGridHead}>{WEEKDAY_LABELS.map((w, i) => <div key={i}>{w}</div>)}</div>
            {renderMiniGrid(d.getFullYear(), d.getMonth(), 'lg')}
          </div>
        );
      })}
    </div>
  );

  const renderGalleryView = () => (
    <div className={styles.galleryView}>
      {Array.from({ length: 6 }, (_, offset) => {
        const d = new Date(year, month + offset, 1);
        const tYear = d.getFullYear();
        const tMonth = d.getMonth();
        const total = daysInMonth(tYear, tMonth);
        const first = firstDayOfMonth(tYear, tMonth);
        return (
          <div key={offset} className={styles.galleryMonth}>
            <div className={styles.galleryMonthTitle}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            <div className={styles.galleryGridHead}>{WEEKDAY_LABELS_LONG.map(w => <div key={w}>{w}</div>)}</div>
            <div className={styles.galleryGrid}>
              {Array(first).fill(null).map((_, idx) => <div key={`e-${idx}`} className={styles.galleryDayEmpty} />)}
              {Array.from({ length: total }, (_, i) => i + 1).map(day => {
                const dateStr = toDateStr(tYear, tMonth, day);
                const dayEvents = eventsByDate.get(dateStr) || [];
                return (
                  <div key={day} className={styles.galleryDay} onClick={() => openAddModal(dateStr)}>
                    <span className={styles.galleryDayNum}>{day}</span>
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }} className={`${styles.galleryDayEvent} ${catClass(e.category)}`}>{e.title}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderYearView = () => (
    <div className={styles.yearGrid}>
      {Array.from({ length: 12 }).map((_, mIdx) => {
        const metrics = getMonthMetrics(mIdx);
        const isHovered = hoveredMonth === mIdx;
        return (
          <div
            key={mIdx}
            onMouseEnter={() => setHoveredMonth(mIdx)}
            onMouseLeave={() => setHoveredMonth(null)}
            onClick={() => { setSelectedYearMonth(mIdx); setCurrentDate(new Date(year, mIdx, 1)); }}
            className={`${styles.yearMonthCard} ${isHovered ? styles.yearMonthCardHovered : ''}`}
          >
            <div className={styles.yearMonthHeader}>
              <span className={styles.yearMonthTitle}>{new Date(year, mIdx, 1).toLocaleString('default', { month: 'long' })}</span>
              <span className={styles.yearMonthCount}>{metrics.total} events</span>
            </div>
            {renderMiniGrid(year, mIdx, 'sm')}
            <div className={`${styles.yearOverlay} ${isHovered ? styles.yearOverlayVisible : ''}`}>
              <div>
                <div className={styles.yearOverlayTitle}>{new Date(year, mIdx, 1).toLocaleString('default', { month: 'long' })} Overview</div>
                <div className={styles.yearOverlaySub}>Operational summary checkpoint</div>
              </div>
              <div className={styles.yearOverlayStats}>
                <div>Total: {metrics.total}</div>
                <div>Meetings: {metrics.meetings}</div>
                <div>Tasks: {metrics.tasks}</div>
                <div>Birthdays: {metrics.birthdays}</div>
              </div>
              <div className={styles.yearOverlayCta}>Click to open month</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {sidebarOpen && <div className={`${styles.sidebarOverlay} ${styles.sidebarOverlayVisible}`} onClick={() => setSidebarOpen(false)} />}

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''} ${viewMode === 'Year' || viewMode === 'Gallery' ? styles.sidebarRail : ''}`}>
        {(viewMode === 'Year' || viewMode === 'Gallery') ? (
          <div className={styles.sidebarRailInner}>
            <div className={styles.sidebarBrand}><CalendarDays size={20} /></div>
            <div className={styles.railDivider} />
            {[year - 1, year, year + 1, year + 2].map(y => (
              <button key={y} onClick={() => setCurrentDate(new Date(y, month, 1))} className={`${styles.railYearBtn} ${y === year ? styles.railYearBtnActive : ''}`}>{y}</button>
            ))}
            <div className={styles.railStats}>
              <span className={styles.railStatsLabel}>Total</span>
              <span className={styles.railStatsValue}>{filteredEvents.length}</span>
            </div>
          </div>
        ) : (
          <div className={styles.sidebarInner}>
            <div className={styles.searchBox}>
              <Search size={14} color="var(--ink-faint)" />
              <input type="text" placeholder="Search events…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            <div>
              <div className={styles.sectionLabel}>Mini Calendar</div>
              <div className={styles.miniCal}>
                <div className={styles.miniCalHeader}>
                  <span className={styles.miniCalTitle}>{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                  <div className={styles.miniCalNav}>
                    <button className={styles.iconBtn} onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></button>
                    <button className={styles.iconBtn} onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight size={14} /></button>
                  </div>
                </div>
                <div className={styles.miniCalGridHead}>{WEEKDAY_LABELS.map((d, i) => <div key={i}>{d}</div>)}</div>
                <div className={styles.miniCalGrid}>
                  {Array(firstDayOfMonth(year, month)).fill(null).concat(Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)).map((day, idx) => (
                    <div
                      key={idx}
                      onClick={() => day && setCurrentDate(new Date(year, month, day))}
                      className={`${styles.miniCalDay} ${day === currentDate.getDate() ? styles.miniCalDayActive : ''}`}
                    >
                      {day || ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={styles.toast}>
          <Sparkles size={14} color="var(--accent)" /> {toast}
        </div>
      )}

      <main className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(true)}><Menu size={17} /></button>
            <div className={styles.brandIcon}><CalendarDays size={20} /></div>
            <div>
              <div className={styles.title}>{title}</div>
              <div className={styles.subtitle}>{subtitle}</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-md hidden md:block">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px] font-mono mx-1">N</kbd> to quickly log a new event. Click on any date to manage your schedule.
              </p>
            </div>
          </div>
          <div className={styles.topbarRight}>
            <form onSubmit={handleAISmartSchedule} className="hidden md:flex relative items-center mr-2">
              <input 
                type="text" 
                placeholder="✨ AI Smart Schedule..."
                value={smartScheduleQuery}
                onChange={e => setSmartScheduleQuery(e.target.value)}
                disabled={smartScheduling}
                className="w-64 pl-4 pr-10 py-1.5 text-xs bg-surface border border-border rounded-full focus:outline-none focus:border-primary transition-all disabled:opacity-50 text-foreground"
              />
              <button 
                type="submit" 
                disabled={smartScheduling}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F4C542] hover:text-[#e0b53c] disabled:opacity-50"
              >
                <Sparkles size={14} className={smartScheduling ? "animate-pulse" : ""} />
              </button>
            </form>

            <button className={styles.addBtn} onClick={() => openAddModal(new Date().toISOString().split('T')[0])}>
              <Plus size={14} /> Log Activity
            </button>

            <div className={styles.viewDropdownWrap}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowViewDropdown(!showViewDropdown); }}
                className={styles.viewDropdownBtn}
              >
                <span>View: {viewMode}</span>
                <ChevronDown size={14} className={`${styles.viewDropdownIcon} ${showViewDropdown ? styles.viewDropdownIconOpen : ''}`} />
              </button>
              {showViewDropdown && (
                <div className={styles.viewDropdownMenu}>
                  {VIEW_MODES.map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode(mode);
                        setShowViewDropdown(false);
                      }}
                      className={`${styles.viewDropdownItem} ${viewMode === mode ? styles.viewDropdownItemActive : ''}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.periodBar}>
          <span className={styles.periodLabel}>{periodLabel}</span>
          <div className={styles.periodNav}>
            <button className={styles.todayBtn} onClick={goToday}>Today</button>
            <button className={styles.iconBtn} onClick={goPrev}><ChevronLeft size={18} /></button>
            <button className={styles.iconBtn} onClick={goNext}><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className={styles.calendarCard}>
          {loading && (
            <div className={styles.loadingOverlay}><div className={styles.spinner} /></div>
          )}
          {viewMode === 'Month' && renderMonthView()}
          {viewMode === 'Week' && renderWeekView()}
          {viewMode === 'Day' && renderDayView()}
          {viewMode === 'Agenda' && renderAgendaView()}
          {viewMode === 'Gallery' && renderGalleryView()}
          {viewMode === 'Timeline' && renderTimelineView()}
          {viewMode === 'Quarter' && renderQuarterView()}
          {viewMode === 'Year' && renderYearView()}
        </div>
      </main>

      {selectedYearMonth !== null && (
        <>
          <div className={styles.panelOverlay} onClick={() => setSelectedYearMonth(null)} />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelHeaderTitle}>{new Date(year, selectedYearMonth, 1).toLocaleString('default', { month: 'long' })} Statistics</span>
              <button className={styles.iconBtn} onClick={() => setSelectedYearMonth(null)}><X size={16} /></button>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.statCard}>
                <div className={styles.statCardLabel}>Total Events</div>
                <div className={styles.statCardValue}>{getMonthMetrics(selectedYearMonth).total}</div>
              </div>
              <div>
                <div className={styles.statRow}><span>Meetings</span><span className={styles.statRowValue}>{getMonthMetrics(selectedYearMonth).meetings}</span></div>
                <div className={styles.statRow}><span>Tasks</span><span className={styles.statRowValue}>{getMonthMetrics(selectedYearMonth).tasks}</span></div>
                <div className={styles.statRow}><span>Birthdays</span><span className={styles.statRowValue}>{getMonthMetrics(selectedYearMonth).birthdays}</span></div>
                <div className={styles.statRow}><span>Holidays</span><span className={styles.statRowValue}>{getMonthMetrics(selectedYearMonth).holidays}</span></div>
              </div>
              <button className={styles.submitBtn} onClick={() => { setViewMode('Month'); setSelectedYearMonth(null); }}>Open Full Month View</button>
            </div>
          </div>
        </>
      )}

      {selectedEvent && (
        <>
          <div
            className={styles.panelOverlay}
            onClick={() => setSelectedEvent(null)}
          />

          <div className={styles.panel}>
            {/* Header */}
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelHeaderTitle}>
                  Event Details
                </span>
                <p className={styles.panelHeaderSub}>
                  Calendar activity information
                </p>
              </div>

              <button
                className={styles.iconBtn}
                onClick={() => setSelectedEvent(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.panelBody}>

              <span
                className={`${styles.badge} ${catClass(selectedEvent.category)}`}
              >
                {selectedEvent.category}
              </span>

              <h2 className={styles.panelTitle}>
                {selectedEvent.title}
              </h2>

              {/* Information Cards */}
              <div className={styles.infoGrid}>

                {/* Date */}
                <div className={styles.infoCard}>
                  <div className={styles.infoIcon}>
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <span className={styles.infoLabel}>
                      Event Date
                    </span>

                    <div className={styles.infoValue}>
                      {new Date(selectedEvent.event_date).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className={styles.infoCard}>
                  <div className={styles.infoIcon}>
                    <Clock size={18} />
                  </div>

                  <div>
                    <span className={styles.infoLabel}>
                      Time
                    </span>

                    <div className={styles.infoValue}>
                      {selectedEvent.start_time
                        ? `${selectedEvent.start_time}${selectedEvent.end_time
                          ? ` - ${selectedEvent.end_time}`
                          : ""
                        }`
                        : "Whole Day Event"}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {selectedEvent.location_name && (
                  <div className={styles.infoCard}>
                    <div className={styles.infoIcon}>
                      <MapPin size={18} />
                    </div>

                    <div>
                      <span className={styles.infoLabel}>
                        Location
                      </span>

                      <div className={styles.infoValue}>
                        {selectedEvent.location_name}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className={styles.descriptionSection}>
                <div className={styles.descriptionTitle}>
                  Description
                </div>

                <div className={styles.descBox}>
                  {selectedEvent.description?.trim() ||
                    "No description provided for this event."}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.panelFooter}>
              <button
                className={styles.ghostBtn}
                onClick={() => openEditModal(selectedEvent)}
              >
                <Pencil size={15} />
                Edit Event
              </button>

              <button
                className={styles.dangerBtn}
                onClick={() => handleDeleteEvent(selectedEvent.id)}
              >
                <Trash2 size={15} />
                Delete Event
              </button>
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{editingId ? 'Edit Event' : 'Schedule Event'}</span>
              <button className={styles.iconBtn} onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitEvent} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Title</label>
                <input type="text" required value={newEvent.title || ''} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} className={styles.formInput} />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date</label>
                  <input type="date" required value={newEvent.event_date || ''} onChange={e => setNewEvent(p => ({ ...p, event_date: e.target.value }))} className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <div className="flex justify-between items-center mb-1">
                    <label className={styles.formLabel}>Category</label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowManageCategories(true)}
                        className="text-[9px] text-[#A3843B] dark:text-[#FFC72C] hover:underline flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"
                      >
                        ⚙️ Manage
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={newEvent.category || 'Client Meeting'}
                      onChange={e => setNewEvent(p => ({ ...p, category: e.target.value }))}
                      className={`${styles.formSelect} w-full appearance-none pr-10`}
                    >
                      {categories.map(c => <option key={c} value={c} className="dark:bg-slate-900">{c}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Time</label>
                  <div className={styles.timeInputWrapper}>
                    <input
                      type="time"
                      value={newEvent.start_time || ''}
                      onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))}
                      className={styles.timeInput}
                    />
                    <Clock size={15} className={styles.timeInputIcon} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Time</label>
                  <div className={styles.timeInputWrapper}>
                    <input
                      type="time"
                      value={newEvent.end_time || ''}
                      onChange={e => setNewEvent(p => ({ ...p, end_time: e.target.value }))}
                      className={styles.timeInput}
                    />
                    <Clock size={15} className={styles.timeInputIcon} />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className="flex justify-between items-center mb-1">
                  <label className={styles.formLabel}>Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDesc}
                    className="text-[10px] text-[#A3843B] dark:text-[#FFC72C] hover:underline flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Sparkles size={10} />
                    {generatingDesc ? 'Generating...' : 'Suggest with AI'}
                  </button>
                </div>
                <textarea value={newEvent.description || ''} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} className={styles.formTextarea} placeholder="Enter event details or generate a suggestion above" />
              </div>

              <button type="submit" className={styles.submitBtn}>{editingId ? 'Save Changes' : 'Deploy Workspace Event'}</button>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCelebration && celebratedEvent && (
          <div className={styles.celebrationOverlay} onClick={() => setShowCelebration(false)}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className={styles.celebrationModal}
              onClick={e => e.stopPropagation()}
            >
              {/* Confetti Explosion */}
              <div className={styles.confettiContainer}>
                {Array.from({ length: 40 }).map((_, i) => {
                  const angle = (i / 40) * 360 + (Math.random() - 0.5) * 20;
                  const distance = 90 + Math.random() * 150;
                  const x = Math.cos((angle * Math.PI) / 180) * distance;
                  const y = Math.sin((angle * Math.PI) / 180) * distance - 30;
                  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
                  const size = 6 + Math.random() * 8;
                  const delay = Math.random() * 0.2;
                  return (
                    <motion.div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: size,
                        height: size,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        backgroundColor: color,
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: x,
                        y: y,
                        scale: [0, 1.3, 1.1, 0.6, 0],
                        opacity: [1, 1, 0.8, 0.4, 0],
                        rotate: Math.random() * 360,
                      }}
                      transition={{
                        duration: 1.8 + Math.random() * 0.8,
                        ease: "easeOut",
                        delay: delay,
                      }}
                    />
                  );
                })}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                className={styles.celebrationIcon}
              >
                🎉
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className={styles.celebrationTitle}>
                  {isEditCelebration ? 'Event Updated!' : 'Activity Logged!'}
                </h2>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={styles.celebrationBadge}
              >
                <Sparkles size={14} />
                <span>{celebratedEvent.category}</span>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ink)' }}>
                  {celebratedEvent.title}
                </div>
                <p className={styles.celebrationText}>
                  {celebrationMessage || (isEditCelebration
                    ? 'Excellent! You successfully updated this workspace event. Everything is set and ready to go! 🚀'
                    : 'Awesome job! You successfully added this activity to the master workspace calendar. Keep up the high productivity! 🚀')}
                </p>
              </motion.div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={styles.celebrationCloseBtn}
                onClick={() => setShowCelebration(false)}
              >
                Let's Keep Going!
              </motion.button>
            </motion.div>
          </div>
        )}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Discard Event</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Are you sure you want to discard this calendar event? This action will permanently remove it from the database schedule.
              </p>
              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={() => { setDeleteConfirmOpen(false); setDeleteEventId(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteEvent}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 transition"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
        {showManageCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[28px] p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Manage Categories
                </h3>
                <button
                  type="button"
                  onClick={() => setShowManageCategories(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Add New Category form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs outline-none focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C]"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(newCategoryName); }}
                />
                <button
                  type="button"
                  onClick={() => handleAddCategory(newCategoryName)}
                  className="px-4 py-2 bg-[#FFC72C] hover:bg-[#e2b229] text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Categories list container */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl"
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {cat}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowManageCategories(false)}
                  className="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
