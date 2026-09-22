'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Cake, Sparkles, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BirthdayItem,
  useClientBirthdays,
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
  const shouldReduceMotion = useReducedMotion();
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
    const list = propAdvisors && propAdvisors.length > 0
      ? propAdvisors
      : fetchedAdvisors.map((a) => ({ id: a.id, advisor_name: a.advisorName }));
    const opts = [
      { id: 'All', name: 'All Advisors' },
      ...list.map((a: any) => ({
        id: a.id,
        name: (a.advisor_name || a.advisorName || 'Advisor').trim(),
      })),
    ];
    const unique: Record<string, { id: string; name: string }> = {};
    for (const o of opts) {
      if (!unique[o.id]) unique[o.id] = o;
    }
    return Object.values(unique);
  }, [propAdvisors, fetchedAdvisors]);

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
    const isYesterday = item.when === 'yesterday';

    return (
      <motion.div
        key={item.id}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`${styles.birthdayItemCard} ${isToday ? styles.birthdayItemToday : ''}`}
      >
        <div
          className={styles.birthdayAvatarWrapper}
          style={{
            background: isToday
              ? 'rgba(217, 119, 6, 0.12)'
              : 'var(--surface-2)',
            color: isToday ? '#D97706' : 'var(--text-secondary)',
          }}
        >
          <Cake size={16} />
        </div>

        <div className={styles.birthdayInfoGroup}>
          <div className={styles.birthdayNameRow}>
            <span className={styles.birthdayName}>{item.name}</span>
            {item.age !== undefined && item.age > 0 && (
              <span className={styles.birthdayAgeBadge}>
                {isYesterday ? 'Turned' : isToday ? 'Turns' : 'Turning'} {item.age}
              </span>
            )}
          </div>
          <span className={styles.birthdayDateMeta}>
            {item.date} &bull; {item.advisorName || 'Advisor'}
            {item.beneficiary && !item.name.includes('(') && (
              <span className="block text-[11px] text-muted-foreground truncate font-normal">
                {item.relationship ? `${item.relationship} of ` : 'Beneficiary of '}{item.beneficiary}
              </span>
            )}
          </span>
        </div>

        <div className={styles.birthdayStatusRight}>
          <span className={styles.birthdayStatusBadge} data-when={item.when}>
            {isToday ? (
              <>
                <Sparkles size={11} className="inline mr-1 text-amber-600 dark:text-amber-400" />
                Today
              </>
            ) : isTomorrow ? (
              'Tomorrow'
            ) : (
              'Yesterday'
            )}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`${styles.dashboardCard} ${styles.birthdayCard} ${className}`}>
      <div className={`${styles.dashboardCardHeader} !p-4 !pb-2 flex-col !items-stretch gap-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`${styles.birthdayIconBadge} !w-9 !h-9 !p-2`}>
              <Cake size={20} strokeWidth={2.2} />
            </div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight m-0 leading-none">
                Client Birthdays
              </h2>
            </div>
          </div>

          <div className={`${styles.headerRightActions} flex items-center gap-2`}>
            <select
              value={selectedAdvisor}
              onChange={(e) => setSelectedAdvisor(e.target.value)}
              className="text-xs border border-border/70 bg-surface text-text-secondary rounded-lg px-2.5 py-1 outline-none font-medium focus:border-amber-500/60"
            >
              {advisorOptions.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </select>
            {todayCount > 0 && (
              <span className={`${styles.birthdayTodayPill} !text-[12px] !px-3 !py-1 !font-semibold !gap-1.5`}>
                <Sparkles size={13} />
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
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 shadow-xs'
                      : 'bg-surface text-text-secondary border-border/70 hover:border-amber-500/40 hover:text-text'
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
              <div className={styles.emptyStateTitle}>No client birthdays found</div>
              <div className={styles.emptyStateDescription}>
                {whenFilter === 'All'
                  ? 'No client birthdays yesterday, today, or tomorrow.'
                  : `No client birthdays matching ${whenFilter.toLowerCase()}.`}
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