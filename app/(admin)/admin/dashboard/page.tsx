'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Users, ArrowUpRight, Wallet, Settings, FileSignature, Users2,
  ArrowLeftRight, CreditCard, Calculator, RotateCcw, ShieldCheck, Search,
  RefreshCw, Loader2, Clock, Layers, ClipboardList, FileText, UserCheck,
  Sunrise, Sun, Moon, FileStack, Radio, Boxes, Grid3x3
} from 'lucide-react';
import Link from 'next/link';
import Header from "@/app/components/admin/AdminHeader";
import Sidebar from "@/app/components/admin/AdminSidebar";
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/dashboard/page.module.css";
import WelcomeModal from "@/components/shared/WelcomeModal";

type KpiData = {
  members: number;
  cpst: number;
  acr: number;
  cpc: number;
  fst: number;
  mngt: number;
  ppu: number;
  attendance: number;
  announcements: number;
  designs: number;
  faqs: number;
};

type DayPeriod = 'morning' | 'afternoon' | 'evening';

type CsrForm = {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  href: string;
  accent: string;
  tint: string;
};

type CsrCategory = {
  label: string;
  forms: CsrForm[];
};

type Portal = {
  name: string;
  url: string;
  manage: string;
  mark?: string;
  logo?: string;
  logoDark?: string;
  img?: string;
};

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

function HeroDecoration({ period }: { period: DayPeriod }) {
  if (period === 'evening') {
    return (
      <svg className={styles.heroEveningStars} viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <g stroke="rgba(255,255,255,0.18)" strokeWidth="1">
          <line x1="40" y1="140" x2="110" y2="90" />
          <line x1="110" y1="90" x2="180" y2="120" />
          <line x1="180" y1="120" x2="250" y2="60" />
          <line x1="250" y1="60" x2="320" y2="100" />
          <line x1="180" y1="120" x2="150" y2="170" />
        </g>
        <g fill="#FFFFFF">
          <circle cx="40" cy="140" r="2.2" />
          <circle cx="110" cy="90" r="1.8" className={styles.twinkle} />
          <circle cx="180" cy="120" r="2.4" />
          <circle cx="250" cy="60" r="2" className={styles.twinkle} />
          <circle cx="320" cy="100" r="1.8" />
          <circle cx="150" cy="170" r="1.6" className={styles.twinkle} />
          <circle cx="80" cy="40" r="1.3" />
          <circle cx="360" cy="40" r="1.4" className={styles.twinkle} />
          <circle cx="300" cy="160" r="1.3" />
          <circle cx="20" cy="60" r="1.1" className={styles.twinkle} />
        </g>
      </svg>
    );
  }
  if (period === 'morning') {
    return (
      <svg className={styles.heroMorningGlow} viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <g stroke="#C9942B" strokeWidth="1" opacity="0.35">
          <path d="M60 150 Q 200 40 380 70" />
          <path d="M90 175 Q 220 95 405 45" />
        </g>
        <g fill="#E7B84B">
          <circle cx="300" cy="90" r="1.5" />
          <circle cx="360" cy="95" r="1.5" />
          <circle cx="270" cy="60" r="1.2" />
        </g>
        <path d="M330 38 L334 53 L349 55 L334 57 L330 72 L326 57 L311 55 L326 53 Z" fill="#E7B84B" />
      </svg>
    );
  }
  return <div className={styles.heroDots} />;
}

