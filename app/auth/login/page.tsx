import React from "react";
import Image from "next/image";
import { AuthForm } from "../AuthForm";
import { SignIn } from "../../action/auth";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@src/lib/supabase/server";
import ProfileAvatar from "@src/components/shared/ProfileAvatar";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url");

  // Find profiles specifically for Daniel, John, and William
  const displayProfiles = allProfiles
    ? allProfiles.filter(p => {
        const name = p.full_name?.toLowerCase() || "";
        return name.includes("daniel") || name.includes("john") || name.includes("william");
      }).slice(0, 3)
    : [];

  return (
    <div className="min-h-screen w-full flex bg-[#F8F9FA] dark:bg-slate-950">
      {/* Left Form Side */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center relative px-6 sm:px-16 xl:px-24 py-12">
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
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Sign in to your advisor workspace to continue.
            </p>
          </div>

          {/* Auth form component */}
          <React.Suspense fallback={<div className="text-center py-6 text-xs text-slate-400 font-medium">Loading form…</div>}>
            <AuthForm action={SignIn} mode="login" />
          </React.Suspense>
        </div>
      </div>

      {/* Right Visual Side */}
      <div className="hidden lg:flex w-[55%] relative bg-[#1B1B1B] items-center justify-center overflow-hidden p-12">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FFC72C] opacity-20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#A3843B] opacity-20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-xl">
          <div className="border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[32px] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFC72C]/20 blur-2xl rounded-full pointer-events-none" />
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-[1.15]">
              Empowering advisors<br/>with smarter operations.
            </h2>
            <p className="text-slate-300 font-medium leading-relaxed mb-10 text-sm">
              The Team Padua portal integrates client servicing, daily tracking, and organizational metrics into a single, unified workspace. Built exclusively for our Business Development Team.
            </p>
            <div className="flex items-center gap-4">
               {displayProfiles.length > 0 && (
                 <div className="flex -space-x-3">
                    {displayProfiles.map((p, i) => (
                      <div key={p.id} className="w-10 h-10 rounded-full border-2 border-[#1B1B1B] bg-slate-800 overflow-hidden relative" style={{ zIndex: 10 - i }}>
                        <ProfileAvatar avatarUrl={p.avatar_url} name={p.full_name || 'Advisor'} size={40} className="w-full h-full opacity-80 mix-blend-luminosity !ring-0 !shadow-none" />
                      </div>
                    ))}
                 </div>
               )}
               <div className="text-xs text-slate-400 font-medium">
                 Join the <span className="text-white font-bold">Team Padua</span> advisor community
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
