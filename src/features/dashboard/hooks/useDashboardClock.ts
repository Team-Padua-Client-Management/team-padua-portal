import { useState, useEffect } from 'react';
import { DayPeriod } from '@src/features/dashboard/components/DashboardHero';

export const resolveGreetingAndPeriod = (): { greeting: string; period: DayPeriod } => {
  const getPhHour = () => {
    try {
      const options = { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false } as const;
      const formatter = new Intl.DateTimeFormat('en-US', options);
      return parseInt(formatter.format(new Date()), 10);
    } catch (err) {
      return new Date().getHours();
    }
  };

  const hour = getPhHour();
  if (hour >= 5 && hour < 12) return { greeting: 'Good Morning', period: 'morning' };
  if (hour >= 12 && hour < 18) return { greeting: 'Good Afternoon', period: 'afternoon' };
  return { greeting: 'Good Evening', period: 'evening' };
};

export const useDashboardClock = () => {
  const [greeting, setGreeting] = useState('Good Morning');
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('morning');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
      });
      setCurrentDate(dateFormatter.format(now));
      setCurrentTime(timeFormatter.format(now));

      const { greeting, period } = resolveGreetingAndPeriod();
      setGreeting(greeting);
      setDayPeriod(period);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return { greeting, setGreeting, dayPeriod, setDayPeriod, currentDate, currentTime };
};
