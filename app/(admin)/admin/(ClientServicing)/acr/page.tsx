'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Download, AlertCircle, Loader2, Save, CheckCircle2, FileText, Inbox, ArrowLeft
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";
import dynamic from 'next/dynamic';
import { generateAdvisorChangeRequestPdfFromTemplate } from '@/app/lib/pdf/generateAdvisorChangeRequestPdfFromTemplate';
import { acrFormConfig } from './acrConfig';

const PdfViewerEngine = dynamic(
  () => import('@/app/components/pdf-engine/PdfViewerEngine'),
  { ssr: false }
);

const TABLE_NAME = 'advisor_change_requests';

export interface FormRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  created_at?: string;
  company_name: string;
  designation: string;
  request_type: 'specific_policy' | 'all_accounts' | '';
  policy_numbers: string;
  account_individual_life: boolean;
  account_group_life: boolean;
  account_mutual_fund: boolean;
  account_pre_need: boolean;
  reference_policy_number: string;
  reason_type: 'no_advisor' | 'prefer_another' | '';
  reason_details: string;
  new_advisor_last_name: string;
  new_advisor_first_name: string;
  new_advisor_middle_name: string;
  place_of_signing: string;
  date_of_signing: string;
  policy_owner_signature: string;
  new_advisor_signature: string;
  code_number: string;
  nbo_iso: string;
  wants_communication: boolean;
  received_by_staff: string;
  receiving_department: string;
  date_received: string;
  time_received: string;
}

export type AcrRecord = FormRecord;

const defaultRecord: Omit<FormRecord, 'id' | 'client_id' | 'created_at'> = {
  status: 'Pending',
  company_name: 'Sun Life of Canada (Philippines), Inc.',
  designation: '',
  request_type: '',
  policy_numbers: '',
  account_individual_life: false,
  account_group_life: false,
  account_mutual_fund: false,
  account_pre_need: false,
  reference_policy_number: '',
  reason_type: '',
  reason_details: '',
  new_advisor_last_name: '',
  new_advisor_first_name: '',
  new_advisor_middle_name: '',
  place_of_signing: '',
  date_of_signing: new Date().toISOString().split('T')[0],
  policy_owner_signature: '',
  new_advisor_signature: '',
  code_number: '',
  nbo_iso: '',
  wants_communication: false,
  received_by_staff: '',
  receiving_department: '',
  date_received: '',
  time_received: '',
};

