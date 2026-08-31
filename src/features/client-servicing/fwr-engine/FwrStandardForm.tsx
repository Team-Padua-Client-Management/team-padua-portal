'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit, Upload } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateFundWithdrawalPdfFromTemplate } from '@src/features/client-servicing/pdf/generateFundWithdrawalPdfFromTemplate';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

interface FwrStandardFormProps {
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

function SignatureUploadInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (base64: string | null) => void;
  required?: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="h-12 w-28 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
            <img src={value} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
              Replace
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-slate-200 rounded-md hover:bg-red-50 transition-colors shadow-sm"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-300 bg-slate-50 hover:bg-white cursor-pointer transition-all text-center">
          <Upload className="w-5 h-5 text-slate-400 mb-1" />
          <span className="text-xs text-slate-600 font-medium">Upload Signature Image</span>
          <span className="text-[10px] text-slate-400">PNG, JPG, or JPEG</span>
          <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="hidden" />
        </label>
      )}
    </div>
  );
}

export default function FwrStandardForm({
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
}: FwrStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('cpst_clients')
        .select('id, client_name, policy_number, birthdate, mobile_number, email, address')
        .order('client_name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelectLocal = (newClientId: string) => {
    const selected = clients.find(c => c.id === newClientId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        client_id: newClientId,
        policy_owner: prev.policy_owner || selected.client_name,
        policy_number: prev.policy_number || selected.policy_number,
        contact_number: prev.contact_number || selected.mobile_number,
        email_address: prev.email_address || selected.email,
        owner_address: prev.owner_address || selected.address,
      }));
    } else {
      handleChange('client_id', newClientId);
    }
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
        console.error('Error generating PDF preview:', e);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const handleProofToggle = (type: string) => {
    const current = Array.isArray(formData.bank_proof_types) ? formData.bank_proof_types : [];
    if (current.includes(type)) {
      handleChange('bank_proof_types', current.filter((t: string) => t !== type));
    } else {
      handleChange('bank_proof_types', [...current, type]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top Bar Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Fund Withdrawal Request (FWR)</h1>
            <p className="text-xs text-slate-500">SLOCPI_Fund Withdrawal Standard Entry Form</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => onExportPdf(formData)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <ClientServicingLayout
        selectedClient={formData.client_id || clientId || ''}
        onClientChange={handleClientSelectLocal}
      >
        {viewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-16">

              {/* Status Indicator */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Request Status</h2>
                  <p className="text-xs text-slate-500">Current state of this Fund Withdrawal Request</p>
                </div>
                <select
                  value={formData.status || 'Pending'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="p-2.5 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-amber-500 outline-none transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </section>

              {/* SECTION 1: General Information */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">1</span>
                  <h2 className="text-base font-bold text-slate-900">General Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Owner (Last Name, First Name, M.I.) *</label>
                    <input
                      type="text"
                      value={formData.policy_owner || ''}
                      onChange={(e) => handleChange('policy_owner', e.target.value)}
                      placeholder="e.g. DELA CRUZ, JUAN A."
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Number *</label>
                    <input
                      type="text"
                      value={formData.policy_number || ''}
                      onChange={(e) => handleChange('policy_number', e.target.value)}
                      placeholder="e.g. 091234567"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Citizenship *</label>
                    <input
                      type="text"
                      value={formData.citizenship || ''}
                      onChange={(e) => handleChange('citizenship', e.target.value)}
                      placeholder="e.g. FILIPINO"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country/ies of Legal Residence (other than PH)</label>
                    <input
                      type="text"
                      value={formData.residence_countries || ''}
                      onChange={(e) => handleChange('residence_countries', e.target.value)}
                      placeholder="e.g. N/A"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Present Residence Address *</label>
                    <input
                      type="text"
                      value={formData.owner_address || ''}
                      onChange={(e) => handleChange('owner_address', e.target.value)}
                      placeholder="No., Street, Municipality/City, Province, Country, Zip Code"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Residence Address</label>
                    <input
                      type="text"
                      value={formData.permanent_address || ''}
                      onChange={(e) => handleChange('permanent_address', e.target.value)}
                      placeholder="Same as present if blank"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Address</label>
                    <input
                      type="text"
                      value={formData.work_address || ''}
                      onChange={(e) => handleChange('work_address', e.target.value)}
                      placeholder="Company Address"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Home Phone</label>
                    <input
                      type="text"
                      value={formData.home_phone || ''}
                      onChange={(e) => handleChange('home_phone', e.target.value)}
                      placeholder="e.g. 02-81234567"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Phone</label>
                    <input
                      type="text"
                      value={formData.work_phone || ''}
                      onChange={(e) => handleChange('work_phone', e.target.value)}
                      placeholder="e.g. 02-87654321"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                    <input
                      type="text"
                      value={formData.contact_number || ''}
                      onChange={(e) => handleChange('contact_number', e.target.value)}
                      placeholder="e.g. 09171234567"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email_address || ''}
                      onChange={(e) => handleChange('email_address', e.target.value)}
                      placeholder="e.g. client@email.com"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Life Insured (Last Name, First Name, M.I.) if different from Policy Owner</label>
                    <input
                      type="text"
                      value={formData.policy_insured || ''}
                      onChange={(e) => handleChange('policy_insured', e.target.value)}
                      placeholder="Leave blank if Policy Owner is the Life Insured"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2: Request Details */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">2</span>
                  <h2 className="text-base font-bold text-slate-900">Request Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                    <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="currency"
                          value="PHP"
                          checked={formData.currency !== 'USD'}
                          onChange={() => handleChange('currency', 'PHP')}
                          className="accent-amber-500"
                        />
                        Php (Philippine Peso)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="currency"
                          value="USD"
                          checked={formData.currency === 'USD'}
                          onChange={() => handleChange('currency', 'USD')}
                          className="accent-amber-500"
                        />
                        US $ (US Dollar)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Withdrawal Amount (in figures) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 10000.00"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount in Words</label>
                    <input
                      type="text"
                      value={formData.amount_in_words || ''}
                      onChange={(e) => handleChange('amount_in_words', e.target.value)}
                      placeholder="e.g. TEN THOUSAND PESOS ONLY"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Special Instructions (Specify for which Fund and corresponding amount)</label>
                    <textarea
                      value={formData.special_instructions || formData.comments || ''}
                      onChange={(e) => handleChange('special_instructions', e.target.value)}
                      rows={3}
                      placeholder="e.g. Withdraw PHP 5,000 from Equity Fund and PHP 5,000 from Opportunity Fund"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 3: Acknowledgement, Agreement & Signatures */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">3</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Acknowledgement, Agreement & Signatures (Page 2)</h2>
                    <p className="text-xs text-slate-500">Table 1 Primary Signatures & Table 2 Additional Signatures</p>
                  </div>
                </div>

                {/* Table 1: Primary Signatures */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Table 1 — Primary Signatures (Policy Owner & Primary Witness)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SignatureUploadInput
                      label="Signature of Policy Owner"
                      value={formData.signature_base64}
                      onChange={(b64) => handleChange('signature_base64', b64)}
                      required
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Owner Printed Name *</label>
                      <input
                        type="text"
                        value={formData.policy_owner_printed_name || formData.policy_owner || ''}
                        onChange={(e) => handleChange('policy_owner_printed_name', e.target.value)}
                        placeholder="Printed Full Name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>

                    <SignatureUploadInput
                      label="(New) Signature Specimen 1"
                      value={formData.specimen1_signature_base64}
                      onChange={(b64) => handleChange('specimen1_signature_base64', b64)}
                    />

                    <SignatureUploadInput
                      label="(New) Signature Specimen 2"
                      value={formData.specimen2_signature_base64}
                      onChange={(b64) => handleChange('specimen2_signature_base64', b64)}
                    />

                    <SignatureUploadInput
                      label="Signature of Witness"
                      value={formData.witness_signature_base64}
                      onChange={(b64) => handleChange('witness_signature_base64', b64)}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Witness Printed Name</label>
                      <input
                        type="text"
                        value={formData.witness_printed_name || ''}
                        onChange={(e) => handleChange('witness_printed_name', e.target.value)}
                        placeholder="Witness Printed Name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Address of Witness</label>
                      <input
                        type="text"
                        value={formData.witness_address || ''}
                        onChange={(e) => handleChange('witness_address', e.target.value)}
                        placeholder="If witness is Sun Life Advisor, write NBO & Advisor Code; if employee, write Client Service Center"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Signing *</label>
                      <input
                        type="text"
                        value={formData.place_of_signing || ''}
                        onChange={(e) => handleChange('place_of_signing', e.target.value)}
                        placeholder="e.g. MAKATI CITY"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Signing (Month - Day - Year) *</label>
                      <input
                        type="date"
                        value={formData.date_of_signing || ''}
                        onChange={(e) => handleChange('date_of_signing', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                      <span className="text-[11px] text-slate-400">Printed as Month - Day - Year (e.g. AUG - 27 - 2026)</span>
                    </div>
                  </div>
                </div>

                {/* Table 2: Additional Signatures */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Table 2 — Additional Signatures (Assignee, Irrevocable Beneficiaries & Witness 2)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <SignatureUploadInput
                      label="Signature of Assignee"
                      value={formData.assignee_signature_base64}
                      onChange={(b64) => handleChange('assignee_signature_base64', b64)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee Printed Name</label>
                      <input
                        type="text"
                        value={formData.assignee_printed_name || ''}
                        onChange={(e) => handleChange('assignee_printed_name', e.target.value)}
                        placeholder="Assignee Full Name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Signing (Assignee)</label>
                      <input
                        type="date"
                        value={formData.assignee_date_of_signing || ''}
                        onChange={(e) => handleChange('assignee_date_of_signing', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <SignatureUploadInput
                      label="Signature of Irrevocable Beneficiary 1"
                      value={formData.beneficiary1_signature_base64}
                      onChange={(b64) => handleChange('beneficiary1_signature_base64', b64)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary 1 Printed Name</label>
                      <input
                        type="text"
                        value={formData.beneficiary1_printed_name || ''}
                        onChange={(e) => handleChange('beneficiary1_printed_name', e.target.value)}
                        placeholder="Beneficiary 1 Full Name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Signing (Beneficiary 1)</label>
                      <input
                        type="date"
                        value={formData.beneficiary1_date_of_signing || ''}
                        onChange={(e) => handleChange('beneficiary1_date_of_signing', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <SignatureUploadInput
                      label="Signature of Irrevocable Beneficiary 2"
                      value={formData.beneficiary2_signature_base64}
                      onChange={(b64) => handleChange('beneficiary2_signature_base64', b64)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary 2 Printed Name</label>
                      <input
                        type="text"
                        value={formData.beneficiary2_printed_name || ''}
                        onChange={(e) => handleChange('beneficiary2_printed_name', e.target.value)}
                        placeholder="Beneficiary 2 Full Name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Signing (Beneficiary 2)</label>
                      <input
                        type="date"
                        value={formData.beneficiary2_date_of_signing || ''}
                        onChange={(e) => handleChange('beneficiary2_date_of_signing', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <SignatureUploadInput
                      label="Signature of Witness (Table 2)"
                      value={formData.witness2_signature_base64}
                      onChange={(b64) => handleChange('witness2_signature_base64', b64)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Witness 2 Printed Name</label>
                      <input
                        type="text"
                        value={formData.witness2_printed_name || ''}
                        onChange={(e) => handleChange('witness2_printed_name', e.target.value)}
                        placeholder="Witness 2 Printed Name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Address of Witness 2</label>
                      <input
                        type="text"
                        value={formData.witness2_address || ''}
                        onChange={(e) => handleChange('witness2_address', e.target.value)}
                        placeholder="Witness 2 Address"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Signing 2</label>
                      <input
                        type="text"
                        value={formData.place_of_signing_2 || ''}
                        onChange={(e) => handleChange('place_of_signing_2', e.target.value)}
                        placeholder="e.g. MAKATI CITY"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Signing 2 (Month - Day - Year)</label>
                      <input
                        type="date"
                        value={formData.date_of_signing_2 || ''}
                        onChange={(e) => handleChange('date_of_signing_2', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Notarization */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">4</span>
                  <h2 className="text-base font-bold text-slate-900">Notarization Details (If Signed Outside PH)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notary City / Jurisdiction</label>
                    <input
                      type="text"
                      value={formData.notary_city || ''}
                      onChange={(e) => handleChange('notary_city', e.target.value)}
                      placeholder="City of Notarization"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 5: Special Instruction (Payout Options & Banking Details) */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">5</span>
                  <h2 className="text-base font-bold text-slate-900">Special Instruction (Payout Options & Bank Details)</h2>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-semibold text-slate-700">Choose Payout Method:</label>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="payout_method"
                        value="check"
                        checked={!formData.payout_method || formData.payout_method === 'check'}
                        onChange={() => handleChange('payout_method', 'check')}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800 block">Check (Deposit to account only)</span>
                        <span className="text-xs text-slate-500">Official check payout issued to Policy Owner</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="payout_method"
                        value="demand_draft"
                        checked={formData.payout_method === 'demand_draft'}
                        onChange={() => handleChange('payout_method', 'demand_draft')}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-slate-800 block">RCBC Demand Draft (for US$ policy)</span>
                        {formData.payout_method === 'demand_draft' && (
                          <input
                            type="text"
                            value={formData.encashment_branch || ''}
                            onChange={(e) => handleChange('encashment_branch', e.target.value)}
                            placeholder="Branch Address for Encashment"
                            className="mt-2 w-full p-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-amber-500 outline-none"
                          />
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="payout_method"
                        value="telegraphic_transfer"
                        checked={formData.payout_method === 'telegraphic_transfer'}
                        onChange={() => handleChange('payout_method', 'telegraphic_transfer')}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800 block">Telegraphic Transfer — Credit to Account and/or Currency Conversion</span>
                        <span className="text-xs text-slate-500">Direct electronic transfer to local or overseas bank</span>
                      </div>
                    </label>
                  </div>

                  {/* Bank Account Fields */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name *</label>
                      <input
                        type="text"
                        value={formData.bank_account_name || ''}
                        onChange={(e) => handleChange('bank_account_name', e.target.value)}
                        placeholder="Must match Policy Owner name"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number *</label>
                      <input
                        type="text"
                        value={formData.bank_account_number || ''}
                        onChange={(e) => handleChange('bank_account_number', e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Name of Bank *</label>
                      <input
                        type="text"
                        value={formData.bank_name || ''}
                        onChange={(e) => handleChange('bank_name', e.target.value)}
                        placeholder="e.g. BDO / BPI / Metrobank"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Address of Bank</label>
                      <input
                        type="text"
                        value={formData.bank_address || ''}
                        onChange={(e) => handleChange('bank_address', e.target.value)}
                        placeholder="Branch location"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Proof of Bank Account */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Submit Proof of Bank Account (Mark applicable items):</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'statement', label: 'Bank Statement of Account' },
                        { key: 'passbook', label: 'First Page of Passbook' },
                        { key: 'deposit_cert', label: 'Certificate of Bank Deposit' },
                        { key: 'check', label: 'Check (with account name)' },
                        { key: 'atm_card', label: 'ATM Card (with account name & number)' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Array.isArray(formData.bank_proof_types) && formData.bank_proof_types.includes(item.key)}
                            onChange={() => handleProofToggle(item.key)}
                            className="rounded accent-amber-500"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
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
                <p className="text-sm">Generating Literal Display Preview...</p>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe src={pdfPreviewUrl} className="w-full max-w-5xl h-full bg-white rounded-lg shadow-2xl" />
            ) : (
              <p className="text-white text-sm">Failed to generate PDF preview.</p>
            )}
          </div>
        )}
      </ClientServicingLayout>
    </div>
  );
}
