'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, ChevronRight, ArrowLeft,
  Upload, FileSpreadsheet, Users, UserCheck, UserPlus,
  Calendar, Cake, Sparkles, Gift, Copy, Check, Eye
} from 'lucide-react';
import { AdminHeader, AdminSidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import { exportToPDF, exportToDOCS } from '@src/lib/export';
import ExportDropdown from '@src/components/shared/ExportDropdown';
import { ConfirmModal } from '@src/components/modals/ConfirmModal';
import styles from "@/styles/admin/cgpt/page.module.css";

export interface AdvisorRecord {
  id: string;
  advisorCode: string;
  advisorName: string;
  email: string;
  createdAt?: string;
}

export interface BirthdayItem {
  id: string;
  name: string;
  date: string;
  when: 'today' | 'yesterday' | 'tomorrow';
  age?: number;
  advisorId: string;
  advisorName: string;
  policyNo?: string;
}

export function extractMonthDayYear(birthRaw: string): { year: number; month: number; day: number } | null {
  if (!birthRaw) return null;
  const trimmed = String(birthRaw).trim();

  const dateOnlyMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() };
  }

  return null;
}

export function computeBirthdayWhenAndAge(birthRaw: string | null): {
  when: 'today' | 'yesterday' | 'tomorrow';
  ageTurning: number;
  dateDisplay: string;
} | null {
  if (!birthRaw) return null;

  const extracted = extractMonthDayYear(birthRaw);
  if (!extracted) return null;

  const { year: birthYear, month, day } = extracted;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = todayStart.getFullYear();

  const birthdayThisYear = new Date(thisYear, month, day);
  const diffDays = Math.round((birthdayThisYear.getTime() - todayStart.getTime()) / 86400000);

  let when: 'today' | 'yesterday' | 'tomorrow' | null = null;
  if (diffDays === 0) when = 'today';
  else if (diffDays === 1) when = 'tomorrow';
  else if (diffDays === -1) when = 'yesterday';

  if (!when) return null;

  const ageTurning = thisYear - birthYear;
  const dateDisplay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(thisYear, month, day)
  );

  return { when, ageTurning, dateDisplay };
}

export async function getClientBirthdays(options?: {
  advisorId?: string;
  dateRange?: 'all' | 'yesterday' | 'today' | 'tomorrow' | 'All' | 'Yesterday' | 'Today' | 'Tomorrow';
}): Promise<{
  birthdays: BirthdayItem[];
  advisors: AdvisorRecord[];
}> {
  try {
    const [advisorsRes, clientsRes] = await Promise.all([
      supabase.from('advisors').select('*').order('advisor_name', { ascending: true }),
      supabase
        .from('cgpt_clients')
        .select('*, advisor:advisors(*)')
        .order('created_at', { ascending: false }),
    ]);

    const advisorsData = (advisorsRes.data || []) as Array<Record<string, unknown>>;
    let clientsData = (clientsRes.data || []) as Array<Record<string, unknown>>;

    if (clientsRes.error) {
      const fallbackRes = await supabase
        .from('cpst_clients')
        .select('*, advisor:advisors(*)')
        .order('created_at', { ascending: false });
      if (fallbackRes.data && fallbackRes.data.length > 0) {
        clientsData = fallbackRes.data as Array<Record<string, unknown>>;
      }
    }

    const advisors: AdvisorRecord[] = advisorsData.map((a) => ({
      id: String(a.id || ''),
      advisorCode: String(a.advisor_code || ''),
      advisorName: String(a.advisor_name || ''),
      email: String(a.email || ''),
      createdAt: typeof a.created_at === 'string' ? a.created_at : undefined,
    }));

    const items: BirthdayItem[] = [];

    for (const c of clientsData) {
      const advisorRecord = Array.isArray(c.advisor) ? c.advisor[0] : (c.advisor as Record<string, unknown> | null);
      const advId = (c.advisor_id as string) || (advisorRecord?.id as string) || 'Unassigned';
      const advName = (advisorRecord?.advisor_name as string) || 'Unassigned';

      if (options?.advisorId && options.advisorId !== 'All' && advId !== options.advisorId) {
        continue;
      }

      const birthdate = (c.birthdate || c.birth_date || c.dob || c.birthday) as string | null | undefined;
      const computed = computeBirthdayWhenAndAge(birthdate ?? null);
      if (!computed) continue;

      items.push({
        id: String(c.id || ''),
        name: String(c.client_name || c.name || 'Unnamed Client'),
        date: computed.dateDisplay,
        when: computed.when,
        age: computed.ageTurning,
        advisorId: advId,
        advisorName: advName,
      });
    }

    let filtered = items;
    if (options?.dateRange && options.dateRange.toLowerCase() !== 'all') {
      const range = options.dateRange.toLowerCase();
      filtered = filtered.filter((b) => b.when === range);
    }

    const priority: Record<string, number> = { yesterday: 0, today: 1, tomorrow: 2 };
    filtered.sort((a, b) => (priority[a.when] ?? 99) - (priority[b.when] ?? 99));

    return { birthdays: filtered, advisors };
  } catch {
    return { birthdays: [], advisors: [] };
  }
}

