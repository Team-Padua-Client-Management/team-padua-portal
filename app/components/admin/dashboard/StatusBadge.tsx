import React from 'react';
import {
  CircleDot,
  CircleCheck,
  CircleX,
  CirclePause,
  CircleEllipsis,
  Clock
} from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type TaskStatus = 'Pending' | 'In Progress' | 'Acknowledged' | 'On Hold' | 'Done' | 'Cancelled';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const getStatusColorHex = (status: string): string => {
  switch (status) {
    case 'In Progress':
      return '#2563EB'; // Blue
    case 'Acknowledged':
      return '#8B5CF6'; // Purple
    case 'On Hold':
      return '#64748B'; // Gray/Slate
    case 'Done':
      return '#10B981'; // Emerald Green
    case 'Cancelled':
      return '#EF4444'; // Red
    case 'Pending':
    default:
      return '#F59E0B'; // Yellow/Amber
  }
};

export const getTaskStatusMeta = (status: string): { className: string; Icon: React.ElementType } => {
  switch (status) {
    case 'In Progress':
      return { className: styles.statusInProgress, Icon: CircleEllipsis };
    case 'Acknowledged':
      return { className: styles.statusAcknowledged, Icon: CircleDot };
    case 'On Hold':
      return { className: styles.statusOnHold, Icon: CirclePause };
    case 'Done':
      return { className: styles.statusDone, Icon: CircleCheck };
    case 'Cancelled':
      return { className: styles.statusCancelled, Icon: CircleX };
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
