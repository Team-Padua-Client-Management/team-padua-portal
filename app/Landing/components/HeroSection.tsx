'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Bell, Users, Wallet, Calendar } from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';

interface HeroSectionProps {
  stats: LandingStats;
}

export default function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section
      id="overview"
      className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-8 lg:pt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
    >
      {/* Left: Copy */}
      <div className="lg:col-span-6 space-y-7 text-left">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#FFC72C]/40 bg-[#FFF6D6] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#A3843B]"
        >
          <Sparkles size={13} />
          Team Padua Advisor Portal
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-[#111111] leading-[1.08]"
        >
          Your clients deserve your{' '}
          <span className="text-[#FFC72C]">full attention,</span>
          <br />not your paperwork.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="text-base text-[#666666] leading-relaxed max-w-[480px]"
        >
          A centralized workspace built exclusively for Sun Life Financial Advisors under
          Team Padua — manage client relationships, policy servicing, premium monitoring,
          and daily operations from one secure platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26 }}
          className="flex flex-wrap gap-4 pt-1"
        >
          <a
            href="/auth/login"
            id="hero-access-portal"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFC72C] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#111111] shadow-md hover:shadow-lg transition-all hover:scale-[1.03] hover:bg-[#f0ba29]"
          >
            Access Portal
            <ArrowRight size={13} />
          </a>
          <a
            href="#modules"
            id="hero-explore-features"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-[#FFF6D6] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors duration-200"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Micro-stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="flex flex-wrap gap-6 pt-2 text-xs text-[#666666]"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#111111]">
              {stats.activeClients > 0 ? stats.activeClients : '—'}
            </span>
            &nbsp;active clients
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFC72C]" />
            <span className="font-semibold text-[#111111]">
              {stats.birthdaysThisMonth > 0 ? stats.birthdaysThisMonth : '—'}
            </span>
            &nbsp;birthdays this month
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="font-semibold text-[#111111]">
              {stats.acrRequests > 0 ? stats.acrRequests : '—'}
            </span>
            &nbsp;service requests
          </div>
        </motion.div>
      </div>

      {/* Right: Dashboard Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.35 }}
        className="lg:col-span-6 relative"
      >
        {/* Glow behind card */}
        <div className="absolute -inset-4 bg-[#FFC72C]/10 rounded-[48px] blur-2xl pointer-events-none" />

        <div className="relative bg-[#FFF6D6] border border-[#FFC72C]/20 p-5 rounded-[32px] shadow-sm overflow-hidden">
          {/* Yellow top bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FFC72C] rounded-t-[32px]" />

          {/* Window chrome */}
          <div className="flex items-center justify-between mb-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <span className="text-[10px] text-[#666666] uppercase tracking-widest font-bold">
              Advisor Dashboard · Secure
            </span>
          </div>

          {/* Dashboard image */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#FFC72C]/10 aspect-[16/10]">
            <Image
              src="/Image/hero_dashboard.png"
              alt="Team Padua Advisor Portal dashboard preview"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Live stats chips below image */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF6D6] flex items-center justify-center shrink-0">
                <Users size={14} className="text-[#A3843B]" />
              </div>
              <div>
                <p className="text-[10px] text-[#666666] uppercase font-bold">Clients</p>
                <p className="text-sm font-extrabold text-[#111111]">
                  {stats.totalClients > 0 ? stats.totalClients : '—'}
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Wallet size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-[#666666] uppercase font-bold">Premium</p>
                <p className="text-sm font-extrabold text-[#111111]">Monitored</p>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-[#666666] uppercase font-bold">Events</p>
                <p className="text-sm font-extrabold text-[#111111]">
                  {stats.upcomingEvents > 0 ? stats.upcomingEvents : '—'}
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] text-[#666666] uppercase font-bold">Alerts</p>
                <p className="text-sm font-extrabold text-[#111111]">Real-time</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
