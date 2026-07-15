'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, Shield, Sparkles, UserCheck } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

interface WelcomeHeroProps {
  userName: string;
  role: string;
}

export default function WelcomeHero({ userName, role }: WelcomeHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [timeState, setTimeState] = useState<Date | null>(null);
  const [lastLogin, setLastLogin] = useState<string>('Loading...');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Check initial theme and listen for changes
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(theme as 'light' | 'dark');

    const handleThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
      }
    };
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    return () => window.removeEventListener('theme-change', handleThemeChange as EventListener);
  }, []);

  // Set initial client-side date
  useEffect(() => {
    setTimeState(new Date());
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update online duration every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Retrieve user's last login from Supabase auth
  useEffect(() => {
    const fetchLastLogin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.last_sign_in_at) {
          const date = new Date(session.user.last_sign_in_at);
          setLastLogin(
            date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          );
        } else {
          setLastLogin('Just now');
        }
      } catch (err) {
        setLastLogin('Unavailable');
      }
    };
    fetchLastLogin();
  }, []);

  const timeDetails = useMemo(() => {
    if (!timeState) {
      return {
        greeting: 'WELCOME',
        theme: 'afternoon',
        formattedDate: '',
        formattedTime: '',
      };
    }

    const hours = timeState.getHours();
    let greeting = 'WELCOME';
    let theme: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';

    if (hours >= 5 && hours < 12) {
      greeting = 'GOOD MORNING';
      theme = 'morning';
    } else if (hours >= 12 && hours < 17) {
      greeting = 'GOOD AFTERNOON';
      theme = 'afternoon';
    } else if (hours >= 17 && hours < 21) {
      greeting = 'GOOD EVENING';
      theme = 'evening';
    } else {
      greeting = 'GOOD NIGHT';
      theme = 'night';
    }

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(timeState);

    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(timeState);

    return { greeting, theme, formattedDate, formattedTime };
  }, [timeState]);

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 || hrs > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  // Define themes
  const themeClassesMap = useMemo(() => {
    if (currentTheme === 'dark') {
      return {
        morning: {
          background: 'bg-gradient-to-br from-[#1E1B10] via-[#12110B] to-[#252011] border-yellow-950/45 text-white',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(255,223,105,0.06),transparent_60%)]',
          badge: 'bg-yellow-950/40 text-[#FFC72C] border-yellow-900/40',
          particles: 'bg-yellow-500/10',
          textAccent: 'text-[#FFC72C]',
          headingColor: 'text-white',
          textColor: 'text-slate-400',
        },
        afternoon: {
          background: 'bg-gradient-to-br from-[#141517] via-[#0E0F10] to-[#1A1C1F] border-slate-800 text-white',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_60%)]',
          badge: 'bg-slate-900/60 text-slate-350 border-slate-800',
          particles: 'bg-white/5',
          textAccent: 'text-slate-300',
          headingColor: 'text-white',
          textColor: 'text-slate-455',
        },
        evening: {
          background: 'bg-gradient-to-br from-[#241A10] via-[#140F0A] to-[#2B1B0D] border-orange-950/45 text-white',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.06),transparent_60%)]',
          badge: 'bg-orange-950/40 text-orange-450 border-orange-900/40',
          particles: 'bg-orange-500/10',
          textAccent: 'text-orange-400',
          headingColor: 'text-white',
          textColor: 'text-slate-400',
        },
        night: {
          background: 'bg-gradient-to-br from-[#0D0E12] via-[#0A0B0E] to-[#13161C] border-[#1E2028] text-white',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_60%)]',
          badge: 'bg-blue-950/40 text-[#FFC72C] border-blue-900/40',
          particles: 'bg-blue-500/10',
          textAccent: 'text-[#FFC72C]',
          headingColor: 'text-white',
          textColor: 'text-slate-350',
        },
      };
    } else {
      return {
        morning: {
          background: 'bg-gradient-to-br from-[#FFFDF0] via-white to-[#FFEAA7] border-[#FFE285]/40 text-slate-900',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(255,223,105,0.25),transparent_60%)]',
          badge: 'bg-[#FFC72C]/20 text-[#A3843B] border-[#FFC72C]/40',
          particles: 'bg-amber-400/20',
          textAccent: 'text-[#A3843B]',
          headingColor: 'text-slate-900',
          textColor: 'text-slate-600',
        },
        afternoon: {
          background: 'bg-gradient-to-br from-white via-[#FAF9F5] to-[#FFFBEB] border-slate-200 text-slate-900',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(255,223,105,0.15),transparent_60%)]',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          particles: 'bg-amber-300/10',
          textAccent: 'text-slate-600',
          headingColor: 'text-slate-900',
          textColor: 'text-slate-600',
        },
        evening: {
          background: 'bg-gradient-to-br from-[#FFF5EB] via-white to-[#FCD34D] border-orange-200 text-slate-900',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.25),transparent_60%)]',
          badge: 'bg-orange-100 text-orange-700 border-orange-300/50',
          particles: 'bg-orange-400/20',
          textAccent: 'text-orange-700',
          headingColor: 'text-slate-900',
          textColor: 'text-slate-600',
        },
        night: {
          background: 'bg-gradient-to-br from-[#F5F7FA] via-white to-[#E4E8F0] border-[#D0D5DD] text-slate-900',
          glow: 'bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_60%)]',
          badge: 'bg-[#E0E5F0] text-[#1E293B] border-[#C0CAD9]',
          particles: 'bg-indigo-300/15',
          textAccent: 'text-indigo-650',
          headingColor: 'text-slate-950',
          textColor: 'text-slate-600',
        },
      };
    }
  }, [currentTheme]);

  const themeClasses = themeClassesMap[timeDetails.theme as 'morning' | 'afternoon' | 'evening' | 'night'] || themeClassesMap.afternoon;

  return (
    <div className={`w-full relative mb-8 overflow-hidden rounded-2xl border transition-all duration-750 shadow-xl backdrop-blur-md p-6 lg:p-8 ${themeClasses.background}`}>
      {/* Animated glow overlay */}
      {!prefersReducedMotion && (
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inset-0 -z-10 transition-all duration-700 ${themeClasses.glow}`}
        />
      )}

      {/* Floating Circles/Particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute top-10 left-1/4 w-32 h-32 rounded-full blur-3xl ${themeClasses.particles}`}
          />
          <motion.div
            animate={{
              y: [0, 40, 0],
              x: [0, -20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute bottom-5 right-1/3 w-40 h-40 rounded-full blur-3xl ${themeClasses.particles}`}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        
        {/* Left Welcome Content */}
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <motion.div
              animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold tracking-[0.2em] transition-all duration-500 ${themeClasses.badge}`}
            >
              <Sparkles size={12} className="animate-spin-slow" />
              {timeDetails.greeting}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${themeClasses.headingColor}`}>
              Welcome, <span className="underline decoration-[#FFC72C] decoration-4 underline-offset-4">{userName}</span>
            </h1>
            <p className={`mt-2 text-sm flex items-center gap-2 ${themeClasses.textColor}`}>
              <Shield size={14} className="text-[#FFC72C]" />
              Role Authorized: <span className="font-semibold">{role}</span>
            </p>
          </motion.div>
        </div>

        {/* Right Info Widgets */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          
          {/* Real-time Clock */}
          <div className={`flex items-center gap-3 border rounded-2xl p-4 shadow-sm backdrop-blur ${
            currentTheme === 'light' ? 'bg-slate-100/75 border-slate-200/50' : 'bg-black/30 border-white/5'
          }`}>
            <div className={`p-2.5 rounded-xl ${
              currentTheme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5 shadow-inner'
            } ${themeClasses.textAccent}`}>
              <Clock size={20} />
            </div>
            <div>
              <p className={`text-xs font-medium tracking-wide ${themeClasses.textColor}`}>
                {timeDetails.formattedDate || 'Loading date...'}
              </p>
              <p className={`text-xl font-bold tracking-tight mt-0.5 ${themeClasses.headingColor}`}>
                {timeDetails.formattedTime || 'Loading time...'}
              </p>
            </div>
          </div>

          {/* Status Card */}
          <div className={`flex items-center gap-3 border rounded-2xl p-4 shadow-sm backdrop-blur min-w-[200px] ${
            currentTheme === 'light' ? 'bg-slate-100/75 border-slate-200/50' : 'bg-black/30 border-white/5'
          }`}>
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-400/50" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                <span className="text-[10px] opacity-50">•</span>
                <span className="text-[11px] opacity-75">{formatDuration(sessionSeconds)}</span>
              </div>
              <p className={`text-xs mt-0.5 ${themeClasses.textColor}`}>Last login:</p>
              <p className={`text-xs font-semibold ${themeClasses.headingColor}`}>{lastLogin}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
