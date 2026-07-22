import React from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const POMODORO_CONFIG: Record<PomodoroMode, { label: string; icon: string; duration: number }> = {
  focus: { label: 'Focus', icon: '🍅', duration: 25 * 60 },
  shortBreak: { label: 'Short Break', icon: '☕', duration: 5 * 60 },
  longBreak: { label: 'Long Break', icon: '🌙', duration: 15 * 60 }
};

interface PomodoroCardProps {
  mode: PomodoroMode;
  seconds: number;
  isRunning: boolean;
  completedSessions: number;
  notice: string | null;
  onModeChange: (mode: PomodoroMode) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function formatPomoTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PomodoroCard({
  mode,
  seconds,
  isRunning,
  completedSessions,
  notice,
  onModeChange,
  onTogglePlay,
  onReset,
  onSkip
}: PomodoroCardProps) {
  const currentDuration = POMODORO_CONFIG[mode].duration;
  const progressPercent = Math.min(100, Math.max(0, ((currentDuration - seconds) / currentDuration) * 100));

  return (
    <div className={styles.heroPomodoro}>
      <div className={styles.pomodoroHeader}>
        <div className={styles.pomodoroTitleGroup}>
          <span>🍅 Pomodoro</span>
        </div>
        {notice ? (
          <span className={styles.noticeBadge}>{notice}</span>
        ) : (
          <span className={styles.timerStatsCompact}>Today: {completedSessions} sessions</span>
        )}
      </div>

      {/* Segmented mode switcher */}
      <div className={styles.pomodoroModes}>
        {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={`${styles.modeButton} ${mode === m ? styles.modeButtonActive : ''}`}
          >
            <span>{POMODORO_CONFIG[m].label}</span>
          </button>
        ))}
      </div>

      <div className={styles.timerDisplayGroup}>
        <span className={styles.timerDisplay}>{formatPomoTime(seconds)}</span>
      </div>

      <div className={styles.progressBarTrack}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className={styles.timerControlsRow}>
        <button
          type="button"
          onClick={onTogglePlay}
          className={styles.timerButtonPrimary}
        >
          {isRunning ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
          <span>{isRunning ? 'Pause' : seconds < currentDuration ? 'Resume' : 'Start'}</span>
        </button>

        <div className={styles.timerControlsGroup}>
          <button type="button" onClick={onReset} className={styles.timerButtonIcon} title="Reset Timer">
            <RotateCcw size={12} strokeWidth={2} />
          </button>
          <button type="button" onClick={onSkip} className={styles.timerButtonIcon} title="Skip Session">
            <SkipForward size={12} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
