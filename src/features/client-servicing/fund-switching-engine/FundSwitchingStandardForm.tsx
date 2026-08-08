'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit, PlusCircle, MinusCircle, X } from 'lucide-react';
import { generateFundSwitchingPdf } from '@src/features/client-servicing/pdf/generateFundSwitchingPdf';
import SignaturePad from '@src/components/ui/SignaturePad';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

export interface FundSwitchRow {
  from_fund: string;
  to_fund: string;
  switch_type: 'full' | 'partial' | '';
  amount: string;
  percentage: string;
}

export interface FutureAllocation {
  fund_name: string;
  percentage: string;
}

export interface FundSwitchingRecord {
  id?: string;
  client_id: string;
  status: string;

  policy_number: string;
  life_insured: string;
  citizenship: string;
  email_address: string;
  mobile_phone: string;
  home_phone: string;
  work_phone: string;
  present_address: string;
  permanent_address: string;
  work_address: string;
  country_of_legal_residence: string;

  fund_switch_rows: FundSwitchRow[];
  future_peso_allocations: FutureAllocation[];
  future_dollar_allocations: FutureAllocation[];

  excess_premium_option: 'add' | 'change' | 'cancel' | '';
  excess_currency: 'PHP' | 'USD' | '';
  excess_amount: string;

  place_of_signing: string;
  date_of_signing: string;
  policy_owner_signature: string;
  witness_signature: string;
  witness_name: string;
  witness_address: string;
  assignee_signature: string;
  beneficiary_signature: string;
}

interface FundSwitchingStandardFormProps {
  initialValues: FundSwitchingRecord;
  clientId: string;
  selectedClientDetails: any;
  status: string;
  onBack: () => void;
  onClientSelect: (clientId: string) => void;
  onSaveDraft: (values: FundSwitchingRecord) => void;
  onExportPdf: (values: FundSwitchingRecord) => void;
  isSubmitting: boolean;
  isGeneratingPdf: boolean;
}

const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200";
const inputDisabledClass = "w-full px-4 py-2.5 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed";
const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";
const cardClass = "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm";

