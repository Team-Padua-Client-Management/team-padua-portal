'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight, Bell, Calendar, CheckCircle2, ChevronDown, ClipboardList,
  FileText, MessageSquareText, ShieldCheck, Sparkles, Users, Wallet,
  Clock, FileCheck2, CalendarCheck, RefreshCw, FolderLock, Sun, Moon,
  Target, Award, Star, Activity, ArrowUpRight, Code2, Database, Layout, 
  Smartphone, Cpu, Zap, Mail, ArrowRightLeft, UserCheck, HeartHandshake,
  TrendingUp, Award as AwardIcon, Check, Plus, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Why This Portal Exists Cards
const whyExistsCards = [
  {
    title: 'Organized Client Records',
    desc: 'Consolidate all client profiles, policy details, and historical logs into a single, unified database.',
    icon: ShieldCheck,
    color: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
  },
  {
    title: 'Policy Servicing',
    desc: 'Accelerate changes for realignments, beneficiaries, fund switching, and withdrawals with digitized workflows.',
    icon: FileCheck2,
    color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Daily Advisor Workflow',
    desc: 'Stay on top of deadlines, tasks, and follow-ups with intelligent calendars and real-time operational alerts.',
    icon: ClipboardList,
    color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500'
  },
  {
    title: 'Meaningful Client Engagement',
    desc: 'Strengthen long-term relationships through birthday tracking, automated greetings, and personalized touchpoints.',
    icon: HeartHandshake,
    color: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
  }
];

// Ecosystem Modules
const ecosystemGroups = [
  {
    title: 'Client Records',
    desc: 'The foundation of advisory relationships.',
    modules: ['Client Profiles', 'Client Policy Cards', 'Documents'],
    icon: Users,
    gradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-950/30 dark:to-indigo-950/30'
  },
  {
    title: 'Policy Servicing',
    desc: 'Operational request fulfillment.',
    modules: ['Advisor Change Request', 'Beneficiary Change Request', 'Fund Switching', 'Fund Withdrawal', 'Auto Charge Arrangement', 'Reinstatement'],
    icon: FileText,
    gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-950/30 dark:to-orange-950/30'
  },
  {
    title: 'Premium Management',
    desc: 'Financial tracking and monitoring.',
    modules: ['Premium Updates', 'Payment Monitoring'],
    icon: Wallet,
    gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30'
  },
  {
    title: 'Client Engagement',
    desc: 'Strengthening advisor presence.',
    modules: ['Birthday Greetings', 'Welcome Notes', 'Client Communications'],
    icon: MessageSquareText,
    gradient: 'from-rose-500/10 to-pink-500/10 dark:from-rose-950/30 dark:to-pink-950/30'
  },
  {
    title: 'Advisor Productivity',
    desc: 'Optimal time and task management.',
    modules: ['Calendar', 'Tasks', 'Notifications', 'Reports'],
    icon: Activity,
    gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-950/30 dark:to-purple-950/30'
  }
];

// Advisor Workflow Steps
const workflowSteps = [
  { step: '01', title: 'Client Registration', desc: 'Securely onboard client demographics, contact data, and initial policy alignments.' },
  { step: '02', title: 'Policy Management', desc: 'Map active policies, premiums, payment modes, and financial dates.' },
  { step: '03', title: 'Client Servicing', desc: 'Submit and track service requests (ACR, BCR, fund switches) in real time.' },
  { step: '04', title: 'Follow-ups', desc: 'Manage automated reminders for premium due dates, birthdays, and anniversaries.' },
  { step: '05', title: 'Relationship Building', desc: 'Leverage communication templates and dashboard touchpoints to retain client trust.' },
  { step: '06', title: 'Long-term Support', desc: 'Analyze data reports to track performance, growth, and team production goals.' }
];

// Leadership Cohort
const leadershipMembers = [
  {
    name: 'Daniel Padua',
    role: 'Founder & Business Development Lead',
    bio: 'Provides strategic direction, advisor development, business growth, client servicing leadership, and operational excellence.',
    image: '/Image/padua.jpg',
    responsibility: 'Strategic Direction & Team Strategy'
  },
  {
    name: 'Triwynn Branzuela',
    role: 'Senior Team Mentor',
    bio: 'Supports advisor development, mentoring, operations, and quality client servicing.',
    image: '/Image/triwynn.jpg',
    responsibility: 'Mentorship & Operational Coaching'
  },
  {
    name: 'Isabel Francisco',
    role: 'Senior Team Coordinator',
    bio: 'Leads recruitment coordination, intern onboarding, administrative support, and team development.',
    image: '/Image/isabel.png',
    responsibility: 'Operations & Recruitment Sync'
  }
];

