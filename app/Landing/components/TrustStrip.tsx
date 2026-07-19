'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Wallet, HeartHandshake, Activity } from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';

interface TrustStripProps {
  stats: LandingStats;
}

const pillars = (stats: LandingStats) => [
  {
    icon: Users,
    label: 'Client Records',
    value: stats.totalClients > 0 ? `${stats.totalClients}+` : '—',
    sublabel: 'Managed in the portal',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: FileText,
    label: 'Service Requests',
    value: stats.acrRequests > 0 ? `${stats.acrRequests}` : '—',
    sublabel: 'ACR submissions logged',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Wallet,
    label: 'Premium Monitoring',
    value: 'Real-time',
    sublabel: 'Payment status tracking',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: HeartHandshake,
    label: 'Birthday Touchpoints',
    value: stats.birthdaysThisMonth > 0 ? `${stats.birthdaysThisMonth}` : '—',
    sublabel: 'Client celebrations this month',
    color: 'text-rose-500 bg-rose-50',
  },
  {
    icon: Activity,
    label: 'Portal Users',
    value: stats.teamMembers > 0 ? `${stats.teamMembers}` : '—',
    sublabel: 'Team Padua members active',
    color: 'text-violet-600 bg-violet-50',
  },
];

export default function TrustStrip({ stats }: TrustStripProps) {
  const items = pillars(stats);

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm px-6 py-8 lg:px-10">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#A3843B] mb-8">
          What the portal supports
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <Icon size={17} />
                </div>
                <p className="text-xl font-extrabold text-[#111111] leading-none mt-1">
                  {item.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#111111]">
                  {item.label}
                </p>
                <p className="text-[10px] text-[#666666] leading-snug">
                  {item.sublabel}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
