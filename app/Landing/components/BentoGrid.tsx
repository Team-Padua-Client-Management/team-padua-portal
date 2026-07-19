'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, FileText, RefreshCw, ArrowRightLeft, Wallet,
  FolderLock, Calendar, Bell, BarChart3, Gift, Users, Zap, ArrowUpRight,
} from 'lucide-react';

const tiles = [
  { title: 'ACR', subtitle: 'Advisor Change Request', icon: UserCheck, size: 'col-span-1' },
  { title: 'BCR', subtitle: 'Beneficiary Change Request', icon: FileText, size: 'col-span-1' },
  { title: 'Fund Switching', subtitle: 'Investment reallocation', icon: ArrowRightLeft, size: 'col-span-1 md:col-span-2' },
  { title: 'Fund Withdrawal', subtitle: 'Partial or full redemption', icon: Wallet, size: 'col-span-1' },
  { title: 'Reinstatement', subtitle: 'Policy revival workflow', icon: RefreshCw, size: 'col-span-1' },
  { title: 'Auto Charge Arrangement', subtitle: 'ACA payment setup', icon: Zap, size: 'col-span-1 md:col-span-2' },
  { title: 'Calendar', subtitle: 'Team operational schedule', icon: Calendar, size: 'col-span-1' },
  { title: 'Notifications', subtitle: 'Real-time system alerts', icon: Bell, size: 'col-span-1' },
  { title: 'Reports', subtitle: 'Production & policy analytics', icon: BarChart3, size: 'col-span-1 md:col-span-2' },
  { title: 'Birthday Tracker', subtitle: 'Client celebration log', icon: Gift, size: 'col-span-1' },
  { title: 'Client Profiles', subtitle: 'Unified relationship records', icon: Users, size: 'col-span-1' },
  { title: 'Premium Updates', subtitle: 'Payment mode monitoring', icon: FolderLock, size: 'col-span-1 md:col-span-2' },
];

export default function BentoGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]"
        >
          Workspace Capabilities
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl"
        >
          Every workflow. One platform.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#666666] leading-relaxed"
        >
          From administrative requests to client engagement — twelve integrated capabilities
          designed to eliminate the gaps in an advisor's daily operations.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className={`group bg-white border border-slate-100 rounded-[24px] p-5 flex flex-col gap-3 hover:border-[#FFC72C]/50 hover:shadow-md transition-all duration-300 cursor-default ${tile.size}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#FFF6D6] border border-[#FFC72C]/20 flex items-center justify-center text-[#A3843B] shrink-0">
                  <Icon size={16} />
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-slate-200 group-hover:text-[#FFC72C] transition-colors duration-300 mt-1"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">{tile.title}</h3>
                <p className="text-xs text-[#666666] mt-0.5 leading-snug">{tile.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
