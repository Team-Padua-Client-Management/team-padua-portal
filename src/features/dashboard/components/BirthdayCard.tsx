'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Cake, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import styles from '@/styles/admin/dashboard/page.module.css';

export interface BirthdayItem {
  id: string;
  name: string;
  date: string;
  when: 'today' | 'yesterday' | 'tomorrow';
  age?: number;
  advisorId: string;
  advisorName: string;
  policyNo?: string;
}

export interface AdvisorItem {
  id: string;
  advisor_name: string;
  advisor_code?: string;
}

interface BirthdayCardProps {
  birthdays?: BirthdayItem[];
  advisors?: AdvisorItem[];
}

interface ParsedBirthday {
  when: 'today' | 'yesterday' | 'tomorrow';
  ageTurning: number;
  dateDisplay: string;
}

function extractMonthDayYear(birthRaw: string): { year: number; month: number; day: number } | null {
  const trimmed = String(birthRaw).trim();

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() };
  }

  return null;
}

function computeWhenAndAge(birthRaw: string | null): ParsedBirthday | null {
  if (!birthRaw) return null;

  const extracted = extractMonthDayYear(birthRaw);
  if (!extracted) return null;

  const { year: birthYear, month, day } = extracted;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = todayStart.getFullYear();

  const birthdayThisYear = new Date(thisYear, month, day);
  const diffDays = Math.round((birthdayThisYear.getTime() - todayStart.getTime()) / 86400000);

  let when: ParsedBirthday['when'] | null = null;
  if (diffDays === 0) when = 'today';
  else if (diffDays === 1) when = 'tomorrow';
  else if (diffDays === -1) when = 'yesterday';

  if (!when) return null;

  const ageTurning = thisYear - birthYear;
  const dateDisplay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(thisYear, month, day)
  );

  return { when, ageTurning, dateDisplay };
}

type FetchStatus = 'idle' | 'loading' | 'error' | 'success';

export default function BirthdayCard({ birthdays = [], advisors = [] }: BirthdayCardProps) {
  const [advisorList, setAdvisorList] = useState<AdvisorItem[]>(advisors);
  const [birthdayItems, setBirthdayItems] = useState<BirthdayItem[]>(birthdays);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [selectedAdvisor, setSelectedAdvisor] = useState('All');
  const [whenFilter, setWhenFilter] = useState<'All' | 'Yesterday' | 'Today' | 'Tomorrow'>('All');

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setStatus('loading');

      const [advisorRes, clientRes] = await Promise.all([
        supabase.from('advisors').select('id, advisor_name, advisor_code').order('advisor_name'),
        supabase
          .from('cpst_clients')
          .select('id, client_name, birthdate, advisor_id, policy_number, advisor:advisors(id, advisor_name, advisor_code)')
          .order('created_at', { ascending: false }),
      ]);

      const { data: advisorData, error: advisorError } = advisorRes;
      const { data: clientData, error: clientError } = clientRes;

      if (!mounted) return;

      if (advisorError) {
        console.error('BirthdayCard Advisor Supabase error:', advisorError);
      }

      if (clientError) {
        console.error('BirthdayCard Supabase error:', clientError);
        console.error('BirthdayCard Supabase error JSON:', JSON.stringify(clientError, null, 2));
        setStatus('error');
        setAdvisorList(advisorData || []);
        setBirthdayItems([]);
        return;
      }

      const items: BirthdayItem[] = [];

      for (const c of (clientData || []) as any[]) {
        const computed = computeWhenAndAge(c.birthdate || null);
        if (!computed) continue;

        const advisorRecord = Array.isArray(c.advisor) ? c.advisor[0] : c.advisor;
        const advisorId = advisorRecord?.id || c.advisor_id || 'Unassigned';
        const advisorName = advisorRecord?.advisor_name || 'Unassigned';

        items.push({
          id: c.id,
          name: c.client_name || 'Unnamed',
          date: computed.dateDisplay,
          when: computed.when,
          age: computed.ageTurning,
          advisorId,
          advisorName,
          policyNo: c.policy_number || undefined,
        });
      }

      setAdvisorList(advisorData || []);
      setBirthdayItems(items);
      setStatus('success');
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const advisorOptions = useMemo(() => {
    const opts = [
      { id: 'All', name: 'All Advisors' },
      ...advisorList.map((a) => ({ id: a.id, name: a.advisor_name })),
    ];
    const unique: Record<string, { id: string; name: string }> = {};
    for (const o of opts) unique[o.id] = o;
    return Object.values(unique);
  }, [advisorList]);

  const filteredBirthdays = useMemo(() => {
    let items = selectedAdvisor === 'All'
      ? birthdayItems
      : birthdayItems.filter((b) => b.advisorId === selectedAdvisor);

    if (whenFilter !== 'All') {
      const targetWhen = whenFilter.toLowerCase();
      items = items.filter((b) => b.when === targetWhen);
    }

    const priority = { yesterday: 0, today: 1, tomorrow: 2 };
    return [...items].sort((a, b) => (priority[a.when] ?? 99) - (priority[b.when] ?? 99));
  }, [birthdayItems, selectedAdvisor, whenFilter]);

  const todayCount = filteredBirthdays.filter((b) => b.when === 'today').length;
  const isLoading = status === 'loading' || status === 'idle';

  return (
    <div className={`${styles.dashboardCard} ${styles.birthdayCard}`}>
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
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          {(['All', 'Yesterday', 'Today', 'Tomorrow'] as const).map((filter) => {
            const isActive = whenFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setWhenFilter(filter)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                    : 'bg-surface/80 text-text-secondary border-border/70 hover:border-amber-500/50 hover:text-text hover:bg-surface'
                  }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.dashboardCardBody}>
        {isLoading ? (
          <div className={styles.birthdayEmptyContainer}>
            <div className={styles.birthdayEmptyIcon}>🎂</div>
            <div className={styles.emptyStateTitle}>Loading birthdays...</div>
          </div>
        ) : status === 'error' ? (
          <div className={styles.birthdayEmptyContainer}>
            <div className={styles.birthdayEmptyIcon}>🎂</div>
            <div className={styles.emptyStateTitle}>Couldn't load birthdays</div>
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
            <Link href="/admin/cpst" className={styles.birthdayEmptyLinkBtn}>
              <span>Open CPST Birthday Center</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        ) : (
          <div className={styles.birthdayList}>
            {filteredBirthdays.map((item) => {
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
                      {item.date} {item.age !== undefined && item.age > 0 ? `• ${item.age} yrs old` : ''}{' '}
                      {item.advisorName ? `• ${item.advisorName}` : ''}
                    </span>
                  </div>

                  <div className={styles.birthdayStatusRight}>
                    <span className={styles.birthdayStatusBadge} data-when={item.when}>
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