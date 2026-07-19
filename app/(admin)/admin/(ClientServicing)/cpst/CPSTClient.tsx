"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X,
  Upload, FileSpreadsheet, Download, CheckCircle2, Target, Users, Star,
  AlertCircle, Loader2, Eye, EyeOff
} from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import SignaturePad from '@/app/components/ui/SignaturePad';
import { exportToPDF, exportToDOCS } from '@/app/lib/export';
import ExportDropdown from '@/app/components/shared/ExportDropdown';
import { ConfirmModal } from '@/app/components/ui/modals/ConfirmModal';
import styles from "@/styles/admin/cpst/page.module.css";

export interface ClientManagementRecord {
  id: string;
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

export default function CPSTClient({ canCreate, canEdit, canDelete, canExport }: CPSTClientProps) {
  const [clients, setClients] = useState<ClientManagementRecord[]>([]);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<ClientManagementRecord>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and Drop & Import state
  const [isDragging, setIsDragging] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
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
      
      if (matchCount >= 4) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("Could not detect valid header row. Ensure the template contains at least 4 recognizable columns (e.g., Client name, Email address).");
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
        console.log(`[IMPORT] Skipped Empty Row ${i + 1}`);
        continue;
      }

      const rowText = row.join(" ").toLowerCase();
      if (
        rowText.includes("report:") ||
        rowText.includes("date generated:") ||
        rowText.includes("advisor code:") ||
        rowText.includes("advisor name:") ||
        rowText.includes("data privacy act")
      ) {
        skippedHeaders++;
        console.log(`[IMPORT] Skipped Metadata Row ${i + 1}`);
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
        console.log(`[IMPORT] Skipped Invalid Row ${rowNumber} (Missing Client Name)`);
        invalid.push({ rowNumber, reason: 'Missing Client Name', rawData });
        continue;
      }

      console.log(`[IMPORT] Imported Client:\n${clientName}`);

      valid.push({
        clientName,
        mobileNumber,
        email,
        address,
        birthdate,
        policyNumber: null as any,
        product: null as any,
        approvalDate: null as any,
        annualPremium: null as any,
        beneficiary: null as any,
        fundAllocation: null as any,
        modeOfPayment: null as any
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
    console.log("BEFORE IMPORT (Parsed Excel):", validRows);
    if (validRows.length === 0) return;
    setImportState(prev => ({ ...prev, phase: 'importing', fileName }));

    console.log("=== [IMPORT] Processing Clients ===");
    console.log("Parsed Rows:", validRows.length);
    console.log("Valid Rows:", validRows.length);

    const parseDate = (value: any) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.warn(`[IMPORT] Invalid date encountered: ${value}`);
        return null;
      }
      return date.toISOString().split("T")[0];
    };

    try {
      // Fetch existing clients to check for duplicates by email or mobile
      const { data: existingClients, error: fetchError } = await supabase.from('cpst_clients').select('id, email, mobile_number, policy_number');
      if (fetchError) throw fetchError;

      const recordsToUpsert: any[] = [];
      let importedCount = 0;
      let updatedCount = 0;

      let skippedCount = 0;

      for (const record of validRows) {
        const existing = existingClients?.find(c => 
          (c.email && record.email && c.email.toLowerCase() === record.email.toLowerCase()) || 
          (c.mobile_number && record.mobileNumber && c.mobile_number === record.mobileNumber) ||
          (c.policy_number && record.policyNumber && c.policy_number === record.policyNumber && !record.policyNumber.startsWith('PENDING-'))
        );
        
        const existingInBatch = recordsToUpsert.find(c => 
          (c.email && record.email && c.email.toLowerCase() === record.email.toLowerCase()) || 
          (c.mobile_number && record.mobileNumber && c.mobile_number === record.mobileNumber) ||
          (c.policy_number && record.policyNumber && c.policy_number === record.policyNumber && !record.policyNumber.startsWith('PENDING-'))
        );

        if (existingInBatch) {
          skippedCount++;
          continue; // Skip duplicate within the same batch
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
          client_name: record.clientName,
          relationship: record.relationship,
          policy_number: record.policyNumber || null,
          product: record.product || null,
          approval_date: parseDate(record.approvalDate),
          birthdate: parseDate((record as any).birthday || (record as any).birthdate),
          annual_premium: record.annualPremium,
          mobile_number: record.mobileNumber,
          email: record.email,
          address: record.address,
          beneficiary: record.beneficiary,
          fund_allocation: record.fundAllocation,
          mode_of_payment: record.modeOfPayment || 'Annual',
          status: 'Prospect'
        });
      }