// Internship Teams
const internDepartments = [
  {
    name: 'Advisor Support Associates',
    role: 'Operational Optimization',
    desc: 'Facilitates day-to-day administrative support for financial advisors. They ensure service requests, documents, and client inquiries are processed efficiently to maintain continuous workflow support.',
    contributes: 'Minimizes advisor friction by organizing tasks and validating policy inputs.'
  },
  {
    name: 'Business Support Associates',
    role: 'Strategic Coordination',
    desc: 'Focuses on team-wide logistics, intern onboarding, meeting management, and internal operational analytics. They coordinate schedules and track overall business unit performance indicators.',
    contributes: 'Keeps Team Padua organized, synchronized, and operational metrics transparent.'
  },
  {
    name: 'Client Relations Associates',
    role: 'Communications & Engagement',
    desc: 'Cultivates advisor-client touchpoints. They manage birthday logs, update communications lists, and construct welcome notes to reinforce personalized client experiences.',
    contributes: 'Enhances client retention rates by creating organized, warm client touchpoints.'
  },
  {
    name: 'Design & Content Associates',
    role: 'Visual Communication',
    desc: 'Owns the visual layout of presentations, training collaterals, and digital communications templates. They maintain brand guidelines and design user-centric materials.',
    contributes: 'Establishes a premium visual identity for Team Padua Business Development.'
  }
];

// Bento Features
const bentoFeatures = [
  { title: 'Client Management', desc: 'Secure profile mapping and complete lifecycle tracking.', size: 'col-span-1 md:col-span-2' },
  { title: 'Policy Servicing', desc: 'ACR, BCR, and fund requests processed digitally.', size: 'col-span-1' },
  { title: 'Premium Monitoring', desc: 'Track payment status, modes, and updates.', size: 'col-span-1' },
  { title: 'Birthday Module', desc: 'Proactive greetings and engagement tracker.', size: 'col-span-1 md:col-span-2' },
  { title: 'Tasks & Calendars', desc: 'Optimize daily schedules with smart priorities.', size: 'col-span-1' },
  { title: 'Notifications', desc: 'Real-time feedback on policy steps and operations.', size: 'col-span-1' },
  { title: 'Communications', desc: 'Templates and logs for standard client servicing.', size: 'col-span-1 md:col-span-2' },
  { title: 'Reports & Analytics', desc: 'Comprehensive overview of policy details.', size: 'col-span-1' }
];

// FAQs
const faqs = [
  {
    question: 'What is the primary purpose of the Team Padua Advisor Portal?',
    answer: 'The portal is a private, secure client servicing workspace built to centralize client policy cards, premium updates, and administrative change workflows for Sun Life Financial Advisors operating under Team Padua Business Development.'
  },
  {
    question: 'Who developed the platform and how is it maintained?',
    answer: 'The system was designed and developed by John Renz Bandianon, Advisor Support Associate Intern, under the leadership and strategy of Team Padua.'
  },
  {
    question: 'How do advisors request access to the workspace?',
    answer: 'Access is limited strictly to authorized Sun Life Financial Advisors affiliated with Team Padua. Eligible advisors can sign in using their registered internal accounts. For new account setups, contact Isabel Francisco (Senior Team Coordinator).'
  },
  {
    question: 'Is client information secure on this platform?',
    answer: 'Yes. The portal integrates enterprise security policies and strict access authorization rules to ensure client policy records and advisor workflows remain protected and confidential.'
  }
];

