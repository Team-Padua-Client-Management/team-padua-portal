'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from '@/styles/components/shared/WelcomeModal.module.css';

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

/**
 * Selects a random item index from an array while ensuring it doesn't repeat
 * the index stored in localStorage from the immediately preceding session.
 */
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
    // Graceful fallback if localStorage is unavailable
  }

  let newIndex: number;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === lastIndex && length > 1);

  try {
    localStorage.setItem(storageKey, newIndex.toString());
  } catch {
    // Graceful fallback if localStorage is unavailable
  }

  return newIndex;
}

export default function WelcomeModal({ userName, role }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [description, setDescription] = useState(WELCOME_DESCRIPTIONS[0]);
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  useEffect(() => {
    // Pick unique description and quote avoiding immediate previous repeats
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
  }, []);

  const handleDismiss = (dontShowToday = false) => {
    setIsDismissing(true);
    setTimeout(() => {
      sessionStorage.setItem('tp-welcome-seen-session', 'true');
      if (dontShowToday) {
        localStorage.setItem('tp-welcome-seen-date', new Date().toDateString());
      }
      setIsOpen(false);
    }, 400);
  };

  if (!isOpen) return null;

  const firstName = userName?.split(' ')[0] || 'Advisor';

  return (
    <div className={`${styles.overlay} ${isDismissing ? styles.fadeOut : ''}`}>
      {/* Floating gold particles */}
      <div className={styles.particles}>
        <span className={styles.particle} />
        <span className={styles.particle} />
        <span className={styles.particle} />
        <span className={styles.particle} />
        <span className={styles.particle} />
        <span className={styles.particle} />
      </div>

      <div className={`${styles.modalCard} ${isDismissing ? styles.scaleOut : ''}`}>
        {/* Shimmer sweep */}
        <div className={styles.shimmer} />

        {/* Logo with ring pulse */}
        <div className={styles.logoWrapper}>
          <div className={styles.logoRing} />
          <img src="/Image/icon/TPC.png" alt="Team Padua" className={styles.logoImg} />
          <div className={styles.logoGlow} />
        </div>

        {/* Greeting */}
        <h2 className={styles.title}>
          Welcome Back, <span className={styles.username}>{firstName}</span> 👋
        </h2>

        {/* Dynamic Description */}
        <p className={styles.subtitle}>
          {description}
        </p>

        {/* Divider line that draws itself */}
        <div className={styles.divider} />

        {/* Dynamic Motivational Quote */}
        <div className={styles.quoteSection}>
          <span className={styles.quoteText}>&ldquo;{quote}&rdquo;</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={() => handleDismiss(false)} className={styles.primaryBtn}>
            <span className={styles.btnShimmer} />
            Start My Day <ArrowRight size={16} className={styles.arrowIcon} />
          </button>
          <button onClick={() => handleDismiss(true)} className={styles.secondaryBtn}>
            Don&apos;t show again today
          </button>
        </div>
      </div>
    </div>
  );
}
