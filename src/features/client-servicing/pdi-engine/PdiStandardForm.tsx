'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generatePdiPdfFromTemplate } from '@src/features/client-servicing/pdf/generatePdiPdfFromTemplate';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

interface PdiStandardFormProps {
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

export default function PdiStandardForm({
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
}: PdiStandardFormProps) {
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
        const pdfBytes = await generatePdiPdfFromTemplate(formData, clientName, clientDob);
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
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Reinstatement PDI</h1>
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
                
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 mb-4 border-b pb-2">Request Status</h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Request Status</label>
                    <select
                      value={formData.status || 'Pending'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </section>

                {formData.client_id && (
                  <>
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-6 py-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Plan & Personal Details</h2>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Plan Number</label>
                            <input
                              type="text"
                              value={formData.policy_number || ''}
                              onChange={(e) => handleChange('policy_number', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Planholder / Person Insured Name</label>
                            <input
                              type="text"
                              value={formData.planholder_name || ''}
                              onChange={(e) => handleChange('planholder_name', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Birthdate</label>
                            <input
                              type="date"
                              value={formData.birthdate || ''}
                              onChange={(e) => handleChange('birthdate', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                            <input
                              type="number"
                              value={formData.age || ''}
                              onChange={(e) => handleChange('age', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reinstatement Option</label>
                            <select
                              value={formData.reinstatement_option || 'reinstatement'}
                              onChange={(e) => handleChange('reinstatement_option', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            >
                              <option value="reinstatement">Reinstatement</option>
                              <option value="updating">Updating</option>
                              <option value="redating">Redating</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date Submitted</label>
                            <input
                              type="date"
                              value={formData.date_submitted || ''}
                              onChange={(e) => handleChange('date_submitted', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-6 py-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Addresses & Contact Information</h2>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Residence Address</label>
                            <textarea
                              rows={2}
                              value={formData.residence_address || ''}
                              onChange={(e) => handleChange('residence_address', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mailing Address</label>
                            <textarea
                              rows={2}
                              value={formData.mailing_address || ''}
                              onChange={(e) => handleChange('mailing_address', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Home Phone No.</label>
                            <input
                              type="text"
                              value={formData.home_phone || ''}
                              onChange={(e) => handleChange('home_phone', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Phone No.</label>
                            <input
                              type="text"
                              value={formData.work_phone || ''}
                              onChange={(e) => handleChange('work_phone', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cell Phone No.</label>
                            <input
                              type="text"
                              value={formData.mobile_phone || ''}
                              onChange={(e) => handleChange('mobile_phone', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                              type="email"
                              value={formData.email_address || ''}
                              onChange={(e) => handleChange('email_address', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-6 py-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Signatures & Remarks</h2>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Printed Name</label>
                            <input
                              type="text"
                              value={formData.printed_name || ''}
                              onChange={(e) => handleChange('printed_name', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Place of Signing</label>
                            <input
                              type="text"
                              value={formData.place_of_signing || ''}
                              onChange={(e) => handleChange('place_of_signing', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Signing</label>
                            <input
                              type="date"
                              value={formData.date_of_signing || ''}
                              onChange={(e) => handleChange('date_of_signing', e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Comments / Remarks</label>
                          <textarea
                            rows={3}
                            value={formData.comments || ''}
                            onChange={(e) => handleChange('comments', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-y"
                            placeholder="Enter any additional notes..."
                          />
                        </div>
                      </div>
                    </section>
                  </>
                )}

            </div>
          </div>
        </div>

        {/* Literal View (PDF Preview) */}
        <div className={`absolute inset-0 bg-slate-200/50 transition-opacity duration-300 ${viewMode === 'literal' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="h-full flex items-center justify-center p-4">
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
