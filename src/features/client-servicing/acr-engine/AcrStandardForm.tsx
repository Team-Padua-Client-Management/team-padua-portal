'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateAdvisorChangeRequestPdfFromTemplate } from '@src/features/client-servicing/pdf/generateAdvisorChangeRequestPdfFromTemplate';

interface AcrStandardFormProps {
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
  config?: any;
}

export default function AcrStandardForm({
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
}: AcrStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('cpst_clients').select('id, client_name, policy_number, birthdate, mobile_number, email, address, beneficiary').order('client_name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

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

      return {
        last: lastPart,
        first,
        middle,
      };
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

  const handleClientSelectLocal = async (newClientId: string) => {
    handleChange('client_id', newClientId);
    onClientSelect(newClientId);

    if (!newClientId) return;

    // Find the client from the already-loaded list
    const selectedClient = clients.find(c => c.id === newClientId);
    if (!selectedClient) return;

    const nameParts = getClientNameParts(selectedClient.client_name);

    setFormData(prev => ({
      ...prev,
      client_last_name: nameParts.last,
      client_first_name: nameParts.first,
      client_middle_name: nameParts.middle,
      client_dob: selectedClient.birthdate || prev.client_dob || '',
      policy_numbers: selectedClient.policy_number || prev.policy_numbers || '',
      reference_policy_number: selectedClient.policy_number || prev.reference_policy_number || '',
      client_full_name_pg2: selectedClient.client_name || prev.client_full_name_pg2 || '',
    }));
  };

  const handleViewModeChange = async (mode: 'form' | 'literal') => {
    setViewMode(mode);
    if (mode === 'literal') {
      setIsPreviewLoading(true);
      try {
        // Need to pass ownerName and ownerDob for literal preview
        const selectedClient = clients.find(c => c.id === (formData.client_id || clientId)) || selectedClientDetails;
        const ownerName = {
          last: formData.client_last_name ?? getClientNameParts(selectedClient?.client_name).last,
          first: formData.client_first_name ?? getClientNameParts(selectedClient?.client_name).first,
          middle: formData.client_middle_name ?? getClientNameParts(selectedClient?.client_name).middle,
        };
        const ownerDob = formData.client_dob || selectedClient?.birthdate || '';

        const pdfBytes = await generateAdvisorChangeRequestPdfFromTemplate(formData as any, ownerName, ownerDob);
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
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Advisor Change Request</h1>
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
      <main className="flex-1 overflow-hidden flex">
        {viewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">

              {/* Client Selection */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 border-b pb-2">Client Selection</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Client *</label>
                    <select
                      value={formData.client_id || clientId}
                      onChange={(e) => handleClientSelectLocal(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select a Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.client_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Request Status</label>
                    <select
                      value={formData.status || 'Pending'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Auto-Display Client Info Card */}
                {(() => {
                  const sel = clients.find(c => c.id === (formData.client_id || clientId));
                  if (!sel) return null;
                  return (
                    <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wider">Auto-Filled Client Data</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-slate-500 text-xs">Full Name</span>
                          <p className="font-semibold text-slate-900">{sel.client_name || '—'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">Policy Number</span>
                          <p className="font-semibold text-slate-900">{sel.policy_number || '—'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">Birthdate</span>
                          <p className="font-semibold text-slate-900">{sel.birthdate || '—'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">Mobile Number</span>
                          <p className="font-semibold text-slate-900">{sel.mobile_number || '—'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">Email</span>
                          <p className="font-semibold text-slate-900">{sel.email || '—'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-slate-500 text-xs">Address</span>
                          <p className="font-semibold text-slate-900">{sel.address || '—'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* Section A */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">A. General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.company_name || 'Sun Life of Canada (Philippines), Inc.'}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.designation || ''}
                      onChange={(e) => handleChange('designation', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section B */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">B. Request Details</h2>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Request Type</label>
                  <div className="flex gap-4 flex-col md:flex-row">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="request_type"
                        checked={formData.request_type === 'specific_policy'}
                        onChange={() => handleChange('request_type', 'specific_policy')}
                        className="accent-amber-500"
                      />
                      <span className="text-sm">B.1 Request a particular policy/plan/account number(s) only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="request_type"
                        checked={formData.request_type === 'all_accounts'}
                        onChange={() => handleChange('request_type', 'all_accounts')}
                        className="accent-amber-500"
                      />
                      <span className="text-sm">B.2 Request will apply to ALL existing client accounts</span>
                    </label>
                  </div>
                </div>

                {formData.request_type === 'specific_policy' && (
                  <div className="border-t pt-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Policy / Plan / Account Number(s)</label>
                    <textarea
                      value={formData.policy_numbers || ''}
                      onChange={(e) => handleChange('policy_numbers', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm h-24"
                    />
                  </div>
                )}

                {formData.request_type === 'all_accounts' && (
                  <div className="border-t pt-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={formData.account_individual_life || false} onChange={(e) => handleChange('account_individual_life', e.target.checked)} className="accent-amber-500" />
                      All Individual Life Insurance Policies
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={formData.account_group_life || false} onChange={(e) => handleChange('account_group_life', e.target.checked)} className="accent-amber-500" />
                      All Group Life Insurance Contracts
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={formData.account_mutual_fund || false} onChange={(e) => handleChange('account_mutual_fund', e.target.checked)} className="accent-amber-500" />
                      All Mutual Fund Accounts
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={formData.account_pre_need || false} onChange={(e) => handleChange('account_pre_need', e.target.checked)} className="accent-amber-500" />
                      All Pre-Need Plans
                    </label>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Policy Number</label>
                      <input
                        type="text"
                        value={formData.reference_policy_number || ''}
                        onChange={(e) => handleChange('reference_policy_number', e.target.value)}
                        className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Section C */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">C. Reason for Change</h2>

                <div className="mb-4">
                  <div className="flex gap-4 flex-col md:flex-row">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason_type"
                        checked={formData.reason_type === 'no_advisor'}
                        onChange={() => handleChange('reason_type', 'no_advisor')}
                        className="accent-amber-500"
                      />
                      <span className="text-sm">Current policy has no designated advisor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason_type"
                        checked={formData.reason_type === 'prefer_another'}
                        onChange={() => handleChange('reason_type', 'prefer_another')}
                        className="accent-amber-500"
                      />
                      <span className="text-sm">I prefer to be serviced by another advisor</span>
                    </label>
                  </div>
                </div>

                {formData.reason_type === 'prefer_another' && (
                  <div className="border-t pt-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reason Details / Explanation</label>
                    <textarea
                      value={formData.reason_details || ''}
                      onChange={(e) => handleChange('reason_details', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm h-24"
                    />
                  </div>
                )}
              </section>

              {/* Section D */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">D. New Advisor Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.new_advisor_last_name || ''}
                      onChange={(e) => handleChange('new_advisor_last_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.new_advisor_first_name || ''}
                      onChange={(e) => handleChange('new_advisor_first_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.new_advisor_middle_name || ''}
                      onChange={(e) => handleChange('new_advisor_middle_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section E */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">E. Signatures & Acknowledgments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Advisor Code Number</label>
                    <input
                      type="text"
                      value={formData.code_number || ''}
                      onChange={(e) => handleChange('code_number', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NBO / ISO</label>
                    <input
                      type="text"
                      value={formData.nbo_iso || ''}
                      onChange={(e) => handleChange('nbo_iso', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section F */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">F. Communication Preference</h2>

                <div className="mb-4">
                  <div className="flex gap-4 flex-col md:flex-row">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wants_communication"
                        checked={formData.wants_communication === true}
                        onChange={() => handleChange('wants_communication', true)}
                        className="accent-amber-500"
                      />
                      <span className="text-sm">Yes - I want to receive communication</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wants_communication"
                        checked={formData.wants_communication === false}
                        onChange={() => handleChange('wants_communication', false)}
                        className="accent-amber-500"
                      />
                      <span className="text-sm">No - I do not want to receive communication</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Section G */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b pb-2">G. For Office Use Only</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Received By (Staff Name)</label>
                    <input
                      type="text"
                      value={formData.received_by_staff || ''}
                      onChange={(e) => handleChange('received_by_staff', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Receiving Department / Office</label>
                    <input
                      type="text"
                      value={formData.receiving_department || ''}
                      onChange={(e) => handleChange('receiving_department', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date Received</label>
                    <input
                      type="date"
                      value={formData.date_received || ''}
                      onChange={(e) => handleChange('date_received', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Time Received</label>
                    <input
                      type="text"
                      value={formData.time_received || ''}
                      onChange={(e) => handleChange('time_received', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </section>

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
              <iframe key={pdfPreviewUrl} src={pdfPreviewUrl} className="w-full max-w-5xl h-full bg-white rounded-lg shadow-2xl" />
            ) : (
              <p className="text-white text-sm">Failed to load PDF preview.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
