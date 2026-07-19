'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="relative bg-[#FFF6D6] border border-[#FFC72C]/25 rounded-[36px] p-10 md:p-20 text-center space-y-7 overflow-hidden"
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FFC72C] rounded-t-[36px]" />

        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFC72C]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFC72C]/8 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-[#FFC72C] text-[#111111] px-4 py-1.5 rounded-full">
            Get Started
          </span>

          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-[#111111]">
            Ready to elevate your <br />
            advisor workflow?
          </h2>

          <p className="max-w-lg mx-auto text-sm text-[#666666] leading-relaxed">
            Access the Team Padua Advisor Portal and manage every stage of your client
            servicing journey — from onboarding to policy completion — in one secure workspace.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <a
              href="/auth/login"
              id="cta-access-portal"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#111111] hover:bg-[#222222] px-8 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:scale-[1.03] group"
            >
              Access Portal
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="mailto:contact@teampadua.com"
              id="cta-contact-team"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#111111]/20 bg-white hover:bg-[#FFF6D6] px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors"
            >
              <Mail size={13} />
              Contact Team Padua
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
