'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Wallet, HeartHandshake, Activity } from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';
import { getStat, ILLUSTRATIVE_STATS } from '@src/lib/statDisplay';

interface TrustStripProps {
  stats: LandingStats;
}

const pillars = (stats: LandingStats) => {
  const totalClients = getStat(stats.totalClients, ILLUSTRATIVE_STATS.totalClients, '+');
  const acr = getStat(stats.acrRequests, ILLUSTRATIVE_STATS.acrRequests);
  const birthdays = getStat(stats.birthdaysThisMonth, ILLUSTRATIVE_STATS.birthdaysThisMonth);
  const teamMembers = getStat(stats.teamMembers, ILLUSTRATIVE_STATS.teamMembers);

  return [
    {
      icon: Users,
      label: 'Client Records',
      ...totalClients,
      sublabel: 'Managed seamlessly',
    },
    {
      icon: FileText,
      label: 'Service Requests',
      ...acr,
      sublabel: 'Automated logging',
    },
    {
      icon: Wallet,
      label: 'Premium Data',
      value: 'Real-time',
      isSample: false,
      sublabel: 'Status tracking',
    },
    {
      icon: HeartHandshake,
      label: 'Client Birthdays',
      ...birthdays,
      sublabel: 'Engagement this month',
    },
    {
      icon: Activity,
      label: 'Active Users',
      ...teamMembers,
      sublabel: 'Platform adoption',
    },
  ];
};

export default function TrustStrip({ stats }: TrustStripProps) {
  const items = pillars(stats);
  const anySample = items.some((i) => i.isSample);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-8 md:p-10 relative z-30">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#A3843B] mb-10">
        Trusted by top advisors for core operations
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 lg:gap-8">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className="group flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#A3843B] group-hover:bg-[#FFF6D6] group-hover:scale-110 transition-all duration-300 mb-4 border border-slate-100 group-hover:border-[#FFC72C]/20">
                <Icon size={20} strokeWidth={2} />
              </div>

              <p className="text-3xl lg:text-4xl font-black text-[#111111] tracking-tight mb-1">
                {item.value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#333333] mb-1">
                {item.label}
              </p>
              <p className="text-xs text-[#888888] font-medium">
                {item.sublabel}
              </p>
            </motion.div>
          );
        })}
      </div>

      {anySample && (
        <p className="text-center text-[10px] text-[#A3843B]/60 mt-10 uppercase tracking-widest font-bold">
          Sample figures shown until live data connects
        </p>
      )}
    </div>
  );
}
