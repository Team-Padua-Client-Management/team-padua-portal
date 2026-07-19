'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, Wallet, Gift, CalendarCheck, BarChart3, ArrowUpRight,
} from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';

interface ModuleCardsProps {
  stats: LandingStats;
}

const modules = (stats: LandingStats) => [
  {
    icon: Users,
    title: 'Client Management',
    description: 'Unified client profiles with full policy lifecycle tracking and relationship history.',
    metric: stats.totalClients > 0 ? `${stats.totalClients} clients` : 'Client records',
    metricColor: 'bg-blue-50 text-blue-700',
    accent: 'hover:border-blue-200',
  },
  {
    icon: FileText,
    title: 'Policy Servicing',
    description: 'Digitized ACR, BCR, fund switching, withdrawals, and reinstatement workflows.',
    metric: stats.acrRequests > 0 ? `${stats.acrRequests} ACR requests` : 'Service requests',
    metricColor: 'bg-amber-50 text-amber-700',
    accent: 'hover:border-amber-200',
  },
  {
    icon: Wallet,
    title: 'Premium Monitoring',
    description: 'Track payment modes, grace periods, and premium status across all active policies.',
    metric: 'Real-time tracking',
    metricColor: 'bg-emerald-50 text-emerald-700',
    accent: 'hover:border-emerald-200',
  },
  {
    icon: Gift,
    title: 'Birthday Engagement',
    description: 'Proactive birthday log, greeting templates, and client appreciation touchpoints.',
    metric: stats.birthdaysThisMonth > 0
      ? `${stats.birthdaysThisMonth} this month`
      : 'Celebration tracker',
    metricColor: 'bg-rose-50 text-rose-600',
    accent: 'hover:border-rose-200',
  },
  {
    icon: CalendarCheck,
    title: 'Calendar & Tasks',
    description: 'Smart operational calendar with task prioritization and deadline management.',
    metric: stats.upcomingEvents > 0 ? `${stats.upcomingEvents} upcoming` : 'Team events',
    metricColor: 'bg-violet-50 text-violet-700',
    accent: 'hover:border-violet-200',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Comprehensive production reports, policy summaries, and team performance metrics.',
    metric: 'On-demand reports',
    metricColor: 'bg-slate-100 text-slate-700',
    accent: 'hover:border-slate-300',
  },
];

export default function ModuleCards({ stats }: ModuleCardsProps) {
  const cards = modules(stats);

  return (
    <section id="modules" className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]"
        >
          Core Advisor Modules
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl leading-tight"
        >
          Everything an advisor needs,{' '}
          <span className="text-[#FFC72C]">in one place.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#666666] leading-relaxed"
        >
          Six purpose-built modules covering every dimension of the advisor's daily workflow
          — from client onboarding to policy completion.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`group bg-white border border-slate-100 rounded-[28px] p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.accent} cursor-default`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF6D6] flex items-center justify-center text-[#A3843B] border border-[#FFC72C]/20">
                  <Icon size={18} />
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-slate-300 group-hover:text-[#FFC72C] transition-colors duration-300 mt-1"
                />
              </div>

              {/* Metric badge */}
              <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${card.metricColor}`}>
                {card.metric}
              </span>

              {/* Content */}
              <div>
                <h3 className="text-sm font-bold text-[#111111] mb-1">{card.title}</h3>
                <p className="text-xs text-[#666666] leading-relaxed">{card.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
