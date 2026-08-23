'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, X, AlertCircle, Loader2, Save, CheckCircle2, Inbox, ArrowLeft
} from 'lucide-react';
import { AdminHeader as Header } from '@src/components/layout';
import { AdminSidebar as Sidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import dynamic from 'next/dynamic';
import { generateSroPdfFromTemplate } from '@src/features/client-servicing/pdf/generateSroPdfFromTemplate';

const SroStandardForm = dynamic(
  () => import('@src/features/client-servicing/sro-engine/SroStandardForm'),
  { ssr: false }
);

const TABLE_NAME = 'reinstatement_sro_requests';

interface SroRecord {
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

export default function ReinstatementSroPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<SroRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SroRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

      if (err) throw err;
      setRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching SRO records:", err);
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter(r => r.status.toLowerCase() === 'pending').length;
    const completed = records.filter(r => r.status.toLowerCase() === 'completed' || r.status.toLowerCase() === 'approved').length;
    return { total, pending, completed };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      return (
        r.client?.client_name?.toLowerCase().includes(q) ||
        r.client?.policy_number?.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery]);

  const handleOpenEditor = (record?: SroRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        client_id: record.client_id || '',
        status: record.status || 'Pending',
        date_submitted: record.date_submitted || defaultRecord.date_submitted,
        comments: record.comments || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({ ...defaultRecord });
    }
    setIsEditorOpen(true);
  };

  const handleSaveDraftFromEngine = async (values: Record<string, any>) => {
    if (!values.client_id) {
      alert("Please select a client before saving.");
      return;
    }
    try {
      setIsSubmitting(true);
      if (editingRecord?.id) {
        const { error: err } = await supabase
          .from(TABLE_NAME)
          .update({
            client_id: values.client_id,
            status: values.status,
            date_submitted: values.date_submitted,
            comments: values.comments,
          })
          .eq('id', editingRecord.id);
        if (err) throw err;
        setSuccess("Request updated successfully.");
      } else {
        const { error: err } = await supabase
          .from(TABLE_NAME)
          .insert([{
            client_id: values.client_id,
            status: values.status,
            date_submitted: values.date_submitted,
            comments: values.comments,
          }]);
        if (err) throw err;
        setSuccess("Request created successfully.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setIsEditorOpen(false);
      fetchRecords();
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.message || "Failed to save request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdfFromEngine = async (values: Record<string, any>) => {
    try {
      setIsGeneratingPdf(true);
      const clientName = selectedClientDetails?.client_name || '';
      const clientDob = selectedClientDetails?.birthdate || '';
      const pdfBytes = await generateSroPdfFromTemplate(values, clientName, clientDob);
      
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SRO_Request_${clientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      const { error: err } = await supabase.from(TABLE_NAME).delete().eq('id', recordToDelete);
      if (err) throw err;
      setSuccess("Record deleted successfully.");
      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete record.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  if (isEditorOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <SroStandardForm
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reinstatement SRO</h1>
              <p className="text-sm text-gray-500 mt-1">Manage simplified reinstatement offers and generate forms.</p>
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
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm">
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
                  placeholder="Search SRO requests..."
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
                    <th className="px-6 py-3.5 font-medium">Date Submitted</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                          <p>Loading records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <Inbox size={24} />
                          </div>
                          <p>No SRO records found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{record.client?.client_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{record.client?.policy_number || 'No Policy #'}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{record.date_submitted}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditor(record)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                              title="Edit Request"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setRecordToDelete(record.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Request"
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

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Request</h3>
                <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this record? This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 flex items-center justify-center disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
