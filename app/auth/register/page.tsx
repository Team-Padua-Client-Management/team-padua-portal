'use client';

import React from "react";
import Image from "next/image";
import { AuthForm } from "../AuthForm";
import { SignUp } from "../../action/auth";
import { ChevronLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-[#F8F9FA] dark:bg-slate-950">
      {/* Right Visual Side (Creative Redesign) */}
      <div className="hidden lg:flex w-[55%] relative bg-white items-center justify-center overflow-hidden p-12 order-2 lg:order-1 border-r border-slate-100">
        {/* Sophisticated Background Layers */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FFC72C]/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#A3843B]/5 blur-[80px] rounded-full pointer-events-none" />
        
        {/* Abstract Layered Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-[#FFC72C]/30 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-24 right-24 w-24 h-24 border border-[#A3843B]/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        
        {/* Floating UI Element / Glass Card */}
        <div className="absolute left-12 bottom-32 bg-white/70 backdrop-blur-xl border border-slate-200/50 p-4 rounded-2xl shadow-xl w-64 transform -rotate-3 z-0 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FFC72C]/20 flex items-center justify-center">
              <span className="text-xs">💼</span>
            </div>
            <div>
              <div className="h-2 w-20 bg-slate-200 rounded-full mb-1.5" />
              <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-slate-100 rounded-full" />
            <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
          </div>
        </div>

        {/* Content Panel */}
        <div className="relative z-10 w-full max-w-xl">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
             {/* Decorative Corner Glow */}
             <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFC72C]/20 blur-3xl rounded-full pointer-events-none" />
             
            <h2 className="text-4xl font-extrabold text-[#111111] tracking-tight mb-5 leading-[1.15]">
              Begin your<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3843B] to-[#FFC72C]">digital journey.</span>
            </h2>
            <p className="text-[#666666] font-medium leading-relaxed mb-10 text-sm">
              Experience the unified workspace designed to elevate your client servicing, streamline daily operations, and provide clear insights into your professional growth.
            </p>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 group">
                 <div className="w-12 h-12 rounded-2xl bg-[#FFF6D6] flex items-center justify-center shrink-0 shadow-sm border border-[#FFC72C]/20 group-hover:scale-105 transition-transform text-[#A3843B]">✨</div>
                 <div>
                   <span className="text-sm font-bold text-[#111111] block mb-0.5">Smart Client Syncing</span>
                   <span className="text-xs text-[#666666]">Automated updates across your book of business.</span>
                 </div>
              </div>
              <div className="flex items-center gap-4 group">
                 <div className="w-12 h-12 rounded-2xl bg-[#FFF6D6] flex items-center justify-center shrink-0 shadow-sm border border-[#FFC72C]/20 group-hover:scale-105 transition-transform text-[#A3843B]">📄</div>
                 <div>
                   <span className="text-sm font-bold text-[#111111] block mb-0.5">Automated PDF Generation</span>
                   <span className="text-xs text-[#666666]">Instantly populate official service forms.</span>
                 </div>
              </div>
              <div className="flex items-center gap-4 group">
                 <div className="w-12 h-12 rounded-2xl bg-[#FFF6D6] flex items-center justify-center shrink-0 shadow-sm border border-[#FFC72C]/20 group-hover:scale-105 transition-transform text-[#A3843B]">📊</div>
                 <div>
                   <span className="text-sm font-bold text-[#111111] block mb-0.5">Real-time Tracking</span>
                   <span className="text-xs text-[#666666]">Monitor your metrics as they happen.</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Form Side */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center relative px-6 sm:px-16 xl:px-24 py-12 order-1 lg:order-2">
        {/* Back Link */}
        <div className="absolute top-8 left-6 sm:left-16 xl:left-24">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={14} className="text-slate-400" />
            Back to Home
          </a>
        </div>

        <div className="w-full max-w-sm mx-auto mt-8">
          {/* Branding header */}
          <div className="flex flex-col items-start text-left mb-10">
            <div className="mb-6 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 inline-block">
              <Image
                src="/Image/icon/new_logo.png"
                alt="Team Padua Logo"
                width={40}
                height={40}
                priority
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1B1B1B] dark:text-white mb-2">
              Create an account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Start your journey with the new advisor portal.
            </p>
          </div>

          {/* Auth form component */}
          <React.Suspense fallback={<div className="text-center py-6 text-xs text-slate-400 font-medium">Loading form…</div>}>
            <AuthForm action={SignUp} mode="register" />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
