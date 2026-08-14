'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from '@/styles/components/shared/WelcomeModal.module.css';

interface WelcomeModalProps {
  userName: string;
  role: string;
}

const MOTIVATIONAL_MESSAGES = [
  "Every client interaction creates a lasting impact.",
  "Small actions today build stronger client relationships tomorrow.",
  "Excellence is not an act, but a habit.",
  "Your dedication drives our clients' success.",
  "Empowering financial futures, one decision at a time."
];

export default function WelcomeModal({ userName, role }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const randomMsg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    setMessage(randomMsg);

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

  const firstName = userName.split(' ')[0] || 'User';

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

        <p className={styles.subtitle}>
          Ready to continue serving clients, tracking activities,
          and growing your Team Padua journey today?
        </p>

        {/* Divider line that draws itself */}
        <div className={styles.divider} />

        {/* Motivational Quote */}
        <div className={styles.quoteSection}>
          <span className={styles.quoteText}>"{message}"</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={() => handleDismiss(false)} className={styles.primaryBtn}>
            <span className={styles.btnShimmer} />
            Start My Day <ArrowRight size={16} className={styles.arrowIcon} />
          </button>
          <button onClick={() => handleDismiss(true)} className={styles.secondaryBtn}>
            Don't show again today
          </button>
        </div>
      </div>
    </div>
  );
}