export function useClientBirthdays(
  initialAdvisor = 'All',
  initialFilter: 'All' | 'Yesterday' | 'Today' | 'Tomorrow' = 'All'
) {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [allBirthdays, setAllBirthdays] = useState<BirthdayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(initialAdvisor);
  const [whenFilter, setWhenFilter] = useState<'All' | 'Yesterday' | 'Today' | 'Tomorrow'>(initialFilter);

  const fetchBirthdays = async () => {
    try {
      const res = await getClientBirthdays();
      setAllBirthdays(res.birthdays);
      setAdvisors(res.advisors);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getClientBirthdays()
      .then((res) => {
        if (!isMounted) return;
        setAllBirthdays(res.birthdays);
        setAdvisors(res.advisors);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBirthdays = useMemo(() => {
    let items = selectedAdvisor === 'All'
      ? allBirthdays
      : allBirthdays.filter((b) => b.advisorId === selectedAdvisor);

    if (whenFilter !== 'All') {
      const targetWhen = whenFilter.toLowerCase();
      items = items.filter((b) => b.when === targetWhen);
    }

    const priority: Record<string, number> = { yesterday: 0, today: 1, tomorrow: 2 };
    return [...items].sort((a, b) => (priority[a.when] ?? 99) - (priority[b.when] ?? 99));
  }, [allBirthdays, selectedAdvisor, whenFilter]);

  const todayCount = useMemo(() => {
    return filteredBirthdays.filter((b) => b.when === 'today').length;
  }, [filteredBirthdays]);

  return {
    birthdays: allBirthdays,
    filteredBirthdays,
    advisors,
    loading,
    error,
    selectedAdvisor,
    setSelectedAdvisor,
    whenFilter,
    setWhenFilter,
    todayCount,
    refetch: fetchBirthdays,
  };
}

export interface ClientManagementRecord {
  id: string;
  advisorId?: string;
  advisor?: AdvisorRecord;
  clientName: string;
  relationship?: string;
  policyNumber?: string;
  product?: string;
  approvalDate?: string;
  annualPremium?: number;
  mobileNumber?: string;
  email?: string;
  address?: string;
  beneficiary?: string;
  fundAllocation?: string;
  modeOfPayment?: string;
  birthdate?: string;
  signatureData?: string;
  idType?: string;
  idNumber?: string;
  idExpirationDate?: string;
  idAttachmentUrl?: string;
  created_at?: string;
}

export interface ClientDisplayRecord {
  id: string;
  clientId?: string;
  recordType?: 'CLIENT' | 'BENEFICIARY';
  name?: string;
  clientName: string;
  relationship?: string;
  policyNumber?: string;
  product?: string;
  approvalDate?: string;
  annualPremium?: number;
  mobileNumber?: string;
  email?: string;
  address?: string;
  beneficiary?: string;
  fundAllocation?: string;
  modeOfPayment?: string;
  birthdate?: string;
  created_at?: string;
  rawClient?: ClientManagementRecord;
  isMonthHeader?: boolean;
  label?: string;
}

export interface ClientRecord {
  id?: string;
  advisor_id: string;
  client_name: string;
  birthdate?: string | null;
  relationship?: string | null;
  beneficiary?: string | null;
  policy_number?: string | null;
  product?: string | null;
  approval_date?: string | null;
  annual_premium?: number | null;
  mobile_number?: string | null;
  email?: string | null;
  address?: string | null;
  fund_allocation?: string | null;
  mode_of_payment?: string | null;
  signature_data?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  id_expiration_date?: string | null;
  id_attachment_url?: string | null;
  created_at?: string | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatBirthdateWithYear(d: Date): string {
  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

function calculateAge(birthdateStr?: string): { age: number | null; ageDisplay: string } {
  if (!birthdateStr) return { age: null, ageDisplay: '—' };
  const d = new Date(birthdateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { age: null, ageDisplay: '—' };
  
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const hasHadBirthday =
    today.getMonth() > d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
  if (!hasHadBirthday) age--;
  return { age, ageDisplay: `${age} yrs` };
}

function getBirthdayCelebrationStatus(birthdateStr?: string): {
  statusText: string;
  statusType: 'today' | 'upcoming' | 'this_month' | 'passed' | 'none';
  daysRemaining: number | null;
  turningAge: number | null;
} {
  if (!birthdateStr) return { statusText: 'No birthdate set', statusType: 'none', daysRemaining: null, turningAge: null };
  const extracted = extractMonthDayYear(birthdateStr);
  if (!extracted) return { statusText: 'Invalid date', statusType: 'none', daysRemaining: null, turningAge: null };

  const { year: birthYear, month, day } = extracted;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = todayStart.getFullYear();

  let bday = new Date(thisYear, month, day);
  let daysDiff = Math.round((bday.getTime() - todayStart.getTime()) / 86400000);
  let turning = thisYear - birthYear;

  if (daysDiff < 0) {
    bday = new Date(thisYear + 1, month, day);
    daysDiff = Math.round((bday.getTime() - todayStart.getTime()) / 86400000);
    turning = thisYear + 1 - birthYear;
  }

  if (daysDiff === 0) {
    return { statusText: '🎉 Celebrating Today!', statusType: 'today', daysRemaining: 0, turningAge: turning };
  }
  if (daysDiff === 1) {
    return { statusText: '⚡ Tomorrow', statusType: 'upcoming', daysRemaining: 1, turningAge: turning };
  }
  if (daysDiff <= 7) {
    return { statusText: `🎂 In ${daysDiff} days`, statusType: 'upcoming', daysRemaining: daysDiff, turningAge: turning };
  }
  if (month === now.getMonth()) {
    return { statusText: `🎈 Later this month (${daysDiff} days)`, statusType: 'this_month', daysRemaining: daysDiff, turningAge: turning };
  }
  return { statusText: `In ${daysDiff} days`, statusType: 'passed', daysRemaining: daysDiff, turningAge: turning };
}

export interface CGPTClientProps {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

const formInputClass = "w-full px-3.5 py-2.5 border border-border rounded-2xl text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-card text-foreground transition-all duration-200";
const formLabelClass = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

export default function CGPTClient({
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canExport = true,
}: CGPTClientProps): React.JSX.Element {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [clients, setClients] = useState<ClientManagementRecord[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorRecord | null>(null);

  const [advisorSearch, setAdvisorSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [birthdayMonthFilter, setBirthdayMonthFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('birthday-month');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectAdvisor = (adv: AdvisorRecord | null) => {
    setSelectedAdvisor(adv);
    setSelectedIds([]);
  };

  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | 'addAdvisor' | 'editAdvisor' | 'basicInfo' | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<ClientManagementRecord>>({});
  const [currentAdvisor, setCurrentAdvisor] = useState<Partial<AdvisorRecord>>({});
  const [copiedGreeting, setCopiedGreeting] = useState(false);

  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [advisorToDelete, setAdvisorToDelete] = useState<string | null>(null);
  const [isDeletingAdvisor, setIsDeletingAdvisor] = useState(false);

  const [importTarget, setImportTarget] = useState<'clients' | 'advisors'>('clients');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [importAdvisorId, setImportAdvisorId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  const fetchData = async () => {
    try {
      const [advisorsRes, clientsRes] = await Promise.all([
        supabase.from('advisors').select('*').order('advisor_name', { ascending: true }),
        supabase.from('cgpt_clients').select('*, advisor:advisors(*)').order('created_at', { ascending: false }),
      ]);

      const advisorsData = (advisorsRes.data || []) as Array<Record<string, unknown>>;
      const clientsData = (clientsRes.data || []) as Array<Record<string, unknown>>;

      const loadedAdvisors: AdvisorRecord[] = advisorsData.map((a) => ({
        id: String(a.id || ''),
        advisorCode: String(a.advisor_code || ''),
        advisorName: String(a.advisor_name || ''),
        email: String(a.email || ''),
        createdAt: typeof a.created_at === 'string' ? a.created_at : undefined,
      }));

      setAdvisors(loadedAdvisors);

      const mappedClients: ClientManagementRecord[] = clientsData.map((c) => {
        const adv = (Array.isArray(c.advisor) ? c.advisor[0] : c.advisor) as Record<string, unknown> | null;
        return {
          id: String(c.id || ''),
          advisorId: (c.advisor_id as string) || (adv?.id as string) || undefined,
          advisor: adv
            ? {
                id: String(adv.id || ''),
                advisorCode: String(adv.advisor_code || ''),
                advisorName: String(adv.advisor_name || ''),
                email: String(adv.email || ''),
              }
            : undefined,
          clientName: String(c.client_name || c.name || ''),
          relationship: typeof c.relationship === 'string' ? c.relationship : undefined,
          policyNumber: typeof c.policy_number === 'string' ? c.policy_number : undefined,
          product: typeof c.product === 'string' ? c.product : undefined,
          approvalDate: typeof c.approval_date === 'string' ? c.approval_date : undefined,
          annualPremium: typeof c.annual_premium === 'number' ? c.annual_premium : Number(c.annual_premium || 0),
          mobileNumber: typeof c.mobile_number === 'string' ? c.mobile_number : undefined,
          email: typeof c.email === 'string' ? c.email : undefined,
          address: typeof c.address === 'string' ? c.address : undefined,
          beneficiary: String(c.beneficiary || ''),
          fundAllocation: typeof c.fund_allocation === 'string' ? c.fund_allocation : undefined,
          modeOfPayment: typeof c.mode_of_payment === 'string' ? c.mode_of_payment : undefined,
          birthdate: String(c.birthdate || c.birth_date || c.birthday || ''),
          signatureData: typeof c.signature_data === 'string' ? c.signature_data : undefined,
          idType: typeof c.id_type === 'string' ? c.id_type : undefined,
          idNumber: typeof c.id_number === 'string' ? c.id_number : undefined,
          idExpirationDate: typeof c.id_expiration_date === 'string' ? c.id_expiration_date : undefined,
          idAttachmentUrl: typeof c.id_attachment_url === 'string' ? c.id_attachment_url : undefined,
          created_at: String(c.created_at || ''),
        };
      });
      setClients(mappedClients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [advisorsRes, clientsRes] = await Promise.all([
          supabase.from('advisors').select('*').order('advisor_name', { ascending: true }),
          supabase.from('cgpt_clients').select('*, advisor:advisors(*)').order('created_at', { ascending: false }),
        ]);

        if (!isMounted) return;

        const advisorsData = (advisorsRes.data || []) as Array<Record<string, unknown>>;
        const clientsData = (clientsRes.data || []) as Array<Record<string, unknown>>;

        const loadedAdvisors: AdvisorRecord[] = advisorsData.map((a) => ({
          id: String(a.id || ''),
          advisorCode: String(a.advisor_code || ''),
          advisorName: String(a.advisor_name || ''),
          email: String(a.email || ''),
          createdAt: typeof a.created_at === 'string' ? a.created_at : undefined,
        }));

        setAdvisors(loadedAdvisors);

        const mappedClients: ClientManagementRecord[] = clientsData.map((c) => {
          const adv = (Array.isArray(c.advisor) ? c.advisor[0] : c.advisor) as Record<string, unknown> | null;
          return {
            id: String(c.id || ''),
            advisorId: (c.advisor_id as string) || (adv?.id as string) || undefined,
            advisor: adv
              ? {
                  id: String(adv.id || ''),
                  advisorCode: String(adv.advisor_code || ''),
                  advisorName: String(adv.advisor_name || ''),
                  email: String(adv.email || ''),
                }
              : undefined,
            clientName: String(c.client_name || c.name || ''),
            relationship: typeof c.relationship === 'string' ? c.relationship : undefined,
            policyNumber: typeof c.policy_number === 'string' ? c.policy_number : undefined,
            product: typeof c.product === 'string' ? c.product : undefined,
            approvalDate: typeof c.approval_date === 'string' ? c.approval_date : undefined,
            annualPremium: typeof c.annual_premium === 'number' ? c.annual_premium : Number(c.annual_premium || 0),
            mobileNumber: typeof c.mobile_number === 'string' ? c.mobile_number : undefined,
            email: typeof c.email === 'string' ? c.email : undefined,
            address: typeof c.address === 'string' ? c.address : undefined,
            beneficiary: String(c.beneficiary || ''),
            fundAllocation: typeof c.fund_allocation === 'string' ? c.fund_allocation : undefined,
            modeOfPayment: typeof c.mode_of_payment === 'string' ? c.mode_of_payment : undefined,
            birthdate: String(c.birthdate || c.birth_date || c.birthday || ''),
            signatureData: typeof c.signature_data === 'string' ? c.signature_data : undefined,
            idType: typeof c.id_type === 'string' ? c.id_type : undefined,
            idNumber: typeof c.id_number === 'string' ? c.id_number : undefined,
            idExpirationDate: typeof c.id_expiration_date === 'string' ? c.id_expiration_date : undefined,
            idAttachmentUrl: typeof c.id_attachment_url === 'string' ? c.id_attachment_url : undefined,
            created_at: String(c.created_at || ''),
          };
        });
        setClients(mappedClients);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalClientsCount = clients.length;

  const currentMonthName = MONTH_NAMES[new Date().getMonth()];
  const thisMonthCount = useMemo(() => {
    return clients.filter(c => {
      if (!c.birthdate) return false;
      const parsed = extractMonthDayYear(c.birthdate);
      return parsed && parsed.month === new Date().getMonth();
    }).length;
  }, [clients]);

  const todayCelebrantsCount = useMemo(() => {
    return clients.filter(c => {
      const info = getBirthdayCelebrationStatus(c.birthdate);
      return info.statusType === 'today';
    }).length;
  }, [clients]);

  const filteredAdvisors = useMemo(() => {
    return advisors.filter(a => {
      const q = advisorSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        a.advisorName.toLowerCase().includes(q) ||
        a.advisorCode.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
      );
    });
  }, [advisors, advisorSearch]);

  const advisorBirthdayStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; thisMonth: number }>();
    const currentM = new Date().getMonth();
    clients.forEach(c => {
      if (!c.advisorId) return;
      const prev = map.get(c.advisorId) || { total: 0, thisMonth: 0 };
      prev.total++;
      if (c.birthdate) {
        const parsed = extractMonthDayYear(c.birthdate);
        if (parsed && parsed.month === currentM) {
          prev.thisMonth++;
        }
      }
      map.set(c.advisorId, prev);
    });
    return map;
  }, [clients]);

  const advisorClients = useMemo(() => {
    if (!selectedAdvisor) return [];
    return clients.filter(c => c.advisorId === selectedAdvisor.id);
  }, [clients, selectedAdvisor]);

  const filteredClients = useMemo(() => {
    const result = advisorClients.filter(c => {
      const q = clientSearch.toLowerCase().trim();
      const nameMatch = !q || c.clientName.toLowerCase().includes(q) || (c.beneficiary && c.beneficiary.toLowerCase().includes(q));
      
      let monthMatch = true;
      if (birthdayMonthFilter !== 'ALL') {
        if (!c.birthdate) {
          monthMatch = false;
        } else {
          const parsed = extractMonthDayYear(c.birthdate);
          monthMatch = Boolean(parsed && MONTH_NAMES[parsed.month]?.toLowerCase() === birthdayMonthFilter.toLowerCase());
        }
      }
      return nameMatch && monthMatch;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.clientName.localeCompare(b.clientName));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (sortBy === 'age-young') {
      result.sort((a, b) => (calculateAge(a.birthdate).age ?? 999) - (calculateAge(b.birthdate).age ?? 999));
    } else if (sortBy === 'age-old') {
      result.sort((a, b) => (calculateAge(b.birthdate).age ?? -1) - (calculateAge(a.birthdate).age ?? -1));
    } else if (sortBy === 'birthday-month') {
      result.sort((a, b) => {
        const parsedA = extractMonthDayYear(a.birthdate || '');
        const parsedB = extractMonthDayYear(b.birthdate || '');
        if (!parsedA && !parsedB) return 0;
        if (!parsedA) return 1;
        if (!parsedB) return -1;
        if (parsedA.month !== parsedB.month) return parsedA.month - parsedB.month;
        return parsedA.day - parsedB.day;
      });
    }

    return result;
  }, [advisorClients, clientSearch, birthdayMonthFilter, sortBy]);

  const isAllClientsSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;

  const toggleSelectAll = () => {
    if (isAllClientsSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSaveAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdvisor.advisorName || !currentAdvisor.advisorCode) return;
    try {
      if (currentAdvisor.id) {
        await supabase
          .from('advisors')
          .update({
            advisor_name: currentAdvisor.advisorName,
            advisor_code: currentAdvisor.advisorCode,
            email: currentAdvisor.email || ''
          })
          .eq('id', currentAdvisor.id);
      } else {
        await supabase
          .from('advisors')
          .insert([{
            advisor_name: currentAdvisor.advisorName,
            advisor_code: currentAdvisor.advisorCode,
            email: currentAdvisor.email || ''
          }]);
      }
      setActiveModal(null);
      setCurrentAdvisor({});
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdvisor = async () => {
    if (!advisorToDelete) return;
    setIsDeletingAdvisor(true);
    try {
      await supabase.from('advisors').delete().eq('id', advisorToDelete);
      setAdvisorToDelete(null);
      if (selectedAdvisor?.id === advisorToDelete) {
        selectAdvisor(null);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingAdvisor(false);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient.clientName) return;
    const advId = currentClient.advisorId || selectedAdvisor?.id;
    if (!advId) return;

    try {
      if (currentClient.id) {
        await supabase
          .from('cgpt_clients')
          .update({
            client_name: currentClient.clientName,
            beneficiary: currentClient.beneficiary || null,
            birthdate: currentClient.birthdate || null,
            advisor_id: advId
          })
          .eq('id', currentClient.id);
      } else {
        await supabase
          .from('cgpt_clients')
          .insert([{
            client_name: currentClient.clientName,
            beneficiary: currentClient.beneficiary || null,
            birthdate: currentClient.birthdate || null,
            advisor_id: advId
          }]);
      }
      setActiveModal(null);
      setCurrentClient({});
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await supabase.from('cgpt_clients').delete().eq('id', clientToDelete);
      setClientToDelete(null);
      setSelectedIds(prev => prev.filter(x => x !== clientToDelete));
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} birthday records?`)) return;
    try {
      await supabase.from('cgpt_clients').delete().in('id', selectedIds);
      setSelectedIds([]);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    const headers = ['Client Name / Beneficiary Name', 'Beneficiary', 'Month - Birthdate', 'Age', 'Advisor Code', 'Advisor Name'];
    const rows = filteredClients.map(c => {
      const formattedDate = c.birthdate ? formatBirthdateWithYear(new Date(c.birthdate + 'T00:00:00')) : '';
      const age = calculateAge(c.birthdate).ageDisplay;
      return [
        c.clientName,
        c.beneficiary || '—',
        formattedDate,
        age,
        selectedAdvisor?.advisorCode || '',
        selectedAdvisor?.advisorName || ''
      ];
    });

    const filePrefix = selectedAdvisor?.advisorName.toLowerCase().replace(/\s+/g, '_') || 'client';

    if (format === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filePrefix}_birthdays.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      exportToPDF({
        title: `Birthday Directory - ${selectedAdvisor?.advisorName || 'All'}`,
        description: `Client and beneficiary birthday records under Advisor Code: ${selectedAdvisor?.advisorCode || 'N/A'}`,
        filename: `${filePrefix}_birthdays.pdf`,
        headers: ['Client Name / Beneficiary Name', 'Beneficiary', 'Month - Birthdate', 'Age'],
        rows: rows.map(r => [r[0], r[1], r[2], r[3]])
      });
    } else if (format === 'word') {
      exportToDOCS(
        `Birthday Directory - ${selectedAdvisor?.advisorName || 'All'}`,
        ['Client Name / Beneficiary Name', 'Beneficiary', 'Month - Birthdate', 'Age'],
        rows.map(r => [r[0], r[1], r[2], r[3]]),
        `${filePrefix}_birthdays.doc`
      );
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAdvId = selectedAdvisor ? selectedAdvisor.id : importAdvisorId;
    if (importTarget === 'clients' && !targetAdvId) {
      alert('Please select an advisor destination for the imported clients.');
      return;
    }

    setIsImporting(true);
    setImportStatus('Processing records...');

    try {
      if (importTarget === 'advisors') {
        const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
        const newAdvs: Array<{ advisor_name: string; advisor_code: string; email: string }> = [];
        for (const line of lines) {
          const parts = line.split(/[\t,]+/).map(p => p.trim());
          if (parts[0]) {
            newAdvs.push({
              advisor_name: parts[0],
              advisor_code: parts[1] || 'ADV-' + Math.floor(1000 + Math.random() * 9000),
              email: parts[2] || ''
            });
          }
        }
        if (newAdvs.length > 0) {
          await supabase.from('advisors').insert(newAdvs);
        }
      } else {
        const rowsToInsert: ClientRecord[] = [];
        if (importMethod === 'paste') {
          const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
          for (const line of lines) {
            const parts = line.split(/[\t,]+/).map(p => p.trim());
            if (parts[0]) {
              rowsToInsert.push({
                client_name: parts[0],
                birthdate: parts[1] || null,
                beneficiary: parts[2] || null,
                advisor_id: targetAdvId
              });
            }
          }
        } else if (importFile) {
          const XLSX = await import('xlsx');
          const buffer = await importFile.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const rawData: Array<Array<unknown>> = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (row && row[0]) {
              rowsToInsert.push({
                client_name: String(row[0]).trim(),
                birthdate: row[1] ? String(row[1]).trim() : null,
                beneficiary: row[2] ? String(row[2]).trim() : null,
                advisor_id: targetAdvId
              });
            }
          }
        }

        if (rowsToInsert.length > 0) {
          await supabase.from('cgpt_clients').insert(rowsToInsert);
        }
      }

      setActiveModal(null);
      setPastedText('');
      setImportFile(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Import error: ' + msg);
    } finally {
      setIsImporting(false);
      setImportStatus('');
    }
  };

  const copyGreetingMessage = (clientName: string, ageTurning?: number | null) => {
    const greeting = `Wishing a very Happy Birthday to ${clientName}! 🎂🎉 May your ${ageTurning ? ageTurning + 'th ' : ''}year ahead be filled with blessings, good health, and wonderful achievements! Warm greetings from Team Padua.`;
    navigator.clipboard.writeText(greeting);
    setCopiedGreeting(true);
    setTimeout(() => setCopiedGreeting(false), 2500);
  };

  const basicInfoCelebration = getBirthdayCelebrationStatus(currentClient.birthdate);
  const basicInfoAge = calculateAge(currentClient.birthdate);
  const basicInfoExtracted = extractMonthDayYear(currentClient.birthdate || '');

  return (
    <div className={styles.text_52}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_53}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className={styles.div_54}>
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
              <span className="font-semibold">Client Servicing</span>
              <ChevronRight size={14} />
              <button
                onClick={() => setSelectedAdvisor(null)}
                className={`hover:underline ${!selectedAdvisor ? 'text-primary font-bold' : 'text-text-secondary'}`}
              >
                Advisor Birthday Directory
              </button>
              {selectedAdvisor && (
                <>
                  <ChevronRight size={14} />
                  <span className="text-primary font-bold">{selectedAdvisor.advisorName}</span>
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2.5">
                  <Cake className="text-amber-500" size={26} />
                  {selectedAdvisor ? `${selectedAdvisor.advisorName}'s Birthday Directory` : 'Birthday Information Management'}
                </h1>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  {selectedAdvisor
                    ? `Manage client & beneficiary birthdays, milestones, and celebration greetings for Advisor Code: ${selectedAdvisor.advisorCode}`
                    : 'Track, manage, and celebrate client & beneficiary birthdays across all advisors.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedAdvisor && (
                  <button
                    onClick={() => setSelectedAdvisor(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold hover:bg-surface-2 active:scale-[0.97] transition-all duration-200"
                  >
                    <ArrowLeft size={14} /> Back to Advisors
                  </button>
                )}

                {canCreate && !selectedAdvisor && (
                  <button
                    onClick={() => {
                      setCurrentAdvisor({});
                      setActiveModal('addAdvisor');
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-transparent bg-gradient-to-r from-amber-500 to-[#F4C542] text-black text-xs font-extrabold shadow-sm hover:shadow-md hover:from-amber-600 hover:to-[#e6b800] transition-all duration-200 active:scale-[0.98]"
                  >
                    <UserPlus size={14} /> Add Advisor
                  </button>
                )}

                {canCreate && selectedAdvisor && (
                  <button
                    onClick={() => {
                      setCurrentClient({ advisorId: selectedAdvisor.id });
                      setActiveModal('add');
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-transparent bg-primary text-black text-xs font-extrabold shadow-sm hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Plus size={14} /> Add Birthday Record
                  </button>
                )}

                <button
                  onClick={() => {
                    setImportTarget(selectedAdvisor ? 'clients' : 'advisors');
                    setImportAdvisorId(selectedAdvisor?.id || advisors[0]?.id || '');
                    setActiveModal('import');
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-bold shadow-sm hover:bg-surface-2 transition-all duration-200 active:scale-[0.98]"
                >
                  <Upload size={14} /> Import File
                </button>
              </div>
            </div>
          </div>

          {!selectedAdvisor ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'TOTAL ADVISORS', count: advisors.length, tag: 'REGISTRY', color: 'text-foreground', icon: Users, isYellowBorder: true },
                  { label: 'TOTAL BIRTHDAYS', count: totalClientsCount, tag: 'CLIENTS', color: 'text-blue-500 dark:text-blue-400', icon: UserCheck },
                  { label: `BIRTHDAYS IN ${currentMonthName.toUpperCase()}`, count: thisMonthCount, tag: 'THIS MONTH', color: 'text-amber-600 dark:text-amber-400', icon: Calendar },
                  { label: "TODAY'S CELEBRANTS", count: todayCelebrantsCount, tag: 'CELEBRATING', color: 'text-green-600 dark:text-green-400', icon: Sparkles },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className={`bg-card border rounded-3xl p-5 shadow-sm ${stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/20' : 'border-border'} flex flex-col justify-between`}
                    >
                      <div className="flex justify-between items-start text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                        <span>{stat.label}</span>
                        <Icon size={16} className={stat.color} />
                      </div>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-2xl font-bold font-serif text-foreground">{stat.count}</span>
                        <span className={`text-[10px] font-bold uppercase ${stat.color}`}>{stat.tag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
                <div className="relative flex-1 w-full group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search advisor by name, code, or email..."
                    value={advisorSearch}
                    onChange={e => setAdvisorSearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-full h-11 pl-11 pr-4 text-xs text-foreground transition duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                    <thead>
                      <tr className="bg-background border-b border-border font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Advisor Details</th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Advisor Code</th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                        <th className="py-3.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Total Birthday Records</th>
                        <th className="py-3.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Birthdays This Month</th>
                        <th className="py-3.5 px-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground sticky right-0 bg-background">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">Loading advisor birthday directories...</td></tr>
                      ) : filteredAdvisors.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">No advisors found matching your criteria.</td></tr>
                      ) : filteredAdvisors.map(adv => {
                        const stat = advisorBirthdayStatsMap.get(adv.id) || { total: 0, thisMonth: 0 };
                        return (
                          <tr
                            key={adv.id}
                            className="hover:bg-surface-2/40 transition-colors group cursor-pointer"
                            onClick={() => setSelectedAdvisor(adv)}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                                  {adv.advisorName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                              {adv.advisorCode}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {adv.email || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-bold text-foreground">
                              {stat.total}
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                              {stat.thisMonth}
                            </td>
                            <td
                              className="py-3.5 px-4 text-right sticky right-0 bg-card group-hover:bg-surface-2/40 transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedAdvisor(adv)}
                                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-black dark:text-foreground text-[11px] font-bold rounded-lg transition-colors"
                                >
                                  View Birthdays
                                </button>
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setCurrentAdvisor(adv);
                                      setActiveModal('editAdvisor');
                                    }}
                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-2 transition-colors"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => setAdvisorToDelete(adv.id)}
                                    className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'TOTAL BIRTHDAY RECORDS', count: advisorClients.length, tag: 'RECORDS', color: 'text-foreground', icon: Users, isYellowBorder: true },
                  { label: `BIRTHDAYS IN ${currentMonthName.toUpperCase()}`, count: advisorClients.filter(c => {
                    if (!c.birthdate) return false;
                    const p = extractMonthDayYear(c.birthdate);
                    return p && p.month === new Date().getMonth();
                  }).length, tag: 'THIS MONTH', color: 'text-amber-600 dark:text-amber-400', icon: Calendar },
                  { label: "TODAY'S CELEBRANTS", count: advisorClients.filter(c => getBirthdayCelebrationStatus(c.birthdate).statusType === 'today').length, tag: 'TODAY', color: 'text-green-600 dark:text-green-400', icon: Sparkles },
                  { label: 'UPCOMING THIS WEEK', count: advisorClients.filter(c => {
                    const s = getBirthdayCelebrationStatus(c.birthdate);
                    return s.daysRemaining !== null && s.daysRemaining > 0 && s.daysRemaining <= 7;
                  }).length, tag: 'NEXT 7 DAYS', color: 'text-blue-500 dark:text-blue-400', icon: Gift },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className={`bg-card border rounded-3xl p-5 shadow-sm ${stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/20' : 'border-border'} flex flex-col justify-between`}
                    >
                      <div className="flex justify-between items-start text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                        <span>{stat.label}</span>
                        <Icon size={16} className={stat.color} />
                      </div>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-2xl font-bold font-serif text-foreground">{stat.count}</span>
                        <span className={`text-[10px] font-bold uppercase ${stat.color}`}>{stat.tag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
                <div className="relative flex-1 w-full group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search client / beneficiary name..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-full h-11 pl-11 pr-4 text-xs text-foreground transition duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={birthdayMonthFilter}
                    onChange={e => setBirthdayMonthFilter(e.target.value)}
                    className="h-11 px-4 bg-card border border-border rounded-full text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">📅 All Months</option>
                    {MONTH_NAMES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="h-11 px-4 bg-card border border-border rounded-full text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="birthday-month">🗓️ Birthday Calendar (Jan – Dec)</option>
                    <option value="name">Name A-Z</option>
                    <option value="age-young">Age (Youngest First)</option>
                    <option value="age-old">Age (Oldest First)</option>
                    <option value="newest">Newest Added</option>
                    <option value="oldest">Oldest Added</option>
                  </select>

                  {canExport && (
                    <ExportDropdown onExport={handleExport} />
                  )}
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-3.5 px-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {selectedIds.length} birthday records selected
                  </span>
                  {canDelete && (
                    <button
                      onClick={handleBatchDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Delete Selected
                    </button>
                  )}
                </div>
              )}

              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                    <thead>
                      <tr className="bg-background border-b border-border font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllClientsSelected}
                            onChange={toggleSelectAll}
                            className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Client Name / Beneficiary Name</th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Month - Birthdate</th>
                        <th className="py-3.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Age</th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Birthday Status</th>
                        <th className="py-3.5 px-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground sticky right-0 bg-background">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">Loading birthday records...</td></tr>
                      ) : filteredClients.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">No birthday records found.</td></tr>
                      ) : filteredClients.map(c => {
                        const isSelected = selectedIds.includes(c.id);
                        const status = getBirthdayCelebrationStatus(c.birthdate);
                        const ageInfo = calculateAge(c.birthdate);
                        const formattedBirthdate = c.birthdate ? formatBirthdateWithYear(new Date(c.birthdate + 'T00:00:00')) : '—';

                        return (
                          <tr
                            key={c.id}
                            className={`hover:bg-surface-2/40 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}
                          >
                            <td className="py-3.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(c.id)}
                                className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-xs">
                                  {c.clientName}
                                </span>
                                {c.beneficiary && (
                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                    Beneficiary: <span className="font-medium text-foreground">{c.beneficiary}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                              {formattedBirthdate}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-xs text-foreground">
                              {ageInfo.ageDisplay}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                                status.statusType === 'today'
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 animate-pulse'
                                  : status.statusType === 'upcoming'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : status.statusType === 'this_month'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  : 'bg-surface-2 text-muted-foreground'
                              }`}>
                                {status.statusText}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right sticky right-0 bg-card group-hover:bg-surface-2/40 transition-colors">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setCurrentClient(c);
                                    setActiveModal('basicInfo');
                                  }}
                                  title="View Birthday Details"
                                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-2 transition-colors"
                                >
                                  <Eye size={13} />
                                </button>
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setCurrentClient(c);
                                      setActiveModal('edit');
                                    }}
                                    title="Edit Birthday Info"
                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-2 transition-colors"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => setClientToDelete(c.id)}
                                    title="Delete Record"
                                    className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {activeModal === 'basicInfo' && currentClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                <Cake size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Birthday Information Details</h3>
                <p className="text-xs text-muted-foreground">Comprehensive birthday summary & milestone overview</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-surface-2/40 border border-border rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client / Beneficiary Name</span>
                <p className="text-base font-bold text-foreground mt-0.5">{currentClient.clientName}</p>
                {currentClient.beneficiary && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Beneficiary: <span className="font-semibold text-foreground">{currentClient.beneficiary}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-card border border-border rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Month</span>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {basicInfoExtracted ? MONTH_NAMES[basicInfoExtracted.month] : '—'}
                  </p>
                </div>
                <div className="p-3.5 bg-card border border-border rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Day</span>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {basicInfoExtracted ? basicInfoExtracted.day : '—'}
                  </p>
                </div>
                <div className="p-3.5 bg-card border border-border rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Age</span>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {basicInfoAge.ageDisplay}
                  </p>
                </div>
                <div className="p-3.5 bg-card border border-border rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next Milestone</span>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {basicInfoCelebration.turningAge ? `Turning ${basicInfoCelebration.turningAge}` : '—'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Celebration Status</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{basicInfoCelebration.statusText}</p>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {currentClient.birthdate ? formatBirthdateWithYear(new Date(currentClient.birthdate + 'T00:00:00')) : 'No Date'}
                </span>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Sparkles size={12} /> Birthday Greeting Action
                  </span>
                  <button
                    onClick={() => copyGreetingMessage(currentClient.clientName || '', basicInfoCelebration.turningAge)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    {copiedGreeting ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copiedGreeting ? 'Copied!' : 'Copy Greeting'}
                  </button>
                </div>
                <p className="text-xs text-foreground/80 italic bg-card/60 p-3 rounded-xl border border-border/40">
                  &ldquo;Wishing a very Happy Birthday to {currentClient.clientName}! 🎂🎉 May your {basicInfoCelebration.turningAge ? basicInfoCelebration.turningAge + 'th ' : ''}year ahead be filled with blessings, good health, and wonderful achievements! Warm greetings from Team Padua.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-surface-2 hover:bg-surface-2/80 text-foreground font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Cake size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {activeModal === 'edit' ? 'Edit Birthday Record' : 'Add Birthday Record'}
                </h3>
                <p className="text-xs text-muted-foreground">Manage client & beneficiary birthday information</p>
              </div>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className={formLabelClass}>Client / Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={currentClient.clientName || ''}
                  onChange={e => setCurrentClient({ ...currentClient, clientName: e.target.value })}
                  className={formInputClass}
                />
              </div>

              <div>
                <label className={formLabelClass}>Beneficiary Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Juan Santos (Son)"
                  value={currentClient.beneficiary || ''}
                  onChange={e => setCurrentClient({ ...currentClient, beneficiary: e.target.value })}
                  className={formInputClass}
                />
              </div>

              <div>
                <label className={formLabelClass}>Birthdate (YYYY-MM-DD) *</label>
                <input
                  type="date"
                  required
                  value={currentClient.birthdate || ''}
                  onChange={e => setCurrentClient({ ...currentClient, birthdate: e.target.value })}
                  className={formInputClass}
                />
              </div>

              {!selectedAdvisor && (
                <div>
                  <label className={formLabelClass}>Assign to Advisor *</label>
                  <select
                    required
                    value={currentClient.advisorId || ''}
                    onChange={e => setCurrentClient({ ...currentClient, advisorId: e.target.value })}
                    className={formInputClass}
                  >
                    <option value="">Select Advisor</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.advisorName} ({a.advisorCode})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-surface-2 hover:bg-surface-2/80 text-foreground font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#F4C542] hover:from-amber-600 hover:to-[#e6b800] text-black font-extrabold text-xs rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  {activeModal === 'edit' ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(activeModal === 'addAdvisor' || activeModal === 'editAdvisor') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {activeModal === 'editAdvisor' ? 'Edit Advisor' : 'Add New Advisor'}
                </h3>
                <p className="text-xs text-muted-foreground">Register advisor for birthday directory management</p>
              </div>
            </div>

            <form onSubmit={handleSaveAdvisor} className="space-y-4">
              <div>
                <label className={formLabelClass}>Advisor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Padua"
                  value={currentAdvisor.advisorName || ''}
                  onChange={e => setCurrentAdvisor({ ...currentAdvisor, advisorName: e.target.value })}
                  className={formInputClass}
                />
              </div>

              <div>
                <label className={formLabelClass}>Advisor Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADV-001"
                  value={currentAdvisor.advisorCode || ''}
                  onChange={e => setCurrentAdvisor({ ...currentAdvisor, advisorCode: e.target.value })}
                  className={formInputClass}
                />
              </div>

              <div>
                <label className={formLabelClass}>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. advisor@teampadua.com"
                  value={currentAdvisor.email || ''}
                  onChange={e => setCurrentAdvisor({ ...currentAdvisor, email: e.target.value })}
                  className={formInputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-surface-2 hover:bg-surface-2/80 text-foreground font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#F4C542] hover:from-amber-600 hover:to-[#e6b800] text-black font-extrabold text-xs rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  {activeModal === 'editAdvisor' ? 'Save Changes' : 'Add Advisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Batch Import Birthday Records</h3>
                <p className="text-xs text-muted-foreground">Import birthday directory from file or pasted text</p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-surface-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImportTarget('clients')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${importTarget === 'clients' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Import Birthdays / Clients
                </button>
                <button
                  type="button"
                  onClick={() => setImportTarget('advisors')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${importTarget === 'advisors' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Import Advisors
                </button>
              </div>

              {importTarget === 'clients' && !selectedAdvisor && (
                <div>
                  <label className={formLabelClass}>Destination Advisor *</label>
                  <select
                    required
                    value={importAdvisorId}
                    onChange={e => setImportAdvisorId(e.target.value)}
                    className={formInputClass}
                  >
                    <option value="">Select Advisor</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.advisorName} ({a.advisorCode})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 p-1 bg-surface-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImportMethod('file')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${importMethod === 'file' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Upload File (.xlsx / .csv)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod('paste')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${importMethod === 'paste' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Paste Text
                </button>
              </div>

              {importMethod === 'file' ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition">
                  <FileSpreadsheet className="mx-auto text-muted-foreground mb-2" size={28} />
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90 cursor-pointer"
                  />
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Columns: Name, Birthdate (YYYY-MM-DD), Beneficiary
                  </p>
                </div>
              ) : (
                <div>
                  <label className={formLabelClass}>Paste rows (tab/comma separated: Name, Birthdate, Beneficiary)</label>
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Juan Dela Cruz, 1990-05-15, Maria Dela Cruz"
                    className={`${formInputClass} font-mono`}
                  />
                </div>
              )}

              {importStatus && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{importStatus}</p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-surface-2 hover:bg-surface-2/80 text-foreground font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#F4C542] hover:from-amber-600 hover:to-[#e6b800] text-black font-extrabold text-xs rounded-xl shadow-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Birthday Record"
          message="Are you sure you want to permanently delete this birthday record?"
          confirmText="Delete"
          onConfirm={handleDeleteClient}
          onClose={() => setClientToDelete(null)}
          variant="danger"
          isLoading={isDeleting}
        />
      )}

      {advisorToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Advisor"
          message="Are you sure you want to delete this advisor? All associated client birthday records will also be removed."
          confirmText="Delete Advisor"
          onConfirm={handleDeleteAdvisor}
          onClose={() => setAdvisorToDelete(null)}
          variant="danger"
          isLoading={isDeletingAdvisor}
        />
      )}
    </div>
  );
}
