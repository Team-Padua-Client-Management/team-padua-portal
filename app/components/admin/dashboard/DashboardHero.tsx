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
      <svg className={styles.heroIllustration} viewBox="0 0 900 220" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Moon Glow & Glowing Crescent */}
        <circle cx="390" cy="50" r="32" fill="url(#moonGlow)" />
        <circle cx="390" cy="50" r="18" fill="#FFFBEB" />
        <circle cx="398" cy="44" r="18" fill="#586580" />

        {/* Twinkling Stars */}
        <g fill="#FFFFFF" opacity="0.85">
          <circle cx="90" cy="30" r="1.5" />
          <circle cx="160" cy="55" r="1.2" />
          <circle cx="240" cy="25" r="1.8" />
          <circle cx="320" cy="40" r="1.2" />
          <circle cx="480" cy="30" r="1.6" />
          <circle cx="560" cy="18" r="1.4" />
          <circle cx="640" cy="45" r="1.5" />
          <circle cx="720" cy="28" r="1.2" />
          <circle cx="810" cy="50" r="1.6" />
        </g>

        {/* Night Mountains */}
        <path d="M-20 220 L140 120 L310 220 Z" fill="#3D4860" opacity="0.4" />
        <path d="M120 220 L320 100 L510 220 Z" fill="#333E54" opacity="0.35" />

        {/* Illuminated Night City Skyline */}
        <g fill="#252D3F" opacity="0.85">
          <rect x="420" y="130" width="28" height="90" rx="1" />
          <rect x="452" y="100" width="34" height="120" rx="2" />
          <path d="M469 82 L469 100" stroke="#252D3F" strokeWidth="2" />
          <rect x="490" y="145" width="26" height="75" rx="1" />
          <rect x="520" y="115" width="38" height="105" rx="2" />
          <rect x="562" y="130" width="30" height="90" rx="1" />
          <rect x="596" y="90" width="42" height="130" rx="2" />
          <path d="M617 72 L617 90" stroke="#252D3F" strokeWidth="2" />
          <rect x="642" y="135" width="32" height="85" rx="1" />
          <rect x="678" y="110" width="36" height="110" rx="2" />
          <rect x="718" y="140" width="28" height="80" rx="1" />
        </g>

        {/* Glowing City Window Lights */}
        <g fill="#FDE047" opacity="0.75">
          <rect x="460" y="115" width="3" height="4" />
          <rect x="468" y="125" width="3" height="4" />
          <rect x="460" y="140" width="3" height="4" />
          <rect x="530" y="130" width="3" height="4" />
          <rect x="542" y="145" width="3" height="4" />
          <rect x="606" y="105" width="4" height="5" />
          <rect x="618" y="120" width="4" height="5" />
          <rect x="606" y="140" width="4" height="5" />
          <rect x="626" y="155" width="4" height="5" />
          <rect x="688" y="125" width="3" height="4" />
          <rect x="696" y="140" width="3" height="4" />
        </g>
      </svg>
    );
  }

  if (period === 'afternoon') {
    return (
      <svg className={styles.heroIllustration} viewBox="0 0 900 220" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="sunGlowAfternoon" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#FDE047" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* High Afternoon Sun & Halo */}
        <circle cx="440" cy="55" r="55" fill="url(#sunGlowAfternoon)" />
        <circle cx="440" cy="55" r="24" fill="#FFFFFF" />

        {/* Distant Golden Mountain Silhouettes */}
        <path d="M-10 220 L160 145 L340 220 Z" fill="#EAB308" opacity="0.18" />
        <path d="M120 220 L350 125 L550 220 Z" fill="#CA8A04" opacity="0.15" />

        {/* Afternoon City Skyline Silhouette */}
        <g fill="#D97706" opacity="0.25">
          <rect x="380" y="140" width="28" height="80" rx="1" />
          <rect x="412" y="115" width="34" height="105" rx="2" />
          <rect x="450" y="90" width="38" height="130" rx="2" />
          <path d="M469 70 L469 90" stroke="#D97706" strokeWidth="2" strokeOpacity="0.3" />
          <rect x="492" y="130" width="30" height="90" rx="1" />
          <rect x="526" y="105" width="40" height="115" rx="2" />
          <rect x="570" y="125" width="32" height="95" rx="1" />
          <rect x="606" y="85" width="44" height="135" rx="2" />
          <path d="M628 65 L628 85" stroke="#D97706" strokeWidth="2" strokeOpacity="0.3" />
          <rect x="654" y="120" width="36" height="100" rx="2" />
          <rect x="694" y="135" width="30" height="85" rx="1" />
        </g>

        {/* Trees & Park Foreground */}
        <g fill="#B45309" opacity="0.22">
          <circle cx="340" cy="195" r="18" />
          <circle cx="365" cy="200" r="14" />
          <circle cx="735" cy="195" r="20" />
          <circle cx="760" cy="200" r="15" />
        </g>
      </svg>
    );
  }

  // Morning
  return (
    <svg className={styles.heroIllustration} viewBox="0 0 900 220" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
      <defs>
        <radialGradient id="sunGlowMorning" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FDE047" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sunrise Sun low on Horizon */}
      <circle cx="420" cy="100" r="60" fill="url(#sunGlowMorning)" />
      <circle cx="420" cy="100" r="28" fill="#FFFFFF" />

      {/* Layered Morning Hills / Mountains */}
      <path d="M-20 220 L160 135 L340 220 Z" fill="#F59E0B" opacity="0.22" />
      <path d="M120 220 L360 115 L580 220 Z" fill="#D97706" opacity="0.18" />
      <path d="M420 220 L640 125 L880 220 Z" fill="#B45309" opacity="0.15" />

      {/* Flying Birds Silhouette */}
      <g stroke="#B45309" strokeWidth="1.6" opacity="0.45" strokeLinecap="round" fill="none">
        <path d="M470 55 q6 -6 12 0 q6 -6 12 0" />
        <path d="M505 70 q5 -5 10 0 q5 -5 10 0" />
        <path d="M450 78 q4 -4 8 0 q4 -4 8 0" />
      </g>

      {/* Misty Morning Trees */}
      <g fill="#92400E" opacity="0.25">
        <circle cx="620" cy="190" r="20" />
        <circle cx="648" cy="196" r="15" />
        <circle cx="672" cy="200" r="12" />
      </g>
    </svg>
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
              className={styles.heroPortalCircle}
              title={portal.name}
            >
              <PortalMark portal={portal} />
            </Link>
          ))}
          {customPortals.map((portal, idx) => (
            <Link
              key={`custom-portal-${idx}`}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroPortalCircle}
              title={portal.name}
            >
              <PortalMark portal={{ name: portal.name, url: portal.url, manage: '', logo: portal.iconUrl }} />
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