function PrimaryButton({
  children, onClick, type = 'button', disabled, loading, className = '',
}: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; loading?: boolean; className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 active:scale-[0.97] font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm ${className}`}
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

export default function AdvisorChangeRequestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FormRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<Omit<FormRecord, 'id' | 'created_at'>>({
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

  const handleClientSelect = async (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
    try {
      const { data, error } = await supabase
        .from('cpst_clients')
        .select('client_name, birthdate, policy_number')
        .eq('id', clientId)
        .single();
      if (!error && data) {
        setSelectedClientDetails(data);
        setFormData(prev => ({
          ...prev,
          policy_numbers: data.policy_number || prev.policy_numbers,
          reference_policy_number: data.policy_number || prev.reference_policy_number
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditor = (record?: FormRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        client_id: record.client_id || '',
        company_name: record.company_name || 'Sun Life of Canada (Philippines), Inc.',
        designation: record.designation || '',
        request_type: record.request_type || '',
        policy_numbers: record.policy_numbers || '',
        account_individual_life: !!record.account_individual_life,
        account_group_life: !!record.account_group_life,
        account_mutual_fund: !!record.account_mutual_fund,
        account_pre_need: !!record.account_pre_need,
        reference_policy_number: record.reference_policy_number || '',
        reason_type: record.reason_type || '',
        reason_details: record.reason_details || '',
        new_advisor_last_name: record.new_advisor_last_name || '',
        new_advisor_first_name: record.new_advisor_first_name || '',
        new_advisor_middle_name: record.new_advisor_middle_name || '',
        place_of_signing: record.place_of_signing || '',
        date_of_signing: record.date_of_signing || new Date().toISOString().split('T')[0],
        policy_owner_signature: record.policy_owner_signature || '',
        new_advisor_signature: record.new_advisor_signature || '',
        code_number: record.code_number || '',
        nbo_iso: record.nbo_iso || '',
        wants_communication: !!record.wants_communication,
        received_by_staff: record.received_by_staff || '',
        receiving_department: record.receiving_department || '',
        date_received: record.date_received || '',
        time_received: record.time_received || '',
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
    setIsEditorOpen(true);
  };

  const mapEngineValuesToFormRecord = (engineValues: Record<string, any>): Omit<FormRecord, 'id' | 'created_at'> => {
    return {
      client_id: formData.client_id,
      company_name: engineValues.company_name || 'Sun Life of Canada (Philippines), Inc.',
      designation: engineValues.designation || '',
      request_type: engineValues.request_type || '',
      policy_numbers: engineValues.policy_numbers || '',
      account_individual_life: !!engineValues.account_individual_life,
      account_group_life: !!engineValues.account_group_life,
      account_mutual_fund: !!engineValues.account_mutual_fund,
      account_pre_need: !!engineValues.account_pre_need,
      reference_policy_number: engineValues.reference_policy_number || '',
      reason_type: engineValues.reason_type || '',
      reason_details: engineValues.reason_details || '',
      new_advisor_last_name: engineValues.new_advisor_last_name || '',
      new_advisor_first_name: engineValues.new_advisor_first_name || '',
      new_advisor_middle_name: engineValues.new_advisor_middle_name || '',
      place_of_signing: engineValues.place_of_signing || '',
      date_of_signing: engineValues.date_of_signing || new Date().toISOString().split('T')[0],
      policy_owner_signature: engineValues.policy_owner_signature || '',
      new_advisor_signature: engineValues.new_advisor_signature || '',
      code_number: engineValues.code_number || '',
      nbo_iso: engineValues.nbo_iso || '',
      wants_communication: !!engineValues.wants_communication,
      received_by_staff: engineValues.received_by_staff || '',
      receiving_department: engineValues.receiving_department || '',
      date_received: engineValues.date_received || '',
      time_received: engineValues.time_received || '',
      status: engineValues.status || 'Pending',
    };
  };

  const handleSaveDraftFromEngine = async (engineValues: Record<string, any>) => {
    if (!formData.client_id) {
      setError("Please select a client record in the left panel before saving.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload: any = mapEngineValuesToFormRecord(engineValues);
      if (!payload.date_received) payload.date_received = null;
      if (!payload.date_of_signing) payload.date_of_signing = null;

      if (editingRecord) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);

        if (updateError) throw updateError;
        setSuccess("Advisor Change Request saved successfully.");
      } else {
        const { data: newRecord, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newRecord) setEditingRecord(newRecord);
        setSuccess("New Advisor Change Request created.");
      }

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

  const handleExportPdfFromEngine = async (engineValues: Record<string, any>) => {
    try {
      setIsGeneratingPdf(true);
      setError("");

      const formRec = mapEngineValuesToFormRecord(engineValues) as FormRecord;
      const ownerName = getClientNameParts(selectedClientDetails?.client_name);
      const ownerDob = selectedClientDetails?.birthdate || '';

      const pdfBytes = await generateAdvisorChangeRequestPdfFromTemplate(formRec, ownerName, ownerDob);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      a.download = `Advisor_Change_Request_${selectedClientDetails?.client_name || 'Record'}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("Filled Sun Life PDF exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error generating PDF from engine:', err);
      setError(err.message || 'Failed to export PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async (record: FormRecord) => {
    try {
      setIsGeneratingPdf(true);
      setGeneratingPdfId(record.id);
      setError("");

      const ownerName = getClientNameParts(record.client?.client_name);
      const ownerDob = record.client?.birthdate || '';
      const pdfBytes = await generateAdvisorChangeRequestPdfFromTemplate(record, ownerName, ownerDob);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      a.download = `Advisor_Change_Request_${record.client?.client_name || 'Record'}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF. Please check that template exists.');
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
  const clientDob = selectedClientDetails?.birthdate || '';

  // Construct initial engine values map
  const engineInitialValues = {
    client_last_name: clientNameParts.last,
    client_first_name: clientNameParts.first,
    client_middle_name: clientNameParts.middle,
    client_dob: clientDob,
    client_full_name_pg2: selectedClientDetails?.client_name
      ? `${clientNameParts.last}, ${clientNameParts.first} ${clientNameParts.middle}`.trim()
      : '',
    company_name: formData.company_name,
    designation: formData.designation,
    request_type: formData.request_type,
    policy_numbers: formData.policy_numbers,
    account_individual_life: formData.account_individual_life,
    account_group_life: formData.account_group_life,
    account_mutual_fund: formData.account_mutual_fund,
    account_pre_need: formData.account_pre_need,
    reference_policy_number: formData.reference_policy_number,
    reason_type: formData.reason_type,
    reason_details: formData.reason_details,
    new_advisor_last_name: formData.new_advisor_last_name,
    new_advisor_first_name: formData.new_advisor_first_name,
    new_advisor_middle_name: formData.new_advisor_middle_name,
    place_of_signing: formData.place_of_signing,
    date_of_signing: formData.date_of_signing,
    policy_owner_signature: formData.policy_owner_signature,
    new_advisor_signature: formData.new_advisor_signature,
    code_number: formData.code_number,
    nbo_iso: formData.nbo_iso,
    wants_communication: formData.wants_communication,
    received_by_staff: formData.received_by_staff,
    receiving_department: formData.receiving_department,
    date_received: formData.date_received,
    time_received: formData.time_received,
    status: formData.status,
  };

  const filteredRecords = records.filter(r =>
    (r.client?.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.request_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER FULL-SCREEN PDF FORM EDITOR WHEN EDITOR IS OPEN
  // ══════════════════════════════════════════════════════════════════════════
  if (isEditorOpen) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
        {/* Floating Top Back Button */}
        <button
          onClick={() => {
            setIsEditorOpen(false);
            fetchRecords();
          }}
          className="fixed top-3 left-4 z-[100] px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all"
        >
          <ArrowLeft size={14} />
          Back to ACR List
        </button>

        {error && (
          <div className="fixed top-16 right-6 z-[200] max-w-sm animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-white border border-red-100 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-500" size={16} />
              </div>
              <p className="text-red-700 text-xs flex-1 font-medium">{error}</p>
              <button onClick={() => setError("")} className="text-gray-300 hover:text-gray-500">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-16 right-6 z-[200] max-w-sm animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-emerald-500" size={16} />
              </div>
              <p className="text-emerald-700 text-xs flex-1 font-semibold">{success}</p>
            </div>
          </div>
        )}

        <PdfViewerEngine
          config={acrFormConfig}
          initialValues={engineInitialValues}
          clientId={formData.client_id}
          selectedClientDetails={selectedClientDetails}
          status={formData.status}
          onBack={() => {
            setIsEditorOpen(false);
            fetchRecords();
          }}
          onClientSelect={handleClientSelect}
          onSaveDraft={handleSaveDraftFromEngine}
          onExportPdf={handleExportPdfFromEngine}
          isSubmitting={isSubmitting}
          isGeneratingPdf={isGeneratingPdf}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN ACR DASHBOARD & CRUD TABLE
  // ══════════════════════════════════════════════════════════════════════════
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Advisor Change Request</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and generate Sun Life advisor change request forms using interactive PDF Editor.</p>
            </div>
            <PrimaryButton onClick={() => handleOpenEditor()} className="pl-4 pr-5">
              <Plus size={16} />
              New Interactive Request
            </PrimaryButton>
          </div>

          {error && (
            <div className="fixed top-6 right-6 z-[100] max-w-sm animate-[slideInRight_0.2s_ease-out]">
              <div className="bg-white border border-red-100 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="text-red-500" size={16} />
                </div>
                <p className="text-red-700 text-sm flex-1">{error}</p>
                <button onClick={() => setError("")} className="text-gray-300 hover:text-gray-500">
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
                    <th className="px-6 py-3.5 font-medium">Type</th>
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
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                              {(record.client?.client_name || '?').charAt(0).toUpperCase()}
                            </div>
                            {record.client?.client_name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.request_type === 'specific_policy' ? 'Specific Policy' : record.request_type === 'all_accounts' ? 'All Accounts' : '-'}
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
                              title="Download Exported PDF"
                              tone="blue"
                            >
                              {isGeneratingPdf && generatingPdfId === record.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            </IconButton>
                            <IconButton onClick={() => handleOpenEditor(record)} title="Open in PDF Form Editor">
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Delete Request?</h3>
            <p className="text-xs text-gray-500">This action cannot be undone. Are you sure you want to delete this record?</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}