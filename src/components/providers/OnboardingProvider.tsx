'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@src/lib/supabase/client';

type OnboardingState = {
  hasSeenWelcome: boolean;
  seenGuides: string[];
};

type PageGuide = {
  id: string;
  title: string;
  description: string;
};

interface OnboardingContextType {
  isReady: boolean;
  hasSeenWelcome: boolean;
  currentPageGuide: PageGuide | null;
  registerPageGuide: (guide: PageGuide) => void;
  markWelcomeSeen: () => void;
  markGuideSeen: (id: string) => void;
  skipRemainingGuides: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // default true to prevent flash
  const [seenGuides, setSeenGuides] = useState<string[]>([]);
  const [currentPageGuide, setCurrentPageGuide] = useState<PageGuide | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || 'guest');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || 'guest');
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `tp-onboarding-${userId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingState;
        setHasSeenWelcome(parsed.hasSeenWelcome || false);
        setSeenGuides(parsed.seenGuides || []);
      } else {
        setHasSeenWelcome(false);
        setSeenGuides([]);
      }
    } catch {
      setHasSeenWelcome(false);
      setSeenGuides([]);
    }
    setIsReady(true);
  }, [userId]);

  const saveState = useCallback((newState: Partial<OnboardingState>) => {
    if (!userId) return;
    const storageKey = `tp-onboarding-${userId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      const current = stored ? JSON.parse(stored) : { hasSeenWelcome: false, seenGuides: [] };
      localStorage.setItem(storageKey, JSON.stringify({ ...current, ...newState }));
    } catch (e) {
      console.error("Could not save onboarding state", e);
    }
  }, [userId]);

  const registerPageGuide = useCallback((guide: PageGuide) => {
    if (!isReady) return;
    
    setSeenGuides(prevSeen => {
      setHasSeenWelcome(prevWelcome => {
        if (!prevWelcome || !prevSeen.includes(guide.id)) {
          setCurrentPageGuide(prev => {
            if (!prev || prev.id !== guide.id) return guide;
            return prev;
          });
        }
        return prevWelcome;
      });
      return prevSeen;
    });
  }, [isReady]);

  const markWelcomeSeen = useCallback(() => {
    setHasSeenWelcome(true);
    saveState({ hasSeenWelcome: true });
  }, [saveState]);

  const markGuideSeen = useCallback((id: string) => {
    setSeenGuides(prev => {
      const newGuides = [...prev, id];
      saveState({ seenGuides: newGuides });
      return newGuides;
    });
    setCurrentPageGuide(prev => (prev?.id === id ? null : prev));
  }, [saveState]);

  const skipRemainingGuides = useCallback(() => {
    setCurrentPageGuide(prev => {
      if (prev) {
        setSeenGuides(guides => {
          const newGuides = [...guides, prev.id];
          saveState({ seenGuides: newGuides });
          return newGuides;
        });
      }
      return null;
    });
  }, [saveState]);

  return (
    <OnboardingContext.Provider
      value={{
        isReady,
        hasSeenWelcome,
        currentPageGuide,
        registerPageGuide,
        markWelcomeSeen,
        markGuideSeen,
        skipRemainingGuides,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function usePageGuide(id: string, title: string, description: string) {
  const { registerPageGuide } = useOnboarding();

  useEffect(() => {
    registerPageGuide({ id, title, description });
  }, [id, title, description, registerPageGuide]);
}
