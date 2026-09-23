'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@src/components/providers/OnboardingProvider';
import styles from '@/styles/components/modals/OnboardingModal.module.css';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function OnboardingModal() {
  const {
    isReady,
    hasSeenWelcome,
    currentPageGuide,
    markWelcomeSeen,
    markGuideSeen,
    skipRemainingGuides
  } = useOnboarding();

  if (!isReady) return null;

  // Decide what to show
  const showWelcome = !hasSeenWelcome;
  const showPageGuide = hasSeenWelcome && currentPageGuide !== null;

  if (!showWelcome && !showPageGuide) return null;

  return (
    <AnimatePresence>
      <div className={styles.overlay}>
        <motion.div
          className={styles.modalCard}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {showWelcome ? (
            <>
              <div className={styles.logoWrapper}>
                <img src="/Image/icon/new_logo.png" alt="Team Padua" className={styles.logoImg} />
              </div>
              <h2 className={styles.title}>Welcome to Team Padua</h2>
              <p className={styles.subtitle}>
                Let's take a quick look around and help you get familiar with the portal.
              </p>
              <div className={styles.actions}>
                <button onClick={markWelcomeSeen} className={styles.primaryBtn}>
                  Get Started <ArrowRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.logoWrapper}>
                <img src="/Image/icon/new_logo.png" alt="Team Padua" className={styles.logoImg} />
              </div>
              <h2 className={styles.title}>{currentPageGuide?.title}</h2>
              <p className={styles.subtitle}>
                {currentPageGuide?.description}
              </p>
              <div className={styles.actions}>
                <button
                  onClick={() => currentPageGuide && markGuideSeen(currentPageGuide.id)}
                  className={styles.primaryBtn}
                >
                  <CheckCircle2 size={18} /> Got It
                </button>
                <button onClick={skipRemainingGuides} className={styles.secondaryBtn}>
                  Skip Guide
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
