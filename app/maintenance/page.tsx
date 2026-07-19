'use client';

import React from 'react';
import { Wrench, Terminal, RefreshCcw, Home } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#FFC72C]/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative max-w-xl w-full text-center bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-[32px] p-8 md:p-12 shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20 relative">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/5 animate-pulse" />
          <Wrench className="h-10 w-10 text-[#FFC72C]" />
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[#FFC72C] text-[10px] font-bold uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC72C] animate-ping" />
          System Maintenance Active
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl leading-tight">
          🚧 System Under Maintenance
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          The system is currently undergoing maintenance.
          Please try again later.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Contact Administrator for more information.
        </p>

        {/* System status panel */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-left text-xs space-y-2 max-w-md mx-auto">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal size={12} className="text-[#FFC72C]" /> System status
          </p>
          <p className="text-slate-500">
            • All services: <span className="text-amber-400">Temporarily unavailable</span>
          </p>
          <p className="text-slate-500">
            • Estimated downtime: <span className="text-slate-300">Check back soon</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-[#FFC72C] hover:bg-[#ebd04e] text-slate-950 rounded-full font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCcw size={12} />
            Check Status
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Home size={12} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