// Interactive Preview Screens
const previewScreens = {
  Dashboard: {
    title: 'Advisory Overview',
    subtitle: 'High-level workflow summary',
    widget: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFF9EC] dark:bg-slate-900 border border-[#FFC72C]/20 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Active Policies</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">Active Status</span>
          </div>
          <div className="bg-[#FFF9EC] dark:bg-slate-900 border border-[#FFC72C]/20 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Pending ACR</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">In Progress</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-2">Today's Focus</span>
          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="w-2 h-2 rounded-full bg-[#FFC72C] animate-pulse" />
            <span>Review premium change requests</span>
          </div>
        </div>
      </div>
    )
  },
  'Client Profiles': {
    title: 'Client Database',
    subtitle: 'Comprehensive client records',
    widget: (
      <div className="space-y-2">
        {['Maria Santos', 'Juan Dela Cruz'].map((name, i) => (
          <div key={name} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFF9EC] dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-[#A3843B] dark:text-[#FFC72C]">
                {name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{name}</p>
                <p className="text-[10px] text-zinc-500">Sun Life Maxilink Prime</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Active</span>
          </div>
        ))}
      </div>
    )
  },
  Calendar: {
    title: 'Operational Schedule',
    subtitle: 'Meetings & follow-up calendar',
    widget: (
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
          <span>July 2026</span>
          <span className="text-[#FFC72C]">Advisor Sync</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`p-1 rounded-md ${i === 8 ? 'bg-[#FFC72C] text-slate-950 font-bold' : ''}`}>
              {i + 12}
            </span>
          ))}
        </div>
      </div>
    )
  },
  Tasks: {
    title: 'Task Management',
    subtitle: 'Daily operations checklist',
    widget: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-emerald-500">✓</div>
          <span className="line-through text-slate-400">Onboard new advisor associate</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="w-4 h-4 rounded border border-[#FFC72C]" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Process beneficiary updates for Dela Cruz</span>
        </div>
      </div>
    )
  },
  'Client Servicing': {
    title: 'Ecosystem Requests',
    subtitle: 'ACR, BCR & withdrawal workflow',
    widget: (
      <div className="space-y-2">
        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="font-bold text-blue-600 dark:text-blue-400">Advisor Change Request</span>
            <span className="text-zinc-500">2h ago</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Submitted to Business Ops</p>
        </div>
      </div>
    )
  },
  'Premium Monitoring': {
    title: 'Financial Tracking',
    subtitle: 'Payment monitoring',
    widget: (
      <div className="space-y-2">
        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">Monthly Grace Period</p>
            <p className="text-[10px] text-zinc-500">Ending in 5 days</p>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">Critical</span>
        </div>
      </div>
    )
  },
  'Birthday Module': {
    title: 'Engagement Proactivity',
    subtitle: 'Upcoming client birthdays',
    widget: (
      <div className="p-3 bg-[#FFF9EC] dark:bg-slate-900 border border-[#FFC72C]/20 rounded-2xl">
        <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
          🎂 Upcoming Birthdays
        </p>
        <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1">
          Send personalized greetings to 3 clients celebrating this week.
        </p>
      </div>
    )
  },
  Notifications: {
    title: 'System Alerts',
    subtitle: 'Real-time portal logs',
    widget: (
      <div className="space-y-2">
        <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs flex gap-2">
          <Bell size={14} className="text-[#FFC72C] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">System Update Complete</p>
            <p className="text-[10px] text-zinc-500">Database changes synced successfully.</p>
          </div>
        </div>
      </div>
    )
  }
};

