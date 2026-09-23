'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';
import { getStat, ILLUSTRATIVE_STATS } from '../../../lib/statDisplay';

interface HeroSectionProps {
  stats: LandingStats;
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const activeClients = getStat(stats.activeClients, ILLUSTRATIVE_STATS.activeClients);
  const totalClients = getStat(stats.totalClients, ILLUSTRATIVE_STATS.totalClients);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.05]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section id="overview" className="relative w-full overflow-hidden pb-32">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none z-0">
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FFC72C]/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-[#A3843B]/10 blur-[100px] rounded-full" 
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 pt-20 lg:pt-32 flex flex-col items-center text-center">
        
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-[#FFC72C]/40 bg-white/60 backdrop-blur-md px-5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#A3843B] shadow-sm mb-8"
        >
          <Sparkles size={14} className="text-[#FFC72C]" />
          The New Standard for Advisors
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl lg:text-[5rem] font-extrabold tracking-tight text-[#111111] leading-[1.05] max-w-5xl"
        >
          Focus on your clients.<br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 text-white px-4 py-1">We handle the rest.</span>
            <span className="absolute inset-0 bg-[#FFC72C] rounded-2xl -rotate-2 scale-105 z-0" />
            <span className="absolute inset-0 bg-[#A3843B] rounded-2xl rotate-1 scale-105 z-[-1] opacity-50" />
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-8 text-lg sm:text-xl text-[#666666] font-medium leading-relaxed max-w-2xl"
        >
          Team Padua’s unified workspace brings your clients, operations, and growth metrics into one beautiful, intelligent portal.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="/auth/login"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-10 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 w-full sm:w-auto"
          >
            Access Portal
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#modules"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white/50 hover:bg-white backdrop-blur-sm px-10 py-4 text-xs font-bold uppercase tracking-widest text-[#111111] transition-all hover:border-slate-300 w-full sm:w-auto"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Massive Dashboard Mockup */}
        <motion.div
          style={{ scale, opacity }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="mt-20 relative w-full max-w-6xl mx-auto"
        >
          <div className="absolute -inset-x-10 -bottom-20 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />
          
          <div className="relative rounded-[40px] border-[8px] border-slate-100/50 bg-white shadow-2xl overflow-hidden p-2">
            <div className="absolute top-0 left-0 w-full h-12 bg-slate-100/80 backdrop-blur-md flex items-center px-4 gap-2 z-10 border-b border-slate-200/50">
               <div className="w-3 h-3 rounded-full bg-rose-400" />
               <div className="w-3 h-3 rounded-full bg-amber-400" />
               <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="relative aspect-[16/10] w-full rounded-[32px] overflow-hidden mt-10">
              <Image
                src="/Image/hero_dashboard.png"
                alt="Team Padua Advisor Portal"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Floating UI Elements (Micro-interactions) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute top-1/3 -left-12 lg:-left-24 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:flex items-center gap-4 z-30"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFF6D6] text-[#A3843B] flex items-center justify-center font-bold text-xl">
              {activeClients.value}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Active Clients</p>
              <p className="text-sm font-extrabold text-[#111111]">Serviced today</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="absolute bottom-1/3 -right-12 lg:-right-24 bg-[#111111] p-4 rounded-2xl shadow-xl border border-slate-800 hidden md:flex items-center gap-4 z-30"
          >
             <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">System Status</p>
              <p className="text-sm font-extrabold text-white">All systems synced</p>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}
