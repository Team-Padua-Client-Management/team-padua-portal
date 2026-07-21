'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Download, AlertCircle, Loader2, Save, CheckCircle2, FileText, Inbox
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";
import SignaturePad from '@/app/components/ui/SignaturePad';
import ClientSelector from '@/app/components/shared/ClientSelector';

import { generateBeneficiaryChangeRequestPdfFromTemplate } from '@/app/lib/pdf/generateBeneficiaryChangeRequestPdfFromTemplate';

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

  compliance_type: 'none',
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
  irrevocable_ben1_date: new Date().toISOString().split('T')[0],

  irrevocable_ben2_signature: '',
  irrevocable_ben2_name: '',
  witness2_signature: '',
  witness2_name: '',
  irrevocable_ben2_place: '',
  irrevocable_ben2_date: new Date().toISOString().split('T')[0],

  wants_communication: true,

  company_use_only_notes: '',
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

export default function BeneficiaryChangeRequestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<BcrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
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

        if (!formData.plan_numbers && data.policy_number) {
          setFormData(prev => ({ ...prev, plan_numbers: data.policy_number || '' }));
        }
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
        if (err.code === '42P01') {
          setRecords([]);
          return;
        }
        throw err;
      }
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching records:', err);
      setError(err.message || 'Failed to fetch records');
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

  const handleOpenModal = (record?: BcrRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({ ...record, status: record.status || 'Pending' });
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

      const payload: any = { ...formData };
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
        setSuccess("Record updated successfully");
      } else {
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
      console.error(err);
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
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
      a.download = `BeneficiaryChange${planStr}_${formattedDate}.pdf`;
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Beneficiary Change Request</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and generate official BCR PDF forms.</p>
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
                {editingRecord ? 'Edit Beneficiary Change Request' : 'New Beneficiary Change Request'}
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
            <form id="bcrForm" onSubmit={handleSubmit} className="space-y-6">
              <div className={cardClass}>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Select Client</h3>
                <ClientSelector
                  onChange={handleClientSelect}
                  value={formData.client_id}
                />
              </div>

              {formData.client_id && (
                <>
                  <div className={cardClass}>
                    <SectionHeader letter="A" title="General Information" />
                    <div className="space-y-4">
                      <div className="flex gap-6 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={formData.planholder_type === 'individual'} onChange={() => setFormData({ ...formData, planholder_type: 'individual' })} className="accent-gray-900" />
                          <span className="text-sm">Individual Planholder</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={formData.planholder_type === 'company'} onChange={() => setFormData({ ...formData, planholder_type: 'company' })} className="accent-gray-900" />
                          <span className="text-sm">Company/Business</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Plan Number(s)</label>
                          <input type="text" value={formData.plan_numbers} onChange={e => setFormData({ ...formData, plan_numbers: e.target.value })} className={inputClass} />
                        </div>
                      </div>

                      {formData.planholder_type === 'individual' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className={labelClass}>Last Name</label>
                            <input type="text" value={formData.planholder_last_name} onChange={e => setFormData({ ...formData, planholder_last_name: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>First Name</label>
                            <input type="text" value={formData.planholder_first_name} onChange={e => setFormData({ ...formData, planholder_first_name: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>M.I.</label>
                            <input type="text" value={formData.planholder_mi} onChange={e => setFormData({ ...formData, planholder_mi: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className={labelClass}>Company/Business Name</label>
                          <input type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className={inputClass} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="B" title="Beneficiary Change Details" />
                    <div className="flex gap-6 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formData.change_type === 'add'} onChange={() => setFormData({ ...formData, change_type: 'add' })} className="accent-gray-900" />
                        <span className="text-sm font-medium">Add Beneficiary(ies)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formData.change_type === 'remove'} onChange={() => setFormData({ ...formData, change_type: 'remove' })} className="accent-gray-900" />
                        <span className="text-sm font-medium">Remove Beneficiary(ies)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formData.change_type === 'change'} onChange={() => setFormData({ ...formData, change_type: 'change' })} className="accent-gray-900" />
                        <span className="text-sm font-medium">Change of Information</span>
                      </label>
                    </div>

                    {formData.change_type === 'add' && (
                      <div className="space-y-6">
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-4">Beneficiary 1</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div><label className={labelClass}>Name</label><input type="text" value={formData.beneficiary1_name} onChange={e => setFormData({ ...formData, beneficiary1_name: e.target.value })} className={inputClass} /></div>
                            <div>
                              <label className={labelClass}>Sex (at birth)</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.beneficiary1_sex === 'Male'} onChange={() => setFormData({ ...formData, beneficiary1_sex: 'Male' })} /> <span className="text-sm">Male</span></label>
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.beneficiary1_sex === 'Female'} onChange={() => setFormData({ ...formData, beneficiary1_sex: 'Female' })} /> <span className="text-sm">Female</span></label>
                              </div>
                            </div>
                            <div><label className={labelClass}>Birthdate</label><input type="date" value={formData.beneficiary1_birthdate} onChange={e => setFormData({ ...formData, beneficiary1_birthdate: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Country of Birth</label><input type="text" value={formData.beneficiary1_country_birth} onChange={e => setFormData({ ...formData, beneficiary1_country_birth: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Citizenships</label><input type="text" value={formData.beneficiary1_citizenships} onChange={e => setFormData({ ...formData, beneficiary1_citizenships: e.target.value })} className={inputClass} /></div>

                            <div>
                              <label className={labelClass}>Relationship</label>
                              <div className="flex flex-wrap gap-3">
                                {['Father', 'Mother', 'Employer', 'Others'].map(rel => (
                                  <label key={rel} className="flex items-center gap-2"><input type="radio" checked={formData.beneficiary1_relationship === rel} onChange={() => setFormData({ ...formData, beneficiary1_relationship: rel as any })} /> <span className="text-sm">{rel}</span></label>
                                ))}
                              </div>
                              {formData.beneficiary1_relationship === 'Others' && <input type="text" placeholder="Specify" value={formData.beneficiary1_relationship_others} onChange={e => setFormData({ ...formData, beneficiary1_relationship_others: e.target.value })} className={`mt-2 ${inputClass}`} />}
                            </div>

                            <div>
                              <label className={labelClass}>Beneficiary Type & Designation</label>
                              <div className="flex gap-4">
                                <select value={formData.beneficiary1_type} onChange={e => setFormData({ ...formData, beneficiary1_type: e.target.value as any })} className={inputClass}>
                                  <option value="">Type...</option><option value="Primary">Primary</option><option value="Contingent">Contingent</option>
                                </select>
                                <select value={formData.beneficiary1_designation} onChange={e => setFormData({ ...formData, beneficiary1_designation: e.target.value as any })} className={inputClass}>
                                  <option value="">Designation...</option><option value="Revocable">Revocable</option><option value="Irrevocable">Irrevocable</option>
                                </select>
                              </div>
                            </div>
                            <div><label className={labelClass}>Phone</label><input type="text" value={formData.beneficiary1_phone} onChange={e => setFormData({ ...formData, beneficiary1_phone: e.target.value })} className={inputClass} /></div>
                            <div className="col-span-full"><label className={labelClass}>Address</label><input type="text" value={formData.beneficiary1_address} onChange={e => setFormData({ ...formData, beneficiary1_address: e.target.value })} className={inputClass} /></div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-4">Beneficiary 2 (Optional)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClass}>Name</label><input type="text" value={formData.beneficiary2_name} onChange={e => setFormData({ ...formData, beneficiary2_name: e.target.value })} className={inputClass} /></div>
                            <div>
                              <label className={labelClass}>Sex (at birth)</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.beneficiary2_sex === 'Male'} onChange={() => setFormData({ ...formData, beneficiary2_sex: 'Male' })} /> <span className="text-sm">Male</span></label>
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.beneficiary2_sex === 'Female'} onChange={() => setFormData({ ...formData, beneficiary2_sex: 'Female' })} /> <span className="text-sm">Female</span></label>
                              </div>
                            </div>
                            <div><label className={labelClass}>Birthdate</label><input type="date" value={formData.beneficiary2_birthdate} onChange={e => setFormData({ ...formData, beneficiary2_birthdate: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Country of Birth</label><input type="text" value={formData.beneficiary2_country_birth} onChange={e => setFormData({ ...formData, beneficiary2_country_birth: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Citizenships</label><input type="text" value={formData.beneficiary2_citizenships} onChange={e => setFormData({ ...formData, beneficiary2_citizenships: e.target.value })} className={inputClass} /></div>

                            <div>
                              <label className={labelClass}>Relationship</label>
                              <div className="flex flex-wrap gap-3">
                                {['Father', 'Mother', 'Employer', 'Others'].map(rel => (
                                  <label key={rel} className="flex items-center gap-2"><input type="radio" checked={formData.beneficiary2_relationship === rel} onChange={() => setFormData({ ...formData, beneficiary2_relationship: rel as any })} /> <span className="text-sm">{rel}</span></label>
                                ))}
                              </div>
                              {formData.beneficiary2_relationship === 'Others' && <input type="text" placeholder="Specify" value={formData.beneficiary2_relationship_others} onChange={e => setFormData({ ...formData, beneficiary2_relationship_others: e.target.value })} className={`mt-2 ${inputClass}`} />}
                            </div>

                            <div>
                              <label className={labelClass}>Beneficiary Type & Designation</label>
                              <div className="flex gap-4">
                                <select value={formData.beneficiary2_type} onChange={e => setFormData({ ...formData, beneficiary2_type: e.target.value as any })} className={inputClass}>
                                  <option value="">Type...</option><option value="Primary">Primary</option><option value="Contingent">Contingent</option>
                                </select>
                                <select value={formData.beneficiary2_designation} onChange={e => setFormData({ ...formData, beneficiary2_designation: e.target.value as any })} className={inputClass}>
                                  <option value="">Designation...</option><option value="Revocable">Revocable</option><option value="Irrevocable">Irrevocable</option>
                                </select>
                              </div>
                            </div>
                            <div><label className={labelClass}>Phone</label><input type="text" value={formData.beneficiary2_phone} onChange={e => setFormData({ ...formData, beneficiary2_phone: e.target.value })} className={inputClass} /></div>
                            <div className="col-span-full"><label className={labelClass}>Address</label><input type="text" value={formData.beneficiary2_address} onChange={e => setFormData({ ...formData, beneficiary2_address: e.target.value })} className={inputClass} /></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.change_type === 'remove' && (
                      <div className="space-y-4">
                        <div><label className={labelClass}>Name of Beneficiary 1 to Remove</label><input type="text" value={formData.remove_beneficiary1_name} onChange={e => setFormData({ ...formData, remove_beneficiary1_name: e.target.value })} className={inputClass} /></div>
                        <div><label className={labelClass}>Name of Beneficiary 2 to Remove (Optional)</label><input type="text" value={formData.remove_beneficiary2_name} onChange={e => setFormData({ ...formData, remove_beneficiary2_name: e.target.value })} className={inputClass} /></div>
                      </div>
                    )}

                    {formData.change_type === 'change' && (
                      <div className="space-y-4">
                        <div><label className={labelClass}>Original Beneficiary Name</label><input type="text" value={formData.change_original_name} onChange={e => setFormData({ ...formData, change_original_name: e.target.value })} className={inputClass} /></div>
                        <p className="text-sm text-gray-500 my-2">Check the fields you want to update and provide the new values:</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_name} onChange={e => setFormData({ ...formData, check_name: e.target.checked })} /> <input type="text" placeholder="New Name" value={formData.change_new_name} onChange={e => setFormData({ ...formData, change_new_name: e.target.value })} disabled={!formData.check_name} className={formData.check_name ? inputClass : inputDisabledClass} /></div>

                          <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_new_other_legal_names} onChange={e => setFormData({ ...formData, check_new_other_legal_names: e.target.checked })} /> <input type="text" placeholder="New Other Legal Names" value={formData.change_new_other_legal_names} onChange={e => setFormData({ ...formData, change_new_other_legal_names: e.target.value })} disabled={!formData.check_new_other_legal_names} className={formData.check_new_other_legal_names ? inputClass : inputDisabledClass} /></div>

                          <div className="flex gap-2 items-center">
                            <input type="checkbox" checked={formData.check_sex} onChange={e => setFormData({ ...formData, check_sex: e.target.checked })} />
                            <div className={`flex items-center gap-4 px-4 py-2 border rounded-2xl flex-1 ${formData.check_sex ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              <span className="text-sm text-gray-500 min-w-[40px]">Sex:</span>
                              <label className="flex items-center gap-2"><input type="radio" checked={formData.change_sex === 'Male'} onChange={() => setFormData({ ...formData, change_sex: 'Male' })} disabled={!formData.check_sex} /> <span className="text-sm">Male</span></label>
                              <label className="flex items-center gap-2"><input type="radio" checked={formData.change_sex === 'Female'} onChange={() => setFormData({ ...formData, change_sex: 'Female' })} disabled={!formData.check_sex} /> <span className="text-sm">Female</span></label>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_birthdate} onChange={e => setFormData({ ...formData, check_birthdate: e.target.checked })} /> <input type="date" value={formData.change_birthdate} onChange={e => setFormData({ ...formData, change_birthdate: e.target.value })} disabled={!formData.check_birthdate} className={formData.check_birthdate ? inputClass : inputDisabledClass} /></div>

                          <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_country_birth} onChange={e => setFormData({ ...formData, check_country_birth: e.target.checked })} /> <input type="text" placeholder="Country of Birth" value={formData.change_country_birth} onChange={e => setFormData({ ...formData, change_country_birth: e.target.value })} disabled={!formData.check_country_birth} className={formData.check_country_birth ? inputClass : inputDisabledClass} /></div>

                          <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_citizenships} onChange={e => setFormData({ ...formData, check_citizenships: e.target.checked })} /> <input type="text" placeholder="Citizenships" value={formData.change_citizenships} onChange={e => setFormData({ ...formData, change_citizenships: e.target.value })} disabled={!formData.check_citizenships} className={formData.check_citizenships ? inputClass : inputDisabledClass} /></div>

                          <div className="flex gap-2 items-start col-span-full">
                            <input type="checkbox" className="mt-3" checked={formData.check_relationship} onChange={e => setFormData({ ...formData, check_relationship: e.target.checked })} />
                            <div className={`flex flex-col gap-2 p-3 border rounded-2xl flex-1 ${formData.check_relationship ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              <span className="text-sm text-gray-500">Relationship:</span>
                              <div className="flex flex-wrap gap-4">
                                {['Father', 'Mother', 'Employer', 'Others'].map(rel => (
                                  <label key={rel} className="flex items-center gap-2"><input type="radio" checked={formData.change_relationship === rel} onChange={() => setFormData({ ...formData, change_relationship: rel as any })} disabled={!formData.check_relationship} /> <span className="text-sm">{rel}</span></label>
                                ))}
                              </div>
                              {formData.check_relationship && formData.change_relationship === 'Others' && (
                                <input type="text" placeholder="Specify Others" value={formData.change_relationship_others} onChange={e => setFormData({ ...formData, change_relationship_others: e.target.value })} className={inputClass} />
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            <input type="checkbox" checked={formData.check_beneficiary_type} onChange={e => setFormData({ ...formData, check_beneficiary_type: e.target.checked })} />
                            <div className={`flex items-center gap-4 px-4 py-2 border rounded-2xl flex-1 ${formData.check_beneficiary_type ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              <span className="text-sm text-gray-500 min-w-[40px]">Type:</span>
                              <label className="flex items-center gap-2"><input type="radio" checked={formData.change_beneficiary_type === 'Primary'} onChange={() => setFormData({ ...formData, change_beneficiary_type: 'Primary' })} disabled={!formData.check_beneficiary_type} /> <span className="text-sm">Primary</span></label>
                              <label className="flex items-center gap-2"><input type="radio" checked={formData.change_beneficiary_type === 'Contingent'} onChange={() => setFormData({ ...formData, change_beneficiary_type: 'Contingent' })} disabled={!formData.check_beneficiary_type} /> <span className="text-sm">Contingent</span></label>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            <input type="checkbox" checked={formData.check_designation} onChange={e => setFormData({ ...formData, check_designation: e.target.checked })} />
                            <div className={`flex items-center gap-4 px-4 py-2 border rounded-2xl flex-1 ${formData.check_designation ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              <span className="text-sm text-gray-500 min-w-[50px]">Designation:</span>
                              <label className="flex items-center gap-2"><input type="radio" checked={formData.change_designation === 'Revocable'} onChange={() => setFormData({ ...formData, change_designation: 'Revocable' })} disabled={!formData.check_designation} /> <span className="text-sm">Revocable</span></label>
                              <label className="flex items-center gap-2"><input type="radio" checked={formData.change_designation === 'Irrevocable'} onChange={() => setFormData({ ...formData, change_designation: 'Irrevocable' })} disabled={!formData.check_designation} /> <span className="text-sm">Irrevocable</span></label>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_phone} onChange={e => setFormData({ ...formData, check_phone: e.target.checked })} /> <input type="text" placeholder="New Phone" value={formData.change_phone} onChange={e => setFormData({ ...formData, change_phone: e.target.value })} disabled={!formData.check_phone} className={formData.check_phone ? inputClass : inputDisabledClass} /></div>
                          <div className="flex gap-2 items-center col-span-full"><input type="checkbox" checked={formData.check_address} onChange={e => setFormData({ ...formData, check_address: e.target.checked })} /> <input type="text" placeholder="New Address" value={formData.change_address} onChange={e => setFormData({ ...formData, change_address: e.target.value })} disabled={!formData.check_address} className={formData.check_address ? inputClass : inputDisabledClass} /></div>
                        </div>

                        {formData.planholder_type === 'company' && (
                          <div className="mt-8">
                            <h4 className="font-semibold text-gray-900 mb-4 border-t border-gray-100 pt-4">For Company/Business Planholder</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex gap-2 items-center col-span-full"><input type="checkbox" checked={formData.check_company_name} onChange={e => setFormData({ ...formData, check_company_name: e.target.checked })} /> <input type="text" placeholder="Company/Business Name" value={formData.change_company_name} onChange={e => setFormData({ ...formData, change_company_name: e.target.value })} disabled={!formData.check_company_name} className={formData.check_company_name ? inputClass : inputDisabledClass} /></div>

                              <div className="flex gap-2 items-start col-span-full">
                                <input type="checkbox" className="mt-3" checked={formData.check_company_relationship} onChange={e => setFormData({ ...formData, check_company_relationship: e.target.checked })} />
                                <div className={`flex flex-col gap-2 p-3 border rounded-2xl flex-1 ${formData.check_company_relationship ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                  <span className="text-sm text-gray-500">Relationship to Life Insured:</span>
                                  <div className="flex flex-wrap gap-4">
                                    {['Employer', 'Others'].map(rel => (
                                      <label key={rel} className="flex items-center gap-2"><input type="radio" checked={formData.change_company_relationship === rel} onChange={() => setFormData({ ...formData, change_company_relationship: rel as any })} disabled={!formData.check_company_relationship} /> <span className="text-sm">{rel}</span></label>
                                    ))}
                                  </div>
                                  {formData.check_company_relationship && formData.change_company_relationship === 'Others' && (
                                    <input type="text" placeholder="Specify Others" value={formData.change_company_relationship_others} onChange={e => setFormData({ ...formData, change_company_relationship_others: e.target.value })} className={inputClass} />
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_company_country_inc} onChange={e => setFormData({ ...formData, check_company_country_inc: e.target.checked })} /> <input type="text" placeholder="Country of Incorporation" value={formData.change_company_country_inc} onChange={e => setFormData({ ...formData, change_company_country_inc: e.target.value })} disabled={!formData.check_company_country_inc} className={formData.check_company_country_inc ? inputClass : inputDisabledClass} /></div>

                              <div className="flex gap-2 items-center">
                                <input type="checkbox" checked={formData.check_company_designation} onChange={e => setFormData({ ...formData, check_company_designation: e.target.checked })} />
                                <div className={`flex items-center gap-4 px-4 py-2 border rounded-2xl flex-1 ${formData.check_company_designation ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                  <span className="text-sm text-gray-500 min-w-[50px]">Designation:</span>
                                  <label className="flex items-center gap-2"><input type="radio" checked={formData.change_company_company_designation === 'Revocable'} onChange={() => setFormData({ ...formData, change_company_company_designation: 'Revocable' })} disabled={!formData.check_company_designation} /> <span className="text-sm">Revocable</span></label>
                                  <label className="flex items-center gap-2"><input type="radio" checked={formData.change_company_company_designation === 'Irrevocable'} onChange={() => setFormData({ ...formData, change_company_company_designation: 'Irrevocable' })} disabled={!formData.check_company_designation} /> <span className="text-sm">Irrevocable</span></label>
                                </div>
                              </div>

                              <div className="flex gap-2 items-center"><input type="checkbox" checked={formData.check_company_phone} onChange={e => setFormData({ ...formData, check_company_phone: e.target.checked })} /> <input type="text" placeholder="Business Phone" value={formData.change_company_phone} onChange={e => setFormData({ ...formData, change_company_phone: e.target.value })} disabled={!formData.check_company_phone} className={formData.check_company_phone ? inputClass : inputDisabledClass} /></div>
                              <div className="flex gap-2 items-center col-span-full"><input type="checkbox" checked={formData.check_company_address} onChange={e => setFormData({ ...formData, check_company_address: e.target.checked })} /> <input type="text" placeholder="Business Address" value={formData.change_company_address} onChange={e => setFormData({ ...formData, change_company_address: e.target.value })} disabled={!formData.check_company_address} className={formData.check_company_address ? inputClass : inputDisabledClass} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="C" title="Compliance" />
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input type="radio" checked={formData.compliance_type === 'resident'} onChange={() => setFormData({ ...formData, compliance_type: 'resident' })} />
                        <span className="text-sm">I am a citizen/national and legal resident of</span>
                        <input type="text" value={formData.compliance_resident_country} onChange={e => setFormData({ ...formData, compliance_resident_country: e.target.value })} disabled={formData.compliance_type !== 'resident'} className={`w-40 px-3 py-1 text-sm border rounded-lg ${formData.compliance_type === 'resident' ? 'bg-white' : 'bg-gray-100'}`} />
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="radio" checked={formData.compliance_type === 'citizen'} onChange={() => setFormData({ ...formData, compliance_type: 'citizen' })} />
                        <span className="text-sm">I am a citizen/national of</span>
                        <input type="text" value={formData.compliance_citizen_country} onChange={e => setFormData({ ...formData, compliance_citizen_country: e.target.value })} disabled={formData.compliance_type !== 'citizen'} className={`w-32 px-3 py-1 text-sm border rounded-lg ${formData.compliance_type === 'citizen' ? 'bg-white' : 'bg-gray-100'}`} />
                        <span className="text-sm">but I legally reside in</span>
                        <input type="text" value={formData.compliance_legally_reside_country} onChange={e => setFormData({ ...formData, compliance_legally_reside_country: e.target.value })} disabled={formData.compliance_type !== 'citizen'} className={`w-32 px-3 py-1 text-sm border rounded-lg ${formData.compliance_type === 'citizen' ? 'bg-white' : 'bg-gray-100'}`} />
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="radio" checked={formData.compliance_type === 'none'} onChange={() => setFormData({ ...formData, compliance_type: 'none' })} />
                        <span className="text-sm">None</span>
                      </label>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="D" title="Signatures" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div><label className={labelClass}>Place of Signing</label><input type="text" value={formData.place_of_signing} onChange={e => setFormData({ ...formData, place_of_signing: e.target.value })} className={inputClass} /></div>
                      <div><label className={labelClass}>Date of Signing</label><input type="date" value={formData.date_of_signing} onChange={e => setFormData({ ...formData, date_of_signing: e.target.value })} className={inputClass} /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <label className={labelClass}>Planholder Signature</label>
                        <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden mb-3"><SignaturePad initialSignature={formData.planholder_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, planholder_signature: data || '' })} title="Planholder Signature" /></div>
                        <input type="text" placeholder="Printed Name" value={formData.planholder_printed_name} onChange={e => setFormData({ ...formData, planholder_printed_name: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Witness Signature</label>
                        <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden mb-3"><SignaturePad initialSignature={formData.witness_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, witness_signature: data || '' })} title="Witness Signature" /></div>
                        <input type="text" placeholder="Witness Name" value={formData.witness_name} onChange={e => setFormData({ ...formData, witness_name: e.target.value })} className={inputClass} />
                      </div>
                    </div>

                    {formData.planholder_type === 'company' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <div>
                          <label className={labelClass}>Company Signatory 1</label>
                          <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden mb-3"><SignaturePad initialSignature={formData.company_signatory1_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, company_signatory1_signature: data || '' })} title="Signatory 1 Signature" /></div>
                          <input type="text" placeholder="Name" value={formData.company_signatory1_name} onChange={e => setFormData({ ...formData, company_signatory1_name: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Company Signatory 2</label>
                          <div className="border border-gray-200 rounded-3xl p-3 bg-gray-50/50 overflow-hidden mb-3"><SignaturePad initialSignature={formData.company_signatory2_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, company_signatory2_signature: data || '' })} title="Signatory 2 Signature" /></div>
                          <input type="text" placeholder="Name and Title" value={formData.company_signatory2_name_title} onChange={e => setFormData({ ...formData, company_signatory2_name_title: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-6">Irrevocable Beneficiary Signatures (if applicable)</h4>

                      <div className="space-y-8">
                        {/* Irrevocable Ben 1 */}
                        <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h5 className="font-medium text-sm text-gray-600 mb-4">Irrevocable Beneficiary #1</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                            <div>
                              <label className={labelClass}>Beneficiary Signature</label>
                              <div className="border border-gray-200 rounded-3xl p-3 bg-white overflow-hidden mb-3"><SignaturePad initialSignature={formData.irrevocable_ben1_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, irrevocable_ben1_signature: data || '' })} title="Irrevocable Beneficiary 1 Signature" /></div>
                              <input type="text" placeholder="Printed Name" value={formData.irrevocable_ben1_name} onChange={e => setFormData({ ...formData, irrevocable_ben1_name: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Witness Signature</label>
                              <div className="border border-gray-200 rounded-3xl p-3 bg-white overflow-hidden mb-3"><SignaturePad initialSignature={formData.irrevocable_ben1_witness_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, irrevocable_ben1_witness_signature: data || '' })} title="Witness Signature" /></div>
                              <input type="text" placeholder="Witness Name" value={formData.irrevocable_ben1_witness_name} onChange={e => setFormData({ ...formData, irrevocable_ben1_witness_name: e.target.value })} className={inputClass} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClass}>Place of Signing</label><input type="text" value={formData.irrevocable_ben1_place} onChange={e => setFormData({ ...formData, irrevocable_ben1_place: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Date of Signing</label><input type="date" value={formData.irrevocable_ben1_date} onChange={e => setFormData({ ...formData, irrevocable_ben1_date: e.target.value })} className={inputClass} /></div>
                          </div>
                        </div>

                        {/* Irrevocable Ben 2 */}
                        <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h5 className="font-medium text-sm text-gray-600 mb-4">Irrevocable Beneficiary #2</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                            <div>
                              <label className={labelClass}>Beneficiary Signature</label>
                              <div className="border border-gray-200 rounded-3xl p-3 bg-white overflow-hidden mb-3"><SignaturePad initialSignature={formData.irrevocable_ben2_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, irrevocable_ben2_signature: data || '' })} title="Irrevocable Beneficiary 2 Signature" /></div>
                              <input type="text" placeholder="Printed Name" value={formData.irrevocable_ben2_name} onChange={e => setFormData({ ...formData, irrevocable_ben2_name: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Witness Signature</label>
                              <div className="border border-gray-200 rounded-3xl p-3 bg-white overflow-hidden mb-3"><SignaturePad initialSignature={formData.witness2_signature} onSignatureChange={(data: string | null) => setFormData({ ...formData, witness2_signature: data || '' })} title="Witness Signature" /></div>
                              <input type="text" placeholder="Witness Name" value={formData.witness2_name} onChange={e => setFormData({ ...formData, witness2_name: e.target.value })} className={inputClass} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClass}>Place of Signing</label><input type="text" value={formData.irrevocable_ben2_place} onChange={e => setFormData({ ...formData, irrevocable_ben2_place: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Date of Signing</label><input type="date" value={formData.irrevocable_ben2_date} onChange={e => setFormData({ ...formData, irrevocable_ben2_date: e.target.value })} className={inputClass} /></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Would you like to receive personalized communication and product offers from Sun Life?</h4>
                      </div>
                      <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit shrink-0">
                        <button type="button" onClick={() => setFormData({ ...formData, wants_communication: true })} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${formData.wants_communication ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Yes</button>
                        <button type="button" onClick={() => setFormData({ ...formData, wants_communication: false })} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!formData.wants_communication ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>No</button>
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionHeader letter="E" title="For Company Use Only" badge="Sun Life staff use only" />
                    <div>
                      <textarea
                        value={formData.company_use_only_notes}
                        onChange={e => setFormData({ ...formData, company_use_only_notes: e.target.value })}
                        placeholder="Internal notes and company use details..."
                        className={`${inputClass} min-h-[100px] resize-y`}
                      />
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
            <PrimaryButton form="bcrForm" type="submit" disabled={!formData.client_id} loading={isSubmitting}>
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
              This request will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <SecondaryButton onClick={() => { setIsDeleteModalOpen(false); setRecordToDelete(null); }} disabled={isDeleting} className="flex-1">
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
