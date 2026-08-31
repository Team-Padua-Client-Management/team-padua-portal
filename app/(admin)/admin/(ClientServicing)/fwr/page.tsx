'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, X, Download, AlertCircle, Loader2, Save, CheckCircle2, Inbox, ArrowLeft
} from 'lucide-react';
import { AdminHeader as Header } from '@src/components/layout';
import { AdminSidebar as Sidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import dynamic from 'next/dynamic';
import { generateFundWithdrawalPdfFromTemplate } from '@src/features/client-servicing/pdf/generateFundWithdrawalPdfFromTemplate';
import { useSearchParams } from 'next/navigation';

const FwrStandardForm = dynamic(
  () => import('@src/features/client-servicing/fwr-engine/FwrStandardForm'),
  { ssr: false }
);

const TABLE_NAME = 'fund_withdrawal_requests';

export interface FwrRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  amount: number;
  comments?: string;
  created_at?: string;
  [key: string]: any;
}

const defaultRecord: Omit<FwrRecord, 'id' | 'client_id' | 'created_at'> = {
  status: 'Pending',
  amount: 0,
  comments: '',
  currency: 'PHP',
  withdrawal_type: 'partial',
  payout_method: 'check',
};

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();
  const tone =
    normalized === 'approved' || normalized === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
      normalized === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
        'bg-amber-50 text-amber-700 border-amber-100';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${tone}`}>
      {status}
    </span>
  );
}

function toBlobPart(bytes: Uint8Array): BlobPart {
  return new Uint8Array(bytes) as unknown as BlobPart;
}

export default function FwrPage() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams?.get('client_id');
  const initialRecordId = searchParams?.get('id');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<FwrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FwrRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>(defaultRecord);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);

  useEffect(() => {
    if (!formData.client_id) {
      setSelectedClientDetails(null);
      return;
    }
    const fetchClientDetails = async () => {
      try {
        const { data, error: err } = await supabase
          .from('cpst_clients')
          .select('client_name, birthdate, policy_number, mobile_number, email, address')
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
      console.error('Error fetching records:', err.message || err);
      setError(err.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (initialClientId) {
      setFormData(prev => ({ ...prev, client_id: initialClientId }));
      setIsEditorOpen(true);
    } else if (initialRecordId && records.length > 0) {
      const target = records.find(r => r.id === initialRecordId);
      if (target) handleOpenEditor(target);
    }
  }, [initialClientId, initialRecordId, records]);

  const handleClientSelect = async (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
  };

  const handleOpenEditor = (record?: FwrRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({ ...record });
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
        ...defaultRecord,
        client_id: formData.client_id || ''
      });
      setSelectedClientDetails(null);
    }
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingRecord(null);
  };

  const handleSaveDraft = async (valuesToSave: Record<string, any>) => {
    if (!valuesToSave.client_id) {
      setError("Please select a client before saving.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        client_id: valuesToSave.client_id,
        status: valuesToSave.status || 'Pending',
        amount: valuesToSave.amount || 0,
        comments: valuesToSave.comments || valuesToSave.special_instructions || '',
        currency: valuesToSave.currency || 'PHP',
        policy_number: valuesToSave.policy_number || selectedClientDetails?.policy_number || '',
        policy_owner: valuesToSave.policy_owner || selectedClientDetails?.client_name || '',
        updated_at: new Date().toISOString()
      };

      if (editingRecord) {
        const { error: err } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);
        if (err) throw err;
        setSuccess("FWR saved successfully.");
      } else {
        const { error: err } = await supabase
          .from(TABLE_NAME)
          .insert([payload]);
        if (err) throw err;
        setSuccess("New FWR created successfully.");
      }

      await fetchRecords();
      handleCloseEditor();
    } catch (err: any) {
      console.error('Error saving record:', err.message || err);
      setError(err.message || "Failed to save record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdf = async (engineValues?: Record<string, any>) => {
    try {
      setIsGeneratingPdf(true);
      setError("");

      const valuesToUse = engineValues || formData;
      const ownerName = valuesToUse.policy_owner || selectedClientDetails?.client_name || 'Client';
      const formattedDate = new Date().toISOString().split('T')[0];

      const pdfBytes = await generateFundWithdrawalPdfFromTemplate(valuesToUse, ownerName);
      const blobPart = toBlobPart(pdfBytes);
      const blob = new Blob([blobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FWR_${ownerName.replace(/[^a-zA-Z0-9]/g, '_')}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError("Failed to generate PDF document.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdfForRecord = async (record: FwrRecord) => {
    try {
      setGeneratingPdfId(record.id);
      const ownerName = record.policy_owner || record.client?.client_name || 'Record';
      const formattedDate = new Date().toISOString().split('T')[0];

      const pdfBytes = await generateFundWithdrawalPdfFromTemplate(record, ownerName);
      const blobPart = toBlobPart(pdfBytes);
      const blob = new Blob([blobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FWR_${ownerName.replace(/[^a-zA-Z0-9]/g, '_')}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError("Failed to generate PDF document.");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      const { error: err } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', recordToDelete);
      if (err) throw err;
      setSuccess("Record deleted successfully.");
      setRecords(records.filter(r => r.id !== recordToDelete));
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      console.error('Error deleting record:', err.message || err);
      setError(err.message || "Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(r =>
      r.client?.client_name?.toLowerCase().includes(query) ||
      r.client?.policy_number?.toLowerCase().includes(query) ||
      r.status?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  if (isEditorOpen) {
    return (
      <FwrStandardForm
        initialValues={formData}
        clientId={formData.client_id || ''}
        selectedClientDetails={selectedClientDetails}
        status={formData.status || 'Pending'}
        onBack={handleCloseEditor}
        onClientSelect={handleClientSelect}
        onSaveDraft={handleSaveDraft}
        onExportPdf={handleExportPdf}
        isSubmitting={isSubmitting}
        isGeneratingPdf={isGeneratingPdf}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fund Withdrawal Request (FWR)</h1>
                <p className="text-xs text-slate-500 mt-1">Manage fund withdrawal requests and generate official SLOCPI_Fund Withdrawal PDF documents</p>
              </div>
              <button
                onClick={() => handleOpenEditor()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-sm text-sm"
              >
                <Plus size={18} /> New FWR Request
              </button>
            </div>

            {/* Notifications */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700"><X size={16} /></button>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700"><X size={16} /></button>
              </div>
            )}

            {/* Search & Records list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client name, policy number, status..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-amber-500" />
                  <p className="text-xs">Loading requests...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Inbox size={32} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No Fund Withdrawal Requests found</p>
                  <p className="text-xs text-slate-400">Click "New FWR Request" above to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Client / Policy Owner</th>
                        <th className="p-4">Policy Number</th>
                        <th className="p-4">Withdrawal Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-medium text-slate-900">
                            {rec.policy_owner || rec.client?.client_name || 'Unnamed Client'}
                          </td>
                          <td className="p-4 font-mono text-slate-600">
                            {rec.policy_number || rec.client?.policy_number || 'N/A'}
                          </td>
                          <td className="p-4 font-medium">
                            {rec.currency || 'PHP'} {Number(rec.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <StatusBadge status={rec.status} />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadPdfForRecord(rec)}
                                disabled={generatingPdfId === rec.id}
                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                {generatingPdfId === rec.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                              </button>
                              <button
                                onClick={() => handleOpenEditor(rec)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Request"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => { setRecordToDelete(rec.id); setIsDeleteModalOpen(true); }}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Request"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Delete FWR Request</h3>
            <p className="text-xs text-slate-600">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
