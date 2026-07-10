'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Bell, Calendar, Shield, ArrowRight, ClipboardList } from 'lucide-react';
import styles from '@/styles/components/shared/WelcomeModal.module.css';

interface WelcomeModalProps {
  userName: string;
  role: string;
}

export default function WelcomeModal({ userName, role }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // Check if user has already seen the welcome modal in the current session
    const hasSeen = sessionStorage.getItem('tp-welcome-seen');
    if (!hasSeen) {
      // Small timeout to allow page animations to settle
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissing(true);
    // Wait for fadeout animation before unmounting
    setTimeout(() => {
      sessionStorage.setItem('tp-welcome-seen', 'true');
      setIsOpen(false);
    }, 350);
  };

  if (!isOpen) return null;

  const isAdmin = role.toLowerCase().includes('admin');

  return (
    <div className={`${styles.overlay} ${isDismissing ? 'animate-out fade-out duration-300' : ''}`}>
      <div className={styles.modalCard}>
        {/* Floating Confetti Elements */}
        <div className={styles.confettiContainer}>
          <div className={styles.confetti} />
          <div className={styles.confetti} />
          <div className={styles.confetti} />
          <div className={styles.confetti} />
          <div className={styles.confetti} />
          <div className={styles.confetti} />
          <div className={styles.confetti} />
        </div>

        {/* Logo Header */}
        <div className={styles.logoWrapper}>
          <img src="/Image/icon/TPC.png" alt="Logo" className={styles.logoImg} />
        </div>

        {/* Heading */}
        <h2 className={styles.title}>
          Welcome, <span className={styles.username}>{userName}</span>!
        </h2>
        <p className={styles.desc}>
          {isAdmin 
            ? "Welcome back to the Team Padua Control Terminal. Let's make today highly productive!"
            : "We're glad to have you here in the Team Padua Client Management Portal."}
        </p>

        {/* Feature Highlights */}
        <div className={styles.featuresList}>
          {isAdmin ? (
            <>
              <div className={styles.featureItem}>
                <Bell size={18} className={styles.featureIcon} />
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Active Alerts</span>
                  <span className={styles.featureDesc}>Get real-time notification feeds on CPST, ACR, portals, and calendar entries.</span>
                </div>
              </div>
              <div className={styles.featureItem}>
                <ClipboardList size={18} className={styles.featureIcon} />
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Client Servicing Suite</span>
                  <span className={styles.featureDesc}>Oversee and track client profiles, change requests, and processing queues.</span>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Calendar size={18} className={styles.featureIcon} />
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Enterprise Master Calendar</span>
                  <span className={styles.featureDesc}>Schedule, modify, and coordinate team synchronizations and meetings.</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.featureItem}>
                <Bell size={18} className={styles.featureIcon} />
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Real-time Updates</span>
                  <span className={styles.featureDesc}>Receive instantaneous notifications when your advisors publish notes or updates.</span>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Calendar size={18} className={styles.featureIcon} />
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Personal Event Schedule</span>
                  <span className={styles.featureDesc}>Review calendar reminders, appointments, and advisor sync schedules.</span>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Shield size={18} className={styles.featureIcon} />
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>Secure Workspace Portals</span>
                  <span className={styles.featureDesc}>Access shared resources, Canva assets, Microsoft Teams, and secure links.</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <button onClick={handleDismiss} className={styles.ctaBtn}>
          Let's Go! <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