function PortalMark({ portal }: { portal: Portal }) {
  const [broken, setBroken] = useState(false);
  const source = portal.logo || portal.img;

  if (!source || broken) {
    return <span className={styles.portalMark}>{portal.name.charAt(0).toUpperCase()}</span>;
  }
  return (
    <img
      src={source}
      alt={portal.name}
      className={portal.img ? styles.portalLogoLg : styles.portalLogo}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export default function DashboardOverviewPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('Administrator');
  const [greeting, setGreeting] = useState('Good Morning');
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('morning');
  const [customPortals, setCustomPortals] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const prefersReducedMotion = useReducedMotion();
  const fadeVariants = prefersReducedMotion ? itemVariantsReduced : itemVariants;

  const [kpis, setKpis] = useState<KpiData>({
    members: 0, cpst: 0, acr: 0, cpc: 0, fst: 0, mngt: 0,
    ppu: 0, attendance: 0, announcements: 0, designs: 0, faqs: 0
  });

  const csrCategories: CsrCategory[] = [
    {
      label: 'Advisor & Beneficiary',
      forms: [
        { id: 'ACR', name: 'Advisor Change Request', icon: FileSignature, count: kpis.acr, href: '/admin/acr', accent: '#6B8AFE', tint: 'rgba(107,138,254,0.12)' },
        { id: 'BCR', name: 'Beneficiary Change Request', icon: Users2, count: 0, href: '/admin/bcr', accent: '#6B8AFE', tint: 'rgba(107,138,254,0.12)' },
      ],
    },
    {
      label: 'Fund Transactions',
      forms: [
        { id: 'FSR', name: 'Fund Switching Request', icon: ArrowLeftRight, count: 0, href: '/admin/fund-switching', accent: '#34A276', tint: 'rgba(52,162,118,0.12)' },
        { id: 'FWR', name: 'Fund Withdrawal Request', icon: Wallet, count: 0, href: '/admin/fund-withdrawal', accent: '#34A276', tint: 'rgba(52,162,118,0.12)' },
      ],
    },
    {
      label: 'Billing & Arrangements',
      forms: [
        { id: 'ACA', name: 'Auto Charge Arrangement', icon: CreditCard, count: 0, href: '/admin/aca', accent: '#8B5CF6', tint: 'rgba(139,92,246,0.12)' },
        { id: 'MDA', name: 'Modification / Debit Arrangement', icon: Calculator, count: kpis.mngt, href: '/admin/mngt', accent: '#8B5CF6', tint: 'rgba(139,92,246,0.12)' },
      ],
    },
    {
      label: 'Reinstatement',
      forms: [
        { id: 'SRO', name: 'Reinstatement (SRO)', icon: RotateCcw, count: 0, href: '/admin/sro', accent: '#E08A3C', tint: 'rgba(224,138,60,0.12)' },
        { id: 'PDI', name: 'Reinstatement (PDI)', icon: ShieldCheck, count: 0, href: '/admin/pdi', accent: '#E08A3C', tint: 'rgba(224,138,60,0.12)' },
      ],
    },
    {
      label: 'Compliance & Verification',
      forms: [
        { id: 'CSMV', name: 'Client Servicing Monitoring Verification', icon: Search, count: 0, href: '/admin/csmv', accent: '#2AA7A0', tint: 'rgba(42,167,160,0.12)' },
      ],
    },
  ];

  const totalRequests = kpis.acr + kpis.cpc + kpis.fst + kpis.mngt + kpis.ppu + kpis.cpst;

  const statCards = [
    { id: 'members', label: 'Total Members', value: kpis.members, icon: Users, href: '/admin/members' },
    { id: 'requests', label: 'Total Requests', value: totalRequests, icon: ClipboardList, href: '/admin/requests' },
    { id: 'attendance', label: 'Attendance Logs', value: kpis.attendance, icon: UserCheck, href: '/admin/attendance' },
    { id: 'announcements', label: 'Announcements', value: kpis.announcements, icon: FileText, href: '/admin/announcements' },
  ];

  const periodIcons: Record<DayPeriod, any> = {
    morning: Sunrise,
    afternoon: Sun,
    evening: Moon,
  };

  const portals: Portal[] = [
    { name: 'Sun Life Portal', mark: 'SL', url: 'https://www.sunlife.com.ph/en/', manage: '/admin/portals/sun-life' },
    { name: 'Advisor Office', mark: 'AO', url: 'https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:', manage: '/admin/portals/advisor-office' },
    { name: 'Google Sheets', logo: 'https://cdn.simpleicons.org/googlesheets/34A853', url: 'https://bit.ly/4f2fpLK', manage: '/admin/portals/google-sheets' },
    { name: 'Task Tracker', img: '/Image/icon/TP.png', url: 'https://teampaduatracker.vercel.app/tasktracker', manage: '/admin/portals/task-tracker' },
    { name: 'JotForm', logo: 'https://cdn.simpleicons.org/jotform/FF6100/FF8A3D', url: 'https://www.jotform.com/', manage: '/admin/portals/jotform' },
    { name: 'JotForm Intern', logo: 'https://cdn.simpleicons.org/jotform/FF6100/FF8A3D', url: 'https://form.jotform.com/261829362405055', manage: '/admin/portals/jotform' },
    { name: 'Microsoft Teams', logo: 'https://cdn.simpleicons.org/microsoftteams/6264A7/8A8DE0', url: 'https://teams.microsoft.com/', manage: '/admin/portals/microsoft-teams' },
    { name: 'Canva', logo: 'https://cdn.simpleicons.org/canva/00C4CC/3FD9DF', url: 'https://www.canva.com/', manage: '/admin/portals/canva' },
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_external_portals');
      if (stored) setCustomPortals(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getPhHour = () => {
    try {
      const options = { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false } as const;
      const formatter = new Intl.DateTimeFormat('en-US', options);
      return parseInt(formatter.format(new Date()), 10);
    } catch (err) {
      return new Date().getHours();
    }
  };

  const resolveGreetingAndPeriod = (): { greeting: string; period: DayPeriod } => {
    const hour = getPhHour();
    if (hour >= 5 && hour < 12) return { greeting: 'Good Morning', period: 'morning' };
    if (hour >= 12 && hour < 18) return { greeting: 'Good Afternoon', period: 'afternoon' };
    return { greeting: 'Good Evening', period: 'evening' };
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator');
        setAdminId(user.id);
      }

      const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: cpstCount } = await supabase.from('cpst_clients').select('*', { count: 'exact', head: true });
      const { count: acrCount } = await supabase.from('acr_clients').select('*', { count: 'exact', head: true });
      const { count: cpcCount } = await supabase.from('cpc_clients').select('*', { count: 'exact', head: true });
      const { count: fstCount } = await supabase.from('fst_clients').select('*', { count: 'exact', head: true });
      const { count: mngtCount } = await supabase.from('mngt_clients').select('*', { count: 'exact', head: true });
      const { count: ppuCount } = await supabase.from('ppu_clients').select('*', { count: 'exact', head: true });
      const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
      const { count: announcementsCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
      const { count: designsCount } = await supabase.from('design_templates').select('*', { count: 'exact', head: true });
      const { count: faqsCount } = await supabase.from('faqs').select('*', { count: 'exact', head: true });

      setKpis({
        members: membersCount || 0,
        cpst: cpstCount || 0,
        acr: acrCount || 0,
        cpc: cpcCount || 0,
        fst: fstCount || 0,
        mngt: mngtCount || 0,
        ppu: ppuCount || 0,
        attendance: attendanceCount || 0,
        announcements: announcementsCount || 0,
        designs: designsCount || 0,
        faqs: faqsCount || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const { greeting, period } = resolveGreetingAndPeriod();
    setGreeting(greeting);
    setDayPeriod(period);
    fetchDashboardData();

    const timer = setTimeout(() => setShowSplash(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
      });
      setCurrentDate(dateFormatter.format(now));
      setCurrentTime(timeFormatter.format(now));

      const { greeting, period } = resolveGreetingAndPeriod();
      setGreeting(greeting);
      setDayPeriod(period);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const PeriodIcon = periodIcons[dayPeriod];
  const totalCsrForms = csrCategories.reduce((sum, cat) => sum + cat.forms.length, 0);
  const totalPortals = portals.length + customPortals.length;

  return (
    <div className={styles.shell}>
      <WelcomeModal userName={adminName} role="Admin" />

      {showSplash && (
        <div className={styles.splash}>
          <div className={styles.splashRing}>
            <div className={styles.splashSpin} />
            <div className={styles.splashDot} />
          </div>
          <p className={styles.splashLabel}>Syncing admin dashboard</p>
        </div>
      )}

      <Sidebar />

      <div className={styles.mainCol}>
        <Header />

        <motion.main className={styles.content} variants={containerVariants} initial="hidden" animate="show">
          <motion.section variants={fadeVariants} className={styles.heroCard} data-period={dayPeriod}>
            <HeroDecoration period={dayPeriod} />
            <div className={styles.heroLeft}>
              <span className={styles.greetingBadge}>
                <PeriodIcon size={12} strokeWidth={1.8} />
                {greeting}
              </span>
              <h1 className={styles.welcomeText}>
                Welcome, <span className={styles.usernameHighlight}>{adminName}</span>
              </h1>
              <span className={styles.memberBadge}>Role Authorized · Administrator</span>
            </div>
            <div className={styles.heroRight}>
              <div className={styles.dateDisplay}>{currentDate}</div>
              <div className={styles.verticalDivider} />
              <div className={styles.timeDisplay}>
                <Clock size={13} strokeWidth={1.8} />
                <span className={styles.timeText}>{currentTime}</span>
              </div>
              <button onClick={handleRefresh} className={styles.refreshButton} type="button" title="Refresh dashboard">
                {isRefreshing ? <Loader2 size={15} className={styles.spinIcon} /> : <RefreshCw size={15} strokeWidth={1.8} />}
              </button>
            </div>
          </motion.section>

          <motion.div variants={fadeVariants} className={styles.statsGrid}>
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.id} href={stat.href} className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div className={styles.statIconWrap}>
                      <Icon size={16} strokeWidth={1.8} />
                    </div>
                    <ArrowUpRight size={13} className={styles.statArrow} />
                  </div>
                  <h3 className={styles.statValue}>{stat.value.toLocaleString()}</h3>
                  <span className={styles.statLabel}>{stat.label}</span>
                </Link>
              );
            })}
          </motion.div>

          <motion.div variants={fadeVariants} className={styles.sectionBlock}>
            <div className={styles.sectionHeadRow}>
              <div className={styles.sectionHeadLeft}>
                <h2 className={styles.sectionTitle}>External Portals</h2>
                <p className={styles.sectionSubtitle}>Quick access to primary service domains and tools</p>
              </div>
            </div>

            <div className={styles.portalGrid}>
              {portals.map((portal) => (
                <div
                  key={portal.name}
                  onClick={() => window.open(portal.url, "_blank", "noopener,noreferrer")}
                  className={styles.portalCard}
                >
                  <Link href={portal.manage} onClick={(e) => e.stopPropagation()} className={styles.portalManage} title={`Manage ${portal.name}`}>
                    <Settings size={12} strokeWidth={1.8} />
                  </Link>
                  <div className={styles.portalMarkWrap}>
                    <PortalMark portal={portal} />
                  </div>
                  <div className={styles.portalTextWrap}>
                    <span className={styles.portalName}>{portal.name}</span>
                    <span className={styles.portalDomain}>{getDomain(portal.url)}</span>
                  </div>
                </div>
              ))}

              {customPortals.map((portal, idx) => (
                <div
                  key={`custom-portal-${idx}`}
                  onClick={() => window.open(portal.url, "_blank", "noopener,noreferrer")}
                  className={styles.portalCard}
                >
                  <div className={styles.portalMarkWrap}>
                    <PortalMark portal={{ name: portal.name, url: portal.url, manage: '', logo: portal.iconUrl }} />
                  </div>
                  <div className={styles.portalTextWrap}>
                    <span className={styles.portalName}>{portal.name}</span>
                    <span className={styles.portalDomain}>{getDomain(portal.url)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeVariants} className={styles.sectionBlock}>
            <div className={styles.csrPanel}>
              <FileStack className={styles.csrPanelGlyph} strokeWidth={1} />

              <div className={styles.csrPanelInner}>
                <div className={styles.sectionHeadRow}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.opsBadge}>
                      <Layers size={11} strokeWidth={1.8} />
                      Command Center
                    </span>
                    <h2 className={styles.sectionTitle}>Operations Overview</h2>
                    <p className={styles.sectionSubtitle}>Client servicing, forms, and request analytics in one operational view</p>
                  </div>
                  <button onClick={handleRefresh} className={styles.opsRefreshBtn} type="button">
                    {isRefreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} strokeWidth={1.8} />}
                    Refresh
                  </button>
                </div>

                <div className={styles.statusStrip}>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIconWrap}>
                      <Boxes size={14} strokeWidth={1.8} />
                    </div>
                    <div className={styles.statusTextWrap}>
                      <span className={styles.statusValue}>{totalCsrForms}</span>
                      <span className={styles.statusLabel}>Active Forms</span>
                    </div>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIconWrap}>
                      <Grid3x3 size={14} strokeWidth={1.8} />
                    </div>
                    <div className={styles.statusTextWrap}>
                      <span className={styles.statusValue}>{csrCategories.length}</span>
                      <span className={styles.statusLabel}>Categories</span>
                    </div>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIconWrap}>
                      <ClipboardList size={14} strokeWidth={1.8} />
                    </div>
                    <div className={styles.statusTextWrap}>
                      <span className={styles.statusValue}>{totalRequests.toLocaleString()}</span>
                      <span className={styles.statusLabel}>Pending Requests</span>
                    </div>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIconWrap}>
                      <Radio size={14} strokeWidth={1.8} />
                    </div>
                    <div className={styles.statusTextWrap}>
                      <span className={styles.statusValue} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className={styles.liveDot} />
                        Live
                      </span>
                      <span className={styles.statusLabel}>Sync Status</span>
                    </div>
                  </div>
                </div>

                <div className={styles.opsDivider} style={{ marginTop: '1.5rem', marginBottom: '1.25rem' }} />

                <div className={styles.csrHeadRow}>
                  <h3 className={styles.csrTitle}>CSR Forms Center</h3>
                  <p className={styles.csrSubtitle}>{totalCsrForms} client servicing request forms grouped by category, with live counts and quick access</p>
                </div>

                {csrCategories.map((category) => {
                  const categoryTotal = category.forms.reduce((sum, f) => sum + f.count, 0);
                  const accent = category.forms[0].accent;
                  return (
                    <div key={category.label} className={styles.categoryGroup}>
                      <div className={styles.categoryHeadRow}>
                        <span className={styles.categoryDot} style={{ background: accent }} />
                        <span className={styles.categoryLabel}>{category.label}</span>
                        <span className={styles.categoryCount}>{category.forms.length} form{category.forms.length > 1 ? 's' : ''}</span>
                        <span className={styles.categoryLine} />
                        <span className={styles.categoryBadge} style={{ color: accent, background: category.forms[0].tint }}>
                          {categoryTotal} pending
                        </span>
                      </div>

                      <div className={styles.csrGrid}>
                        {category.forms.map((form) => {
                          const Icon = form.icon;
                          return (
                            <Link
                              key={form.id}
                              href={form.href}
                              className={styles.csrCard}
                              style={{ borderTopColor: form.accent }}
                            >
                              <div className={styles.csrIconWrap} style={{ background: form.tint, color: form.accent }}>
                                <Icon size={20} strokeWidth={1.6} />
                              </div>
                              <div className={styles.csrBody}>
                                <div className={styles.csrTopRow}>
                                  <span className={styles.csrCode}>{form.id}</span>
                                  <span className={styles.csrCount}>{form.count}</span>
                                </div>
                                <p className={styles.csrName}>{form.name}</p>
                                <span className={styles.csrAction} style={{ color: form.accent }}>
                                  Open request
                                  <ArrowUpRight size={12} className={styles.csrActionArrow} />
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.footer variants={fadeVariants} className={styles.footer}>
            <span>TeamPadua Operations Control Terminal &bull; 2026</span>
            <div className={styles.footerRight}>
              <span className={styles.footerPill}><span className={styles.footerDot} />SLA 99.99%</span>
              <span className={styles.footerPill}><span className={styles.footerDot} />Secure Layer Online</span>
              <span className={styles.footerPill}><span className={styles.footerDot} />{totalPortals} Portals Linked</span>
            </div>
          </motion.footer>
        </motion.main>
      </div>
    </div>
  );
}