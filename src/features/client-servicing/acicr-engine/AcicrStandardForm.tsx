'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateAcicrPdfFromTemplate } from '@src/features/client-servicing/pdf/generateAcicrPdfFromTemplate';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewMode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <FileEdit size={16} /> Form Data
            </button>
            <button
              onClick={() => handleViewModeChange('literal')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewMode === 'literal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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

      {/* Main Container — Centralized Sidebar Layout */}
      <ClientServicingLayout
        selectedClient={formData.client_id || clientId || ''}
        onClientChange={handleClientSelectLocal}
      >
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {viewMode === 'literal' ? (
            <div className="h-full flex items-center justify-center p-6 bg-slate-200/50">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Generating preview...</p>
                </div>
              ) : pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full max-w-4xl h-full rounded-xl shadow-xl border border-slate-200 bg-white"
                  title="PDF Preview"
                />
              ) : null}
            </div>
          ) : (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              {/* Section A */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">A. General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Policy / Group Contract / Mutual Fund Account Number</label>
                    <input
                      type="text"
                      value={formData.policy_number || ''}
                      onChange={(e) => handleChange('policy_number', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Middle Initial (M.I.)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={formData.middle_initial || ''}
                      onChange={(e) => handleChange('middle_initial', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Business Name</label>
                    <input
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </section>

              {/* Section B */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">B. Address and Contact Information Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">2. Permanent Home Address</label>
                    <input type="text" value={formData.permanent_address || ''} onChange={(e) => handleChange('permanent_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">3. Zip Code</label>
                    <input type="text" value={formData.permanent_zip_code || ''} onChange={(e) => handleChange('permanent_zip_code', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>

                  <div className="md:col-span-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                      <input type="checkbox" checked={formData.same_as_permanent || false} onChange={(e) => handleChange('same_as_permanent', e.target.checked)} className="accent-amber-500 rounded" />
                      Same as Permanent Home Address
                    </label>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">4. Present Home Address</label>
                    <input type="text" value={formData.present_address || ''} onChange={(e) => handleChange('present_address', e.target.value)} disabled={formData.same_as_permanent} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">5. Zip Code</label>
                    <input type="text" value={formData.present_zip_code || ''} onChange={(e) => handleChange('present_zip_code', e.target.value)} disabled={formData.same_as_permanent} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">6. Work Address</label>
                    <input type="text" value={formData.work_address || ''} onChange={(e) => handleChange('work_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">7. Zip Code</label>
                    <input type="text" value={formData.work_zip_code || ''} onChange={(e) => handleChange('work_zip_code', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">8. Other Address</label>
                    <input type="text" value={formData.other_address || ''} onChange={(e) => handleChange('other_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">9. Zip Code</label>
                    <input type="text" value={formData.other_zip_code || ''} onChange={(e) => handleChange('other_zip_code', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                </div>

                {/* Subsection: 10. Preferred Mailing Address */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">10. Preferred Mailing Address</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferred_mailing_permanent || false}
                        onChange={(e) => handleChange('preferred_mailing_permanent', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Permanent Address
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferred_mailing_present || false}
                        onChange={(e) => handleChange('preferred_mailing_present', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Present Address
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferred_mailing_work || false}
                        onChange={(e) => handleChange('preferred_mailing_work', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Work Address
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferred_mailing_other || false}
                        onChange={(e) => handleChange('preferred_mailing_other', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Other Address
                    </label>
                  </div>
                </div>

                {/* Subsection: 11. Update All Existing Accounts */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    11. Do you want us to update all existing Life Insurance Policies / Pre-need Plans / Mutual Fund Accounts?
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="update_existing_accounts"
                        value="yes"
                        checked={formData.update_existing_accounts === 'yes'}
                        onChange={(e) => handleChange('update_existing_accounts', e.target.value)}
                        className="accent-amber-500"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="update_existing_accounts"
                        value="no"
                        checked={formData.update_existing_accounts === 'no'}
                        onChange={(e) => handleChange('update_existing_accounts', e.target.value)}
                        className="accent-amber-500"
                      />
                      No
                    </label>
                  </div>
                </div>

                {/* Subsection: Contact Information Change To */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Contact Information Change To</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.change_policy || false}
                        onChange={(e) => handleChange('change_policy', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Policy
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.change_group_contract || false}
                        onChange={(e) => handleChange('change_group_contract', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Group Contract
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.change_plan || false}
                        onChange={(e) => handleChange('change_plan', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Plan
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.change_mutual_fund || false}
                        onChange={(e) => handleChange('change_mutual_fund', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      Mutual Fund Account
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.change_all || false}
                        onChange={(e) => handleChange('change_all', e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      All
                    </label>
                  </div>
                </div>

                {/* Section B Visual Continuation Divider */}
                <div className="border-t-2 border-dashed border-slate-200 pt-5 mt-6">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4">
                    B. Address and Contact Information Details (Continuation)
                  </span>

                  {/* Phone and Email fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">12. Mobile Phone</label>
                      <input
                        type="text"
                        value={formData.mobile_phone || ''}
                        onChange={(e) => handleChange('mobile_phone', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">13. Home Phone</label>
                      <input
                        type="text"
                        value={formData.home_phone || ''}
                        onChange={(e) => handleChange('home_phone', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">14. Work Phone</label>
                      <input
                        type="text"
                        value={formData.work_phone || ''}
                        onChange={(e) => handleChange('work_phone', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">15. Email Address</label>
                      <input
                        type="email"
                        value={formData.email_address || ''}
                        onChange={(e) => handleChange('email_address', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Subsection: 16. Billing Statement & Official Receipt Delivery */}
                  <div className="border-t border-slate-100 pt-4 space-y-2 mt-4">
                    <label className="block text-xs font-semibold text-slate-700">
                      16. How would you like to receive your billing statement and official receipt?
                    </label>
                    <p className="text-xs text-slate-500 italic">
                      Choose only one. All your policies will be updated based on the option selected.
                    </p>
                    <div className="space-y-2.5 pt-1">
                      {(() => {
                        const currentBillingVal = formData.billing_statement_delivery ||
                          (formData.billing_preference === 'SMS + Electronic Copy' ? 'sms_electronic' :
                           formData.billing_preference === 'SMS + Printed Copy' ? 'sms_printed' :
                           formData.billing_preference === 'Printed Copy only' ? 'printed_only' : '');

                        const handleBillingChange = (val: string) => {
                          let pref = '';
                          if (val === 'sms_electronic') pref = 'SMS + Electronic Copy';
                          else if (val === 'sms_printed') pref = 'SMS + Printed Copy';
                          else if (val === 'printed_only') pref = 'Printed Copy only';

                          setFormData(prev => ({
                            ...prev,
                            billing_statement_delivery: val,
                            billing_preference: pref,
                          }));
                        };

                        return (
                          <>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="billing_statement_delivery"
                                value="sms_electronic"
                                checked={currentBillingVal === 'sms_electronic'}
                                onChange={(e) => handleBillingChange(e.target.value)}
                                className="accent-amber-500"
                              />
                              <span>SMS + Electronic Copy</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="billing_statement_delivery"
                                value="sms_printed"
                                checked={currentBillingVal === 'sms_printed'}
                                onChange={(e) => handleBillingChange(e.target.value)}
                                className="accent-amber-500"
                              />
                              <span>SMS + Printed Copy</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="billing_statement_delivery"
                                value="printed_only"
                                checked={currentBillingVal === 'printed_only'}
                                onChange={(e) => handleBillingChange(e.target.value)}
                                className="accent-amber-500"
                              />
                              <span>Printed Copy only</span>
                            </label>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section C */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">C. Compliance with Regulatory Requirements</h2>
                  <p className="text-xs text-slate-500 mt-1">The following information is collected for regulatory compliance.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 leading-relaxed">
                    17. Has there been any change in your citizenship(s)/nationality(-ies) or country of legal residence?
                  </label>

                  <div className="space-y-3 pl-1">
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="citizenship_change"
                        value="resident_citizen"
                        checked={formData.citizenship_change === 'resident_citizen'}
                        onChange={(e) => handleChange('citizenship_change', e.target.value)}
                        className="accent-amber-500 mt-0.5"
                      />
                      <span>Yes, I am a citizen/national and a legal resident of (specify country)</span>
                    </label>
                    {formData.citizenship_change === 'resident_citizen' && (
                      <div className="pl-7 max-w-md">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Country</label>
                        <input
                          type="text"
                          value={formData.citizenship_country || ''}
                          onChange={(e) => handleChange('citizenship_country', e.target.value)}
                          placeholder="Specify country"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="citizenship_change"
                        value="non_resident_citizen"
                        checked={formData.citizenship_change === 'non_resident_citizen'}
                        onChange={(e) => handleChange('citizenship_change', e.target.value)}
                        className="accent-amber-500 mt-0.5"
                      />
                      <span>Yes, I am a citizen/national of (specify country) but I legally reside in (specify country)</span>
                    </label>
                    {formData.citizenship_change === 'non_resident_citizen' && (
                      <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Citizen / National of</label>
                          <input
                            type="text"
                            value={formData.citizenship_country || ''}
                            onChange={(e) => handleChange('citizenship_country', e.target.value)}
                            placeholder="Specify citizenship country"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Legally Reside in</label>
                          <input
                            type="text"
                            value={formData.legal_residence_country || ''}
                            onChange={(e) => handleChange('legal_residence_country', e.target.value)}
                            placeholder="Specify residence country"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="citizenship_change"
                        value="none"
                        checked={formData.citizenship_change === 'none'}
                        onChange={(e) => handleChange('citizenship_change', e.target.value)}
                        className="accent-amber-500"
                      />
                      <span>None</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Section D */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">D. Signatures</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Signature of Policy Owner</label>
                    <input
                      type="text"
                      placeholder="Policy Owner Signature / Specimen"
                      value={formData.policy_owner_signature || ''}
                      onChange={(e) => handleChange('policy_owner_signature', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Printed Name</label>
                    <input
                      type="text"
                      value={formData.policy_owner_printed_name || ''}
                      onChange={(e) => handleChange('policy_owner_printed_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Signature of Authorized Signatory #1</label>
                    <input
                      type="text"
                      placeholder="Authorized Signatory #1"
                      value={formData.authorized_signatory_1_signature || ''}
                      onChange={(e) => handleChange('authorized_signatory_1_signature', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Printed Name and Job Title</label>
                    <input
                      type="text"
                      value={formData.authorized_signatory_1_name || ''}
                      onChange={(e) => handleChange('authorized_signatory_1_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Signature of Authorized Signatory #2</label>
                    <input
                      type="text"
                      placeholder="Authorized Signatory #2"
                      value={formData.authorized_signatory_2_signature || ''}
                      onChange={(e) => handleChange('authorized_signatory_2_signature', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Printed Name and Job Title</label>
                    <input
                      type="text"
                      value={formData.authorized_signatory_2_name || ''}
                      onChange={(e) => handleChange('authorized_signatory_2_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Signature of Witness</label>
                    <input
                      type="text"
                      placeholder="Witness Signature"
                      value={formData.witness_signature || ''}
                      onChange={(e) => handleChange('witness_signature', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Printed Name</label>
                    <input
                      type="text"
                      value={formData.witness_name || ''}
                      onChange={(e) => handleChange('witness_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Place of Signing</label>
                    <input
                      type="text"
                      value={formData.place_of_signing || ''}
                      onChange={(e) => handleChange('place_of_signing', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Signing</label>
                    <input
                      type="date"
                      value={formData.date_of_signing || ''}
                      onChange={(e) => handleChange('date_of_signing', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Subsection: Marketing Consent */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Would you like to receive personalized communication and product offers?
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.marketing_consent === 'yes'}
                        onChange={(e) => handleChange('marketing_consent', e.target.checked ? 'yes' : 'no')}
                        className="accent-amber-500 rounded"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.marketing_consent === 'no'}
                        onChange={(e) => handleChange('marketing_consent', e.target.checked ? 'no' : 'yes')}
                        className="accent-amber-500 rounded"
                      />
                      No
                    </label>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </ClientServicingLayout>
    </div>
  );
}
