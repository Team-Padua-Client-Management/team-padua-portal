'use client';

import React from "react";
import Image from "next/image";
import { AuthForm } from "../AuthForm";
import { SignIn } from "../../action/auth";
import { ChevronLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9EC] via-white to-white dark:from-[#0B0C10] dark:via-slate-950 dark:to-slate-950 px-6 relative overflow-hidden">
      
      {/* Decorative Glow Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-[#FFC72C]/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-amber-400/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[32px] shadow-lg p-6 md:p-8 hover:shadow-xl transition-all duration-300 relative z-10">
        
        {/* Back Link */}
        <div className="flex justify-between items-center mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-900"
          >
            <ChevronLeft size={12} className="text-slate-400" />
            Back to Overview
          </a>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#A3843B] dark:text-[#FFC72C] bg-[#FFF9EC] dark:bg-slate-950 px-2.5 py-1 rounded-full">
            Portal Sync
          </span>
        </div>

        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-[#FFC72C] blur-md opacity-20 rounded-full" />
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={64}
              height={64}
              priority
              className="relative object-contain p-1.5 rounded-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1B1B1B] dark:text-white">TEAMPADUA</h1>
            <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Advisor Client Servicing Workspace</p>
          </div>
        </div>

        {/* Auth form component */}
        <AuthForm action={SignIn} />
      </div>
    </div>
  );
}
