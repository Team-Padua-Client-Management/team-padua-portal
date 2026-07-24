import React from 'react';
import Link from 'next/link';
import { Cake, ArrowUpRight, Calendar, Sparkles, ExternalLink } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface BirthdayItem {
  id: string;
  name: string;
  date: string;
  when: 'today' | 'yesterday' | 'tomorrow';
  age?: number;
  advisor?: string;
  policyNo?: string;
}

interface BirthdayCardProps {
  birthdays?: BirthdayItem[];
}

export default function BirthdayCard({ birthdays = [] }: BirthdayCardProps) {
  const todayCount = birthdays.filter(b => b.when === 'today').length;

  return (
    <div className={`${styles.dashboardCard} ${styles.birthdayCard}`}>
      {/* Header Row */}
      <div className={`${styles.dashboardCardHeader} !p-4`}>
        <div className="flex items-center gap-2.5">
          <div className={`${styles.birthdayIconBadge} !w-9 !h-9 !p-2`}>
            <Cake size={22} strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
              Client Birthdays
            </h1>
          </div>
        </div>

        <div className={styles.headerRightActions}>
          {todayCount > 0 && (
            <span className={`${styles.birthdayTodayPill} !text-[14px] !px-3.5 !py-1.5 !font-bold !gap-1.5`}>
              <Sparkles size={16} />
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
                          {item.when === 'yesterday' ? 'Turned' : 'Turning'} {item.age}
                        </span>
                      )}
                    </div>
                    <span className={styles.birthdayDateMeta}>
                      {item.date} {item.age !== undefined && item.age > 0 ? `• ${item.age} yrs old` : ''}
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
