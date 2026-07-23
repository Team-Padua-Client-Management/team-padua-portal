import React from 'react';
import Link from 'next/link';
import { Cake, ArrowUpRight, Calendar, Sparkles, ExternalLink } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface BirthdayItem {
  id: string;
  name: string;
  date: string; // e.g. "Jul 22"
  when: 'today' | 'yesterday' | 'tomorrow';
  age?: number;
  policyNo?: string;
  advisor?: string;
}

interface BirthdayCardProps {
  birthdays?: BirthdayItem[];
}

export default function BirthdayCard({ birthdays = [] }: BirthdayCardProps) {
  const todayCount = birthdays.filter(b => b.when === 'today').length;

  return (
    <div className={`${styles.dashboardCard} ${styles.birthdayCard}`}>
      {/* Header Row */}
      <div className={styles.dashboardCardHeader}>
        <div className={styles.headerTitleWrapper}>
          <div className={styles.birthdayIconBadge}>
            <Cake size={16} strokeWidth={2.2} />
          </div>
          <div className={styles.dashboardCardTitle}>
            <h3>Client Birthdays</h3>
          </div>
        </div>

        <div className={styles.headerRightActions}>
          {todayCount > 0 && (
            <span className={styles.birthdayTodayPill}>
              <Sparkles size={11} />
              {todayCount} Today!
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className={styles.dashboardCardBody}>
        {birthdays.length === 0 ? (
          <div className={styles.birthdayEmptyContainer}>
            <div className={styles.birthdayEmptyIcon}>🎂</div>
            <div className={styles.emptyStateTitle}>No client birthdays today, yesterday, or tomorrow</div>
            <div className={styles.emptyStateDescription}>
              Upcoming client birthdays will automatically appear here when due.
            </div>
            <Link href="/admin/cpst" className={styles.birthdayEmptyLinkBtn}>
              <span>Open CPST Birthday Center</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        ) : (
          <div className={styles.birthdayList}>
            {birthdays.map((item) => {
              const isToday = item.when === 'today';
              const isTomorrow = item.when === 'tomorrow';

              return (
                <div
                  key={item.id}
                  className={`${styles.birthdayItemCard} ${isToday ? styles.birthdayItemToday : ''}`}
                >
                  <div
                    className={styles.birthdayAvatarWrapper}
                    style={{
                      background: isToday ? 'rgba(234, 179, 8, 0.15)' : isTomorrow ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface-2)',
                      color: isToday ? '#D97706' : isTomorrow ? '#2563EB' : 'var(--text-tertiary)'
                    }}
                  >
                    <Cake size={16} />
                  </div>

                  <div className={styles.birthdayInfoGroup}>
                    <div className={styles.birthdayNameRow}>
                      <span className={styles.birthdayName}>{item.name}</span>
                      {item.age !== undefined && item.age > 0 && (
                        <span className={styles.birthdayAgeBadge}>
                          Turning {item.age}
                        </span>
                      )}
                    </div>
                    <span className={styles.birthdayDateMeta}>
                      {item.date} {item.age !== undefined && item.age > 0 ? `• ${item.age} yrs old` : ''} {item.policyNo ? `• ${item.policyNo}` : ''}
                    </span>
                  </div>

                  <div className={styles.birthdayStatusRight}>
                    <span
                      className={styles.birthdayStatusBadge}
                      data-when={item.when}
                    >
                      {isToday ? 'Today 🎂' : isTomorrow ? 'Tomorrow' : 'Yesterday'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
