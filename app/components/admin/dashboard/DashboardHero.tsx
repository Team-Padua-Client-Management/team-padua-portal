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
  if (period === 'evening') {
    return (
      <div className={styles.heroDecorationContainer} aria-hidden="true">
        {/* Deep Night Atmosphere Overlay */}
        <div className={styles.heroNightOverlay} />
        
        {/* Cosmic Aurora Wave */}
        <div className={styles.heroAuroraWave} />

        {/* Glowing Moon Halo */}
        <div className={styles.heroMoonGlow} />

        {/* Shooting Stars */}
        <div className={`${styles.shootingStar} ${styles.shootingStar1}`} />
        <div className={`${styles.shootingStar} ${styles.shootingStar2}`} />
        <div className={`${styles.shootingStar} ${styles.shootingStar3}`} />

        {/* Twinkling Stars */}
        <div className={styles.starsContainer}>
          <div className={`${styles.star} ${styles.starTwinkle1}`} style={{ top: '15%', left: '8%', width: '3px', height: '3px' }} />
          <div className={`${styles.star} ${styles.starTwinkle2}`} style={{ top: '28%', left: '14%', width: '4px', height: '4px', background: '#93C5FD' }} />
          <div className={`${styles.star} ${styles.starTwinkle3}`} style={{ top: '10%', left: '22%', width: '2px', height: '2px' }} />
          <div className={`${styles.star} ${styles.starTwinkle4}`} style={{ top: '42%', left: '29%', width: '3px', height: '3px', background: '#FDE68A' }} />
          <div className={`${styles.star} ${styles.starTwinkle1}`} style={{ top: '18%', left: '37%', width: '5px', height: '5px', background: '#FFFFFF' }} />
          <div className={`${styles.star} ${styles.starTwinkle3}`} style={{ top: '35%', left: '44%', width: '2px', height: '2px' }} />
          <div className={`${styles.star} ${styles.starTwinkle2}`} style={{ top: '12%', left: '52%', width: '4px', height: '4px' }} />
          <div className={`${styles.star} ${styles.starTwinkle4}`} style={{ top: '24%', left: '61%', width: '3px', height: '3px', background: '#C084FC' }} />
          <div className={`${styles.star} ${styles.starTwinkle1}`} style={{ top: '38%', left: '68%', width: '2px', height: '2px' }} />
          <div className={`${styles.star} ${styles.starTwinkle3}`} style={{ top: '16%', left: '76%', width: '4px', height: '4px' }} />
          <div className={`${styles.star} ${styles.starTwinkle2}`} style={{ top: '30%', left: '83%', width: '3px', height: '3px', background: '#93C5FD' }} />
          <div className={`${styles.star} ${styles.starTwinkle4}`} style={{ top: '10%', left: '91%', width: '5px', height: '5px' }} />
          <div className={`${styles.star} ${styles.starTwinkle1}`} style={{ top: '48%', left: '95%', width: '2px', height: '2px' }} />
          <div className={`${styles.star} ${styles.starTwinkle2}`} style={{ top: '55%', left: '18%', width: '3px', height: '3px' }} />
          <div className={`${styles.star} ${styles.starTwinkle3}`} style={{ top: '62%', left: '55%', width: '2px', height: '2px' }} />
          <div className={`${styles.star} ${styles.starTwinkle4}`} style={{ top: '20%', left: '48%', width: '4px', height: '4px', background: '#FDE68A' }} />
        </div>

        {/* Floating Night Dust Particles */}
        <div className={styles.nightDustContainer}>
          <div className={`${styles.nightDust} ${styles.dust1}`} />
          <div className={`${styles.nightDust} ${styles.dust2}`} />
          <div className={`${styles.nightDust} ${styles.dust3}`} />
          <div className={`${styles.nightDust} ${styles.dust4}`} />
          <div className={`${styles.nightDust} ${styles.dust5}`} />
        </div>
      </div>
    );
  }

  if (period === 'morning') {
    return (
      <div className={styles.heroDecorationContainer} aria-hidden="true">
        {/* Dawn Golden Atmosphere Overlay */}
        <div className={styles.heroMorningOverlay} />

        {/* Dawn Sun Glow & Rotating Sunbeams */}
        <div className={styles.heroDawnSunGlow} />
        <div className={styles.heroSunbeams} />

        {/* Drifting Morning Cloud Layers */}
        <div className={`${styles.heroCloud} ${styles.heroCloudMorning1}`}>
          <svg viewBox="0 0 100 40" fill="currentColor">
            <path d="M10,35 Q20,15 35,20 Q45,5 65,15 Q80,10 90,35 Z" />
          </svg>
        </div>
        <div className={`${styles.heroCloud} ${styles.heroCloudMorning2}`}>
          <svg viewBox="0 0 120 45" fill="currentColor">
            <path d="M10,40 Q25,18 45,22 Q60,8 85,18 Q100,12 110,40 Z" />
          </svg>
        </div>
        <div className={`${styles.heroCloud} ${styles.heroCloudMorning3}`}>
          <svg viewBox="0 0 90 35" fill="currentColor">
            <path d="M5,30 Q15,12 30,16 Q42,6 60,14 Q75,8 85,30 Z" />
          </svg>
        </div>

        {/* Flying Birds Flock */}
        <div className={styles.heroBirdFlock}>
          <svg width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2,12 Q6,6 10,12 Q14,6 18,12" />
            <path d="M22,6 Q25,2 28,6 Q31,2 34,6" />
            <path d="M38,15 Q42,9 46,15 Q50,9 54,15" />
          </svg>
        </div>

        {/* Rising Golden Dew Particles */}
        <div className={styles.dewContainer}>
          <div className={`${styles.dewParticle} ${styles.dew1}`} />
          <div className={`${styles.dewParticle} ${styles.dew2}`} />
          <div className={`${styles.dewParticle} ${styles.dew3}`} />
          <div className={`${styles.dewParticle} ${styles.dew4}`} />
          <div className={`${styles.dewParticle} ${styles.dew5}`} />
          <div className={`${styles.dewParticle} ${styles.dew6}`} />
        </div>
      </div>
    );
  }

  // Afternoon
  return (
    <div className={styles.heroDecorationContainer} aria-hidden="true">
      {/* Daylight Atmosphere Overlay */}
      <div className={styles.heroAfternoonOverlay} />

      {/* Solar Flare & Bright Sunbeams */}
      <div className={styles.heroSolarFlare} />
      <div className={styles.heroAfternoonSunbeams} />

      {/* Fluffy Afternoon Cumulus Clouds */}
      <div className={`${styles.heroCloud} ${styles.heroCloudAfternoon1}`}>
        <svg viewBox="0 0 110 40" fill="currentColor">
          <path d="M10,35 Q25,12 45,18 Q62,4 82,16 Q98,10 105,35 Z" />
        </svg>
      </div>
      <div className={`${styles.heroCloud} ${styles.heroCloudAfternoon2}`}>
        <svg viewBox="0 0 130 50" fill="currentColor">
          <path d="M10,45 Q30,15 55,22 Q75,6 100,20 Q118,14 125,45 Z" />
        </svg>
      </div>
      <div className={`${styles.heroCloud} ${styles.heroCloudAfternoon3}`}>
        <svg viewBox="0 0 95 35" fill="currentColor">
          <path d="M5,30 Q20,10 38,16 Q52,5 72,14 Q88,8 92,30 Z" />
        </svg>
      </div>

      {/* Daylight Shimmer Particles */}
      <div className={styles.daylightDustContainer}>
        <div className={`${styles.daylightParticle} ${styles.sunParticle1}`} />
        <div className={`${styles.daylightParticle} ${styles.sunParticle2}`} />
        <div className={`${styles.daylightParticle} ${styles.sunParticle3}`} />
        <div className={`${styles.daylightParticle} ${styles.sunParticle4}`} />
        <div className={`${styles.daylightParticle} ${styles.sunParticle5}`} />
      </div>
    </div>
  );
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
