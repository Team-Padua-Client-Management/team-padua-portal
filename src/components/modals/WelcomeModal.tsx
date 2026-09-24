'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Quote } from 'lucide-react';
import { Modal } from './Modal';
import { motion, type Variants } from 'framer-motion';
import { useOnboarding } from '@src/components/providers/OnboardingProvider';

interface WelcomeModalProps {
  userName: string;
  role?: string;
}

export const WELCOME_DESCRIPTIONS = [
  "Ready to continue serving clients, tracking activities, and growing your Team Padua journey today?",
  "Every client goal begins with an advisor's proactive care. Let's make today count with purposeful service and meaningful progress.",
  "Your pipeline, client servicing milestones, and daily goals are set. Let's step up and deliver financial peace of mind today.",
  "Every policy serviced and every milestone tracked brings your clients closer to their dreams and elevates Team Padua.",
  "Great advisors build lasting legacies one conversation at a time. Let's dive into today's activities with focus and energy.",
  "Opportunities to protect families and nurture client relationships await you. Let's conquer today's goals with confidence.",
  "Consistency in servicing and clarity in action drive true advisory growth. Ready to make today another productive milestone?",
  "A new day brings fresh opportunities to empower clients, complete priority servicing tasks, and expand your impact.",
  "Your clients trust your guidance to secure their future. Let's take proactive steps today to support every family in your care.",
  "Success is built on the daily habits of excellence and care. Let's review your tasks, connect with clients, and lead the way today.",
  "From routine servicing to life-changing financial solutions, your dedication fuels client confidence and team triumph.",
  "Step into today with purpose and passion—your clients are counting on your expertise and heart for service."
];

export const MOTIVATIONAL_QUOTES = [
  "Your dedication drives our clients' success.",
  "Every client interaction creates a lasting impact.",
  "Small actions today build stronger client relationships tomorrow.",
  "Excellence is not an act, but a habit.",
  "Empowering financial futures, one decision at a time.",
  "Trust is earned through consistent care and timely service.",
  "The heart of financial advising is protecting what matters most.",
  "Your commitment today shapes someone's tomorrow.",
  "Growth is the natural result of disciplined daily service.",
  "Great achievements in advisory are born from genuine client care.",
  "Leadership is inspiring clients to secure their family's legacy.",
  "Focus on serving with integrity, and success will surely follow."
];

function getRandomIndexWithoutRepeat(length: number, storageKey: string): number {
  if (length <= 1) return 0;
  
  let lastIndex: number | null = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < length) {
        lastIndex = parsed;
      }
    }
  } catch {
    // Graceful fallback
  }

  let newIndex: number;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === lastIndex && length > 1);

  try {
    localStorage.setItem(storageKey, newIndex.toString());
  } catch {
    // Graceful fallback
  }

  return newIndex;
}

export default function WelcomeModal({ userName, role }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState(WELCOME_DESCRIPTIONS[0]);
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const { isReady, hasSeenWelcome, currentPageGuide } = useOnboarding();

  useEffect(() => {
    if (!isReady || !hasSeenWelcome || currentPageGuide) return;

    const descIdx = getRandomIndexWithoutRepeat(WELCOME_DESCRIPTIONS.length, 'tp-last-welcome-desc-idx');
    const quoteIdx = getRandomIndexWithoutRepeat(MOTIVATIONAL_QUOTES.length, 'tp-last-welcome-quote-idx');

    setDescription(WELCOME_DESCRIPTIONS[descIdx]);
    setQuote(MOTIVATIONAL_QUOTES[quoteIdx]);

    const lastSeenDate = localStorage.getItem('tp-welcome-seen-date');
    const today = new Date().toDateString();
    const hasSeenSession = sessionStorage.getItem('tp-welcome-seen-session');

    if (lastSeenDate !== today && !hasSeenSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isReady, hasSeenWelcome, currentPageGuide]);

  const handleDismiss = (dontShowToday = false) => {
    sessionStorage.setItem('tp-welcome-seen-session', 'true');
    if (dontShowToday) {
      localStorage.setItem('tp-welcome-seen-date', new Date().toDateString());
    }
    setIsOpen(false);
  };

  const firstName = userName?.split(' ')[0] || 'Advisor';

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.15 + i * 0.12,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
      }
    })
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleDismiss(false)}
      maxWidth="md"
      hideCloseButton
      className="p-1 overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-[420px] mx-auto pt-8 pb-6 px-6 text-center">
        {/* Logo */}
        <motion.div 
          custom={0}
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="relative w-20 h-20 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-center mb-6 border border-slate-100/60 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img src="/Image/icon/new_logo.png" alt="Team Padua" className="w-12 h-12 object-contain relative z-10" />
        </motion.div>

        {/* Greeting */}
        <motion.h2 
          custom={1}
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="text-[1.75rem] font-bold text-slate-900 mb-3 tracking-tight leading-tight"
        >
          Welcome Back, <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 inline-block">
            {firstName}
          </span> 👋
        </motion.h2>

        {/* Description */}
        <motion.p 
          custom={2}
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="text-[0.95rem] text-slate-500/90 leading-relaxed mb-7 max-w-[90%]"
        >
          {description}
        </motion.p>

        {/* Quote Card */}
        <motion.div 
          custom={3}
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="w-full relative bg-slate-50/70 rounded-2xl p-5 mb-8 border border-slate-100/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]"
        >
          <Quote className="absolute top-4 left-4 text-amber-500/20 rotate-180" size={24} />
          <p className="relative text-[0.95rem] font-medium text-slate-700 italic leading-relaxed z-10 pl-7 pr-2">
            "{quote}"
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div 
          custom={4}
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="flex flex-col items-center w-full gap-3"
        >
          <button 
            onClick={() => handleDismiss(false)} 
            className="group relative w-full bg-slate-900 hover:bg-slate-800 text-white border-none py-3.5 px-6 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_14px_0_rgba(15,23,42,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-out" />
            <span className="relative z-10">Start My Day</span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
          
          <button 
            onClick={() => handleDismiss(true)} 
            className="text-[0.8rem] font-medium text-slate-400 hover:text-slate-600 transition-colors py-2 px-4 rounded-lg hover:bg-slate-50"
          >
            Don't show again today
          </button>
        </motion.div>
      </div>
    </Modal>
  );
}
