'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bell, Users, Calendar, BarChart3, FileText, Wallet, Gift } from 'lucide-react';

const previewScreens = {
  Dashboard: {
    icon: BarChart3,
    title: 'Advisory Overview',
    subtitle: 'High-level workflow summary',
    widget: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFF6D6] border border-[#FFC72C]/20 p-3 rounded-2xl">
            <span className="text-[10px] text-[#666666] font-semibold block uppercase">Active Clients</span>
            <span className="text-lg font-bold text-[#111111]">Synced</span>
          </div>
          <div className="bg-[#FFF6D6] border border-[#FFC72C]/20 p-3 rounded-2xl">
            <span className="text-[10px] text-[#666666] font-semibold block uppercase">Pending ACR</span>
            <span className="text-lg font-bold text-[#111111]">In Review</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-2xl">
          <span className="text-[10px] text-[#666666] font-semibold block uppercase mb-2">Today's Priority</span>
          <div className="flex items-center gap-3 text-xs text-[#666666]">
            <div className="w-2 h-2 rounded-full bg-[#FFC72C] animate-pulse" />
            <span>Review premium grace period alerts</span>
          </div>
        </div>
      </div>
    ),
  },
  Clients: {
    icon: Users,
    title: 'Client Database',
    subtitle: 'Comprehensive client records',
    widget: (
      <div className="space-y-2">
        {[
          { name: 'Maria Santos', policy: 'SL Maxilink Prime', status: 'Active', color: 'bg-emerald-100 text-emerald-700' },
          { name: 'Juan Dela Cruz', policy: 'SL Prosperity', status: 'Serviced', color: 'bg-blue-100 text-blue-700' },
          { name: 'Ana Reyes', policy: 'SL Protect Plus', status: 'Prospect', color: 'bg-amber-100 text-amber-700' },
        ].map((client) => (
          <div key={client.name} className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFF6D6] flex items-center justify-center text-xs font-bold text-[#A3843B]">
                {client.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[#111111]">{client.name}</p>
                <p className="text-[10px] text-[#666666]">{client.policy}</p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${client.color}`}>
              {client.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  Calendar: {
    icon: Calendar,
    title: 'Operational Schedule',
    subtitle: 'Meetings & follow-up calendar',
    widget: (
      <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-center text-xs font-bold border-b border-slate-100 pb-2">
          <span>July 2026</span>
          <span className="text-[#FFC72C]">Advisor Sync</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#666666]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`p-1 rounded-md ${i === 8 ? 'bg-[#FFC72C] text-[#111111] font-bold' : 'text-[#666666]'}`}>
              {i + 12}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  Tasks: {
    icon: BarChart3,
    title: 'Task Management',
    subtitle: 'Daily operations checklist',
    widget: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100 text-xs">
          <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-emerald-500">✓</div>
          <span className="line-through text-[#666666]">Onboard new advisor associate</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100 text-xs">
          <div className="w-4 h-4 rounded border-2 border-[#FFC72C]" />
          <span className="font-semibold text-[#111111]">Process ACR for Dela Cruz family</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100 text-xs">
          <div className="w-4 h-4 rounded border border-slate-200" />
          <span className="text-[#666666]">Send birthday greeting to M. Santos</span>
        </div>
      </div>
    ),
  },
  Servicing: {
    icon: FileText,
    title: 'Service Requests',
    subtitle: 'ACR, BCR & policy workflows',
    widget: (
      <div className="space-y-2">
        {[
          { type: 'ACR', label: 'Advisor Change Request', status: 'Submitted', color: 'text-blue-600 bg-blue-50' },
          { type: 'BCR', label: 'Beneficiary Update', status: 'In Review', color: 'text-amber-600 bg-amber-50' },
        ].map((req) => (
          <div key={req.type} className="p-3 bg-white border border-slate-100 rounded-xl">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className={`font-bold px-2 py-0.5 rounded-full ${req.color}`}>{req.type}</span>
              <span className="text-[#666666]">2h ago</span>
            </div>
            <p className="text-xs text-[#111111] font-semibold">{req.label}</p>
            <p className="text-[10px] text-[#666666] mt-0.5">{req.status}</p>
          </div>
        ))}
      </div>
    ),
  },
  Premiums: {
    icon: Wallet,
    title: 'Premium Monitoring',
    subtitle: 'Payment status & grace periods',
    widget: (
      <div className="space-y-2">
        <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
          <div>
            <p className="text-xs font-bold text-[#111111]">Monthly Grace Period</p>
            <p className="text-[10px] text-[#666666]">Policy #SL-20241109</p>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">5 days left</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
          <div>
            <p className="text-xs font-bold text-[#111111]">Annual Payment</p>
            <p className="text-[10px] text-[#666666]">Policy #SL-20230312</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Paid</span>
        </div>
      </div>
    ),
  },
  Notifications: {
    icon: Bell,
    title: 'System Alerts',
    subtitle: 'Real-time portal activity',
    widget: (
      <div className="space-y-2">
        {[
          { title: 'ACR Submitted Successfully', desc: 'Request logged and forwarded to Business Ops.', time: '2m ago' },
          { title: 'Birthday Reminder', desc: '3 clients celebrating this week.', time: '1h ago' },
          { title: 'System Update Complete', desc: 'All database changes synced.', time: '3h ago' },
        ].map((n) => (
          <div key={n.title} className="p-2.5 bg-white border border-slate-100 rounded-xl text-xs flex gap-2">
            <Bell size={13} className="text-[#FFC72C] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-[#111111] text-[11px]">{n.title}</p>
                <span className="text-[9px] text-[#666666] shrink-0 ml-2">{n.time}</span>
              </div>
              <p className="text-[10px] text-[#666666] mt-0.5">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  Birthday: {
    icon: Gift,
    title: 'Birthday Engagement',
    subtitle: 'Upcoming client celebrations',
    widget: (
      <div className="space-y-3">
        <div className="p-3 bg-[#FFF6D6] border border-[#FFC72C]/20 rounded-2xl">
          <p className="text-xs font-bold text-[#111111] flex items-center gap-2">🎂 This Week's Birthdays</p>
          <p className="text-[10px] text-[#666666] mt-1">Send personalized greetings to 3 clients celebrating this week.</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2">
          {['Maria Santos — July 20', 'Juan Dela Cruz — July 22', 'Ana Reyes — July 25'].map((entry) => (
            <div key={entry} className="flex items-center justify-between text-[11px]">
              <span className="text-[#666666]">{entry}</span>
              <span className="text-[10px] bg-[#FFF6D6] text-[#A3843B] px-2 py-0.5 rounded-full font-bold border border-[#FFC72C]/20">Send</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
};

type ScreenName = keyof typeof previewScreens;

export default function LivePreview() {
  const [selected, setSelected] = useState<ScreenName>('Dashboard');
  const screen = previewScreens[selected];

  return (
    <section id="preview" className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]"
        >
          Portal Preview
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl"
        >
          See the portal in action.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#666666]"
        >
          Navigate each section of the Team Padua Advisor Portal using the sidebar below.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="border border-slate-100 rounded-[32px] bg-[#FFF6D6]/30 p-4 md:p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Sidebar */}
        <div className="lg:col-span-3 bg-white border border-slate-100 p-3 rounded-2xl flex flex-col gap-1">
          <span className="text-[9px] font-bold text-[#666666] uppercase tracking-widest px-3 mb-2 block">
            Portal Navigation
          </span>
          {(Object.keys(previewScreens) as ScreenName[]).map((name) => {
            const NavIcon = previewScreens[name].icon;
            const isActive = selected === name;
            return (
              <button
                key={name}
                id={`preview-nav-${name.toLowerCase()}`}
                onClick={() => setSelected(name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-[#FFC72C] text-[#111111] font-bold shadow-sm'
                    : 'text-[#666666] hover:bg-slate-50'
                }`}
              >
                <NavIcon size={13} />
                <span>{name}</span>
                {isActive && <ChevronDown size={11} className="ml-auto -rotate-90" />}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div className="lg:col-span-9 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 flex flex-col min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-sm font-bold text-[#111111]">{screen.title}</h3>
                <p className="text-[10px] text-[#666666] uppercase font-semibold mt-0.5">
                  {screen.subtitle}
                </p>
              </div>
              <div className="flex-1">{screen.widget}</div>
            </motion.div>
          </AnimatePresence>

          <div className="border-t border-slate-50 pt-3 mt-5 flex justify-between items-center text-[9px] text-[#666666] uppercase font-mono">
            <span>Team Padua Portal Preview</span>
            <span>Authorized Access Only</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
