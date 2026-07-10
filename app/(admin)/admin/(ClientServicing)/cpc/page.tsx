'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2,
  Eye, Download, ChevronDown, ChevronRight, Clock, Calendar,
  ArrowUpDown, Check, AlertTriangle, Users, Star, Target
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader/page';
import Sidebar from '@/app/components/admin/AdminSidebar/page';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";

interface StatusOption { id: string; name: string; color: string; sort_order: number; }
interface ProcessorOption { id: string; name: string; color: string; sort_order: number; }

interface CpcRecord {
  id: string;
  policy_owner: string;
  policy_number: string;
  date_processed: string | null;
  digital_basic_id: string | null;
  digital_premium_id: string | null;
  hard_copy_id: string | null;
  processed_by_id: string | null;
  comments: string;
  digital_basic?: StatusOption;
  digital_premium?: StatusOption;
  hard_copy?: StatusOption;
  processor?: ProcessorOption;
}

interface ImportRecord {
  policy_owner: string;
  policy_number: string;
  date_processed: string | null;
  digital_basic_id: string | null;
  digital_premium_id: string | null;
  hard_copy_id: string | null;
  processed_by_id: string | null;
  comments: string;
  rawDigitalBasic?: string;
  rawDigitalPremium?: string;
  rawHardCopy?: string;
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

function findOptionId(val: string, options: StatusOption[]): string | null {
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

async function parseExcelOrCSV(file: File, existing: CpcRecord[], basicOpts: StatusOption[], premOpts: StatusOption[], hcOpts: StatusOption[], processors: ProcessorOption[]): Promise<ValidationResult> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });
  const existingPolicies = new Set(existing.map(r => r.policy_number.toLowerCase().trim()));

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
  const basicCol = findCol(['basic', 'digital basic']);
  const premCol = findCol(['premium', 'digital premium']);
  const hcCol = findCol(['hard copy', 'hardcopy']);
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
    const rawBasic = basicCol >= 0 ? String(row[basicCol] ?? '').trim() : '';
    const rawPrem = premCol >= 0 ? String(row[premCol] ?? '').trim() : '';
    const rawHc = hcCol >= 0 ? String(row[hcCol] ?? '').trim() : '';
    const rawProcessor = processorCol >= 0 ? String(row[processorCol] ?? '').trim() : '';

    const digital_basic_id = findOptionId(rawBasic, basicOpts);
    const digital_premium_id = findOptionId(rawPrem, premOpts);
    const hard_copy_id = findOptionId(rawHc, hcOpts);
    const processed_by_id = findProcessorId(rawProcessor, processors);
    const comments = commentsCol >= 0 ? String(row[commentsCol] ?? '').trim() : '';

    const rowNumber = i + 1;
    const rawData: Record<string, any> = {};
    headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

    if (!policy_owner) {
      invalid.push({ policy_owner: '', policy_number, date_processed, digital_basic_id, digital_premium_id, hard_copy_id, processed_by_id, comments, rowNumber, reason: 'Missing Policy Owner', rawData });
      continue;
    }
    if (!policy_number) {
      invalid.push({ policy_owner, policy_number: '', date_processed, digital_basic_id, digital_premium_id, hard_copy_id, processed_by_id, comments, rowNumber, reason: 'Missing Policy Number', rawData });
      continue;
    }

    const record: ImportRecord = { policy_owner, policy_number, date_processed, digital_basic_id, digital_premium_id, hard_copy_id, processed_by_id, comments, rawDigitalBasic: rawBasic, rawDigitalPremium: rawPrem, rawHardCopy: rawHc, rawProcessorName: rawProcessor };
    if (existingPolicies.has(policy_number.toLowerCase())) {
      duplicates.push(record);
    } else {
      valid.push(record);
    }
  }
  return { valid, duplicates, invalid, total: valid.length + duplicates.length + invalid.length };
}

