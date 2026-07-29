
//     "Yes. Based on your Excel export screenshot, your current parseClientRows() only extracts:

// ✅ Client Name
// ✅ Mobile Number
// ✅ Email
// ✅ Address
// ✅ Birthdate

// and intentionally sets:

// policyNumber: '',
// product: '',
// approvalDate: '',
// beneficiary: '',
// fundAllocation: '',

// That's why your table shows:

// ₱0
// Policy Number = blank
// Product = blank
// Approval Date = blank
// Beneficiary = blank
// Fund Allocation = blank
// Add these column mappings

// Inside parseClientRows(), after:

// const bdayCol = findCol(['date of birth', 'birthday', 'dob']);

// add:

// const policyCol = findCol([
//   'policy number',
//   'policy no',
//   'policy #'
// ]);

// const productCol = findCol([
//   'policy name',
//   'product',
//   'plan name'
// ]);

// const approvalCol = findCol([
//   'issue date',
//   'approval date',
//   'policy date'
// ]);

// const beneficiaryCol = findCol([
//   'beneficiary'
// ]);

// const fundAllocationCol = findCol([
//   'fund allocation',
//   'allocation',
//   'fund'
// ]);
// Extract values

// Replace:

// const clientName = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
// const mobileNumber = mobCol >= 0 ? String(row[mobCol] ?? '').trim() : '';
// const email = emailCol >= 0 ? String(row[emailCol] ?? '').trim() : '';
// const address = addCol >= 0 ? String(row[addCol] ?? '').trim() : '';

// with:

// const clientName = nameCol >= 0
//   ? String(row[nameCol] ?? '').trim()
//   : '';

// const mobileNumber = mobCol >= 0
//   ? String(row[mobCol] ?? '').trim()
//   : '';

// const email = emailCol >= 0
//   ? String(row[emailCol] ?? '').trim()
//   : '';

// const address = addCol >= 0
//   ? String(row[addCol] ?? '').trim()
//   : '';

// const policyNumber = policyCol >= 0
//   ? String(row[policyCol] ?? '').trim()
//   : '';

// const product = productCol >= 0
//   ? String(row[productCol] ?? '').trim()
//   : '';

// const approvalDate =
//   approvalCol >= 0
//     ? parseDateFlexible(String(row[approvalCol] ?? '').trim()) || ''
//     : '';

// const beneficiary =
//   beneficiaryCol >= 0
//     ? String(row[beneficiaryCol] ?? '').trim()
//     : '';

// const fundAllocation =
//   fundAllocationCol >= 0
//     ? String(row[fundAllocationCol] ?? '').trim()
//     : '';
// Update valid.push()

// Replace:

// valid.push({
//   clientName,
//   mobileNumber,
//   email,
//   address,
//   birthdate,
//   policyNumber: '',
//   product: '',
//   approvalDate: '',
//   annualPremium: 0,
//   beneficiary: '',
//   fundAllocation: '',
//   modeOfPayment: 'Annual'
// });

// with:

// valid.push({
//   clientName,
//   mobileNumber,
//   email,
//   address,
//   birthdate,

//   policyNumber,
//   product,
//   approvalDate,

//   annualPremium: 0,

//   beneficiary,
//   fundAllocation,

//   modeOfPayment: 'Annual'
// });
// Important

// Your Excel screenshot contains:

// Excel Column	CPST Field
// Policy number	policyNumber
// Policy name	product
// Issue date	approvalDate
// Policy owner	clientName
// Insured	optional
// Face amount	can map to another field later

// The file does NOT contain:

// Mobile Number
// Email
// Address
// Beneficiary
// Fund Allocation

// So if you're importing directly from the Sun Life Policy List export, only these fields can be auto-filled:

// clientName
// policyNumber
// product
// approvalDate

// while:

// mobileNumber
// email
// address
// beneficiary
// fundAllocation

// must come from another spreadsheet/database source.

// For the exact Sun Life export shown in your screenshot, I'd actually recommend enhancing parseClientRows() to detect two templates automatically:

