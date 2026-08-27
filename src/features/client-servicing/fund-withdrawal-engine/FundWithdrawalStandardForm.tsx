'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateFundWithdrawalPdfFromTemplate } from '@src/features/client-servicing/pdf/generateFundWithdrawalPdfFromTemplate';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

interface FundWithdrawalStandardFormProps {
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

export default function FundWithdrawalStandardForm({
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
}: FundWithdrawalStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const { fetchScopedClients } = await import('@src/lib/authScope');
      const data = await fetchScopedClients('id, client_name, policy_number, birthdate, mobile_number, email, address');
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
        const pdfBytes = await generateFundWithdrawalPdfFromTemplate(formData, clientName, clientDob);
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
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Fund Withdrawal Form</h1>
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
            <Eye size={14} /> Literal Display
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSaveDraft(formData)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => onExportPdf(formData)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <ClientServicingLayout
        selectedClient={formData.client_id || clientId || ''}
        onClientChange={handleClientSelectLocal}
      >
        {viewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 border-b pb-2">Request Status</h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Request Status</label>
                    <select
                      value={formData.status || 'Pending'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
              </section>

              {formData.client_id && (
                <>
                  <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2">1. Withdrawal Request Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Withdrawal Type</label>
                        <select
                          value={formData.withdrawal_type || 'partial'}
                          onChange={(e) => handleChange('withdrawal_type', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        >
                          <option value="partial">Partial Withdrawal</option>
                          <option value="full">Full Withdrawal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Withdrawal Amount (PHP)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amount || ''}
                          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                          placeholder="e.g. 5000.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date Submitted</label>
                        <input
                          type="date"
                          value={formData.date_submitted || ''}
                          onChange={(e) => handleChange('date_submitted', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Comments / Instructions</label>
                        <textarea
                          value={formData.comments || ''}
                          onChange={(e) => handleChange('comments', e.target.value)}
                          rows={3}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                          placeholder="Optional details..."
                        />
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2">2. Payout & Bank Account Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Payout Option</label>
                        <select
                          value={formData.payout_option || 'direct_credit'}
                          onChange={(e) => handleChange('payout_option', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        >
                          <option value="direct_credit">Direct Credit (Bank Deposit)</option>
                          <option value="check">Check</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bank_name || ''}
                          onChange={(e) => handleChange('bank_name', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                          placeholder="e.g. BDO / BPI / Metrobank"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Branch</label>
                        <input
                          type="text"
                          value={formData.bank_branch || ''}
                          onChange={(e) => handleChange('bank_branch', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                          placeholder="e.g. Makati Main Branch"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Account Type</label>
                        <select
                          value={formData.account_type || 'savings'}
                          onChange={(e) => handleChange('account_type', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        >
                          <option value="savings">Savings Account</option>
                          <option value="checking">Checking Account</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Account Number</label>
                        <input
                          type="text"
                          value={formData.bank_account_number || ''}
                          onChange={(e) => handleChange('bank_account_number', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Account Name</label>
                        <input
                          type="text"
                          value={formData.bank_account_name || ''}
                          onChange={(e) => handleChange('bank_account_name', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2">3. Signatures & Declarations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Policy Owner Printed Name</label>
                        <input
                          type="text"
                          value={formData.policy_owner_printed_name || ''}
                          onChange={(e) => handleChange('policy_owner_printed_name', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Place of Signing</label>
                        <input
                          type="text"
                          value={formData.place_of_signing || ''}
                          onChange={(e) => handleChange('place_of_signing', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Signing</label>
                        <input
                          type="date"
                          value={formData.date_of_signing || ''}
                          onChange={(e) => handleChange('date_of_signing', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 h-full relative bg-slate-900 flex flex-col items-center justify-center p-4">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 size={32} className="animate-spin text-amber-500" />
                <p className="text-sm">Generating Literal Display...</p>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe src={pdfPreviewUrl} className="w-full max-w-5xl h-full bg-white rounded-lg shadow-2xl" />
            ) : (
              <p className="text-white text-sm">Failed to load PDF preview.</p>
            )}
          </div>
        )}
      </ClientServicingLayout>
    </div>
  );
}
