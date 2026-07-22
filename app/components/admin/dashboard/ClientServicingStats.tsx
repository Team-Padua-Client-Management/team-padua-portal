import React from 'react';
import {
  ListTodo,
  Clock,
  CircleEllipsis,
  CircleCheck,
  CirclePause,
  CircleX,
  CircleDot,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface TaskCounts {
  total: number;
  pending: number;
  inProgress: number;
  acknowledged?: number;
  done: number;
  onHold: number;
  cancelled: number;
  overdue?: number;
}

interface ClientServicingStatsProps {
  counts: TaskCounts;
  isUserView?: boolean;
}

export default function ClientServicingStats({ counts, isUserView = false }: ClientServicingStatsProps) {
  const statItems = [
    {
      label: isUserView ? 'My Tasks' : 'Total Tasks',
      value: counts.total,
      icon: ListTodo,
      badgeClass: styles.statBadgeTotal,
      trend: isUserView ? 'Assigned' : '+100% active'
    },
    {
      label: 'Pending',
      value: counts.pending,
      icon: Clock,
      badgeClass: styles.statBadgePending,
      trend: 'Awaiting'
    },
    {
      label: 'In Progress',
      value: counts.inProgress,
      icon: CircleEllipsis,
      badgeClass: styles.statBadgeInProgress,
      trend: 'Active'
    },
    {
      label: 'Acknowledged',
      value: counts.acknowledged || 0,
      icon: CircleDot,
      badgeClass: styles.statBadgeAcknowledged || styles.statBadgeInProgress,
      trend: 'Received'
    },
    {
      label: 'Done',
      value: counts.done,
      icon: CircleCheck,
      badgeClass: styles.statBadgeDone,
      trend: 'Completed'
    },
    {
      label: 'On Hold',
      value: counts.onHold,
      icon: CirclePause,
      badgeClass: styles.statBadgeOnHold,
      trend: 'Paused'
    },
    {
      label: 'Overdue',
      value: counts.overdue || 0,
      icon: AlertTriangle,
      badgeClass: styles.statBadgeCancelled,
      trend: 'Attention'
    }
  ];

  return (
    <div className={styles.statsContainer}>
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`${styles.statCard} ${item.badgeClass}`}>
            <div className={styles.statCardHeader}>
              <span className={styles.statLabel}>{item.label}</span>
              <div className={styles.statIconWrapper}>
                <Icon size={14} strokeWidth={2} />
              </div>
            </div>
            <div className={styles.statCardBody}>
              <span className={styles.statValue}>{item.value}</span>
              <span className={styles.statTrend}>
                <TrendingUp size={10} />
                {item.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
