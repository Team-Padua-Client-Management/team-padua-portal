'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LandingStats } from '@/app/api/landing-stats/route';
import { getStat, ILLUSTRATIVE_STATS } from '../../../lib/statDisplay';


interface StatsBandProps {
  stats: LandingStats;
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

  return (
    <section className="bg-[#111111] py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFC72C]/70 mb-14"
        >
          What the portal delivers
        </motion.p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {callouts.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-2 border-l border-white/5 first:border-l-0 lg:px-8"
            >
              <p className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {item.value}
              </p>
              <p className="text-sm font-bold text-[#FFC72C]">{item.label}</p>
              <p className="text-xs text-white/40 leading-snug">{item.sublabel}</p>
            </motion.div>
          ))}
        </div>

        {anySample && (
          <p className="text-center text-[9px] text-white/30 mt-10 uppercase tracking-wider font-semibold">
            Illustrative figures shown for preview purposes
          </p>
        )}
      </div>
    </section>
  );
}