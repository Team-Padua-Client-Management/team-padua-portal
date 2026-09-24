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
      <div className="bg-white border border-slate-100 rounded-[2.5rem] px-6 py-12 lg:px-10 shadow-sm relative z-30">
        <div className="h-3 w-48 bg-slate-100 rounded-full mx-auto mb-10 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse" />
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
      className="min-h-screen bg-slate-50 text-[#111111] font-sans selection:bg-[#FFC72C]/30 overflow-x-hidden relative"
      style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
    >
      <DecorativeBackground />
      <NavBar />

      <main className="relative z-10 space-y-0 pb-0">

        {/* 1. Cinematic Hero */}
        <HeroSection stats={resolvedStats} />

        {/* 2. Elevated Trust & Core Capabilities Container */}
        <div className="relative z-20 bg-slate-50 pt-2 pb-24">
          <div className="max-w-[1200px] mx-auto relative -mt-24 px-4 sm:px-6 lg:px-8 z-30">
            {loading ? <StatSkeleton /> : <TrustStrip stats={resolvedStats} />}
          </div>
          <div className="mt-28">
            <BentoGrid />
          </div>
        </div>

        {/* 3. Immersive Product Experience */}
        <div className="relative z-10 bg-white py-28 border-y border-slate-200/60 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <ModuleDeepDives stats={resolvedStats} />
          <div className="mt-28">
            <LivePreview />
          </div>
        </div>

        {/* 4. Journey & Team */}
        <div className="relative z-20 bg-slate-50 pt-28 pb-28 overflow-hidden">
          <AdvisorJourney />
          <div className="mt-32 relative">
             <div className="absolute top-1/2 left-0 w-full h-[600px] bg-white -skew-y-2 -z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]" />
            <TeamSection />
          </div>
        </div>

        {/* 5. Metrics & Assurance */}
        <div className="relative z-30 bg-white border-t border-slate-200/60 pt-24 pb-32 shadow-[0_-20px_50px_rgba(0,0,0,0.03)]">
          <StatsBand stats={resolvedStats} />
          <div className="mt-28">
             <SecuritySection />
          </div>
        </div>

        {/* 6. Support & Action */}
        <div className="bg-slate-50 border-t border-slate-200/60 relative z-10 pt-28 pb-20">
          <FaqSection stats={resolvedStats} />
          <div className="mt-28">
            <ContactSection />
          </div>
        </div>

        <FinalCTA />

      </main>

      {/* Footer */}
      <footer className="relative bg-white overflow-hidden border-t border-slate-200/60">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFC72C]/10 blur-[120px] rounded-t-full pointer-events-none" />
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                 <Image src="/Image/icon/new_logo.png" alt="Team Padua Logo" width={32} height={32} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black tracking-widest text-[#111111] leading-tight">TEAMPADUA</p>
                <p className="text-[9px] font-bold text-[#A3843B] uppercase tracking-[0.2em] mt-0.5">
                  Business Development Team
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-[10px] text-[#888888] uppercase font-bold tracking-widest mb-1">Built and Developed by</p>
              <p className="text-sm font-bold text-[#111111]">John Renz Bandianon</p>
              <p className="text-sm font-bold text-[#111111]">William Kyle Iballa</p>
            </div>
          </div>

          <hr className="border-slate-100 my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] uppercase tracking-wider font-bold text-[#888888]">
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
