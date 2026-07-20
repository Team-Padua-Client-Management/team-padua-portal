'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle2, Info } from 'lucide-react';

const benefits = [
  'Faster, error-free policy servicing',
  'Better organized client records',
  'Less manual administrative work',
  'Stronger, more personal client experiences',
  'Real-time premium payment visibility',
  'Centralized team operations and communications',
];

export default function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left: Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 relative"
        >
          <div className="absolute -inset-2 bg-[#FFC72C]/10 rounded-[40px] blur-xl pointer-events-none" />
          <div className="relative rounded-[32px] overflow-hidden border border-slate-200 shadow-sm aspect-[4/5]">
            <Image
              src="/Image/team_alignment.png"
              alt="Team Padua alignment — advisors collaborating"
              fill
              className="object-cover hover:scale-[1.03] transition-transform duration-700"
            />
            {/* Overlay chip */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-xs font-bold text-[#111111]">Sun Life Philippines — Team Padua Business Development</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Narrative */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-7 space-y-7"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] mb-4">
              About the Platform
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl leading-tight mb-5">
              Built so advisors can focus on what actually matters —{' '}
              <span className="text-[#FFC72C]">their clients.</span>
            </h2>
            <p className="text-sm text-[#666666] leading-relaxed mb-4">
              The Team Padua Advisor Portal was born from a real problem: financial advisors were
              spending too much time on paperwork, manual tracking, and fragmented tools — and
              not enough time building the relationships that define great advising.
            </p>
            <p className="text-sm text-[#666666] leading-relaxed">
              Built specifically for Sun Life advisors under Team Padua Business Development,
              this platform replaces scattered spreadsheets and manual logs with a single,
              secure workspace that handles the operational complexity so advisors can stay
              client-focused.
            </p>
          </div>

          {/* Complements-not-replaces callout */}
          <div className="flex gap-3 bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-[#444444] leading-relaxed">
              <span className="font-bold text-[#111111]">This portal complements — it doesn't replace — official Sun Life systems.</span>{' '}
              Think of it as Team Padua's operational layer: a place to organize and track the
              same client and policy information you already manage, without duplicating work
              across spreadsheets and chat threads. All official transactions and submissions
              still follow Sun Life's standard channels.
            </p>
          </div>

          {/* Benefits list */}
          <div className="bg-[#FFF6D6]/60 border border-[#FFC72C]/15 rounded-[24px] p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A3843B] mb-4">
              What the portal delivers
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 size={15} className="text-[#FFC72C] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#111111] font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

      </div>
    </section>
  );
}