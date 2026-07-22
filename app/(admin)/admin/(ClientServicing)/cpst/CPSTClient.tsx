'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, ChevronRight, ArrowLeft,
  Upload, FileSpreadsheet, CheckCircle2, Target, Users,
  AlertCircle, Eye, EyeOff, UserCheck
} from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import SignaturePad from '@/app/components/ui/SignaturePad';
import { exportToPDF, exportToDOCS } from '@/app/lib/export';
import ExportDropdown from '@/app/components/shared/ExportDropdown';
import { ConfirmModal } from '@/app/components/ui/modals/ConfirmModal';
import styles from "@/styles/admin/cpst/page.module.css";

export interface AdvisorRecord {
  id: string;
  advisorCode: string;
  advisorName: string;
  email: string;
  createdAt?: string;
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
  created_at?: string;
}

const PRODUCTS = ['Sun Maxilink Prime', 'Sun Fit and Well', 'Sun FlexiLink', 'Sun Dream Wealth', 'Sun Life Assure'];
const PAYMENT_MODES = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'];

interface CPSTClientProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const formInputClass = "w-full px-3.5 py-2.5 border border-border rounded-2xl text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-card text-foreground transition-all duration-200";
const formLabelClass = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

const DEFAULT_ADVISOR: AdvisorRecord = {
  id: '1223fa43-e434-4445-9d9d-aac809f8226b',
  advisorCode: 'ADV-001',
  advisorName: 'Triwynn Evasco Branzuela',
  email: 'triwynn@teampadua.ph'
};

