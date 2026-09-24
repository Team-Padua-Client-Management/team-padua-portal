'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';
import { getStat, ILLUSTRATIVE_STATS } from '../../../lib/statDisplay';

interface HeroSectionProps {
  stats: LandingStats;
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export default function HeroSection({ stats }: HeroSectionProps) {
  const activeClients = getStat(stats.activeClients, ILLUSTRATIVE_STATS.activeClients);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const mockupY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const mockupRotateX = useTransform(scrollYProgress, [0, 0.5], ['0deg', '5deg']);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.5]);

  return (
    <section
      ref={sectionRef}
      id="overview"
      className="relative w-full overflow-hidden pt-32 sm:pt-40 lg:pt-48 pb-20 lg:pb-32 bg-white"
    >
      {/* Premium SaaS Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
        {/* Soft radial gradient mesh */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFC72C]/10 via-[#FFC72C]/[0.02] to-transparent blur-3xl opacity-80" />
        
        {/* High-end subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to bottom, white, transparent)'
          }}
        />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 lg:px-8 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >
          {/* Refined Top Badge */}
          <motion.div
            variants={fadeUp}
            className="group inline-flex items-center gap-3 rounded-full border border-slate-200/60 bg-white/50 backdrop-blur-md px-4 py-2 shadow-sm mb-12 hover:border-[#FFC72C]/50 transition-colors duration-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC72C] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFC72C]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#333333]">
              The Next-Gen Advisor Platform
            </span>
            <ArrowRight size={14} className="text-[#888888] group-hover:text-[#111111] transition-colors" />
          </motion.div>

          {/* SaaS Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[clamp(3rem,8vw,7.5rem)] font-bold tracking-tight text-[#111111] leading-[0.85] max-w-6xl mx-auto"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.04em' }}
          >
            Focus on your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#666666]">clients</span>.
            <br />
            <span className="relative inline-block mt-2">
              We handle the rest.
              <svg className="absolute -bottom-4 left-0 w-full opacity-30" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M2 8C50 3 100 2 150 4C200 6 250 3 298 7" stroke="#FFC72C" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="mt-12 text-lg sm:text-xl text-[#555555] leading-relaxed max-w-2xl font-medium"
          >
            Team Padua&apos;s unified workspace brings your clients, operations,
            and growth metrics into one highly intelligent portal. 
          </motion.p>

          {/* Premium Actions */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="/auth/login"
              className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-10 py-4 text-sm font-semibold text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              Access Portal
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            <a
              href="#modules"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-10 py-4 text-sm font-semibold text-[#111111] shadow-sm border border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
            >
              Explore Features
            </a>
          </motion.div>
          
          {/* Social Proof Mini */}
          <motion.div variants={fadeUp} className="mt-8 flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck size={16} className="text-[#FFC72C]" />
            Enterprise-grade security • Sun Life Philippines
          </motion.div>
        </motion.div>

        {/* 3D Dashboard Mockup Presentation */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{ y: mockupY, scale: mockupScale, rotateX: mockupRotateX, opacity: mockupOpacity, perspective: 1000 }}
          className="mt-20 relative w-full max-w-[1200px] mx-auto z-20"
        >
          {/* High-end Glow behind mockup */}
          <div className="absolute -inset-10 bg-gradient-to-b from-[#FFC72C]/10 to-transparent rounded-[3rem] blur-3xl pointer-events-none" />

          {/* Browser frame with glassy feel */}
          <div className="relative rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.1)] overflow-hidden ring-1 ring-black/5">
            {/* Minimalist Browser toolbar */}
            <div className="flex items-center gap-2 px-6 py-4 bg-white/90 border-b border-slate-100/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm border border-black/10" />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-md mx-auto h-7 bg-slate-50/80 rounded-lg flex items-center justify-center border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium tracking-wide">portal.teampadua.com</span>
                </div>
              </div>
            </div>
            
            {/* The actual product screenshot */}
            <div className="relative aspect-[16/9] w-full bg-slate-100">
              <Image
                src="/Image/hero_dashboard.png"
                alt="Team Padua Advisor Portal"
                fill
                className="object-cover object-top"
                priority
                quality={100}
              />
              {/* Overlays for premium feel */}
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] pointer-events-none" />
            </div>
          </div>

          {/* Floating UI Elements for Depth */}
          <motion.div
            initial={{ opacity: 0, x: -40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="absolute top-[25%] -left-6 lg:-left-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 hidden md:flex items-center gap-4 z-30"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFF6D6] text-[#A3843B] flex items-center justify-center font-bold text-lg shadow-inner">
              {activeClients.value}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Active Clients</p>
              <p className="text-sm font-bold text-[#111111]">Serviced today</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
            className="absolute bottom-[25%] -right-6 lg:-right-20 bg-[#111111]/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-white/10 hidden md:flex items-center gap-4 z-30"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">System Status</p>
              <p className="text-sm font-bold text-white">All systems synced</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
