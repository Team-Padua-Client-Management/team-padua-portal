'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { LandingStats } from '@/app/api/landing-stats/route';

interface ModuleDeepDivesProps {
  stats: LandingStats;
}

const dives = (stats: LandingStats) => [
  {
    tag: 'Client Management Tracker',
    headline: 'Every client. Every policy.\nOne complete picture.',
    body: 'The Client Management Tracker consolidates all client demographics, relationship context, policy associations, and historical logs into a single, searchable profile. No more jumping between spreadsheets — everything an advisor needs about a client is one click away.',
    stat: stats.totalClients > 0
      ? `${stats.totalClients} client records`
      : 'Unified client records',
    statLabel: 'organized in the portal',
    image: '/Image/module_clients.png',
    imageAlt: 'Client management module UI',
    imageLeft: false,
  },
  {
    tag: 'Policy Servicing',
    headline: 'Requests submitted.\nProgress tracked. Nothing lost.',
    body: 'Submit Advisor Change Requests, Beneficiary Change Requests, fund switches, and withdrawals through structured digital forms. Each request logs a timestamped status trail — so advisors and their support teams always know exactly where a case stands.',
    stat: stats.acrRequests > 0 ? `${stats.acrRequests} ACR requests` : 'Service requests',
    statLabel: 'submitted and tracked',
    image: '/Image/module_policy.png',
    imageAlt: 'Policy servicing workflow UI',
    imageLeft: true,
  },
  {
    tag: 'Premium Monitoring',
    headline: 'Grace periods. Due dates.\nAlways front of mind.',
    body: 'The premium monitoring module surfaces payment modes, grace period countdowns, and overdue flags across the entire client book. Advisors can proactively reach out before a policy lapses — not after.',
    stat: 'Real-time',
    statLabel: 'payment status visibility',
    image: '/Image/module_premium.png',
    imageAlt: 'Premium monitoring dashboard UI',
    imageLeft: false,
  },
  {
    tag: 'Productivity Tools',
    headline: 'Tasks, calendar, and alerts.\nAll synced, all visible.',
    body: 'A built-in operational calendar, prioritized task list, and real-time notification center keep every team member aligned. Deadlines don\'t slip when the whole team is working from the same operational view.',
    stat: stats.upcomingEvents > 0 ? `${stats.upcomingEvents} events` : 'Team events',
    statLabel: 'scheduled and tracked',
    image: '/Image/module_productivity.png',
    imageAlt: 'Productivity and tasks module UI',
    imageLeft: true,
  },
  {
    tag: 'Birthday Engagement',
    headline: 'A greeting on the right day\nbuilds a relationship for life.',
    body: 'The birthday module surfaces upcoming client birthdays with a personalized greeting workflow — so no celebration goes unacknowledged. Small, consistent gestures are the foundation of long-term advisor-client loyalty.',
    stat: stats.birthdaysThisMonth > 0
      ? `${stats.birthdaysThisMonth} birthdays`
      : 'Client birthdays',
    statLabel: 'to celebrate this month',
    image: '/Image/module_birthday.png',
    imageAlt: 'Birthday engagement module UI',
    imageLeft: false,
  },
];

export default function ModuleDeepDives({ stats }: ModuleDeepDivesProps) {
  const sections = dives(stats);

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8 space-y-28 lg:space-y-36">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3843B]"
        >
          Module Deep-Dives
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl"
        >
          Built around how advisors actually work.
        </motion.h2>
      </div>

      {sections.map((item) => (
        <motion.div
          key={item.tag}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center ${item.imageLeft ? '' : 'lg:[&>*:first-child]:order-2'}`}
        >
          {/* Image */}
          <div className="lg:col-span-7 relative group">
            <div className="absolute -inset-4 bg-[#FFC72C]/[0.04] rounded-3xl blur-2xl pointer-events-none group-hover:bg-[#FFC72C]/[0.07] transition-colors duration-700" />
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] aspect-[4/3]">
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="lg:col-span-5 space-y-5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] text-[#A3843B] border-b-2 border-[#FFC72C]/30 pb-1">
              {item.tag}
            </span>
            <h3 className="text-2xl lg:text-[1.75rem] font-extrabold text-[#111111] leading-tight whitespace-pre-line tracking-tight">
              {item.headline}
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed">{item.body}</p>

            {/* Stat callout */}
            <div className="flex items-center gap-4 pt-2">
              <div className="w-1 h-10 bg-[#FFC72C] rounded-full shrink-0" />
              <div>
                <p className="text-xl font-extrabold text-[#111111] tracking-tight">{item.stat}</p>
                <p className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold mt-0.5">
                  {item.statLabel}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
