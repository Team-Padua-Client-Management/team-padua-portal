'use client';

import styles from "@/styles/admin/cpst/greetings/page.module.css";
import React, { useState, useEffect, useRef } from 'react';
import {
  Gift, Mail, Image as ImageIcon, Trash2, Calendar,
  Send, Sparkles, MessageSquare, Clock, ShieldCheck,
  Check, Play, Save, ChevronRight, BookOpen, AlertCircle,
  MessageCircle, Smartphone, X, Search, Users, CheckCircle2, Loader2
} from 'lucide-react';
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import { supabase } from "@src/lib/supabase/client";
import { useSearchParams } from 'next/navigation';
import baseStyles from "@/styles/admin/cpst/page.module.css";
import { useAdvisorClients } from '@src/components/cams/useAdvisorClients';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryChannel = 'Email' | 'Messenger' | 'Instagram' | 'TikTok' | 'WhatsApp' | 'SMS';

interface CampaignHistory {
  id: string;
  clientName: string;
  method: DeliveryChannel;
  dateSent: string;
  timeSent: string;
  status: 'Sent' | 'Failed' | 'Scheduled' | 'Pending' | 'Delivered';
  deliveredBy: string;
  posterUsed: string;
}

interface TemplatePreset {
  name: string;
  subject: string;
  body: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const templates: Record<string, TemplatePreset> = {
  Professional: {
    name: 'Professional',
    subject: 'Warmest Birthday Wishes from Padua',
    body: 'Happy Birthday!\n\nDear {Client Name},\n\nOn behalf of the CPST Team, we would like to extend our warmest wishes to you on your special day. May your year ahead be filled with abundant prosperity, health, and success.\n\nBest regards,\n\nCPST Team'
  },
  Friendly: {
    name: 'Friendly',
    subject: 'Happy Birthday, {Client Name}! 🎂',
    body: 'Happy Birthday, {Client Name}!\n\nWe hope you have a truly wonderful day filled with laughter, delicious cake, and the company of loved ones. Thank you for being an amazing part of our community!\n\nCheers,\n\nCPST Team'
  },
  Formal: {
    name: 'Formal',
    subject: 'Distinguished Birthday Greetings',
    body: 'Dear {Client Name},\n\nWe write to convey our sincerest congratulations on the anniversary of your birth. It is our hope that this milestone heralds a season of peaceful reflection and joy.\n\nRespectfully,\n\nCPST Team'
  },
  Christian: {
    name: 'Christian',
    subject: 'Abundant Birthday Blessings!',
    body: 'Happy Birthday!\n\nDear {Client Name},\n\n"The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you." - Numbers 6:24-25\n\nMay His blessings continue to overflow in your life today and always.\n\nBest wishes,\n\nCPST Team'
  }
};

const postersLibrary = [
  { name: 'Birthday Gold Theme', color: 'from-[#FFECA0] to-[#E6A800]', text: 'GOLD' },
  { name: 'Minimal White Theme', color: 'from-zinc-100 to-zinc-300', text: 'MINIMAL' },
  { name: 'Corporate Theme', color: 'from-blue-600 to-indigo-900', text: 'CORPORATE' },
  { name: 'Celebration Theme', color: 'from-pink-500 via-red-500 to-yellow-500', text: 'CELEBRATION' }
];

const monthsList = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function TikTokIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function InstagramIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CGPTPage() {
  // ── Advisor → Client state (reused from CPST architecture) ──────────────────
  const {
    advisors,
    clients,
    selectedAdvisor,
    selectedClient,
    loadingAdvisors,
    loadingClients,
    handleSelectAdvisor,
    handleSelectClient,
  } = useAdvisorClients();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState('Friendly');
  const [subjectText, setSubjectText] = useState(templates.Friendly.subject);
  const [editorText, setEditorText] = useState(templates.Friendly.body);
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('Email');
  const [recipientEmail, setRecipientEmail] = useState('johnrenzbandianon.teampadua@gmail.com');
  const [recipientPhone, setRecipientPhone] = useState('+63 ');
  const [scheduleOption, setScheduleOption] = useState('Immediate');
  const [customDateTime, setCustomDateTime] = useState('');

  const [selectedPoster, setSelectedPoster] = useState('Birthday Gold Theme');
  const [customPosterUrl, setCustomPosterUrl] = useState<string | null>(null);
  const [tempPosterUrl, setTempPosterUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<CampaignHistory[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());
  const currentMonthIndex = selectedMonthIdx;
  const currentMonthName = monthsList[selectedMonthIdx];

  // ── Derived: birthday clients (advisor-scoped, filtered by month) ───────────
  // `clients` from the hook is already filtered to the selected advisor's clients
  // (WHERE advisor_id = selectedAdvisor.id). We further filter by selected month.
  const birthdayClients = clients.filter(c => {
    if (!c.birthdate) return false;
    return new Date(c.birthdate + 'T00:00:00').getMonth() === currentMonthIndex;
  });

  // Birthday records for the table: all of the advisor's clients with a birthdate
  const birthdayRecords = clients.filter(c => !!c.birthdate);

  // ── When advisor changes: reset campaign history + clear status ──────────────
  // (selectedClient is already reset inside handleSelectAdvisor in the hook)
  useEffect(() => {
    setHistory([]);
    setStatusMessage(null);
  }, [selectedAdvisor]);

  // ── When month changes: reset client selection ──────────────────────────────
  const handleMonthChange = (idx: number) => {
    setSelectedMonthIdx(idx);
    handleSelectClient('');
  };

  // ── Auto-populate recipient email from selected client ──────────────────────
  useEffect(() => {
    if (selectedClient?.email) {
      setRecipientEmail(selectedClient.email);
    }
  }, [selectedClient]);

  // ── Utility: age calculation ─────────────────────────────────────────────────
  const calculateAge = (birthdate: string | null | undefined): number | null => {
    if (!birthdate) return null;
    const today = new Date();
    const bday = new Date(birthdate + 'T00:00:00');
    if (isNaN(bday.getTime())) return null;
    let age = today.getFullYear() - bday.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > bday.getMonth() ||
      (today.getMonth() === bday.getMonth() && today.getDate() >= bday.getDate());
    if (!hasHadBirthdayThisYear) age--;
    return age;
  };

  // ── Birthday records filtered to the selected month and sorted by day ────────
  const sortedBirthdayRecords = React.useMemo(() => {
    const monthFiltered = birthdayRecords.filter(r => {
      if (!r.birthdate) return false;
      return new Date(r.birthdate + 'T00:00:00').getMonth() === selectedMonthIdx;
    });
    return monthFiltered.sort((a, b) => {
      const dayA = new Date(a.birthdate! + 'T00:00:00').getDate();
      const dayB = new Date(b.birthdate! + 'T00:00:00').getDate();
      return dayA - dayB;
    });
  }, [birthdayRecords, selectedMonthIdx]);

  // ── Count per month (for month tab badges) ────────────────────────────────
  const birthdayCountByMonth = React.useMemo(() => {
    const counts = new Array(12).fill(0);
    birthdayRecords.forEach(r => {
      if (!r.birthdate) return;
      const m = new Date(r.birthdate + 'T00:00:00').getMonth();
      counts[m]++;
    });
    return counts;
  }, [birthdayRecords]);

  const thisMonthBirthdaysCount = birthdayRecords.filter(r => {
    if (!r.birthdate) return false;
    return new Date(r.birthdate + 'T00:00:00').getMonth() === selectedMonthIdx;
  });

  const formatDOB = (birthdate: string | null | undefined) => {
    if (!birthdate) return "—";
    const date = new Date(birthdate + 'T00:00:00');
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Template variable replacement (uses selectedClient from hook) ───────────
  const getReplacedText = (text: string) => {
    if (!selectedClient) return text;
    return text
      .replaceAll('{Client Name}', selectedClient.client_name)
      .replaceAll('{Relationship}', selectedClient.relationship || '')
      .replaceAll('{Age}', (calculateAge(selectedClient.birthdate) ?? 0).toString())
      .replaceAll('{Birthday}', selectedClient.birthdate
        ? new Date(selectedClient.birthdate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : 'Unknown')
      .replaceAll('{Assigned Staff}', 'CPST Admin Team');
  };

  // ── Template selection ──────────────────────────────────────────────────────
  const handleTemplateChange = (name: string) => {
    setSelectedTemplateName(name);
    setSubjectText(templates[name].subject);
    setEditorText(templates[name].body);
  };

  // ── Poster upload ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setTempPosterUrl(dataUrl);
        const img = new Image();
        img.onload = () => {
          setImageMeta({ width: img.naturalWidth, height: img.naturalHeight, name: file.name });
          setShowConfirmModal(true);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpload = () => {
    if (tempPosterUrl) {
      setCustomPosterUrl(tempPosterUrl);
      setSelectedPoster('Uploaded Poster');
    }
    setShowConfirmModal(false);
    setTempPosterUrl(null);
  };

  const handleCancelUpload = () => {
    setShowConfirmModal(false);
    setTempPosterUrl(null);
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Send campaign ───────────────────────────────────────────────────────────
  const handleSendCampaign = async () => {
    if (!selectedClient) {
      alert('Please select an advisor and a client first.');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      if (deliveryChannel === 'Email') {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: selectedClient.client_name,
            to: recipientEmail || 'johnrenzbandianon.teampadua@gmail.com',
            subject: getReplacedText(subjectText),
            body: getReplacedText(editorText)
          })
        });
        if (!res.ok) throw new Error('API failed');
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const { error: dbErr } = await supabase.from('notifications').insert({
        title: `CPST Campaign: ${selectedClient.client_name}`,
        description: `Sent birthday greetings to client "${selectedClient.client_name}" via ${deliveryChannel} (Preset: ${selectedTemplateName}).`,
        type: 'campaign'
      });

      if (dbErr) console.error("Failed to insert database notification:", dbErr);

      const newLog: CampaignHistory = {
        id: Math.random().toString(),
        clientName: selectedClient.client_name,
        method: deliveryChannel,
        dateSent: todayStr,
        timeSent: timeStr,
        status: scheduleOption === 'Immediate' ? 'Sent' : 'Scheduled',
        deliveredBy: 'Administrator',
        posterUsed: selectedPoster
      };

      setHistory(prev => [newLog, ...prev]);
      setStatusMessage({
        type: 'success',
        text: scheduleOption === 'Immediate'
          ? `Campaign sent successfully to ${selectedClient.client_name} via ${deliveryChannel}!`
          : `Campaign scheduled successfully for ${selectedClient.client_name} at ${scheduleOption}!`
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to send/schedule campaign. Please verify API integration.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const filteredHistory = history.filter(item =>
    item.clientName.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.method.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.posterUsed.toLowerCase().includes(historySearch.toLowerCase())
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.text_0}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_1}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_2}>
          {/* ── Page header ── */}
          <div className={styles.div_3}>
            <h1 className={styles.table_4}>CPST Birthday Center</h1>
            <p className={styles.table_5}>
              Manage birthday greetings, campaign posters, and client engagement
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div className={`${baseStyles.container_61} mb-6`}>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'ADVISOR CLIENTS', count: clients.length, link: 'CLIENTS', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'THIS MONTH BIRTHDAYS', count: thisMonthBirthdaysCount.length, link: 'BIRTHDAYS', color: 'text-green-600 dark:text-green-400', icon: Calendar },
                { label: 'SENT GREETINGS', count: history.length, link: 'CAMPAIGNS', color: 'text-[#A97800] dark:text-[#F4C542]', icon: CheckCircle2 },
                { label: 'POSTERS IN USE', count: postersLibrary.length + (customPosterUrl ? 1 : 0), link: 'THEMES', color: 'text-blue-500 dark:text-blue-400', icon: Sparkles },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={`${baseStyles.card_227} ${stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/10' : 'border-border'} flex flex-col justify-between`}
                  >
                    <div className={baseStyles.table_63}>
                      <span>{stat.label}</span>
                      <Icon size={12} className={baseStyles.text_64} />
                    </div>
                    <div className={baseStyles.container_65}>
                      <span className={baseStyles.text_66}>{stat.count}</span>
                      <span className={`${baseStyles.table_228} ${stat.color}`}>{stat.link}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.container_6}>
            {/* ── Left column: Composer ── */}
            <div className={styles.div_7}>
              <div className={styles.card_8}>
                <div>
                  <h3 className={styles.table_9}>Greeting Campaign Composer</h3>
                  <p className={styles.text_10}>Configure template properties and dynamic fields</p>
                </div>

                {/* ── Advisor → Client selectors ── */}
                <div className={styles.container_11}>
                  {/* Advisor selector */}
                  <div className={styles.div_12}>
                    <label className={styles.table_13}>Advisor</label>
                    {loadingAdvisors ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border border-border rounded-xl bg-card">
                        <Loader2 className="animate-spin" size={14} />
                        Loading advisors...
                      </div>
                    ) : (
                      <select
                        id="advisor-selector"
                        value={selectedAdvisor?.id || ''}
                        onChange={(e) => handleSelectAdvisor(e.target.value)}
                        className={styles.text_14}
                      >
                        <option value="" disabled>Select an advisor...</option>
                        {advisors.map(adv => (
                          <option key={adv.id} value={adv.id}>
                            {adv.advisorName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Client selector (disabled until advisor is selected) */}
                  <div className={styles.div_12}>
                    <label className={styles.table_13}>Client</label>
                    <select
                      id="client-selector"
                      value={selectedClient?.id || ''}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      disabled={!selectedAdvisor || loadingClients}
                      className={`${styles.text_14} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {!selectedAdvisor ? (
                        <option value="">Select an advisor first.</option>
                      ) : loadingClients ? (
                        <option value="">Loading clients...</option>
                      ) : birthdayClients.length === 0 ? (
                        <option value="">No birthdays in {currentMonthName.charAt(0) + currentMonthName.slice(1).toLowerCase()}</option>
                      ) : (
                        <>
                          <option value="" disabled>Select a client...</option>
                          {birthdayClients.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.client_name} ({calculateAge(c.birthdate)} yrs){c.relationship ? ` — ${c.relationship}` : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* ── Greeting schedule ── */}
                <div className={styles.container_11}>
                  <div className={styles.div_15}>
                    <label className={styles.table_16}>Greeting Schedule</label>
                    <select
                      value={scheduleOption}
                      onChange={e => setScheduleOption(e.target.value)}
                      className={styles.text_17}
                    >
                      <option value="Immediate">Send Immediately</option>
                      <option value="Midnight">Birthday - 12:00 AM</option>
                      <option value="Morning8">Birthday - 8:00 AM</option>
                      <option value="Morning9">Birthday - 9:00 AM</option>
                      <option value="Custom">Custom Date &amp; Time</option>
                    </select>
                  </div>
                </div>

                {scheduleOption === 'Custom' && (
                  <div className={styles.div_18}>
                    <label className={styles.table_19}>Target Custom Timestamp</label>
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={e => setCustomDateTime(e.target.value)}
                      className={styles.text_20}
                    />
                  </div>
                )}

                {/* ── Delivery channel ── */}
                <div className={styles.div_21}>
                  <label className={styles.table_22}>Select Delivery Channel</label>
                  <div className={styles.container_23}>
                    {[
                      { id: 'Email', icon: <Mail size={13} />, label: 'Email', future: false },
                      { id: 'Messenger', icon: <MessageSquare size={13} />, label: 'Messenger', future: true },
                      { id: 'Instagram', icon: <InstagramIcon size={13} />, label: 'Instagram', future: true },
                      { id: 'TikTok', icon: <TikTokIcon size={13} />, label: 'TikTok', future: true },
                      { id: 'WhatsApp', icon: <MessageCircle size={13} />, label: 'WhatsApp', future: true },
                      { id: 'SMS', icon: <Smartphone size={13} />, label: 'SMS', future: false }
                    ].map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setDeliveryChannel(ch.id as DeliveryChannel)}
                        className={`${styles.table_128} ${deliveryChannel === ch.id
                          ? 'border-primary bg-primary/5 text-foreground font-extrabold ring-1 ring-[#F4C542]/30'
                          : 'border-border text-muted-foreground hover:text-foreground bg-muted/5'
                          }`}
                      >
                        {ch.icon}
                        <span className={styles.table_24}>{ch.label}</span>
                        {ch.future && (
                          <span className={styles.input_25}>Future</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {deliveryChannel === 'Email' && (
                  <div className={styles.div_26}>
                    <label className={styles.table_27}>Recipient Email Address</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="e.g. client.name@gmail.com"
                      className={styles.text_28}
                    />
                  </div>
                )}

                {deliveryChannel === 'SMS' && (
                  <div className={styles.div_29}>
                    <label className={styles.table_30}>Recipient Phone Number (PH)</label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="e.g. +63 917 123 4567"
                      className={styles.text_31}
                    />
                  </div>
                )}

                {/* ── Preset templates ── */}
                <div className={styles.div_32}>
                  <label className={styles.table_33}>Select Preset Template</label>
                  <div className={styles.container_34}>
                    {Object.keys(templates).map(tName => (
                      <button
                        key={tName}
                        onClick={() => handleTemplateChange(tName)}
                        className={`${styles.table_129} ${selectedTemplateName === tName
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground bg-muted/20'
                          }`}
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Subject ── */}
                <div className={styles.div_35}>
                  <label className={styles.table_36}>Live Message Subject Line</label>
                  <input
                    type="text"
                    value={subjectText}
                    onChange={e => setSubjectText(e.target.value)}
                    placeholder="e.g. Happy Birthday {Client Name}!"
                    className={styles.text_37}
                  />
                </div>

                {/* ── Body editor ── */}
                <div className={styles.div_38}>
                  <label className={styles.table_39}>Message Body Editor</label>
                  <textarea
                    value={editorText}
                    onChange={e => setEditorText(e.target.value)}
                    rows={7}
                    className={styles.text_40}
                  />
                </div>

                {/* ── Live preview ── */}
                <div className={styles.div_41}>
                  <p className={styles.table_42}>Live Message Preview</p>
                  <div className={styles.text_43}>
                    {getReplacedText(editorText)}
                  </div>
                </div>

                {/* ── Status message ── */}
                {statusMessage && (
                  <div className={`${styles.text_130} ${statusMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}>
                    <AlertCircle size={14} />
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {/* ── Send button ── */}
                <div className={styles.container_44}>
                  <button
                    onClick={handleSendCampaign}
                    disabled={isSending || !selectedClient || birthdayClients.length === 0}
                    className={styles.input_45}
                  >
                    {isSending ? (
                      <>
                        <Clock size={13} className={styles.div_46} />
                        <span>Sending Greetings...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Greeting Campaign</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right column: Poster ── */}
            <div className={styles.div_47}>
              <div className={styles.card_48}>
                <div>
                  <h3 className={styles.table_49}>Campaign Poster Preview</h3>
                  <p className={styles.text_50}>Greeting attachment render card</p>
                </div>

                {selectedPoster === 'Uploaded Poster' && customPosterUrl ? (
                  <div className={styles.container_51}>
                    <img src={customPosterUrl} alt="Custom greeting poster attachment" className={styles.div_52} />
                  </div>
                ) : (
                  <div className={styles.container_53}>
                    <div className={`${styles.div_131} ${postersLibrary.find(p => p.name === selectedPoster)?.color || 'from-[#FFECA0] to-[#E6A800]'} z-0`} />

                    <div className={styles.text_54}>
                      <span className={styles.table_55}>CPST GREETING</span>
                      <span className={styles.text_56}>{selectedPoster}</span>
                    </div>

                    <div className={styles.text_57}>
                      <h4 className={styles.text_58}>
                        {selectedClient ? `Happy Birthday, ${selectedClient.client_name}!` : 'Happy Birthday!'}
                      </h4>
                      <p className={styles.table_59}>
                        {selectedClient
                          ? `Age: ${calculateAge(selectedClient.birthdate)} • ${selectedClient.relationship || 'Client'}`
                          : 'Best Wishes from CPST Team'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Custom poster upload ── */}
                <div className={styles.div_60}>
                  <label className={styles.table_61}>Upload Custom Graphic Poster</label>
                  <div className={styles.container_62}>
                    <input
                      type="file"
                      id="poster-uploader"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className={styles.div_63}
                    />
                    <label htmlFor="poster-uploader" className={styles.input_64}>
                      <ImageIcon size={13} className={styles.text_65} />
                      <span>Choose Image Poster</span>
                    </label>

                    {customPosterUrl && (
                      <button
                        onClick={() => {
                          setCustomPosterUrl(null);
                          setSelectedPoster('Birthday Gold Theme');
                        }}
                        className={styles.table_66}
                        title="Delete Custom Poster"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className={styles.text_67}>Supported formats: PNG, JPG, JPEG, WEBP</p>
                </div>
              </div>

              {/* ── Poster library ── */}
              <div className={styles.card_68}>
                <div>
                  <h3 className={styles.table_69}>Standard Poster Library</h3>
                  <p className={styles.text_70}>Predefined graphic layouts to attach</p>
                </div>

                <div className={styles.container_71}>
                  {postersLibrary.map(item => (
                    <button
                      key={item.name}
                      onClick={() => setSelectedPoster(item.name)}
                      className={`${styles.input_132} ${selectedPoster === item.name
                        ? 'border-primary ring-2 ring-[#F4C542]/20'
                        : 'border-border hover:border-muted-foreground/45'
                        }`}
                    >
                      <div className={`${styles.div_133} ${item.color} flex items-center justify-center text-[10px] font-bold text-white font-mono uppercase tracking-widest`}>
                        {item.text}
                      </div>
                      <div className={styles.card_72}>
                        <span className={styles.table_73}>{item.name}</span>
                        {selectedPoster === item.name && <Check size={11} className={styles.text_74} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Birthday list table ── */}
          <div className={styles.card_75} style={{ marginBottom: '24px' }}>
            <div className={styles.container_76}>
              <div>
                <h3 className={styles.table_77}>Client Birthday List</h3>
                <p className={styles.text_78}>
                  {selectedAdvisor
                    ? `Clients of ${selectedAdvisor.advisorName} — ${currentMonthName.charAt(0) + currentMonthName.slice(1).toLowerCase()} birthdays`
                    : 'Select an advisor to view birthday records'}
                </p>
              </div>
            </div>

            {/* ── Month tab strip ── */}
            <div className="px-4 pb-2 border-b border-border overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {monthsList.map((m, i) => {
                  const count = birthdayCountByMonth[i];
                  const isActive = i === selectedMonthIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => handleMonthChange(i)}
                      disabled={!selectedAdvisor}
                      className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                      }`}
                    >
                      <span>{m.slice(0, 3)}</span>
                      {count > 0 && (
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.div_82}>
              {!selectedAdvisor ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  Select an advisor to load birthday records.
                </div>
              ) : loadingClients ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading birthday records...</span>
                </div>
              ) : sortedBirthdayRecords.length === 0 ? (
                <div className="p-10 text-center">
                  <Calendar size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No {currentMonthName.charAt(0) + currentMonthName.slice(1).toLowerCase()} birthdays found
                    {selectedAdvisor ? ` for ${selectedAdvisor.advisorName}` : ''}.
                  </p>
                </div>
              ) : (
                <table className={styles.text_83}>
                  <thead>
                    <tr className={styles.table_84}>
                      <th className={styles.text_85}>Client Name</th>
                      <th className={styles.text_86}>Date of Birth</th>
                      <th className={styles.text_87}>Age (turns)</th>
                    </tr>
                  </thead>
                  <tbody className={styles.text_93}>
                    {sortedBirthdayRecords.map(item => {
                      const today = new Date();
                      const bday = new Date(item.birthdate! + 'T00:00:00');
                      const isToday = bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
                      return (
                        <tr key={item.id} className={`${styles.table_95} group bg-[#F4C542]/10 dark:bg-[#F4C542]/5`}>
                          <td className={styles.text_96}>
                            <span className="flex items-center gap-2">
                              {item.client_name}
                              {isToday && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F4C542] px-2 py-0.5 text-[9px] font-bold text-[#5A3800] uppercase tracking-wider">
                                  🎂 Today!
                                </span>
                              )}
                            </span>
                          </td>
                          <td className={styles.text_106}>{formatDOB(item.birthdate)}</td>
                          <td className={styles.text_106}>
                            {item.birthdate ? (
                              <span className="font-semibold text-foreground">{calculateAge(item.birthdate) ?? '—'}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Campaign history ── */}
          <div className={styles.card_75}>
            <div className={styles.container_76}>
              <div>
                <h3 className={styles.table_77}>Greeting Campaign History</h3>
                <p className={styles.text_78}>Dispatched birthday greetings logs</p>
              </div>
              <div className={styles.div_79}>
                <Search className={styles.text_80} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className={styles.text_81}
                />
              </div>
            </div>

            <div className={styles.div_82}>
              <table className={styles.text_83}>
                <thead>
                  <tr className={styles.table_84}>
                    <th className={styles.text_85}>Client Target</th>
                    <th className={styles.text_86}>Channel</th>
                    <th className={styles.text_87}>Date Sent</th>
                    <th className={styles.text_88}>Time Sent</th>
                    <th className={styles.text_89}>Status</th>
                    <th className={styles.text_90}>Attachment</th>
                    <th className={styles.text_91}>Sender</th>
                    <th className={styles.text_92}>Action</th>
                  </tr>
                </thead>
                <tbody className={styles.text_93}>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.text_94}>
                        No campaign history logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(item => (
                      <tr key={item.id} className={`${styles.table_95} group`}>
                        <td className={styles.text_96}>{item.clientName}</td>
                        <td className={styles.div_97}>
                          <span className={styles.container_98}>
                            {item.method === 'Email' && <Mail size={12} className={styles.text_99} />}
                            {item.method === 'Messenger' && <MessageSquare size={12} className={styles.text_100} />}
                            {item.method === 'Instagram' && <InstagramIcon size={12} className={styles.text_101} />}
                            {item.method === 'TikTok' && <TikTokIcon size={12} className={styles.text_102} />}
                            {item.method === 'WhatsApp' && <MessageCircle size={12} className={styles.text_103} />}
                            {item.method === 'SMS' && <Smartphone size={12} className={styles.text_104} />}
                            <span className={styles.text_105}>{item.method}</span>
                          </span>
                        </td>
                        <td className={styles.text_106}>{item.dateSent}</td>
                        <td className={styles.text_107}>{item.timeSent}</td>
                        <td className={styles.div_108}>
                          <span className={`${styles.text_134} ${item.status === 'Sent' || item.status === 'Delivered'
                            ? 'bg-emerald-50 dark:bg-emerald-950/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'Scheduled'
                              ? 'bg-amber-50 dark:bg-amber-950/15 border-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-50 dark:bg-rose-950/15 border-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className={styles.text_109}>{item.posterUsed}</td>
                        <td className={styles.text_110}>{item.deliveredBy}</td>
                        <td className={styles.text_111}>
                          <button
                            onClick={() => handleDeleteHistoryItem(item.id)}
                            className={`${styles.table_112} group`}
                            title="Delete log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ── Poster upload confirm modal ── */}
      {showConfirmModal && tempPosterUrl && imageMeta && (
        <div className={styles.container_113}>
          <div className={styles.card_114}>
            <div className={styles.container_115}>
              <div>
                <h4 className={styles.table_116}>Confirm Poster Image Upload</h4>
                <p className={styles.text_117}>Verify real dimensions and visual layout before applying</p>
              </div>
              <button onClick={handleCancelUpload} className={styles.table_118}>
                <X size={14} />
              </button>
            </div>

            <div className={styles.container_119}>
              <div className={styles.card_120}>
                <img src={tempPosterUrl} alt="Real-size Upload Preview" className={styles.div_121} />
              </div>
              <div className={styles.text_122}>
                <span>File Name: <span className={styles.text_123}>{imageMeta.name}</span></span>
                <span>•</span>
                <span>Dimensions: <span className={styles.text_124}>{imageMeta.width} x {imageMeta.height} px</span></span>
              </div>
            </div>

            <div className={styles.card_125}>
              <button onClick={handleCancelUpload} className={styles.table_126}>Cancel</button>
              <button onClick={handleConfirmUpload} className={styles.table_127}>
                <Check size={13} />
                <span>Confirm &amp; Apply Poster</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
