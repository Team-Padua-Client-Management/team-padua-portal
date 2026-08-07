'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Download, Loader2, Eye, FileEdit, Plus, Trash2,
  User, Building2, AlertCircle, FileText, CheckCircle2, Info
} from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateBeneficiaryChangeRequestPdfFromTemplate } from '@src/features/client-servicing/pdf/generateBeneficiaryChangeRequestPdfFromTemplate';
import ClientServicingLayout from '@src/features/client-servicing/components/ClientServicingLayout';

interface BcrStandardFormProps {
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

export default function BcrStandardForm({
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
}: BcrStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('cpst_clients')
        .select('id, client_name, policy_number, birthdate, mobile_number, email, address, beneficiary')
        .order('client_name');
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

    if (!newClientId) return;

    const selectedClient = selectedClientFromSelector || clients.find(c => c.id === newClientId);
    if (!selectedClient) return;

    const clientName = selectedClient.client_name || '';

    let last = '';
    let first = '';
    let mi = '';

    if (clientName.includes(',')) {
      const [lastPart, restPart] = clientName.split(',').map((s: string) => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      last = lastPart || '';
      first = restWords[0] || '';
      mi = restWords.length > 1 ? restWords[restWords.length - 1].charAt(0) + '.' : '';
    } else {
      const words = clientName.trim().split(/\s+/);
      if (words.length === 1) {
        first = words[0];
      } else {
        last = words[words.length - 1];
        first = words[0];
        mi = words.length > 2 ? words[1].charAt(0) + '.' : '';
      }
    }

    setFormData(prev => ({
      ...prev,
      // Section A - General Info
      planholder_type: prev.planholder_type || 'individual',
      plan_numbers: selectedClient.policy_number || prev.plan_numbers || '',
      planholder_last_name: last,
      planholder_first_name: first,
      planholder_mi: mi,
      planholder_printed_name: clientName,
      company_name: prev.company_name || '',

      // Default Country and Citizenship
      beneficiary1_country_birth: prev.beneficiary1_country_birth || 'Philippines',
      beneficiary1_citizenships: prev.beneficiary1_citizenships || 'Filipino',
      beneficiary2_country_birth: prev.beneficiary2_country_birth || 'Philippines',
      beneficiary2_citizenships: prev.beneficiary2_citizenships || 'Filipino',

      // Section B.1 - Pre-fill beneficiary 1 from client's beneficiary field if available
      beneficiary1_name: selectedClient.beneficiary || prev.beneficiary1_name || '',
      beneficiary1_phone: selectedClient.mobile_number || prev.beneficiary1_phone || '',
      beneficiary1_address: selectedClient.address || prev.beneficiary1_address || '',

      // Section C - Default compliance
      compliance_type: prev.compliance_type || 'none',

      // Section D - Signatures
      place_of_signing: prev.place_of_signing || '',
      date_of_signing: prev.date_of_signing || new Date().toISOString().split('T')[0],
      wants_communication: prev.wants_communication !== undefined ? prev.wants_communication : true,
    }));
  };

  const handleViewModeChange = async (mode: 'form' | 'literal') => {
    setViewMode(mode);
    if (mode === 'literal') {
      setIsPreviewLoading(true);
      try {
        const pdfBytes = await generateBeneficiaryChangeRequestPdfFromTemplate(formData as any);
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

  const handleRelationshipSelect = (benKey: 'beneficiary1' | 'beneficiary2', val: string) => {
    setFormData(prev => {
      if (['Father', 'Mother', 'Employer'].includes(val)) {
        return {
          ...prev,
          [`${benKey}_relationship_select`]: val,
          [`${benKey}_relationship`]: val,
          [`${benKey}_relationship_others`]: '',
        };
      } else {
        return {
          ...prev,
          [`${benKey}_relationship_select`]: val,
          [`${benKey}_relationship`]: 'Others',
          [`${benKey}_relationship_others`]: ['Spouse', 'Child', 'Sibling'].includes(val) ? val : (prev[`${benKey}_relationship_others`] || ''),
        };
      }
    });
  };

  // Helper to extract active beneficiaries list for Section B.2 removal dropdown
  const selectedClientObj = clients.find(c => c.id === (formData.client_id || clientId));
  const activeBeneficiariesList: string[] = selectedClientObj?.beneficiary
    ? selectedClientObj.beneficiary.split(',').map((b: string) => b.trim()).filter(Boolean)
    : [];

  // Helper to detect if Irrevocable beneficiary consent is required
  const hasIrrevocableBeneficiary =
    formData.beneficiary1_designation === 'Irrevocable' ||
    formData.beneficiary2_designation === 'Irrevocable' ||
    formData.change_designation === 'Irrevocable' ||
    formData.change_company_company_designation === 'Irrevocable' ||
    formData.is_removing_irrevocable === true;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Top Action Bar / Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title="Back to List"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Beneficiary Change Request</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                SLFPI Form
              </span>
            </div>
            <p className="text-xs text-slate-500">Official Sun Life Financial Plans, Inc. Template Mirror</p>
          </div>
        </div>

        {/* View Mode Toggle: Standard Form vs PDF Literal Preview */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => handleViewModeChange('form')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'form'
              ? 'bg-white shadow text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <FileEdit size={14} /> Form Entry
          </button>
          <button
            onClick={() => handleViewModeChange('literal')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'literal'
              ? 'bg-white shadow text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Eye size={14} /> PDF Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSaveDraft(formData)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin text-amber-500" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => onExportPdf(formData)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Official PDF
          </button>
        </div>
      </header>

      {/* Main Container — Centralized Sidebar Layout */}
      <ClientServicingLayout
        selectedClient={formData.client_id || clientId || ''}
        onClientChange={handleClientSelectLocal}
      >
        {viewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-16">

              {/* ─── Client Selection & Status Header ────────────────────────────────────── */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="text-amber-500" size={20} />
                    <h2 className="text-base font-bold text-slate-900">Client Selection & Record Linking</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">System Database Context</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Client Record *</label>
                    <select
                      value={formData.client_id || clientId}
                      onChange={(e) => handleClientSelectLocal(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
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
                      value={formData.status || status || 'Pending'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors font-medium text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Auto-Filled Client Summary Badge */}
                {selectedClientObj && (
                  <div className="mt-5 p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-amber-600" /> Linked Client Records
                      </p>
                      <span className="text-[11px] text-amber-700 font-medium">Read-Only Source Values</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Full Name</span>
                        <p className="font-semibold text-slate-900">{selectedClientObj.client_name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Policy Number</span>
                        <p className="font-semibold text-slate-900">{selectedClientObj.policy_number || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Mobile Number</span>
                        <p className="font-semibold text-slate-900">{selectedClientObj.mobile_number || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Current Beneficiary</span>
                        <p className="font-semibold text-slate-900 truncate" title={selectedClientObj.beneficiary}>
                          {selectedClientObj.beneficiary || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ─── SECTION A: GENERAL INFORMATION ─────────────────────────────────────── */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-slate-900 text-white rounded">Section A</span>
                    <h2 className="text-base font-bold text-slate-900">General Information</h2>
                  </div>
                  <span className="text-xs text-slate-400">PDF Page 1</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Policy / Plan Number(s) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 0812345678"
                      value={formData.plan_numbers || ''}
                      onChange={(e) => handleChange('plan_numbers', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Planholder Type *</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleChange('planholder_type', 'individual')}
                        className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${(formData.planholder_type || 'individual') === 'individual'
                          ? 'bg-white shadow text-slate-900 font-bold'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        <User size={14} /> Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('planholder_type', 'company')}
                        className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${formData.planholder_type === 'company'
                          ? 'bg-white shadow text-slate-900 font-bold'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        <Building2 size={14} /> Company
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Inputs: Individual vs Company */}
                {(formData.planholder_type || 'individual') === 'individual' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.planholder_last_name || ''}
                        onChange={(e) => handleChange('planholder_last_name', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.planholder_first_name || ''}
                        onChange={(e) => handleChange('planholder_first_name', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Middle Initial / Name</label>
                      <input
                        type="text"
                        placeholder="M.I."
                        value={formData.planholder_mi || ''}
                        onChange={(e) => handleChange('planholder_mi', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Business Name *</label>
                    <input
                      type="text"
                      placeholder="Registered Corporate / Business Name"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm"
                    />
                  </div>
                )}
              </section>

              {/* ─── SECTION B: BENEFICIARY CHANGE DETAILS ────────────────────────────────── */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-slate-900 text-white rounded">Section B</span>
                    <h2 className="text-base font-bold text-slate-900">Beneficiary Change Details</h2>
                  </div>
                  <span className="text-xs text-slate-400">PDF Pages 1 & 2</span>
                </div>

                {/* Change Type Radio Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Select Request Action *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'add', label: 'Add Beneficiary(-ies)', desc: 'Section B.1 — Add new beneficiaries' },
                      { value: 'remove', label: 'Remove Beneficiary(-ies)', desc: 'Section B.2 — Revoke current beneficiaries' },
                      { value: 'change', label: 'Change Beneficiary Info', desc: 'Section B.3 — Update existing beneficiary details' },
                    ].map(opt => (
                      <label
                        key={opt.value}
                        className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${formData.change_type === opt.value
                          ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="change_type"
                            checked={formData.change_type === opt.value}
                            onChange={() => handleChange('change_type', opt.value)}
                            className="accent-amber-500"
                          />
                          <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 ml-5 mt-0.5">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ─── B.1 Add Beneficiary Dynamic Cards ─────────────────────────────────── */}
                {(formData.change_type === 'add' || !formData.change_type) && (
                  <div className="space-y-6 pt-2">

                    {/* Add Beneficiary #1 */}
                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs flex items-center justify-center font-bold">1</span>
                          B.1 — Add Beneficiary #1
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">Form Lines 2 - 11</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            2. Name (Last, First, Middle) / Company or Business Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Santos, Maria Clara Dela Cruz"
                            value={formData.beneficiary1_name || ''}
                            onChange={(e) => handleChange('beneficiary1_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">3. Sex (at birth)</label>
                          <select
                            value={formData.beneficiary1_sex || ''}
                            onChange={(e) => handleChange('beneficiary1_sex', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select —</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">4. Birthdate</label>
                          <input
                            type="date"
                            value={formData.beneficiary1_birthdate || ''}
                            onChange={(e) => handleChange('beneficiary1_birthdate', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">5. Country of Birth / Incorporation</label>
                          <input
                            type="text"
                            placeholder="e.g. Philippines"
                            value={formData.beneficiary1_country_birth || 'Philippines'}
                            onChange={(e) => handleChange('beneficiary1_country_birth', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">6. Citizenship(s) / Nationality</label>
                          <input
                            type="text"
                            placeholder="e.g. Filipino"
                            value={formData.beneficiary1_citizenships || 'Filipino'}
                            onChange={(e) => handleChange('beneficiary1_citizenships', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">7. Relationship to Planholder</label>
                          <select
                            value={formData.beneficiary1_relationship_select || (['Father', 'Mother', 'Employer'].includes(formData.beneficiary1_relationship) ? formData.beneficiary1_relationship : (formData.beneficiary1_relationship_others || (formData.beneficiary1_relationship === 'Others' ? 'Others' : '')))}
                            onChange={(e) => handleRelationshipSelect('beneficiary1', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select Relationship —</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child (Son/Daughter)</option>
                            <option value="Sibling">Sibling (Brother/Sister)</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Employer">Employer</option>
                            <option value="Others">Others (specify below)</option>
                          </select>
                          {(formData.beneficiary1_relationship === 'Others' || ['Spouse', 'Child', 'Sibling', 'Others'].includes(formData.beneficiary1_relationship_select)) && (
                            <input
                              type="text"
                              placeholder="Specify exact relationship"
                              value={formData.beneficiary1_relationship_others || ''}
                              onChange={(e) => handleChange('beneficiary1_relationship_others', e.target.value)}
                              className="w-full p-2 rounded-lg border border-slate-200 text-xs mt-2 bg-white"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">8. Beneficiary Type</label>
                          <select
                            value={formData.beneficiary1_type || 'Primary'}
                            onChange={(e) => handleChange('beneficiary1_type', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="Primary">Primary</option>
                            <option value="Contingent">Contingent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">9. Designation</label>
                          <select
                            value={formData.beneficiary1_designation || 'Revocable'}
                            onChange={(e) => handleChange('beneficiary1_designation', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="Revocable">Revocable</option>
                            <option value="Irrevocable">Irrevocable</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">10. Contact / Mobile Phone</label>
                          <input
                            type="text"
                            placeholder="e.g. 09171234567"
                            value={formData.beneficiary1_phone || ''}
                            onChange={(e) => handleChange('beneficiary1_phone', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">11. Address</label>
                          <input
                            type="text"
                            placeholder="Street, Barangay, City, Province, Country"
                            value={formData.beneficiary1_address || ''}
                            onChange={(e) => handleChange('beneficiary1_address', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add Beneficiary #2 */}
                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs flex items-center justify-center font-bold">2</span>
                          B.1 — Add Beneficiary #2 (Optional)
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">Form Lines 12 - 21 (PDF Page 2)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            12. Name (Last, First, Middle) / Company or Business Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Santos, Juan Cruz"
                            value={formData.beneficiary2_name || ''}
                            onChange={(e) => handleChange('beneficiary2_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">13. Sex (at birth)</label>
                          <select
                            value={formData.beneficiary2_sex || ''}
                            onChange={(e) => handleChange('beneficiary2_sex', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select —</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">14. Birthdate</label>
                          <input
                            type="date"
                            value={formData.beneficiary2_birthdate || ''}
                            onChange={(e) => handleChange('beneficiary2_birthdate', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">15. Country of Birth / Incorporation</label>
                          <input
                            type="text"
                            placeholder="e.g. Philippines"
                            value={formData.beneficiary2_country_birth || ''}
                            onChange={(e) => handleChange('beneficiary2_country_birth', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">16. Citizenship(s) / Nationality</label>
                          <input
                            type="text"
                            placeholder="e.g. Filipino"
                            value={formData.beneficiary2_citizenships || ''}
                            onChange={(e) => handleChange('beneficiary2_citizenships', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">17. Relationship to Planholder</label>
                          <select
                            value={formData.beneficiary2_relationship_select || (['Father', 'Mother', 'Employer'].includes(formData.beneficiary2_relationship) ? formData.beneficiary2_relationship : (formData.beneficiary2_relationship_others || (formData.beneficiary2_relationship === 'Others' ? 'Others' : '')))}
                            onChange={(e) => handleRelationshipSelect('beneficiary2', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select Relationship —</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child (Son/Daughter)</option>
                            <option value="Sibling">Sibling (Brother/Sister)</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Employer">Employer</option>
                            <option value="Others">Others (specify below)</option>
                          </select>
                          {(formData.beneficiary2_relationship === 'Others' || ['Spouse', 'Child', 'Sibling', 'Others'].includes(formData.beneficiary2_relationship_select)) && (
                            <input
                              type="text"
                              placeholder="Specify exact relationship"
                              value={formData.beneficiary2_relationship_others || ''}
                              onChange={(e) => handleChange('beneficiary2_relationship_others', e.target.value)}
                              className="w-full p-2 rounded-lg border border-slate-200 text-xs mt-2 bg-white"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">18. Beneficiary Type</label>
                          <select
                            value={formData.beneficiary2_type || ''}
                            onChange={(e) => handleChange('beneficiary2_type', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select —</option>
                            <option value="Primary">Primary</option>
                            <option value="Contingent">Contingent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">19. Designation</label>
                          <select
                            value={formData.beneficiary2_designation || ''}
                            onChange={(e) => handleChange('beneficiary2_designation', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select —</option>
                            <option value="Revocable">Revocable</option>
                            <option value="Irrevocable">Irrevocable</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">20. Contact / Mobile Phone</label>
                          <input
                            type="text"
                            placeholder="e.g. 09171234567"
                            value={formData.beneficiary2_phone || ''}
                            onChange={(e) => handleChange('beneficiary2_phone', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">21. Address</label>
                          <input
                            type="text"
                            placeholder="Street, Barangay, City, Province, Country"
                            value={formData.beneficiary2_address || ''}
                            onChange={(e) => handleChange('beneficiary2_address', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ─── B.2 Remove Beneficiary Selectors ──────────────────────────────────── */}
                {formData.change_type === 'remove' && (
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                    <h3 className="text-sm font-bold text-amber-800">B.2 — Remove Beneficiary(-ies)</h3>
                    <p className="text-xs text-slate-500">Select active beneficiaries to be removed from the policy contract.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">22. Beneficiary to Remove #1 *</label>
                        {activeBeneficiariesList.length > 0 ? (
                          <select
                            value={formData.remove_beneficiary1_name || ''}
                            onChange={(e) => handleChange('remove_beneficiary1_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select Beneficiary to Remove —</option>
                            {activeBeneficiariesList.map((bName: string, idx: number) => (
                              <option key={idx} value={bName}>{bName}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Type beneficiary name to remove"
                            value={formData.remove_beneficiary1_name || ''}
                            onChange={(e) => handleChange('remove_beneficiary1_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">23. Beneficiary to Remove #2 (Optional)</label>
                        {activeBeneficiariesList.length > 0 ? (
                          <select
                            value={formData.remove_beneficiary2_name || ''}
                            onChange={(e) => handleChange('remove_beneficiary2_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          >
                            <option value="">— Select Beneficiary to Remove —</option>
                            {activeBeneficiariesList.map((bName: string, idx: number) => (
                              <option key={idx} value={bName}>{bName}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Type second beneficiary name to remove"
                            value={formData.remove_beneficiary2_name || ''}
                            onChange={(e) => handleChange('remove_beneficiary2_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── B.3 Change Beneficiary Info Complete Field Options ───────────────── */}
                {formData.change_type === 'change' && (
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-5">
                    <h3 className="text-sm font-bold text-amber-800">B.3 — Change of Beneficiary Information</h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        24. Original Beneficiary Name (as it appears in policy agreement) *
                      </label>
                      <input
                        type="text"
                        placeholder="Current registered name in Sun Life records"
                        value={formData.change_original_name || ''}
                        onChange={(e) => handleChange('change_original_name', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                      />
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-xs font-bold text-slate-800 mb-3">Select items to update and enter new information:</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* 1. Name */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_name || false}
                              onChange={(e) => handleChange('check_name', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Change Name
                          </label>
                          {formData.check_name && (
                            <input
                              type="text"
                              placeholder="New Full Name"
                              value={formData.change_new_name || ''}
                              onChange={(e) => handleChange('change_new_name', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 2. Other Legal Names */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_new_other_legal_names || false}
                              onChange={(e) => handleChange('check_new_other_legal_names', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            New Other Legal Names
                          </label>
                          {formData.check_new_other_legal_names && (
                            <input
                              type="text"
                              placeholder="Aliases / Maiden Name"
                              value={formData.change_new_other_legal_names || ''}
                              onChange={(e) => handleChange('change_new_other_legal_names', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 3. Birthdate */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_birthdate || false}
                              onChange={(e) => handleChange('check_birthdate', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Birthdate
                          </label>
                          {formData.check_birthdate && (
                            <input
                              type="date"
                              value={formData.change_birthdate || ''}
                              onChange={(e) => handleChange('change_birthdate', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 4. Country of Birth */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_country_birth || false}
                              onChange={(e) => handleChange('check_country_birth', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Country of Birth
                          </label>
                          {formData.check_country_birth && (
                            <input
                              type="text"
                              placeholder="New Birth Country"
                              value={formData.change_country_birth || ''}
                              onChange={(e) => handleChange('change_country_birth', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 5. Citizenships */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_citizenships || false}
                              onChange={(e) => handleChange('check_citizenships', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Citizenships / Nationalities
                          </label>
                          {formData.check_citizenships && (
                            <input
                              type="text"
                              placeholder="New Citizenships"
                              value={formData.change_citizenships || ''}
                              onChange={(e) => handleChange('change_citizenships', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 6. Phone */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_phone || false}
                              onChange={(e) => handleChange('check_phone', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Phone / Mobile Number
                          </label>
                          {formData.check_phone && (
                            <input
                              type="text"
                              placeholder="New Phone Number"
                              value={formData.change_phone || ''}
                              onChange={(e) => handleChange('change_phone', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 7. Address */}
                        <div className="p-3 bg-white border rounded-lg space-y-2 md:col-span-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_address || false}
                              onChange={(e) => handleChange('check_address', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Residence Address
                          </label>
                          {formData.check_address && (
                            <input
                              type="text"
                              placeholder="New Address"
                              value={formData.change_address || ''}
                              onChange={(e) => handleChange('change_address', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            />
                          )}
                        </div>

                        {/* 8. Relationship */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_relationship || false}
                              onChange={(e) => handleChange('check_relationship', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Relationship
                          </label>
                          {formData.check_relationship && (
                            <select
                              value={formData.change_relationship || ''}
                              onChange={(e) => handleChange('change_relationship', e.target.value)}
                              className="w-full p-2 border rounded text-xs"
                            >
                              <option value="">— Select —</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Employer">Employer</option>
                              <option value="Others">Others</option>
                            </select>
                          )}
                        </div>

                        {/* 9. Designation */}
                        <div className="p-3 bg-white border rounded-lg space-y-2">
                          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.check_designation || false}
                              onChange={(e) => handleChange('check_designation', e.target.checked)}
                              className="accent-amber-500 rounded"
                            />
                            Designation (Revocable/Irrevocable)
                          </label>
                          {formData.check_designation && (
                            <div className="flex gap-4 pt-1">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="change_desig" checked={formData.change_designation === 'Revocable'} onChange={() => handleChange('change_designation', 'Revocable')} className="accent-amber-500" /> Revocable
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="change_desig" checked={formData.change_designation === 'Irrevocable'} onChange={() => handleChange('change_designation', 'Irrevocable')} className="accent-amber-500" /> Irrevocable
                              </label>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ─── SECTION C: TAX COMPLIANCE (FATCA / FOREIGN TAX DECLARATION) ─────────── */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-600 text-white rounded">Section C</span>
                    <h2 className="text-base font-bold text-slate-900">Tax Compliance Declaration</h2>
                  </div>
                  <span className="text-xs text-slate-400">PDF Page 3 • Regulatory Requirement</span>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60 text-xs text-slate-700 flex items-start gap-2">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Foreign Account Tax Compliance Act (FATCA) & Common Reporting Standard (CRS) Declaration. Select the legal tax status that applies to the planholder.
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Resident */}
                  <div className="p-3 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="compliance_type"
                        checked={formData.compliance_type === 'resident'}
                        onChange={() => handleChange('compliance_type', 'resident')}
                        className="accent-amber-500"
                      />
                      Yes, I am a citizen/national and a legal resident of a country other than the Philippines.
                    </label>
                    {formData.compliance_type === 'resident' && (
                      <div className="ml-6 pt-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Specify Country of Tax Residence *</label>
                        <input
                          type="text"
                          placeholder="e.g. United States, Canada, Australia"
                          value={formData.compliance_resident_country || ''}
                          onChange={(e) => handleChange('compliance_resident_country', e.target.value)}
                          className="w-full md:w-1/2 p-2 border rounded-lg text-sm bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Option 2: Citizen foreign, residing elsewhere */}
                  <div className="p-3 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="compliance_type"
                        checked={formData.compliance_type === 'citizen'}
                        onChange={() => handleChange('compliance_type', 'citizen')}
                        className="accent-amber-500"
                      />
                      Yes, I am a citizen/national of a foreign country, but reside in another country.
                    </label>
                    {formData.compliance_type === 'citizen' && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Specify Country of Citizenship *</label>
                          <input
                            type="text"
                            placeholder="Citizenship Country"
                            value={formData.compliance_citizen_country || ''}
                            onChange={(e) => handleChange('compliance_citizen_country', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Specify Country of Legal Residence *</label>
                          <input
                            type="text"
                            placeholder="Residence Country"
                            value={formData.compliance_legally_reside_country || ''}
                            onChange={(e) => handleChange('compliance_legally_reside_country', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 3: None */}
                  <div className="p-3 border rounded-xl bg-slate-50/50">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="compliance_type"
                        checked={formData.compliance_type === 'none'}
                        onChange={() => handleChange('compliance_type', 'none')}
                        className="accent-amber-500"
                      />
                      None of the above (Philippine Resident / Non-US Tax Person)
                    </label>
                  </div>
                </div>
              </section>

              {/* ─── SECTION D: SIGNATURES & CONSENTS ───────────────────────────────────── */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-slate-900 text-white rounded">Section D</span>
                    <h2 className="text-base font-bold text-slate-900">Signatures, Consents & Acknowledgments</h2>
                  </div>
                  <span className="text-xs text-slate-400">PDF Pages 3 & 4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Place of Signing *</label>
                    <input
                      type="text"
                      placeholder="e.g. Makati City"
                      value={formData.place_of_signing || ''}
                      onChange={(e) => handleChange('place_of_signing', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Signing *</label>
                    <input
                      type="date"
                      value={formData.date_of_signing || ''}
                      onChange={(e) => handleChange('date_of_signing', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Planholder Printed Name</label>
                    <input
                      type="text"
                      readOnly
                      value={formData.planholder_printed_name || `${formData.planholder_first_name || ''} ${formData.planholder_last_name || ''}`.trim()}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Witness Printed Name *</label>
                    <input
                      type="text"
                      placeholder="Full Name of Primary Witness"
                      value={formData.witness_name || ''}
                      onChange={(e) => handleChange('witness_name', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>

                {/* Company Signatories Block */}
                {formData.planholder_type === 'company' && (
                  <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Authorized Corporate Signatories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Authorized Signatory 1 Printed Name</label>
                        <input
                          type="text"
                          placeholder="Signatory 1 Name"
                          value={formData.company_signatory1_name || ''}
                          onChange={(e) => handleChange('company_signatory1_name', e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Authorized Signatory 2 Name & Title</label>
                        <input
                          type="text"
                          placeholder="Signatory 2 Name & Designation"
                          value={formData.company_signatory2_name_title || ''}
                          onChange={(e) => handleChange('company_signatory2_name_title', e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Irrevocable Beneficiary Consent Section (Page 4) */}
                {hasIrrevocableBeneficiary && (
                  <div className="p-4 border border-red-200 bg-red-50/60 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                      <span>PAGE 4 REQUIREMENT — Irrevocable Beneficiary Signed Consent Required</span>
                    </div>
                    <p className="text-xs text-red-700">
                      Under Philippine Insurance Law, altering or revoking an irrevocable beneficiary designation requires the explicit written consent of the irrevocable beneficiary.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Irrevocable Beneficiary Printed Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name of Irrevocable Beneficiary"
                          value={formData.irrevocable_ben1_name || ''}
                          onChange={(e) => handleChange('irrevocable_ben1_name', e.target.value)}
                          className="w-full p-2 border border-red-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Second Witness Printed Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name of Second Witness"
                          value={formData.witness2_name || ''}
                          onChange={(e) => handleChange('witness2_name', e.target.value)}
                          className="w-full p-2 border border-red-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Electronic Notices Preference */}
                <div className="border-t pt-3">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.wants_communication !== false}
                      onChange={(e) => handleChange('wants_communication', e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>
                      Yes, I consent to receive notices and electronic communications from Sun Life Financial Plans, Inc. via electronic mail / mobile.
                    </span>
                  </label>
                </div>
              </section>

            </div>
          </div>
        ) : (
          /* PDF Literal Display Container */
          <div className="flex-1 h-full relative bg-slate-900 flex flex-col items-center justify-center p-4">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 size={36} className="animate-spin text-amber-500" />
                <p className="text-sm font-medium">Generating Official Sun Life PDF Preview...</p>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full max-w-5xl h-full bg-white rounded-lg shadow-2xl border-0"
                title="Sun Life BCR PDF Preview"
              />
            ) : (
              <div className="text-center text-white space-y-2">
                <p className="text-sm">Unable to render PDF preview.</p>
                <button
                  onClick={() => handleViewModeChange('literal')}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-md text-xs font-bold"
                >
                  Retry PDF Generation
                </button>
              </div>
            )}
          </div>
        )}
      </ClientServicingLayout>
    </div>
  );
}
