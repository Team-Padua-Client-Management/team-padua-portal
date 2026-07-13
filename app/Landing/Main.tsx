'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

type Stats = {
  activeClients: number;
  activePolicies: number;
  pendingRequests: number;
  todaysFollowUps: number;
  upcomingBirthdays: number;
};

const stats = [
  { label: 'Active Clients', key: 'activeClients', detail: 'Client profiles currently managed' },
  { label: 'Active Policies', key: 'activePolicies', detail: 'Policies under advisor servicing' },
  { label: 'Pending Service Requests', key: 'pendingRequests', detail: 'Client requests waiting for processing' },
  { label: 'Today\'s Follow-ups', key: 'todaysFollowUps', detail: 'Scheduled client follow-up activities' },
  { label: 'Upcoming Birthdays', key: 'upcomingBirthdays', detail: 'Clients with birthdays in the next 30 days' },
];

const features = [
  {
    title: 'Advisor Change Requests (ACR)',
    description: 'Manage client information updates, policy amendments, beneficiary changes, and servicing requests.',
    icon: FileText,
  },
  {
    title: 'Fund Switching Tasks (FST)',
    description: 'Track and process investment fund switching requests for VUL policyholders.',
    icon: Wallet,
  },
  {
    title: 'Client Policy Cards (CPC)',
    description: 'Instant access to policy summaries, premium information, coverage details, and servicing history.',
    icon: ShieldCheck,
  },
  {
    title: 'Premium Payment Updates (PPU)',
    description: 'Monitor premium due dates, payment status, grace periods, and payment reminders.',
    icon: CheckCircle2,
  },
  {
    title: 'Client Communications',
    description: 'Manage email and messenger follow-ups, announcements, reminders, and scheduled greetings.',
    icon: MessageSquareText,
  },
  {
    title: 'Birthday Management',
    description: 'Track client birthdays, send automated greetings, and strengthen long-term relationships.',
    icon: CalendarDays,
  },
];

const workflow = ['Advisor Login', 'Select Client', 'Process Service Request', 'Update Client Record', 'Notify Client', 'Complete Transaction'];

const previewCards = [
  { title: 'Dashboard', description: 'Client portfolio overview and servicing alerts' },
  { title: 'Client Servicing', description: 'Track requests, updates, and follow-ups' },
  { title: 'Calendar', description: 'Appointments, birthdays, and scheduled tasks' },
  { title: 'Tasks', description: 'Daily advisor actions and pending items' },
  { title: 'Notifications', description: 'Important reminders and task updates' },
  { title: 'Client Profiles', description: 'Centralized client information and history' },
];

