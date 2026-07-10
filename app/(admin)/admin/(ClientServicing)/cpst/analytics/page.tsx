'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/cpst/analytics/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/cpst/analytics/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, BellRing, Send, Sparkles, CalendarDays, Grid } from 'lucide-react';
import {
  Users, BarChart3, Calendar,
  TrendingUp, Activity, Info,
  ArrowDown, ArrowUp, List
} from 'lucide-react';
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";

interface Client {
  id: string;
  name: string;
  relationship: string;
  birthdate: string;
  status: 'Prospect' | 'Serviced' | 'Lead';
  gender?: 'Male' | 'Female' | string;
}

interface MiniBirthdayCenterProps {
  clients?: Client[];
}

/**
 * Executes operations logic for MiniBirthdayCenter.
 *
 * @param { clients = [] }: MiniBirthdayCenterProps
 * @returns State operations sequence.
 */
function MiniBirthdayCenter({ clients = [] }: MiniBirthdayCenterProps) {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [today, setToday] = useState(new Date());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentMonthIdx = selectedMonthIdx;
  const currentDateNum = today.getDate();
  const currentYearNum = today.getFullYear();
  const currentMonthName = monthsList[selectedMonthIdx];

  const getDaysUntilBirthday = (birthdateStr: string): number => {
    if (!birthdateStr) return 999;
    const bdate = new Date(birthdateStr);
    const bMonth = bdate.getMonth();
    const bDay = bdate.getDate();
    let nextBDayYear = today.getFullYear();
    if (bMonth < currentMonthIdx || (bMonth === currentMonthIdx && bDay < currentDateNum)) {
      nextBDayYear++;
    }
    const nextBDay = new Date(nextBDayYear, bMonth, bDay);
    const diffTime = nextBDay.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
 * Executes operations logic for getClientsWithBirthdayOnDay.
 *
 * @param dayNum: number | null
 * @returns State operations sequence.
 */
const getClientsWithBirthdayOnDay = (dayNum: number | null) => {
    if (!dayNum) return [];
    return (clients || []).filter(c => {
      if (!c || !c.birthdate) return false;
      const d = new Date(c.birthdate);
      return d.getMonth() === currentMonthIdx && d.getDate() === dayNum;
    });
  };

  /**
 * Executes operations logic for getCalendarDaysGrid.
 *
 * 
 * @returns State operations sequence.
 */
const getCalendarDaysGrid = () => {
    const firstDayOfMonth = new Date(currentYearNum, currentMonthIdx, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = new Date(currentYearNum, currentMonthIdx + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < startDayOfWeek; i++) grid.push(null);
    for (let d = 1; d <= totalDaysInMonth; d++) grid.push(d);
    return grid;
  };

  const currentMonthCalendarGrid = getCalendarDaysGrid();
  const birthdayTodayClients = getClientsWithBirthdayOnDay(currentDateNum);
  const selectedDateClients = selectedDateStr ? getClientsWithBirthdayOnDay(parseInt(selectedDateStr)) : [];

  const upcomingBirthdaysList = (clients || [])
    .map(c => ({ client: c, daysUntil: getDaysUntilBirthday(c.birthdate) }))
    .filter(item => item.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  let tdyCount = birthdayTodayClients.length;
  let tmrwCount = (clients || []).filter(c => {
    if (!c || !c.birthdate) return false;
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(today.getDate() + 1);
    const d = new Date(c.birthdate);
    return d.getMonth() === tomorrowDate.getMonth() && d.getDate() === tomorrowDate.getDate();
  }).length;

  let weekCount = (clients || []).filter(c => c && c.birthdate && getDaysUntilBirthday(c.birthdate) <= 7).length;
  let mthCount = (clients || []).filter(c => c && c.birthdate && new Date(c.birthdate).getMonth() === currentMonthIdx).length;

  return (
    <div className={styles.card_0}>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.container_1}
      >
        <div className={styles.div_2}>
          <h2 className={styles.table_3}>
            <Sparkles size={13} className={styles.text_4} /> Birthday Center
          </h2>
          <p className={styles.table_5}>
            {today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className={styles.text_6}>
          {today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.div_7}
      >
        <div className={styles.container_8}>
          <BellRing size={15} className={styles.text_9} />
          <div className={styles.div_10}>
            <h3 className={styles.table_11}>Today's Announcement</h3>
            <p className={styles.text_12}>{tdyCount} Birthdays Today</p>
          </div>
        </div>
        {birthdayTodayClients.length > 0 && (
          <div className={styles.div_13}>
            {birthdayTodayClients.map((client, i) => (
              <div key={i} className={styles.card_14}>
                <span className={styles.table_15}>• {client.name}</span>
                <button className={styles.text_16}>
                  <Send size={8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className={styles.card_17}>
        <div className={styles.container_18}>
          <span className={styles.table_19}>
            <Grid size={10} className={styles.text_20} />
            <select
              value={selectedMonthIdx}
              onChange={(e) => {
                setSelectedMonthIdx(parseInt(e.target.value));
                setSelectedDateStr(null);
              }}
              className={styles.monthSelect}
            >
              {monthsList.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </span>
        </div>

        <div className={styles.text_21}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>

        <div className={styles.container_22}>
          {currentMonthCalendarGrid.map((day, idx) => {
            if (day === null) return <div key={idx} className={styles.div_23} />;
            const dayClients = getClientsWithBirthdayOnDay(day);
            const isToday = day === currentDateNum;
            const isSelected = selectedDateStr === day.toString();

            let bgClass = 'bg-transparent text-gray-700 dark:text-zinc-300 hover:bg-muted/50';
            if (dayClients.length > 0) {
              bgClass = 'bg-yellow-100/60 dark:bg-yellow-900/20 text-[#A97800] dark:text-[#F4C542] font-bold hover:bg-yellow-200/60 dark:hover:bg-yellow-900/40';
            }
            if (isToday) {
              bgClass = 'bg-[#F4C542] dark:bg-[#A97800] text-white font-bold shadow-xs';
            }

            return (
              <motion.button
                key={idx}
                onClick={() => setSelectedDateStr(day.toString())}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className={`${styles.table_141} ${bgClass} ${isSelected ? 'ring-2 ring-foreground dark:ring-white ring-offset-2 dark:ring-offset-zinc-900' : ''
                  }`}
              >
                <span>{day}</span>
              </motion.button>
            );
          })}
        </div>

        {selectedDateStr && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={styles.div_24}>
            <div className={styles.text_25}>
              <span>Selected: {selectedDateStr}</span>
              <button onClick={() => setSelectedDateStr(null)} className={styles.text_26}>Clear</button>
            </div>
            <div className={styles.div_27}>
              {selectedDateClients.length === 0 ? (
                <p className={styles.text_28}>No metrics registered.</p>
              ) : (
                selectedDateClients.map((c, i) => (
                  <div key={i} className={styles.text_29}>
                    <p className={styles.table_30}>🎂 {c.name}</p>
                    <p className={styles.text_31}>{c.relationship || 'Holder'} • {c.status} • Age {c.birthdate ? (today.getFullYear() - new Date(c.birthdate).getFullYear()) : 0}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className={styles.text_32}>
        {[
          { l: 'Today', v: tdyCount, c: 'text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-950/40' },
          { l: 'Tmrw', v: tmrwCount, c: 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-950/40' },
          { l: '7 Days', v: weekCount, c: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/10 border-[#F4C542]/30 dark:border-yellow-950/40' },
          { l: 'Month', v: mthCount, c: 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/10 border-purple-200 dark:border-purple-950/40' }
        ].map((item, i) => (
          <div key={i} className={`${styles.div_142} ${item.c}`}>
            <span className={styles.table_33}>{item.l}</span>
            <span className={styles.text_34}>{item.v}</span>
          </div>
        ))}
      </div>

      <div className={styles.card_35}>
        <span className={styles.table_36}>
          <CalendarDays size={10} /> Upcoming Timeline
        </span>
        <div className={styles.text_37}>
          {upcomingBirthdaysList.length === 0 ? (
            <p className={styles.text_38}>No clear horizons records.</p>
          ) : (
            upcomingBirthdaysList.slice(0, 5).map((item, idx) => (
              <div key={idx} className={styles.text_39}>
                <span className={styles.table_40}>{item.client.name}</span>
                <span className={styles.text_41}>
                  {item.daysUntil === 0 ? 'Today' : item.daysUntil === 1 ? 'Tmrw' : `${item.daysUntil}d`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const monthsList = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

/**
 * CPSTAnalyticsPage
 *
 * Renders the CPSTAnalyticsPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for CPSTAnalyticsPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function CPSTAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    /**
 * Executes operations logic for fetchClients.
 *
 * 
 * @returns State operations sequence.
 */
const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setClients(data as Client[]);
      } catch (err) {
        console.error('Error fetching clients', err);
      }
    };
    fetchClients();
  }, []);

  const getClientAge = (birthdateStr: string): number => {
    if (!birthdateStr) return 0;
    const birthDate = new Date(birthdateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthsDiff = today.getMonth() - birthDate.getMonth();
    const daysDiff = today.getDate() - birthDate.getDate();
    if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
      age--;
    }
    return age;
  };

  const totalClients = clients.length;

  const ages = clients.map(c => getClientAge(c.birthdate)).filter(age => !isNaN(age));
  const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const youngestClient = ages.length > 0 ? Math.min(...ages) : 0;
  const oldestClient = ages.length > 0 ? Math.max(...ages) : 0;
  const ageRange = oldestClient - youngestClient;

  /**
 * Executes operations logic for getMedianAge.
 *
 * @param arr: number[]
 * @returns State operations sequence.
 */
const getMedianAge = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };
  const medianAge = getMedianAge(ages);

  /**
 * Executes operations logic for getMostCommonAge.
 *
 * @param arr: number[]
 * @returns State operations sequence.
 */
const getMostCommonAge = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const mapping: Record<number, number> = {};
    let maxCount = 0;
    let mostCommon = arr[0];
    arr.forEach(val => {
      mapping[val] = (mapping[val] || 0) + 1;
      if (mapping[val] > maxCount) {
        maxCount = mapping[val];
        mostCommon = val;
      }
    });
    return mostCommon;
  };
  const mostCommonAge = getMostCommonAge(ages);

  const todayObj = new Date();
  const currentMonthIdx = todayObj.getMonth();
  const currentDateNum = todayObj.getDate();

  const getDaysUntilBirthday = (birthdateStr: string): number => {
    if (!birthdateStr) return 999;
    const bdate = new Date(birthdateStr);
    const bMonth = bdate.getMonth();
    const bDay = bdate.getDate();
    let nextBDayYear = todayObj.getFullYear();
    if (bMonth < currentMonthIdx || (bMonth === currentMonthIdx && bDay < currentDateNum)) {
      nextBDayYear++;
    }
    const nextBDay = new Date(nextBDayYear, bMonth, bDay);
    const diffTime = nextBDay.getTime() - todayObj.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  let birthdayTodayCount = 0;
  let birthdayTomorrowCount = 0;
  let birthdayThisMonthCount = 0;
  let next30DaysCount = 0;

  clients.forEach(c => {
    if (!c.birthdate) return;
    const bdate = new Date(c.birthdate);
    const bMonth = bdate.getMonth();
    const bDay = bdate.getDate();
    const daysUntil = getDaysUntilBirthday(c.birthdate);

    if (bMonth === currentMonthIdx && bDay === currentDateNum) birthdayTodayCount++;

    const tomorrowDate = new Date(todayObj);
    tomorrowDate.setDate(todayObj.getDate() + 1);
    if (bMonth === tomorrowDate.getMonth() && bDay === tomorrowDate.getDate()) birthdayTomorrowCount++;

    if (bMonth === currentMonthIdx) birthdayThisMonthCount++;

    if (daysUntil >= 0 && daysUntil <= 30) next30DaysCount++;
  });

  const birthdayDistribution = monthsList.map((month, mIdx) => {
    const monthClients = clients.filter(c => c.birthdate && new Date(c.birthdate).getMonth() === mIdx);
    const totalCount = monthClients.length;
    const pct = totalClients > 0 ? (totalCount / totalClients) * 100 : 0;

    const serviced = monthClients.filter(c => c.status === 'Serviced').length;
    const prospects = monthClients.filter(c => c.status === 'Prospect').length;
    const leads = monthClients.filter(c => c.status === 'Lead').length;

    return {
      month,
      totalClients: totalCount,
      percentage: pct,
      serviced,
      prospects,
      leads
    };
  });

  const maxMonthDistributionCount = Math.max(...birthdayDistribution.map(m => m.totalClients), 1);

  const sortedRankings = [...birthdayDistribution]
    .map((m, i) => ({ name: m.month, count: m.totalClients, index: i }))
    .sort((a, b) => b.count - a.count);

  const mostCommonBirthMonth = sortedRankings[0]?.name || 'N/A';
  const leastCommonBirthMonth = [...sortedRankings].reverse().find(m => m.count >= 0)?.name || 'N/A';

  const q1Count = birthdayDistribution.slice(0, 3).reduce((acc, m) => acc + m.totalClients, 0);
  const q2Count = birthdayDistribution.slice(3, 6).reduce((acc, m) => acc + m.totalClients, 0);
  const q3Count = birthdayDistribution.slice(6, 9).reduce((acc, m) => acc + m.totalClients, 0);
  const q4Count = birthdayDistribution.slice(9, 12).reduce((acc, m) => acc + m.totalClients, 0);

  const quarters = [
    { label: 'Q1', count: q1Count },
    { label: 'Q2', count: q2Count },
    { label: 'Q3', count: q3Count },
    { label: 'Q4', count: q4Count }
  ];

  const highestQuarter = [...quarters].sort((a, b) => b.count - a.count)[0]?.label || 'N/A';
  const lowestQuarter = [...quarters].sort((a, b) => a.count - b.count)[0]?.label || 'N/A';

  const insights: string[] = [];
  if (totalClients > 0) {
    insights.push(`Most birthdays occur in ${mostCommonBirthMonth.toLowerCase()}.`);

    const janCount = birthdayDistribution[0].totalClients;
    const augCount = birthdayDistribution[7].totalClients;
    if (augCount > 0 && janCount / augCount >= 1.5) {
      insights.push(`January has ${Math.round(janCount / augCount)}x more birthdays than August.`);
    } else {
      insights.push(`January holds ${janCount} active client birthday records.`);
    }

    const q2Pct = Math.round((q2Count / totalClients) * 100);
    insights.push(`${q2Pct}% of all birthdays occur during Q2.`);
    insights.push(`Average age of registered registry database is ${averageAge}.`);
    insights.push(`${next30DaysCount} birthdays will happen within 30 days.`);
    insights.push(`${leastCommonBirthMonth.toLowerCase()} has the lowest number of birthdays.`);
  }

  const servicedTotal = clients.filter(c => c.status === 'Serviced').length;
  const leadTotal = clients.filter(c => c.status === 'Lead').length;
  const prospectTotal = clients.filter(c => c.status === 'Prospect').length;
  const maxStatusCount = Math.max(servicedTotal, leadTotal, prospectTotal, 1);

  return (
    <div className={styles.text_42}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_43}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_44}>
          <div className={styles.container_45}>
            <div>
              <h1 className={styles.text_46}>CPST CPSTAnalyticsPage</h1>
              <p className={styles.table_47}>Automated Real-Time Dashboard Reporting</p>
            </div>
            <div className={styles.text_48}>
              <span className={styles.container_49}>
                <span className={styles.div_50} /> Read-Only Data Safe Sync
              </span>
            </div>
          </div>

          <div className={styles.container_51}>
            <div className={styles.container_52}>
              <div className={styles.div_53}>
                <h2 className={styles.table_54}>
                  WORKSPACE METRICS OVERVIEW
                </h2>
                <p className={styles.text_55}>
                  Live database statistics counters across CPST database sectors
                </p>
              </div>

              <div className={styles.container_56}>
                {[
                  { label: 'TOTAL CLIENTS', val: totalClients, link: 'PROSPECTS ↗', icon: Users, isYellowBorder: true },
                  { label: 'AVERAGE AGE', val: `${averageAge} yrs`, link: 'YEARS', icon: Activity },
                  { label: 'BIRTHDAYS THIS MONTH', val: birthdayThisMonthCount, link: 'ACTIVE ↗', icon: Calendar },
                  { label: 'UPCOMING (30D)', val: next30DaysCount, link: 'HORIZON ↗', icon: Clock }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      className={`${styles.card_143} ${card.isYellowBorder ? 'border-[#F4C542]/40 ring-1 ring-[#F4C542]/10' : 'border-border'
                        }`}
                    >
                      <div className={styles.table_57}>
                        <span>{card.label}</span>
                        <Icon size={12} className={styles.text_58} />
                      </div>
                      <div className={styles.container_59}>
                        <span className={styles.text_60}>{card.val}</span>
                        <span className={`${styles.table_144} ${card.link.includes('↗') ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          }`}>{card.link}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.div_61}>
                <h2 className={styles.table_62}>
                  INTERACTIVE BIRTHDAY METRICS
                </h2>
                <p className={styles.text_63}>
                  Real-time charts plotting monthly distributions, age demographics, and servicing status
                </p>
              </div>

              <div className={styles.card_64}>
                <h3 className={styles.table_65}>
                  <BarChart3 size={12} /> Birthday Month Distribution Matrix
                </h3>
                <div className={styles.div_66}>
                  {birthdayDistribution.map((row, idx) => {
                    const pctWidth = maxMonthDistributionCount > 0 ? (row.totalClients / maxMonthDistributionCount) * 100 : 0;
                    return (
                      <div key={idx} className={`${styles.container_67} group`}>
                        <div className={styles.text_68}>
                          <span className={styles.text_69}>{row.month.slice(0, 3)}</span>
                          <div className={styles.text_70}>
                            <span>{row.totalClients} Clients</span>
                            <span className={styles.text_71}>{row.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className={`${styles.table_72} group`}>
                          <div
                            className={styles.table_73}
                            style={{ width: `${pctWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.container_74}>
                <div className={styles.card_75}>
                  <h3 className={styles.table_76}>
                    <BarChart3 size={12} /> Birthday Month Density Chart
                  </h3>
                  <div className={styles.container_77}>
                    <div className={styles.container_78}>
                      {[0, 1, 2, 3, 4].map(line => (
                        <div key={line} className={styles.div_79} />
                      ))}
                    </div>
                    <div className={styles.container_80}>
                      {birthdayDistribution.map((row, idx) => {
                        const pctHeight = maxMonthDistributionCount > 0 ? (row.totalClients / maxMonthDistributionCount) * 100 : 0;
                        return (
                          <div key={idx} className={`${styles.container_81} group`}>
                            <div className={`${styles.card_82} group`}>
                              <p className={styles.text_83}>{row.month}</p>
                              <p className={styles.text_84}>{row.totalClients} clients</p>
                              <p className={styles.text_85}>{row.percentage.toFixed(1)}%</p>
                            </div>
                            <div className={styles.container_86}>
                              <div
                                className={styles.table_87}
                                style={{ height: `${pctHeight > 0 ? Math.max(pctHeight, 5) : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.text_88}>
                      {birthdayDistribution.map((row, idx) => (
                        <span key={idx} className={styles.text_89}>{row.month.slice(0, 3)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.card_90}>
                  <h3 className={styles.table_91}>
                    <Activity size={12} /> Operational Funnel Metrics
                  </h3>
                  <div className={styles.div_92}>
                    {[
                      { label: 'SERVICED', count: servicedTotal, color: 'bg-green-500 dark:bg-green-600' },
                      { label: 'LEAD', count: leadTotal, color: 'bg-[#F4C542]' },
                      { label: 'PROSPECT', count: prospectTotal, color: 'bg-blue-500 dark:bg-blue-600' }
                    ].map((statusRow, i) => {
                      const barWidth = maxStatusCount > 0 ? (statusRow.count / maxStatusCount) * 100 : 0;
                      return (
                        <div key={i} className={styles.div_93}>
                          <div className={styles.text_94}>
                            <span className={styles.text_95}>{statusRow.label}</span>
                            <span className={styles.text_96}>{statusRow.count}</span>
                          </div>
                          <div className={styles.div_97}>
                            <div className={`${styles.div_145} ${statusRow.color} rounded-full`} style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.container_98}>
                <div className={styles.card_99}>
                  <h3 className={styles.table_100}>
                    <TrendingUp size={12} /> Birthday Trend & Quarter Breakdown
                  </h3>
                  <div className={styles.container_101}>
                    {quarters.map((q, i) => (
                      <div key={i} className={styles.container_102}>
                        <span className={styles.text_103}>{q.label}</span>
                        <span className={styles.text_104}>{q.count} Clients</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.text_105}>
                    <div>
                      <span className={styles.table_106}>Highest Quarter Volume</span>
                      <div className={styles.text_107}>
                        <ArrowUp size={15} /> {highestQuarter}
                      </div>
                    </div>
                    <div>
                      <span className={styles.table_108}>Lowest Quarter Volume</span>
                      <div className={styles.text_109}>
                        <ArrowDown size={15} /> {lowestQuarter}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.card_110}>
                  <h3 className={styles.table_111}>
                    <Activity size={12} /> Comprehensive Birthday Demographics
                  </h3>
                  <div className={styles.text_112}>
                    {[
                      { label: 'Youngest Client', val: `${youngestClient} yrs` },
                      { label: 'Oldest Client', val: `${oldestClient} yrs` },
                      { label: 'Average Age', val: `${averageAge} yrs` },
                      { label: 'Median Age', val: `${medianAge} yrs` },
                      { label: 'Most Common Age', val: `${mostCommonAge} yrs` },
                      { label: 'Active Age Range', val: `${ageRange} yrs` }
                    ].map((stat, i) => (
                      <div key={i} className={styles.div_113}>
                        <span className={styles.table_114}>{stat.label}</span>
                        <span className={styles.text_115}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.card_116}>
                <h3 className={styles.table_117}>
                  <List size={12} /> Monthly Distribution Table Dashboard
                </h3>
                <div className={styles.div_118}>
                  <table className={styles.text_119}>
                    <thead>
                      <tr className={styles.table_120}>
                        <th className={styles.div_121}>Month</th>
                        <th className={styles.div_122}>Clients</th>
                        <th className={styles.div_123}>%</th>
                        <th className={styles.div_124}>Serviced</th>
                        <th className={styles.div_125}>Leads</th>
                        <th className={styles.div_126}>Prospects</th>
                      </tr>
                    </thead>
                    <tbody className={styles.div_127}>
                      {birthdayDistribution.map((row, idx) => (
                        <tr key={idx} className={styles.table_128}>
                          <td className={styles.text_129}>{row.month}</td>
                          <td className={styles.text_130}>{row.totalClients}</td>
                          <td className={styles.text_131}>{row.percentage.toFixed(1)}%</td>
                          <td className={styles.text_132}>{row.serviced}</td>
                          <td className={styles.text_133}>{row.leads}</td>
                          <td className={styles.text_134}>{row.prospects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.div_135}>
              <MiniBirthdayCenter clients={clients} />

              <div className={styles.card_136}>
                <h3 className={styles.table_137}>
                  <Info size={12} /> Derived Statistical Insights
                </h3>
                <div className={styles.div_138}>
                  {insights.map((insight, idx) => (
                    <div key={idx} className={styles.text_139}>
                      <span className={styles.text_140}>✔</span>
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