export default function FundSwitchingStandardForm({
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
}: FundSwitchingStandardFormProps) {
  const [formData, setFormData] = useState<FundSwitchingRecord>(initialValues);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getClientNameParts = (fullName: string | undefined | null) => {
    if (!fullName) return { last: '', first: '', middle: '' };

    if (fullName.includes(',')) {
      const [lastPart, restPart] = fullName.split(',').map(s => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      const first = restWords[0] || '';
      const middle = restWords.slice(1).join(' ');
      return { last: lastPart, first, middle };
    } else {
      const words = fullName.trim().split(/\s+/);
      if (words.length === 1) return { last: '', first: words[0], middle: '' };
      if (words.length === 2) return { last: words[1], first: words[0], middle: '' };
      return { last: words[words.length - 1], first: words[0], middle: words.slice(1, -1).join(' ') };
    }
  };

  const handleClientSelectLocal = (newClientId: string, selectedClientFromSelector?: any) => {
    handleChange('client_id', newClientId);
    onClientSelect(newClientId);
  };

  const handleViewModeChange = async (mode: 'form' | 'literal') => {
    setViewMode(mode);
    if (mode === 'literal') {
      setIsPreviewLoading(true);
      try {
        const ownerName = getClientNameParts(selectedClientDetails?.client_name);
        const ownerDob = selectedClientDetails?.birthdate || '';
        const pdfBytes = await generateFundSwitchingPdf(formData as any, ownerName, ownerDob);
        const blob = new Blob([new Uint8Array(pdfBytes as any)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      } catch (e) {
        console.error(e);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const clientNameParts = getClientNameParts(selectedClientDetails?.client_name);

  const updateRow = (idx: number, field: keyof FundSwitchRow, val: string) => {
    const newRows = [...formData.fund_switch_rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    handleChange('fund_switch_rows', newRows);
  };
  const addRow = () => {
    handleChange('fund_switch_rows', [...formData.fund_switch_rows, { from_fund: '', to_fund: '', switch_type: '', amount: '', percentage: '' }]);
  };
  const removeRow = (idx: number) => {
    const newRows = formData.fund_switch_rows.filter((_, i) => i !== idx);
    handleChange('fund_switch_rows', newRows);
  };

  const updatePesoRow = (idx: number, field: keyof FutureAllocation, val: string) => {
    const newRows = [...formData.future_peso_allocations];
    newRows[idx] = { ...newRows[idx], [field]: val };
    handleChange('future_peso_allocations', newRows);
  };
  const addPesoRow = () => {
    handleChange('future_peso_allocations', [...formData.future_peso_allocations, { fund_name: '', percentage: '' }]);
  };
  const removePesoRow = (idx: number) => {
    const newRows = formData.future_peso_allocations.filter((_, i) => i !== idx);
    handleChange('future_peso_allocations', newRows);
  };

  const updateDollarRow = (idx: number, field: keyof FutureAllocation, val: string) => {
    const newRows = [...formData.future_dollar_allocations];
    newRows[idx] = { ...newRows[idx], [field]: val };
    handleChange('future_dollar_allocations', newRows);
  };
  const addDollarRow = () => {
    handleChange('future_dollar_allocations', [...formData.future_dollar_allocations, { fund_name: '', percentage: '' }]);
  };
  const removeDollarRow = (idx: number) => {
    const newRows = formData.future_dollar_allocations.filter((_, i) => i !== idx);
    handleChange('future_dollar_allocations', newRows);
  };

  const calculateTotal = (rows: FutureAllocation[]) => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.percentage) || 0), 0);
  };
  const pesoTotal = calculateTotal(formData.future_peso_allocations);
  const dollarTotal = calculateTotal(formData.future_dollar_allocations);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Fund Switching</h1>
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

      <ClientServicingLayout
        selectedClient={formData.client_id || clientId || ''}
        onClientChange={handleClientSelectLocal}
      >
        {viewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">

              <div className={cardClass}>
                <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-2">Client Selection & Request Status</h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Request Status</label>
                  <select
                    value={formData.status || 'Pending'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {formData.client_id && (
                <>
                  <div className={cardClass}>
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">1. General Information</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className={labelClass}>Policy Owner (Last Name)</label>
                          <input type="text" value={clientNameParts.last} disabled className={inputDisabledClass} />
                        </div>
                        <div>
                          <label className={labelClass}>First Name</label>
                          <input type="text" value={clientNameParts.first} disabled className={inputDisabledClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Middle Name</label>
                          <input type="text" value={clientNameParts.middle} disabled className={inputDisabledClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Policy Number</label>
                          <input type="text" value={formData.policy_number} onChange={e => handleChange('policy_number', e.target.value)} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Life Insured</label>
                          <input type="text" value={formData.life_insured} onChange={e => handleChange('life_insured', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Citizenship</label>
                          <input type="text" value={formData.citizenship} onChange={e => handleChange('citizenship', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input type="text" value={formData.email_address} onChange={e => handleChange('email_address', e.target.value)} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Mobile Phone</label>
                          <input type="text" value={formData.mobile_phone} onChange={e => handleChange('mobile_phone', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Home Phone</label>
                          <input type="text" value={formData.home_phone} onChange={e => handleChange('home_phone', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Work Phone</label>
                          <input type="text" value={formData.work_phone} onChange={e => handleChange('work_phone', e.target.value)} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Present Address</label>
                          <textarea value={formData.present_address} onChange={e => handleChange('present_address', e.target.value)} className={inputClass} rows={2} />
                        </div>
                        <div>
                          <label className={labelClass}>Permanent Address</label>
                          <textarea value={formData.permanent_address} onChange={e => handleChange('permanent_address', e.target.value)} className={inputClass} rows={2} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Work Address</label>
                          <textarea value={formData.work_address} onChange={e => handleChange('work_address', e.target.value)} className={inputClass} rows={2} />
                        </div>
                        <div>
                          <label className={labelClass}>Country of Legal Residence</label>
                          <input type="text" value={formData.country_of_legal_residence} onChange={e => handleChange('country_of_legal_residence', e.target.value)} className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">2. Fund Switching Details</h2>
                    <div className="space-y-4">
                      {formData.fund_switch_rows.map((row, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className={labelClass}>Switch From Fund</label>
                              <input type="text" value={row.from_fund} onChange={e => updateRow(idx, 'from_fund', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Switch To Fund</label>
                              <input type="text" value={row.to_fund} onChange={e => updateRow(idx, 'to_fund', e.target.value)} className={inputClass} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div>
                              <label className={labelClass}>Switch Type</label>
                              <select value={row.switch_type} onChange={e => updateRow(idx, 'switch_type', e.target.value as any)} className={inputClass}>
                                <option value="">Select...</option>
                                <option value="full">Full</option>
                                <option value="partial">Partial</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Amount</label>
                              <input type="text" value={row.amount} onChange={e => updateRow(idx, 'amount', e.target.value)} disabled={row.switch_type === 'full'} className={row.switch_type === 'full' ? inputDisabledClass : inputClass} placeholder="For partial only" />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className={labelClass}>Percentage (%)</label>
                                <input type="number" max="100" min="0" value={row.percentage} onChange={e => updateRow(idx, 'percentage', e.target.value)} disabled={row.switch_type === 'full'} className={row.switch_type === 'full' ? inputDisabledClass : inputClass} placeholder="For partial only" />
                              </div>
                              {formData.fund_switch_rows.length > 1 && (
                                <button type="button" onClick={() => removeRow(idx)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full mb-1">
                                  <MinusCircle size={20} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 p-2">
                        <PlusCircle size={16} /> Add another switch row
                      </button>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">3. Future Fund Allocation</h2>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Peso Funds</h4>
                        <div className="space-y-3">
                          {formData.future_peso_allocations.map((row, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <div className="flex-1">
                                <input type="text" value={row.fund_name} onChange={e => updatePesoRow(idx, 'fund_name', e.target.value)} placeholder="Fund Name" className={inputClass} />
                              </div>
                              <div className="w-32">
                                <div className="relative">
                                  <input type="number" min="0" max="100" value={row.percentage} onChange={e => updatePesoRow(idx, 'percentage', e.target.value)} placeholder="%" className={inputClass} />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                              </div>
                              {formData.future_peso_allocations.length > 1 ? (
                                <button type="button" onClick={() => removePesoRow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                  <X size={16} />
                                </button>
                              ) : <div className="w-8"></div>}
                            </div>
                          ))}
                          <div className="flex justify-between items-center px-2">
                            <button type="button" onClick={addPesoRow} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700">
                              <PlusCircle size={14} /> Add Peso Fund
                            </button>
                            <span className={`text-sm font-bold ${pesoTotal === 100 || pesoTotal === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              Total: {pesoTotal}% {pesoTotal > 0 && pesoTotal !== 100 && '(Must equal 100%)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Dollar Funds</h4>
                        <div className="space-y-3">
                          {formData.future_dollar_allocations.map((row, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <div className="flex-1">
                                <input type="text" value={row.fund_name} onChange={e => updateDollarRow(idx, 'fund_name', e.target.value)} placeholder="Fund Name" className={inputClass} />
                              </div>
                              <div className="w-32">
                                <div className="relative">
                                  <input type="number" min="0" max="100" value={row.percentage} onChange={e => updateDollarRow(idx, 'percentage', e.target.value)} placeholder="%" className={inputClass} />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                              </div>
                              {formData.future_dollar_allocations.length > 1 ? (
                                <button type="button" onClick={() => removeDollarRow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                  <X size={16} />
                                </button>
                              ) : <div className="w-8"></div>}
                            </div>
                          ))}
                          <div className="flex justify-between items-center px-2">
                            <button type="button" onClick={addDollarRow} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700">
                              <PlusCircle size={14} /> Add Dollar Fund
                            </button>
                            <span className={`text-sm font-bold ${dollarTotal === 100 || dollarTotal === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              Total: {dollarTotal}% {dollarTotal > 0 && dollarTotal !== 100 && '(Must equal 100%)'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className={cardClass}>
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">4. Excess Premium Changes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer ${formData.excess_premium_option === 'add' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <input type="radio" name="excess_premium_option" checked={formData.excess_premium_option === 'add'} onChange={() => handleChange('excess_premium_option', 'add')} className="accent-amber-500" />
                          <span className="text-sm text-slate-900">Add To Regular Premium</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer ${formData.excess_premium_option === 'change' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <input type="radio" name="excess_premium_option" checked={formData.excess_premium_option === 'change'} onChange={() => handleChange('excess_premium_option', 'change')} className="accent-amber-500" />
                          <span className="text-sm text-slate-900">Change Existing Excess Premium</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer ${formData.excess_premium_option === 'cancel' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <input type="radio" name="excess_premium_option" checked={formData.excess_premium_option === 'cancel'} onChange={() => { handleChange('excess_premium_option', 'cancel'); handleChange('excess_amount', ''); handleChange('excess_currency', ''); }} className="accent-amber-500" />
                          <span className="text-sm text-slate-900">Cancel Excess Premium</span>
                        </label>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className={labelClass}>Currency & Amount</label>
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="excess_currency" checked={formData.excess_currency === 'PHP'} onChange={() => handleChange('excess_currency', 'PHP')} disabled={formData.excess_premium_option === 'cancel'} className="accent-amber-500" />
                            <span className="text-sm text-slate-700">PHP</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="excess_currency" checked={formData.excess_currency === 'USD'} onChange={() => handleChange('excess_currency', 'USD')} disabled={formData.excess_premium_option === 'cancel'} className="accent-amber-500" />
                            <span className="text-sm text-slate-700">USD</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={formData.excess_amount}
                          onChange={e => handleChange('excess_amount', e.target.value)}
                          disabled={formData.excess_premium_option === 'cancel'}
                          placeholder="Amount"
                          className={formData.excess_premium_option === 'cancel' ? inputDisabledClass : inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h2 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">5. Acknowledgement & Signatures</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className={labelClass}>Place of Signing</label>
                        <input type="text" value={formData.place_of_signing} onChange={e => handleChange('place_of_signing', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Date of Signing</label>
                        <input type="date" value={formData.date_of_signing} onChange={e => handleChange('date_of_signing', e.target.value)} className={inputClass} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <label className={labelClass}>Signature of Policy Owner</label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.policy_owner_signature}
                            onSignatureChange={(data: string | null) => handleChange('policy_owner_signature', data || '')}
                            title="Policy Owner Signature"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Signature of Witness</label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.witness_signature}
                            onSignatureChange={(data: string | null) => handleChange('witness_signature', data || '')}
                            title="Witness Signature"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3 mt-4">
                          <div>
                            <input type="text" value={formData.witness_name} onChange={e => handleChange('witness_name', e.target.value)} className={inputClass} placeholder="Witness Name" />
                          </div>
                          <div>
                            <input type="text" value={formData.witness_address} onChange={e => handleChange('witness_address', e.target.value)} className={inputClass} placeholder="Witness Address" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className={labelClass}>Signature of Assignee</label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.assignee_signature}
                            onSignatureChange={(data: string | null) => handleChange('assignee_signature', data || '')}
                            title="Assignee Signature"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Signature of Beneficiary</label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-hidden">
                          <SignaturePad
                            initialSignature={formData.beneficiary_signature}
                            onSignatureChange={(data: string | null) => handleChange('beneficiary_signature', data || '')}
                            title="Beneficiary Signature"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
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
