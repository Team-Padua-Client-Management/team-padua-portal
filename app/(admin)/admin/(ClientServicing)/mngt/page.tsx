'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2,
  Eye, Download, ChevronDown, ChevronRight, Clock, Calendar,
  ArrowUpDown, Check, AlertTriangle, Users, Star, Target, Archive
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader/page';
import Sidebar from '@/app/components/admin/AdminSidebar/page';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";

interface StatusOption { id: string; name: string; color: string; sort_order: number; }

interface MngtRecord {
  id: string;
  client_name: string;
  nickname: string;
  email_address: string;
  contact_number: string;
  location: string;
  gc_creation: string | null;
  status_id: string | null;
  gc_status_id: string | null;
  status?: StatusOption;
  gc_status?: StatusOption;
}

interface ImportRecord {
  client_name: string;
  nickname: string;
  email_address: string;
  contact_number: string;
  location: string;
  gc_creation: string | null;
  status_id: string | null;
  gc_status_id: string | null;
  rawStatus?: string;
  rawGcStatus?: string;
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

async function parseExcelOrCSV(file: File, existing: MngtRecord[], statusOpts: StatusOption[]): Promise<ValidationResult> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });
  const existingClients = new Set(existing.map(r => r.client_name.toLowerCase().trim()));

  let headerIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const rowText = rows[i].join(" ").toLowerCase();
    if (rowText.includes("client") || rowText.includes("name") || rowText.includes("gc")) { headerIndex = i; break; }
  }

  const headerRow = rows[headerIndex] || [];
  const findCol = (kw: string[]): number => headerRow.findIndex((h: any) => kw.some(k => String(h).toLowerCase().includes(k)));

  const clientCol = findCol(['client', 'client name', 'name']);
  const nickCol = findCol(['nickname', 'nickname for poster', 'poster']);
  const emailCol = findCol(['email', 'email address', 'mail']);
  const contactCol = findCol(['contact', 'contact number', 'phone']);
  const locCol = findCol(['location', 'address']);
  const gcCol = findCol(['gc creation', 'gccreation', 'gc date']);
  const statusCol = findCol(['status']);
  const gcStatusCol = findCol(['gc creation status', 'gc status']);

  const valid: ImportRecord[] = [];
  const duplicates: ImportRecord[] = [];
  const invalid: InvalidImportRecord[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell: any) => !String(cell).trim())) continue;

    const client_name = clientCol >= 0 ? String(row[clientCol] ?? '').trim() : '';
    const nickname = nickCol >= 0 ? String(row[nickCol] ?? '').trim() : '';
    const email_address = emailCol >= 0 ? String(row[emailCol] ?? '').trim() : '';
    const contact_number = contactCol >= 0 ? String(row[contactCol] ?? '').trim() : '';
    const location = locCol >= 0 ? String(row[locCol] ?? '').trim() : '';
    const rawGc = gcCol >= 0 ? String(row[gcCol] ?? '').trim() : '';
    const gc_creation = parseDateFlexible(rawGc);
    const rawStatus = statusCol >= 0 ? String(row[statusCol] ?? '').trim() : '';
    const rawGcStatus = gcStatusCol >= 0 ? String(row[gcStatusCol] ?? '').trim() : '';

    const status_id = findOptionId(rawStatus, statusOpts);
    const gc_status_id = findOptionId(rawGcStatus, statusOpts);

    const rowNumber = i + 1;
    const rawData: Record<string, any> = {};
    headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

    if (!client_name) {
      invalid.push({ client_name: '', nickname, email_address, contact_number, location, gc_creation, status_id, gc_status_id, rowNumber, reason: 'Missing Client Name', rawData });
      continue;
    }

    const record: ImportRecord = { client_name, nickname, email_address, contact_number, location, gc_creation, status_id, gc_status_id, rawStatus, rawGcStatus };
    if (existingClients.has(client_name.toLowerCase())) {
      duplicates.push(record);
    } else {
      valid.push(record);
    }
  }
  return { valid, duplicates, invalid, total: valid.length + duplicates.length + invalid.length };
}

