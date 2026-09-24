'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { LandingStats } from '@/app/api/landing-stats/route';
import { getStat, ILLUSTRATIVE_STATS } from '../../../lib/statDisplay';

interface StatsBandProps {
  stats: LandingStats;
}

function AnimatedNumber({ value }: { value: string }) {
  return <span>{value}</span>;
}

const buildCallouts = (stats: LandingStats) => {
  const totalClients = getStat(stats.totalClients, ILLUSTRATIVE_STATS.totalClients, '+');
  const teamMembers = getStat(stats.teamMembers, ILLUSTRATIVE_STATS.teamMembers);

  return [
    {
      value: totalClients.value,
      isSample: totalClients.isSample,
      label: 'Client records organized',
      sublabel: 'All in one secure workspace',
    },
    {
      value: 'Anywhere',
      isSample: false,
      label: 'Access — anytime',
      sublabel: 'Cloud-hosted, always available',
    },
    {
      value: 'Real-time',
      isSample: false,
      label: 'Premium monitoring',
      sublabel: 'Payment status updated live',
    },
    {
      value: teamMembers.value,
      isSample: teamMembers.isSample,
      label: 'Team members on the portal',
      sublabel: 'All operations, one workspace',
    },
  ];
};

export default function StatsBand({ stats }: StatsBandProps) {
  const callouts = buildCallouts(stats);
  const anySample = callouts.some((c) => c.isSample);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="bg-[#111111] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFC72C]/60 mb-14"
        >
          What the portal delivers
        </motion.p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {callouts.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-2 lg:border-l lg:border-white/[0.06] lg:first:border-l-0 lg:px-8"
            >
              <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                <AnimatedNumber value={item.value} />
              </p>
              <p className="text-xs font-bold text-[#FFC72C]">{item.label}</p>
              <p className="text-[11px] text-white/30 leading-snug">{item.sublabel}</p>
            </motion.div>
          ))}
        </div>

        {anySample && (
          <p className="text-center text-[9px] text-white/20 mt-10 uppercase tracking-wider font-semibold">
            Illustrative figures shown for preview purposes
          </p>
        )}
      </div>
    </section>
  );
}
