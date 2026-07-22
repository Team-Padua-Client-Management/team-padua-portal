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

import { generateBeneficiaryChangeRequestPdfFromTemplate } from '@/app/lib/pdf/generateBeneficiaryChangeRequestPdfFromTemplate';
import { bcrFormConfig } from '@/app/components/bcr-engine/bcrConfig';

const BcrPdfViewer = dynamic(
  () => import('@/app/components/bcr-engine/BcrPdfViewer'),
  { ssr: false }
);

const TABLE_NAME = 'beneficiary_change_requests';

export interface BcrRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  created_at?: string;

  // Section A - General Info
  planholder_type: 'individual' | 'company' | '';
  plan_numbers: string;
  planholder_last_name: string;
  planholder_first_name: string;
  planholder_mi: string;
  company_name: string;

  // Section B - Change Type
  change_type: 'add' | 'remove' | 'change' | '';

  // Section B.1 - Add Beneficiary
  beneficiary1_name: string;
  beneficiary1_sex: 'Male' | 'Female' | '';
  beneficiary1_birthdate: string;
  beneficiary1_country_birth: string;
  beneficiary1_citizenships: string;
  beneficiary1_relationship: 'Father' | 'Mother' | 'Employer' | 'Others' | '';
  beneficiary1_relationship_others: string;
  beneficiary1_type: 'Primary' | 'Contingent' | '';
  beneficiary1_designation: 'Revocable' | 'Irrevocable' | '';
  beneficiary1_phone: string;
  beneficiary1_address: string;

  beneficiary2_name: string;
  beneficiary2_sex: 'Male' | 'Female' | '';
  beneficiary2_birthdate: string;
  beneficiary2_country_birth: string;
  beneficiary2_citizenships: string;
  beneficiary2_relationship: 'Father' | 'Mother' | 'Employer' | 'Others' | '';
  beneficiary2_relationship_others: string;
  beneficiary2_type: 'Primary' | 'Contingent' | '';
  beneficiary2_designation: 'Revocable' | 'Irrevocable' | '';
  beneficiary2_phone: string;
  beneficiary2_address: string;

  // Section B.2 - Remove Beneficiary
  remove_beneficiary1_name: string;
  remove_beneficiary2_name: string;

  // Section B.3 - Change Information
  change_original_name: string;

  check_name: boolean;
  change_new_name: string;
  check_new_other_legal_names: boolean;
  change_new_other_legal_names: string;
  check_sex: boolean;
  change_sex: 'Male' | 'Female' | '';
  check_birthdate: boolean;
  change_birthdate: string;
  check_country_birth: boolean;
  change_country_birth: string;
  check_citizenships: boolean;
  change_citizenships: string;
  check_relationship: boolean;
  change_relationship: 'Father' | 'Mother' | 'Employer' | 'Others' | '';
  change_relationship_others: string;
  check_beneficiary_type: boolean;
  change_beneficiary_type: 'Primary' | 'Contingent' | '';
  check_designation: boolean;
  change_designation: 'Revocable' | 'Irrevocable' | '';
  check_phone: boolean;
  change_phone: string;
  check_address: boolean;
  change_address: string;

  // Section B.3 - Company variant
  check_company_name: boolean;
  change_company_name: string;
  check_company_relationship: boolean;
  change_company_relationship: 'Employer' | 'Others' | '';
  change_company_relationship_others: string;
  check_company_country_inc: boolean;
  change_company_country_inc: string;
  check_company_designation: boolean;
  change_company_company_designation: 'Revocable' | 'Irrevocable' | '';
  check_company_phone: boolean;
  change_company_phone: string;
  check_company_address: boolean;
  change_company_address: string;

  // Section C - Compliance
  compliance_type: 'resident' | 'citizen' | 'none' | '';
  compliance_resident_country: string;
  compliance_citizen_country: string;
  compliance_legally_reside_country: string;

  // Section D - Signatures & Info
  place_of_signing: string;
  date_of_signing: string;
  planholder_signature: string;
  planholder_printed_name: string;

  company_signatory1_signature: string;
  company_signatory1_name: string;
  company_signatory2_signature: string;
  company_signatory2_name_title: string;

  witness_signature: string;
  witness_name: string;

  irrevocable_ben1_signature: string;
  irrevocable_ben1_name: string;
  irrevocable_ben1_witness_signature: string;
  irrevocable_ben1_witness_name: string;
  irrevocable_ben1_place: string;
  irrevocable_ben1_date: string;

  irrevocable_ben2_signature: string;
  irrevocable_ben2_name: string;
  witness2_signature: string;
  witness2_name: string;
  irrevocable_ben2_place: string;
  irrevocable_ben2_date: string;

  wants_communication: boolean;

  // Company Use Only
  company_use_only_notes: string;
}

