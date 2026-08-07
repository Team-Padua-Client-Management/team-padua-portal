'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateAdaPdfFromTemplate } from '@src/features/client-servicing/pdf/generateAdaPdfFromTemplate';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

interface AdaStandardFormProps {
  initialValues: Record<string, any>;
  clientId: string;
  selectedClientDetails: any;
  status: string;
  onBack: () => void;
  onClientSelect: (clientId: string) => void;
  onSaveDraft: (values: Record<string, any>) => void;
  onExportPdf: (values: Record<string, any>) => void;
  isSubmitting: boolean;
  isGeneratingPdf: boolean;
}

export default function AdaStandardForm({
  initialValues,
  clientId,
  selectedClientDetails,
  status,
  onBack,
  onClientSelect,
  onSaveDraft,
  onExportPdf,
  isSubmitting,
  isGeneratingPdf,
}: AdaStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('cpst_clients').select('id, client_name, policy_number, birthdate, mobile_number, email, address').order('client_name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelectLocal = async (newClientId: string, selectedClientFromSelector?: any) => {
    handleChange('client_id', newClientId);
    onClientSelect(newClientId);
  };

  const handleViewModeChange = async (mode: 'form' | 'literal') => {
    setViewMode(mode);
    if (mode === 'literal') {
      setIsPreviewLoading(true);
      try {
        const client = clients.find(c => c.id === (formData.client_id || clientId));
        const clientName = client?.client_name || '';
        const clientDob = client?.birthdate || '';
        const pdfBytes = await generateAdaPdfFromTemplate(formData, clientName, clientDob);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      } catch (e) {
        console.error(e);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Auto-Debit Arrangement (ADA)</h1>
            <p className="text-xs text-slate-500">Standard Form View</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => handleViewModeChange('form')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'form' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileEdit size={14} /> Form Entry
          </button>
          <button
            onClick={() => handleViewModeChange('literal')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'literal' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Eye size={14} /> Literal / Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSaveDraft(formData)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => onExportPdf(formData)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
        </div>
      </header>

      <ClientServicingLayout
        selectedClient={formData.client_id || clientId || ''}
        onClientChange={handleClientSelectLocal}
      >
        <div className="flex-1 overflow-hidden relative">
          <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'form' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8 pb-12">
                
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 px-6 py-4">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. General Information</h2>
                  </div>
                  <div className="p-6 space-y-6">
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Type</label>
                      <select
                        value={formData.bank_type || 'BPI'}
                        onChange={(e) => handleChange('bank_type', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="BPI">BPI - Bank of the Philippine Islands</option>
                        <option value="BDO">BDO - Banco De Oro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={formData.bank_account_number || ''}
                        onChange={(e) => handleChange('bank_account_number', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        placeholder="e.g. 1234567890"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date Submitted</label>
                      <input
                        type="date"
                        value={formData.date_submitted || ''}
                        onChange={(e) => handleChange('date_submitted', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={formData.status || 'Pending'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Comments / Remarks</label>
                    <textarea
                      rows={3}
                      value={formData.comments || ''}
                      onChange={(e) => handleChange('comments', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-y"
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* Literal View (PDF Preview) */}
        <div className={`absolute inset-0 bg-slate-200/50 transition-opacity duration-300 flex flex-col ${viewMode === 'literal' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          
          {/* Top Bar for Literal View specific controls */}
          <div className="bg-white border-b border-slate-200 p-3 flex justify-center items-center gap-3 shadow-sm shrink-0">
            <span className="text-sm font-semibold text-slate-700">Previewing Form:</span>
            <select
              value={formData.bank_type || 'BPI'}
              onChange={async (e) => {
                const newBankType = e.target.value;
                handleChange('bank_type', newBankType);
                setIsPreviewLoading(true);
                try {
                  const client = clients.find(c => c.id === (formData.client_id || clientId));
                  const clientName = client?.client_name || '';
                  const clientDob = client?.birthdate || '';
                  const pdfBytes = await generateAdaPdfFromTemplate({ ...formData, bank_type: newBankType }, clientName, clientDob);
                  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  setPdfPreviewUrl(url);
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsPreviewLoading(false);
                }
              }}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none w-48 transition-colors"
            >
              <option value="BPI">BPI Form</option>
              <option value="BDO">BDO Form</option>
            </select>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 size={32} className="animate-spin text-amber-500" />
                <p className="font-medium">Generating PDF Preview...</p>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe
                src={`${pdfPreviewUrl}#toolbar=0`}
                className="w-full max-w-4xl h-full rounded-xl shadow-2xl border-0 bg-white"
                title="PDF Preview"
              />
            ) : (
              <div className="text-slate-500 font-medium">No preview available</div>
            )}
          </div>
        </div>
      </div>
    </ClientServicingLayout>
    </div>
  );
}
