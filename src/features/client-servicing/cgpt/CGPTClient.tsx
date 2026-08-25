'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, ChevronRight, ArrowLeft,
  Upload, FileSpreadsheet, CheckCircle2, Target, Users,
  AlertCircle, Eye, EyeOff, UserCheck, UserPlus, Briefcase, Mail, MoreVertical, FileText, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { AdminHeader } from '@src/components/layout';
import { AdminSidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import SignaturePad from '@src/components/ui/SignaturePad';
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

    const advisorsData = advisorsRes.data || [];
    let clientsData = clientsRes.data || [];

    if (clientsRes.error) {
      console.warn('cgpt_clients query returned error, checking cpst_clients fallback:', clientsRes.error);
      const fallbackRes = await supabase
        .from('cpst_clients')
        .select('*, advisor:advisors(*)')
        .order('created_at', { ascending: false });
      if (fallbackRes.data && fallbackRes.data.length > 0) {
        clientsData = fallbackRes.data;
      }
    }

    const advisors: AdvisorRecord[] = advisorsData.map((a: any) => ({
      id: a.id,
      advisorCode: a.advisor_code || '',
      advisorName: a.advisor_name || '',
      email: a.email || '',
      createdAt: a.created_at || '',
    }));

    const items: BirthdayItem[] = [];

    for (const c of clientsData) {
      const advisorRecord = Array.isArray(c.advisor) ? c.advisor[0] : c.advisor;
      const advId = c.advisor_id || advisorRecord?.id || 'Unassigned';
      const advName = advisorRecord?.advisor_name || 'Unassigned';

      if (options?.advisorId && options.advisorId !== 'All' && advId !== options.advisorId) {
        continue;
      }

      const birthdate = c.birthdate || c.birth_date || c.dob || c.birthday;
      const computed = computeBirthdayWhenAndAge(birthdate);
      if (!computed) continue;

      items.push({
        id: c.id,
        name: c.client_name || c.name || 'Unnamed Client',
        date: computed.dateDisplay,
        when: computed.when,
        age: computed.ageTurning,
        advisorId: advId,
        advisorName: advName,
        policyNo: c.policy_number || undefined,
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
  } catch (err) {
    console.error('Error in getClientBirthdays:', err);
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
  const [error, setError] = useState<any>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(initialAdvisor);
  const [whenFilter, setWhenFilter] = useState<'All' | 'Yesterday' | 'Today' | 'Tomorrow'>(initialFilter);

  const fetchBirthdays = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClientBirthdays();
      setAllBirthdays(res.birthdays);
      setAdvisors(res.advisors);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
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
  relationship: string;
  policyNumber: string;
  product: string;
  approvalDate: string;
  annualPremium: number;
  mobileNumber: string;
  email: string;
  address: string;
  beneficiary: string;
  fundAllocation: string;
  modeOfPayment: string;
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
  clientId: string;
  name: string;
  clientName: string;
  relationship: string;
  policyNumber: string;
  product: string;
  approvalDate: string;
  annualPremium: number;
  mobileNumber: string;
  email: string;
  address: string;
  beneficiary: string;
  fundAllocation: string;
  modeOfPayment: string;
  birthdate?: string;
  created_at?: string;
  rawClient: ClientManagementRecord;
  isMonthHeader?: boolean;
  label?: string;
}

export interface ClientRecord {
  id?: string;
  advisor_id: string;

  client_name: string;
  birthdate?: string | null;

  mobile_number?: string | null;
  email?: string | null;
  address?: string | null;

  policy_number?: string | null;
  product?: string | null;

  approval_date?: string | null;
  annual_premium?: number | null;

  relationship?: string | null;
  beneficiary?: string | null;
  fund_allocation?: string | null;

  mode_of_payment?: string | null;

  signature_data?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  id_expiration_date?: string | null;
  id_attachment_url?: string | null;
}

interface BeneficiaryEntry {
  name: string;
  relationship: string;
}

interface EmbeddedBeneficiaryResult {
  clientName: string;
  beneficiaryName?: string;
  relationship?: string;
}

const PRODUCTS = ['Sun Maxilink Prime', 'Sun Fit and Well', 'Sun FlexiLink', 'Sun Dream Wealth', 'Sun Life Assure'];
const PAYMENT_MODES = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'];

const RELATIONSHIP_NORMALIZATION_MAP: Record<string, string> = {
  aunt: 'auntie',
  auntie: 'auntie',
  uncle: 'uncle',
  mother: 'mother',
  mom: 'mother',
  mama: 'mother',
  father: 'father',
  dad: 'father',
  papa: 'father',
  sister: 'sister',
  brother: 'brother',
  cousin: 'cousin',
  daughter: 'daughter',
  son: 'son',
  grandmother: 'grandmother',
  grandma: 'grandmother',
  grandfather: 'grandfather',
  grandpa: 'grandfather',
  granddaughter: 'granddaughter',
  grandson: 'grandson',
  wife: 'wife',
  husband: 'husband',
  partner: 'partner',
  niece: 'niece',
  nephew: 'nephew',
  guardian: 'guardian',
  relative: 'relative',
};

function normalizeRelationship(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const key = trimmed.toLowerCase();
  return RELATIONSHIP_NORMALIZATION_MAP[key] || trimmed;
}

function normalizeHeader(header: string): string {
  return String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findColumnIndex(headerRow: any[], keywords: string[]): number {
  const normalizedKeywords = keywords.map(normalizeHeader).filter(Boolean);
  return headerRow.findIndex((h: any) => {
    const normalizedHeader = normalizeHeader(String(h ?? ''));
    if (!normalizedHeader) return false;
    return normalizedKeywords.some(k => normalizedHeader.includes(k));
  });
}

function normalizeNameForMatch(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokensOverlap(haystack: string, candidateName: string): boolean {
  const haystackNorm = normalizeNameForMatch(haystack);
  const nameTokens = normalizeNameForMatch(candidateName).split(' ').filter(t => t.length >= 3);
  if (nameTokens.length === 0 || !haystackNorm) return false;
  let hits = 0;
  nameTokens.forEach(t => {
    if (haystackNorm.includes(t)) hits++;
  });
  if (nameTokens.length === 1) return hits >= 1;
  return hits >= 2;
}

// ─── Sheet-scoring constants ─────────────────────────────────────────────────
// Keywords that indicate a client-data sheet. Scored against every worksheet.
const CLIENT_HEADER_KEYWORDS: string[] = [
  'client name', 'client name / beneficiary name', 'beneficiary name',
  'date of birth', 'birthday', 'dob', 'birthdate', 'month - birthdate',
  'age', 'email', 'email address', 'contact number', 'mobile', 'phone',
  'location', 'address', 'policy number', 'policy#', 'policy no',
  'product', 'plan', 'plan name', 'policy name',
  'date of approval', 'approval date', 'issue date',
  'relationship', 'relationship type',
  'beneficiary', 'fund allocation', 'mode of payment', 'annual premium',
];

/**
 * Score a worksheet's rows for "client-data likelihood".
 * Returns { headerScore, dataRows } where:
 *   headerScore  = number of supported CLIENT_HEADER_KEYWORDS found in the header row
 *   dataRows     = number of non-empty rows below the header row
 */
function scoreSheetForClientData(rows: any[][]): { headerScore: number; dataRows: number; headerIndex: number } {
  const maxScan = Math.min(rows.length, 30);

  // Try to find a header row using the same logic as parseClientRows
  let headerIndex = -1;

  // Pass 1: exact name header + birth/age header
  for (let i = 0; i < maxScan; i++) {
    const cells = (rows[i] || []).map((c: any) => String(c ?? '').toLowerCase().trim());
    const hasName = cells.some(c => c === 'client name / beneficiary name' || c === 'client name');
    const hasBirth = cells.some(c =>
      c.includes('month') || c.includes('birthdate') || c.includes('date of birth') || c.includes('birthday') || c.includes('dob')
    );
    const hasAge = cells.some(c => c === 'age');
    if (hasName && (hasBirth || hasAge)) {
      headerIndex = i;
      break;
    }
  }

  // Pass 2: at least 3 required-ish headers
  if (headerIndex === -1) {
    const requiredKw = ['client name', 'email address', 'contact number', 'location', 'date of birth', 'age'];
    for (let i = 0; i < maxScan; i++) {
      const lc = (rows[i] || []).map((c: any) => String(c ?? '').toLowerCase().trim());
      let cnt = 0;
      for (const kw of requiredKw) {
        if (lc.some(cell => cell.includes(kw))) cnt++;
      }
      if (cnt >= 3) { headerIndex = i; break; }
    }
  }

  // Pass 3: fallback – any 2+ supported keywords in a single row
  if (headerIndex === -1) {
    for (let i = 0; i < maxScan; i++) {
      const lc = (rows[i] || []).map((c: any) => normalizeHeader(String(c ?? '')));
      let cnt = 0;
      for (const kw of CLIENT_HEADER_KEYWORDS) {
        if (lc.some(cell => cell.includes(normalizeHeader(kw)))) cnt++;
      }
      if (cnt >= 2) { headerIndex = i; break; }
    }
  }

  if (headerIndex === -1) return { headerScore: 0, dataRows: 0, headerIndex: -1 };

  // Count matched supported headers
  const headerCells = (rows[headerIndex] || []).map((c: any) => normalizeHeader(String(c ?? '')));
  let headerScore = 0;
  for (const kw of CLIENT_HEADER_KEYWORDS) {
    const nkw = normalizeHeader(kw);
    if (headerCells.some(cell => cell.includes(nkw))) headerScore++;
  }

  // Count non-empty data rows below the header
  let dataRows = 0;
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.some((c: any) => String(c ?? '').trim() !== '')) dataRows++;
  }

  return { headerScore, dataRows, headerIndex };
}

/**
 * Inspect ALL worksheets in a workbook, score each for client-data content,
 * and return the rows from the best-matching sheet.
 *
 * Selection strategy (content-driven, no advisor name required):
 *  1. If the workbook has only one sheet, use it.
 *  2. Score every sheet by (headerScore, dataRows).
 *  3. Discard sheets with headerScore === 0 (no recognisable client headers).
 *  4. Among remaining candidates, pick the sheet with the highest headerScore;
 *     break ties by most dataRows.
 *  5. If no sheet has recognisable client headers, throw a descriptive error.
 *
 * The advisor parameter is kept for signature compatibility but is NOT used
 * to filter sheets — the currently selected advisor is the locked destination.
 */
function resolveClientSheetRows(
  wb: any,
  XLSXModule: any,
  advisor: AdvisorRecord | undefined  // retained for compatibility; not used for sheet matching
): any[][] {
  const sheetNames: string[] = wb.SheetNames || [];

  if (sheetNames.length === 0) {
    throw new Error('The uploaded file has no readable sheets.');
  }

  // Single-sheet workbook — use it unconditionally
  if (sheetNames.length === 1) {
    const sheet = wb.Sheets[sheetNames[0]];
    return XLSXModule.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
  }

  // Multi-sheet workbook — score every sheet for client-data content
  interface SheetCandidate {
    name: string;
    rows: any[][];
    headerScore: number;
    dataRows: number;
  }

  const candidates: SheetCandidate[] = [];

  for (const sn of sheetNames) {
    const sheet = wb.Sheets[sn];
    const rows: any[][] = XLSXModule.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
    const { headerScore, dataRows } = scoreSheetForClientData(rows);

    // Only consider sheets that have at least one recognisable client header
    if (headerScore > 0) {
      candidates.push({ name: sn, rows, headerScore, dataRows });
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      'No supported client-data sheet was detected in this workbook. ' +
      'Please verify that the workbook contains client records with supported column headers.'
    );
  }

  // Pick the strongest candidate: highest headerScore, then most dataRows
  candidates.sort((a, b) =>
    b.headerScore !== a.headerScore
      ? b.headerScore - a.headerScore
      : b.dataRows - a.dataRows
  );

  return candidates[0].rows;
}

/**
 * Cross-advisor protection guard.
 *
 * Only blocks the import when the row data's top lines show strong multi-token
 * overlap with a *different* known advisor's name AND zero overlap with the
 * locked advisor's name — meaning the data almost certainly belongs to someone
 * else and was uploaded by mistake.
 *
 * Does NOT block when:
 *  - The locked advisor's name isn't in the data (that's expected for most files)
 *  - The data has no recognisable advisor name at all
 *  - The match with the other advisor is ambiguous / single-token
 */
function assertRowsBelongToAdvisor(rows: any[][], advisor: AdvisorRecord | undefined, allAdvisors: AdvisorRecord[]): void {
  if (!advisor) return;

  // Sample only the non-header-looking top rows (skip rows that look like
  // report titles / advisor name rows — these commonly cause false positives)
  const sampleText = rows.slice(0, 8).map(r => (r || []).join(' ')).join(' ');
  if (!sampleText.trim()) return;

  // If the locked advisor's own name appears in the sample, it's clearly fine
  if (nameTokensOverlap(sampleText, advisor.advisorName)) return;

  // Look for a *different* advisor's name with strong multi-token overlap.
  // Require at least 2 token hits to avoid blocking on common short names.
  const otherMatch = allAdvisors.find(a => {
    if (a.id === advisor.id) return false;
    const nameTokens = normalizeNameForMatch(a.advisorName).split(' ').filter(t => t.length >= 3);
    // Require at least 2 tokens to match to avoid false positives from generic words
    if (nameTokens.length < 2) return false;
    const haystackNorm = normalizeNameForMatch(sampleText);
    let hits = 0;
    nameTokens.forEach(t => { if (haystackNorm.includes(t)) hits++; });
    return hits >= 2;
  });

  if (otherMatch) {
    throw new Error(
      `This file's content appears to belong to "${otherMatch.advisorName}", not "${advisor.advisorName}". ` +
      `Import blocked to prevent cross-advisor data mixing. Please verify you uploaded the correct advisor's file.`
    );
  }
  // No clear cross-advisor signal — allow the import.
  // The selected advisor is already the locked destination.
}

function parseEmbeddedBeneficiary(raw: string): EmbeddedBeneficiaryResult {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.+?)\s*\(([^)]*)\)\s*$/);

  if (!match) {
    return { clientName: trimmed };
  }

  const clientName = match[1].trim();
  const inner = match[2].trim();

  if (!clientName || !inner) {
    return { clientName: trimmed };
  }

  const possessiveMatch = inner.match(/^(.+?)'s\s+(.+)$/i);

  if (possessiveMatch) {
    const beneficiaryName = possessiveMatch[1].trim();
    const relationship = normalizeRelationship(possessiveMatch[2].trim());
    if (beneficiaryName) {
      return { clientName, beneficiaryName, relationship };
    }
  }

  return { clientName, beneficiaryName: inner };
}

function formatBeneficiaryEntry(name: string, relationship?: string): string {
  const trimmedName = name.trim();
  const trimmedRelationship = relationship?.trim();
  return trimmedRelationship ? `${trimmedName} (${trimmedRelationship})` : trimmedName;
}

function parseBeneficiaryEntries(raw: string): BeneficiaryEntry[] {
  if (!raw || !raw.trim()) return [];

  return raw
    .split(/[,;\n\/]+/)
    .map(segment => segment.trim())
    .filter(Boolean)
    .map(segment => {
      const match = segment.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (match) {
        return { name: match[1].trim(), relationship: match[2].trim() };
      }
      return { name: segment, relationship: '' };
    });
}

interface CGPTClientProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const formInputClass = "w-full px-3.5 py-2.5 border border-border rounded-2xl text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-card text-foreground transition-all duration-200";
const formLabelClass = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

function formatBirthdateWithYear(d: Date): string {
  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function CGPTClient({ canCreate, canEdit, canDelete, canExport }: CGPTClientProps) {
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

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedAdvisor]);

  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | 'addAdvisor' | 'editAdvisor' | 'actions' | 'documents' | 'documentPreview' | 'basicInfo' | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<ClientManagementRecord>>({});
  const [currentAdvisor, setCurrentAdvisor] = useState<Partial<AdvisorRecord>>({});

  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [advisorToDelete, setAdvisorToDelete] = useState<string | null>(null);
  const [isDeletingAdvisor, setIsDeletingAdvisor] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [importTarget, setImportTarget] = useState<'clients' | 'advisors'>('clients');
  const [pastedText, setPastedText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [docFormData, setDocFormData] = useState<{ idType: string; idNumber: string; idExpirationDate: string; idAttachmentUrl: string }>({
    idType: '', idNumber: '', idExpirationDate: '', idAttachmentUrl: ''
  });
  const [uploadingDocId, setUploadingDocId] = useState(false);
  const [importAdvisorId, setImportAdvisorId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const effectiveImportAdvisorId = selectedAdvisor ? selectedAdvisor.id : importAdvisorId;

  const [importState, setImportState] = useState<{
    phase: 'idle' | 'reading' | 'password' | 'preview' | 'importing' | 'done' | 'error';
    fileName: string;
    validation: {
      newClients: any[];
      duplicateClients: any[];
      crossAdvisorConflicts: any[];
      invalid: { rowNumber: number; reason: string; rawData: any }[];
      stats: { skippedHeaders: number; skippedEmpty: number; skippedInvalid: number };
    } | null;
    totalRows?: number;
    importedCount?: number;
    updatedCount?: number;
    skippedCount?: number;
    crossAdvisorSkippedCount?: number;
    skippedHeaders?: number;
    skippedEmpty?: number;
    skippedInvalid?: number;
    errorMessage: string;
  }>({
    phase: 'idle',
    fileName: '',
    validation: null,
    totalRows: 0,
    importedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    crossAdvisorSkippedCount: 0,
    skippedHeaders: 0,
    skippedEmpty: 0,
    skippedInvalid: 0,
    errorMessage: ''
  });

  const resetImportState = () => {
    setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, crossAdvisorSkippedCount: 0, skippedHeaders: 0, skippedEmpty: 0, skippedInvalid: 0, errorMessage: '' });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: advisorsData, error: advisorsErr } = await supabase
        .from('advisors')
        .select('*')
        .order('advisor_name', { ascending: true });

      if (advisorsErr) {
        console.error('Supabase Error fetching advisors:', advisorsErr);
      }

      const { data: clientsData, error: clientsErr } = await supabase
        .from('cgpt_clients')
        .select('*, advisor:advisors(*)')
        .order('created_at', { ascending: false });

      let loadedAdvisors: AdvisorRecord[] = [];

      if (advisorsData && advisorsData.length > 0) {
        loadedAdvisors = advisorsData.map((a: any) => ({
          id: a.id,
          advisorCode: a.advisor_code || '',
          advisorName: a.advisor_name || '',
          email: a.email || '',
          createdAt: a.created_at || ''
        }));
      } else if (clientsData && clientsData.length > 0) {
        const advisorMap = new Map<string, AdvisorRecord>();
        clientsData.forEach((c: any) => {
          const advId = c.advisor_id || (c.advisor ? c.advisor.id : null);
          if (advId && !advisorMap.has(advId)) {
            if (c.advisor) {
              advisorMap.set(advId, {
                id: c.advisor.id,
                advisorCode: c.advisor.advisor_code || '',
                advisorName: c.advisor.advisor_name || 'Unknown Advisor',
                email: c.advisor.email || ''
              });
            } else {
              advisorMap.set(advId, {
                id: advId,
                advisorCode: '',
                advisorName: 'Unknown Advisor',
                email: ''
              });
            }
          }
        });
        loadedAdvisors = Array.from(advisorMap.values());
      }

      setAdvisors(loadedAdvisors);

      if (clientsErr || !clientsData) {
        setClients([]);
      } else {
        const mappedClients: ClientManagementRecord[] = clientsData.map((c: any) => ({
          id: c.id,
          advisorId: c.advisor_id || (c.advisor ? c.advisor.id : ''),
          advisor: c.advisor ? {
            id: c.advisor.id,
            advisorCode: c.advisor.advisor_code,
            advisorName: c.advisor.advisor_name,
            email: c.advisor.email
          } : undefined,
          clientName: c.client_name || '',
          relationship: c.relationship || '',
          policyNumber: c.policy_number || '',
          product: c.product || '',
          approvalDate: c.approval_date || '',
          annualPremium: Number(c.annual_premium || 0),
          mobileNumber: c.mobile_number || '',
          email: c.email || '',
          address: c.address || '',
          beneficiary: c.beneficiary || '',
          fundAllocation: c.fund_allocation || '',
          modeOfPayment: c.mode_of_payment || 'Annual',
          birthdate: c.birthdate || '',
          signatureData: c.signature_data || '',
          idType: c.id_type || '',
          idNumber: c.id_number || '',
          idExpirationDate: c.id_expiration_date || '',
          idAttachmentUrl: c.id_attachment_url || '',
          created_at: c.created_at || ''
        }));
        setClients(mappedClients);
      }
    } catch (err) {
      console.error('Error fetching CPST data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const advisorStatsMap = useMemo(() => {
    const map = new Map<string, { totalClients: number; activePolicies: number; totalPremium: number }>();
    advisors.forEach(a => {
      map.set(a.id, { totalClients: 0, activePolicies: 0, totalPremium: 0 });
    });

    clients.forEach(c => {
      if (c.advisorId && map.has(c.advisorId)) {
        const stat = map.get(c.advisorId)!;
        stat.totalClients += 1;
        if (c.policyNumber) stat.activePolicies += 1;
        stat.totalPremium += (c.annualPremium || 0);
      }
    });

    return map;
  }, [advisors, clients]);

  const filteredAdvisors = useMemo(() => {
    return advisors.filter(a => {
      if (!advisorSearch.trim()) return true;
      const s = advisorSearch.toLowerCase();
      return a.advisorName.toLowerCase().includes(s) ||
        a.advisorCode.toLowerCase().includes(s) ||
        a.email.toLowerCase().includes(s);
    });
  }, [advisors, advisorSearch]);

  const advisorClients = useMemo(() => {
    if (!selectedAdvisor) return [];
    return clients.filter(c => c.advisorId === selectedAdvisor.id);
  }, [clients, selectedAdvisor]);

  const advisorDisplayRecords = useMemo(() => {
    if (!selectedAdvisor) return [];
    const records: ClientDisplayRecord[] = [];

    advisorClients.forEach(c => {
      const displayName = c.beneficiary && c.beneficiary.trim()
        ? `${c.clientName} (${c.beneficiary.trim()})`
        : c.clientName;

      records.push({
        id: c.id,
        clientId: c.id,
        name: displayName,
        clientName: c.clientName,
        relationship: c.relationship || '',
        policyNumber: c.policyNumber || '',
        product: c.product || '',
        approvalDate: c.approvalDate || '',
        annualPremium: c.annualPremium || 0,
        mobileNumber: c.mobileNumber || '',
        email: c.email || '',
        address: c.address || '',
        beneficiary: c.beneficiary || '',
        fundAllocation: c.fundAllocation || '',
        modeOfPayment: c.modeOfPayment || 'Annual',
        birthdate: c.birthdate || '',
        created_at: c.created_at || '',
        rawClient: c
      });
    });

    return records;
  }, [advisorClients, selectedAdvisor]);

  const filteredDisplayRecords = useMemo(() => {
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const filtered = advisorDisplayRecords.filter(r => {
      if (birthdayMonthFilter !== 'ALL') {
        const bd = r.rawClient?.birthdate;
        if (!bd) return false;
        const d = new Date(bd + 'T00:00:00');
        if (isNaN(d.getTime())) return false;
        if (MONTH_NAMES[d.getMonth()] !== birthdayMonthFilter) return false;
      }

      if (clientSearch.trim()) {
        const s = clientSearch.toLowerCase();
        const matchName = r.name?.toLowerCase().includes(s);
        const matchClientName = r.clientName?.toLowerCase().includes(s);
        const matchPolicy = r.policyNumber?.toLowerCase().includes(s);
        if (!matchName && !matchClientName && !matchPolicy) return false;
      }
      return true;
    });

    const getBd = (r: ClientDisplayRecord) => {
      const bd = r.rawClient?.birthdate;
      if (!bd) return null;
      const d = new Date(bd + 'T00:00:00');
      return isNaN(d.getTime()) ? null : d;
    };

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'birthday-month' || sortBy === 'birthday-asc') {
        const dA = getBd(a);
        const dB = getBd(b);
        const mA = dA ? dA.getMonth() * 100 + dA.getDate() : 99999;
        const mB = dB ? dB.getMonth() * 100 + dB.getDate() : 99999;
        if (mA !== mB) return mA - mB;
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'newest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      if (sortBy === 'oldest') return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      return 0;
    });

    if (sortBy !== 'birthday-month' && sortBy !== 'birthday-asc') {
      return sorted;
    }

    const result: ClientDisplayRecord[] = [];
    let currentMonth: string | null = null;

    sorted.forEach((record, index) => {
      const bd = getBd(record);
      if (bd) {
        const monthName = MONTH_NAMES[bd.getMonth()].toUpperCase();
        if (monthName !== currentMonth) {
          currentMonth = monthName;
          result.push({
            id: `month-header-${monthName.toLowerCase()}-${index}`,
            clientId: '',
            isMonthHeader: true,
            label: monthName,
            name: monthName,
            clientName: '',
            relationship: '',
            policyNumber: '',
            product: '',
            approvalDate: '',
            annualPremium: 0,
            mobileNumber: '',
            email: '',
            address: '',
            beneficiary: '',
            fundAllocation: '',
            modeOfPayment: '',
            rawClient: record.rawClient
          });
        }
      }
      result.push(record);
    });

    return result;
  }, [advisorDisplayRecords, birthdayMonthFilter, clientSearch, sortBy]);

  const filteredClientOnlyIds = useMemo(
    () => filteredDisplayRecords.filter(r => !r.isMonthHeader).map(r => r.id),
    [filteredDisplayRecords]
  );

  const isAllClientsSelected =
    filteredClientOnlyIds.length > 0 &&
    filteredClientOnlyIds.every(id => selectedIds.includes(id));

  const isSomeClientsSelected =
    filteredClientOnlyIds.some(id => selectedIds.includes(id)) &&
    !isAllClientsSelected;

  const selectedClientIds = useMemo(() => {
    return Array.from(
      new Set(
        selectedIds
          .map(id => {
            const match = advisorDisplayRecords.find(r => r.id === id);
            return match ? match.clientId : null;
          })
          .filter(Boolean) as string[]
      )
    );
  }, [selectedIds, advisorDisplayRecords]);

  const totalClientsCount = clients.length;
  const totalActivePoliciesCount = clients.filter(c => c.policyNumber).length;
  const totalPremiumSum = clients.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0);

  const selectedAdvisorStats = useMemo(() => {
    if (!selectedAdvisor) return { totalClients: 0, activePolicies: 0, totalPremium: 0, productsCount: 0 };
    const list = advisorClients;
    return {
      totalClients: list.length,
      activePolicies: list.filter(c => c.policyNumber).length,
      totalPremium: list.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0),
      productsCount: Array.from(new Set(list.map(c => c.product).filter(Boolean))).length
    };
  }, [selectedAdvisor, advisorClients]);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentClient.clientName || !currentClient.advisorId) {
      return;
    }

    try {
      const payload: ClientRecord = {
        advisor_id: currentClient.advisorId,
        client_name: currentClient.clientName,
        relationship: currentClient.relationship || '',
        policy_number: currentClient.policyNumber || '',
        product: currentClient.product || '',
        approval_date: currentClient.approvalDate || null,
        annual_premium: currentClient.annualPremium || 0,
        mobile_number: currentClient.mobileNumber || '',
        email: currentClient.email || '',
        address: currentClient.address || '',
        beneficiary: currentClient.beneficiary || '',
        fund_allocation: currentClient.fundAllocation || '',
        mode_of_payment: currentClient.modeOfPayment || 'Annual',
        birthdate: currentClient.birthdate || null,
        signature_data: currentClient.signatureData || null,
        id_type: currentClient.idType || null,
        id_number: currentClient.idNumber || null,
        id_expiration_date: currentClient.idExpirationDate || null,
        id_attachment_url: currentClient.idAttachmentUrl || null,
      };

      let result;

      if (currentClient.id) {
        result = await supabase
          .from("cgpt_clients")
          .update(payload)
          .eq("id", currentClient.id)
          .select();
      } else {
        result = await supabase
          .from("cgpt_clients")
          .insert([{ ...payload, id: crypto.randomUUID() }])
          .select();
      }

      if (result.error) {
        alert(`
Code: ${result.error?.code}

Message:
${result.error?.message}

Details:
${result.error?.details}

Hint:
${result.error?.hint}
`);
      }

      setActiveModal(null);
      await fetchData();

    } catch (err) {
      console.error("Catch Error:", err);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setCurrentClient({ ...currentClient, idAttachmentUrl: previewUrl });

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-ids')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('client-ids').getPublicUrl(fileName);
      setCurrentClient({ ...currentClient, idAttachmentUrl: data.publicUrl });
    } catch (err: any) {
      console.error('Error uploading ID:', err);
      alert('Failed to upload ID. Please make sure the client-ids storage bucket exists and is public.');
      setCurrentClient({ ...currentClient, idAttachmentUrl: '' });
    } finally {
      setUploadingId(false);
    }
  };

  const handleSaveDocFields = async () => {
    if (!currentClient.id) return;
    try {
      await supabase.from('cgpt_clients').update({
        id_type: docFormData.idType || null,
        id_number: docFormData.idNumber || null,
        id_expiration_date: docFormData.idExpirationDate || null,
        id_attachment_url: docFormData.idAttachmentUrl || null,
      }).eq('id', currentClient.id);
      setCurrentClient(prev => ({
        ...prev,
        idType: docFormData.idType,
        idNumber: docFormData.idNumber,
        idExpirationDate: docFormData.idExpirationDate,
        idAttachmentUrl: docFormData.idAttachmentUrl,
      }));
      fetchData();
      setDocFormOpen(false);
    } catch (err) {
      console.error('Error saving document fields:', err);
    }
  };

  const handleDocIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDocId(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setDocFormData(prev => ({ ...prev, idAttachmentUrl: previewUrl }));
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('client-ids').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('client-ids').getPublicUrl(fileName);
      setDocFormData(prev => ({ ...prev, idAttachmentUrl: data.publicUrl }));
    } catch (err) {
      console.error('Error uploading document ID:', err);
      alert('Upload failed. Ensure the "client-ids" storage bucket exists and is public.');
      setDocFormData(prev => ({ ...prev, idAttachmentUrl: '' }));
    } finally {
      setUploadingDocId(false);
    }
  };

  const confirmDeleteClient = (id: string) => {
    if (!canDelete) return;
    setClientToDelete(id);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);

    try {
      if (clientToDelete === 'bulk') {
        const targetClientIds = Array.from(
          new Set(
            selectedIds.map(id => {
              const match = advisorDisplayRecords.find(r => r.id === id);
              return match ? match.clientId : null;
            }).filter(Boolean) as string[]
          )
        );

        if (targetClientIds.length === 0) {
          setIsDeleting(false);
          setClientToDelete(null);
          return;
        }

        const CHUNK_SIZE = 150;
        for (let i = 0; i < targetClientIds.length; i += CHUNK_SIZE) {
          const chunk = targetClientIds.slice(i, i + CHUNK_SIZE);

          const { error } = await supabase
            .from('cgpt_clients')
            .delete()
            .in('id', chunk)
            .eq('advisor_id', selectedAdvisor!.id);

          if (error) {
            alert(`Failed to delete clients (batch ${Math.floor(i / CHUNK_SIZE) + 1}).\n\nCode: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details || ''}\nHint: ${error.hint || ''}`);
            setIsDeleting(false);
            return;
          }
        }

        setSelectedIds([]);
      } else {
        const { error } = await supabase
          .from('cgpt_clients')
          .delete()
          .eq('id', clientToDelete);

        if (error) {
          alert(`Failed to delete client.\n\nCode: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details || ''}\nHint: ${error.hint || ''}`);
          setIsDeleting(false);
          return;
        }

        setSelectedIds(prev => prev.filter(id => id !== clientToDelete));
      }

      await fetchData();
      setClientToDelete(null);
    } catch (err: any) {
      alert(`Unexpected error while deleting: ${err?.message || String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdvisor.advisorName || !currentAdvisor.advisorCode) return;

    try {
      const payload = {
        advisor_code: currentAdvisor.advisorCode.trim(),
        advisor_name: currentAdvisor.advisorName.trim(),
        email: currentAdvisor.email?.trim() || '',
      };

      let error = null;

      if (currentAdvisor.id) {
        const res = await supabase.from('advisors').update(payload).eq('id', currentAdvisor.id);
        error = res.error;
      } else {
        const newId = crypto.randomUUID();
        const res = await supabase.from('advisors').insert([{ ...payload, id: newId }]);
        error = res.error;
      }

      if (error) {
        console.error('Supabase Error saving advisor:', error);
        alert(`Failed to save advisor: ${error.message}\nCheck RLS policies or console for details.`);
        return;
      }

      setActiveModal(null);
      fetchData();
    } catch (err) {
      console.error('Exception saving advisor:', err);
      alert('An unexpected exception occurred while saving.');
    }
  };

  const handleDeleteAdvisor = async () => {
    if (!advisorToDelete) return;
    setIsDeletingAdvisor(true);
    try {
      await supabase.from('advisors').delete().eq('id', advisorToDelete);
      if (selectedAdvisor?.id === advisorToDelete) {
        setSelectedAdvisor(null);
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting advisor:', err);
    } finally {
      setIsDeletingAdvisor(false);
      setAdvisorToDelete(null);
    }
  };

  const parseDateFlexible = (raw: string): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
    const dmy = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    const serial = Number(trimmed);
    if (!isNaN(serial) && serial > 10000) {
      const d = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return null;
  };

  const parseClientRows = (rows: any[][]) => {
    let headerIndex = -1;
    const maxScan = Math.min(rows.length, 30);

    for (let i = 0; i < maxScan; i++) {
      const row = rows[i] || [];
      const cells = row.map((cell: any) => String(cell ?? '').toLowerCase().trim());
      const hasExactNameHeader = cells.some(c => c === 'client name / beneficiary name' || c === 'client name');
      const hasMonthOrBirthHeader = cells.some(c =>
        c.includes('month') || c.includes('birthdate') || c.includes('date of birth') || c.includes('birthday') || c.includes('dob')
      );
      const hasAgeHeader = cells.some(c => c === 'age');
      if (hasExactNameHeader && (hasMonthOrBirthHeader || hasAgeHeader)) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      const requiredHeaders = ["client name", "email address", "contact number", "location", "date of birth", "age"];
      for (let i = 0; i < maxScan; i++) {
        const row = rows[i] || [];
        const lowerCells = row.map((cell: any) => String(cell ?? '').toLowerCase().trim());

        let matchCount = 0;
        for (const h of requiredHeaders) {
          if (lowerCells.some(cell => cell.includes(h))) {
            matchCount++;
          }
        }

        if (matchCount >= 3) {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) {
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = (rows[i] || []).map((c: any) => String(c ?? '').toLowerCase().trim());

        if (
          row.some(c => c.includes("client name / beneficiary name")) &&
          row.some(c => c.includes("month")) &&
          row.some(c => c.includes("age"))
        ) {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) {
      throw new Error(
        "Could not detect valid header row."
      );
    }

    const headerRow = rows[headerIndex] || [];
    const findCol = (kw: string[]): number => findColumnIndex(headerRow, kw);

    const nameCol = findCol([
      'client name',
      'client name / beneficiary name',
      'beneficiary name',
      'name'
    ]);
    const emailCol = findCol(['email', 'email address']);
    const mobCol = findCol(['contact number', 'mobile', 'phone', 'contact']);
    const addCol = findCol(['location', 'address']);
    const bdayCol = findCol([
      'date of birth',
      'birthday',
      'dob',
      'month - birthdate',
      'birthdate'
    ]);

    const ageCol = findCol(['age']);
    const policyCol = findCol(['policy number', 'policy#', 'policy no', 'policy #']);
    const productCol = findCol(['product', 'plan', 'policy name', 'plan name']);
    const approvalCol = findCol(['date of approval', 'approval date', 'date_of_approval', 'issue date', 'policy date']);
    const relationshipCol = findCol(['relationship type', 'relationship', 'relation']);

    let beneficiaryNameCol = findCol(['beneficiary name', 'beneficiaryname', 'beneficiary']);
    if (beneficiaryNameCol === nameCol) beneficiaryNameCol = -1;

    const fundAllocationCol = findCol(['fund allocation', 'allocation', 'fund']);
    const paymentModeCol = findCol(['mode of payment']);
    const premiumCol = findCol(['annual premium', 'premium']);

    const MONTH_HEADERS = new Set([
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ]);

    const newClients: Partial<ClientManagementRecord & { _matchedName?: string; _matchedPolicy?: string; age?: string }>[] = [];
    const duplicateClients: Partial<ClientManagementRecord & { _matchedName?: string; _matchedPolicy?: string; age?: string }>[] = [];
    const crossAdvisorConflicts: Partial<ClientManagementRecord & { _matchedName?: string; _matchedPolicy?: string; _conflictAdvisorId?: string; _conflictAdvisorName?: string; age?: string }>[] = [];
    const invalid: { rowNumber: number; reason: string; rawData: any }[] = [];

    let skippedHeaders = 0;
    let skippedEmpty = 0;
    let skippedInvalid = 0;

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((cell: any) => !String(cell).trim())) {
        skippedEmpty++;
        continue;
      }

      const nonEmptyCells = row.map((c: any) => String(c ?? '').trim()).filter(Boolean);
      if (nonEmptyCells.length === 1 && MONTH_HEADERS.has(nonEmptyCells[0].toUpperCase())) {
        skippedHeaders++;
        continue;
      }

      const rowText = row.join(" ").toLowerCase();
      if (
        rowText.includes("report:") ||
        rowText.includes("date generated:") ||
        rowText.includes("data privacy act") ||
        rowText.includes("policy owner")
      ) {
        skippedHeaders++;
        continue;
      }

      const rowNumber = i + 1;
      const rawData: Record<string, any> = {};
      headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

      const rawName = nameCol >= 0
        ? String(row[nameCol] ?? '').trim()
        : '';

      const normalizedRaw = rawName.replace(/\s+/g, ' ').trim().toUpperCase();

      if (!normalizedRaw) {
        skippedEmpty++;
        continue;
      }

      if (normalizedRaw.includes("CLIENTS & BENEFICIARIES")) {
        skippedHeaders++;
        continue;
      }

      if (normalizedRaw === "CLIENT NAME / BENEFICIARY NAME") {
        skippedHeaders++;
        continue;
      }

      if (MONTH_HEADERS.has(normalizedRaw)) {
        skippedHeaders++;
        continue;
      }

      const rawRelationshipValue = relationshipCol >= 0 ? String(row[relationshipCol] ?? '').trim() : '';
      const explicitBeneficiaryRaw = beneficiaryNameCol >= 0 ? String(row[beneficiaryNameCol] ?? '').trim() : '';

      let clientName = rawName;
      let beneficiary = '';
      let relationship = '';

      if (explicitBeneficiaryRaw) {
        const normalizedBenRelationship = normalizeRelationship(rawRelationshipValue);
        beneficiary = explicitBeneficiaryRaw
          .split(/[,;\n\/]+/)
          .map(name => name.trim())
          .filter(Boolean)
          .map(name => formatBeneficiaryEntry(name, normalizedBenRelationship))
          .join(', ');
      } else {
        const embedded = parseEmbeddedBeneficiary(rawName);
        if (embedded.beneficiaryName) {
          clientName = embedded.clientName;
          const normalizedBenRelationship = embedded.relationship || normalizeRelationship(rawRelationshipValue);
          beneficiary = formatBeneficiaryEntry(embedded.beneficiaryName, normalizedBenRelationship);
        } else {
          relationship = rawRelationshipValue;
        }
      }

      const mobileNumber = mobCol >= 0 ? String(row[mobCol] ?? '').trim() : '';
      const email = emailCol >= 0 ? String(row[emailCol] ?? '').trim() : '';
      const address = addCol >= 0 ? String(row[addCol] ?? '').trim() : '';
      const rawBday = bdayCol >= 0 ? String(row[bdayCol] ?? '').trim() : '';
      const birthdate = rawBday ? (parseDateFlexible(rawBday) || rawBday) : '';
      const age = ageCol >= 0 ? String(row[ageCol] ?? '').trim() : '';
      const policyNumber = policyCol >= 0 ? String(row[policyCol] ?? '').trim() : '';
      const product = productCol >= 0 ? String(row[productCol] ?? '').trim() : '';
      const approvalDate = approvalCol >= 0
        ? parseDateFlexible(String(row[approvalCol] ?? '').trim()) || ''
        : '';

      const fundAllocation = fundAllocationCol >= 0 ? String(row[fundAllocationCol] ?? '').trim() : '';
      const modeOfPayment = paymentModeCol >= 0
        ? String(row[paymentModeCol] ?? '').trim()
        : ' ';
      const annualPremium = premiumCol >= 0
        ? parseFloat(String(row[premiumCol] ?? '').replace(/[^0-9.]/g, '')) || 0
        : 0;

      if (!clientName) {
        skippedInvalid++;
        invalid.push({ rowNumber, reason: 'Missing Client Name', rawData });
        continue;
      }

      const match = clients.find(c =>
        (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
        (mobileNumber && c.mobileNumber && c.mobileNumber === mobileNumber) ||
        (policyNumber && c.policyNumber === policyNumber) ||
        (!policyNumber && c.clientName.toLowerCase() === clientName.toLowerCase() && c.birthdate === birthdate)
      );

      const record = {
        clientName,
        mobileNumber,
        email,
        address,
        birthdate,
        age,
        relationship,
        policyNumber,
        product,
        approvalDate,
        annualPremium,
        beneficiary,
        fundAllocation,
        modeOfPayment
      };

      if (match) {
        if (match.advisorId === effectiveImportAdvisorId) {
          duplicateClients.push({
            ...record,
            _matchedName: match.clientName,
            _matchedPolicy: match.policyNumber
          });
        } else {
          const conflictAdvisor = advisors.find(a => a.id === match.advisorId);
          crossAdvisorConflicts.push({
            ...record,
            _matchedName: match.clientName,
            _matchedPolicy: match.policyNumber,
            _conflictAdvisorId: match.advisorId,
            _conflictAdvisorName: conflictAdvisor?.advisorName || 'Another Advisor'
          });
        }
        continue;
      }

      newClients.push(record);
    }

    return { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats: { skippedHeaders, skippedEmpty, skippedInvalid } };
  };

  const parseAdvisorRows = (rows: any[][]) => {
    let headerIndex = -1;
    const requiredHeaders = ["advisor name", "advisor code", "name", "code"];

    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i] || [];
      const lowerCells = row.map(cell => String(cell).toLowerCase().trim());

      let matchCount = 0;
      for (const h of requiredHeaders) {
        if (lowerCells.some(cell => cell.includes(h))) {
          matchCount++;
        }
      }

      if (matchCount >= 2) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("Could not detect valid header row. Ensure template contains Advisor Name and Advisor Code.");
    }

    const headerRow = rows[headerIndex] || [];
    const findCol = (kw: string[]): number => findColumnIndex(headerRow, kw);

    const nameCol = findCol([
      'client name',
      'client name / beneficiary name',
      'beneficiary name',
      'name'
    ]);
    const codeCol = findCol(['advisor code', 'code']);
    const emailCol = findCol(['email', 'email address']);

    const newClients: Partial<AdvisorRecord>[] = [];
    const duplicateClients: Partial<AdvisorRecord>[] = [];
    const invalid: { rowNumber: number; reason: string; rawData: any }[] = [];
    let skippedHeaders = 0;
    let skippedEmpty = 0;
    let skippedInvalid = 0;

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((cell: any) => !String(cell).trim())) {
        skippedEmpty++;
        continue;
      }

      const rowText = row.join(" ").toLowerCase();
      if (rowText.includes("report:") || rowText.includes("date generated:")) {
        skippedHeaders++;
        continue;
      }

      const rowNumber = i + 1;
      const rawData: Record<string, any> = {};
      headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

      const advisorName = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
      const advisorCode = codeCol >= 0 ? String(row[codeCol] ?? '').trim() : '';
      const email = emailCol >= 0 ? String(row[emailCol] ?? '').trim() : '';

      if (!advisorName || !advisorCode) {
        skippedInvalid++;
        invalid.push({ rowNumber, reason: 'Missing Name or Code', rawData });
        continue;
      }

      newClients.push({ advisorName, advisorCode, email });
    }

    return { newClients, duplicateClients, crossAdvisorConflicts: [] as any[], invalid, stats: { skippedHeaders, skippedEmpty, skippedInvalid } };
  };

  const handleDecryptAndImport = async () => {
    if (!importFile) return;
    setImportState(prev => ({ ...prev, phase: 'reading' }));

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("password", password);

      const res = await fetch("/api/import/decrypt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errJson = contentType?.includes("application/json") ? await res.json() : null;
        throw new Error(errJson?.error || `Decryption failed (${res.status}). Please check the password.`);
      }

      const decryptedBlob = await res.blob();
      const decryptedFile = new File([decryptedBlob], importFile.name, {
        type: importFile.type,
      });

      await parseDecryptedFile(decryptedFile);
    } catch (err) {
      setImportState({
        phase: 'password',
        fileName: importFile.name,
        validation: null,
        importedCount: 0,
        errorMessage: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const processAndImportClients = async (
    validRows: Partial<ClientManagementRecord>[],
    fileName: string,
    targetAdvisorId: string,
    parseStats?: { skippedHeaders: number; skippedEmpty: number; skippedInvalid: number }
  ) => {
    if (validRows.length === 0 || !targetAdvisorId) return;
    setImportState(prev => ({ ...prev, phase: 'importing', fileName }));

    const parseDate = (value: any) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    };

    try {
      const { data: allExistingClients, error: fetchErr } = await supabase
        .from('cgpt_clients')
        .select('id, advisor_id, email, mobile_number, policy_number, client_name, birthdate');

      if (fetchErr) throw fetchErr;

      const matchesExisting = (record: Partial<ClientManagementRecord>, existing: any) => {
        const recordEmail = (record.email || '').toLowerCase().trim();
        const recordMobile = (record.mobileNumber || '').trim();
        const recordPolicy = (record.policyNumber || '').trim();
        const recordName = (record.clientName || '').toLowerCase().trim();
        const recordBirthdate = (record as any).birthdate || '';

        if (recordEmail && existing.email && String(existing.email).toLowerCase().trim() === recordEmail) return true;
        if (recordMobile && existing.mobile_number && String(existing.mobile_number).trim() === recordMobile) return true;
        if (recordPolicy && existing.policy_number && String(existing.policy_number).trim() === recordPolicy) return true;
        if (!recordPolicy && recordName && existing.client_name && String(existing.client_name).toLowerCase().trim() === recordName && existing.birthdate === recordBirthdate) return true;
        return false;
      };

      const recordsToInsert: any[] = [];
      let importedCount = 0;
      let skippedCount = 0;
      let crossAdvisorSkippedCount = 0;

      for (const record of validRows) {
        const inBatchMatch = recordsToInsert.find(r => matchesExisting(record, {
          email: r.email,
          mobile_number: r.mobile_number,
          policy_number: r.policy_number,
          client_name: r.client_name,
          birthdate: r.birthdate
        }));

        if (inBatchMatch) {
          skippedCount++;
          continue;
        }

        const existingMatch = (allExistingClients || []).find(c => matchesExisting(record, c));

        if (existingMatch) {
          if (existingMatch.advisor_id === targetAdvisorId) {
            skippedCount++;
          } else {
            crossAdvisorSkippedCount++;
          }
          continue;
        }

        recordsToInsert.push({
          id: crypto.randomUUID(),
          advisor_id: targetAdvisorId,
          client_name: record.clientName,
          relationship: record.relationship || '',
          policy_number: record.policyNumber || null,
          product: record.product || null,
          approval_date: parseDate(record.approvalDate),
          birthdate: parseDate((record as any).birthdate),
          annual_premium: record.annualPremium || 0,
          mobile_number: record.mobileNumber || '',
          email: record.email || '',
          address: record.address || '',
          beneficiary: record.beneficiary || '',
          fund_allocation: record.fundAllocation || '',
          mode_of_payment: record.modeOfPayment || 'Annual',
        });
        importedCount++;
      }

      if (recordsToInsert.length > 0) {
        const { error } = await supabase.from('cgpt_clients').insert(recordsToInsert).select();
        if (error) throw error;
      }

      setImportState(prev => ({
        ...prev,
        phase: 'done',
        totalRows: validRows.length + (parseStats ? parseStats.skippedHeaders + parseStats.skippedEmpty + parseStats.skippedInvalid : 0),
        importedCount,
        updatedCount: 0,
        skippedCount,
        crossAdvisorSkippedCount,
        skippedHeaders: parseStats?.skippedHeaders || 0,
        skippedEmpty: parseStats?.skippedEmpty || 0,
        skippedInvalid: parseStats?.skippedInvalid || 0
      }));
      fetchData();
    } catch (err) {
      setImportState(prev => ({
        ...prev,
        phase: 'error',
        errorMessage: typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message) : String(err)
      }));
    }
  };

  const processAndImportAdvisors = async (
    validRows: Partial<AdvisorRecord>[],
    fileName: string,
    parseStats?: { skippedHeaders: number; skippedEmpty: number; skippedInvalid: number }
  ) => {
    if (validRows.length === 0) return;
    setImportState(prev => ({ ...prev, phase: 'importing', fileName }));

    try {
      const { data: existingAdvisors } = await supabase.from('advisors').select('id, advisor_code, email');

      const recordsToUpsert: any[] = [];
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const record of validRows) {
        const existing = existingAdvisors?.find(a =>
          (a.advisor_code && record.advisorCode && a.advisor_code.toLowerCase() === record.advisorCode.toLowerCase()) ||
          (a.email && record.email && a.email.toLowerCase() === record.email.toLowerCase())
        );

        const existingInBatch = recordsToUpsert.find(a =>
          (a.advisor_code && record.advisorCode && a.advisor_code.toLowerCase() === record.advisorCode.toLowerCase()) ||
          (a.email && record.email && a.email.toLowerCase() === record.email.toLowerCase())
        );

        if (existingInBatch) {
          skippedCount++;
          continue;
        }

        let id = '';
        if (existing) {
          id = existing.id;
          updatedCount++;
        } else {
          id = crypto.randomUUID();
          importedCount++;
        }

        recordsToUpsert.push({
          id,
          advisor_code: record.advisorCode,
          advisor_name: record.advisorName,
          email: record.email || ''
        });
      }

      const { error } = await supabase.from('advisors').upsert(recordsToUpsert).select();
      if (error) throw error;

      setImportState(prev => ({
        ...prev,
        phase: 'done',
        totalRows: validRows.length + (parseStats ? parseStats.skippedHeaders + parseStats.skippedEmpty + parseStats.skippedInvalid : 0),
        importedCount,
        updatedCount,
        skippedCount,
        skippedHeaders: parseStats?.skippedHeaders || 0,
        skippedEmpty: parseStats?.skippedEmpty || 0,
        skippedInvalid: parseStats?.skippedInvalid || 0
      }));
      fetchData();
    } catch (err) {
      setImportState(prev => ({
        ...prev,
        phase: 'error',
        errorMessage: typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message) : String(err)
      }));
    }
  };

  const parseDecryptedFile = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

      let rows: any[][];
      if (importTarget === 'clients') {
        const lockedAdvisor = advisors.find(a => a.id === effectiveImportAdvisorId);
        rows = resolveClientSheetRows(wb, XLSX, lockedAdvisor);
        assertRowsBelongToAdvisor(rows, lockedAdvisor, advisors);
      } else {
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });
      }

      if (importTarget === 'clients') {
        const { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } = parseClientRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } as any }));
      } else {
        const { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } = parseAdvisorRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } as any }));
      }
    } catch (err) {
      setImportState({
        phase: 'error',
        fileName: file.name,
        validation: null,
        importedCount: 0,
        errorMessage: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const extractRowsFromText = (rawText: string): any[][] => {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const rows: string[][] = lines.map(line => line.split(/\t|,|;|\|/).map(c => c.trim()));
    const isSingleCol = rows.every(r => r.length === 1);
    if (isSingleCol) {
      return lines.map(line => line.split(/\s{2,}/).map(c => c.trim()));
    }
    return rows;
  };

  const handleFileSelected = async (file: File) => {
    if (importTarget === 'clients' && !effectiveImportAdvisorId) {
      setImportState({ phase: 'error', fileName: file.name, validation: null, importedCount: 0, errorMessage: 'Please select an Advisor before uploading clients.' });
      return;
    }

    setImportState({ phase: 'reading', fileName: file.name, validation: null, importedCount: 0, errorMessage: '' });

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const lockedAdvisor = advisors.find(a => a.id === effectiveImportAdvisorId);

      if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let allText = '';
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const tc = await page.getTextContent();
          allText += tc.items.map((i: any) => i.str).join(' ') + '\n';
        }
        const rows = extractRowsFromText(allText);
        if (importTarget === 'clients') {
          assertRowsBelongToAdvisor(rows, lockedAdvisor, advisors);
          const result = parseClientRows(rows);
          setImportState(prev => ({ ...prev, phase: 'preview', validation: result as any }));
        } else {
          const result = parseAdvisorRows(rows);
          setImportState(prev => ({ ...prev, phase: 'preview', validation: result as any }));
        }
        return;
      }

      if (ext === 'docx' || ext === 'doc') {
        const mammoth = await import('mammoth');
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        const rows = extractRowsFromText(result.value);
        if (importTarget === 'clients') {
          assertRowsBelongToAdvisor(rows, lockedAdvisor, advisors);
          const r = parseClientRows(rows);
          setImportState(prev => ({ ...prev, phase: 'preview', validation: r as any }));
        } else {
          const r = parseAdvisorRows(rows);
          setImportState(prev => ({ ...prev, phase: 'preview', validation: r as any }));
        }
        return;
      }

      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();

      let isEncryptedMagic = false;
      if (buffer.byteLength >= 4) {
        const view = new DataView(buffer);
        const magic = view.getUint32(0, false);
        if (magic === 0xD0CF11E0) isEncryptedMagic = true;
      }

      if (isEncryptedMagic) {
        throw new Error("Decryption password required: password-protected Excel file.");
      }

      const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

      let rows: any[][];
      if (importTarget === 'clients') {
        rows = resolveClientSheetRows(wb, XLSX, lockedAdvisor);
        assertRowsBelongToAdvisor(rows, lockedAdvisor, advisors);
      } else {
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });
      }

      if (importTarget === 'clients') {
        const { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } = parseClientRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } as any }));
      } else {
        const { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } = parseAdvisorRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } as any }));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isPasswordProtected = errMsg.toLowerCase().includes('password') ||
        errMsg.toLowerCase().includes('decrypt') ||
        errMsg.toLowerCase().includes('crypto') ||
        errMsg.toLowerCase().includes('unsupported file') ||
        errMsg.toLowerCase().includes('invalid signature') ||
        errMsg.toLowerCase().includes('wrong password');

      if (isPasswordProtected) {
        setImportFile(file);
        setImportState({ phase: 'password', fileName: file.name, validation: null, importedCount: 0, errorMessage: '' });
      } else {
        setImportState({ phase: 'error', fileName: file.name, validation: null, importedCount: 0, errorMessage: errMsg });
      }
    }
  };

  const handlePasteImport = async (text: string) => {
    if (importTarget === 'clients' && !effectiveImportAdvisorId) {
      setImportState({ phase: 'error', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: 'Please select an Advisor before importing clients.' });
      return;
    }

    setImportState({ phase: 'reading', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: '' });

    try {
      if (!text.trim()) throw new Error("Pasted data is empty.");
      const rows = text.split(/\r?\n/).map(row => row.split('\t'));
      if (rows.length < 2) throw new Error("No data found or insufficient rows.");

      if (importTarget === 'clients') {
        const lockedAdvisor = advisors.find(a => a.id === effectiveImportAdvisorId);
        assertRowsBelongToAdvisor(rows, lockedAdvisor, advisors);
        const { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } = parseClientRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } as any }));
      } else {
        const { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } = parseAdvisorRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, crossAdvisorConflicts, invalid, stats } as any }));
      }
    } catch (err) {
      setImportState({ phase: 'error', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const exportToCSV = () => {
    const clientRows = filteredDisplayRecords.filter(r => !r.isMonthHeader);
    if (!canExport || clientRows.length === 0) return;
    const headers = ['Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Annual Premium', 'Mobile', 'Email', 'Address', 'Beneficiary', 'Payment Mode'];
    const rows = clientRows.map(c => [
      c.name,
      c.relationship,
      c.policyNumber,
      c.product,
      c.approvalDate,
      c.annualPremium,
      c.mobileNumber,
      c.email,
      c.address,
      c.beneficiary,
      c.modeOfPayment
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => '"' + String(v || '') + '"').join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedAdvisor ? selectedAdvisor.advisorName.toLowerCase().replace(/\s+/g, '_') : 'client'}_registry.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const clientRows = filteredDisplayRecords.filter(r => !r.isMonthHeader);
    if (!canExport || clientRows.length === 0) return;
    const headers = ['Name', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Payment Mode'];
    const rows = clientRows.map(c => [
      c.name,
      c.policyNumber || '—',
      c.product || '—',
      c.approvalDate || '—',
      `PHP ${c.annualPremium?.toLocaleString()}`,
      c.mobileNumber || '—',
      c.email || '—',
      c.modeOfPayment || '—'
    ]);
    exportToPDF({
      title: `${selectedAdvisor ? selectedAdvisor.advisorName : 'Advisor'} - Client Registry`,
      description: `Sun Life Financial - Official record of active clients assigned to ${selectedAdvisor?.advisorName || 'Advisor'}.`,
      headers,
      rows,
      filename: `${selectedAdvisor ? selectedAdvisor.advisorName.toLowerCase().replace(/\s+/g, '_') : 'advisor'}_clients_${new Date().toISOString().slice(0, 10)}.pdf`,
      stats: [
        { label: 'Total Clients', value: selectedAdvisorStats.totalClients },
        { label: 'Active Policies', value: selectedAdvisorStats.activePolicies },
        { label: 'Total Premiums', value: `PHP ${selectedAdvisorStats.totalPremium.toLocaleString()}` }
      ]
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    const clientRows = filteredDisplayRecords.filter(r => !r.isMonthHeader);
    if (!canExport || clientRows.length === 0) return;
    const headers = ['Name', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Payment Mode'];

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'word') {
      const rows = clientRows.map(c => [
        c.name,
        c.policyNumber || '—',
        c.product || '—',
        c.approvalDate || '—',
        `PHP ${c.annualPremium?.toLocaleString()}`,
        c.mobileNumber || '—',
        c.email || '—',
        c.modeOfPayment || '—'
      ]);
      exportToDOCS(
        `${selectedAdvisor ? selectedAdvisor.advisorName : 'Advisor'} - Client Registry`,
        headers,
        rows,
        `${selectedAdvisor ? selectedAdvisor.advisorName.toLowerCase().replace(/\s+/g, '_') : 'advisor'}_clients_${new Date().toISOString().slice(0, 10)}.doc`
      );
    }
  };

  return (
    <div className={styles.text_52}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_53}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.div_54}>
          <div className="flex flex-col space-y-2 border-b border-border/50 pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <span>Client Management Tracker</span>
              <ChevronRight size={14} />
              <button
                onClick={() => setSelectedAdvisor(null)}
                className={`hover:underline ${!selectedAdvisor ? 'text-primary font-bold' : 'text-text-secondary'}`}
              >
                Advisor Registry
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
                <h1 className={styles.text_56}>
                  {selectedAdvisor ? selectedAdvisor.advisorName : 'Advisor Birthday Center'}
                </h1>
                <p className="text-xs text-text-secondary mt-1 max-w-2xl">
                  {selectedAdvisor
                    ? `Client Birthday Center for Advisor Code: ${selectedAdvisor.advisorCode}`
                    : 'Client Greetings & Presentation Tracker (CGPT) main center.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedAdvisor && (
                  <button onClick={() => setSelectedAdvisor(null)} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-[11.5px] font-bold hover:bg-surface-2 active:scale-[0.97] transition-all duration-200">
                    <ArrowLeft size={14} /> Back to Advisor Center
                  </button>
                )}

                {canCreate && !selectedAdvisor && (
                  <button
                    onClick={() => {
                      setCurrentAdvisor({});
                      setActiveModal('addAdvisor');
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-transparent bg-gradient-to-r from-amber-500 to-[#F4C542] text-black text-[11.5px] font-extrabold shadow-sm hover:shadow-md hover:from-amber-600 hover:to-[#e6b800] transition-all duration-200 active:scale-[0.98]"
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
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-transparent bg-primary text-black text-[11.5px] font-extrabold shadow-sm hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Plus size={14} /> Add Client
                  </button>
                )}

                <button
                  onClick={() => {
                    setImportTarget(selectedAdvisor ? 'clients' : 'advisors');
                    setImportAdvisorId(selectedAdvisor?.id || advisors[0]?.id || '');
                    setActiveModal('import');
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border bg-card text-text text-[11.5px] font-bold shadow-sm hover:bg-surface-2 transition-all duration-200 active:scale-[0.98]"
                >
                  <Upload size={14} /> Import File
                </button>
              </div>
            </div>
          </div>

          {!selectedAdvisor ? (
            <div className="space-y-6">
              <div className={styles.container_61}>
                <div className={styles.container_62}>
                  {[
                    { label: 'TOTAL ADVISORS', count: advisors.length, link: 'ADVISORS', color: 'text-foreground', icon: Users, isYellowBorder: true },
                    { label: 'TOTAL CLIENTS', count: totalClientsCount, link: 'CLIENTS', color: 'text-blue-500 dark:text-blue-400', icon: UserCheck },
                    { label: 'ACTIVE POLICIES', count: totalActivePoliciesCount, link: 'POLICIES', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
                    { label: 'TOTAL PREMIUM', count: `₱${totalPremiumSum.toLocaleString()}`, link: 'PHP', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Target },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={i}
                        className={`${styles.card_227} ${stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/10' : 'border-border'} flex flex-col justify-between`}
                      >
                        <div className={styles.table_63}>
                          <span>{stat.label}</span>
                          <Icon size={12} className={styles.text_64} />
                        </div>
                        <div className={styles.container_65}>
                          <span className={styles.text_66}>{stat.count}</span>
                          <span className={`${styles.table_228} ${stat.color}`}>{stat.link}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.card_67}>
                  <div>
                    <div className={styles.container_68}>
                      <FileSpreadsheet size={15} className={styles.text_69} />
                      <h3 className={styles.table_70}>CGPT Batch Import</h3>
                    </div>
                    <p className={styles.text_71}>
                      Upload Excel or CSV files to batch import clients under a selected advisor, or batch import new advisors.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setImportTarget('clients');
                      setImportAdvisorId(advisors[0]?.id || '');
                      setActiveModal('import');
                    }}
                    className={styles.table_72}
                  >
                    <Upload size={14} /> Upload Files
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
                <div className="relative flex-1 w-full group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search advisor by name, code, or email..."
                    value={advisorSearch}
                    onChange={e => setAdvisorSearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-full h-11 pl-11 pr-4 text-sm text-text transition duration-200 focus:outline-none focus:border-[#F4C542] focus:ring-4 focus:ring-[#F4C542]/10"
                  />
                </div>
              </div>

              <div className={styles.card_85}>
                <div className={styles.div_86}>
                  <table className={styles.text_87}>
                    <thead>
                      <tr className={styles.table_88}>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-text-secondary">Advisor Details</th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-text-secondary">Advisor Code</th>
                        <th className="py-3.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-text-secondary">Email</th>
                        <th className="py-3.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-text-secondary">Total Clients</th>
                        <th className="py-3.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-text-secondary">Active Policies</th>
                        <th className="py-3.5 px-4 text-right font-bold text-xs uppercase tracking-wider text-text-secondary">Total Premium</th>
                        <th className="py-3.5 px-4 text-right font-bold text-xs uppercase tracking-wider text-text-secondary sticky right-0 bg-surface-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={styles.div_96}>
                      {loading ? (
                        <tr><td colSpan={7} className="py-8 text-center text-text-secondary text-sm">Loading advisors...</td></tr>
                      ) : filteredAdvisors.map(adv => {
                        const stat = advisorStatsMap.get(adv.id) || { totalClients: 0, activePolicies: 0, totalPremium: 0 };
                        return (
                          <tr key={adv.id} className="group border-b border-border/40 last:border-0 hover:bg-surface-2/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-text text-sm flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                                {adv.advisorName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-text">{adv.advisorName}</div>
                                <div className="text-[11px] text-text-secondary font-normal md:hidden">{adv.advisorCode}</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono font-semibold text-text-secondary">
                              <span className="bg-surface-2 px-2.5 py-1 rounded-md border border-border/60">{adv.advisorCode}</span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-text-secondary">{adv.email || '—'}</td>
                            <td className="py-3.5 px-4 text-center text-sm font-bold font-mono text-text">
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{stat.totalClients}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center text-xs font-bold text-green-600 dark:text-green-400">
                              {stat.activePolicies}
                            </td>
                            <td className="py-3.5 px-4 text-right text-xs font-bold text-[#A97800] dark:text-[#F4C542]">
                              ₱{stat.totalPremium.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right sticky right-0 bg-card group-hover:bg-surface-2/50 text-xs">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedAdvisor(adv)}
                                  className="px-3.5 py-1.5 bg-primary text-black font-extrabold text-xs rounded-full hover:bg-primary/80 transition-all duration-200 shadow-sm cursor-pointer active:scale-95 flex items-center gap-1"
                                >
                                  <span>View Clients</span>
                                  <ChevronRight size={12} />
                                </button>
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setCurrentAdvisor(adv);
                                      setActiveModal('editAdvisor');
                                    }}
                                    className="p-2 text-muted hover:text-[#F4C542] transition-colors rounded-full hover:bg-surface-2 border border-transparent hover:border-border"
                                    title="Edit Advisor"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => setAdvisorToDelete(adv.id)}
                                    className="p-2 text-muted hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                    title="Delete Advisor"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!loading && filteredAdvisors.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-text-secondary text-sm">No advisors found matching search criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-linear-to-tr from-[#F4C542] to-[#e6b800] text-black font-black text-xl flex items-center justify-center shadow-md">
                    {selectedAdvisor.advisorName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text">{selectedAdvisor.advisorName}</h2>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                      <span className="bg-surface-2 px-3 py-1 rounded-full font-mono font-semibold border border-border">
                        Advisor Code: {selectedAdvisor.advisorCode}
                      </span>
                      <span>{selectedAdvisor.email || 'No email registered'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                  <div className="bg-surface-2/60 border border-border rounded-2xl p-3.5 text-center min-w-[110px]">
                    <span className="block text-[10px] font-bold text-text-secondary uppercase">Total Clients</span>
                    <span className="text-lg font-bold font-serif text-text mt-0.5 block">{selectedAdvisorStats.totalClients}</span>
                  </div>
                  <div className="bg-surface-2/60 border border-border rounded-2xl p-3.5 text-center min-w-[110px]">
                    <span className="block text-[10px] font-bold text-text-secondary uppercase">Active Policies</span>
                    <span className="text-lg font-bold font-serif text-green-600 dark:text-green-400 mt-0.5 block">{selectedAdvisorStats.activePolicies}</span>
                  </div>
                  <div className="bg-surface-2/60 border border-border rounded-2xl p-3.5 text-center min-w-[110px]">
                    <span className="block text-[10px] font-bold text-text-secondary uppercase">Total Premium</span>
                    <span className="text-lg font-bold font-serif text-[#A97800] dark:text-[#F4C542] mt-0.5 block">₱{selectedAdvisorStats.totalPremium.toLocaleString()}</span>
                  </div>
                  <div className="bg-surface-2/60 border border-border rounded-2xl p-3.5 text-center min-w-[110px]">
                    <span className="block text-[10px] font-bold text-text-secondary uppercase">Products</span>
                    <span className="text-lg font-bold font-serif text-blue-500 mt-0.5 block">{selectedAdvisorStats.productsCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
                <div className="relative flex-1 w-full md:max-w-md group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search client name, policy number..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl h-10 pl-11 pr-4 text-[11.5px] text-text transition duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select value={birthdayMonthFilter} onChange={e => setBirthdayMonthFilter(e.target.value)} className="h-10 px-4 bg-surface border border-border rounded-xl text-[11.5px] font-semibold text-text focus:outline-none focus:border-primary">
                    <option value="ALL">🎂 All Months</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-10 px-4 bg-surface border border-border rounded-xl text-[11.5px] font-semibold text-text focus:outline-none focus:border-primary">
                    <option value="birthday-month">🗓 Birthday Calendar (Jan → Dec)</option>
                    <option value="name">Name A-Z</option>
                    <option value="newest">Newest Added</option>
                    <option value="oldest">Oldest Added</option>
                  </select>
                  {canExport && (
                    <ExportDropdown onExport={handleExport} />
                  )}
                  {selectedClientIds.length > 0 && (
                    <button
                      onClick={() => setClientToDelete('bulk')}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[11.5px] font-bold hover:bg-red-500/20 active:scale-[0.97] transition-all duration-200 whitespace-nowrap border border-red-500/20"
                    >
                      Delete Selected ({selectedClientIds.length})
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-surface-2/60 border-b border-border/80">
                        <th className="py-4 px-4 text-left">
                          <input
                            type="checkbox"
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeClientsSelected;
                            }}
                            checked={isAllClientsSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev =>
                                  Array.from(new Set([...prev, ...filteredClientOnlyIds]))
                                );
                              } else {
                                const filteredIdSet = new Set(filteredClientOnlyIds);
                                setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
                              }
                            }}
                            className="rounded border-border/50 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer w-4 h-4"
                            title={isAllClientsSelected ? "Deselect all visible" : "Select all visible"}
                          />
                        </th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Client Name / Beneficiary Name</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">MONTH - BIRTHDATE</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Age</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary text-right sticky right-0 bg-surface-2/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {loading ? (
                        <tr><td colSpan={5} className="py-8 text-center text-text-secondary text-[11.5px]">Loading records...</td></tr>
                      ) : (() => {
                        let clientRowIndex = 0;
                        return filteredDisplayRecords.map((record) => {
                          if (record.isMonthHeader) {
                            return (
                              <tr key={record.id} className="bg-amber-100/70 dark:bg-amber-500/15 border-y border-amber-300/60 dark:border-amber-500/30">
                                <td colSpan={5} className="py-2.5 px-4 text-center font-extrabold text-[12px] uppercase tracking-widest text-amber-900 dark:text-amber-300 select-none">
                                  {record.label || record.name}
                                </td>
                              </tr>
                            );
                          }

                          clientRowIndex++;
                          const currentDisplayIndex = clientRowIndex;

                          let formattedBirthdate = '—';
                          let age: string | number = '—';
                          const rawBd = record.rawClient?.birthdate;
                          if (rawBd) {
                            const d = new Date(rawBd + 'T00:00:00');
                            if (!isNaN(d.getTime())) {
                              formattedBirthdate = formatBirthdateWithYear(d);
                              const today = new Date();
                              let calcAge = today.getFullYear() - d.getFullYear();
                              const hasHadBirthday =
                                today.getMonth() > d.getMonth() ||
                                (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
                              if (!hasHadBirthday) calcAge--;
                              age = `${calcAge}yrs`;
                            }
                          }
                          return (
                            <tr key={record.id} className="group hover:bg-surface-2/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(record.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedIds([...selectedIds, record.id]);
                                      else setSelectedIds(selectedIds.filter(id => id !== record.id));
                                    }}
                                    className="rounded border-border/50 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer w-4 h-4"
                                  />
                                  <span className="text-[11.5px] text-text-secondary font-mono">{currentDisplayIndex}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-text text-[12.5px]">{record.name}</div>
                              </td>
                              <td className="py-3 px-4 text-text-secondary text-[11.5px]">{formattedBirthdate}</td>
                              <td className="py-3 px-4 text-text-secondary text-[11.5px]">{age}</td>
                              <td className="py-2.5 px-4 text-right sticky right-0 bg-card group-hover:bg-surface-2/40 transition-colors">
                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button onClick={() => { setCurrentClient(record.rawClient); setActiveModal('actions'); }} className="p-2 text-muted hover:text-blue-500 transition-colors duration-200 bg-card border border-transparent hover:border-blue-500 rounded-full shadow-sm" title="Forms & Services">
                                    <MoreVertical size={14} />
                                  </button>
                                  {canEdit && (
                                    <button onClick={() => { setCurrentClient(record.rawClient); setActiveModal('edit'); }} className="p-2 text-muted hover:text-[#F4C542] transition-colors duration-200 bg-card border border-transparent hover:border-primary rounded-full shadow-sm" title="Edit">
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button onClick={() => confirmDeleteClient(record.clientId)} className="p-2 text-muted hover:text-red-500 transition-colors duration-200 bg-card border border-transparent hover:border-red-500 rounded-full shadow-sm" title="Delete">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                      {!loading && filteredDisplayRecords.filter(r => !r.isMonthHeader).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-secondary text-sm">No records assigned to this advisor matching search criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/45 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md h-full rounded-[28px] shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 shrink-0">
              <div>
                <h2 className="text-base font-bold text-text">{currentClient.id ? 'Edit Client Details' : 'Add New Client'}</h2>
                <p className="text-xs text-text-secondary">Enter client parameters into the management ledger.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2.5 text-muted hover:text-text hover:bg-slate-200 rounded-full transition-colors duration-200">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <form id="cgpt-form" onSubmit={handleSaveClient} className="space-y-4 text-left">
                {!selectedAdvisor && (
                  <div>
                    <label className={formLabelClass}>Advisor <span className="text-red-500">*</span></label>
                    <select
                      value={currentClient.advisorId || ''}
                      onChange={e => setCurrentClient({ ...currentClient, advisorId: e.target.value })}
                      required
                      className={formInputClass}
                    >
                      <option value="">Select Advisor</option>
                      {advisors.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.advisorName} ({a.advisorCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={formLabelClass}>Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={currentClient.clientName || ''} onChange={e => setCurrentClient({ ...currentClient, clientName: e.target.value })} required className={formInputClass} placeholder="Full Name" />
                </div>
                <div>
                  <label className={formLabelClass}>Relationship</label>
                  <input type="text" value={currentClient.relationship || ''} onChange={e => setCurrentClient({ ...currentClient, relationship: e.target.value })} className={formInputClass} placeholder="Spouse, Mother, Sister, etc." />
                </div>


                <div>
                  <label className={formLabelClass}>Mobile Number</label>
                  <input type="text" value={currentClient.mobileNumber || ''} onChange={e => setCurrentClient({ ...currentClient, mobileNumber: e.target.value })} className={formInputClass} placeholder="+63..." />
                </div>
                <div>
                  <label className={formLabelClass}>Email Address</label>
                  <input type="email" value={currentClient.email || ''} onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })} className={formInputClass} placeholder="email@example.com" />
                </div>
              </form>
            </div>

            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="submit" form="cgpt-form" className="flex-1 bg-linear-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-sm py-2.5 rounded-full transition-all duration-200 cursor-pointer border border-[#F4C542]/30 shadow-sm active:scale-[0.97]">
                Confirm Save
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-[28px] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-2 shrink-0">
              <div>
                <h2 className="text-base font-bold text-text">CGPT Batch Import</h2>
                <p className="text-xs text-text-secondary">
                  {selectedAdvisor ? `🔒 Importing clients directly into ${selectedAdvisor.advisorName}'s registry.` : 'Process client registers via CSV or Excel sheets.'}
                </p>
              </div>
              <button
                onClick={() => {
                  resetImportState();
                  setPastedText('');
                  setImportFile(null);
                  setPassword('');
                  setImportMethod('file');
                  setActiveModal(null);
                }}
                className="p-2.5 text-muted hover:text-text hover:bg-slate-200 rounded-full transition-colors duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {!selectedAdvisor && (
              <div className="flex gap-6 p-5 border-b border-border bg-surface-2 text-left items-center shrink-0">
                <label className="flex items-center gap-2 text-sm font-bold text-text cursor-pointer">
                  <input
                    type="radio"
                    name="importTarget"
                    checked={importTarget === 'clients'}
                    onChange={() => setImportTarget('clients')}
                    className="w-4 h-4 text-primary focus:ring-primary/20 bg-transparent border-border"
                  />
                  Import Clients
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-text cursor-pointer">
                  <input
                    type="radio"
                    name="importTarget"
                    checked={importTarget === 'advisors'}
                    onChange={() => setImportTarget('advisors')}
                    className="w-4 h-4 text-primary focus:ring-primary/20 bg-transparent border-border"
                  />
                  Import Advisors
                </label>
              </div>
            )}

            {importTarget === 'clients' && (
              <div className="p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/20 text-left shrink-0">
                <label className={formLabelClass}>Import For Advisor <span className="text-red-500">*</span></label>
                {selectedAdvisor ? (
                  <div className="w-full px-3.5 py-2.5 border border-primary/40 rounded-2xl text-xs bg-primary/10 text-foreground font-bold flex items-center gap-2">
                    <UserCheck size={14} className="text-primary shrink-0" />
                    🔒 Import locked to {selectedAdvisor.advisorName} ({selectedAdvisor.advisorCode})
                  </div>
                ) : (
                  <select
                    value={importAdvisorId}
                    onChange={e => setImportAdvisorId(e.target.value)}
                    required
                    className={formInputClass}
                  >
                    <option value="">Select Advisor</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.advisorName} ({a.advisorCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {importState.phase === 'idle' && (
              <div className="flex border-b border-border bg-slate-50/50 dark:bg-slate-900/20 p-1.5 gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setImportMethod('file')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${importMethod === 'file'
                    ? 'bg-card text-text shadow-sm border border-border/80'
                    : 'text-text-secondary hover:text-text hover:bg-surface-2'
                    }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod('paste')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${importMethod === 'paste'
                    ? 'bg-card text-text shadow-sm border border-border/80'
                    : 'text-text-secondary hover:text-text hover:bg-surface-2'
                    }`}
                >
                  Direct Copy & Paste (Excel Bypass)
                </button>
              </div>
            )}

            {importState.phase === 'idle' && (
              <div className="p-6 overflow-y-auto">
                {importMethod === 'file' ? (
                  <div
                    className="flex flex-col items-center justify-center transition-all duration-200"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div
                      className={`w-full border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/55'}`}
                      onClick={() => {
                        const el = document.getElementById('file-upload-input');
                        if (el) el.click();
                      }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <FileSpreadsheet size={24} className="text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-text mb-1">Drag & drop your file here</h3>
                      <p className="text-xs text-text-secondary mb-4">Supports .xlsx and .csv registers</p>

                      <span className="bg-primary text-black font-semibold text-xs px-5 py-2.5 rounded-full shadow-sm border border-[#e0b53c] hover:bg-primary/80 transition-all duration-200 select-none">
                        Browse Files
                      </span>

                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelected(file);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-left bg-primary/5 border border-primary/20 rounded-2xl p-3.5 text-xs text-text-secondary">
                      <p className="font-semibold text-text mb-1">Bypass password locks easily:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open the password-locked file locally in Excel.</li>
                        <li>Select client columns and rows and press <strong>Ctrl + C</strong>.</li>
                        <li>Paste (<strong>Ctrl + V</strong>) directly into the field below.</li>
                      </ol>
                    </div>
                    <textarea
                      placeholder="Paste columns here (TAB separated Excel grid rows)..."
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      className="w-full h-44 p-3.5 border border-border rounded-2xl text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-card text-foreground font-mono transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteImport(pastedText)}
                      disabled={!pastedText.trim() || !effectiveImportAdvisorId}
                      className="w-full bg-primary text-black font-bold text-xs py-2.5 rounded-full border border-[#e0b53c] hover:bg-primary/80 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Parse and Validate Paste
                    </button>
                  </div>
                )}
              </div>
            )}

            {importState.phase === 'password' && (
              <div className="p-6 space-y-4">
                <div className="text-left bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-bold mb-0.5">Password Required</p>
                    <p className="text-text-secondary text-[11px]">This Excel file is encrypted. Provide the password to open and import client records.</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className={formLabelClass}>Document Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`${formInputClass} pr-10`}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && password) handleDecryptAndImport();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-muted hover:text-text transition-colors duration-200"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {importState.errorMessage && (
                  <p className="text-[11px] text-red-500 text-left font-semibold">{importState.errorMessage}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDecryptAndImport}
                    disabled={!password}
                    className="flex-1 bg-primary text-black font-semibold text-xs py-2.5 rounded-full border border-[#e0b53c] hover:bg-primary/80 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decrypt & Parse File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetImportState();
                      setImportFile(null);
                      setPassword('');
                    }}
                    className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-full transition-all duration-200 active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {importState.phase === 'reading' && (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-text">Analyzing Register</h3>
                  <p className="text-xs text-text-secondary mt-1">Reading headers and validating cells...</p>
                </div>
              </div>
            )}

            {importState.phase === 'preview' && importState.validation && (
              <div className="flex flex-col h-full max-h-[80vh] p-6 space-y-4 overflow-hidden">
                <div className="text-left shrink-0 space-y-1">
                  <h3 className="text-sm font-bold text-text">Preview Valid Records</h3>
                  {importTarget === 'clients' && (
                    <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                      🔒 Import locked to {advisors.find(a => a.id === effectiveImportAdvisorId)?.advisorName || selectedAdvisor?.advisorName || 'selected advisor'}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary">
                    Found {importState.validation.newClients.length} new records, {importState.validation.duplicateClients.length} duplicates
                    {importTarget === 'clients' ? `, ${importState.validation.crossAdvisorConflicts.length} cross-advisor conflicts, ` : ', '}
                    and {importState.validation.invalid.length} invalid rows.
                  </p>
                </div>

                <div className={`grid grid-cols-2 ${importTarget === 'clients' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3 shrink-0`}>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-3.5">
                    <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">New</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{importState.validation.newClients.length}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-400/25 rounded-2xl p-3.5">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duplicates</span>
                    <span className="text-xl font-black text-slate-500">{importState.validation.duplicateClients.length}</span>
                  </div>
                  {importTarget === 'clients' && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-500/25 rounded-2xl p-3.5">
                      <span className="block text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Cross-Advisor</span>
                      <span className="text-xl font-black text-orange-600 dark:text-orange-400">{importState.validation.crossAdvisorConflicts.length}</span>
                    </div>
                  )}
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-500/25 rounded-2xl p-3.5">
                    <span className="block text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Invalid</span>
                    <span className="text-xl font-black text-red-600 dark:text-red-400">{importState.validation.invalid.length}</span>
                  </div>
                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3.5">
                    <span className="block text-[10px] font-bold text-[#A97800] dark:text-[#F4C542] uppercase tracking-wider">Total Rows</span>
                    <span className="text-xl font-black text-[#A97800] dark:text-[#F4C542]">
                      {importState.validation.newClients.length + importState.validation.duplicateClients.length + importState.validation.crossAdvisorConflicts.length + importState.validation.invalid.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card">
                  {importState.validation.newClients.length === 0 && importState.validation.duplicateClients.length === 0 && importState.validation.crossAdvisorConflicts.length === 0 && importState.validation.invalid.length === 0 && (
                    <div className="py-8 text-center text-text-secondary text-xs">No records to preview.</div>
                  )}

                  {importState.validation.newClients.length > 0 && (
                    <div className="w-full">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-500/20 px-4 py-2.5 sticky top-0 z-30 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          New Records to Import ({importState.validation.newClients.length})
                        </h4>
                      </div>

                      {importTarget === 'clients' ? (
                        <div className="overflow-x-auto">
                          <table className="text-left text-[11px] border-collapse table-fixed">
                            <thead>
                              <tr className="bg-surface-2">
                                <th className="sticky top-9 left-0 z-20 bg-surface-2 border-b border-r border-border px-3 py-2.5 font-bold text-text-secondary w-[48px]">#</th>
                                <th className="sticky top-9 left-[48px] z-20 bg-surface-2 border-b border-r border-border px-3 py-2.5 font-bold text-text-secondary w-[280px]">Client Name / Beneficiary Name</th>
                                <th className="sticky top-9 z-10 bg-surface-2 border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[150px]">MONTH - BIRTHDATE</th>
                                <th className="sticky top-9 z-10 bg-surface-2 border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[80px]">Age</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importState.validation.newClients.slice(0, 200).map((r: any, i: number) => {
                                let formattedBirthdate = '—';
                                let age = '—';
                                if (r.birthdate) {
                                  const d = new Date(r.birthdate + 'T00:00:00');
                                  if (!isNaN(d.getTime())) {
                                    formattedBirthdate = formatBirthdateWithYear(d);
                                    const today = new Date();
                                    let calcAge = today.getFullYear() - d.getFullYear();
                                    const hasHadBirthdayThisYear =
                                      today.getMonth() > d.getMonth() ||
                                      (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
                                    if (!hasHadBirthdayThisYear) calcAge--;
                                    age = calcAge.toString();
                                  }
                                }
                                return (
                                  <tr key={i} className={`${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} hover:bg-primary/10 transition-colors`}>
                                    <td className={`sticky left-0 z-10 ${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-r border-b border-border/40 px-3 py-2 text-text-secondary font-mono`}>{i + 1}</td>
                                    <td className={`sticky left-[48px] z-10 ${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-r border-b border-border/40 px-3 py-2 font-bold text-text truncate`} title={r.clientName + (r.beneficiary ? ` / ${r.beneficiary}` : '')}>
                                      {r.clientName || '—'}{r.beneficiary ? ` / ${r.beneficiary}` : ''}
                                    </td>
                                    <td className="border-b border-border/40 px-3 py-2 text-text-secondary truncate">{formattedBirthdate}</td>
                                    <td className="border-b border-border/40 px-3 py-2 text-text-secondary truncate">{age}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="sticky top-9 bg-card border-b border-border z-10">
                            <tr>
                              <th className="py-2 px-3 font-bold text-text-secondary">#</th>
                              <th className="py-2 px-3 font-bold text-text-secondary">Name</th>
                              <th className="py-2 px-3 font-bold text-text-secondary">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importState.validation.newClients.slice(0, 200).map((r: any, i: number) => (
                              <tr key={i} className={`${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} hover:bg-primary/10 transition-colors border-b border-border/40`}>
                                <td className="py-2 px-3 text-text-secondary">{i + 1}</td>
                                <td className="py-2 px-3 font-semibold text-text">{r.advisorName}</td>
                                <td className="py-2 px-3 text-text-secondary">{r.email || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {importTarget === 'clients' && importState.validation.crossAdvisorConflicts.length > 0 && (
                    <div className="w-full border-t border-border">
                      <details className="group" open>
                        <summary className="bg-orange-50 dark:bg-orange-950/20 px-4 py-2.5 sticky top-0 z-30 cursor-pointer list-none flex items-center justify-between hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className="text-orange-500" />
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase">Blocked</span>
                            <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400">
                              Cross-Advisor Conflicts — Not Imported ({importState.validation.crossAdvisorConflicts.length})
                            </h4>
                          </div>
                          <ChevronRight size={14} className="text-orange-500 transition-transform group-open:rotate-90" />
                        </summary>
                        <p className="px-4 py-2 text-[11px] text-text-secondary bg-orange-50/40 dark:bg-orange-950/10 border-b border-orange-500/10">
                          These rows matched an existing client already assigned to a different advisor. They are never imported or reassigned automatically.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="text-left text-[11px] border-collapse table-fixed">
                            <thead>
                              <tr className="bg-surface-2">
                                <th className="sticky left-0 z-10 bg-surface-2 border-r border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[48px]">#</th>
                                <th className="sticky left-[48px] z-10 bg-surface-2 border-r border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[280px]">Client Name / Beneficiary Name</th>
                                <th className="border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[280px]">Belongs To</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importState.validation.crossAdvisorConflicts.slice(0, 200).map((r: any, i: number) => (
                                <tr key={i} className={`${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'}`}>
                                  <td className={`sticky left-0 z-10 ${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-r border-b border-border/40 px-3 py-2 text-text-secondary font-mono`}>{i + 1}</td>
                                  <td className={`sticky left-[48px] z-10 ${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-r border-b border-border/40 px-3 py-2 font-bold text-text truncate`}>
                                    {r.clientName || '—'}{r.beneficiary ? ` / ${r.beneficiary}` : ''}
                                  </td>
                                  <td className="border-b border-border/40 px-3 py-2 text-orange-600 dark:text-orange-400 font-semibold italic truncate">
                                    {r._conflictAdvisorName} (matches: {r._matchedName})
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  )}

                  {importState.validation.duplicateClients.length > 0 && (
                    <div className="w-full border-t border-border">
                      <details className="group">
                        <summary className="bg-slate-50 dark:bg-slate-900/30 px-4 py-2.5 sticky top-0 z-30 cursor-pointer list-none flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">Skipped</span>
                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              Already in Registry ({importState.validation.duplicateClients.length})
                            </h4>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 transition-transform group-open:rotate-90" />
                        </summary>

                        <div className="overflow-x-auto">
                          <table className="text-left text-[11px] border-collapse table-fixed">
                            <thead>
                              <tr className="bg-surface-2">
                                <th className="sticky left-0 z-10 bg-surface-2 border-r border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[48px]">#</th>
                                <th className="sticky left-[48px] z-10 bg-surface-2 border-r border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[280px]">Client Name / Beneficiary Name</th>
                                <th className="border-b border-border px-3 py-2.5 font-bold text-text-secondary w-[280px]">Match Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importState.validation.duplicateClients.slice(0, 200).map((r: any, i: number) => (
                                <tr key={i} className={`${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} opacity-70 hover:opacity-100 transition-opacity`}>
                                  <td className={`sticky left-0 z-10 ${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-r border-b border-border/40 px-3 py-2 text-text-secondary font-mono`}>{i + 1}</td>
                                  <td className={`sticky left-[48px] z-10 ${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-r border-b border-border/40 px-3 py-2 font-bold text-text truncate`}>
                                    {importTarget === 'clients' ? `${r.clientName || '—'}${r.beneficiary ? ` / ${r.beneficiary}` : ''}` : r.advisorName}
                                  </td>
                                  <td className="border-b border-border/40 px-3 py-2 text-text-secondary italic truncate">
                                    Matches: {r._matchedName}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  )}

                  {importState.validation.invalid.length > 0 && (
                    <div className="w-full border-t border-border">
                      <details className="group" open>
                        <summary className="bg-red-50 dark:bg-red-950/20 px-4 py-2.5 sticky top-0 z-30 cursor-pointer list-none flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase">Invalid</span>
                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
                              Missing Required Fields ({importState.validation.invalid.length})
                            </h4>
                          </div>
                          <ChevronRight size={14} className="text-red-500 transition-transform group-open:rotate-90" />
                        </summary>
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="sticky top-0 bg-card border-b border-border z-10">
                            <tr>
                              <th className="py-2 px-3 font-bold text-text-secondary">Row</th>
                              <th className="py-2 px-3 font-bold text-text-secondary">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importState.validation.invalid.slice(0, 200).map((r: any, i: number) => (
                              <tr key={i} className={`${i % 2 === 0 ? 'bg-card' : 'bg-surface-2/40'} border-b border-border/40`}>
                                <td className="py-2 px-3 font-mono text-red-500">{r.rowNumber}</td>
                                <td className="py-2 px-3 text-red-500">{r.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1 shrink-0">
                  <button
                    onClick={() => {
                      if (importTarget === 'clients') {
                        processAndImportClients(importState.validation!.newClients, importState.fileName, effectiveImportAdvisorId, importState.validation!.stats);
                      } else {
                        processAndImportAdvisors(importState.validation!.newClients, importState.fileName, importState.validation!.stats);
                      }
                    }}
                    disabled={importState.validation.newClients.length === 0}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-xs py-3 rounded-full transition-all duration-200 cursor-pointer shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import New {importTarget === 'clients' ? 'Clients' : 'Advisors'} ({importState.validation.newClients.length})
                  </button>
                  <button
                    onClick={() => {
                      resetImportState();
                      setImportFile(null);
                      setPastedText('');
                    }}
                    className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-3 rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {importState.phase === 'importing' && (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-text">Importing Records</h3>
                  <p className="text-xs text-text-secondary mt-1">Uploading and indexing databases...</p>
                </div>
              </div>
            )}

            {importState.phase === 'done' && (
              <div className="p-10 flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">Import Completed</h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-5">
                    <span className="font-bold text-emerald-500">{importState.importedCount}</span> New clients imported<br />
                    <span className="font-bold text-orange-500">{importState.validation?.duplicateClients?.length || 0}</span> Duplicates skipped (already in list)
                    {!!importState.crossAdvisorSkippedCount && (
                      <>
                        <br />
                        <span className="font-bold text-red-500">{importState.crossAdvisorSkippedCount}</span> Cross-advisor conflicts skipped (belong to another advisor)
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetImportState();
                    setPastedText('');
                    setPassword('');
                    setImportFile(null);
                    setImportMethod('file');
                    setActiveModal(null);
                  }}
                  className="w-full bg-primary text-black font-semibold text-xs py-2.5 rounded-full border border-[#e0b53c] hover:bg-primary/80 active:scale-[0.97] transition-all duration-200"
                >
                  Close Panel
                </button>
              </div>
            )}

            {importState.phase === 'error' && (
              <div className="p-10 flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">Import Failed</h3>
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{importState.errorMessage}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      resetImportState();
                      setPassword('');
                      setImportFile(null);
                    }}
                    className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-full transition-all duration-200 active:scale-[0.97]"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
        title={clientToDelete === 'bulk' ? `Delete ${selectedClientIds.length} Selected Record${selectedClientIds.length > 1 ? 's' : ''}` : "Delete Client Record"}
        message={clientToDelete === 'bulk'
          ? `Are you sure you want to delete the selected client records (${selectedClientIds.length})? This will also permanently delete all associated policy cards, payments, forms, and activity records linked to these clients. This action cannot be undone.`
          : "Are you sure you want to delete this client? This will also permanently delete all associated policy cards, payments, forms, and activity records linked to this client. This action cannot be undone."
        }
        confirmText={clientToDelete === 'bulk' ? `Delete (${selectedClientIds.length}) Selected` : "Delete Client"}
        variant="danger"
        isLoading={isDeleting}
      />

      {(activeModal === 'addAdvisor' || activeModal === 'editAdvisor') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-[28px] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text">
                    {activeModal === 'editAdvisor' ? 'Edit Advisor Details' : 'Add New Advisor'}
                  </h2>
                  <p className="text-xs text-text-secondary">Register financial advisor into CAMS portal.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-muted hover:text-text hover:bg-surface-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdvisor} className="p-6 space-y-4 text-left">
              <div>
                <label className={formLabelClass}>Advisor Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={currentAdvisor.advisorName || ''}
                  onChange={e => setCurrentAdvisor({ ...currentAdvisor, advisorName: e.target.value })}
                  className={formInputClass}
                  placeholder="e.g. Daniel Padua"
                />
              </div>

              <div>
                <label className={formLabelClass}>Advisor Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={currentAdvisor.advisorCode || ''}
                  onChange={e => setCurrentAdvisor({ ...currentAdvisor, advisorCode: e.target.value })}
                  className={`${formInputClass} font-mono`}
                  placeholder="e.g. ADV-001"
                />
              </div>

              <div>
                <label className={formLabelClass}>Email Address</label>
                <input
                  type="email"
                  value={currentAdvisor.email || ''}
                  onChange={e => setCurrentAdvisor({ ...currentAdvisor, email: e.target.value })}
                  className={formInputClass}
                  placeholder="advisor@sunlife.com.ph"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-xs py-3 rounded-full transition-all duration-200 cursor-pointer shadow-md active:scale-[0.97]"
                >
                  {activeModal === 'editAdvisor' ? 'Save Changes' : 'Create Advisor'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-3 rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'actions' && currentClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2 shrink-0">
              <h2 className="text-sm font-bold text-foreground">Forms & Services</h2>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground mb-1 text-center">
                Select a form to open for <strong className="text-foreground">{currentClient.clientName}</strong>
              </p>

              <button onClick={() => setActiveModal('basicInfo')} className="w-full px-4 py-3.5 bg-surface hover:bg-primary/10 border border-border hover:border-primary text-sm font-medium rounded-xl text-foreground flex items-center justify-between transition-colors text-left group">
                <span className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <UserCheck size={16} />
                  </div>
                  Basic Info
                </span>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button onClick={() => setActiveModal('documents')} className="w-full px-4 py-3.5 bg-surface hover:bg-primary/10 border border-border hover:border-primary text-sm font-medium rounded-xl text-foreground flex items-center justify-between transition-colors text-left group">
                <span className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <FileText size={16} />
                  </div>
                  Client Documents
                </span>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'documents' && currentClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 w-full max-w-2xl h-full rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.25)] relative flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">

            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between px-7 py-5 border-b border-border/60">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                    <FileText size={22} className="text-black" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-card flex items-center justify-center">
                      <CheckCircle2 size={9} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text tracking-tight">Client Documents</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Government IDs & Signatures — <span className="font-semibold text-primary">{currentClient.clientName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setDocFormOpen(false); setActiveModal(null); }}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-text hover:bg-surface-2 rounded-full transition-all duration-200 border border-transparent hover:border-border active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form id="doc-form" onSubmit={handleSaveClient} className="overflow-y-auto flex-1 min-h-0 p-6 space-y-6">
              <div className="w-full bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-4 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valid ID</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={formLabelClass}>ID Type</label>
                    <select
                      value={currentClient.idType || ''}
                      onChange={(e) => setCurrentClient({ ...currentClient, idType: e.target.value })}
                      className={formInputClass}
                    >
                      <option value="">Select ID Type</option>
                      {["Philippine Passport", "Driver's License", "UMID", "PhilHealth ID", "SSS ID", "PRC ID", "Postal ID", "Voter's ID", "Other"].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={formLabelClass}>ID Number</label>
                    <input
                      type="text"
                      value={currentClient.idNumber || ''}
                      onChange={(e) => setCurrentClient({ ...currentClient, idNumber: e.target.value })}
                      className={formInputClass}
                      placeholder="ID Number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={formLabelClass}>Expiration Date</label>
                    <input
                      type="date"
                      value={currentClient.idExpirationDate || ''}
                      onChange={(e) => setCurrentClient({ ...currentClient, idExpirationDate: e.target.value })}
                      className={formInputClass}
                    />
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-slate-200 dark:border-border bg-slate-50/60 dark:bg-surface-2 rounded-2xl min-h-[220px] w-full flex items-center justify-center overflow-hidden transition-colors duration-200">
                  {uploadingId ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  ) : !currentClient.idAttachmentUrl ? (
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full min-h-[220px] text-slate-400 hover:text-slate-600 transition-all duration-200 rounded-2xl">
                      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border flex items-center justify-center shadow-sm">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm font-medium">Upload ID Image</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleIdUpload}
                      />
                    </label>
                  ) : (
                    <div className="relative w-full min-h-[220px] flex flex-col items-center justify-center bg-white dark:bg-card rounded-2xl group overflow-hidden">
                      {currentClient.idAttachmentUrl.toLowerCase().includes('.pdf') || (currentClient.idAttachmentUrl.startsWith('blob:') && !currentClient.idAttachmentUrl.includes('image')) ? (
                        <a href={currentClient.idAttachmentUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                          <FileText size={40} />
                          <span className="text-xs font-semibold">Document Attached (Click to View)</span>
                        </a>
                      ) : (
                        <a href={currentClient.idAttachmentUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center cursor-zoom-in group-hover:opacity-90 transition-opacity">
                          <img src={currentClient.idAttachmentUrl} alt="ID Preview" className="max-h-[300px] w-full object-contain" />
                        </a>
                      )}
                      <label className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2 shadow-lg">
                        <Upload size={14} /> Replace ID
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                      </label>
                    </div>
                  )}
                </div>

                {currentClient.idAttachmentUrl && (
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentClient({ ...currentClient, idAttachmentUrl: '' })}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors duration-200 border border-slate-200 dark:border-border hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-card rounded-full"
                    >
                      <Trash2 size={13} /> Remove ID
                    </button>
                  </div>
                )}
              </div>

              <div>
                <SignaturePad
                  initialSignature={currentClient.signatureData}
                  onSignatureChange={(sig) => setCurrentClient({ ...currentClient, signatureData: sig || undefined })}
                />
              </div>
            </form>

            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="submit" form="doc-form" className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-sm py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.97]">
                Confirm Save
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!advisorToDelete}
        onClose={() => setAdvisorToDelete(null)}
        onConfirm={handleDeleteAdvisor}
        title="Delete Advisor Record"
        message="Are you sure you want to delete this advisor? This action will remove the advisor record from the CAMS registry."
        confirmText="Delete Advisor"
        variant="danger"
        isLoading={isDeletingAdvisor}
      />

      {activeModal === 'basicInfo' && currentClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 w-full max-w-md h-full rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.25)] relative flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between px-7 py-5 border-b border-border/60">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                    <UserCheck size={22} className="text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text tracking-tight">Basic Info</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Client details for <span className="font-semibold text-primary">{currentClient.clientName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-text hover:bg-surface-2 rounded-full transition-all duration-200 border border-transparent hover:border-border active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-6">
              <div className="flex flex-col gap-5">
                <div className="bg-surface-2/60 p-4 rounded-2xl border border-border/60">
                  <label className={formLabelClass}>Client Name</label>
                  <p className="text-base font-bold text-foreground mt-1">{currentClient.clientName || '—'}</p>
                </div>
                <div className="bg-surface-2/60 p-4 rounded-2xl border border-border/60">
                  <label className={formLabelClass}>Email</label>
                  <p className="text-sm font-semibold text-foreground mt-1">{currentClient.email || '—'}</p>
                </div>
                <div className="bg-surface-2/60 p-4 rounded-2xl border border-border/60">
                  <label className={formLabelClass}>Mobile Number</label>
                  <p className="text-sm font-semibold text-foreground mt-1">{currentClient.mobileNumber || '—'}</p>
                </div>
                <div className="bg-surface-2/60 p-4 rounded-2xl border border-border/60">
                  <label className={formLabelClass}>Address</label>
                  <p className="text-sm font-semibold text-foreground mt-1">{currentClient.address || '—'}</p>
                </div>
                <div className="bg-surface-2/60 p-4 rounded-2xl border border-border/60">
                  <label className={formLabelClass}>Birthdate</label>
                  <p className="text-sm font-semibold text-foreground mt-1">{currentClient.birthdate || '—'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}