export default function CPSTClient({ canCreate, canEdit, canDelete, canExport }: CPSTClientProps) {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [clients, setClients] = useState<ClientManagementRecord[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorRecord | null>(null);

  const [advisorSearch, setAdvisorSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<ClientManagementRecord>>({});

  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importAdvisorId, setImportAdvisorId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [importState, setImportState] = useState<{
    phase: 'idle' | 'reading' | 'password' | 'preview' | 'importing' | 'done' | 'error';
    fileName: string;
    validation: {
      valid: Partial<ClientManagementRecord>[];
      invalid: { rowNumber: number; reason: string; rawData: any }[];
      total: number;
    } | null;
    totalRows?: number;
    importedCount?: number;
    updatedCount?: number;
    skippedCount?: number;
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
    skippedHeaders: 0,
    skippedEmpty: 0,
    skippedInvalid: 0,
    errorMessage: ''
  });

  const resetImportState = () => {
    setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, skippedHeaders: 0, skippedEmpty: 0, skippedInvalid: 0, errorMessage: '' });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: advisorsData, error: advisorsErr } = await supabase
        .from('advisors')
        .select('*')
        .order('advisor_name', { ascending: true });

      const { data: clientsData, error: clientsErr } = await supabase
        .from('cpst_clients')
        .select('*, advisor:advisors(*)')
        .order('created_at', { ascending: false });

      console.log('ADVISORS', advisorsData);
      console.log('CLIENTS', clientsData);
      console.log('SELECTED ADVISOR', selectedAdvisor);

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
                advisorCode: c.advisor.advisor_code || 'ADV-001',
                advisorName: c.advisor.advisor_name || 'Triwynn Evasco Branzuela',
                email: c.advisor.email || 'triwynn@teampadua.ph'
              });
            } else {
              advisorMap.set(advId, {
                id: advId,
                advisorCode: 'ADV-001',
                advisorName: 'Triwynn Evasco Branzuela',
                email: 'triwynn@teampadua.ph'
              });
            }
          }
        });
        loadedAdvisors = Array.from(advisorMap.values());
      }

      if (loadedAdvisors.length === 0) {
        loadedAdvisors = [DEFAULT_ADVISOR];
      }
      setAdvisors(loadedAdvisors);

      if (clientsErr || !clientsData) {
        const triwynnId = loadedAdvisors[0]?.id || DEFAULT_ADVISOR.id;
        setClients([
          {
            id: '00000000-0000-0000-0000-000000000001',
            advisorId: triwynnId,
            advisor: loadedAdvisors[0] || DEFAULT_ADVISOR,
            clientName: 'Juan Dela Cruz',
            relationship: 'Self',
            policyNumber: 'POL-998877',
            product: 'Sun Maxilink Prime',
            approvalDate: '2025-01-15',
            annualPremium: 45000,
            mobileNumber: '+639171234567',
            email: 'juan@example.com',
            address: 'Makati City',
            beneficiary: 'Maria Dela Cruz',
            fundAllocation: '100% Equity',
            modeOfPayment: 'Annual'
          }
        ]);
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

  const filteredClients = useMemo(() => {
    return advisorClients.filter(c => {
      if (productFilter !== 'ALL' && c.product !== productFilter) return false;
      if (clientSearch.trim()) {
        const s = clientSearch.toLowerCase();
        if (!c.clientName?.toLowerCase().includes(s) && !c.policyNumber?.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      if (sortBy === 'oldest') return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      if (sortBy === 'name') return (a.clientName || '').localeCompare(b.clientName || '');
      return 0;
    });
  }, [advisorClients, productFilter, clientSearch, sortBy]);

  const isAllClientsSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;

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
    if (!currentClient.clientName || !currentClient.advisorId) return;

    try {
      const payload = {
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
      };

      if (currentClient.id) {
        await supabase.from('cpst_clients').update(payload).eq('id', currentClient.id);
      } else {
        const newId = crypto.randomUUID();
        await supabase.from('cpst_clients').insert([{ ...payload, id: newId }]);
      }

      setActiveModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
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
        await supabase.from('cpst_clients').delete().in('id', selectedIds);
        setSelectedIds([]);
      } else {
        await supabase.from('cpst_clients').delete().eq('id', clientToDelete);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
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
    const requiredHeaders = ["client name", "email address", "contact number", "location", "date of birth", "age"];

    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i] || [];
      const lowerCells = row.map(cell => String(cell).toLowerCase().trim());

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

    if (headerIndex === -1) {
      throw new Error("Could not detect valid header row. Ensure template contains required client columns.");
    }

    const headerRow = rows[headerIndex] || [];
    const findCol = (kw: string[]): number =>
      headerRow.findIndex((h: any) => kw.some(k => String(h).toLowerCase().includes(k)));

    const nameCol = findCol(['client name', 'clientname', 'client', 'name']);
    const emailCol = findCol(['email', 'email address']);
    const mobCol = findCol(['contact number', 'mobile', 'phone', 'contact']);
    const addCol = findCol(['location', 'address']);
    const bdayCol = findCol(['date of birth', 'birthday', 'dob']);

    const valid: Partial<ClientManagementRecord>[] = [];
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
      if (
        rowText.includes("report:") ||
        rowText.includes("date generated:") ||
        rowText.includes("data privacy act")
      ) {
        skippedHeaders++;
        continue;
      }

      const rowNumber = i + 1;
      const rawData: Record<string, any> = {};
      headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

      const clientName = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
      const mobileNumber = mobCol >= 0 ? String(row[mobCol] ?? '').trim() : '';
      const email = emailCol >= 0 ? String(row[emailCol] ?? '').trim() : '';
      const address = addCol >= 0 ? String(row[addCol] ?? '').trim() : '';
      const rawBday = bdayCol >= 0 ? String(row[bdayCol] ?? '').trim() : '';
      const birthdate = rawBday ? (parseDateFlexible(rawBday) || rawBday) : '';

      if (!clientName) {
        skippedInvalid++;
        invalid.push({ rowNumber, reason: 'Missing Client Name', rawData });
        continue;
      }

      valid.push({
        clientName,
        mobileNumber,
        email,
        address,
        birthdate,
        policyNumber: '',
        product: '',
        approvalDate: '',
        annualPremium: 0,
        beneficiary: '',
        fundAllocation: '',
        modeOfPayment: 'Annual'
      });
    }

    return { valid, invalid, stats: { skippedHeaders, skippedEmpty, skippedInvalid } };
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
        const errJson = await res.json();
        throw new Error(errJson.error || "Decryption failed. Please check the password.");
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
    parseStats?: { skippedHeaders: number; skippedEmpty: number; skippedInvalid: number }
  ) => {
    if (validRows.length === 0 || !importAdvisorId) return;
    setImportState(prev => ({ ...prev, phase: 'importing', fileName }));

    const parseDate = (value: any) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    };

    try {
      const { data: existingClients } = await supabase.from('cpst_clients').select('id, email, mobile_number, policy_number');

      const recordsToUpsert: any[] = [];
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const record of validRows) {
        const existing = existingClients?.find(c =>
          (c.email && record.email && c.email.toLowerCase() === record.email.toLowerCase()) ||
          (c.mobile_number && record.mobileNumber && c.mobile_number === record.mobileNumber)
        );

        const existingInBatch = recordsToUpsert.find(c =>
          (c.email && record.email && c.email.toLowerCase() === record.email.toLowerCase()) ||
          (c.mobile_number && record.mobileNumber && c.mobile_number === record.mobileNumber)
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
          advisor_id: importAdvisorId,
          client_name: record.clientName,
          relationship: record.relationship || 'Self',
          policy_number: record.policyNumber || null,
          product: record.product || null,
          approval_date: parseDate(record.approvalDate),
          birthdate: parseDate((record as any).birthday || (record as any).birthdate),
          annual_premium: record.annualPremium || 0,
          mobile_number: record.mobileNumber || '',
          email: record.email || '',
          address: record.address || '',
          beneficiary: record.beneficiary || '',
          fund_allocation: record.fundAllocation || '',
          mode_of_payment: record.modeOfPayment || 'Annual',
        });
      }

      const { error } = await supabase.from('cpst_clients').upsert(recordsToUpsert).select();
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
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });

      const { valid, invalid, stats } = parseClientRows(rows);
      await processAndImportClients(valid, file.name, stats);
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

  const handleFileSelected = async (file: File) => {
    if (!importAdvisorId) {
      setImportState({ phase: 'error', fileName: file.name, validation: null, importedCount: 0, errorMessage: 'Please select an Advisor before uploading.' });
      return;
    }

    setImportState({ phase: 'reading', fileName: file.name, validation: null, importedCount: 0, errorMessage: '' });

    try {
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
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });

      const { valid, invalid, stats } = parseClientRows(rows);
      await processAndImportClients(valid, file.name, stats);
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
    if (!importAdvisorId) {
      setImportState({ phase: 'error', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: 'Please select an Advisor before importing.' });
      return;
    }

    setImportState({ phase: 'reading', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: '' });

    try {
      if (!text.trim()) throw new Error("Pasted data is empty.");
      const rows = text.split(/\r?\n/).map(row => row.split('\t'));
      if (rows.length < 2) throw new Error("No data found or insufficient rows.");

      const { valid, invalid, stats } = parseClientRows(rows);
      await processAndImportClients(valid, 'Pasted Grid Data', stats);
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
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFileSelected(file);
    }
  };

  const exportToCSV = () => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Advisor', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Annual Premium', 'Mobile', 'Email', 'Address', 'Beneficiary', 'Payment Mode'];
    const rows = filteredClients.map(c => [
      c.clientName, c.advisor?.advisorName || selectedAdvisor?.advisorName || '', c.relationship, c.policyNumber, c.product, c.approvalDate, c.annualPremium, c.mobileNumber, c.email, c.address, c.beneficiary, c.modeOfPayment
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
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Beneficiary', 'Payment Mode'];
    const rows = filteredClients.map(c => [
      c.clientName, c.policyNumber, c.product, c.approvalDate, `PHP ${c.annualPremium?.toLocaleString()}`, c.mobileNumber, c.email, c.beneficiary, c.modeOfPayment
    ]);
    exportToPDF({
      title: `${selectedAdvisor ? selectedAdvisor.advisorName : 'Advisor'} - Client Registry`,
      description: `Sun Life Financial - Official record of active clients assigned to ${selectedAdvisor?.advisorName || 'Advisor'}.`,
      headers,
      rows,
      filename: `${selectedAdvisor ? selectedAdvisor.advisorName.toLowerCase().replace(/\s+/g, '_') : 'advisor'}_clients_${new Date().toISOString().slice(0, 10)}.pdf`,
      stats: [
        { label: 'Total Clients', value: filteredClients.length },
        { label: 'Active Policies', value: filteredClients.filter(c => c.policyNumber).length },
        { label: 'Total Premiums', value: `PHP ${filteredClients.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0).toLocaleString()}` }
      ]
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Beneficiary', 'Payment Mode'];

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'word') {
      const rows = filteredClients.map(c => [
        c.clientName, c.policyNumber, c.product, c.approvalDate, `PHP ${c.annualPremium?.toLocaleString()}`, c.mobileNumber, c.email, c.beneficiary, c.modeOfPayment
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
                  {selectedAdvisor ? selectedAdvisor.advisorName : 'Advisor Registry'}
                </h1>
                <p className={styles.table_57}>
                  {selectedAdvisor
                    ? `Client Registry for Advisor Code: ${selectedAdvisor.advisorCode}`
                    : 'Client Advisor Management System (CAMS) main registry.'}
                </p>
              </div>

              <div className={styles.container_58}>
                {selectedAdvisor && (
                  <button
                    onClick={() => setSelectedAdvisor(null)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-xs font-bold hover:bg-surface-2 transition-all duration-200"
                  >
                    <ArrowLeft size={14} /> Back to Advisor Registry
                  </button>
                )}

                {canCreate && selectedAdvisor && (
                  <button
                    onClick={() => {
                      setCurrentClient({ advisorId: selectedAdvisor.id });
                      setActiveModal('add');
                    }}
                    className={styles.table_60}
                  >
                    <Plus size={14} /> Add Client
                  </button>
                )}

                <button
                  onClick={() => {
                    setImportAdvisorId(selectedAdvisor?.id || advisors[0]?.id || '');
                    setActiveModal('import');
                  }}
                  className={styles.table_72}
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
                      <h3 className={styles.table_70}>CAMS Batch Import</h3>
                    </div>
                    <p className={styles.text_71}>
                      Upload Excel or CSV files to batch import clients under a selected advisor.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setImportAdvisorId(advisors[0]?.id || '');
                      setActiveModal('import');
                    }}
                    className={styles.table_72}
                  >
                    <Upload size={14} /> Upload Files
                  </button>
                </div>
              </div>

              <div className={styles.card_73}>
                <div className={styles.container_74}>
                  <Search className={styles.text_75} />
                  <input
                    type="text"
                    placeholder="Search advisors..."
                    value={advisorSearch}
                    onChange={e => setAdvisorSearch(e.target.value)}
                    className={styles.text_76}
                  />
                </div>
              </div>

              <div className={styles.card_85}>
                <div className={styles.div_86}>
                  <table className={styles.text_87}>
                    <thead>
                      <tr className={styles.table_88}>
                        <th className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider text-text-secondary">Advisor Name</th>
                        <th className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider text-text-secondary">Advisor Code</th>
                        <th className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider text-text-secondary">Email</th>
                        <th className="py-3 px-4 text-center font-bold text-xs uppercase tracking-wider text-text-secondary">Total Clients</th>
                        <th className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider text-text-secondary sticky right-0 bg-surface-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={styles.div_96}>
                      {loading ? (
                        <tr><td colSpan={5} className="py-8 text-center text-text-secondary text-sm">Loading advisors...</td></tr>
                      ) : filteredAdvisors.map(adv => {
                        const stat = advisorStatsMap.get(adv.id) || { totalClients: 0, activePolicies: 0, totalPremium: 0 };
                        return (
                          <tr key={adv.id} className={`${styles.table_99} group border-b border-border/40 last:border-0 hover:bg-surface-2/40 transition-colors`}>
                            <td className="py-3.5 px-4 font-bold text-text text-sm flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-extrabold text-xs flex items-center justify-center">
                                {adv.advisorName.charAt(0)}
                              </div>
                              <span>{adv.advisorName}</span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono font-semibold text-text-secondary">{adv.advisorCode}</td>
                            <td className="py-3.5 px-4 text-xs text-text-secondary">{adv.email || '—'}</td>
                            <td className="py-3.5 px-4 text-center text-sm font-bold font-mono text-text">{stat.totalClients}</td>
                            <td className="py-3.5 px-4 text-right sticky right-0 bg-card group-hover:bg-surface-2/50 text-xs">
                              <button
                                onClick={() => setSelectedAdvisor(adv)}
                                className="px-4 py-1.5 bg-primary text-black font-extrabold text-xs rounded-full hover:bg-primary/80 transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
                              >
                                View Clients
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!loading && filteredAdvisors.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-secondary text-sm">No advisors found matching search criteria.</td>
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
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#F4C542] to-[#e6b800] text-black font-black text-xl flex items-center justify-center shadow-md">
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

              <div className={styles.card_73}>
                <div className={styles.container_74}>
                  <Search className={styles.text_75} />
                  <input
                    type="text"
                    placeholder="Search client name, policy number..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className={styles.text_76}
                  />
                </div>
                <div className={styles.container_77}>
                  <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className={styles.card_81}>
                    <option value="ALL">All Products</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={styles.card_84}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  {canExport && (
                    <ExportDropdown onExport={handleExport} />
                  )}
                  {selectedIds.length > 0 && (
                    <button
                      onClick={() => setClientToDelete('bulk')}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-xs font-semibold hover:bg-red-500/20 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
                    >
                      Delete Selected ({selectedIds.length})
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.card_85}>
                <div className={styles.div_86}>
                  <table className={styles.text_87}>
                    <thead>
                      <tr className={styles.table_88}>
                        <th className={styles.text_89}>
                          <input
                            type="checkbox"
                            checked={isAllClientsSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(filteredClients.map(c => c.id));
                              else setSelectedIds([]);
                            }}
                            className="rounded border-border/50 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
                          />
                        </th>
                        <th className={styles.text_93}>Client Name</th>
                        <th className={styles.text_93}>Relationship</th>
                        <th className={styles.text_93}>Policy Number</th>
                        <th className={styles.text_93}>Product</th>
                        <th className={styles.text_93}>Approval Date</th>
                        <th className={styles.text_93}>Annual Premium</th>
                        <th className={styles.text_93}>Mobile Number</th>
                        <th className={styles.text_93}>Email</th>
                        <th className={styles.text_93}>Address</th>
                        <th className={styles.text_93}>Beneficiary</th>
                        <th className={styles.text_93}>Fund Allocation</th>
                        <th className={styles.text_93}>Mode of Payment</th>
                        <th className={`${styles.text_93} text-right sticky right-0 bg-surface-2`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={styles.div_96}>
                      {loading ? (
                        <tr><td colSpan={14} className="py-8 text-center text-text-secondary text-sm">Loading clients...</td></tr>
                      ) : filteredClients.map((client, i) => (
                        <tr key={client.id} className={`${styles.table_99} group border-b border-border/40 last:border-0`}>
                          <td className={styles.text_100}>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(client.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedIds([...selectedIds, client.id]);
                                  else setSelectedIds(selectedIds.filter(id => id !== client.id));
                                }}
                                className="rounded border-border/50 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
                              />
                              {i + 1}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-text text-xs">{client.clientName}</td>
                          <td className={styles.text_107}>{client.relationship}</td>
                          <td className={styles.text_107}>{client.policyNumber}</td>
                          <td className={styles.text_107}>{client.product}</td>
                          <td className={styles.text_107}>{client.approvalDate}</td>
                          <td className={styles.text_107}>₱{client.annualPremium?.toLocaleString()}</td>
                          <td className={styles.text_107}>{client.mobileNumber}</td>
                          <td className={styles.text_107}>{client.email}</td>
                          <td className={`${styles.text_107} max-w-[150px] truncate`} title={client.address}>{client.address}</td>
                          <td className={styles.text_107}>{client.beneficiary}</td>
                          <td className={styles.text_107}>{client.fundAllocation}</td>
                          <td className={styles.text_107}>{client.modeOfPayment}</td>
                          <td className="py-2 px-3 text-right sticky right-0 bg-card group-hover:bg-surface-2/50 text-xs">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {canEdit && (
                                <button onClick={() => { setCurrentClient(client); setActiveModal('edit'); }} className="p-2 text-muted hover:text-[#F4C542] transition-colors duration-200 bg-card border border-transparent hover:border-primary rounded-full shadow-sm" title="Edit">
                                  <Edit2 size={14} />
                                </button>
                              )}
                              {canDelete && (
                                <button onClick={() => confirmDeleteClient(client.id)} className="p-2 text-muted hover:text-red-500 transition-colors duration-200 bg-card border border-transparent hover:border-red-500 rounded-full shadow-sm" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && filteredClients.length === 0 && (
                        <tr>
                          <td colSpan={14} className="py-8 text-center text-text-secondary text-sm">No clients assigned to this advisor matching search criteria.</td>
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
              <form id="cpst-form" onSubmit={handleSaveClient} className="space-y-4 text-left">
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

                <div>
                  <label className={formLabelClass}>Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={currentClient.clientName || ''} onChange={e => setCurrentClient({ ...currentClient, clientName: e.target.value })} required className={formInputClass} placeholder="Full Name" />
                </div>
                <div>
                  <label className={formLabelClass}>Relationship</label>
                  <input type="text" value={currentClient.relationship || ''} onChange={e => setCurrentClient({ ...currentClient, relationship: e.target.value })} className={formInputClass} placeholder="Self, Spouse, etc." />
                </div>
                <div>
                  <label className={formLabelClass}>Approval Date</label>
                  <input type="date" value={currentClient.approvalDate || ''} onChange={e => setCurrentClient({ ...currentClient, approvalDate: e.target.value })} className={formInputClass} />
                </div>

                <div>
                  <label className={formLabelClass}>Policy Number</label>
                  <input type="text" value={currentClient.policyNumber || ''} onChange={e => setCurrentClient({ ...currentClient, policyNumber: e.target.value })} className={formInputClass} placeholder="POL-12345" />
                </div>
                <div>
                  <label className={formLabelClass}>Product</label>
                  <select value={currentClient.product || ''} onChange={e => setCurrentClient({ ...currentClient, product: e.target.value })} className={formInputClass}>
                    <option value="">Select Product</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={formLabelClass}>Annual Premium</label>
                  <input type="number" value={currentClient.annualPremium || ''} onChange={e => setCurrentClient({ ...currentClient, annualPremium: Number(e.target.value) })} className={formInputClass} placeholder="0.00" />
                </div>

                <div>
                  <label className={formLabelClass}>Mode of Payment</label>
                  <select value={currentClient.modeOfPayment || 'Annual'} onChange={e => setCurrentClient({ ...currentClient, modeOfPayment: e.target.value })} className={formInputClass}>
                    {PAYMENT_MODES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={formLabelClass}>Fund Allocation</label>
                  <input type="text" value={currentClient.fundAllocation || ''} onChange={e => setCurrentClient({ ...currentClient, fundAllocation: e.target.value })} className={formInputClass} placeholder="100% Equity" />
                </div>
                <div>
                  <label className={formLabelClass}>Beneficiary</label>
                  <input type="text" value={currentClient.beneficiary || ''} onChange={e => setCurrentClient({ ...currentClient, beneficiary: e.target.value })} className={formInputClass} placeholder="Beneficiary Name" />
                </div>

                <div>
                  <label className={formLabelClass}>Mobile Number</label>
                  <input type="text" value={currentClient.mobileNumber || ''} onChange={e => setCurrentClient({ ...currentClient, mobileNumber: e.target.value })} className={formInputClass} placeholder="+63..." />
                </div>
                <div>
                  <label className={formLabelClass}>Email Address</label>
                  <input type="email" value={currentClient.email || ''} onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })} className={formInputClass} placeholder="email@example.com" />
                </div>
                <div>
                  <label className={formLabelClass}>Address</label>
                  <input type="text" value={currentClient.address || ''} onChange={e => setCurrentClient({ ...currentClient, address: e.target.value })} className={formInputClass} placeholder="Full Address" />
                </div>
                <div>
                  <SignaturePad
                    initialSignature={currentClient.signatureData}
                    onSignatureChange={(sig) => setCurrentClient({ ...currentClient, signatureData: sig || undefined })}
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="submit" form="cpst-form" className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-sm py-2.5 rounded-full transition-all duration-200 cursor-pointer border border-[#F4C542]/30 shadow-sm active:scale-[0.97]">
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
                <h2 className="text-base font-bold text-text">CAMS Batch Import</h2>
                <p className="text-xs text-text-secondary">Process client registers via CSV or Excel sheets.</p>
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

            <div className="p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/20 text-left">
              <label className={formLabelClass}>Import For Advisor <span className="text-red-500">*</span></label>
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
            </div>

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
                      disabled={!pastedText.trim() || !importAdvisorId}
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
                    <span className="font-bold text-emerald-500">{importState.importedCount}</span> Imported<br />
                    <span className="font-bold text-orange-500">{importState.skippedHeaders}</span> Skipped Headers<br />
                    <span className="font-bold text-orange-500">{importState.skippedEmpty}</span> Skipped Empty Rows<br />
                    <span className="font-bold text-red-500">{importState.skippedInvalid}</span> Skipped Invalid Rows
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
        title="Delete Client Record"
        message="Are you sure you want to delete this client? This will also permanently delete all associated policy cards, payments, forms, and activity records linked to this client. This action cannot be undone."
        confirmText="Delete Client"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}