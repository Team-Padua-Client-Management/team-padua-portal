import React from 'react';
import {
  CircleCheck,
  CircleEllipsis,
  Clock
} from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const getStatusColorHex = (status: string): string => {
  switch (status) {
    case 'In Progress':
      return '#2563EB'; // Blue
    case 'Done':
      return '#10B981'; // Emerald Green
    case 'Pending':
    default:
      return '#F59E0B'; // Yellow/Amber
  }
};

export const getTaskStatusMeta = (status: string): { className: string; Icon: React.ElementType } => {
  switch (status) {
    case 'In Progress':
      return { className: styles.statusInProgress, Icon: CircleEllipsis };
    case 'Done':
      return { className: styles.statusDone, Icon: CircleCheck };
    case 'Pending':
    default:
      return { className: styles.statusPending, Icon: Clock };
  }
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { className, Icon } = getTaskStatusMeta(status);
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span className={`${styles.statusPill} ${className} ${size === 'sm' ? styles.statusPillSm : ''}`}>
      <Icon size={iconSize} strokeWidth={2.2} />
      <span>{status}</span>
    </span>
  );
}