export default function EmailMessengerManagementPage() {
  const [requests, setRequests] = useState<MngtRecord[]>([]);

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([
    { id: "m1", name: 'Pending', color: '#3b82f6', sort_order: 1 },
    { id: "m2", name: 'Completed', color: '#22c55e', sort_order: 2 },
    { id: "m3", name: 'Processing', color: '#f97316', sort_order: 3 },
    { id: "m4", name: 'Waiting', color: '#eab308', sort_order: 4 },
    { id: "m5", name: 'Email Sent', color: '#a21caf', sort_order: 5 },
    { id: "m6", name: 'Messenger Sent', color: '#06b6d4', sort_order: 6 }
  ]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'add' | 'import' | null>(null);
  const [currentRequest, setCurrentRequest] = useState<Partial<MngtRecord>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('mngt_records').select('*');
      setRequests(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: 'loading', message: 'Saving record...' });
    try {
      const payload = {
        client_name: currentRequest.client_name,
        nickname: currentRequest.nickname || '',
        email_address: currentRequest.email_address || '',
        contact_number: currentRequest.contact_number || '',
        location: currentRequest.location || '',
        gc_creation: currentRequest.gc_creation || null,
        status_id: currentRequest.status_id || null,
        gc_status_id: currentRequest.gc_status_id || null
      };

      let error;
      if (currentRequest.id) {
        const res = await supabase.from('mngt_records').update(payload).eq('id', currentRequest.id);
        error = res.error;
      } else {
        const res = await supabase.from('mngt_records').insert([payload]);
        error = res.error;
      }
      if (error) throw error;

      setFeedback({ type: 'idle', message: '' });
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save registry details.' });
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof MngtRecord, val: any) => {
    try {
      const { error } = await supabase.from('mngt_records').update({ [field]: val }).eq('id', id);
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
      message: 'Are you sure you want to delete this record?',
      onConfirm: async () => {
        setFeedback({ type: 'loading', message: 'Deleting record...' });
        try {
          const { error } = await supabase.from('mngt_records').delete().eq('id', id);
          if (error) throw error;
          setFeedback({ type: 'idle', message: '' });
          fetchData();
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to delete.' });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    setFeedback({
      type: 'confirm',
      message: `Are you sure you want to delete ${selectedIds.length} records?`,
      onConfirm: async () => {
        setFeedback({ type: 'loading', message: 'Deleting records...' });
        try {
          const { error } = await supabase.from('mngt_records').delete().in('id', selectedIds);
          if (error) throw error;
          setSelectedIds([]);
          setFeedback({ type: 'idle', message: '' });
          fetchData();
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Failed to delete.' });
        }
      }
    });
  };

  const handleArchiveRecord = (id: string) => {
    const archived = JSON.parse(localStorage.getItem('archived_mngt') || '[]');
    if (!archived.includes(id)) {
      archived.push(id);
      localStorage.setItem('archived_mngt', JSON.stringify(archived));
      setSelectedIds(prev => prev.filter(item => item !== id));
      fetchData();
    }
  };

  const exportToCSV = () => {
    const csvRows = [
      ['#', 'Client Name', 'Nickname', 'Email Address', 'Contact Number', 'Location', 'GC Creation', 'Status', 'GC Status']
    ];
    filteredRequests.forEach((r, idx) => {
      const statusName = statusOptions.find(o => o.id === r.status_id)?.name || '';
      const gcStatusName = statusOptions.find(o => o.id === r.gc_status_id)?.name || '';
      csvRows.push([
        String(idx + 1),
        r.client_name,
        r.nickname,
        r.email_address,
        r.contact_number,
        r.location,
        r.gc_creation || '',
        statusName,
        gcStatusName
      ]);
    });
    const content = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mngt_export_${new Date().toISOString().slice(0,10)}.csv`);
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
      const res = await parseExcelOrCSV(file, requests, statusOptions);
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
      setImportProgress(prev => ({ ...prev, current: i, currentName: rec.client_name }));

      try {
        const payload = {
          client_name: rec.client_name,
          nickname: rec.nickname,
          email_address: rec.email_address,
          contact_number: rec.contact_number,
          location: rec.location,
          gc_creation: rec.gc_creation,
          status_id: rec.status_id,
          gc_status_id: rec.gc_status_id
        };

        await supabase.from('mngt_records').insert([payload]);
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
          logs: [...prev.logs, { type: 'success', name: rec.client_name, message: 'Successfully imported' }]
        }));
      } catch (err: any) {
        setImportProgress(prev => ({
          ...prev,
          logs: [...prev.logs, { type: 'invalid', name: rec.client_name, message: err.message || 'Failed to save' }]
        }));
      }
    }

    setImportState(prev => ({ ...prev, phase: 'done', importedCount: imported }));
    fetchData();
  };

  const filteredRequests = requests.filter(r => {
    // Check archive state
    if (typeof window !== 'undefined') {
      const archived = JSON.parse(localStorage.getItem('archived_mngt') || '[]');
      const showArchivedCS = localStorage.getItem('show_archived_cs') === 'true';
      if (archived.includes(r.id) && !showArchivedCS) return false;
    }

    const term = search.toLowerCase();
    const matchSearch =
      r.client_name.toLowerCase().includes(term) ||
      (r.nickname && r.nickname.toLowerCase().includes(term)) ||
      (r.location && r.location.toLowerCase().includes(term));

    const matchStatus = filterStatus === 'ALL' || r.status_id === filterStatus || r.gc_status_id === filterStatus;

    return matchSearch && matchStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.gc_creation || 0).getTime() - new Date(a.gc_creation || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.gc_creation || 0).getTime() - new Date(b.gc_creation || 0).getTime();
    if (sortBy === 'client_name') return a.client_name.localeCompare(b.client_name);
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
              <h1 className={styles.text_56}>Messenger & Email Dispatch Console</h1>
              <p className={styles.table_57}>
                Daniel Padua | Messenger & Email (MNGT) Operations Control
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
                Register Dispatch
              </button>
            </div>
          </div>

          <div className={styles.container_61}>
            <div className={styles.container_62}>
              {[
                { label: 'TOTAL TRACKED', count: requests.length, link: 'TOTAL', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'COMPLETED DISPATCHES', count: requests.filter(r => r.status_id === 'm2' || r.gc_status_id === 'm2').length, link: 'DONE', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
                { label: 'EMAILS SENT', count: requests.filter(r => r.status_id === 'm5').length, link: 'EMAILS', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Star },
                { label: 'PENDING TASKS', count: requests.filter(r => r.status_id === 'm1' || r.gc_status_id === 'm1').length, link: 'PENDING', color: 'text-blue-500 dark:text-blue-400', icon: Target },
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
                  <h3 className={styles.table_70}>MNGT Batch Import</h3>
                </div>
                <p className={styles.text_71}>
                  Upload Excel or CSV files to batch import client communication schedules.
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
                placeholder="Search by client name, nickname or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.text_76}
              />
            </div>
            <div className={styles.container_77}>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={styles.card_84}
              >
                <option value="newest">Newest Log</option>
                <option value="oldest">Oldest Log</option>
                <option value="client_name">Client Name</option>
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
                        onChange={e => setSelectedIds(e.target.checked ? sortedRequests.map(r => r.id) : [])}
                        className={styles.text_91}
                      />
                    </th>
                    <th className={styles.div_92}>Client Name</th>
                    <th className={styles.text_93}>Nickname</th>
                    <th className={styles.text_93}>Email Address</th>
                    <th className={styles.text_93}>Contact Number</th>
                    <th className={styles.text_93}>Location</th>
                    <th className={styles.text_93}>GC Creation</th>
                    <th className={styles.text_93}>Email/Msg Status</th>
                    <th className={styles.text_93}>GC Status</th>
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
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.client_name}
                          onChange={e => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, client_name: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'client_name', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.nickname}
                          onChange={e => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, nickname: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'nickname', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.email_address}
                          onChange={e => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, email_address: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'email_address', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.contact_number}
                          onChange={e => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, contact_number: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'contact_number', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5 w-full"
                          value={req.location}
                          onChange={e => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, location: e.target.value } : r))}
                          onBlur={e => handleInlineUpdate(req.id, 'location', e.target.value)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <input
                          type="date"
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.gc_creation || ''}
                          onChange={e => handleInlineUpdate(req.id, 'gc_creation', e.target.value || null)}
                        />
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.status_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'status_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </td>
                      <td className={styles.text_107}>
                        <select
                          className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#F4C542] rounded px-1 py-0.5"
                          value={req.gc_status_id || ''}
                          onChange={e => handleInlineUpdate(req.id, 'gc_status_id', e.target.value || null)}
                        >
                          <option value="">None</option>
                          {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
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
                      <td colSpan={11} className={styles.text_113}>
                        No records found matching the search criteria.
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
                  {currentRequest.id ? 'Edit Dispatch Schedule' : 'Register Dispatch Schedule'}
                </h2>
                <p className={styles.text_120}>
                  Onboard client communications parameters into directory
                </p>
              </div>
              <form id="mngt-form" onSubmit={handleCreateRequest} className={styles.div_121}>
                <div>
                  <label className={styles.table_122}>Client Name *</label>
                  <input
                    type="text"
                    value={currentRequest.client_name || ''}
                    onChange={e => setCurrentRequest({ ...currentRequest, client_name: e.target.value })}
                    placeholder="e.g. Maria Jenny De Leon Teves"
                    required
                    className={styles.text_123}
                  />
                </div>
                <div>
                  <label className={styles.table_124}>Nickname</label>
                  <input
                    type="text"
                    value={currentRequest.nickname || ''}
                    onChange={e => setCurrentRequest({ ...currentRequest, nickname: e.target.value })}
                    placeholder="Nickname for posters"
                    className={styles.text_125}
                  />
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Email Address</label>
                    <input
                      type="email"
                      value={currentRequest.email_address || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, email_address: e.target.value })}
                      placeholder="e.g. client@email.com"
                      className={styles.text_128}
                    />
                  </div>
                  <div>
                    <label className={styles.table_129}>Contact Number</label>
                    <input
                      type="text"
                      value={currentRequest.contact_number || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, contact_number: e.target.value })}
                      placeholder="e.g. +63 912 345 6789"
                      className={styles.text_128}
                    />
                  </div>
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Location</label>
                    <input
                      type="text"
                      value={currentRequest.location || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, location: e.target.value })}
                      placeholder="Address location"
                      className={styles.text_128}
                    />
                  </div>
                  <div>
                    <label className={styles.table_129}>GC Creation</label>
                    <input
                      type="date"
                      value={currentRequest.gc_creation || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, gc_creation: e.target.value })}
                      className={styles.text_128}
                    />
                  </div>
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Email/Msg Status</label>
                    <select
                      value={currentRequest.status_id || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, status_id: e.target.value || null })}
                      className={styles.text_130}
                    >
                      <option value="">None</option>
                      {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={styles.table_129}>GC Status</label>
                    <select
                      value={currentRequest.gc_status_id || ''}
                      onChange={e => setCurrentRequest({ ...currentRequest, gc_status_id: e.target.value || null })}
                      className={styles.text_130}
                    >
                      <option value="">None</option>
                      {statusOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className={styles.container_133}>
              <button
                type="submit"
                form="mngt-form"
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
                <h2 className={styles.text_141}>Import MNGT Records</h2>
                <p className={styles.text_142}>
                  Import multiple dispatch logs using Excel or CSV.
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