const defaultRecord: Omit<BcrRecord, 'id' | 'client_id' | 'created_at'> = {
  status: 'Pending',
  planholder_type: 'individual',
  plan_numbers: '',
  planholder_last_name: '',
  planholder_first_name: '',
  planholder_mi: '',
  company_name: '',
  change_type: '',
  beneficiary1_name: '',
  beneficiary1_sex: '',
  beneficiary1_birthdate: '',
  beneficiary1_country_birth: '',
  beneficiary1_citizenships: '',
  beneficiary1_relationship: '',
  beneficiary1_relationship_others: '',
  beneficiary1_type: '',
  beneficiary1_designation: '',
  beneficiary1_phone: '',
  beneficiary1_address: '',
  beneficiary2_name: '',
  beneficiary2_sex: '',
  beneficiary2_birthdate: '',
  beneficiary2_country_birth: '',
  beneficiary2_citizenships: '',
  beneficiary2_relationship: '',
  beneficiary2_relationship_others: '',
  beneficiary2_type: '',
  beneficiary2_designation: '',
  beneficiary2_phone: '',
  beneficiary2_address: '',
  remove_beneficiary1_name: '',
  remove_beneficiary2_name: '',
  change_original_name: '',
  check_name: false,
  change_new_name: '',
  check_new_other_legal_names: false,
  change_new_other_legal_names: '',
  check_sex: false,
  change_sex: '',
  check_birthdate: false,
  change_birthdate: '',
  check_country_birth: false,
  change_country_birth: '',
  check_citizenships: false,
  change_citizenships: '',
  check_relationship: false,
  change_relationship: '',
  change_relationship_others: '',
  check_beneficiary_type: false,
  change_beneficiary_type: '',
  check_designation: false,
  change_designation: '',
  check_phone: false,
  change_phone: '',
  check_address: false,
  change_address: '',
  check_company_name: false,
  change_company_name: '',
  check_company_relationship: false,
  change_company_relationship: '',
  change_company_relationship_others: '',
  check_company_country_inc: false,
  change_company_country_inc: '',
  check_company_designation: false,
  change_company_company_designation: '',
  check_company_phone: false,
  change_company_phone: '',
  check_company_address: false,
  change_company_address: '',
  compliance_type: '',
  compliance_resident_country: '',
  compliance_citizen_country: '',
  compliance_legally_reside_country: '',
  place_of_signing: '',
  date_of_signing: new Date().toISOString().split('T')[0],
  planholder_signature: '',
  planholder_printed_name: '',
  company_signatory1_signature: '',
  company_signatory1_name: '',
  company_signatory2_signature: '',
  company_signatory2_name_title: '',
  witness_signature: '',
  witness_name: '',
  irrevocable_ben1_signature: '',
  irrevocable_ben1_name: '',
  irrevocable_ben1_witness_signature: '',
  irrevocable_ben1_witness_name: '',
  irrevocable_ben1_place: '',
  irrevocable_ben1_date: '',
  irrevocable_ben2_signature: '',
  irrevocable_ben2_name: '',
  witness2_signature: '',
  witness2_name: '',
  irrevocable_ben2_place: '',
  irrevocable_ben2_date: '',
  wants_communication: false,
  company_use_only_notes: '',
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

export default function BeneficiaryChangeRequestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<BcrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BcrRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<Omit<BcrRecord, 'id' | 'created_at'>>({
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

  const getClientNameParts = (fullName: string | undefined | null) => {
    if (!fullName) return { last: '', first: '', mi: '' };
    if (fullName.includes(',')) {
      const [lastPart, restPart] = fullName.split(',').map(s => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      return { last: lastPart, first: restWords[0] || '', mi: restWords[1] ? restWords[1].charAt(0) : '' };
    } else {
      const words = fullName.trim().split(/\s+/);
      if (words.length === 1) return { last: '', first: words[0], mi: '' };
      return { last: words[words.length - 1], first: words[0], mi: words[1] ? words[1].charAt(0) : '' };
    }
  };

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

        const nameParts = getClientNameParts(data.client_name);

        setFormData(prev => ({
          ...prev,
          plan_numbers: prev.plan_numbers || data.policy_number || '',
          planholder_last_name: prev.planholder_last_name || nameParts.last,
          planholder_first_name: prev.planholder_first_name || nameParts.first,
          planholder_mi: prev.planholder_mi || nameParts.mi,
          planholder_printed_name: prev.planholder_printed_name || data.client_name,
        }));
      } catch (err: any) {
        console.error('Error fetching client details:', err);
      }
    };
    fetchClientDetails();
  }, [formData.client_id]);

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
        if (err.code === '42P01' || err.code === 'PGRST200') {
          setRecords([]);
          return;
        }
        throw err;
      }
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching records:', err);
      if (!err.message?.includes('does not exist')) {
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
      const { data, error: err } = await supabase
        .from('cpst_clients')
        .select('client_name, birthdate, policy_number')
        .eq('id', clientId)
        .single();
      if (!err && data) {
        setSelectedClientDetails(data);
        const nameParts = getClientNameParts(data.client_name);
        setFormData(prev => ({
          ...prev,
          plan_numbers: data.policy_number || prev.plan_numbers,
          planholder_last_name: nameParts.last || prev.planholder_last_name,
          planholder_first_name: nameParts.first || prev.planholder_first_name,
          planholder_mi: nameParts.mi || prev.planholder_mi,
          planholder_printed_name: data.client_name || prev.planholder_printed_name,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditor = (record?: BcrRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        ...record,
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

  const handleSaveDraftFromEngine = async (engineValues: Record<string, any>) => {
    if (!formData.client_id) {
      setError("Please select a client record before saving draft.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload: any = { ...formData, ...engineValues };
      if (!payload.date_of_signing) payload.date_of_signing = null;
      if (!payload.beneficiary1_birthdate) payload.beneficiary1_birthdate = null;
      if (!payload.beneficiary2_birthdate) payload.beneficiary2_birthdate = null;
      if (!payload.change_birthdate) payload.change_birthdate = null;
      if (!payload.irrevocable_ben1_date) payload.irrevocable_ben1_date = null;
      if (!payload.irrevocable_ben2_date) payload.irrevocable_ben2_date = null;

      if (editingRecord) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);

        if (updateError) throw updateError;
        setSuccess("Beneficiary Change Request draft saved successfully.");
      } else {
        const { data: newRecord, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newRecord) setEditingRecord(newRecord);
        setSuccess("New Beneficiary Change Request created.");
      }

      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save record draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdfFromEngine = async (engineValues: Record<string, any>) => {
    try {
      setIsGeneratingPdf(true);
      setError("");

      const fullRecord = { ...formData, ...engineValues } as BcrRecord;
      const pdfBytes = await generateBeneficiaryChangeRequestPdfFromTemplate(fullRecord);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      const planStr = fullRecord.plan_numbers ? `_${fullRecord.plan_numbers}` : '';
      a.download = `Beneficiary_Change_Request${planStr}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("Filled Beneficiary Change Request PDF exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error generating BCR PDF:', err);
      setError(err.message || 'Failed to export PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async (record: BcrRecord) => {
    try {
      setIsGeneratingPdf(true);
      setGeneratingPdfId(record.id);
      setError("");

      const pdfBytes = await generateBeneficiaryChangeRequestPdfFromTemplate(record);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      const planStr = record.plan_numbers ? `_${record.plan_numbers}` : '';
      a.download = `Beneficiary_Change_Request${planStr}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF.');
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

  const filteredRecords = records.filter(r =>
    (r.client?.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.plan_numbers || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER SIMPLE PDF CANVAS EDITOR WHEN EDITOR IS OPEN
  // ══════════════════════════════════════════════════════════════════════════
  if (isEditorOpen) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
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

        <BcrPdfViewer
          config={bcrFormConfig}
          initialValues={formData}
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
  // MAIN BCR DASHBOARD & CRUD TABLE
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.text_52}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`${styles.div_54} bg-gray-50/60 min-h-screen`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Beneficiary Change Request</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and generate official BCR PDF forms.</p>
            </div>
            <PrimaryButton onClick={() => handleOpenEditor()} className="pl-4 pr-5">
              <Plus size={16} />
              New BCR Form Editor
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
                    <th className="px-6 py-3.5 font-medium">Plan Number</th>
                    <th className="px-6 py-3.5 font-medium">Change Type</th>
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
                          {record.plan_numbers || record.client?.policy_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 capitalize">
                          {record.change_type ? record.change_type + ' Beneficiary' : '-'}
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
                            <IconButton onClick={() => handleOpenEditor(record)} title="Open in BCR Canvas Editor">
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
