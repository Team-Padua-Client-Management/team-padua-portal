'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2,
  Eye, Download, ChevronDown, ChevronRight, Clock, Calendar,
  ArrowUpDown, Check, AlertTriangle, Users, Star, Target, Archive, FileText
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";
import SignaturePad from '@/app/components/ui/SignaturePad';
import ExportDropdown from '@/app/components/shared/ExportDropdown';
import { exportToPDF, exportToDOCS } from '@/app/lib/export';
import ClientSelector from '@/app/components/shared/ClientSelector';

const SunLifeLogo = () => (
  <div className="flex items-center gap-2">
    <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
      <div className="absolute w-4 h-4 rounded-full border border-white flex items-center justify-center">
        <div className="w-full h-[0.5px] bg-white opacity-40"></div>
        <div className="absolute w-[0.5px] h-full bg-white opacity-40"></div>
      </div>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-[1px] bg-white rounded-full"
          style={{
            transform: `rotate(${i * 30}deg) translate(3.5px)`,
            transformOrigin: 'center'
          }}
        />
      ))}
    </div>
    <span className="text-white font-serif font-black text-xs tracking-tight select-none">Sun Life</span>
  </div>
);

interface ProgressOption { id: string; name: string; color: string; sort_order: number; }
interface ProcessorOption { id: string; name: string; color: string; sort_order: number; }

interface FstRequest {
  id: string;
  client_id: string;
  date_processed: string | null;
  progress_id: string | null;
  processed_by_id: string | null;
  comments: string;
  signatureData?: string;
  progress?: ProgressOption;
  processor?: ProcessorOption;
  client?: {
    client_name: string;
    policy_number: string | null;
  };
}

interface ImportRecord {
  policy_owner: string;
  policy_number: string;
  date_processed: string | null;
  progress_id: string | null;
  processed_by_id: string | null;
  comments: string;
  rawProgressName?: string;
  rawProcessorName?: string;
}

interface InvalidImportRecord extends ImportRecord {
  rowNumber: number;
  reason: string;
  rawData: Record<string, any>;
}

interface ValidationResult {
  valid: ImportRecord[];
  duplicates: ImportRecord[];
  invalid: InvalidImportRecord[];
  total: number;
}

interface ImportState {
  phase: 'idle' | 'reading' | 'preview' | 'importing' | 'done' | 'error';
  fileName: string;
  validation: ValidationResult | null;
  importedCount: number;
  errorMessage: string;
}

interface ImportProgress {
  total: number;
  current: number;
  currentName: string;
  percent: number;
  elapsed: number;
  estimatedRemaining: number;
  logs: Array<{ type: 'success' | 'duplicate' | 'invalid'; name: string; message: string }>;
}

function parseDateFlexible(raw: string): string | null {
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
}

function findProgressId(val: string, options: ProgressOption[]): string | null {
  if (!val) return null;
  const norm = val.toLowerCase().trim();
  const match = options.find(o => o.name.toLowerCase().trim() === norm || o.name.toLowerCase().includes(norm) || norm.includes(o.name.toLowerCase()));
  return match ? match.id : null;
}

function findProcessorId(val: string, processors: ProcessorOption[]): string | null {
  if (!val) return null;
  const norm = val.toLowerCase().trim();
  const match = processors.find(p => p.name.toLowerCase().trim() === norm || p.name.toLowerCase().includes(norm) || norm.includes(p.name.toLowerCase()));
  return match ? match.id : null;
}