      console.log("Inserted Rows:", importedCount);
      console.log("Updated Rows:", updatedCount);
      console.log("Skipped Rows:", skippedCount);

      console.log("CLIENT DATA:", recordsToUpsert);
      const result = await supabase.from('cpst_clients').upsert(recordsToUpsert).select();
      console.log("RESULT:", result);
      console.log("USER:", await supabase.auth.getUser());

      const { error } = result;
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
      fetchClients();
    } catch (err) {
      console.error("[FRONTEND] processAndImportClients error:", typeof err === 'object' ? JSON.stringify(err, null, 2) : err);
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

      console.log("=== [FRONTEND] Parse Decrypted File ===");
      console.log("File Name:", file.name);
      console.log("File Type:", file.type);
      console.log("File Size:", file.size, "bytes");
      console.log("Buffer Length:", buffer.byteLength, "bytes");

      const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
      console.log("Workbook Sheets:", wb.SheetNames);
      console.log("Decryption Result: Success and Parsed");
      console.log("=======================================");

      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });

      const { valid, invalid, stats } = parseClientRows(rows);
      await processAndImportClients(valid, file.name, stats);
    } catch (err) {
      console.error("[FRONTEND] parseDecryptedFile error:", err);
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
    setImportState({
      phase: 'reading',
      fileName: file.name,
      validation: null,
      importedCount: 0,
      errorMessage: ''
    });

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();

      console.log("=== [FRONTEND] Parse Original File ===");
      console.log("File Name:", file.name);
      console.log("File Type:", file.type);
      console.log("File Size:", file.size, "bytes");
      console.log("Buffer Length:", buffer.byteLength, "bytes");

      // Check for OLE CFB file header (D0 CF 11 E0) to catch encrypted file
      let isEncryptedMagic = false;
      if (buffer.byteLength >= 4) {
        const view = new DataView(buffer);
        const magic = view.getUint32(0, false);
        console.log(`File Magic Hex: 0x${magic.toString(16).toUpperCase()}`);
        if (magic === 0xD0CF11E0) {
          isEncryptedMagic = true;
          console.log("Detected OLE CFB header (D0 CF 11 E0). Treating as password-protected.");
        }
      }

      if (isEncryptedMagic) {
        throw new Error("Decryption password required: password-protected Excel file.");
      }

      const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
      console.log("Workbook Sheets:", wb.SheetNames);
      console.log("=====================================");

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
        errMsg.toLowerCase().includes('wrong password') ||
        errMsg.toLowerCase().includes('non-whitespace before first tag');
      if (isPasswordProtected) {
        console.log("[FRONTEND] File is password protected. Transitioning to password prompt.");
        setImportFile(file);
        setImportState({
          phase: 'password',
          fileName: file.name,
          validation: null,
          importedCount: 0,
          errorMessage: ''
        });
      } else {
        console.error("[FRONTEND] handleFileSelected error:", errMsg);
        setImportState({
          phase: 'error',
          fileName: file.name,
          validation: null,
          importedCount: 0,
          errorMessage: errMsg
        });
      }
    }
  };

  const handlePasteImport = async (text: string) => {
    setImportState({
      phase: 'reading',
      fileName: 'Pasted Grid Data',
      validation: null,
      importedCount: 0,
      errorMessage: ''
    });

    try {
      if (!text.trim()) {
        throw new Error("Pasted data is empty.");
      }

      const rows = text.split(/\r?\n/).map(row => row.split('\t'));
      if (rows.length < 2) {
        throw new Error("No data found or insufficient rows.");
      }

      const { valid, invalid, stats } = parseClientRows(rows);
      await processAndImportClients(valid, 'Pasted Grid Data', stats);
    } catch (err) {
      setImportState({
        phase: 'error',
        fileName: 'Pasted Grid Data',
        validation: null,
        importedCount: 0,
        errorMessage: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importState.validation || importState.validation.valid.length === 0) return;
    setImportState(prev => ({ ...prev, phase: 'importing' }));

    try {
      const recordsToInsert = importState.validation.valid.map(record => ({
        ...record,
        id: crypto.randomUUID()
      }));

      const { error } = await supabase.from('cpst_clients').insert(recordsToInsert);

      if (error) throw error;

      setImportState(prev => ({
        ...prev,
        phase: 'done',
        importedCount: recordsToInsert.length
      }));
      fetchClients();
    } catch (err) {
      setImportState(prev => ({
        ...prev,
        phase: 'error',
        errorMessage: err instanceof Error ? err.message : String(err)
      }));
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

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('cpst_clients').select('*').order('created_at', { ascending: false });
      if (error) {
        setClients([
          {
            id: '00000000-0000-0000-0000-000000000001',
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
        console.log("AFTER FETCH (Raw Supabase Data):", data);
        const mappedClients: ClientManagementRecord[] = (data || []).map((c: any) => ({
          id: c.id,
          clientName: c.client_name || '',
          relationship: c.relationship || '',
          policyNumber: c.policy_number || '',
          product: c.product || '',
          approvalDate: c.approval_date || '',
          annualPremium: c.annual_premium || 0,
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
        console.log("AFTER FETCH (Mapped Data):", mappedClients);
        setClients(mappedClients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        clientName: currentClient.clientName || '',
        relationship: currentClient.relationship || '',
        policyNumber: currentClient.policyNumber || '',
        product: currentClient.product || '',
        approvalDate: currentClient.approvalDate || '',
        annualPremium: currentClient.annualPremium || 0,
        mobileNumber: currentClient.mobileNumber || '',
        email: currentClient.email || '',
        address: currentClient.address || '',
        beneficiary: currentClient.beneficiary || '',
        fundAllocation: currentClient.fundAllocation || '',
        modeOfPayment: currentClient.modeOfPayment || 'Annual',
        birthdate: currentClient.birthdate || '',
        signatureData: currentClient.signatureData || null,
      };

      if (currentClient.id) {
        await supabase.from('cpst_clients').update(payload).eq('id', currentClient.id);
      } else {
        const newId = crypto.randomUUID();
        await supabase.from('cpst_clients').insert([{ ...payload, id: newId }]);
      }
      setActiveModal(null);
      fetchClients();
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
      fetchClients();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const exportToCSV = () => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Annual Premium', 'Mobile', 'Email', 'Address', 'Beneficiary', 'Fund Allocation', 'Mode of Payment'];
    const rows = filteredClients.map(c => [
      c.clientName, c.relationship, c.policyNumber, c.product, c.approvalDate, c.annualPremium, c.mobileNumber, c.email, c.address, c.beneficiary, c.fundAllocation, c.modeOfPayment
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => '"' + String(v || '') + '"').join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client_management_export.csv';
    link.click();
  };

  const handleExportPDF = () => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Beneficiary', 'Payment Mode'];
    const rows = filteredClients.map(c => [
      c.clientName, c.relationship, c.policyNumber, c.product, c.approvalDate, `PHP ${c.annualPremium?.toLocaleString()}`, c.mobileNumber, c.email, c.beneficiary, c.modeOfPayment
    ]);
    exportToPDF({
      title: 'Advisor Clients Registry',
      description: 'Sun Life Financial - Official record of active clients, premiums, policy types, and financial products.',
      headers,
      rows,
      filename: `advisor_clients_list_${new Date().toISOString().slice(0, 10)}.pdf`,
      stats: [
        { label: 'Total Clients', value: filteredClients.length },
        { label: 'Active Policies', value: filteredClients.filter(c => c.policyNumber).length },
        { label: 'Total Premiums', value: `PHP ${filteredClients.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0).toLocaleString()}` }
      ]
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Beneficiary', 'Payment Mode'];

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'word') {
      const rows = filteredClients.map(c => [
        c.clientName, c.relationship, c.policyNumber, c.product, c.approvalDate, `PHP ${c.annualPremium?.toLocaleString()}`, c.mobileNumber, c.email, c.beneficiary, c.modeOfPayment
      ]);
      exportToDOCS(
        'Advisor Clients Registry',
        headers,
        rows,
        `advisor_clients_list_${new Date().toISOString().slice(0, 10)}.doc`
      );
    }
  };

  const filteredClients = clients.filter(c => {
    if (productFilter !== 'ALL' && c.product !== productFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.clientName?.toLowerCase().includes(s) && !c.policyNumber?.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    if (sortBy === 'oldest') return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    if (sortBy === 'name') return (a.clientName || '').localeCompare(b.clientName || '');
    return 0;
  });

  const isAllSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;

  console.log("BEFORE RENDER (Clients State):", clients);
  console.log("BEFORE RENDER (Filtered Clients):", filteredClients);

  return (
    <div className={styles.text_52}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_53}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.div_54}>
          <div className={styles.container_55}>
            <div>
              <h1 className={styles.text_56}>Client Management Tracker</h1>
              <p className={styles.table_57}>
                Client Advisor Management System (CAMS) main registry.
              </p>
            </div>
            <div className={styles.container_58}>
              {canCreate && (
                <button
                  onClick={() => { setCurrentClient({}); setActiveModal('add'); }}
                  className={styles.table_60}
                >
                  <Plus size={14} /> Add Client
                </button>
              )}
            </div>
          </div>

          <div className={styles.container_61}>
            <div className={styles.container_62}>
              {[
                { label: 'TOTAL CLIENTS', count: clients.length, link: 'TOTAL', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'ACTIVE POLICIES', count: clients.filter(c => c.policyNumber).length, link: 'ACTIVE', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
                { label: 'TOTAL PREMIUM', count: clients.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0).toLocaleString(), link: 'PHP', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Target },
                { label: 'PRODUCTS IN USE', count: Array.from(new Set(clients.map(c => c.product).filter(Boolean))).length, link: 'PRODUCTS', color: 'text-blue-500 dark:text-blue-400', icon: Star },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={`${styles.card_227} ${stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/10' : 'border-border'
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
                  <h3 className={styles.table_70}>CAMS Batch Import</h3>
                </div>
                <p className={styles.text_71}>
                  Upload Excel or CSV files to batch import clients.
                </p>
              </div>
              <button
                onClick={() => setActiveModal('import')}
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
                placeholder="Search client name, policy number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition whitespace-nowrap"
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
                        checked={isAllSelected}
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
                    <tr><td colSpan={14} className="py-8 text-center text-text-secondary text-sm">Loading...</td></tr>
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
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button onClick={() => { setCurrentClient(client); setActiveModal('edit'); }} className="p-1.5 text-muted hover:text-[#F4C542] transition-colors bg-card border border-transparent hover:border-primary rounded-md shadow-sm" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => confirmDeleteClient(client.id)} className="p-1.5 text-muted hover:text-red-500 transition-colors bg-card border border-transparent hover:border-red-500 rounded-md shadow-sm" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={14} className="py-8 text-center text-text-secondary text-sm">No clients found matching the search criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md h-full rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 shrink-0">
              <div>
                <h2 className="text-base font-bold text-text">{currentClient.id ? 'Edit Client Details' : 'Add New Client'}</h2>
                <p className="text-xs text-text-secondary">Enter client parameters into the management ledger.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">

              <form id="cpst-form" onSubmit={handleCreateClient} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={currentClient.clientName || ''} onChange={e => setCurrentClient({ ...currentClient, clientName: e.target.value })} required className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship</label>
                  <input type="text" value={currentClient.relationship || ''} onChange={e => setCurrentClient({ ...currentClient, relationship: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Self, Spouse, etc." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Approval Date</label>
                  <input type="date" value={currentClient.approvalDate || ''} onChange={e => setCurrentClient({ ...currentClient, approvalDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Policy Number</label>
                  <input type="text" value={currentClient.policyNumber || ''} onChange={e => setCurrentClient({ ...currentClient, policyNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="POL-12345" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Product</label>
                  <select value={currentClient.product || ''} onChange={e => setCurrentClient({ ...currentClient, product: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground">
                    <option value="">Select Product</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Annual Premium</label>
                  <input type="number" value={currentClient.annualPremium || ''} onChange={e => setCurrentClient({ ...currentClient, annualPremium: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="0.00" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mode of Payment</label>
                  <select value={currentClient.modeOfPayment || 'Annual'} onChange={e => setCurrentClient({ ...currentClient, modeOfPayment: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground">
                    {PAYMENT_MODES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Fund Allocation</label>
                  <input type="text" value={currentClient.fundAllocation || ''} onChange={e => setCurrentClient({ ...currentClient, fundAllocation: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="100% Equity" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Beneficiary</label>
                  <input type="text" value={currentClient.beneficiary || ''} onChange={e => setCurrentClient({ ...currentClient, beneficiary: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Beneficiary Name" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input type="text" value={currentClient.mobileNumber || ''} onChange={e => setCurrentClient({ ...currentClient, mobileNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="+63..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" value={currentClient.email || ''} onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Address</label>
                  <input type="text" value={currentClient.address || ''} onChange={e => setCurrentClient({ ...currentClient, address: e.target.value })} className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Full Address" />
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
              <button type="submit" form="cpst-form" className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-sm py-2.5 rounded-xl transition duration-155 cursor-pointer border border-[#F4C542]/30 shadow-sm">
                Confirm Save
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-xl transition duration-155 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-2">
              <div>
                <h2 className="text-base font-bold text-text">CAMS Batch Import</h2>
                <p className="text-xs text-text-secondary">Process client registers via CSV or Excel sheets.</p>
              </div>
              <button
                onClick={() => {
                  setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, errorMessage: '' });
                  setPastedText('');
                  setImportFile(null);
                  setPassword('');
                  setImportMethod('file');
                  setActiveModal(null);
                }}
                className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Method Tabs */}
            {importState.phase === 'idle' && (
              <div className="flex border-b border-border bg-slate-50/50 dark:bg-slate-900/20 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setImportMethod('file')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${importMethod === 'file'
                      ? 'bg-card text-text shadow-sm border border-border/80'
                      : 'text-text-secondary hover:text-text hover:bg-surface-2'
                    }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod('paste')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${importMethod === 'paste'
                      ? 'bg-card text-text shadow-sm border border-border/80'
                      : 'text-text-secondary hover:text-text hover:bg-surface-2'
                    }`}
                >
                  Direct Copy & Paste (Excel Bypass)
                </button>
              </div>
            )}

            {/* Phase 1: Idle - Dropzone or Paste Grid */}
            {importState.phase === 'idle' && (
              <div className="p-6">
                {importMethod === 'file' ? (
                  <div
                    className={`flex flex-col items-center justify-center transition-all ${isDragging ? 'bg-primary/5 border-primary' : 'bg-transparent border-border'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div
                      className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/55'
                        }`}
                      onClick={() => {
                        const el = document.getElementById('file-upload-input');
                        if (el) el.click();
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <FileSpreadsheet size={24} className="text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-text mb-1">Drag & drop your file here</h3>
                      <p className="text-xs text-text-secondary mb-4">Supports .xlsx and .csv registers</p>

                      <span className="bg-primary text-black font-semibold text-xs px-4 py-2 rounded-xl shadow-sm border border-[#e0b53c] hover:bg-primary/80 transition select-none">
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
                    <div className="text-left bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-text-secondary">
                      <p className="font-semibold text-text mb-1">Bypass password locks easily:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open the password-locked file locally in Excel.</li>
                        <li>Select the client columns and rows (including the header row) and press <strong>Ctrl + C</strong>.</li>
                        <li>Paste (<strong>Ctrl + V</strong>) directly into the field below.</li>
                      </ol>
                    </div>
                    <textarea
                      placeholder="Paste columns here (TAB separated Excel grid rows)..."
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      className="w-full h-44 p-3 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteImport(pastedText)}
                      disabled={!pastedText.trim()}
                      className="w-full bg-primary text-black font-bold text-xs py-2.5 rounded-xl border border-[#e0b53c] hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Parse and Validate Paste
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Phase 1.5: Password Decryption Required */}
            {importState.phase === 'password' && (
              <div className="p-6 space-y-4">
                <div className="text-left bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-bold mb-0.5">Password Required</p>
                    <p className="text-text-secondary text-[11px]">This Excel file is encrypted. Provide the password to open and import client records.</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && password) handleDecryptAndImport();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted hover:text-text transition-colors"
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
                    className="flex-1 bg-primary text-black font-semibold text-xs py-2.5 rounded-xl border border-[#e0b53c] hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decrypt & Parse File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, errorMessage: '' });
                      setImportFile(null);
                      setPassword('');
                    }}
                    className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Phase 2: Reading / Analyzing */}
            {importState.phase === 'reading' && (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <div className="text-center">
                  <h3 className="text-sm font-bold text-text">Analyzing Register</h3>
                  <p className="text-xs text-text-secondary mt-1">Reading headers and validating cells...</p>
                </div>
              </div>
            )}

            {/* Phase 3: Preview and Verification */}
            {importState.phase === 'preview' && importState.validation && (
              <div className="flex-1 flex flex-col min-h-0 max-h-[70vh]">
                <div className="p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-secondary">File:</span>
                    <span className="text-xs font-bold text-text truncate max-w-[200px]" title={importState.fileName}>{importState.fileName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
                      {importState.validation.valid.length} Valid
                    </span>
                    {importState.validation.invalid.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
                        {importState.validation.invalid.length} Error{importState.validation.invalid.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                  {/* Invalid records list (errors) */}
                  {importState.validation.invalid.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Validation Errors ({importState.validation.invalid.length})</h4>
                      <div className="border border-red-200/60 dark:border-red-900/30 rounded-xl bg-red-50/30 dark:bg-red-950/10 overflow-hidden divide-y divide-red-100 dark:divide-red-900/20">
                        {importState.validation.invalid.map((inv, idx) => (
                          <div key={idx} className="p-3 flex items-start gap-2.5 text-xs text-left">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                            <div>
                              <span className="font-semibold text-text">Row {inv.rowNumber}: </span>
                              <span className="text-text-secondary">{inv.reason}</span>
                              {inv.rawData && (
                                <div className="text-[10px] text-muted mt-1 font-mono truncate max-w-sm">
                                  Data: {JSON.stringify(inv.rawData)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Valid records preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Valid Client Records ({importState.validation.valid.length})</h4>
                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-surface-2 text-text-secondary border-b border-border sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Policy Number</th>
                              <th className="py-2 px-3">Product</th>
                              <th className="py-2 px-3">Premium</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {importState.validation.valid.map((val, idx) => (
                              <tr key={idx} className="hover:bg-surface-2/40">
                                <td className="py-2 px-3 font-medium text-text">{val.clientName}</td>
                                <td className="py-2 px-3 text-text-secondary">{val.policyNumber}</td>
                                <td className="py-2 px-3 text-text-secondary">{val.product}</td>
                                <td className="py-2 px-3 text-text-secondary">₱{val.annualPremium?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-card shrink-0 flex gap-3">
                  <button
                    onClick={handleConfirmImport}
                    disabled={importState.validation.valid.length === 0}
                    className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-black font-extrabold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed border border-[#F4C542]/30 disabled:border-transparent"
                  >
                    Confirm Import ({importState.validation.valid.length})
                  </button>
                  <button
                    onClick={() => {
                      setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, errorMessage: '' });
                      setPastedText('');
                      setPassword('');
                      setImportFile(null);
                    }}
                    className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-xl transition"
                  >
                    Reset File
                  </button>
                </div>
              </div>
            )}

            {/* Phase 4: Importing Spinner */}
            {importState.phase === 'importing' && (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <div className="text-center">
                  <h3 className="text-sm font-bold text-text">Importing Records</h3>
                  <p className="text-xs text-text-secondary mt-1">Uploading and indexing databases...</p>
                </div>
              </div>
            )}

            {/* Phase 5: Done / Success */}
            {importState.phase === 'done' && (
              <div className="p-10 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
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
                    setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, skippedHeaders: 0, skippedEmpty: 0, skippedInvalid: 0, errorMessage: '' });
                    setPastedText('');
                    setPassword('');
                    setImportFile(null);
                    setImportMethod('file');
                    setActiveModal(null);
                  }}
                  className="w-full bg-primary text-black font-semibold text-xs py-2.5 rounded-xl border border-[#e0b53c] hover:bg-primary/80 transition"
                >
                  Close Panel
                </button>
              </div>
            )}

            {/* Phase 6: Error State */}
            {importState.phase === 'error' && (
              <div className="p-10 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">Import Failed</h3>
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{importState.errorMessage}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, errorMessage: '' });
                      setPassword('');
                      setImportFile(null);
                    }}
                    className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-xl transition"
                  >
                    Try Again
                  </button>
                  {importState.errorMessage.includes('password-protected') && (
                    <button
                      onClick={() => {
                        setImportState({ phase: 'idle', fileName: '', validation: null, totalRows: 0, importedCount: 0, updatedCount: 0, skippedCount: 0, errorMessage: '' });
                        setImportMethod('paste');
                      }}
                      className="flex-1 bg-primary text-black font-bold text-xs py-2.5 rounded-xl border border-[#e0b53c] hover:bg-primary/80 transition"
                    >
                      Use Copy & Paste
                    </button>
                  )}
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
