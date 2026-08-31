'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Download, AlertCircle, Loader2, Save, CheckCircle2, FileText, Inbox, ArrowLeft
} from 'lucide-react';
import { AdminHeader as Header } from '@src/components/layout';
import { AdminSidebar as Sidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";
import dynamic from 'next/dynamic';
import { generateAcicrPdfFromTemplate } from '@src/features/client-servicing/pdf/generateAcicrPdfFromTemplate';
import { useSearchParams } from 'next/navigation';

const AcicrStandardForm = dynamic(
  () => import('@src/features/client-servicing/acicr-engine/AcicrStandardForm'),
  { ssr: false }
);

const TABLE_NAME = 'acicr_requests';

export interface FormRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  created_at?: string;
  
  // ACICR specific fields
  policy_number: string;
  last_name: string;
  first_name: string;
  middle_initial: string;
  company_name: string;
  
  permanent_address: string;
  permanent_zip_code: string;
  same_as_permanent: boolean;
  present_address: string;
  present_zip_code: string;
  work_address: string;
  work_zip_code: string;
  other_address: string;
  other_zip_code: string;

  preferred_mailing_address: string;
  update_all_policies: string;

  contact_change_policy: boolean;
  contact_change_group: boolean;
  contact_change_plan: boolean;
  contact_change_mutual_fund: boolean;
  contact_change_all: boolean;

  mobile_phone: string;
  home_phone: string;
  work_phone: string;
  email_address: string;

  billing_preference: string;

  citizenship_change: string;
  citizenship_country: string;
  residence_country: string;

  receive_offers: string;
}

const defaultRecord: Omit<FormRecord, 'id' | 'client_id' | 'created_at'> = {
  status: 'Pending',
  policy_number: '',
  last_name: '',
  first_name: '',
  middle_initial: '',
  company_name: '',
  permanent_address: '',
  permanent_zip_code: '',
  same_as_permanent: false,
  present_address: '',
  present_zip_code: '',
  work_address: '',
  work_zip_code: '',
  other_address: '',
  other_zip_code: '',
  preferred_mailing_address: '',
  update_all_policies: '',
  contact_change_policy: false,
  contact_change_group: false,
  contact_change_plan: false,
  contact_change_mutual_fund: false,
  contact_change_all: false,
  mobile_phone: '',
  home_phone: '',
  work_phone: '',
  email_address: '',
  billing_preference: '',
  citizenship_change: '',
  citizenship_country: '',
  residence_country: '',
  receive_offers: '',
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

export default function ACICRPage() {
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
    if (!fullName) {
      return { last: '', first: '', middle: '' };
    }
    if (fullName.includes(',')) {
      const [lastPart, restPart] = fullName.split(',').map(s => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      let first = '';
      let middle = '';
      if (restWords.length === 1) {
        first = restWords[0];
      } else if (restWords.length > 1) {
        middle = restWords[restWords.length - 1];
        first = restWords.slice(0, -1).join(' ');
      }
      return { last: lastPart, first, middle };
    }
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) {
      return { last: '', first: words[0], middle: '' };
    }
    return {
      last: words[words.length - 1],
      first: words.slice(0, -1).join(' '),
      middle: '',
    };
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { fetchScopedRequestRecords } = await import('@src/lib/authScope');
      const data = await fetchScopedRequestRecords(TABLE_NAME, 'client_name, policy_number, birthdate');
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching records:', err.message || err);
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

  const searchParams = useSearchParams();
  const clientIdQuery = searchParams.get('client_id');

  useEffect(() => {
    if (clientIdQuery && !isEditorOpen) {
      setFormData(prev => ({ ...prev, client_id: clientIdQuery }));
      setIsEditorOpen(true);
    }
  }, [clientIdQuery, isEditorOpen]);

  const handleClientSelect = async (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
  };

  const handleOpenEditor = (record?: FormRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        ...record,
        client_id: record.client_id || '',
      } as any);
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
      setError("Please select a client record before saving.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload: any = { ...engineValues, client_id: formData.client_id };
      delete payload.client;
      delete payload.id;
      delete payload.created_at;

      if (editingRecord) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);

        if (updateError) throw updateError;
        setSuccess("ACICR saved successfully.");
      } else {
        const { data: newRecord, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newRecord) setEditingRecord(newRecord);
        setSuccess("New ACICR created.");
      }

      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdfFromEngine = async (engineValues: Record<string, any>) => {
    try {
      setIsGeneratingPdf(true);
      setError("");

      const ownerName = getClientNameParts(selectedClientDetails?.client_name);

      const pdfBytes = await generateAcicrPdfFromTemplate(engineValues, ownerName);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      a.download = `ACICR_${selectedClientDetails?.client_name || 'Record'}_${formattedDate}.pdf`;
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
      const pdfBytes = await generateAcicrPdfFromTemplate(record, ownerName);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      a.download = `ACICR_${record.client?.client_name || 'Record'}_${formattedDate}.pdf`;
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
    (r.policy_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isEditorOpen) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
        <AcicrStandardForm
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ACICR Documents
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and generate Sun Life Address and Contact Information Change Request forms using interactive PDF Editor.</p>
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
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                              {(record.client?.client_name || '?').charAt(0).toUpperCase()}
                            </div>
                            {record.client?.client_name || `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.policy_number || '-'}
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
