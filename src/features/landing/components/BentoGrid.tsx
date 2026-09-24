'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, FileText, RefreshCw, ArrowRightLeft, Wallet,
  FolderLock, Calendar, Bell, BarChart3, Gift, Users, Zap,
} from 'lucide-react';

const tiles = [
  { title: 'ACR Tracker', subtitle: 'Automated advisor changes', icon: UserCheck, size: 'col-span-1 md:col-span-2 row-span-2' },
  { title: 'BCR Handling', subtitle: 'Beneficiary updates', icon: FileText, size: 'col-span-1' },
  { title: 'Fund Switching', subtitle: 'Reallocation workflows', icon: ArrowRightLeft, size: 'col-span-1' },
  { title: 'Withdrawals', subtitle: 'Redemption tracking', icon: Wallet, size: 'col-span-1' },
  { title: 'Reinstatements', subtitle: 'Policy revival system', icon: RefreshCw, size: 'col-span-1 md:col-span-2' },
  { title: 'Auto Charge', subtitle: 'ACA setup engine', icon: Zap, size: 'col-span-1' },
  { title: 'Team Calendar', subtitle: 'Operational scheduling', icon: Calendar, size: 'col-span-1' },
  { title: 'Notifications', subtitle: 'Real-time alerts', icon: Bell, size: 'col-span-1' },
  { title: 'Analytics', subtitle: 'Production reporting', icon: BarChart3, size: 'col-span-1 md:col-span-2' },
  { title: 'Birthdays', subtitle: 'Automated engagement', icon: Gift, size: 'col-span-1' },
  { title: 'Client 360', subtitle: 'Unified profiles', icon: Users, size: 'col-span-1' },
  { title: 'Premium Logs', subtitle: 'Payment tracking', icon: FolderLock, size: 'col-span-1 md:col-span-2' },
];

export default function BentoGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center justify-center rounded-full bg-[#FFF6D6] px-4 py-1.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3843B]">
            Platform Capabilities
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111]"
        >
          Every workflow.<br/>One intelligent platform.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base text-[#666666] leading-relaxed max-w-2xl mx-auto"
        >
          Replace fragmented tools with a single unified workspace. From complex administrative requests to proactive client engagement, we&apos;ve digitized the entire advisory lifecycle.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[160px]">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
              className={`group relative bg-white border border-slate-200/60 rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden hover:border-[#FFC72C]/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-default ${tile.size}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFF6D6]/0 to-[#FFF6D6]/0 group-hover:from-[#FFF6D6]/20 transition-colors duration-500" />
              
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#A3843B] group-hover:bg-white group-hover:shadow-sm group-hover:scale-110 transition-all duration-500">
                <Icon size={20} strokeWidth={2} />
              </div>
              
              <div className="relative z-10 mt-6">
                <h3 className="text-lg font-bold text-[#111111] leading-tight mb-1">{tile.title}</h3>
                <p className="text-sm text-[#888888] leading-snug">{tile.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
