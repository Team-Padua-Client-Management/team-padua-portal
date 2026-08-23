import React from 'react';
import {
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface LogStatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function getStatusStyle(status: string) {
  const normalized = status.toLowerCase().trim();

  // Green: Approved, Completed, Resolved, Addressed, Done
  if (
    normalized.includes('approv') ||
    normalized.includes('addressed') ||
    normalized.includes('resolv') ||
    normalized.includes('complet') ||
    normalized === 'done'
  ) {
    return {
      bg: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/60',
      icon: CheckCircle2,
      displayLabel: status.includes('Request') ? status : status.includes('Approv') ? `${status} Requests` : status,
    };
  }

  // Red: Overdue
  if (normalized.includes('overdue') || normalized.includes('reject')) {
    return {
      bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
      icon: AlertCircle,
      displayLabel: status,
    };
  }

  // Blue: Submitted (with paper-plane icon)
  if (normalized.includes('submit')) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      icon: Send,
      displayLabel: status.includes('Request') ? status : 'Submitted Requests',
    };
  }

  // Amber: Pending Requirements, Pending Response, Pending, Today
  if (normalized.includes('pending') || normalized === 'today') {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      icon: Clock,
      displayLabel: status,
    };
  }

  // Gray / Neutral: Upcoming
  if (normalized.includes('upcoming') || normalized.includes('scheduled')) {
    return {
      bg: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: Calendar,
      displayLabel: status,
    };
  }

  // Cancelled / Default Neutral
  return {
    bg: 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: XCircle,
    displayLabel: status,
  };
}

export default function LogStatusBadge({ status, className = '', size = 'md' }: LogStatusBadgeProps) {
  const { bg, icon: Icon, displayLabel } = getStatusStyle(status);
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border shadow-2xs whitespace-nowrap transition-all ${
        isSm ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]'
      } ${bg} ${className}`}
    >
      <Icon size={isSm ? 11 : 13} strokeWidth={2.4} className="shrink-0" />
      <span>{displayLabel}</span>
    </span>
  );
}