type ScreenName = keyof typeof previewScreens;

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<ScreenName>('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setIsDark(theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const nextTheme = nextDark ? 'dark' : 'light';
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: nextTheme } }));
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#FFFFFF] dark:bg-[#0B0C10] text-[#1B1B1B] dark:text-[#F3F4F6] font-sans selection:bg-[#FFC72C]/30 overflow-x-hidden relative">
      
      {/* Dynamic Luxury Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-400/10 dark:bg-amber-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#FFC72C]/5 dark:bg-blue-600/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-amber-300/5 dark:bg-emerald-600/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Floating Glassmorphic Header */}
      <header className="fixed top-4 inset-x-0 mx-auto z-50 max-w-7xl px-4 lg:px-8 transition-all duration-300">
        <div className="rounded-full border border-slate-200/50 dark:border-slate-800/50 bg-[#FFFFFF]/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-md flex items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFC72C] blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
              <Image src="/Image/icon/TPC.png" alt="Team Padua Logo" width={32} height={32} className="relative object-contain" priority />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.15em] text-[#1B1B1B] dark:text-white leading-tight">TEAMPADUA</p>
              <p className="text-[9px] uppercase font-bold text-[#A3843B] dark:text-[#FFC72C] tracking-widest">Advisor Portal</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <a href="#overview" className="hover:text-[#1B1B1B] dark:hover:text-white transition">Overview</a>
            <a href="#ecosystem" className="hover:text-[#1B1B1B] dark:hover:text-white transition">Client Servicing</a>
            <a href="#about" className="hover:text-[#1B1B1B] dark:hover:text-white transition">Team Padua</a>
            <a href="#preview" className="hover:text-[#1B1B1B] dark:hover:text-white transition">Portal Preview</a>
            <a href="#faq" className="hover:text-[#1B1B1B] dark:hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            
            <a
              href="/auth/login"
              className="hidden sm:inline-flex relative overflow-hidden rounded-full bg-slate-950 dark:bg-[#FFC72C] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:text-slate-950 transition hover:scale-105 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Access Portal
            </a>

            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-[#FFFFFF] dark:bg-slate-950 p-6 shadow-xl flex flex-col gap-4 lg:hidden"
            >
              <a href="#overview" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition">Overview</a>
              <a href="#ecosystem" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition">Client Servicing</a>
              <a href="#about" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition">Team Padua</a>
              <a href="#preview" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition">Portal Preview</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition">FAQ</a>
              <hr className="border-slate-100 dark:border-slate-900" />
              <a
                href="/auth/login"
                className="w-full text-center rounded-full bg-slate-950 dark:bg-[#FFC72C] py-3 text-xs font-bold uppercase tracking-wider text-white dark:text-slate-950"
              >
                Access Portal
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 pt-32 space-y-32">
        
        {/* SECTION 1: HERO SECTION */}
        <section id="overview" className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-8 lg:pt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#FFC72C]/30 bg-[#FFF9EC] dark:bg-slate-950 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#A3843B] dark:text-[#FFC72C]"
            >
              <Sparkles size={14} />
              Internal Business Platform
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-950 dark:text-white leading-[1.1]"
            >
              Team Padua <br />
              <span className="text-[#FFC72C]">Advisor Portal</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base text-slate-600 dark:text-slate-400 font-semibold"
            >
              A centralized client management and servicing workspace built exclusively for Sun Life Financial Advisors under Team Padua Business Development.
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed"
            >
              Organize client relationships, policy servicing, premium monitoring, advisor workflows, communications, and daily operations from one secure platform.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <a
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFC72C] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]"
              >
                Access Portal
                <ArrowRight size={14} />
              </a>
              <a
                href="#exists"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-950 hover:bg-[#FFF9EC] dark:hover:bg-slate-900 px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Learn More
              </a>
            </motion.div>
          </div>

          {/* Right Side: Elegant Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-6 bg-[#FFF9EC] dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[32px] shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#FFC72C]" />
            <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Secure Dashboard Preview</span>
            </div>
            
            <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Active Servicing Log</h4>
                  <p className="text-[9px] text-zinc-500">Operations monitor</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Advisor Tasks</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Pending Sync</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Ecosystem Health</span>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Optimal</p>
                </div>
              </div>

              <div className="border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Recent Requests</span>
                <div className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-800 dark:text-white">Advisor Reassignment</span>
                  <span className="text-[8px] font-bold bg-[#FFF9EC] text-[#A3843B] px-1.5 py-0.5 rounded">ACR</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION 2: WHY THIS PORTAL EXISTS */}
        <section id="exists" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 bg-[#FFF9EC]/50 dark:bg-slate-950/20 rounded-[40px] border border-[#FFC72C]/10 py-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Purpose</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Built to Support Better Client Relationships
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              The Team Padua Advisor Portal was created to simplify advisor workflows, reduce administrative work, organize client servicing, improve communication, and strengthen long-term client relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {whyExistsCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-[#FFFFFF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.color}`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">{card.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: CLIENT SERVICING ECOSYSTEM */}
        <section id="ecosystem" className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Workspace Capabilities</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Client Servicing Ecosystem
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A comprehensive system of client modules designed to unify data, streamline processes, and maintain continuous operational efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {ecosystemGroups.map((group, idx) => {
              const Icon = group.icon;
              return (
                <motion.div
                  key={group.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-[#FFFFFF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 hover:border-[#FFC72C] transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF9EC] dark:bg-slate-950 border border-[#FFC72C]/20 flex items-center justify-center text-[#A3843B] dark:text-[#FFC72C]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 dark:text-white">{group.title}</h3>
                        <p className="text-[10px] text-zinc-500">{group.desc}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mt-4">
                      {group.modules.map(mod => (
                        <li key={mod} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FFC72C]" />
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: HOW ADVISORS USE THE PORTAL */}
        <section className="bg-[#FFF9EC] dark:bg-slate-950/40 border-y border-slate-200/50 dark:border-slate-800/50 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Workflow</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                How Advisors Use The Portal
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                A structured path that maps out the complete operational life cycle of servicing a client.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mt-16 relative">
              {workflowSteps.map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="bg-[#FFFFFF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl relative flex flex-col justify-between"
                >
                  <div>
                    <span className="text-3xl font-serif text-[#FFC72C] font-semibold block mb-3">{item.step}</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: ABOUT TEAM PADUA */}
        <section id="about" className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">The Organization</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Meet Team Padua Business Development
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Team Padua is a Business Development Team under Sun Life Philippines dedicated to supporting financial advisors through operational excellence, client servicing, mentorship, recruitment, digital innovation, and continuous professional development.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
              By combining specialized knowledge and technological advancement, we strive to build a workspace that empowers advisors to maximize client outcomes, coordinate mentorship programs, and nurture incoming talent.
            </p>
          </div>
          <div className="lg:col-span-5 relative rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm aspect-video">
            <Image 
              src="/Image/team_alignment.png" 
              alt="Team Padua Alignment" 
              fill 
              className="object-cover filter grayscale hover:grayscale-0 transition-all duration-700" 
            />
          </div>
        </section>

        {/* SECTION 6: LEADERSHIP TEAM */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Leadership Cohort</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              The Leadership Team
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Steering operational strategies and mentoring advisors for client success.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-16">
            {leadershipMembers.map((member, idx) => (
              <motion.div 
                key={member.name}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="group flex flex-col items-center p-8 bg-[#FFFFFF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[#FFC72C] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md relative z-10 filter grayscale group-hover:grayscale-0 transition-all duration-500" 
                  />
                </div>
                
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">{member.name}</h3>
                <p className="text-[10px] text-[#A3843B] dark:text-[#FFC72C] font-bold mt-1.5 uppercase tracking-widest">{member.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed mt-4 px-2">{member.bio}</p>
                
                <div className="mt-6 py-1.5 px-3 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                  {member.responsibility}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 7: BUSINESS DEVELOPMENT INTERNSHIP TEAM */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Internship cohort</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Business Development Internship Team
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The departments and roles driving operational, communications, and technical innovations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            {internDepartments.map((dept, idx) => (
              <motion.div 
                key={dept.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#FFFFFF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 dark:text-white">{dept.name}</h3>
                    <span className="text-[9px] font-mono bg-[#FFF9EC] dark:bg-slate-950 text-[#A3843B] dark:text-[#FFC72C] px-2 py-0.5 rounded uppercase font-bold">{dept.role}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{dept.desc}</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-4 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Contribution: </span>
                  {dept.contributes}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 8: SYSTEM DEVELOPMENT */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#FFF9EC]/40 dark:bg-slate-900/30 border border-[#FFC72C]/10 rounded-[32px] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A3843B] dark:text-[#FFC72C]">
                <Code2 size={16} />
                Portal Architect
              </div>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white leading-tight">
                John Renz Bandianon
              </h2>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">
                Advisor Support Associate Intern
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Designed and developed the Team Padua Advisor Portal to modernize client servicing operations through digital transformation.
              </p>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Responsibilities</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Workspace Design', 'Client Management Alignment', 'Workflow Automation', 'Operations Support', 
                    'Dashboard Layout', 'User Experience Optimization', 'Client Servicing Coordination', 'Operational Security Integration'
                  ].map(tech => (
                    <span key={tech} className="text-[10px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Developer Workspace Illustration (HTML Mockup) */}
            {/* Visual Ecosystem Architecture Mockup */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[24px] shadow-sm relative min-h-[300px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Workspace Operations Sync</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase">Active Sync</span>
              </div>
              
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {/* Node 1: Advisor Action */}
                <div className="flex items-center gap-3 p-3 bg-[#FFF9EC] dark:bg-slate-950 border border-[#FFC72C]/20 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC72C]/20 text-[#A3843B] dark:text-[#FFC72C] flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Advisor Servicing Dashboard</h4>
                    <p className="text-[9px] text-zinc-500">Client requests, notifications, and task tracker</p>
                  </div>
                </div>

                {/* Connection Line */}
                <div className="flex justify-center my-0.5">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-[#FFC72C] to-emerald-500" />
                </div>

                {/* Node 2: Centralized Registry */}
                <div className="flex items-center gap-3 p-3 bg-[#E8F8F0] dark:bg-slate-950 border border-emerald-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Database size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Centralized Client Registry</h4>
                    <p className="text-[9px] text-zinc-500">Client profiles, policy summaries, and transaction records</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex justify-between items-center text-[9px] text-zinc-400 uppercase font-semibold">
                <span>Authorized Operational Sync</span>
                <span>Team Padua Portal</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION 9: PORTAL FEATURES */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Capabilities</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Portal Features Bento Layout
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Explore the individual capabilities integrated into the Team Padua internal ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {bentoFeatures.map((feat, i) => (
              <motion.div 
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`bg-[#FFFFFF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl hover:border-[#FFC72C] transition-all duration-300 ${feat.size} flex flex-col justify-between`}
              >
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <ArrowUpRight size={14} className="text-[#FFC72C]" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 10: PORTAL PREVIEW */}
        <section id="preview" className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">Mockup</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Interactive Portal Preview
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click the sidebar buttons to preview each segment of the Team Padua Advisor Portal interface.
            </p>
          </div>

          <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-[32px] bg-[#FFF9EC] dark:bg-slate-950/40 p-4 md:p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Interactive Sidebar */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2 block">Portal Navigation</span>
              {(Object.keys(previewScreens) as ScreenName[]).map(screen => (
                <button
                  key={screen}
                  onClick={() => setSelectedScreen(screen)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    selectedScreen === screen 
                      ? 'bg-[#FFC72C] text-slate-950 font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  <span>{screen}</span>
                  <ChevronDown size={12} className={`opacity-60 transition-transform ${selectedScreen === screen ? '-rotate-90' : ''}`} />
                </button>
              ))}
            </div>

            {/* Display Screen */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[280px]">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-slate-950 dark:text-white">
                  {previewScreens[selectedScreen].title}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold">
                  {previewScreens[selectedScreen].subtitle}
                </p>
                <div className="mt-6">
                  {previewScreens[selectedScreen].widget}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-6 flex justify-between items-center text-[9px] text-zinc-400 uppercase font-mono">
                <span>Workspace Preview Active</span>
                <span>Authorized Access Only</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11: FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B] dark:text-[#FFC72C]">FAQ</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Questions & Answers
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Common inquiries regarding access permissions, database security, and capabilities.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={faq.question} className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-[#FFFFFF] dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300">
                  <button
                    className="flex w-full items-center justify-between p-6 text-left cursor-pointer group"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-slate-100 group-hover:text-[#A3843B] dark:group-hover:text-[#FFC72C] transition-colors">{faq.question}</span>
                    <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[#FFC72C]/10 dark:bg-[#FFC72C]/10 text-[#A3843B] dark:text-[#FFC72C]' : 'text-slate-400'}`}>
                      <ChevronDown size={12} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 pt-0 text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-100/50 dark:border-slate-800/20 pt-4 mt-1">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 12: CALL TO ACTION */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
          <div className="bg-[#FFF9EC] dark:bg-slate-900/40 border border-[#FFC72C]/30 dark:border-slate-800/60 rounded-[32px] p-8 md:p-16 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC72C]" />
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl text-slate-950 dark:text-white">
              Ready to Support Your Clients Better?
            </h2>
            <p className="max-w-xl mx-auto text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Access the Team Padua Advisor Portal and manage every stage of your client servicing journey from one secure workspace.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <a
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFC72C] hover:bg-[#d8ad2d] px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md transition-all hover:scale-[1.02]"
              >
                Access Portal
              </a>
              <a
                href="mailto:contact@teampadua.com"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-950 hover:bg-[#FFF9EC] dark:hover:bg-slate-900 px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white transition-colors"
              >
                Contact Team Padua
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-slate-200/50 dark:border-slate-800/50 bg-[#FFFFFF] dark:bg-[#07080A] overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFC72C]/5 blur-[120px] rounded-t-full pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
              <Image src="/Image/icon/TPC.png" alt="Team Padua Logo" width={24} height={24} className="grayscale" />
              <div className="text-left">
                <p className="text-xs font-extrabold tracking-widest text-slate-900 dark:text-white">TEAMPADUA</p>
                <p className="text-[9px] font-semibold text-zinc-500 uppercase">Business Development Team — Sun Life Philippines</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-semibold">Built and Developed by</p>
              <p className="text-xs font-bold text-slate-800 dark:text-white">John Renz Bandianon</p>
              <p className="text-[9px] text-[#A3843B] dark:text-[#FFC72C] font-semibold uppercase tracking-wider">Advisor Support Associate</p>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-900/60" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">
            <p>© {new Date().getFullYear()} TeamPadua. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">Privacy Policy</a>
              <a href="/terms" className="hover:text-slate-900 dark:hover:text-white transition">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
