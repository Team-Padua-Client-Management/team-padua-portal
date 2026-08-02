'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateAcicrPdfFromTemplate } from '@src/features/client-servicing/pdf/generateAcicrPdfFromTemplate';
import ClientAdvisorSelector from '@src/features/client-servicing/components/ClientAdvisorSelector';

interface AcicrStandardFormProps {
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

export default function AcicrStandardForm({
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
}: AcicrStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleClientSelectLocal = async (newClientId: string, selectedClient?: any) => {
    handleChange('client_id', newClientId);
    onClientSelect(newClientId);

    if (!newClientId || !selectedClient) return;

    const nameParts = getClientNameParts(selectedClient.client_name);

    setFormData(prev => ({
      ...prev,
      first_name: nameParts.first,
      last_name: nameParts.last,
      middle_initial: nameParts.middle.charAt(0),
      policy_number: selectedClient.policy_number || prev.policy_number || '',
    }));
  };

  const handleViewModeChange = async (mode: 'form' | 'literal') => {
    setViewMode(mode);
    if (mode === 'literal') {
      setIsPreviewLoading(true);
      try {
        const selectedClient = selectedClientDetails;
        const ownerName = {
          last: formData.last_name ?? getClientNameParts(selectedClient?.client_name).last,
          first: formData.first_name ?? getClientNameParts(selectedClient?.client_name).first,
          middle: formData.middle_initial ?? getClientNameParts(selectedClient?.client_name).middle,
        };

        const pdfBytes = await generateAcicrPdfFromTemplate(formData, ownerName);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Address and Contact Information Change Request</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Interactive Form Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-full mr-4">
            <button
              onClick={() => handleViewModeChange('form')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                viewMode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileEdit size={16} /> Form Data
            </button>
            <button
              onClick={() => handleViewModeChange('literal')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                viewMode === 'literal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye size={16} /> PDF Preview
            </button>
          </div>
          <button
            onClick={() => onSaveDraft(formData)}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 hover:border-slate-300 font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => onExportPdf(formData)}
            disabled={isGeneratingPdf}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 font-medium text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Filled PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto hidden md:block">
          <div className="p-6">
            <ClientAdvisorSelector
              selectedClient={formData.client_id || clientId || ''}
              onClientChange={handleClientSelectLocal}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          {viewMode === 'literal' ? (
            <div className="h-full flex items-center justify-center p-6 bg-slate-200/50">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Generating preview...</p>
                </div>
              ) : pdfPreviewUrl ? (
                <iframe src={pdfPreviewUrl} className="w-full h-full rounded-xl shadow-xl border border-slate-200 bg-white" title="PDF Preview" />
              ) : null}
            </div>
          ) : (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">A. General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Policy / Group Contract / Mutual Fund Account Number</label>
                    <input
                      type="text"
                      value={formData.policy_number || ''}
                      onChange={(e) => handleChange('policy_number', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Business Name</label>
                    <input
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">B. Address Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">2. Permanent Home Address</label>
                    <input type="text" value={formData.permanent_address || ''} onChange={(e) => handleChange('permanent_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">3. Zip Code</label>
                    <input type="text" value={formData.permanent_zip_code || ''} onChange={(e) => handleChange('permanent_zip_code', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  
                  <div className="md:col-span-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={formData.same_as_permanent || false} onChange={(e) => handleChange('same_as_permanent', e.target.checked)} className="accent-amber-500" />
                      Same as Permanent Home Address
                    </label>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">4. Present Home Address</label>
                    <input type="text" value={formData.present_address || ''} onChange={(e) => handleChange('present_address', e.target.value)} disabled={formData.same_as_permanent} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">5. Zip Code</label>
                    <input type="text" value={formData.present_zip_code || ''} onChange={(e) => handleChange('present_zip_code', e.target.value)} disabled={formData.same_as_permanent} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">6. Work Address</label>
                    <input type="text" value={formData.work_address || ''} onChange={(e) => handleChange('work_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">7. Zip Code</label>
                    <input type="text" value={formData.work_zip_code || ''} onChange={(e) => handleChange('work_zip_code', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">8. Other Address</label>
                    <input type="text" value={formData.other_address || ''} onChange={(e) => handleChange('other_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">9. Zip Code</label>
                    <input type="text" value={formData.other_zip_code || ''} onChange={(e) => handleChange('other_zip_code', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">C. Contact Information & Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone</label>
                    <input type="text" value={formData.mobile_phone || ''} onChange={(e) => handleChange('mobile_phone', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input type="email" value={formData.email_address || ''} onChange={(e) => handleChange('email_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