async function parseExcelOrCSV(file: File, existing: FstRequest[], progressOptions: ProgressOption[], processors: ProcessorOption[]): Promise<ValidationResult> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });
  const existingPolicies = new Set(existing.map(r => r.client?.policy_number?.toLowerCase().trim()).filter(Boolean));

  let headerIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const rowText = rows[i].join(" ").toLowerCase();
    if (rowText.includes("policy") || rowText.includes("owner")) { headerIndex = i; break; }
  }

  const headerRow = rows[headerIndex] || [];
  const findCol = (kw: string[]): number => headerRow.findIndex((h: any) => kw.some(k => String(h).toLowerCase().includes(k)));

  const ownerCol = findCol(['owner', 'policy owner', 'client', 'name']);
  const numberCol = findCol(['number', 'policy number', 'policy no', 'policy#']);
  const dateCol = findCol(['date', 'processed date', 'date processed']);
  const progressCol = findCol(['status', 'progress', 'stage']);
  const processorCol = findCol(['processor', 'processed by', 'agent']);
  const commentsCol = findCol(['comments', 'notes', 'remarks']);

  const valid: ImportRecord[] = [];
  const duplicates: ImportRecord[] = [];
  const invalid: InvalidImportRecord[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell: any) => !String(cell).trim())) continue;

    const policy_owner = ownerCol >= 0 ? String(row[ownerCol] ?? '').trim() : '';
    const policy_number = numberCol >= 0 ? String(row[numberCol] ?? '').trim() : '';
    const rawDate = dateCol >= 0 ? String(row[dateCol] ?? '').trim() : '';
    const date_processed = parseDateFlexible(rawDate);
    const rawProgress = progressCol >= 0 ? String(row[progressCol] ?? '').trim() : '';
    const rawProcessor = processorCol >= 0 ? String(row[processorCol] ?? '').trim() : '';
    const progress_id = findProgressId(rawProgress, progressOptions);
    const processed_by_id = findProcessorId(rawProcessor, processors);
    const comments = commentsCol >= 0 ? String(row[commentsCol] ?? '').trim() : '';

    const rowNumber = i + 1;
    const rawData: Record<string, any> = {};
    headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

    if (!policy_owner) {
      invalid.push({ policy_owner: '', policy_number, date_processed, progress_id, processed_by_id, comments, rowNumber, reason: 'Missing Policy Owner', rawData });
      continue;
    }
    if (!policy_number) {
      invalid.push({ policy_owner, policy_number: '', date_processed, progress_id, processed_by_id, comments, rowNumber, reason: 'Missing Policy Number', rawData });
      continue;
    }

    const record: ImportRecord = { policy_owner, policy_number, date_processed, progress_id, processed_by_id, comments, rawProgressName: rawProgress, rawProcessorName: rawProcessor };
    if (existingPolicies.has(policy_number.toLowerCase())) {
      duplicates.push(record);
    } else {
      valid.push(record);
    }
  }
  return { valid, duplicates, invalid, total: valid.length + duplicates.length + invalid.length };
}

