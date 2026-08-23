import React from 'react';
import { UserProfile } from '../components/UserAvatar';
import { BirthdayItem, AdvisorItem } from '../components/BirthdayCard';
import { ActivityEvent } from '../components/ActivityCard';
import { TaskItem } from '../components/TaskRow';
import { ClientInquiry } from './inquiry';
import { UserPermissions } from '../components/RequestFormsAccordion';

export interface DashboardLayoutProps {
  userTasks: any[];
  allProfiles: UserProfile[];
  bizDevProfiles: UserProfile[];
  clientInquiries: ClientInquiry[];
  clientBirthdays: BirthdayItem[];
  advisors: AdvisorItem[];
  activities: ActivityEvent[];
  miniCalendarMonth: Date;
  selectedMiniDate: string | null;
  displayedCalendarLogs: any[];
  calendarRoleFilter: string;
  showCalendarHistory: boolean;
  kpis: any;
  userRole?: string | null;
  userPermissions?: UserPermissions;

  // Handlers
  onCreateTask: () => void;
  onToggleTaskComplete: (task: TaskItem) => void;
  onSelectTask: (taskId: string) => void;
  onSaveTaskField: (taskId: string, updates: Record<string, unknown>) => void;
  onDeleteTask: (taskId: string) => void;

  onCreateInquiry: () => void;
  onDeleteInquiry: (inquiryId: string) => void;
  onSaveInquiryField: (inquiryId: string, updates: Record<string, any>) => Promise<void>;
  onSelectInquiry: (inquiry: ClientInquiry) => void;
  onCopyToPending: (inquiry: ClientInquiry) => void;
  onCopyToAddressed: (inquiry: ClientInquiry) => void;

  setShowCalendarHistory: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenCalendarModal: () => void;
  setCalendarRoleFilter: (role: any) => void;
  promptDeleteCalendarActivity: (id: string) => void;
  handleCompleteCalendarActivity: (id: string) => void;

  onPrevMiniMonth: () => void;
  onNextMiniMonth: () => void;
  onSelectMiniDate: (dateKey: string | null) => void;
  onOpenLogModal: () => void;
  onSelectEvent: (event: ActivityEvent) => void;
}
