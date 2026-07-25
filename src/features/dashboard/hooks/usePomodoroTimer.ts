import { useState, useEffect } from 'react';
import { PomodoroMode, POMODORO_CONFIG } from '@src/features/dashboard/components/PomodoroCard';
import { playPomoChime } from '@src/features/dashboard/utils/audioUtils';

export const usePomodoroTimer = () => {
  const [pomoMode, setPomoMode] = useState<PomodoroMode>('focus');
  const [pomoSeconds, setPomoSeconds] = useState<number>(POMODORO_CONFIG.focus.duration);
  const [pomoIsRunning, setPomoIsRunning] = useState<boolean>(false);
  const [pomoCompletedSessions, setPomoCompletedSessions] = useState<number>(0);
  const [pomoNotice, setPomoNotice] = useState<string | null>(null);

  // Restore Pomodoro state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tp_admin_pomodoro');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode && POMODORO_CONFIG[parsed.mode as PomodoroMode]) {
          const mode = parsed.mode as PomodoroMode;
          setPomoMode(mode);
          let rem = typeof parsed.remainingSeconds === 'number' ? parsed.remainingSeconds : POMODORO_CONFIG[mode].duration;
          let isRun = !!parsed.isRunning;

          if (isRun && parsed.lastTimestamp) {
            const elapsed = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
            rem = rem - elapsed;
            if (rem <= 0) {
              rem = 0;
              isRun = false;
              if (mode === 'focus') {
                setPomoCompletedSessions((prev) => (typeof parsed.completedSessions === 'number' ? parsed.completedSessions + 1 : prev + 1));
                setPomoNotice('Pomodoro Complete');
              } else {
                setPomoNotice('Break Finished');
              }
            }
          }
          setPomoSeconds(rem);
          setPomoIsRunning(isRun);
        }
        if (typeof parsed.completedSessions === 'number') {
          setPomoCompletedSessions(parsed.completedSessions);
        }
      }
    } catch (err) {
      console.error('Failed to load Pomodoro state:', err);
    }
  }, []);

  // Save Pomodoro state to LocalStorage
  useEffect(() => {
    try {
      const stateToSave = {
        mode: pomoMode,
        remainingSeconds: pomoSeconds,
        isRunning: pomoIsRunning,
        completedSessions: pomoCompletedSessions,
        lastTimestamp: Date.now()
      };
      localStorage.setItem('tp_admin_pomodoro', JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save Pomodoro state:', err);
    }
  }, [pomoMode, pomoSeconds, pomoIsRunning, pomoCompletedSessions]);

  // Pomodoro Countdown Interval lifecycle
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (pomoIsRunning) {
      timerId = setInterval(() => {
        setPomoSeconds((prev) => {
          if (prev <= 1) {
            setPomoIsRunning(false);
            playPomoChime();
            if (pomoMode === 'focus') {
              setPomoCompletedSessions((c) => c + 1);
              setPomoNotice('Pomodoro Complete');
            } else {
              setPomoNotice('Break Finished');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [pomoIsRunning, pomoMode]);

  const handlePomoModeChange = (newMode: PomodoroMode) => {
    setPomoMode(newMode);
    setPomoSeconds(POMODORO_CONFIG[newMode].duration);
    setPomoIsRunning(false);
    setPomoNotice(null);
  };

  const handlePomoReset = () => {
    setPomoSeconds(POMODORO_CONFIG[pomoMode].duration);
    setPomoIsRunning(false);
    setPomoNotice(null);
  };

  const handlePomoSkip = () => {
    setPomoIsRunning(false);
    if (pomoMode === 'focus') {
      handlePomoModeChange('shortBreak');
    } else {
      handlePomoModeChange('focus');
    }
  };

  const onPomoTogglePlay = () => {
    setPomoNotice(null);
    setPomoIsRunning(!pomoIsRunning);
  };

  return {
    pomoMode,
    pomoSeconds,
    pomoIsRunning,
    pomoCompletedSessions,
    pomoNotice,
    handlePomoModeChange,
    handlePomoReset,
    handlePomoSkip,
    onPomoTogglePlay
  };
};