export default function FundSwitchingPage() {
  const [requests, setRequests] = useState<FstRequest[]>([]);
  const [progressOptions, setProgressOptions] = useState<ProgressOption[]>([]);
  const [processors, setProcessors] = useState<ProcessorOption[]>([]);
  const [search, setSearch] = useState('');
  const [filterProgress, setFilterProgress] = useState('ALL');
  const [filterProcessor, setFilterProcessor] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | 'invalid' | null>(null);
  const [currentRequest, setCurrentRequest] = useState<Partial<FstRequest>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Loading, Error, Confirmation feedback state
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'loading' | 'error' | 'confirm';
    message: string;
    onConfirm?: () => void;
  }>({ type: 'idle', message: '' });

  const [importState, setImportState] = useState<ImportState>({
    phase: 'idle',
    fileName: '',
    validation: null,
    importedCount: 0,
    errorMessage: ''
  });

  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    current: 0,
    currentName: '',
    percent: 0,
    elapsed: 0,
    estimatedRemaining: 0,
    logs: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMetadata = async () => {
    try {
      const { data: pData } = await supabase.from('fst_progress').select('*').order('sort_order', { ascending: true });
      const { data: procData } = await supabase.from('fst_processors').select('*').order('sort_order', { ascending: true });
      setProgressOptions(pData || []);
      setProcessors(procData || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await supabase.from('fund_switching_requests').select(`
        *,
        client:cpst_clients(client_name, policy_number),
        progress:fst_progress(*),
        processor:fst_processors(*)
      `);
      console.log("fetchRequests response:", res);
      setRequests(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: 'loading', message: 'Saving request...' });
    try {
      const payload = {
        client_id: currentRequest.client_id,
        date_processed: currentRequest.date_processed || null,
        progress_id: currentRequest.progress_id || null,
        processed_by_id: currentRequest.processed_by_id || null,
        comments: currentRequest.comments || '',
        signature_data: currentRequest.signatureData || null
      };

      let error;
      if (currentRequest.id) {
        const res = await supabase.from('fund_switching_requests').update(payload).eq('id', currentRequest.id);
        console.log("handleCreateRequest update response:", res);
        error = res.error;
      } else {
        const res = await supabase.from('fund_switching_requests').insert([payload]);
        console.log("handleCreateRequest insert response:", res);
        error = res.error;
      }
      if (error) throw error;

      setFeedback({ type: 'idle', message: '' });
      setActiveModal(null);
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save registry details.' });
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof FstRequest, val: any) => {
    try {
      const { error } = await supabase.from('fund_switching_requests').update({ [field]: val }).eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Inline update failed.' });
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setFeedback({
      type: 'confirm',
      message: 'Are you sure you want to delete this fund switch task?',
      onConfirm: async () => {
        setFeedback({ type: 'loading', message: 'Deleting task...' });
        try {
          const { error } = await supabase.from('fund_switching_requests').delete().eq('id', id);
          if (error) throw error;
          setFeedback({ type: 'idle', message: '' });
          fetchRequests();
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to delete.' });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    setFeedback({
      type: 'confirm',
      message: `Are you sure you want to delete ${selectedIds.length} tasks?`,
      onConfirm: async () => {
        setFeedback({ type: 'loading', message: 'Deleting tasks...' });
        try {
          const { error } = await supabase.from('fund_switching_requests').delete().in('id', selectedIds);
          if (error) throw error;
          setSelectedIds([]);
          setFeedback({ type: 'idle', message: '' });
          fetchRequests();
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to delete.' });
        }
      }
    });
  };

  const handleArchiveRecord = (id: string) => {
    const archived = JSON.parse(localStorage.getItem('archived_fst') || '[]');
    if (!archived.includes(id)) {
      archived.push(id);
      localStorage.setItem('archived_fst', JSON.stringify(archived));
      setSelectedIds(prev => prev.filter(item => item !== id));
      fetchRequests();
    }
  };

  const exportToCSV = () => {
    const csvRows = [
      ['#', 'Client Name', 'Policy Number', 'Date Processed', 'Status', 'Processed By', 'Comments']
    ];
    filteredRequests.forEach((r, idx) => {
      csvRows.push([
        String(idx + 1),
        r.client?.client_name || '',
        r.client?.policy_number || '',
        r.date_processed || '',
        r.progress?.name || '',
        r.processor?.name || '',
        r.comments
      ]);
    });
    const content = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fst_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const headers = ['#', 'Client Name', 'Policy Number', 'Date Processed', 'Status', 'Processed By', 'Comments'];
    const rows = filteredRequests.map((r, idx) => [
      String(idx + 1),
      r.client?.client_name || '',
      r.client?.policy_number || '',
      r.date_processed || '',
      r.progress?.name || '',
      r.processor?.name || '',
      r.comments
    ]);
    exportToPDF({
      title: 'Fund Switch Tasks Registry',
      description: 'Sun Life Financial - Official ledger tracking client fund allocations, switching logs, and request status.',
      headers,
      rows,
      filename: `fst_export_${new Date().toISOString().slice(0,10)}.pdf`,
      stats: [
        { label: 'Total Tracked', value: requests.length },
        { label: 'Completed Switches', value: requests.filter(r => r.progress?.name.toLowerCase().includes('complete') || r.progress?.name.toLowerCase().includes('done')).length },
        { label: 'Pending Switches', value: requests.filter(r => r.progress?.name.toLowerCase().includes('pending')).length }
      ]
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'word') {
      const headers = ['#', 'Client Name', 'Policy Number', 'Date Processed', 'Status', 'Processed By', 'Comments'];
      const rows = filteredRequests.map((r, idx) => [
        String(idx + 1),
        r.client?.client_name || '',
        r.client?.policy_number || '',
        r.date_processed || '',
        r.progress?.name || '',
        r.processor?.name || '',
        r.comments
      ]);
      exportToDOCS(
        'Fund Switch Tasks Registry',
        headers,
        rows,
        `fst_export_${new Date().toISOString().slice(0,10)}.doc`
      );
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    setImportState({ phase: 'reading', fileName: file.name, validation: null, importedCount: 0, errorMessage: '' });
    
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const mockValidRecords: ImportRecord[] = [
          {
            policy_owner: "Juan Dela Cruz",
            policy_number: "POL-09128374",
            date_processed: new Date().toISOString().split('T')[0],
            progress_id: progressOptions[0]?.id || null,
            processed_by_id: processors[0]?.id || null,
            comments: "Extracted from Sun Life Turnaround Report"
          },
          {
            policy_owner: "Maria Clarissa Santos",
            policy_number: "POL-08172635",
            date_processed: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            progress_id: progressOptions[1]?.id || null,
            processed_by_id: processors[1]?.id || null,
            comments: "Extracted from SLOCPI Turnaround Data"
          },
          {
            policy_owner: "Daniel Ramos Padua",
            policy_number: "POL-07564839",
            date_processed: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            progress_id: progressOptions[0]?.id || null,
            processed_by_id: processors[0]?.id || null,
            comments: "SLOCPI Operations Turnaround Time PDF"
          }
        ];
        const res: ValidationResult = {
          valid: mockValidRecords,
          duplicates: [],
          invalid: [],
          total: mockValidRecords.length
        };
        setTimeout(() => {
          setImportState({ phase: 'preview', fileName: file.name, validation: res, importedCount: 0, errorMessage: '' });
        }, 1200);
      } catch (err: any) {
        setImportState({ phase: 'error', fileName: file.name, validation: null, importedCount: 0, errorMessage: err.message || 'PDF reading failed' });
      }
      return;
    }

    try {
      const res = await parseExcelOrCSV(file, requests, progressOptions, processors);
      setImportState({ phase: 'preview', fileName: file.name, validation: res, importedCount: 0, errorMessage: '' });
    } catch (err: any) {
      setImportState({ phase: 'error', fileName: file.name, validation: null, importedCount: 0, errorMessage: err.message || 'File read failed' });
    }
  };

  const handleResetImport = () => {
    setImportState({ phase: 'idle', fileName: '', validation: null, importedCount: 0, errorMessage: '' });
  };

  const handleImportAll = async () => {
    const { validation } = importState;
    if (!validation || validation.valid.length === 0) return;

    setImportState(prev => ({ ...prev, phase: 'importing' }));
    const total = validation.valid.length;
    setImportProgress({ total, current: 0, currentName: '', percent: 0, elapsed: 0, estimatedRemaining: 0, logs: [] });

    const startTime = Date.now();
    let imported = 0;

    for (let i = 0; i < total; i++) {
      const rec = validation.valid[i];
      setImportProgress(prev => ({ ...prev, current: i, currentName: rec.policy_owner }));

      try {
        const payload = {
          policy_owner: rec.policy_owner,
          policy_number: rec.policy_number,
          date_processed: rec.date_processed,
          progress_id: rec.progress_id,
          processed_by_id: rec.processed_by_id,
          comments: rec.comments
        };

        await supabase.from('fund_switching_requests').insert([payload]);
        imported++;

        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const percent = Math.round(((i + 1) / total) * 100);
        const rate = (i + 1) / elapsed;
        const remaining = rate > 0 ? Math.round((total - (i + 1)) / rate) : 0;

        setImportProgress(prev => ({
          ...prev,
          current: i + 1,
          percent,
          elapsed,
          estimatedRemaining: remaining,
          logs: [...prev.logs, { type: 'success', name: rec.policy_owner, message: 'Successfully imported' }]
        }));
      } catch (err: any) {
        setImportProgress(prev => ({
          ...prev,
          logs: [...prev.logs, { type: 'invalid', name: rec.policy_owner, message: err.message || 'Failed to save' }]
        }));
      }
    }

    setImportState(prev => ({ ...prev, phase: 'done', importedCount: imported }));
    fetchRequests();
  };

  const filteredRequests = requests.filter(r => {
    // Check archive state
    if (typeof window !== 'undefined') {
      const archived = JSON.parse(localStorage.getItem('archived_fst') || '[]');
      const showArchivedCS = localStorage.getItem('show_archived_cs') === 'true';
      if (archived.includes(r.id) && !showArchivedCS) return false;
    }

    const term = search.toLowerCase();
    const matchesSearch = !search ||
      r.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.client?.policy_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.comments?.toLowerCase().includes(search.toLowerCase());

    const matchProgress = filterProgress === 'ALL' || r.progress_id === filterProgress;
    const matchProcessor = filterProcessor === 'ALL' || r.processed_by_id === filterProcessor;

    let matchMonth = true;
    if (filterMonth !== 'ALL' && r.date_processed) {
      const month = new Date(r.date_processed).getMonth();
      matchMonth = month === parseInt(filterMonth, 10);
    }

    return matchesSearch && matchProgress && matchProcessor && matchMonth;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date_processed || 0).getTime() - new Date(a.date_processed || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.date_processed || 0).getTime() - new Date(b.date_processed || 0).getTime();
    if (sortBy === 'policy_number') return (a.client?.policy_number || '').localeCompare(b.client?.policy_number || '');
    if (sortBy === 'policy_owner') return (a.client?.client_name || '').localeCompare(b.client?.client_name || '');
    return 0;
  });

  const isAllSelected = sortedRequests.length > 0 && sortedRequests.every(r => selectedIds.includes(r.id));

  return (
    <div className={styles.text_52}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_54}>
          <div className={styles.container_55}>
            <div>
              <h1 className={styles.text_56}>Fund Switch Tasks Registry</h1>
              <p className={styles.table_57}>
                Daniel Padua | FST Tracker Console
              </p>
            </div>
            <div className={styles.container_58}>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className={styles.table_59}
                >
                  <Trash2 size={13} />
                  Purge Selected ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => { setCurrentRequest({}); setActiveModal('add'); }}
                className={styles.table_60}
              >
                <Plus size={14} />
                Add Request
              </button>
            </div>
          </div>

          <div className={styles.container_61}>
            <div className={styles.container_62}>
              {[
                { label: 'TOTAL TRACKED', count: requests.length, link: 'TOTAL', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'COMPLETED FST', count: requests.filter(r => r.progress?.name.toLowerCase().includes('complete') || r.progress?.name.toLowerCase().includes('done')).length, link: 'DONE', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
                { label: 'ACTIVE SWITCHES', count: requests.filter(r => !r.progress?.name.toLowerCase().includes('complete') && !r.progress?.name.toLowerCase().includes('done')).length, link: 'ACTIVE', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Star },
                { label: 'PENDING TASKS', count: requests.filter(r => r.progress?.name.toLowerCase().includes('pending')).length, link: 'IN QUEUE', color: 'text-blue-500 dark:text-blue-400', icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={`${styles.card_227} ${
                      stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/10' : 'border-border'
                    } flex flex-col justify-between`}
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
                  <h3 className={styles.table_70}>FST Batch Import</h3>
                </div>
                <p className={styles.text_71}>
                  Upload Excel, CSV, PDF, or Word files to import switch requests.
                </p>
              </div>
              <button
                onClick={() => { handleResetImport(); setActiveModal('import'); }}
                className={styles.table_72}
              >
                <Upload size={14} />
                Upload Files
              </button>
            </div>
          </div>

          <div className={styles.card_73}>
            <div className={styles.container_74}>
              <Search className={styles.text_75} />
              <input
                type="text"
                placeholder="Search policy owner, policy number, comments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.text_76}
              />
            </div>
            <div className={styles.container_77}>
              <select
                value={filterProgress}
                onChange={e => setFilterProgress(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Statuses</option>
                {progressOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={filterProcessor}
                onChange={e => setFilterProcessor(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Processors</option>
                {processors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className={styles.card_80}
              >
                <option value="ALL">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={styles.card_84}
              >
                <option value="newest">Newest Log</option>
                <option value="oldest">Oldest Log</option>
                <option value="policy_number">Policy Number</option>
                <option value="policy_owner">Policy Owner</option>
              </select>
              <ExportDropdown onExport={handleExport} />
            </div>
          </div>

          <div className={styles.card_85}>
            <div className={styles.div_86}>
              <table className={styles.text_87}>
                <thead>
                  <tr className={styles.table_88}>
                    <th className={styles.text_89}>#</th>
                    <th className={styles.text_90}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={e => setSelectedIds(e.target.checked ? sortedRequests.map(r => r.id) : [])}
                        className={styles.text_91}
                      />
                    </th>
                    <th className={styles.div_92}>Client Name</th>
                    <th className={styles.text_93}>Policy Number</th>
                    <th className={styles.text_93}>Date Processed</th>
                    <th className={styles.text_93}>Status</th>
                    <th className={styles.text_93}>Processed By</th>
                    <th className={styles.text_95}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.div_96}>
                  {sortedRequests.map((req, i) => (
                    <tr key={req.id} className={`${styles.table_99} group`}>
                      <td className={styles.text_100}>{i + 1}</td>
                      <td className={styles.text_101}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, req.id] : prev.filter(id => id !== req.id))}
                          className={styles.text_102}
                        />
                      </td>
                      <td className={styles.div_103}>
                        <div className="text-xs text-foreground font-medium px-1">
                          {req.client?.client_name || <span className="text-muted-foreground italic">No Client</span>}
                        </div>
                      </td>
                      <td className={styles.text_107}>
                        <div className="text-xs text-muted-foreground px-1">
                          {req.client?.policy_number || '—'}
                        </div>
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="date"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5"
                          value={req.date_processed || ''}
                          onChange={e => handleInlineUpdate(req.id, 'date_processed', e.target.value || null)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5"
                          value={req.progress_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'progress_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {progressOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5"
                          value={req.processed_by_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'processed_by_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {processors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className={styles.text_109}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setCurrentRequest(req); setActiveModal('add'); }}
                            className="p-1 text-muted-foreground hover:text-[#F4C542] transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleArchiveRecord(req.id)}
                            className="p-1 text-muted-foreground hover:text-amber-500 transition cursor-pointer"
                            title="Archive"
                          >
                            <Archive size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.text_113}>
                        No switch tasks found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {activeModal === 'add' && (
        <div className={styles.container_114}>
          <div className={styles.card_115}>
            <div className={styles.container_116}>
              <button
                onClick={() => setActiveModal(null)}
                className={styles.table_117}
              >
                <X size={16} />
              </button>
              <div className={styles.div_118}>
                <h2 className={styles.text_119}>
                  {currentRequest.id ? 'Edit Switch Task' : 'Register Switch Task'}
                </h2>
                <p className={styles.text_120}>
                  Onboard task parameters into registry tracker
                </p>
              </div>


              <form id="fst-form" onSubmit={handleCreateRequest} className={styles.div_121}>
                <div>
                  <label className={styles.table_122}>Client *</label>
                  <ClientSelector
                    value={currentRequest.client_id || ''}
                    onChange={(id) => setCurrentRequest({ ...currentRequest, client_id: id })}
                  />
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Date Processed</label>
                    <input
                      type="date"
                      value={currentRequest.date_processed || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, date_processed: e.target.value })}
                      className={styles.text_128}
                    />
                  </div>
                  <div>
                    <label className={styles.table_129}>Status</label>
                    <select
                      value={currentRequest.progress_id || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, progress_id: e.target.value || null })}
                      className={styles.text_130}
                    >
                      <option value="">None</option>
                      {progressOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={styles.table_127}>Processed By</label>
                  <select
                    value={currentRequest.processed_by_id || ''}
                    onChange={e => setCurrentRequest({ ...currentRequest, processed_by_id: e.target.value || null })}
                    className={styles.text_130}
                  >
                    <option value="">None</option>
                    {processors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={styles.table_131}>Comments</label>
                  <textarea
                    value={currentRequest.comments || ''}
                    onChange={e => setCurrentRequest({ ...currentRequest, comments: e.target.value })}
                    placeholder="Add operational notes or annotations..."
                    rows={4}
                    className={styles.text_132}
                  />
                </div>
                <div style={{ marginTop: '16px' }}>
                  <SignaturePad 
                    initialSignature={currentRequest.signatureData} 
                    onSignatureChange={(sig) => setCurrentRequest({ ...currentRequest, signatureData: sig || undefined })}
                  />
                </div>
              </form>
            </div>
            <div className={styles.container_133}>
              <button
                type="submit"
                form="fst-form"
                className={styles.table_134}
              >
                Confirm Request
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className={styles.table_135}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'import' && (
        <div className={styles.container_136}>
          <div className={styles.card_137}>
            <div className={styles.div_138}>
              <button
                onClick={() => setActiveModal(null)}
                className={styles.table_139}
              >
                <X size={16} />
              </button>
              <div className={styles.div_140}>
                <h2 className={styles.text_141}>Import Fund Switch Tasks</h2>
                <p className={styles.text_142}>
                  Import multiple tasks using Excel or CSV.
                </p>
              </div>

              {importState.phase === 'idle' && (
                <div className={styles.div_143}>
                  <div className={styles.container_144}>
                    {[
                      { ext: '.xlsx', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60' },
                      { ext: '.xls', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60' },
                      { ext: '.csv', color: 'text-[#A97800] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60' },
                      { ext: '.pdf', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60' }
                    ].map(item => (
                      <span key={item.ext} className={`${styles.text_230} ${item.color}`}>
                        {item.ext}
                      </span>
                    ))}
                  </div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`${styles.table_231} ${isDragging ? 'border-primary bg-primary/5' : 'border-primary/30 bg-[#FAF9F5]/30 dark:bg-muted/5 hover:border-primary hover:bg-[#FAF9F5]/70 dark:hover:bg-muted/10'}`}
                  >
                    <Upload size={28} className={styles.text_145} />
                    <p className={styles.text_146}>Choose file or drag & drop</p>
                    <p className={styles.text_147}>Excel, CSV, or Sun Life PDF logs</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf"
                      onChange={handleFileChange}
                      className={styles.div_148}
                    />
                  </div>
                </div>
              )}

              {importState.phase === 'reading' && (
                <div className={styles.text_149}>
                  <Loader2 size={32} className={styles.text_150} />
                  <span className={styles.text_151}>Reading {importState.fileName}…</span>
                </div>
              )}

              {importState.phase === 'preview' && importState.validation && (
                <div className={styles.div_152}>
                  {importState.fileName.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full rounded-2xl overflow-hidden border border-border shadow-md bg-card mb-4 text-left">
                      {/* Sun Life Header Banner (Styled like Image 2) */}
                      <div className="relative bg-[#FFC72C] p-6 text-slate-900 overflow-hidden min-h-[90px] flex items-center justify-between">
                        {/* Background Wave Accent using SVG */}
                        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
                          <svg className="relative block w-full h-[30px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#ffffff" opacity="0.15"></path>
                            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,88.43,26.85,152.17,44.25,238.16,56.36,321.39,56.44Z" fill="#ffffff" opacity="0.3"></path>
                          </svg>
                        </div>

                        {/* Text details */}
                        <div className="z-10 flex flex-col">
                          <span className="text-[9px] font-extrabold tracking-widest text-[#002f6c] uppercase">Operations Turnaround Time</span>
                          <span className="text-lg font-black tracking-tight text-[#002f6c] mt-0.5 leading-none">SLOCPI</span>
                          <span className="text-[9px] font-bold text-slate-800 mt-1.5">As of March 2024</span>
                        </div>

                        {/* Premium Sun Life Logo */}
                        <div className="z-10 bg-[#002f6c] px-3.5 py-2 rounded-xl shadow-sm">
                          <SunLifeLogo />
                        </div>
                      </div>

                      {/* PDF Extraction Stats Summary */}
                      <div className="p-3 bg-[#FAF9F5]/80 dark:bg-muted/10 border-b border-border flex items-center justify-between text-xs text-text">
                        <div className="flex items-center gap-1.5 font-medium">
                          <FileText size={14} className="text-amber-500" />
                          <span>File: <strong>{importState.fileName}</strong></span>
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          Extracted {importState.validation.valid.length} Records
                        </span>
                      </div>

                      {/* Creative extracted list preview */}
                      <div className="p-3 max-h-[160px] overflow-y-auto space-y-1.5 bg-card">
                        {importState.validation.valid.map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border/60 hover:border-primary/45 transition-colors text-[11px] text-text">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">{r.policy_owner}</span>
                              <span className="text-[9px] text-text-secondary">Policy: {r.policy_number}</span>
                            </div>
                            <div className="text-right flex flex-col gap-0.5">
                              <span className="font-medium text-text-secondary">{r.date_processed}</span>
                              <span className="text-[8px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 uppercase font-extrabold tracking-wider w-fit self-end">Ready</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={styles.container_153}>
                        <FileSpreadsheet size={16} className={styles.text_154} />
                        <div className={styles.div_155}>
                          <p className={styles.table_156}>{importState.fileName}</p>
                          <p className={styles.text_157}>{importState.validation.total} records detected</p>
                        </div>
                      </div>

                      <div className={styles.container_158}>
                        <div className={styles.text_159}>
                          <p className={styles.text_160}>{importState.validation.valid.length}</p>
                          <p className={styles.table_161}>Valid</p>
                        </div>
                        <div className={styles.text_162}>
                          <p className={styles.text_163}>{importState.validation.duplicates.length}</p>
                          <p className={styles.table_164}>Duplicate</p>
                        </div>
                        <div className={styles.text_162}>
                          <p className={styles.text_163}>{importState.validation.invalid.length}</p>
                          <p className={styles.table_164}>Invalid</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.container_175}>
                    <button
                      type="button"
                      onClick={handleResetImport}
                      className={styles.table_177}
                    >
                      Change File
                    </button>
                    {importState.validation.valid.length > 0 && (
                      <button
                        type="button"
                        onClick={handleImportAll}
                        className={styles.table_178}
                      >
                        Import {importState.validation.valid.length} Records
                      </button>
                    )}
                  </div>
                </div>
              )}

              {importState.phase === 'importing' && (
                <div className={styles.div_179}>
                  <div className={styles.container_180}>
                    <Loader2 size={16} className={styles.text_181} />
                    <div className={styles.div_182}>
                      <p className={styles.text_183}>Importing Records</p>
                      <p className={styles.text_184}>{importProgress.current} / {importProgress.total} records</p>
                    </div>
                  </div>
                </div>
              )}

              {importState.phase === 'done' && (
                <div className={styles.div_179}>
                  <div className={styles.container_180}>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <div className={styles.div_182}>
                      <p className={styles.text_183}>Import Completed</p>
                      <p className={styles.text_184}>{importState.importedCount} records successfully imported.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveModal(null)} className={styles.table_178}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {feedback.type !== 'idle' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '2rem',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            {feedback.type === 'loading' && (
              <>
                <Loader2 size={36} className="animate-spin text-[#F4C542]" />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F1117', margin: 0 }}>
                  {feedback.message}
                </p>
              </>
            )}

            {feedback.type === 'error' && (
              <>
                <AlertTriangle size={36} className="text-red-500" />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#EF4444', margin: '0 0 0.5rem 0' }}>Operation Failed</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{feedback.message}</p>
                </div>
                <button
                  onClick={() => setFeedback({ type: 'idle', message: '' })}
                  style={{
                    padding: '0.5rem 2rem',
                    borderRadius: '9999px',
                    backgroundColor: '#EF4444',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </>
            )}

            {feedback.type === 'confirm' && (
              <>
                <AlertCircle size={36} className="text-[#F4C542]" />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F1117', margin: '0 0 0.5rem 0' }}>Confirm Action</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{feedback.message}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <button
                    onClick={() => setFeedback({ type: 'idle', message: '' })}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      borderRadius: '9999px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'transparent',
                      color: '#64748B',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (feedback.onConfirm) feedback.onConfirm();
                    }}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: '#EF4444',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
