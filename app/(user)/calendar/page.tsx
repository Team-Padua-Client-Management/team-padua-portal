'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Clock,
  MapPin, X, Search, Sparkles, Menu, AlignLeft
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import styles from '@/styles/admin/calendar/page.module.css';

type ViewMode = 'Month' | 'Week' | 'Day' | 'Agenda' | 'Gallery' | 'Timeline' | 'Year' | 'Quarter';

type Category =
  | 'Meeting' | 'Birthday' | 'Client' | 'Deadline' | 'Holiday'
  | 'Interview' | 'Task' | 'Attendance' | 'ACR';

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

const CATEGORIES: Category[] = [
  'Meeting', 'Birthday', 'Client', 'Deadline', 'Holiday', 'Interview', 'Task', 'Attendance', 'ACR'
];

const VIEW_MODES: ViewMode[] = ['Month', 'Week', 'Day', 'Agenda', 'Gallery', 'Timeline', 'Year', 'Quarter'];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LABELS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6);

const catClass = (cat: Category) => {
  switch (cat) {
    case 'Meeting': return styles.catMeeting;
    case 'Birthday': return styles.catBirthday;
    case 'Client': return styles.catClient;
    case 'Deadline': return styles.catDeadline;
    case 'Holiday': return styles.catHoliday;
    case 'Interview': return styles.catInterview;
    case 'Task': return styles.catTask;
    case 'Attendance': return styles.catAttendance;
    case 'ACR': return styles.catAcr;
    default: return '';
  }
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

export default function UserCalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(CATEGORIES);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    category: 'Meeting', start_time: '09:00', end_time: '10:00'
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [selectedYearMonth, setSelectedYearMonth] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentDate]);

  const openAddModal = (dateStr: string) => {
    setEditingId(null);
    setNewEvent({ event_date: dateStr, category: 'Meeting', start_time: '09:00', end_time: '10:00' });
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
      start_time: newEvent.start_time || '00:00',
      end_time: newEvent.end_time || '00:00',
      location_name: newEvent.location_name || '',
      category: newEvent.category || 'Meeting'
    };

    if (editingId) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (error) throw error;
        setEvents(prev => prev.map(ev => (ev.id === editingId ? (data as CalendarEvent) : ev)));
        showToast('Event updated successfully.');
      } catch {
        const updated = events.map(ev => (ev.id === editingId ? { ...ev, ...payload } as CalendarEvent : ev));
        persistLocal(updated);
        showToast('Updated event locally.');
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) setEvents(prev => [...prev, data as CalendarEvent]);
        showToast('Event scheduled successfully.');
      } catch {
        const created = { ...payload, id: String(Date.now()) } as CalendarEvent;
        persistLocal([...events, created]);
        showToast('Scheduled event locally.');
      }
    }
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Discard this calendar event?')) return;
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(ev => ev.id !== id));
      showToast('Event discarded.');
    } catch {
      persistLocal(events.filter(ev => ev.id !== id));
      showToast('Discarded event locally.');
    }
    setSelectedEvent(null);
  };

  const toggleCategory = (cat: Category) => {
    setSelectedCategories(prev => (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]));
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

  const categoryCount = useCallback((cat: Category) => events.filter(e => e.category === cat).length, [events]);

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
    const activeCategories = CATEGORIES.filter(cat => filteredEvents.some(e => {
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
    <div className={styles.page}>
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
              <div className={styles.sectionLabel}>Workspace Navigation</div>
              <div className={styles.miniCal}>
                <div className={styles.miniCalHeader}>
                  <span className={styles.miniCalTitle}>{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                  <div className={styles.miniCalNav}>
                    <button className={styles.iconBtn} onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={12} /></button>
                    <button className={styles.iconBtn} onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight size={12} /></button>
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

            <div>
              <div className={styles.sectionLabel}>Framework Filters</div>
              <div className={styles.filterList}>
                {CATEGORIES.map(cat => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)} className={`${styles.filterItem} ${active ? styles.filterItemActive : ''}`}>
                      <span className={styles.filterItemLeft}>
                        <span className={`${styles.filterDot} ${catClass(cat)}`} />
                        {cat}
                      </span>
                      <span className={styles.filterCount}>{categoryCount(cat)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.main}>
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
                <div className={styles.title}>Intern Workspace Calendar</div>
                <div className={styles.subtitle}>Dynamic Multi-View Synchronization Matrix</div>
              </div>
            </div>
            <div className={styles.topbarRight}>
              <div className={styles.legend}>
                {['Meeting', 'Birthday', 'Task', 'Holiday', 'Attendance'].map(cat => (
                  <span key={cat} className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${catClass(cat as Category)}`} />
                    {cat}
                  </span>
                ))}
              </div>
              <div className={styles.viewSwitcher}>
                {VIEW_MODES.map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`${styles.viewBtn} ${viewMode === mode ? styles.viewBtnActive : ''}`}>{mode}</button>
                ))}
              </div>
              <button className={styles.addBtn} onClick={() => openAddModal(new Date().toISOString().split('T')[0])}>
                <Plus size={14} /> New Event
              </button>
            </div>
          </div>

          <div className={styles.periodBar}>
            <span className={styles.periodLabel}>{periodLabel}</span>
            <div className={styles.periodNav}>
              <button className={styles.todayBtn} onClick={goToday}>Today</button>
              <button className={styles.iconBtn} onClick={goPrev}><ChevronLeft size={15} /></button>
              <button className={styles.iconBtn} onClick={goNext}><ChevronRight size={15} /></button>
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
      </div>

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
          <div className={styles.panelOverlay} onClick={() => setSelectedEvent(null)} />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelHeaderTitle}>Event Details</span>
              <button className={styles.iconBtn} onClick={() => setSelectedEvent(null)}><X size={16} /></button>
            </div>
            <div className={styles.panelBody}>
              <span className={`${styles.badge} ${catClass(selectedEvent.category)}`}>{selectedEvent.category}</span>
              <div className={styles.panelTitle}>{selectedEvent.title}</div>
              <div className={styles.metaList}>
                <div className={styles.metaRow}>
                  <Clock size={14} className={styles.metaIcon} />
                  <span>{selectedEvent.event_date}{selectedEvent.start_time ? ` · ${selectedEvent.start_time}${selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}` : ''}</span>
                </div>
                {selectedEvent.location_name && (
                  <div className={styles.metaRow}>
                    <MapPin size={14} className={styles.metaIcon} />
                    <span>{selectedEvent.location_name}</span>
                  </div>
                )}
              </div>
              <div className={styles.descBox}>{selectedEvent.description || 'No description added.'}</div>
            </div>
            <div className={styles.panelFooter}>
              <button className={styles.ghostBtn} onClick={() => openEditModal(selectedEvent)}><Pencil size={14} /> Edit</button>
              <button className={styles.dangerBtn} onClick={() => handleDeleteEvent(selectedEvent.id)}><Trash2 size={14} /> Delete</button>
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
                  <label className={styles.formLabel}>Category</label>
                  <select value={newEvent.category} onChange={e => setNewEvent(p => ({ ...p, category: e.target.value as Category }))} className={styles.formSelect}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input type="time" value={newEvent.start_time || ''} onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))} className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Time</label>
                  <input type="time" value={newEvent.end_time || ''} onChange={e => setNewEvent(p => ({ ...p, end_time: e.target.value }))} className={styles.formInput} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location</label>
                <input type="text" value={newEvent.location_name || ''} onChange={e => setNewEvent(p => ({ ...p, location_name: e.target.value }))} className={styles.formInput} placeholder="Optional" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea value={newEvent.description || ''} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} className={styles.formTextarea} placeholder="Optional notes" />
              </div>

              <button type="submit" className={styles.submitBtn}>{editingId ? 'Save Changes' : 'Deploy Workspace Event'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
