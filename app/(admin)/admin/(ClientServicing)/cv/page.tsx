'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Layers,
  Award,
  Send,
  Zap,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Clock,
  Palette
} from 'lucide-react';
import { AdminHeader, AdminSidebar } from '@src/components/layout';

export default function CVPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const cpcPublicUrl = 'https://team-padua-client-policy-card.vercel.app/';
  const cpcDashboardUrl = 'https://team-padua-client-policy-card.vercel.app/dashboard';

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] dark:bg-[#0E1117] text-foreground font-sans antialiased">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 md:p-8 lg:p-12 w-full max-w-[1440px] mx-auto space-y-12">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold">Client Servicing</span>
            <ChevronRight size={14} />
            <span className="text-primary font-bold">Client Policy Cards</span>
            <span className="ml-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Platform Preview
            </span>
          </div>

          {/* Hero Section with Clean Grid Background */}
          <div className="relative rounded-[36px] bg-card border border-border/80 p-8 sm:p-12 lg:p-16 shadow-xs overflow-hidden">
            {/* Subtle Grid Pattern */}
            <div
              className="absolute inset-0 opacity-[0.035] dark:opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                backgroundSize: '36px 36px',
              }}
            />
            {/* Soft Warm Glow */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#F4C542]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-8">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wider uppercase">
                <Sparkles size={14} className="text-amber-500 animate-pulse" />
                <span>Team Padua Client Servicing</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-black tracking-tight leading-[1.12] text-foreground">
                  Elevate Client Trust with <br />
                  <span className="text-[#D97706] dark:text-[#F4C542]">
                    Client Policy Cards
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed max-w-2xl">
                  A standalone digital servicing platform for Sun Life Advisors. Provide your policyholders with a beautifully designed, high-impact summary of their insurance coverage, premiums, and key policy dates.
                </p>
              </div>

              {/* Rounded Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={cpcPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#EAA100] hover:bg-[#D99300] text-black font-extrabold text-sm sm:text-base shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <span>Request Policy Card</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </a>

                <a
                  href={cpcDashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-card hover:bg-surface-2 text-foreground border border-border font-bold text-sm sm:text-base shadow-xs hover:border-border/80 active:scale-[0.98] transition-all duration-200"
                >
                  <span>Advisor Workspace</span>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-muted-foreground border-t border-border/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-500" />
                  <span>Instant Policy Summaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-500" />
                  <span>Advisor Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-amber-500" />
                  <span>Digital & Mobile Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Humanized Feature Overview Cards */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Designed for Modern Policyholder Care
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Everything you need to deliver memorable, professional servicing touchpoints.
                </p>
              </div>

              <a
                href={cpcDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <span>Explore Advisor Tools</span>
                <ArrowRight size={14} />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-card border border-border/80 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-amber-500/40 transition duration-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <HeartHandshake size={24} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Strengthen Client Relationships
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Give clients a clear, readable digital snapshot of what their plans protect. No complicated jargon—just pure peace of mind.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    High-Touch Servicing
                  </span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-card border border-border/80 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-amber-500/40 transition duration-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Branded Advisor Presentation
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Each card showcases your personal advisor credentials, profile, and direct contact avenues for quick client inquiries.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Personalized Identity
                  </span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-card border border-border/80 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-amber-500/40 transition duration-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <Send size={24} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Frictionless 1-Click Sharing
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Share directly via Viber, WhatsApp, Messenger, or Email. Clients can easily save it on their smartphones anytime.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <span className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                    Omnichannel Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Launch Bottom Strip */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-foreground">
                Ready to generate a Client Policy Card?
              </h3>
              <p className="text-xs text-muted-foreground">
                Open the standalone tool and craft your policyholder cards in seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={cpcPublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-[#EAA100] hover:bg-[#D99300] text-black font-extrabold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2"
              >
                <span>Request Policy Card</span>
                <ArrowRight size={15} />
              </a>

              <a
                href={cpcDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full bg-card hover:bg-surface-2 text-foreground border border-border font-bold text-xs shadow-xs transition"
              >
                <span>Advisor Workspace</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
