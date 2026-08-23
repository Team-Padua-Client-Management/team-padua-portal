import React from 'react';
import { LayoutGrid, FileText, MessageSquareText, CalendarDays } from 'lucide-react';
import { LogTabType } from './types';

interface LogTabItem {
  id: LogTabType;
  label: string;
  count: number;
  icon: React.ElementType;
}

interface LogTabsProps {
  activeTab: LogTabType;
  onChangeTab: (tab: LogTabType) => void;
  counts: {
    all: number;
    servicing: number;
    inquiries: number;
    calendar: number;
  };
}

export default function LogTabs({ activeTab, onChangeTab, counts }: LogTabsProps) {
  const tabs: LogTabItem[] = [
    {
      id: 'all',
      label: 'All Logs',
      count: counts.all,
      icon: LayoutGrid,
    },
    {
      id: 'servicing',
      label: 'Servicing Requests',
      count: counts.servicing,
      icon: FileText,
    },
    {
      id: 'inquiries',
      label: 'Client Inquiries',
      count: counts.inquiries,
      icon: MessageSquareText,
    },
    {
      id: 'calendar',
      label: 'Calendar of Activities',
      count: counts.calendar,
      icon: CalendarDays,
    },
  ];

  return (
    <div className="bg-[#F0EFF6] dark:bg-surface-2 p-1.5 sm:p-2 rounded-2xl flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border border-slate-200/70 dark:border-border/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 select-none ${
              isActive
                ? 'bg-[#E8A33D] text-white shadow-md shadow-[#E8A33D]/25 font-extrabold'
                : 'bg-white dark:bg-surface text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-border/80 hover:bg-slate-50 dark:hover:bg-surface-2 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon
              size={15}
              strokeWidth={isActive ? 2.5 : 2}
              className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors'}
            />
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${
                isActive
                  ? 'bg-white text-[#E8A33D]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
