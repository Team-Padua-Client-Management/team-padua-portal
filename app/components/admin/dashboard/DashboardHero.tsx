import React, { useState } from 'react';
import Link from 'next/link';
import { Sunrise, Sun, Moon, Clock, RefreshCw, Loader2, Calendar } from 'lucide-react';
import { PomodoroMode, POMODORO_CONFIG, formatPomoTime } from './PomodoroCard';
import styles from '@/styles/admin/dashboard/page.module.css';

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export type Portal = {
  name: string;
  url: string;
  manage: string;
  mark?: string;
  logo?: string;
  logoDark?: string;
  img?: string;
  width?: number;
};

interface DashboardHeroProps {
  adminName: string;
  greeting: string;
  dayPeriod: DayPeriod;
  currentDate: string;
  currentTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  portals: Portal[];
  customPortals: any[];
  pomoMode: PomodoroMode;
  pomoSeconds: number;
  pomoIsRunning: boolean;
  pomoCompletedSessions: number;
  pomoNotice: string | null;
  onPomoModeChange: (mode: PomodoroMode) => void;
  onPomoTogglePlay: () => void;
  onPomoReset: () => void;
  onPomoSkip: () => void;
}

function HeroDecoration({ period }: { period: DayPeriod }) {
  return null;
}

function PortalMark({ portal }: { portal: Portal }) {
  const [broken, setBroken] = useState(false);
  const source = portal.logo || portal.img;

  if (!source || broken) {
    return <span className={styles.portalMarkText}>{portal.name.charAt(0).toUpperCase()}</span>;
  }
  return (
    <img
      src={source}
      alt={portal.name}
      className={styles.portalLogoImg}
      style={portal.width ? { width: `${portal.width}px`, height: `${portal.width}px` } : undefined}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export default function DashboardHero({
  adminName,
  greeting,
  dayPeriod,
  currentDate,
  currentTime,
  isRefreshing,
  onRefresh,
  portals,
  customPortals,
  pomoMode,
  pomoSeconds,
  pomoIsRunning,
  pomoCompletedSessions,
  pomoNotice,
  onPomoModeChange,
  onPomoTogglePlay,
  onPomoReset,
  onPomoSkip
}: DashboardHeroProps) {
  const periodIcon = dayPeriod === 'evening' ? <Moon size={11} strokeWidth={2.2} /> : dayPeriod === 'afternoon' ? <Sun size={11} strokeWidth={2.2} /> : <Sunrise size={11} strokeWidth={2.2} />;

  return (
    <div className={styles.heroCard} data-period={dayPeriod}>
      <HeroDecoration period={dayPeriod} />

      {/* Left side: Greeting badge, Welcome title, Role badge, Portal shortcuts */}
      <div className={styles.heroLeft}>
        <div className={styles.greetingBadge}>
          {periodIcon}
          <span>{greeting}</span>
        </div>

        <h1 className={styles.welcomeText}>
          Welcome, <span className={styles.usernameHighlight}>{adminName}</span>
        </h1>

        <div className={styles.memberBadge}>
          <span>ROLE AUTHORIZED &bull; ADMINISTRATOR</span>
        </div>

        <div className={styles.heroPortals}>
          {portals.map((portal) => (
            <Link
              key={portal.name}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroPortalCard}
              title={portal.name}
            >
              <div className={styles.heroPortalIconWrapper}>
                <PortalMark portal={portal} />
              </div>
              <span className={styles.heroPortalName}>{portal.name}</span>
            </Link>
          ))}
          {customPortals.map((portal, idx) => (
            <Link
              key={`custom-portal-${idx}`}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroPortalCard}
              title={portal.name}
            >
              <div className={styles.heroPortalIconWrapper}>
                <PortalMark portal={{ name: portal.name, url: portal.url, manage: '', logo: portal.iconUrl }} />
              </div>
              <span className={styles.heroPortalName}>{portal.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Right side: Integrated Glass Card (Date, Time, Refresh + Pomodoro Timer) */}
      <div className={styles.heroGlassCard}>
        {/* Top bar inside glass card: Date | Time | Refresh */}
        <div className={styles.glassTopBar}>
          <div className={styles.glassDateGroup}>
            <Calendar size={13} className={styles.glassCalendarIcon} />
            <span className={styles.glassDateText}>{currentDate}</span>
          </div>

          <div className={styles.glassDivider} />

          <div className={styles.glassTimeGroup}>
            <Clock size={13} className={styles.glassClockIcon} />
            <span className={styles.glassTimeText}>{currentTime}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className={styles.glassRefreshBtn}
            title="Refresh dashboard"
          >
            {isRefreshing ? <Loader2 size={13} className={styles.spinIcon} /> : <RefreshCw size={13} strokeWidth={2} />}
          </button>
        </div>

        <div className={styles.glassCardSeparator} />

        {/* Bottom bar inside glass card: Timer 25:00 | Start | Short Break | Long Break */}
        <div className={styles.glassPomodoroRow}>
          <span className={styles.glassTimerDisplay}>{formatPomoTime(pomoSeconds)}</span>

          <div className={styles.glassPomoButtons}>
            <button
              type="button"
              onClick={onPomoTogglePlay}
              className={styles.glassStartBtn}
            >
              {pomoIsRunning ? 'Pause' : pomoSeconds < POMODORO_CONFIG[pomoMode].duration ? 'Resume' : 'Start'}
            </button>

            <button
              type="button"
              onClick={() => onPomoModeChange('shortBreak')}
              className={`${styles.glassPomoTab} ${pomoMode === 'shortBreak' ? styles.glassPomoTabActive : ''}`}
            >
              Short Break
            </button>

            <button
              type="button"
              onClick={() => onPomoModeChange('longBreak')}
              className={`${styles.glassPomoTab} ${pomoMode === 'longBreak' ? styles.glassPomoTabActive : ''}`}
            >
              Long Break
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
