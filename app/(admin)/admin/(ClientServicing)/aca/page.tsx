'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, X, AlertCircle, Loader2, Save, CheckCircle2, Inbox, ArrowLeft, Download
} from 'lucide-react';
import { AdminHeader as Header } from '@src/components/layout';
import { AdminSidebar as Sidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import dynamic from 'next/dynamic';
import { generateAcaPdfFromScratch } from '@src/features/client-servicing/pdf/generateAcaPdfFromScratch';

const AcaStandardForm = dynamic(
  () => import('@src/features/client-servicing/aca-engine/AcaStandardForm'),
  { ssr: false }
);

const TABLE_NAME = 'auto_change_arrangements';

interface AcaRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  date_submitted: string;
  comments: string;
  created_at?: string;
}

const defaultRecord = {
  client_id: '',
  status: 'Pending',
  date_submitted: new Date().toISOString().split('T')[0],
  comments: ''
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

export default function ACAPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<AcaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcaRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const [formData, setFormData] = useState(defaultRecord);
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

  const handleClientSelect = async (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
  };

  const handleOpenEditor = (record?: AcaRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        client_id: record.client_id,
        status: record.status,
        date_submitted: record.date_submitted || new Date().toISOString().split('T')[0],
        comments: record.comments || ''
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
      setFormData(defaultRecord);
      setSelectedClientDetails(null);
    }
    setIsEditorOpen(true);
  };

  const handleSaveDraftFromEngine = async (engineValues: Record<string, any>) => {
    if (!formData.client_id) {
      setError("Please select a client.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        client_id: formData.client_id,
        date_submitted: engineValues.date_submitted || new Date().toISOString().split('T')[0],
        status: engineValues.status || 'Pending',
        comments: engineValues.comments || ''
      };

      if (editingRecord) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);

        if (updateError) throw updateError;
        setSuccess("Auto Credits Request saved successfully.");
      } else {
        const { data: newRecord, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newRecord) setEditingRecord(newRecord);
        setSuccess("New Auto Credits Request created.");
      }

      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdfFromEngine = async (engineValues: Record<string, any>) => {
    try {
      setIsGeneratingPdf(true);
      setError("");

      const clientName = selectedClientDetails?.client_name || '';
      const clientDob = selectedClientDetails?.birthdate || '';
      const pdfBytes = await generateAcaPdfFromScratch(engineValues, clientName, clientDob);

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ACA_Enrollment_${clientName || 'Request'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("PDF exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async (record: AcaRecord) => {
    try {
      setIsGeneratingPdf(true);
      setGeneratingPdfId(record.id);
      setError("");

      const clientName = record.client?.client_name || '';
      const clientDob = record.client?.birthdate || '';
      const pdfBytes = await generateAcaPdfFromScratch(record, clientName, clientDob);

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ACA_Enrollment_${clientName || 'Request'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
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
      setError(err.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      (r.client?.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.client?.policy_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter(r => r.status === 'Pending').length;
    const completed = records.filter(r => r.status === 'Approved' || r.status === 'Completed').length;
    return { total, pending, completed };
  }, [records]);

  if (isEditorOpen) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
        <AcaStandardForm
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
    <div className="flex min-h-screen bg-gray-50/60 text-gray-900 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Link href="/admin/dashboard" className="hover:text-amber-500 flex items-center gap-1 font-semibold transition-colors">
                  <ArrowLeft size={12} /> Dashboard
                </Link>
                <span>/</span>
                <span>Client Servicing</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">ACA Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage Auto Credits Arrangement (ACA) requests and generate PDFs using interactive form entry.</p>
            </div>
            <button
              onClick={() => handleOpenEditor()}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-full text-xs transition duration-200 shadow-sm"
            >
              <Plus size={15} /> New Request Form
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'TOTAL REQUESTS', count: stats.total, color: 'text-slate-900', border: 'border-amber-500/50' },
              { label: 'PENDING', count: stats.pending, color: 'text-amber-600', border: 'border-gray-100' },
              { label: 'APPROVED / COMPLETED', count: stats.completed, color: 'text-emerald-600', border: 'border-gray-100' },
            ].map((stat, i) => (
              <div key={i} className={`bg-white p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] border rounded-3xl ${stat.border} hover:shadow-md transition duration-300`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                <span className={`text-3xl font-extrabold mt-3 ${stat.color}`}>{stat.count}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm animate-[slideInRight_0.2s_ease-out]">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600"><X size={16} /></button>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-2 text-sm shadow-sm">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Table list */}
          <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/40">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-amber-500 transition-colors duration-200" size={17} />
                <input
                  type="text"
                  placeholder="Search ACA requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all duration-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/40 text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Policy Owner</th>
                    <th className="px-6 py-3.5 font-medium">Policy Number</th>
                    <th className="px-6 py-3.5 font-medium">Date Submitted</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading ACA records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                            <Inbox className="text-gray-300" size={22} />
                          </div>
                          <p className="text-gray-400 text-sm">No ACA requests found. Create one to get started.</p>
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
                          {record.client?.policy_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.date_submitted || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadPdf(record)}
                              disabled={isGeneratingPdf}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                              title="Download PDF"
                            >
                              {isGeneratingPdf && generatingPdfId === record.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            </button>
                            <button
                              onClick={() => handleOpenEditor(record)}
                              className="p-2 text-gray-400 hover:text-slate-900 rounded-full hover:bg-gray-100 transition-colors"
                              title="Open Form Editor"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setRecordToDelete(record.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
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
            <p className="text-xs text-gray-500">Are you sure you want to delete this record? This action cannot be undone.</p>
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
