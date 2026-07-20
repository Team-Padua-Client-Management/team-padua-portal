'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Download, AlertCircle, Loader2, Save, CheckCircle2, FileText, Inbox, PlusCircle, MinusCircle
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";
import SignaturePad from '@/app/components/ui/SignaturePad';
import ClientSelector from '@/app/components/shared/ClientSelector';

// ── PDF generator ────────────────────────────────────────────────────────
import { generateFundSwitchingPdf } from '@/app/lib/pdf/generateFundSwitchingPdf';
// ──────────────────────────────────────────────────────────────────────────

const TABLE_NAME = 'fund_switching_requests';

export interface FundSwitchRow {
  from_fund: string;
  to_fund: string;
  switch_type: 'full' | 'partial' | '';
  amount: string;
  percentage: string;
}

export interface FutureAllocation {
  fund_name: string;
  percentage: string;
}

export interface FundSwitchingRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  created_at?: string;

  // Section 1
  policy_number: string;
  life_insured: string;
  citizenship: string;
  email_address: string;
  mobile_phone: string;
  home_phone: string;
  work_phone: string;
  present_address: string;
  permanent_address: string;
  work_address: string;
  country_of_legal_residence: string;

  // Section 2
  fund_switch_rows: FundSwitchRow[];

  // Section 3
  future_peso_allocations: FutureAllocation[];
  future_dollar_allocations: FutureAllocation[];

  // Section 4
  excess_premium_option: 'add' | 'change' | 'cancel' | '';
  excess_currency: 'PHP' | 'USD' | '';
  excess_amount: string;

  // Section 5
  place_of_signing: string;
  date_of_signing: string;
  policy_owner_signature: string;
  witness_signature: string;
  witness_name: string;
  witness_address: string;
  assignee_signature: string;
  beneficiary_signature: string;
}

const defaultRecord: Omit<FundSwitchingRecord, 'id' | 'client_id' | 'created_at'> = {
  status: 'Pending',
  policy_number: '',
  life_insured: '',
  citizenship: '',
  email_address: '',
  mobile_phone: '',
  home_phone: '',
  work_phone: '',
  present_address: '',
  permanent_address: '',
  work_address: '',
  country_of_legal_residence: '',

  fund_switch_rows: [{ from_fund: '', to_fund: '', switch_type: '', amount: '', percentage: '' }],

  future_peso_allocations: [{ fund_name: '', percentage: '' }],
  future_dollar_allocations: [{ fund_name: '', percentage: '' }],

  excess_premium_option: '',
  excess_currency: '',
  excess_amount: '',

  place_of_signing: '',
  date_of_signing: new Date().toISOString().split('T')[0],
  policy_owner_signature: '',
  witness_signature: '',
  witness_name: '',
  witness_address: '',
  assignee_signature: '',
  beneficiary_signature: '',
};

const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all duration-200";
const inputDisabledClass = "w-full px-4 py-2.5 border border-gray-100 rounded-2xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed";
const labelClass = "block text-sm font-medium text-gray-600 mb-1.5";
const cardClass = "bg-white p-6 rounded-[28px] border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]";