// Client Master List Template
// Client Name
// Email
// Mobile
// Address
// DOB
// Sun Life Policy List Export
// Policy Number
// Policy Owner
// Issue Date
// Policy Name
// Face Amount

// and merge/update existing CPST records instead of treating them as the same file structure. That would be the cleanest solution for CAMS. 🚀"



'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, ChevronRight, ArrowLeft,
  Upload, FileSpreadsheet, CheckCircle2, Target, Users,
  AlertCircle, Eye, EyeOff, UserCheck, UserPlus, Briefcase, Mail, MoreVertical, FileText
} from 'lucide-react';
import Link from 'next/link';
import { AdminHeader } from '@src/components/layout';
import { AdminSidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import SignaturePad from '@src/components/ui/SignaturePad';
import { exportToPDF, exportToDOCS } from '@src/lib/export';
import ExportDropdown from '@src/components/shared/ExportDropdown';
import { ConfirmModal } from '@src/components/modals/ConfirmModal';
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
  idType?: string;
  idNumber?: string;
  idExpirationDate?: string;
  idAttachmentUrl?: string;
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

  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | 'addAdvisor' | 'editAdvisor' | 'actions' | 'documents' | 'documentPreview' | null>(null);
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

  const [importState, setImportState] = useState<{
    phase: 'idle' | 'reading' | 'password' | 'preview' | 'importing' | 'done' | 'error';
    fileName: string;
    validation: {
      newClients: any[];
      duplicateClients: any[];
      invalid: { rowNumber: number; reason: string; rawData: any }[];
      stats: { skippedHeaders: number; skippedEmpty: number; skippedInvalid: number };
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

      if (advisorsErr) {
        console.error('Supabase Error fetching advisors:', advisorsErr);
      }

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
        console.warn('Fallback Warning: advisors table is empty or inaccessible. Building advisor list from clients.advisor_id. This may mask database issues like missing RLS policies.');
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
        id_type: currentClient.idType || null,
        id_number: currentClient.idNumber || null,
        id_expiration_date: currentClient.idExpirationDate || null,
        id_attachment_url: currentClient.idAttachmentUrl || null,
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

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(true);
    try {
      // Local preview
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
      await supabase.from('cpst_clients').update({
        id_type: docFormData.idType || null,
        id_number: docFormData.idNumber || null,
        id_expiration_date: docFormData.idExpirationDate || null,
        id_attachment_url: docFormData.idAttachmentUrl || null,
      }).eq('id', currentClient.id);
      // reflect changes in local state immediately
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
        return; // Don't close modal on error
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
    const ageCol = findCol(['age']);
    const policyCol = findCol(['policy number', 'policy#', 'policy no', 'policy #']);
    const productCol = findCol(['product', 'plan', 'policy name', 'plan name']);
    const approvalCol = findCol(['date of approval', 'approval date', 'date_of_approval', 'issue date', 'policy date']);
    const beneficiaryCol = findCol(['beneficiary']);
    const fundAllocationCol = findCol(['fund allocation', 'allocation', 'fund']);
    const paymentModeCol = findCol(['mode of payment']);
    const premiumCol = findCol(['annual premium', 'premium']);

    const newClients: Partial<ClientManagementRecord & { _matchedName?: string; _matchedPolicy?: string }>[] = [];
    const duplicateClients: Partial<ClientManagementRecord & { _matchedName?: string; _matchedPolicy?: string }>[] = [];
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
        rowText.includes("data privacy act") ||
        rowText.includes("policy owner")
      ) {
        skippedHeaders++;
        continue;
      }

      const rowNumber = i + 1;
      const rawData: Record<string, any> = {};
      headerRow.forEach((h: any, idx: number) => { rawData[String(h)] = row[idx] ?? ''; });

      const clientName = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
      if (clientName === '1') {
        skippedHeaders++;
        continue;
      }
      const mobileNumber = mobCol >= 0 ? String(row[mobCol] ?? '').trim() : '';
      const email = emailCol >= 0 ? String(row[emailCol] ?? '').trim() : '';
      const address = addCol >= 0 ? String(row[addCol] ?? '').trim() : '';
      const rawBday = bdayCol >= 0 ? String(row[bdayCol] ?? '').trim() : '';
      const birthdate = rawBday ? (parseDateFlexible(rawBday) || rawBday) : '';
      const policyNumber = policyCol >= 0 ? String(row[policyCol] ?? '').trim() : '';
      const product = productCol >= 0 ? String(row[productCol] ?? '').trim() : '';
      const approvalDate = approvalCol >= 0
        ? parseDateFlexible(String(row[approvalCol] ?? '').trim()) || ''
        : '';
      const beneficiary = beneficiaryCol >= 0 ? String(row[beneficiaryCol] ?? '').trim() : '';
      const fundAllocation = fundAllocationCol >= 0 ? String(row[fundAllocationCol] ?? '').trim() : '';
      const modeOfPayment = paymentModeCol >= 0
        ? String(row[paymentModeCol] ?? '').trim()
        : 'Annual';
      const annualPremium = premiumCol >= 0
        ? parseFloat(String(row[premiumCol] ?? '').replace(/[^0-9.]/g, '')) || 0
        : 0;

      if (!clientName) {
        skippedInvalid++;
        invalid.push({ rowNumber, reason: 'Missing Client Name', rawData });
        continue;
      }

      const match = clients.find(c =>
        (policyNumber && c.policyNumber === policyNumber) ||
        (!policyNumber && c.clientName.toLowerCase() === clientName.toLowerCase() && c.birthdate === birthdate)
      );

      const record = {
        clientName,
        mobileNumber,
        email,
        address,
        birthdate,
        policyNumber,
        product,
        approvalDate,
        annualPremium,
        beneficiary,
        fundAllocation,
        modeOfPayment
      };

      if (match) {
        duplicateClients.push({
          ...record,
          _matchedName: match.clientName,
          _matchedPolicy: match.policyNumber
        });
        continue;
      }

      newClients.push(record);
    }

    return { newClients, duplicateClients, invalid, stats: { skippedHeaders, skippedEmpty, skippedInvalid } };
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
    const findCol = (kw: string[]): number => headerRow.findIndex((h: any) => kw.some(k => String(h).toLowerCase().includes(k)));

    const nameCol = findCol(['advisor name', 'advisor', 'name']);
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

    return { newClients, duplicateClients, invalid, stats: { skippedHeaders, skippedEmpty, skippedInvalid } };
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
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });

      if (importTarget === 'clients') {
        const { newClients, duplicateClients, invalid, stats } = parseClientRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, invalid, stats } as any }));
      } else {
        const { newClients, duplicateClients, invalid, stats } = parseAdvisorRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, invalid, stats } as any }));
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

  const handleFileSelected = async (file: File) => {
    if (importTarget === 'clients' && !importAdvisorId) {
      setImportState({ phase: 'error', fileName: file.name, validation: null, importedCount: 0, errorMessage: 'Please select an Advisor before uploading clients.' });
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

      if (importTarget === 'clients') {
        const { newClients, duplicateClients, invalid, stats } = parseClientRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, invalid, stats } as any }));
      } else {
        const { newClients, duplicateClients, invalid, stats } = parseAdvisorRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, invalid, stats } as any }));
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
    if (importTarget === 'clients' && !importAdvisorId) {
      setImportState({ phase: 'error', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: 'Please select an Advisor before importing clients.' });
      return;
    }

    setImportState({ phase: 'reading', fileName: 'Pasted Grid Data', validation: null, importedCount: 0, errorMessage: '' });

    try {
      if (!text.trim()) throw new Error("Pasted data is empty.");
      const rows = text.split(/\r?\n/).map(row => row.split('\t'));
      if (rows.length < 2) throw new Error("No data found or insufficient rows.");

      if (importTarget === 'clients') {
        const { newClients, duplicateClients, invalid, stats } = parseClientRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, invalid, stats } as any }));
      } else {
        const { newClients, duplicateClients, invalid, stats } = parseAdvisorRows(rows);
        setImportState(prev => ({ ...prev, phase: 'preview', validation: { newClients, duplicateClients, invalid, stats } as any }));
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

              <div className="flex flex-wrap items-center gap-3">
                {selectedAdvisor && (
                  <button
                    onClick={() => setSelectedAdvisor(null)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card text-text text-[11.5px] font-bold shadow-sm hover:bg-surface-2 transition-all duration-200 active:scale-[0.98]"
                  >
                    <ArrowLeft size={14} /> Back to Advisor Registry
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

                {canCreate && (
                  <button
                    onClick={() => {
                      setCurrentClient({ advisorId: selectedAdvisor?.id || '' });
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
                      <h3 className={styles.table_70}>CAMS Batch Import</h3>
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
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search advisor by name, code, or email..."
                    value={advisorSearch}
                    onChange={e => setAdvisorSearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-full h-11 pl-10 pr-4 text-sm text-text transition duration-200 focus:outline-none focus:border-[#F4C542] focus:ring-4 focus:ring-[#F4C542]/10"
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
                <div className="relative flex-1 w-full md:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search client name, policy number..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl h-10 pl-10 pr-4 text-[11.5px] text-text transition duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="h-10 px-4 bg-surface border border-border rounded-xl text-[11.5px] font-semibold text-text focus:outline-none focus:border-primary">
                    <option value="ALL">All Products</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-10 px-4 bg-surface border border-border rounded-xl text-[11.5px] font-semibold text-text focus:outline-none focus:border-primary">
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
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[11.5px] font-bold hover:bg-red-500/20 active:scale-[0.97] transition-all duration-200 whitespace-nowrap border border-red-500/20"
                    >
                      Delete Selected ({selectedIds.length})
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
                            checked={isAllClientsSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(filteredClients.map(c => c.id));
                              else setSelectedIds([]);
                            }}
                            className="rounded border-border/50 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer w-4 h-4"
                          />
                        </th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Client Name</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Relationship</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Policy Number</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Product</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Approval Date</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Annual Premium</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Mobile Number</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Email</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Address</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Beneficiary</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Fund Allocation</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary">Mode of Payment</th>
                        <th className="py-4 px-4 font-bold text-[10.5px] uppercase tracking-wider text-text-secondary text-right sticky right-0 bg-surface-2/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {loading ? (
                        <tr><td colSpan={14} className="py-8 text-center text-text-secondary text-[11.5px]">Loading clients...</td></tr>
                      ) : filteredClients.map((client, i) => (
                        <tr key={client.id} className="group hover:bg-surface-2/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(client.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedIds([...selectedIds, client.id]);
                                  else setSelectedIds(selectedIds.filter(id => id !== client.id));
                                }}
                                className="rounded border-border/50 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer w-4 h-4"
                              />
                              <span className="text-[11.5px] text-text-secondary font-mono">{i + 1}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-text text-[12px]">{client.clientName}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.relationship || '—'}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-text text-[11.5px]">
                            {client.policyNumber ? <span className="bg-surface border border-border px-2 py-0.5 rounded-md">{client.policyNumber}</span> : '—'}
                          </td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.product || '—'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.approvalDate || '—'}</td>
                          <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400 text-[12px]">₱{client.annualPremium?.toLocaleString() || '0'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.mobileNumber || '—'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.email || '—'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px] max-w-[200px] truncate" title={client.address}>{client.address || '—'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.beneficiary || '—'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.fundAllocation || '—'}</td>
                          <td className="py-3 px-4 text-text-secondary text-[11.5px]">{client.modeOfPayment || '—'}</td>
                          <td className="py-2.5 px-4 text-right sticky right-0 bg-card group-hover:bg-surface-2/40 transition-colors">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button onClick={() => { setCurrentClient(client); setActiveModal('actions'); }} className="p-2 text-muted hover:text-blue-500 transition-colors duration-200 bg-card border border-transparent hover:border-blue-500 rounded-full shadow-sm" title="Forms & Services">
                                <MoreVertical size={14} />
                              </button>
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
            </div>

            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="submit" form="cpst-form" className="flex-1 bg-linear-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-sm py-2.5 rounded-full transition-all duration-200 cursor-pointer border border-[#F4C542]/30 shadow-sm active:scale-[0.97]">
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

            {importTarget === 'clients' && (
              <div className="p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/20 text-left shrink-0">
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

            {importState.phase === 'preview' && importState.validation && (
              <div className="flex flex-col h-full max-h-[60vh] p-6 space-y-4">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-text">Preview Valid Records</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Found {importState.validation.newClients.length} new records, {importState.validation.duplicateClients.length} duplicates, and {importState.validation.invalid.length} invalid rows.
                  </p>
                </div>

                <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface-2 p-0 flex flex-col gap-0">
                  {importState.validation.newClients.length === 0 && importState.validation.duplicateClients.length === 0 && importState.validation.invalid.length === 0 && (
                    <div className="py-8 text-center text-text-secondary text-xs">No records to preview.</div>
                  )}

                  {importState.validation.newClients.length > 0 && (
                    <div className="w-full">
                      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 sticky top-0 z-10">
                        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          New clients to import ({importState.validation.newClients.length})
                        </h4>
                      </div>
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-card/50 border-b border-border">
                          <tr>
                            <th className="py-2 px-3 font-bold text-text-secondary">#</th>
                            <th className="py-2 px-3 font-bold text-text-secondary">Name</th>
                            {importTarget === 'clients' && <th className="py-2 px-3 font-bold text-text-secondary">Policy No</th>}
                            <th className="py-2 px-3 font-bold text-text-secondary">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importState.validation.newClients.slice(0, 50).map((r: any, i: number) => (
                            <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-card/50">
                              <td className="py-2 px-3 text-text-secondary">{i + 1}</td>
                              <td className="py-2 px-3 font-semibold text-text">{r.clientName || r.advisorName}</td>
                              {importTarget === 'clients' && <td className="py-2 px-3 text-text-secondary">{r.policyNumber || '—'}</td>}
                              <td className="py-2 px-3 text-text-secondary">{r.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {importState.validation.duplicateClients.length > 0 && (
                    <div className="w-full">
                      <details className="group">
                        <summary className="bg-slate-500/10 border-y border-slate-500/20 px-4 py-2 sticky top-0 z-10 cursor-pointer list-none flex items-center justify-between hover:bg-slate-500/20 transition-colors">
                          <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Already in your list — will be skipped ({importState.validation.duplicateClients.length})
                          </h4>
                          <ChevronRight size={14} className="text-slate-500 transition-transform group-open:rotate-90" />
                        </summary>
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-card/50 border-b border-border">
                            <tr>
                              <th className="py-2 px-3 font-bold text-text-secondary">#</th>
                              <th className="py-2 px-3 font-bold text-text-secondary">Name</th>
                              {importTarget === 'clients' && <th className="py-2 px-3 font-bold text-text-secondary">Policy No</th>}
                              <th className="py-2 px-3 font-bold text-text-secondary">Match Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importState.validation.duplicateClients.slice(0, 50).map((r: any, i: number) => (
                              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-card/50 opacity-60">
                                <td className="py-2 px-3 text-text-secondary">{i + 1}</td>
                                <td className="py-2 px-3 font-semibold text-text">{r.clientName || r.advisorName}</td>
                                {importTarget === 'clients' && <td className="py-2 px-3 text-text-secondary">{r.policyNumber || '—'}</td>}
                                <td className="py-2 px-3 text-text-secondary italic text-[10px]">
                                  Matches existing: {r._matchedName} — Policy {r._matchedPolicy || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>
                  )}

                  {importState.validation.invalid.length > 0 && (
                    <div className="w-full">
                      <details className="group" open>
                        <summary className="bg-red-500/10 border-y border-red-500/20 px-4 py-2 sticky top-0 z-10 cursor-pointer list-none flex items-center justify-between hover:bg-red-500/20 transition-colors">
                          <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
                            Invalid rows — missing required fields ({importState.validation.invalid.length})
                          </h4>
                          <ChevronRight size={14} className="text-red-500 transition-transform group-open:rotate-90" />
                        </summary>
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-card/50 border-b border-border">
                            <tr>
                              <th className="py-2 px-3 font-bold text-text-secondary">Row</th>
                              <th className="py-2 px-3 font-bold text-text-secondary">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importState.validation.invalid.slice(0, 50).map((r: any, i: number) => (
                              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-card/50 opacity-80 text-red-500">
                                <td className="py-2 px-3 font-mono">{r.rowNumber}</td>
                                <td className="py-2 px-3">{r.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 shrink-0">
                  <button
                    onClick={() => {
                      if (importTarget === 'clients') {
                        processAndImportClients(importState.validation!.newClients, importState.fileName, importState.validation!.stats);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 w-full max-w-3xl rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.25)] relative flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh]">

            {/* ── HEADER ── */}
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

            {/* ── SCROLLABLE BODY ── */}
            <div className="overflow-y-auto flex-1 min-h-0">

              {/* SUMMARY CARD ROW */}
              <div className="px-7 pt-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* ID Type */}
                <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-3.5 flex flex-col gap-1 hover:border-border transition-colors">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ID Type</span>
                  <span className={`text-[13px] font-bold leading-tight ${currentClient.idType ? 'text-text' : 'text-muted-foreground/50 italic font-normal'}`}>
                    {currentClient.idType || 'Not set'}
                  </span>
                </div>
                {/* ID Number */}
                <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-3.5 flex flex-col gap-1 hover:border-border transition-colors">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ID Number</span>
                  <span className={`text-[12px] font-mono font-bold leading-tight ${currentClient.idNumber ? 'text-text' : 'text-muted-foreground/50 italic font-normal'}`}>
                    {currentClient.idNumber || 'Not set'}
                  </span>
                </div>
                {/* Expiration */}
                <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-3.5 flex flex-col gap-1 hover:border-border transition-colors">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Expiration</span>
                  <span className={`text-[13px] font-bold leading-tight ${currentClient.idExpirationDate ? 'text-text' : 'text-muted-foreground/50 italic font-normal'}`}>
                    {currentClient.idExpirationDate || 'Not set'}
                  </span>
                </div>
                {/* Signature status */}
                <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-3.5 flex flex-col gap-1 hover:border-border transition-colors">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Signature</span>
                  {currentClient.signatureData ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-500">
                      <CheckCircle2 size={13} strokeWidth={2.5} /> Signed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* ATTACHMENT PREVIEW ROW */}
              <div className="px-7 pb-4">
                <div className="bg-surface-2/40 border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">ID Attachment</p>
                    {currentClient.idAttachmentUrl ? (
                      <a href={currentClient.idAttachmentUrl} target="_blank" rel="noreferrer"
                        className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1.5 w-fit underline-offset-2 hover:underline transition-colors">
                        <Eye size={13} /> View Attached File
                      </a>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs italic">No file attached</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {currentClient.idType ? (
                      <button
                        onClick={() => {
                          setDocFormData({
                            idType: currentClient.idType || '',
                            idNumber: currentClient.idNumber || '',
                            idExpirationDate: currentClient.idExpirationDate || '',
                            idAttachmentUrl: currentClient.idAttachmentUrl || '',
                          });
                          setDocFormOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-extrabold rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                      >
                        <Edit2 size={12} /> Edit ID
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDocFormData({ idType: '', idNumber: '', idExpirationDate: '', idAttachmentUrl: '' });
                          setDocFormOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-extrabold rounded-full border border-border text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                      >
                        <Plus size={12} /> Add ID
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── INLINE EDIT FORM ── */}
              {docFormOpen && (
                <div className="mx-6 my-5 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                  {/* Form header strip */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-primary/15 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Edit2 size={12} className="text-primary" />
                      </div>
                      <span className="text-xs font-black text-text uppercase tracking-wider">
                        {currentClient.idType ? 'Edit ID Details' : 'Add ID Details'}
                      </span>
                    </div>
                    <button onClick={() => setDocFormOpen(false)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-text rounded-full hover:bg-surface-2 transition-colors">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* ID Type + Number row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={formLabelClass}>ID Type</label>
                        <select
                          value={docFormData.idType}
                          onChange={e => setDocFormData(prev => ({ ...prev, idType: e.target.value }))}
                          className={formInputClass}
                        >
                          <option value="">Select ID Type</option>
                          {["Philippine Passport", "Driver's License", "UMID", "PhilHealth ID", "SSS ID", "PRC ID", "Postal ID", "Voter's ID", "Other"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className={formLabelClass}>ID Number</label>
                        <input
                          type="text"
                          value={docFormData.idNumber}
                          onChange={e => setDocFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                          className={formInputClass}
                          placeholder="e.g. P1234567A"
                        />
                      </div>
                    </div>

                    {/* Expiration Date */}
                    <div className="space-y-1.5">
                      <label className={formLabelClass}>Expiration Date</label>
                      <input
                        type="date"
                        value={docFormData.idExpirationDate}
                        onChange={e => setDocFormData(prev => ({ ...prev, idExpirationDate: e.target.value }))}
                        className={formInputClass}
                      />
                    </div>

                    {/* File Upload Zone */}
                    <div className="space-y-2">
                      <label className={formLabelClass}>ID Attachment</label>

                      {uploadingDocId ? (
                        /* ── UPLOADING STATE ── */
                        <div className="border-2 border-dashed border-primary/40 rounded-2xl h-36 flex flex-col items-center justify-center gap-3 bg-primary/5">
                          <div className="relative w-12 h-12">
                            <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Upload size={14} className="text-primary animate-bounce" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-primary">Uploading file…</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Please wait</p>
                          </div>
                          <div className="w-40 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse w-3/4" />
                          </div>
                        </div>
                      ) : !docFormData.idAttachmentUrl ? (
                        /* ── EMPTY DROP ZONE ── */
                        <label className="group relative border-2 border-dashed border-border hover:border-primary rounded-2xl h-36 flex flex-col items-center justify-center gap-3 cursor-pointer bg-surface hover:bg-primary/5 transition-all duration-300 overflow-hidden">
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ backgroundImage: 'radial-gradient(circle, rgba(244,197,66,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                          <div className="relative flex flex-col items-center gap-2.5">
                            <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border group-hover:border-primary/40 group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
                              <Upload size={20} className="text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-text-secondary group-hover:text-text transition-colors">
                                Drag & drop or <span className="text-primary underline underline-offset-2">browse</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, or PDF · Max 10 MB</p>
                            </div>
                          </div>
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocIdUpload} />
                        </label>
                      ) : (
                        /* ── FILE PREVIEW ── */
                        <div className="relative border-2 border-primary/30 rounded-2xl overflow-hidden bg-card group animate-in fade-in zoom-in-95 duration-300">
                          {docFormData.idAttachmentUrl.toLowerCase().endsWith('.pdf') ? (
                            <div className="h-36 flex flex-col items-center justify-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <FileText size={28} className="text-red-500" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-text">PDF Document</p>
                                <p className="text-[10px] text-muted-foreground">Ready to save</p>
                              </div>
                            </div>
                          ) : (
                            <div className="h-36 flex items-center justify-center bg-surface/50">
                              <img src={docFormData.idAttachmentUrl} alt="ID Preview" className="max-h-36 max-w-full object-contain rounded-xl" />
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-full cursor-pointer transition-colors border border-white/30">
                              <Upload size={13} /> Replace
                              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocIdUpload} />
                            </label>
                            <button
                              type="button"
                              onClick={() => setDocFormData(prev => ({ ...prev, idAttachmentUrl: '' }))}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold rounded-full cursor-pointer transition-colors border border-red-400/50"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                          {/* Attached badge */}
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                            <CheckCircle2 size={9} /> ATTACHED
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveDocFields}
                        className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#d4a800] text-black font-extrabold text-xs py-3 rounded-full transition-all duration-200 shadow-md shadow-primary/30 active:scale-[0.97] flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} /> Save Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocFormOpen(false)}
                        className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-surface-2 shrink-0 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Last updated: <span className="font-semibold text-text-secondary">{currentClient.created_at ? new Date(currentClient.created_at).toLocaleDateString() : '—'}</span>
              </p>
              <button
                onClick={() => { setDocFormOpen(false); setActiveModal(null); }}
                className="px-6 py-2.5 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97]"
              >
                Close
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
    </div>
  );
}
