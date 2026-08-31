'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Cake, Sparkles, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BirthdayItem,
  useClientBirthdays,
  extractMonthDayYear,
  computeBirthdayWhenAndAge,
} from '@src/features/client-servicing/cgpt/CGPTClient';
import styles from '@/styles/admin/dashboard/page.module.css';

export type { BirthdayItem };

export interface AdvisorItem {
  id: string;
  advisor_name: string;
  advisor_code?: string;
}

interface BirthdayCardProps {
  birthdays?: BirthdayItem[];
  advisors?: AdvisorItem[];
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export default function BirthdayCard({
  birthdays: propBirthdays,
  advisors: propAdvisors,
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}: BirthdayCardProps) {
  const isPropControlled = propBirthdays !== undefined;

  const {
    filteredBirthdays: hookFilteredBirthdays,
    advisors: fetchedAdvisors,
    loading: hookLoading,
    error: hookError,
    selectedAdvisor: hookSelectedAdvisor,
    setSelectedAdvisor: hookSetSelectedAdvisor,
    whenFilter: hookWhenFilter,
    setWhenFilter: hookSetWhenFilter,
    todayCount: hookTodayCount,
  } = useClientBirthdays();

  const [localAdvisor, setLocalAdvisor] = React.useState('All');
  const [localWhen, setLocalWhen] = React.useState<'All' | 'Yesterday' | 'Today' | 'Tomorrow'>('All');

  const selectedAdvisor = isPropControlled ? localAdvisor : hookSelectedAdvisor;
  const setSelectedAdvisor = isPropControlled ? setLocalAdvisor : hookSetSelectedAdvisor;
  const whenFilter = isPropControlled ? localWhen : hookWhenFilter;
  const setWhenFilter = isPropControlled ? setLocalWhen : hookSetWhenFilter;

  const advisorOptions = useMemo(() => {
    if (isPropControlled && propAdvisors) {
      if (propAdvisors.length === 1) {
        return [{ id: propAdvisors[0].id, name: propAdvisors[0].advisor_name }];
      }
      return [
        { id: 'All', name: 'All Advisors' },
        ...propAdvisors.map((a: any) => ({
          id: a.id,
          name: a.advisor_name || a.advisorName || 'Advisor',
        })),
      ];
    }
    const list = propAdvisors && propAdvisors.length > 0
      ? propAdvisors
      : fetchedAdvisors.map((a) => ({ id: a.id, advisor_name: a.advisorName }));
    const opts = [
      { id: 'All', name: 'All Advisors' },
      ...list.map((a: any) => ({
        id: a.id,
        name: a.advisor_name || a.advisorName || 'Advisor',
      })),
    ];
    const unique: Record<string, { id: string; name: string }> = {};
    for (const o of opts) unique[o.id] = o;
    return Object.values(unique);
  }, [isPropControlled, propAdvisors, fetchedAdvisors]);

  const filteredBirthdays = useMemo(() => {
    if (!isPropControlled) return hookFilteredBirthdays;

    const source = propBirthdays || [];
    let items = selectedAdvisor === 'All'
      ? source
      : source.filter((b) => b.advisorId === selectedAdvisor);

    if (whenFilter !== 'All') {
      const targetWhen = whenFilter.toLowerCase();
      items = items.filter((b) => b.when === targetWhen);
    }

    const priority: Record<string, number> = { yesterday: 0, today: 1, tomorrow: 2 };
    return [...items].sort((a, b) => (priority[a.when] ?? 99) - (priority[b.when] ?? 99));
  }, [isPropControlled, propBirthdays, hookFilteredBirthdays, selectedAdvisor, whenFilter]);

  const todayCount = useMemo(() => {
    if (!isPropControlled) return hookTodayCount;
    return filteredBirthdays.filter((b) => b.when === 'today').length;
  }, [isPropControlled, hookTodayCount, filteredBirthdays]);

  const isLoading = isPropControlled ? false : hookLoading;
  const status = isPropControlled ? 'success' : (hookError ? 'error' : isLoading ? 'loading' : 'success');

  const groupedSections = useMemo(() => {
    if (whenFilter !== 'All') return [];
    const groups: { key: 'yesterday' | 'today' | 'tomorrow'; label: string; items: BirthdayItem[] }[] = [
      { key: 'yesterday', label: 'Yesterday', items: filteredBirthdays.filter((b) => b.when === 'yesterday') },
      { key: 'today', label: 'Today', items: filteredBirthdays.filter((b) => b.when === 'today') },
      { key: 'tomorrow', label: 'Tomorrow', items: filteredBirthdays.filter((b) => b.when === 'tomorrow') },
    ];
    return groups.filter((g) => g.items.length > 0);
  }, [filteredBirthdays, whenFilter]);

  const renderBirthdayItem = (item: BirthdayItem) => {
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
            background: isToday
              ? 'rgba(234, 179, 8, 0.15)'
              : isTomorrow
                ? 'rgba(37, 99, 235, 0.12)'
                : 'var(--surface-2)',
            color: isToday ? '#D97706' : isTomorrow ? '#2563EB' : 'var(--text-tertiary)',
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
            {item.date} &bull; {item.advisorName || 'Advisor'}
          </span>
        </div>

        <div className={styles.birthdayStatusRight}>
          <span className={styles.birthdayStatusBadge} data-when={item.when}>
            {isToday ? 'Today 🎂' : isTomorrow ? 'Tomorrow' : 'Yesterday'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.dashboardCard} ${styles.birthdayCard} ${className}`}>
      <div className={`${styles.dashboardCardHeader} !p-4 !pb-2 flex-col !items-stretch gap-2.5`}>
        <div className="flex items-center justify-between">
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

          <div className={`${styles.headerRightActions} flex items-center gap-2`}>
            <select
              value={selectedAdvisor}
              onChange={(e) => setSelectedAdvisor(e.target.value)}
              className="text-xs border border-border/70 bg-surface text-text-secondary rounded-lg px-2 py-1 outline-none"
            >
              {advisorOptions.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </select>
            {todayCount > 0 && (
              <span className={`${styles.birthdayTodayPill} !text-[14px] !px-3.5 !py-1.5 !font-bold !gap-1.5`}>
                <Sparkles size={16} />
                {todayCount} Today!
              </span>
            )}
            {collapsible && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-lg hover:bg-surface-2 text-text-secondary hover:text-text transition-colors border border-border/50"
                aria-label={isCollapsed ? 'Expand Client Birthdays' : 'Collapse Client Birthdays'}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1.5 pt-1">
            {(['All', 'Yesterday', 'Today', 'Tomorrow'] as const).map((filter) => {
              const isActive = whenFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setWhenFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                      : 'bg-surface/80 text-text-secondary border-border/70 hover:border-amber-500/50 hover:text-text hover:bg-surface'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className={styles.dashboardCardBody}>
          {isLoading ? (
            <div className={styles.birthdayEmptyContainer}>
              <div className={styles.birthdayEmptyIcon}>🎂</div>
              <div className={styles.emptyStateTitle}>Loading birthdays...</div>
            </div>
          ) : status === 'error' ? (
            <div className={styles.birthdayEmptyContainer}>
              <div className={styles.birthdayEmptyIcon}>🎂</div>
              <div className={styles.emptyStateTitle}>Couldn&apos;t load birthdays</div>
              <div className={styles.emptyStateDescription}>
                Something went wrong fetching client birthdays. Please try again later.
              </div>
            </div>
          ) : filteredBirthdays.length === 0 ? (
            <div className={styles.birthdayEmptyContainer}>
              <div className={styles.birthdayEmptyIcon}>🎂</div>
              <div className={styles.emptyStateTitle}>No client birthdays today, yesterday, or tomorrow</div>
              <div className={styles.emptyStateDescription}>
                Upcoming client birthdays will automatically appear here when due.
              </div>
              <Link href="/admin/cgpt" className={styles.birthdayEmptyLinkBtn}>
                <span>Open CPST Birthday Center</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          ) : whenFilter === 'All' ? (
            <div className="flex flex-col gap-3.5">
              {groupedSections.map((section) => (
                <div key={section.key} className={styles.birthdayGroupSection}>
                  <div className={styles.birthdayGroupHeader}>
                    <span className={styles.birthdayGroupTitle}>{section.label}</span>
                    <span className={styles.birthdayGroupCount}>{section.items.length}</span>
                  </div>
                  <div className={styles.birthdayList}>
                    {section.items.map(renderBirthdayItem)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.birthdayList}>
              {filteredBirthdays.map(renderBirthdayItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}