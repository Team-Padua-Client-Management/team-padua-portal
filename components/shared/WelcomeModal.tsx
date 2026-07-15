'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Bell, Calendar, Shield, ArrowRight, ClipboardList, Settings, Users, Database } from 'lucide-react';
import styles from '@/styles/components/shared/WelcomeModal.module.css';

interface WelcomeModalProps {
  userName: string;
  role: string;
}

export default function WelcomeModal({ userName, role }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    // Determine if returning user
    const returning = localStorage.getItem('tp-returning-user') === 'true';
    setIsReturning(returning);

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
      localStorage.setItem('tp-returning-user', 'true');
      setIsOpen(false);
    }, 350);
  };

  if (!isOpen) return null;

  const isAdmin = role.toLowerCase().includes('admin');

  return (
    <div className={`${styles.overlay} ${isDismissing ? 'animate-out fade-out duration-300' : ''}`}>
      <div className={styles.modalCard}>
        {/* Floating Confetti Elements - only for new users */}
        {!isReturning && (
          <div className={styles.confettiContainer}>
            <div className={styles.confetti} />
            <div className={styles.confetti} />
            <div className={styles.confetti} />
            <div className={styles.confetti} />
            <div className={styles.confetti} />
            <div className={styles.confetti} />
            <div className={styles.confetti} />
          </div>
        )}

        {/* Logo Header */}
        <div className={styles.logoWrapper}>
          <img src="/Image/icon/TPC.png" alt="Logo" className={styles.logoImg} />
        </div>

        {/* Heading */}
        <h2 className={styles.title}>
          {isReturning ? 'Welcome back, ' : 'Welcome, '}
          <span className={styles.username}>{userName}</span>!
        </h2>
        
        <p className={styles.desc}>
          {isAdmin ? (
            isReturning ? (
              "Good to see you again. All administrative configurations, client tables, and system modules are online. Ready to oversee the daily advisory and servicing operations?"
            ) : (
              "Welcome to the control center. The Team Padua Business Development portal brings all workspace settings, client metrics, and external portals together to streamline advisory activities."
            )
          ) : (
            isReturning ? (
              "Good to see you again. Welcome back to your advisory dashboard. Let's coordinate your client service requests and calendar schedules for the day."
            ) : (
              "We are glad to have you here in the Client Management Portal! This workspace was created to simplify client servicing workflows, reduce administrative overhead, and support your daily advisory operations."
            )
          )}
        </p>

        {/* Feature Highlights */}
        <div className={styles.featuresList}>
          {isAdmin ? (
            isReturning ? (
              <>
                <div className={styles.featureItem}>
                  <Database size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>Workspace Metrics</span>
                    <span className={styles.featureDesc}>Review real-time client databases (CPST, ACR, PPU, FST, MNGT, CPC).</span>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Settings size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>Preferences & Themes</span>
                    <span className={styles.featureDesc}>Customize platform themes and settings under your preferences panel.</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.featureItem}>
                  <Users size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>Member Management</span>
                    <span className={styles.featureDesc}>Manage team registration status, authorization levels, and departments.</span>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Settings size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>System Customization</span>
                    <span className={styles.featureDesc}>Add external shortcut portals, toggle features, or enable maintenance modes.</span>
                  </div>
                </div>
              </>
            )
          ) : (
            isReturning ? (
              <>
                <div className={styles.featureItem}>
                  <Calendar size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>Attendance Control</span>
                    <span className={styles.featureDesc}>Keep your punch logs updated and coordinate with your team.</span>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Shield size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>Portal Links</span>
                    <span className={styles.featureDesc}>Access Sun Life, advisor office, drive, and teams in one click.</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.featureItem}>
                  <Bell size={18} className={styles.featureIcon} />
                  <div className={styles.featureText}>
                    <span className={styles.featureTitle}>Real-time Updates</span>
                    <span className={styles.featureDesc}>Receive instantaneous notifications when advisors publish notes or updates.</span>
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
            )
          )}
        </div>

        {/* Action Button */}
        <button onClick={handleDismiss} className={styles.ctaBtn}>
          {isReturning ? 'Resume Work' : "Let's Go!"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