function SectionHeader({ letter, title, badge }: { letter: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {letter}
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      {badge && (
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function PrimaryButton({
  children, onClick, type = 'button', disabled, loading, className = '', form,
}: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; loading?: boolean; className?: string; form?: string;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 active:scale-[0.97] font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

function SecondaryButton({
  children, onClick, disabled, className = '',
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 active:scale-[0.97] font-medium text-sm transition-all duration-200 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children, onClick, disabled, loading,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 active:scale-[0.97] font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

function IconButton({
  onClick, disabled, title, tone = 'default', children,
}: {
  onClick?: () => void; disabled?: boolean; title?: string; tone?: 'default' | 'blue' | 'red'; children: React.ReactNode;
}) {
  const toneClass =
    tone === 'blue' ? 'text-blue-600 hover:bg-blue-50' :
      tone === 'red' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' :
        'text-gray-400 hover:text-blue-600 hover:bg-blue-50';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2.5 rounded-full transition-colors duration-200 disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function Modal({
  children, onClose, maxWidth = 'max-w-4xl', z = 'z-50',
}: {
  children: React.ReactNode; onClose?: () => void; maxWidth?: string; z?: string;
}) {
  return (
    <div className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 ${z} animate-[fadeIn_0.18s_ease-out]`}>
      <div className={`bg-white rounded-[32px] w-full ${maxWidth} max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-[scaleIn_0.2s_ease-out]`}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();
  const tone =
    normalized === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
      normalized === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
        'bg-amber-50 text-amber-700 border-amber-100';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${tone}`}>
      {status}
    </span>
  );
}

export default function FundSwitchingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<FundSwitchingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FundSwitchingRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<Omit<FundSwitchingRecord, 'id' | 'created_at'>>({
    client_id: '',
    ...defaultRecord
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const [selectedClientDetails, setSelectedClientDetails] = useState<{
    client_name: string;
    birthdate: string | null;
    policy_number: string | null;
  } | null>(null);

  useEffect(() => {
    if (!formData.client_id) {
      setSelectedClientDetails(null);
      return;
    }
    const fetchClientDetails = async () => {
      try {
        const { data, error: err } = await supabase
          .from('cpst_clients')
          .select('client_name, birthdate, policy_number')
          .eq('id', formData.client_id)
          .single();
        if (err) throw err;
        setSelectedClientDetails(data);
        
        // Auto-fill policy number if empty
        if (!formData.policy_number && data.policy_number) {
          setFormData(prev => ({ ...prev, policy_number: data.policy_number || '' }));
        }
      } catch (err: any) {
        console.error('Error fetching client details:', err);
      }
    };
    fetchClientDetails();
  }, [formData.client_id]);

  const getClientNameParts = (fullName: string | undefined | null) => {
    if (!fullName) return { last: '', first: '', middle: '' };

    if (fullName.includes(',')) {
      const [lastPart, restPart] = fullName.split(',').map(s => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      const first = restWords[0] || '';
      const middle = restWords.slice(1).join(' ');
      return { last: lastPart, first, middle };
    } else {
      const words = fullName.trim().split(/\s+/);
      if (words.length === 1) {
        return { last: '', first: words[0], middle: '' };
      }
      if (words.length === 2) {
        return { last: words[1], first: words[0], middle: '' };
      }
      return {
        last: words[words.length - 1],
        first: words[0],
        middle: words.slice(1, -1).join(' ')
      };
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          client:cpst_clients(client_name, policy_number, birthdate)
        `)
        .order('created_at', { ascending: false });

      if (err) {
        if (err.code === '42P01' || err.code === 'PGRST200' || err.code === 'PGRST205') {
          setRecords([]);
          return;
        }
        throw err;
      }
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching records:', err.message || err, JSON.stringify(err));
      if (!err.message?.includes('does not exist') && !err.message?.includes('relationship')) {
        setError(err.message || 'Failed to fetch records');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleClientSelect = (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
  };

  const handleOpenModal = (record?: FundSwitchingRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        client_id: record.client_id || '',
        policy_number: record.policy_number || '',
        life_insured: record.life_insured || '',
        citizenship: record.citizenship || '',
        email_address: record.email_address || '',
        mobile_phone: record.mobile_phone || '',
        home_phone: record.home_phone || '',
        work_phone: record.work_phone || '',
        present_address: record.present_address || '',
        permanent_address: record.permanent_address || '',
        work_address: record.work_address || '',
        country_of_legal_residence: record.country_of_legal_residence || '',

        fund_switch_rows: record.fund_switch_rows?.length ? record.fund_switch_rows : [{ from_fund: '', to_fund: '', switch_type: '', amount: '', percentage: '' }],
        future_peso_allocations: record.future_peso_allocations?.length ? record.future_peso_allocations : [{ fund_name: '', percentage: '' }],
        future_dollar_allocations: record.future_dollar_allocations?.length ? record.future_dollar_allocations : [{ fund_name: '', percentage: '' }],
        
        excess_premium_option: record.excess_premium_option || '',
        excess_currency: record.excess_currency || '',
        excess_amount: record.excess_amount || '',

        place_of_signing: record.place_of_signing || '',
        date_of_signing: record.date_of_signing || new Date().toISOString().split('T')[0],
        policy_owner_signature: record.policy_owner_signature || '',
        witness_signature: record.witness_signature || '',
        witness_name: record.witness_name || '',
        witness_address: record.witness_address || '',
        assignee_signature: record.assignee_signature || '',
        beneficiary_signature: record.beneficiary_signature || '',
        status: record.status || 'Pending'
      });
      if (record.client) {
        setSelectedClientDetails({
          client_name: record.client.client_name,
          birthdate: record.client.birthdate,
          policy_number: record.client.policy_number
        });
      }
    } else {
      setEditingRecord(null);
      setFormData({
        client_id: '',
        ...defaultRecord
      });
      setSelectedClientDetails(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      setError("Please select a client.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (editingRecord) {
        const payload: any = { ...formData };
        if (!payload.date_of_signing) payload.date_of_signing = null;

        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);

        if (updateError) throw updateError;
        setSuccess("Record updated successfully");
      } else {
        const payload: any = { ...formData };
        if (!payload.date_of_signing) payload.date_of_signing = null;

        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([payload]);

        if (insertError) throw insertError;
        setSuccess("Record created successfully");
      }

      setIsModalOpen(false);
      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const details = err?.details || err?.hint || '';
      const message = err?.message || 'Failed to save record';
      setError(details ? `${message} - ${details}` : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (record: FundSwitchingRecord) => {
    try {
      setIsGeneratingPdf(true);
      setGeneratingPdfId(record.id);
      setError("");

      const ownerName = getClientNameParts(record.client?.client_name);
      const ownerDob = record.client?.birthdate || '';

      const pdfBytes = await generateFundSwitchingPdf(record, ownerName, ownerDob);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      const policyStr = record.policy_number ? `_${record.policy_number}` : '';
      a.download = `FundSwitching${policyStr}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF. Please check that the template file exists in /public/forms/.');
    } finally {
      setIsGeneratingPdf(false);
      setGeneratingPdfId(null);
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      const { error: err } = await supabase.from(TABLE_NAME).delete().eq('id', recordToDelete);
      if (err) throw err;
      setSuccess("Record deleted successfully");
      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error deleting:', err);
      setError(err.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const clientNameParts = getClientNameParts(selectedClientDetails?.client_name);
  
  // Helpers for dynamic rows
  const updateRow = (idx: number, field: keyof FundSwitchRow, val: string) => {
    const newRows = [...formData.fund_switch_rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    setFormData({ ...formData, fund_switch_rows: newRows });
  };
  const addRow = () => {
    setFormData({ ...formData, fund_switch_rows: [...formData.fund_switch_rows, { from_fund: '', to_fund: '', switch_type: '', amount: '', percentage: '' }] });
  };
  const removeRow = (idx: number) => {
    const newRows = formData.fund_switch_rows.filter((_, i) => i !== idx);
    setFormData({ ...formData, fund_switch_rows: newRows });
  };

  const updatePesoRow = (idx: number, field: keyof FutureAllocation, val: string) => {
    const newRows = [...formData.future_peso_allocations];
    newRows[idx] = { ...newRows[idx], [field]: val };
    setFormData({ ...formData, future_peso_allocations: newRows });
  };
  const addPesoRow = () => {
    setFormData({ ...formData, future_peso_allocations: [...formData.future_peso_allocations, { fund_name: '', percentage: '' }] });
  };
  const removePesoRow = (idx: number) => {
    const newRows = formData.future_peso_allocations.filter((_, i) => i !== idx);
    setFormData({ ...formData, future_peso_allocations: newRows });
  };

  const updateDollarRow = (idx: number, field: keyof FutureAllocation, val: string) => {
    const newRows = [...formData.future_dollar_allocations];
    newRows[idx] = { ...newRows[idx], [field]: val };
    setFormData({ ...formData, future_dollar_allocations: newRows });
  };
  const addDollarRow = () => {
    setFormData({ ...formData, future_dollar_allocations: [...formData.future_dollar_allocations, { fund_name: '', percentage: '' }] });
  };
  const removeDollarRow = (idx: number) => {
    const newRows = formData.future_dollar_allocations.filter((_, i) => i !== idx);
    setFormData({ ...formData, future_dollar_allocations: newRows });
  };

  const calculateTotal = (rows: FutureAllocation[]) => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.percentage) || 0), 0);
  };
  const pesoTotal = calculateTotal(formData.future_peso_allocations);
  const dollarTotal = calculateTotal(formData.future_dollar_allocations);


  const filteredRecords = records.filter(r =>
    (r.client?.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.policy_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.text_52}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`${styles.div_54} bg-gray-50/60 min-h-screen`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fund Switching</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and generate Sun Life Fund Switching forms.</p>
            </div>
            <PrimaryButton onClick={() => handleOpenModal()} className="pl-4 pr-5">
              <Plus size={16} />
              New Request
            </PrimaryButton>
          </div>

          {error && (
            <div className="fixed top-6 right-6 z-[100] max-w-sm animate-[slideInRight_0.2s_ease-out]">
              <div className="bg-white border border-red-100 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="text-red-500" size={16} />
                </div>
                <p className="text-red-700 text-sm flex-1">{error}</p>
                <button onClick={() => setError("")} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="fixed top-6 right-6 z-[100] max-w-sm animate-[slideInRight_0.2s_ease-out]">
              <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-emerald-500" size={16} />
                </div>
                <p className="text-emerald-700 text-sm flex-1">{success}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all duration-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/40 text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Client Name</th>
                    <th className="px-6 py-3.5 font-medium">Policy Number</th>
                    <th className="px-6 py-3.5 font-medium">Date</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                            <Inbox className="text-gray-300" size={22} />
                          </div>
                          <p className="text-gray-400 text-sm">No requests found. Create one to get started.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                        No requests match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-semibold shrink-0">
                              {(record.client?.client_name || '?').charAt(0).toUpperCase()}
                            </div>
                            {record.client?.client_name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.policy_number || record.client?.policy_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <IconButton
                              onClick={() => handleDownloadPdf(record)}
                              disabled={isGeneratingPdf}
                              title="Download PDF"
                              tone="blue"
                            >
                              {isGeneratingPdf && generatingPdfId === record.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            </IconButton>
                            <IconButton onClick={() => handleOpenModal(record)} title="Edit">
                              <Edit2 size={16} />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteClick(record.id)} title="Delete" tone="red">
                              <Trash2 size={16} />
                            </IconButton>
                          </div>
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

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <FileText className="text-amber-500" size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {editingRecord ? 'Edit Fund Switching Request' : 'New Fund Switching Request'}
              </h2>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-7 overflow-y-auto bg-gray-50/60 flex-1">
            <form id="fsForm" onSubmit={handleSubmit} className="space-y-6">
              <div className={cardClass}>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Select Client</h3>
                <ClientSelector
                  onChange={handleClientSelect}
                  value={formData.client_id}
                />
              </div>

              {formData.client_id && (
                <>
                  <div className="bg-[#003865] w-full py-4 px-6 rounded-[28px] flex items-center justify-between shadow-sm">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wide">Fund Switching</h2>
                    <div className="text-amber-400 font-bold text-xl tracking-tighter">Sun Life</div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="1" title="General Information" />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className={labelClass}>Policy Owner (Last Name)</label>
                          <input type="text" value={clientNameParts.last} disabled className={inputDisabledClass} />
                        </div>
                        <div>
                          <label className={labelClass}>First Name</label>
                          <input type="text" value={clientNameParts.first} disabled className={inputDisabledClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Middle Name</label>
                          <input type="text" value={clientNameParts.middle} disabled className={inputDisabledClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Policy Number</label>
                          <input type="text" value={formData.policy_number} onChange={e => setFormData({ ...formData, policy_number: e.target.value })} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Life Insured</label>
                          <input type="text" value={formData.life_insured} onChange={e => setFormData({ ...formData, life_insured: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Citizenship</label>
                          <input type="text" value={formData.citizenship} onChange={e => setFormData({ ...formData, citizenship: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input type="text" value={formData.email_address} onChange={e => setFormData({ ...formData, email_address: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Mobile Phone</label>
                          <input type="text" value={formData.mobile_phone} onChange={e => setFormData({ ...formData, mobile_phone: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Home Phone</label>
                          <input type="text" value={formData.home_phone} onChange={e => setFormData({ ...formData, home_phone: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Work Phone</label>
                          <input type="text" value={formData.work_phone} onChange={e => setFormData({ ...formData, work_phone: e.target.value })} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Present Address</label>
                          <textarea value={formData.present_address} onChange={e => setFormData({ ...formData, present_address: e.target.value })} className={inputClass} rows={2} />
                        </div>
                        <div>
                          <label className={labelClass}>Permanent Address</label>
                          <textarea value={formData.permanent_address} onChange={e => setFormData({ ...formData, permanent_address: e.target.value })} className={inputClass} rows={2} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Work Address</label>
                          <textarea value={formData.work_address} onChange={e => setFormData({ ...formData, work_address: e.target.value })} className={inputClass} rows={2} />
                        </div>
                        <div>
                          <label className={labelClass}>Country of Legal Residence</label>
                          <input type="text" value={formData.country_of_legal_residence} onChange={e => setFormData({ ...formData, country_of_legal_residence: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="2" title="Fund Switching Details" />
                    <div className="space-y-4">
                      {formData.fund_switch_rows.map((row, idx) => (
                        <div key={idx} className="p-4 rounded-3xl border border-gray-100 bg-gray-50/50 relative">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className={labelClass}>Switch From Fund</label>
                              <input type="text" value={row.from_fund} onChange={e => updateRow(idx, 'from_fund', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Switch To Fund</label>
                              <input type="text" value={row.to_fund} onChange={e => updateRow(idx, 'to_fund', e.target.value)} className={inputClass} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div>
                              <label className={labelClass}>Switch Type</label>
                              <select value={row.switch_type} onChange={e => updateRow(idx, 'switch_type', e.target.value)} className={inputClass}>
                                <option value="">Select...</option>
                                <option value="full">Full</option>
                                <option value="partial">Partial</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Amount</label>
                              <input type="text" value={row.amount} onChange={e => updateRow(idx, 'amount', e.target.value)} disabled={row.switch_type === 'full'} className={row.switch_type === 'full' ? inputDisabledClass : inputClass} placeholder="For partial only" />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className={labelClass}>Percentage (%)</label>
                                <input type="number" max="100" min="0" value={row.percentage} onChange={e => updateRow(idx, 'percentage', e.target.value)} disabled={row.switch_type === 'full'} className={row.switch_type === 'full' ? inputDisabledClass : inputClass} placeholder="For partial only" />
                              </div>
                              {formData.fund_switch_rows.length > 1 && (
                                <button type="button" onClick={() => removeRow(idx)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full mb-1">
                                  <MinusCircle size={20} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 p-2">
                        <PlusCircle size={16} /> Add another switch row
                      </button>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="3" title="Future Fund Allocation" />
                    <div className="space-y-6">
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Peso Funds</h4>
                        <div className="space-y-3">
                          {formData.future_peso_allocations.map((row, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <div className="flex-1">
                                <input type="text" value={row.fund_name} onChange={e => updatePesoRow(idx, 'fund_name', e.target.value)} placeholder="Fund Name" className={inputClass} />
                              </div>
                              <div className="w-32">
                                <div className="relative">
                                  <input type="number" min="0" max="100" value={row.percentage} onChange={e => updatePesoRow(idx, 'percentage', e.target.value)} placeholder="%" className={inputClass} />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                </div>
                              </div>
                              {formData.future_peso_allocations.length > 1 ? (
                                <button type="button" onClick={() => removePesoRow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                  <X size={16} />
                                </button>
                              ) : <div className="w-8"></div>}
                            </div>
                          ))}
                          <div className="flex justify-between items-center px-2">
                            <button type="button" onClick={addPesoRow} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                              <PlusCircle size={14} /> Add Peso Fund
                            </button>
                            <span className={`text-sm font-bold ${pesoTotal === 100 || pesoTotal === 0 ? 'text-green-600' : 'text-red-500'}`}>
                              Total: {pesoTotal}% {pesoTotal > 0 && pesoTotal !== 100 && '(Must equal 100%)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Dollar Funds</h4>
                        <div className="space-y-3">
                          {formData.future_dollar_allocations.map((row, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <div className="flex-1">
                                <input type="text" value={row.fund_name} onChange={e => updateDollarRow(idx, 'fund_name', e.target.value)} placeholder="Fund Name" className={inputClass} />
                              </div>
                              <div className="w-32">
                                <div className="relative">
                                  <input type="number" min="0" max="100" value={row.percentage} onChange={e => updateDollarRow(idx, 'percentage', e.target.value)} placeholder="%" className={inputClass} />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                </div>
                              </div>
                              {formData.future_dollar_allocations.length > 1 ? (
                                <button type="button" onClick={() => removeDollarRow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                  <X size={16} />
                                </button>
                              ) : <div className="w-8"></div>}
                            </div>
                          ))}
                          <div className="flex justify-between items-center px-2">
                            <button type="button" onClick={addDollarRow} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                              <PlusCircle size={14} /> Add Dollar Fund
                            </button>
                            <span className={`text-sm font-bold ${dollarTotal === 100 || dollarTotal === 0 ? 'text-green-600' : 'text-red-500'}`}>
                              Total: {dollarTotal}% {dollarTotal > 0 && dollarTotal !== 100 && '(Must equal 100%)'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="4" title="Excess Premium Changes" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors duration-200 cursor-pointer ${formData.excess_premium_option === 'add' ? 'border-amber-200 bg-amber-50/40' : 'border-transparent hover:bg-gray-50'}`}>
                          <input type="radio" name="excess_premium_option" checked={formData.excess_premium_option === 'add'} onChange={() => setFormData({ ...formData, excess_premium_option: 'add' })} className="accent-gray-900" />
                          <span className="text-sm text-gray-900">Add To Regular Premium</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors duration-200 cursor-pointer ${formData.excess_premium_option === 'change' ? 'border-amber-200 bg-amber-50/40' : 'border-transparent hover:bg-gray-50'}`}>
                          <input type="radio" name="excess_premium_option" checked={formData.excess_premium_option === 'change'} onChange={() => setFormData({ ...formData, excess_premium_option: 'change' })} className="accent-gray-900" />
                          <span className="text-sm text-gray-900">Change Existing Excess Premium</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors duration-200 cursor-pointer ${formData.excess_premium_option === 'cancel' ? 'border-amber-200 bg-amber-50/40' : 'border-transparent hover:bg-gray-50'}`}>
                          <input type="radio" name="excess_premium_option" checked={formData.excess_premium_option === 'cancel'} onChange={() => setFormData({ ...formData, excess_premium_option: 'cancel', excess_amount: '', excess_currency: '' })} className="accent-gray-900" />
                          <span className="text-sm text-gray-900">Cancel Excess Premium</span>
                        </label>
                      </div>
                      
                      <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                        <label className={labelClass}>Currency & Amount</label>
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="excess_currency" checked={formData.excess_currency === 'PHP'} onChange={() => setFormData({ ...formData, excess_currency: 'PHP' })} disabled={formData.excess_premium_option === 'cancel'} className="accent-gray-900" />
                            <span className="text-sm text-gray-700">PHP</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="excess_currency" checked={formData.excess_currency === 'USD'} onChange={() => setFormData({ ...formData, excess_currency: 'USD' })} disabled={formData.excess_premium_option === 'cancel'} className="accent-gray-900" />
                            <span className="text-sm text-gray-700">USD</span>
                          </label>
                        </div>
                        <input 
                          type="text" 
                          value={formData.excess_amount} 
                          onChange={e => setFormData({ ...formData, excess_amount: e.target.value })} 
                          disabled={formData.excess_premium_option === 'cancel'} 
                          placeholder="Amount"
                          className={formData.excess_premium_option === 'cancel' ? inputDisabledClass : inputClass} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="5" title="Acknowledgement & Signatures" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className={labelClass}>Place of Signing</label>
                        <input type="text" value={formData.place_of_signing} onChange={e => setFormData({ ...formData, place_of_signing: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Date of Signing
                        </label>
                        <input type="date" value={formData.date_of_signing} onChange={e => setFormData({ ...formData, date_of_signing: e.target.value })} className={inputClass} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <label className={labelClass}>Signature of Policy Owner</label>
                        <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.policy_owner_signature}
                            onSignatureChange={(data: string | null) => setFormData({ ...formData, policy_owner_signature: data || '' })}
                            title="Policy Owner Signature"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Signature of Witness</label>
                        <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.witness_signature}
                            onSignatureChange={(data: string | null) => setFormData({ ...formData, witness_signature: data || '' })}
                            title="Witness Signature"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3 mt-4">
                          <div>
                            <input type="text" value={formData.witness_name} onChange={e => setFormData({ ...formData, witness_name: e.target.value })} className={`${inputClass} py-2 text-sm`} placeholder="Witness Name" />
                          </div>
                          <div>
                            <input type="text" value={formData.witness_address} onChange={e => setFormData({ ...formData, witness_address: e.target.value })} className={`${inputClass} py-2 text-sm`} placeholder="Witness Address" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className={labelClass}>Signature of Assignee</label>
                        <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.assignee_signature}
                            onSignatureChange={(data: string | null) => setFormData({ ...formData, assignee_signature: data || '' })}
                            title="Assignee Signature"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Signature of Beneficiary</label>
                        <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.beneficiary_signature}
                            onSignatureChange={(data: string | null) => setFormData({ ...formData, beneficiary_signature: data || '' })}
                            title="Beneficiary Signature"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              )}
            </form>
          </div>

          <div className="px-7 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
            <SecondaryButton onClick={() => setIsModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              form="fsForm"
              type="submit"
              disabled={!formData.client_id}
              loading={isSubmitting}
            >
              {!isSubmitting && <Save size={16} />}
              Save Request
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal onClose={() => setIsDeleteModalOpen(false)} maxWidth="max-w-sm" z="z-[60]">
          <div className="p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete request?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              This fund switching request will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <SecondaryButton
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRecordToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </SecondaryButton>
              <DangerButton onClick={confirmDelete} disabled={isDeleting} loading={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-[32px] w-full max-w-xs shadow-2xl p-8 flex flex-col items-center text-center animate-[scaleIn_0.2s_ease-out]">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
              <FileText className="text-amber-500" size={20} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Generating PDF</h3>
            <p className="text-sm text-gray-500">Please wait a moment...</p>
          </div>
        </div>
      )}
    </div>
  );
}
