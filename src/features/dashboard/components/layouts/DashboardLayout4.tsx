'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, RotateCcw, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import TaskList from '../TaskList';
import InquiryList from '../InquiryList';
import ActivityCalendar from '../ActivityCalendar';
import BirthdayCard from '../BirthdayCard';
import CalendarOfActivities from '../CalendarOfActivities';
import RequestFormsAccordion from '../RequestFormsAccordion';
import { DashboardLayoutProps } from '../../types/layoutProps';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface DashboardSectionConfig {
  id: string;
  title: string;
  span: 1 | 2; // 1 = 1 column, 2 = full 2 columns
}

const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  { id: 'servicing-monitoring', title: 'Client Servicing Monitoring', span: 2 },
  { id: 'inquiries', title: 'Client Inquiries', span: 1 },
  { id: 'birthdays', title: 'Client Birthdays', span: 1 },
  { id: 'calendar-activities', title: 'Calendar of Activities', span: 1 },
  { id: 'activity-calendar', title: 'Activity Tracker Calendar', span: 1 },
  { id: 'servicing-requests', title: 'Client Servicing Requests', span: 2 },
];

const STORAGE_KEY = 'team_padua_layout4_sections_v2';

export default function DashboardLayout4({
  userTasks,
  allProfiles,
  bizDevProfiles,
  clientInquiries,
  clientBirthdays,
  advisors,
  activities,
  miniCalendarMonth,
  selectedMiniDate,
  displayedCalendarLogs,
  calendarRoleFilter,
  showCalendarHistory,
  kpis,
  userRole,
  userPermissions,
  onCreateTask,
  onToggleTaskComplete,
  onSelectTask,
  onSaveTaskField,
  onDeleteTask,
  onCreateInquiry,
  onDeleteInquiry,
  onSaveInquiryField,
  onSelectInquiry,
  onCopyToPending,
  onCopyToAddressed,
  setShowCalendarHistory,
  onOpenCalendarModal,
  setCalendarRoleFilter,
  promptDeleteCalendarActivity,
  handleCompleteCalendarActivity,
  onPrevMiniMonth,
  onNextMiniMonth,
  onSelectMiniDate,
  onOpenLogModal,
  onSelectEvent,
}: DashboardLayoutProps) {
  const [sections, setSections] = useState<DashboardSectionConfig[]>(DEFAULT_SECTIONS);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((s: any) => s.id));
          const merged = [...parsed];
          DEFAULT_SECTIONS.forEach((s) => {
            if (!savedIds.has(s.id)) merged.push(s);
          });
          setSections(merged);
        }
      }
    } catch (err) {
      console.error('Error reading layout4 config:', err);
    }
    setIsClientLoaded(true);
  }, []);

  const saveSections = (newSections: DashboardSectionConfig[]) => {
    setSections(newSections);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections));
    } catch (err) {
      console.error('Error saving layout4 config:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    if (dragOverIdx === index) {
      setDragOverIdx(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...sections];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIndex, 0, moved);
    saveSections(updated);

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const toggleSectionSpan = (id: string) => {
    const updated = sections.map((sec) =>
      sec.id === id ? { ...sec, span: (sec.span === 1 ? 2 : 1) as 1 | 2 } : sec
    );
    saveSections(updated);
  };

  const resetLayout = () => {
    saveSections(DEFAULT_SECTIONS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const renderSectionContent = (id: string, span: 1 | 2) => {
    switch (id) {
      case 'servicing-monitoring':
        return (
          <TaskList
            tasks={userTasks}
            allProfiles={allProfiles}
            bizDevProfiles={bizDevProfiles}
            onCreateTask={onCreateTask}
            onToggleComplete={onToggleTaskComplete}
            onSelectTask={onSelectTask}
            onSaveTaskField={onSaveTaskField}
            onDeleteTask={onDeleteTask}
            variant={span === 2 ? 'compact-strip' : 'card'}
          />
        );
      case 'inquiries':
        return (
          <InquiryList
            inquiries={clientInquiries}
            allProfiles={allProfiles}
            onCreateInquiry={onCreateInquiry}
            onDeleteInquiry={onDeleteInquiry}
            saveInquiryField={onSaveInquiryField}
            onSelectInquiry={onSelectInquiry}
            onCopyToPending={onCopyToPending}
            onCopyToAddressed={onCopyToAddressed}
            variant={span === 2 ? 'compact-strip' : 'card'}
          />
        );
      case 'calendar-activities':
        return (
          <CalendarOfActivities
            displayedCalendarLogs={displayedCalendarLogs}
            allProfiles={allProfiles}
            bizDevProfiles={bizDevProfiles}
            calendarRoleFilter={calendarRoleFilter}
            setCalendarRoleFilter={setCalendarRoleFilter}
            showCalendarHistory={showCalendarHistory}
            setShowCalendarHistory={setShowCalendarHistory}
            onOpenCalendarModal={onOpenCalendarModal}
            promptDeleteCalendarActivity={promptDeleteCalendarActivity}
            handleCompleteCalendarActivity={handleCompleteCalendarActivity}
          />
        );
      case 'activity-calendar':
        return (
          <ActivityCalendar
            activities={activities}
            miniCalendarMonth={miniCalendarMonth}
            selectedMiniDate={selectedMiniDate}
            onPrevMonth={onPrevMiniMonth}
            onNextMonth={onNextMiniMonth}
            onSelectDate={onSelectMiniDate}
            onOpenLogModal={onOpenLogModal}
            onSelectEvent={onSelectEvent}
          />
        );
      case 'birthdays':
        return (
          <BirthdayCard
            birthdays={clientBirthdays}
            advisors={advisors}
          />
        );
      case 'servicing-requests':
        return (
          <RequestFormsAccordion
            kpis={kpis}
            userRole={userRole}
            userPermissions={userPermissions}
            variant="grid"
            defaultExpanded={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.layout4Container}>
      {/* Top Customization Control Toolbar */}
      <div className={styles.layout4Toolbar}>
        <div className={styles.layout4ToolbarLeft}>
          <div className={styles.layout4ToolbarIcon}>
            <Sparkles size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className={styles.layout4ToolbarTitle}>
              Customizable Drag-and-Drop Workspace
            </div>
            <div className={styles.layout4ToolbarSubtitle}>
              Grab any section by its top bar to reposition. Toggle width to maximize your layout.
            </div>
          </div>
        </div>

        <div className={styles.layout4ToolbarRight}>
          <button
            type="button"
            onClick={resetLayout}
            className={styles.layout4ResetBtn}
            title="Reset layout to default arrangement"
          >
            <RotateCcw size={13} strokeWidth={2.2} />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>

      {/* Dynamic Drag-and-Drop CSS Grid */}
      <div className={styles.layout4Grid}>
        {sections.map((section, index) => {
          const isDragging = draggedIdx === index;
          const isDropTarget = dragOverIdx === index && draggedIdx !== index;
          const spanClass = section.span === 2 ? styles.layout4Span2 : styles.layout4Span1;

          return (
            <div
              key={section.id}
              className={`${styles.layout4CardWrapper} ${spanClass} ${
                isDragging ? styles.layout4CardDragging : ''
              } ${isDropTarget ? styles.layout4CardDropTarget : ''}`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragOver(e, index)}
              onDragLeave={(e) => handleDragLeave(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Draggable Section Top Bar */}
              <div
                className={styles.layout4DragHeader}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                title="Drag to reposition section"
              >
                <div className={styles.layout4DragHandle}>
                  <GripVertical size={16} strokeWidth={2.2} className={styles.layout4GripIcon} />
                  <span>{section.title}</span>
                </div>

                <div
                  className={styles.layout4DragActions}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => toggleSectionSpan(section.id)}
                    className={styles.layout4SpanBtn}
                    title={section.span === 2 ? "Switch to Half Width (1 Column)" : "Switch to Full Width (2 Columns)"}
                  >
                    {section.span === 2 ? (
                      <>
                        <Minimize2 size={11} strokeWidth={2.2} />
                        <span>Half Width</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={11} strokeWidth={2.2} />
                        <span>Full Width</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Section Widget Content */}
              <div
                className={styles.layout4CardContent}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {renderSectionContent(section.id, section.span)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
