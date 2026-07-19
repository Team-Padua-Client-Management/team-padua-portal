'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { LandingStats } from '@/app/api/landing-stats/route';

// Section components
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import TrustStrip from './components/TrustStrip';
import ModuleCards from './components/ModuleCards';
import AdvisorJourney from './components/AdvisorJourney';
import AboutSection from './components/AboutSection';
import ModuleDeepDives from './components/ModuleDeepDives';
import BentoGrid from './components/BentoGrid';
import TeamSection from './components/TeamSection';
import LivePreview from './components/LivePreview';
import StatsBand from './components/StatsBand';
import FaqSection from './components/FaqSection';
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
      .then((res) => res.json())
      .then((data: LandingStats) => {
        setStats(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('[landing] stats fetch failed, using fallback', err);
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
      {/* Subtle ambient background gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[5%] w-[40vw] h-[40vw] rounded-full bg-[#FFC72C]/6 blur-[140px]" />
        <div className="absolute top-[30%] -right-[10%] w-[35vw] h-[35vw] rounded-full bg-[#FFF6D6]/80 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50vw] h-[40vw] rounded-full bg-[#FFC72C]/4 blur-[160px]" />
      </div>

      <NavBar />

      <main className="relative z-10 pt-32 space-y-28 pb-0">

        {/* 1. Hero */}
        <HeroSection stats={resolvedStats} />

        {/* 2. Trust Strip */}
        {loading ? <StatSkeleton /> : <TrustStrip stats={resolvedStats} />}

        {/* 3. Core Advisor Modules */}
        <ModuleCards stats={resolvedStats} />

        {/* 4. Advisor Journey (3-step) */}
        <AdvisorJourney />

        {/* 5. About the Platform */}
        <AboutSection />

        {/* 6. Module Deep-Dives (alternating) */}
        <ModuleDeepDives stats={resolvedStats} />

        {/* 7. Bento Grid */}
        <BentoGrid />

        {/* 8. Team Padua (leadership + intern depts) */}
        <TeamSection />

        {/* 9. Live Portal Preview */}
        <LivePreview />

        {/* 10. Stats Band (dark section) */}
        <div className="!mt-0">
          <StatsBand stats={resolvedStats} />
        </div>

        {/* 11. FAQ */}
        <FaqSection stats={resolvedStats} />

        {/* 12. Final CTA */}
        <FinalCTA />

      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-100 bg-white overflow-hidden mt-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFC72C]/5 blur-[100px] rounded-t-full pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
              <Image src="/Image/icon/TPC.png" alt="Team Padua Logo" width={24} height={24} />
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
              <p className="text-[9px] text-[#A3843B] font-semibold uppercase tracking-wider">
                Advisor Support Associate
              </p>
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
