'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { LandingStats } from '@/app/api/landing-stats/route';
import DecorativeBackground from '@src/components/ui/DecorativeBackground';

// Section components
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import TrustStrip from './components/TrustStrip';
import ModuleCards from './components/ModuleCards';
import AdvisorJourney from './components/AdvisorJourney';
import AboutSection from './components/AboutSection';
import ModuleDeepDives from './components/ModuleDeepDives';
import BentoGrid from './components/BentoGrid';
import SecuritySection from './components/SecuritySection';
import TeamSection from './components/TeamSection';
import LivePreview from './components/LivePreview';
import StatsBand from './components/StatsBand';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import FinalCTA from './components/FinalCTA';

const EMPTY_STATS: LandingStats = {
  totalClients: 0,
  activeClients: 0,
  acrRequests: 0,
  teamMembers: 0,
  upcomingEvents: 0,
  birthdaysThisMonth: 0,
  faqs: [],
};

// Skeleton shimmer for stat-bearing sections while loading
function StatSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="bg-white border border-slate-100 rounded-[28px] px-6 py-8 lg:px-10">
        <div className="h-3 w-48 bg-slate-100 rounded-full mx-auto mb-8 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-5 w-12 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/landing-stats', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response was not JSON');
        }
        return res.json();
      })
      .then((data: LandingStats) => {
        setStats(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[landing] stats fetch failed, using fallback');
          setStats(EMPTY_STATS);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const resolvedStats = stats ?? EMPTY_STATS;

  return (
    <div
      className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#FFC72C]/30 overflow-x-hidden relative"
      style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
    >
      <DecorativeBackground />
      <NavBar />

      <main className="relative z-10 space-y-0 pb-0">

        {/* 1. Cinematic Hero */}
        <HeroSection stats={resolvedStats} />

        {/* 2. Elevated Trust & Core Capabilities Container */}
        <div className="relative z-20 bg-white rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] pt-12 pb-32 -mt-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-100 rounded-full mt-4" />
          {loading ? <StatSkeleton /> : <TrustStrip stats={resolvedStats} />}
          <div className="mt-20">
            <BentoGrid />
          </div>
        </div>

        {/* 3. Immersive Product Experience (Sticky/Scrolling) */}
        <div className="relative z-10 bg-[#F8F9FA] py-32 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl mb-4">
              Designed for your workflow.
            </h2>
            <p className="text-sm text-[#666666] max-w-2xl mx-auto">
              Every interaction is engineered to save time and reduce friction.
            </p>
          </div>
          <ModuleDeepDives stats={resolvedStats} />
          <div className="mt-32">
            <LivePreview />
          </div>
        </div>

        {/* 4. Journey & Team (Overlapping) */}
        <div className="relative z-20 bg-white rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] pt-32 pb-24 -mt-16">
          <AdvisorJourney />
          <div className="mt-32">
            <TeamSection />
          </div>
        </div>

        {/* 5. Metrics & Assurance */}
        <div className="relative z-10">
          <StatsBand stats={resolvedStats} />
          <div className="bg-[#111111] pb-32 pt-20">
             <SecuritySection />
          </div>
        </div>

        {/* 6. Support & Action */}
        <div className="bg-[#F8F9FA] rounded-t-[3rem] -mt-16 relative z-20 pt-24 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
          <FaqSection stats={resolvedStats} />
          <div className="mt-24">
            <ContactSection />
          </div>
        </div>

        <FinalCTA />

      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-100 bg-white overflow-hidden mt-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFC72C]/5 blur-[100px] rounded-t-full pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
              <Image src="/Image/icon/new_logo.png" alt="Team Padua Logo" width={24} height={24} />
              <div className="text-left">
                <p className="text-xs font-extrabold tracking-widest text-[#111111]">TEAMPADUA</p>
                <p className="text-[9px] font-semibold text-[#666666] uppercase">
                  Business Development Team — Sun Life Philippines
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-[10px] text-[#666666] uppercase font-semibold">Built and Developed by</p>
              <p className="text-xs font-bold text-[#111111]">John Renz Bandianon</p>
              <p className="text-xs font-bold text-[#111111]">William Kyle Iballa</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-wider font-bold text-[#666666]">
            <p>© {new Date().getFullYear()} TeamPadua. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="/privacy" className="hover:text-[#111111] transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-[#111111] transition-colors">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