export default function CpcDashboard() {
  const [records, setRecords] = useState<CpcRecord[]>([]);
  const [cpcOptions, setCpcOptions] = useState<StatusOption[]>([]);
  const [processors, setProcessors] = useState<ProcessorOption[]>([]);
  const [search, setSearch] = useState('');
  const [filterBasic, setFilterBasic] = useState('ALL');
  const [filterPremium, setFilterPremium] = useState('ALL');
  const [filterHardCopy, setFilterHardCopy] = useState('ALL');
  const [filterProcessor, setFilterProcessor] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | null>(null);
  const [currentRecord, setCurrentRecord] = useState<Partial<CpcRecord>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

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
    gradientPercent: 0,
    elapsed: 0,
    estimatedRemaining: 0,
    logs: []
  } as any);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMetadata = async () => {
    try {
      const { data: optData } = await supabase.from('cpc_options').select('*').order('sort_order', { ascending: true });
      const { data: procData } = await supabase.from('cpc_processors').select('*').order('sort_order', { ascending: true });
      setCpcOptions(optData || []);
      setProcessors(procData || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('cpc_records').select(`
        *,
        digital_basic:cpc_options!cpc_records_digital_basic_id_fkey(*),
        digital_premium:cpc_options!cpc_records_digital_premium_id_fkey(*),
        hard_copy:cpc_options!cpc_records_hard_copy_id_fkey(*),
        processor:cpc_processors(*)
      `);
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchRecords();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        policy_owner: currentRecord.policy_owner,
        policy_number: currentRecord.policy_number,
        date_processed: currentRecord.date_processed || null,
        digital_basic_id: currentRecord.digital_basic_id || null,
        digital_premium_id: currentRecord.digital_premium_id || null,
        hard_copy_id: currentRecord.hard_copy_id || null,
        processed_by_id: currentRecord.processed_by_id || null,
        comments: currentRecord.comments || ''
      };

      if (currentRecord.id) {
        await supabase.from('cpc_records').update(payload).eq('id', currentRecord.id);
      } else {
        await supabase.from('cpc_records').insert([payload]);
      }
      setActiveModal(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof CpcRecord, val: any) => {
    try {
      await supabase.from('cpc_records').update({ [field]: val }).eq('id', id);
      setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CPC record?')) return;
    try {
      await supabase.from('cpc_records').delete().eq('id', id);
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} CPC records?`)) return;
    try {
      await supabase.from('cpc_records').delete().in('id', selectedIds);
      setSelectedIds([]);
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const csvRows = [
      ['#', 'Policy Owner', 'Policy Number', 'Date Processed', 'Basic', 'Premium', 'Hard Copy', 'Processed By', 'Comments']
    ];
    filteredRecords.forEach((r, idx) => {
      csvRows.push([
        String(idx + 1),
        r.policy_owner,
        r.policy_number,
        r.date_processed || '',
        r.digital_basic?.name || '',
        r.digital_premium?.name || '',
        r.hard_copy?.name || '',
        r.processor?.name || '',
        r.comments
      ]);
    });
    const content = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cpc_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    try {
      const res = await parseExcelOrCSV(file, records, cpcOptions, cpcOptions, cpcOptions, processors);
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
          digital_basic_id: rec.digital_basic_id,
          digital_premium_id: rec.digital_premium_id,
          hard_copy_id: rec.hard_copy_id,
          processed_by_id: rec.processed_by_id,
          comments: rec.comments
        };

        await supabase.from('cpc_records').insert([payload]);
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
    fetchRecords();
  };

  const filteredRecords = records.filter(r => {
    const term = search.toLowerCase();
    const matchSearch =
      r.policy_owner.toLowerCase().includes(term) ||
      r.policy_number.toLowerCase().includes(term) ||
      (r.comments && r.comments.toLowerCase().includes(term));

    const matchBasic = filterBasic === 'ALL' || r.digital_basic_id === filterBasic;
    const matchPremium = filterPremium === 'ALL' || r.digital_premium_id === filterPremium;
    const matchHardCopy = filterHardCopy === 'ALL' || r.hard_copy_id === filterHardCopy;
    const matchProcessor = filterProcessor === 'ALL' || r.processed_by_id === filterProcessor;

    return matchSearch && matchBasic && matchPremium && matchHardCopy && matchProcessor;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date_processed || 0).getTime() - new Date(a.date_processed || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.date_processed || 0).getTime() - new Date(b.date_processed || 0).getTime();
    if (sortBy === 'policy_number') return a.policy_number.localeCompare(b.policy_number);
    if (sortBy === 'policy_owner') return a.policy_owner.localeCompare(b.policy_owner);
    return 0;
  });

  const isAllSelected = sortedRecords.length > 0 && sortedRecords.every(r => selectedIds.includes(r.id));

  return (
    <div className={styles.text_52}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_54}>
          <div className={styles.container_55}>
            <div>
              <h1 className={styles.text_56}>CPC Policy Cards Registry</h1>
              <p className={styles.table_57}>
                Daniel Padua | Client Policy Cards Dispatch Tracker
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
                onClick={() => { setCurrentRecord({}); setActiveModal('add'); }}
                className={styles.table_60}
              >
                <Plus size={14} />
                Register CPC
              </button>
            </div>
          </div>

          <div className={styles.container_61}>
            <div className={styles.container_62}>
              {[
                { label: 'TOTAL TRACKED', count: records.length, link: 'TOTAL', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'BASIC DIGITAL', count: records.filter(r => r.digital_basic?.name.toLowerCase().includes('complete') || r.digital_basic?.name.toLowerCase().includes('sent')).length, link: 'DIGITAL', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
                { label: 'PREMIUM DIGITAL', count: records.filter(r => r.digital_premium?.name.toLowerCase().includes('complete') || r.digital_premium?.name.toLowerCase().includes('sent')).length, link: 'PREMIUM', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Star },
                { label: 'HARD COPY', count: records.filter(r => r.hard_copy?.name.toLowerCase().includes('complete') || r.hard_copy?.name.toLowerCase().includes('sent')).length, link: 'PHYSICAL', color: 'text-blue-500 dark:text-blue-400', icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={`${styles.card_227} ${
                      stat.isYellowBorder ? 'border-[#F4C542]/40 ring-1 ring-[#F4C542]/10' : 'border-border'
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
                  <h3 className={styles.table_70}>CPC Batch Import</h3>
                </div>
                <p className={styles.text_71}>
                  Upload Excel or CSV files to batch import card registry details.
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
                placeholder="Search policy owner or policy number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.text_76}
              />
            </div>
            <div className={styles.container_77}>
              <select
                value={filterBasic}
                onChange={e => setFilterBasic(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Basic</option>
                {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={filterPremium}
                onChange={e => setFilterPremium(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Premium</option>
                {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={filterHardCopy}
                onChange={e => setFilterHardCopy(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Hard Copy</option>
                {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
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
              <button className={styles.table_72} onClick={exportToCSV}>
                <Download size={14} /> Export CSV
              </button>
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
                        onChange={e => setSelectedIds(e.target.checked ? sortedRecords.map(r => r.id) : [])}
                        className={styles.text_91}
                      />
                    </th>
                    <th className={styles.div_92}>Policy Owner</th>
                    <th className={styles.text_93}>Policy Number</th>
                    <th className={styles.text_93}>Date Processed</th>
                    <th className={styles.text_93}>Digital Basic</th>
                    <th className={styles.text_93}>Digital Premium</th>
                    <th className={styles.text_93}>Hard Copy</th>
                    <th className={styles.text_93}>Processed By</th>
                    <th className={styles.text_95}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.div_96}>
                  {sortedRecords.map((req, i) => (
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
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.policy_owner}
                          onChange={e => setRecords(prev => prev.map(r => r.id === req.id ? { ...r, policy_owner: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'policy_owner', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.policy_number}
                          onChange={e => setRecords(prev => prev.map(r => r.id === req.id ? { ...r, policy_number: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'policy_number', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="date"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.date_processed || ''}
                          onChange={e => handleInlineUpdate(req.id, 'date_processed', e.target.value || null)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.digital_basic_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'digital_basic_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.digital_premium_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'digital_premium_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.hard_copy_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'hard_copy_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
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
                            onClick={() => { setCurrentRecord(req); setActiveModal('add'); }}
                            className="p-1 text-muted-foreground hover:text-[#F4C542] transition cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(req.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedRecords.length === 0 && (
                    <tr>
                      <td colSpan={10} className={styles.text_113}>
                        No CPC card records found matching the search criteria.
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
                  {currentRecord.id ? 'Edit CPC Registry' : 'Register CPC Registry'}
                </h2>
                <p className={styles.text_120}>
                  Onboard policy dispatch parameters into directory
                </p>
              </div>
              <form id="cpc-form" onSubmit={handleCreateRecord} className={styles.div_121}>
                <div>
                  <label className={styles.table_122}>Policy Owner *</label>
                  <input
                    type="text"
                    value={currentRecord.policy_owner || ''}
                    onChange={e => setCurrentRecord({ ...currentRecord, policy_owner: e.target.value })}
                    placeholder="e.g. Maria Jenny De Leon Teves"
                    required
                    className={styles.text_123}
                  />
                </div>
                <div>
                  <label className={styles.table_124}>Policy Number *</label>
                  <input
                    type="text"
                    value={currentRecord.policy_number || ''}
                    onChange={e => setCurrentRecord({ ...currentRecord, policy_number: e.target.value })}
                    placeholder="e.g. POL-0829752218"
                    required
                    className={styles.text_125}
                  />
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Date Processed</label>
                    <input
                      type="date"
                      value={currentRecord.date_processed || ''}
                      onChange={e => setCurrentRecord({ ...currentRecord, date_processed: e.target.value })}
                      className={styles.text_128}
                    />
                  </div>
                  <div>
                    <label className={styles.table_129}>Digital Basic</label>
                    <select
                      value={currentRecord.digital_basic_id || ''}
                      onChange={e => setCurrentRecord({ ...currentRecord, digital_basic_id: e.target.value || null })}
                      className={styles.text_130}
                    >
                      <option value="">None</option>
                      {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Digital Premium</label>
                    <select
                      value={currentRecord.digital_premium_id || ''}
                      onChange={e => setCurrentRecord({ ...currentRecord, digital_premium_id: e.target.value || null })}
                      className={styles.text_130}
                    >
                      <option value="">None</option>
                      {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={styles.table_129}>Hard Copy</label>
                    <select
                      value={currentRecord.hard_copy_id || ''}
                      onChange={e => setCurrentRecord({ ...currentRecord, hard_copy_id: e.target.value || null })}
                      className={styles.text_130}
                    >
                      <option value="">None</option>
                      {cpcOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={styles.table_127}>Processed By</label>
                  <select
                    value={currentRecord.processed_by_id || ''}
                    onChange={e => setCurrentRecord({ ...currentRecord, processed_by_id: e.target.value || null })}
                    className={styles.text_130}
                  >
                    <option value="">None</option>
                    {processors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={styles.table_131}>Comments</label>
                  <textarea
                    value={currentRecord.comments || ''}
                    onChange={e => setCurrentRecord({ ...currentRecord, comments: e.target.value })}
                    placeholder="Add operational notes or annotations..."
                    rows={4}
                    className={styles.text_132}
                  />
                </div>
              </form>
            </div>
            <div className={styles.container_133}>
              <button
                type="submit"
                form="cpc-form"
                className={styles.table_134}
              >
                Confirm Dispatch
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
                <h2 className={styles.text_141}>Import CPC Records</h2>
                <p className={styles.text_142}>
                  Import multiple CPC logs using Excel or CSV.
                </p>
              </div>

              {importState.phase === 'idle' && (
                <div className={styles.div_143}>
                  <div className={styles.container_144}>
                    {[
                      { ext: '.xlsx', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60' },
                      { ext: '.xls', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60' },
                      { ext: '.csv', color: 'text-[#A97800] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60' }
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
                    className={`${styles.table_231} ${isDragging ? 'border-[#F4C542] bg-[#F4C542]/5' : 'border-[#F4C542]/30 bg-[#FAF9F5]/30 dark:bg-muted/5 hover:border-[#F4C542] hover:bg-[#FAF9F5]/70 dark:hover:bg-muted/10'}`}
                  >
                    <Upload size={28} className={styles.text_145} />
                    <p className={styles.text_146}>Choose file or drag & drop</p>
                    <p className={styles.text_147}>Excel, CSV logs</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
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
    </div>
  );
}
