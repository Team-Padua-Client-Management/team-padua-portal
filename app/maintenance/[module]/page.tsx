'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Wrench, Terminal, RefreshCcw, ArrowLeft } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  calendar: 'Calendar',
  attendance: 'Attendance',
  messages: 'Messages',
  faq: 'FAQ',
  teams: 'Teams',
  members: 'Members',
  profile: 'Profile',
  client_servicing: 'Client Servicing',
  acr: 'ACR',
  bcr: 'BCR',
  aca: 'ACA',
  fund_switching: 'Fund Switching',
  fund_withdrawal: 'Fund Withdrawal',
  reinstatement: 'Reinstatement',
  sro: 'SRO',
  pdi: 'PDI',
  cpst: 'CPST',
  cpc: 'CPC',
  fst: 'FST',
  mngt: 'MNGT',
  ppu: 'PPU',
  csmv: 'CSMV',
  cv: 'CV',
  adat: 'ADAT',
  cgpt: 'CGPT',
  pptm: 'PPTM',
  jf_application: 'JF Application',
  jf_bizdev: 'JF BizDev',
};

export default function ModuleMaintenancePage() {
  const params = useParams();
  const moduleKey = params.module as string;
  const moduleName = MODULE_LABELS[moduleKey] || moduleKey?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Module';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative max-w-xl w-full text-center bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-[32px] p-8 md:p-12 shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 border border-orange-500/20 relative">
          <div className="absolute inset-0 rounded-3xl bg-orange-500/5 animate-pulse" />
          <Wrench className="h-10 w-10 text-orange-400" />
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
          Module Maintenance
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl leading-tight">
          🚧 {moduleName} Module Under Maintenance
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          The <strong className="text-slate-200">{moduleName}</strong> module is currently undergoing maintenance
          and cannot be used at this time.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Contact your Administrator for more information.
        </p>

        {/* Status panel */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-left text-xs space-y-2 max-w-md mx-auto">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal size={12} className="text-orange-400" /> Module status
          </p>
          <p className="text-slate-500">
            • {moduleName}: <span className="text-orange-400">Under maintenance</span>
          </p>
          <p className="text-slate-500">
            • Other modules: <span className="text-emerald-400">Operational</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCcw size={12} />
            Check Status
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft size={12} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
