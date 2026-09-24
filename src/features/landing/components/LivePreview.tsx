'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Bell, Users, Calendar, BarChart3, FileText, Wallet, Gift, LayoutDashboard } from 'lucide-react';

const previewScreens = {
  Dashboard: {
    icon: LayoutDashboard,
    title: 'Advisory Overview',
    subtitle: 'High-level workflow summary',
    widget: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
            <span className="text-[11px] text-[#888888] font-bold block uppercase tracking-widest mb-1">Active Clients</span>
            <span className="text-2xl font-black text-[#111111] tracking-tight">4,192</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
            <span className="text-[11px] text-[#888888] font-bold block uppercase tracking-widest mb-1">Pending ACR</span>
            <span className="text-2xl font-black text-[#111111] tracking-tight">14</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <span className="text-[11px] text-[#888888] font-bold block uppercase tracking-widest mb-3">Today&apos;s Priority</span>
          <div className="flex items-center gap-3 text-sm font-medium text-[#444444] bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFC72C] animate-pulse shrink-0" />
            <span>Review premium grace period alerts (3 pending)</span>
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
      <div className="space-y-3">
        {[
          { name: 'Maria Santos', policy: 'SL Maxilink Prime', status: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { name: 'Juan Dela Cruz', policy: 'SL Prosperity', status: 'Serviced', color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { name: 'Ana Reyes', policy: 'SL Protect Plus', status: 'Prospect', color: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map((client) => (
          <div key={client.name} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-bold text-[#A3843B]">
                {client.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#111111]">{client.name}</p>
                <p className="text-xs text-[#888888] mt-0.5">{client.policy}</p>
              </div>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${client.color}`}>
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
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center text-sm font-bold border-b border-slate-100 pb-3">
          <span className="text-[#111111]">July 2026</span>
          <span className="text-[#A3843B] bg-[#FFF6D6] px-3 py-1 rounded-lg text-xs">Advisor Sync</span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#888888] font-bold uppercase tracking-wider">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`p-2 rounded-xl cursor-pointer ${i === 8 ? 'bg-[#111111] text-white shadow-md' : 'text-[#555555] hover:bg-slate-50 border border-transparent hover:border-slate-100'} transition-all`}>
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
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 text-sm shadow-sm opacity-60">
          <div className="w-5 h-5 rounded border-2 border-emerald-400 bg-emerald-50 flex items-center justify-center text-xs text-emerald-600 shrink-0">✓</div>
          <span className="line-through text-[#888888] font-medium">Onboard new advisor associate</span>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-md border border-[#FFC72C]/40 text-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFC72C]" />
          <div className="w-5 h-5 rounded border-2 border-[#FFC72C] shrink-0 ml-1" />
          <span className="font-bold text-[#111111]">Process ACR for Dela Cruz family</span>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm hover:border-slate-200 transition-colors cursor-pointer">
          <div className="w-5 h-5 rounded border-2 border-slate-200 shrink-0" />
          <span className="font-medium text-[#555555]">Send birthday greeting to M. Santos</span>
        </div>
      </div>
    ),
  },
  Servicing: {
    icon: FileText,
    title: 'Service Requests',
    subtitle: 'ACR, BCR & policy workflows',
    widget: (
      <div className="space-y-3">
        {[
          { type: 'ACR', label: 'Advisor Change Request', status: 'Submitted', color: 'text-blue-700 bg-blue-50 border-blue-100' },
          { type: 'BCR', label: 'Beneficiary Update', status: 'In Review', color: 'text-amber-700 bg-amber-50 border-amber-100' },
        ].map((req) => (
          <div key={req.type} className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className={`font-bold px-2.5 py-1 rounded-md border tracking-wider uppercase text-[10px] ${req.color}`}>{req.type}</span>
              <span className="text-[#999999] font-medium">2h ago</span>
            </div>
            <p className="text-sm text-[#111111] font-bold">{req.label}</p>
            <p className="text-xs text-[#888888] mt-1 font-medium">{req.status}</p>
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
      <div className="space-y-3">
        <div className="flex justify-between items-center p-5 bg-white border border-slate-200 shadow-sm rounded-2xl relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
          <div className="ml-2">
            <p className="text-sm font-bold text-[#111111]">Monthly Grace Period</p>
            <p className="text-xs text-[#888888] mt-1 font-medium">Policy #SL-20241109</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">5 days left</span>
        </div>
        <div className="flex justify-between items-center p-5 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div className="ml-2">
            <p className="text-sm font-bold text-[#111111]">Annual Payment</p>
            <p className="text-xs text-[#888888] mt-1 font-medium">Policy #SL-20230312</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">Paid</span>
        </div>
      </div>
    ),
  },
  Notifications: {
    icon: Bell,
    title: 'System Alerts',
    subtitle: 'Real-time portal activity',
    widget: (
      <div className="space-y-3">
        {[
          { title: 'ACR Submitted Successfully', desc: 'Request logged and forwarded to Business Ops.', time: '2m ago' },
          { title: 'Birthday Reminder', desc: '3 clients celebrating this week.', time: '1h ago' },
          { title: 'System Update Complete', desc: 'All database changes synced.', time: '3h ago' },
        ].map((n) => (
          <div key={n.title} className="p-4 bg-white border border-slate-100 shadow-sm rounded-2xl flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[#FFF6D6] border border-[#FFC72C]/20 flex items-center justify-center shrink-0">
              <Bell size={16} className="text-[#A3843B]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="font-bold text-[#111111] text-sm truncate">{n.title}</p>
                <span className="text-[10px] font-semibold text-[#999999] shrink-0 uppercase tracking-wider">{n.time}</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">{n.desc}</p>
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
      <div className="space-y-4">
        <div className="p-5 bg-gradient-to-r from-[#FFF6D6] to-[#FFF6D6]/50 border border-[#FFC72C]/20 rounded-2xl">
          <p className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-1">🎂 This Week&apos;s Birthdays</p>
          <p className="text-xs text-[#666666] leading-relaxed">Send personalized greetings to 3 clients celebrating this week.</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-2 space-y-1">
          {['Maria Santos — July 20', 'Juan Dela Cruz — July 22', 'Ana Reyes — July 25'].map((entry) => (
            <div key={entry} className="flex items-center justify-between text-sm p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <span className="text-[#444444] font-medium text-xs">{entry}</span>
              <button className="text-[10px] bg-[#111111] text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-[#333] hover:shadow-md transition-all">Send</button>
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
    <section id="preview" className="mx-auto max-w-[1200px] px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto space-y-5 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-1.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#555555]">
            Portal Preview
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-extrabold tracking-tight text-[#111111]"
        >
          See the portal in action.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base text-[#666666] leading-relaxed"
        >
          Interact with a live simulation of the Team Padua Advisor Portal. Select a module on the left to explore its capabilities.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2.5rem] bg-white p-4 md:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200/60 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mx-auto max-w-5xl"
      >
        {/* Sidebar */}
        <div className="lg:col-span-4 bg-slate-50/50 border border-slate-100 p-3 rounded-3xl flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest px-4 pt-3 pb-2 block">
            Navigation
          </span>
          {(Object.keys(previewScreens) as ScreenName[]).map((name) => {
            const NavIcon = previewScreens[name].icon;
            const isActive = selected === name;
            return (
              <button
                key={name}
                id={`preview-nav-${name.toLowerCase()}`}
                onClick={() => setSelected(name)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-white text-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-200/60'
                    : 'text-[#666666] hover:bg-slate-100/80 hover:text-[#111111] border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#FFF6D6] text-[#A3843B]' : 'bg-transparent text-inherit'}`}>
                   <NavIcon size={16} />
                </div>
                <span>{name}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-[#A3843B]" />}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div className="lg:col-span-8 bg-slate-50/30 border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col min-h-[420px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col h-full relative z-10"
            >
              <div className="border-b border-slate-200/60 pb-5 mb-6">
                <h3 className="text-xl font-bold text-[#111111] mb-1">{screen.title}</h3>
                <p className="text-xs text-[#888888] uppercase font-bold tracking-widest">
                  {screen.subtitle}
                </p>
              </div>
              <div className="flex-1">{screen.widget}</div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto border-t border-slate-200/60 pt-4 flex justify-between items-center text-[10px] text-[#A3843B]/60 uppercase font-bold tracking-widest relative z-10">
            <span>Interactive Demo</span>
            <span>Secured Environment</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