const faqs = [
  {
    question: 'What is Team Padua Client Management Portal?',
    answer: 'It is a centralized CRM workspace for Sun Life Financial Advisors to manage client servicing, track policy requests, organize daily tasks, and support long-term client relationships.',
  },
  {
    question: 'Who can access the system?',
    answer: 'The platform is designed for authorized Sun Life Financial Advisors and Advisor Support Associates managing client servicing workflows.',
  },
  {
    question: 'How are client records secured?',
    answer: 'Client and policy information is protected through secure authentication and role-based access controls within the portal.',
  },
  {
    question: 'What advisor servicing modules are available?',
    answer: 'The system supports ACR, FST, CPC, PPU, client communications, birthday management, and task coordination.',
  },
  {
    question: 'Can advisors monitor premium payments?',
    answer: 'Yes. Premium payment status, due dates, grace periods, and follow-up reminders are all visible in the platform.',
  },
  {
    question: 'Does the system support automated client greetings?',
    answer: 'Yes. Advisors can manage birthdays and send automated client greetings to strengthen relationship management.',
  },
];

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [liveStats, setLiveStats] = useState<Stats>({
    activeClients: 0,
    activePolicies: 0,
    pendingRequests: 0,
    todaysFollowUps: 0,
    upcomingBirthdays: 0,
  });

  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const [{ count: activeClients }, { count: activePolicies }, { count: pendingRequests }, { count: todayFollowUps }, { data: birthdayData }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('acr_requests').select('*', { count: 'exact', head: true }),
          supabase.from('calendar_events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0]),
          supabase.from('clients').select('birthdate'),
        ]);

        const today = new Date();
        const next30 = new Date(today);
        next30.setDate(next30.getDate() + 30);
        const birthdayCount = Array.isArray(birthdayData)
          ? birthdayData.filter((item: any) => {
              if (!item?.birthdate) return false;
              const birth = new Date(item.birthdate);
              if (Number.isNaN(birth.getTime())) return false;
              birth.setFullYear(today.getFullYear());
              if (birth < today) {
                birth.setFullYear(today.getFullYear() + 1);
              }
              return birth <= next30;
            }).length
          : 0;

        setLiveStats({
          activeClients: activeClients || 0,
          activePolicies: activePolicies || 0,
          pendingRequests: pendingRequests || 0,
          todaysFollowUps: todayFollowUps || 0,
          upcomingBirthdays: birthdayCount,
        });
      } catch (error) {
        console.error('Failed to load landing stats', error);
      }
    };

    fetchLandingStats();
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffdf7_0%,#ffffff_45%,#fff8dc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <Image src="/Image/icon/TPC.png" alt="Team Padua Logo" width={38} height={38} className="object-contain" priority />
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-slate-900">TEAMPADUA</p>
              <p className="text-xs text-slate-500">Sun Life Philippines</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">Features</a>
            <a href="#workflow" className="transition hover:text-slate-900">Workflow</a>
            <a href="#about" className="transition hover:text-slate-900">About</a>
            <a href="#preview" className="transition hover:text-slate-900">Preview</a>
            <a href="#faq" className="transition hover:text-slate-900">FAQ</a>
          </nav>

          <a href="/auth/login" className="rounded-full border border-[#F4C542]/40 bg-white px-4 py-2 text-sm font-semibold text-[#A3843B] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff9e5]">
            Access Portal
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#F4C542]/30 bg-[#FFFBEB] px-3 py-1.5 text-sm font-medium text-[#A3843B]">
              <Sparkles size={15} />
              Premium Advisor Client Servicing Platform
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Team Padua Client Management Portal
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              An intelligent workspace built for Sun Life Financial Advisors to efficiently manage clients, monitor policy servicing, organize daily advisor tasks, and deliver exceptional client support from one centralized platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/auth/login" className="inline-flex items-center gap-2 rounded-full border border-[#F4C542]/30 bg-white px-5 py-3 text-sm font-semibold text-[#A3843B] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff9e5]">
                Access Portal
                <ArrowRight size={16} />
              </a>
              <a href="#features" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F4C542]/40 hover:text-slate-900">
                Learn More
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(244,197,66,0.12),transparent_50%)]" />
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Advisor Command Center</p>
                    <p className="text-xs text-slate-500">Client servicing overview</p>
                  </div>
                  <div className="rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-semibold text-[#A3843B]">Live</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-[#A3843B]">
                      <Users size={16} />
                      <span className="text-sm font-semibold">Clients</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">248</p>
                    <p className="mt-1 text-sm text-slate-500">Active client portfolio</p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-[#A3843B]">
                      <ClipboardList size={16} />
                      <span className="text-sm font-semibold">Requests</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">14</p>
                    <p className="mt-1 text-sm text-slate-500">Pending servicing actions</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-slate-200 bg-linear-to-br from-white to-[#FFFBEB] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Today's Actions</p>
                      <p className="text-xs text-slate-500">Priority follow-ups and policy updates</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#A3843B]">
                      <BellRing size={15} />
                      9 tasks
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {['Policy review', 'Birthday greeting', 'Premium reminder', 'Fund switch follow-up'].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        <span>{item}</span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
          <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_15px_45px_rgba(15,23,42,0.05)] md:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[18px] bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{liveStats[item.key as keyof Stats]}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Advisor Servicing Modules</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Everything an advisor needs to manage client servicing in one place</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_15px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFFBEB] text-[#A3843B]">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Advisor Workflow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A simple path from client intake to complete servicing</h2>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {workflow.map((step, index) => (
                <React.Fragment key={step}>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A3843B]">Step {index + 1}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{step}</p>
                  </div>
                  {index < workflow.length - 1 && (
                    <ChevronRight className="hidden text-[#A3843B] lg:block" size={20} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-8 rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">About the System</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">About Team Padua Client Management Portal</h2>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-sm leading-8 text-slate-600">
              The Team Padua Client Management Portal is a centralized CRM platform developed to help Sun Life Financial Advisors manage client servicing more efficiently. It streamlines policy servicing requests, tracks advisor activities, automates reminders, organizes client records, and supports long-term relationship management.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">System Leadership</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Meet the leadership guiding advisor servicing</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Senior leaders who define the portal’s strategic direction, operational excellence, and advisor support.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="relative overflow-hidden bg-slate-100">
                <img src="/Image/padua.jpg" alt="Daniel Padua" className="h-56 w-full object-cover" />
              </div>
              <div className="space-y-3 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Founder & Operations Lead</p>
                <h3 className="text-2xl font-semibold text-slate-900">Daniel Padua</h3>
                <p className="text-sm leading-7 text-slate-600">Visionary leader responsible for business growth, mentorship, team development, and operational excellence.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="relative overflow-hidden bg-slate-100">
                <img src="https://tpclientportal.vercel.app/Image/triwynn.jpg" alt="Triwynn Branzuela" className="h-56 w-full object-cover" />
              </div>
              <div className="space-y-3 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Senior Leader</p>
                <h3 className="text-2xl font-semibold text-slate-900">Triwynn Branzuela</h3>
                <p className="text-sm font-semibold text-slate-700">Senior Team Mentor</p>
                <p className="text-sm leading-7 text-slate-600">Provides leadership guidance, operational support, and intern mentorship.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="relative overflow-hidden bg-slate-100">
                <img src="https://tpclientportal.vercel.app/Image/isabel.png" alt="Isabel Francisco" className="h-56 w-full object-cover" />
              </div>
              <div className="space-y-3 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Senior Leader</p>
                <h3 className="text-2xl font-semibold text-slate-900">Isabel Francisco</h3>
                <p className="text-sm font-semibold text-slate-700">Senior Team Coordinator</p>
                <p className="text-sm leading-7 text-slate-600">Supports recruitment, coordination, onboarding, and team development.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Development Team</p>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-[24px] bg-slate-100">
                <img src="/Image/icon/TPC.png" alt="John Renz Bandianon" className="h-full w-full object-cover" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">John Renz Bandianon</h2>
                <p className="mt-2 text-base font-semibold text-slate-700">Lead System Developer & Full Stack Programmer</p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Designed, developed, and maintains the Team Padua Client Management Portal including frontend, backend, database architecture, UI/UX, automation workflows, and advisor servicing modules.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="preview" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Dashboard Preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A refined workspace for advisors, clients, and servicing tasks</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {previewCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_15px_45px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFFBEB] text-[#A3843B]">
                  <ShieldCheck size={17} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Answers for advisors exploring the platform</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={faq.question} className="rounded-[20px] border border-slate-200 bg-slate-50">
                    <button className="flex w-full items-center justify-between px-5 py-4 text-left" onClick={() => setActiveFaq(isOpen ? null : index)}>
                      <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
                      <ChevronDown size={16} className={`text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fffdf7_0%,#ffffff_100%)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A3843B]">Ready to serve clients better?</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Ready to Manage Your Client Portfolio?</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">Access the Team Padua Client Management Portal to organize client servicing, monitor policy updates, manage daily advisor activities, and strengthen long-term client relationships.</p>
            </div>
            <div className="mt-8">
              <a href="/auth/login" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800">
                Sign In to Portal
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} TeamPadua. Built for Sun Life Team Padua.</p>
          <div className="flex gap-5">
            <a href="/privacy" className="transition hover:text-slate-900">Privacy Policy</a>
            <a href="/terms" className="transition hover:text-slate-900">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
