'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Download, Loader2, Eye, FileEdit, Upload
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

  const uppercaseFields = [
    'plan_numbers',
    'planholder_last_name',
    'planholder_first_name',
    'planholder_mi',
    'planholder_printed_name',
    'beneficiary1_name',
    'beneficiary1_country_birth',
    'beneficiary1_citizenships',
    'beneficiary1_relationship_others',
    'beneficiary1_phone',
    'beneficiary1_address',
    'beneficiary2_name',
    'beneficiary2_country_birth',
    'beneficiary2_citizenships',
    'beneficiary2_relationship_others',
    'beneficiary2_phone',
    'beneficiary2_address',
    'remove_beneficiary1_name',
    'remove_beneficiary2_name',
    'change_original_name',
    'change_new_name',
    'change_new_other_legal_names',
    'change_country_birth',
    'change_citizenships',
    'change_phone',
    'change_address',
    'change_relationship_others',
    'compliance_resident_country',
    'compliance_citizen_country',
    'compliance_legally_reside_country',
    'place_of_signing',
    'witness_name',
    'irrevocable_ben1_name',
    'irrevocable_ben1_witness_name',
    'witness2_name',
  ];

  const handleChange = (field: string, value: any) => {
    const normalizedValue =
      uppercaseFields.includes(field) && typeof value === 'string'
        ? value.toUpperCase()
        : value;

    setFormData(prev => ({ ...prev, [field]: normalizedValue }));
  };

  const handleClientSelectLocal = async (newClientId: string, selectedClientFromSelector?: any) => {
    handleChange('client_id', newClientId);
    onClientSelect(newClientId);

    if (!newClientId) return;

    const selectedClient = selectedClientFromSelector || clients.find(c => c.id === newClientId);
    if (!selectedClient) return;

    const clientName = (selectedClient.client_name || '').toUpperCase();

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
      plan_numbers: (selectedClient.policy_number || prev.plan_numbers || '').toUpperCase(),
      planholder_last_name: last,
      planholder_first_name: first,
      planholder_mi: mi,
      planholder_printed_name: clientName,

      beneficiary1_country_birth: (prev.beneficiary1_country_birth || 'PHILIPPINES').toUpperCase(),
      beneficiary1_citizenships: (prev.beneficiary1_citizenships || 'FILIPINO').toUpperCase(),
      beneficiary2_country_birth: (prev.beneficiary2_country_birth || 'PHILIPPINES').toUpperCase(),
      beneficiary2_citizenships: (prev.beneficiary2_citizenships || 'FILIPINO').toUpperCase(),

      beneficiary1_name: (selectedClient.beneficiary || prev.beneficiary1_name || '').toUpperCase(),
      beneficiary1_phone: (selectedClient.mobile_number || prev.beneficiary1_phone || '').toUpperCase(),
      beneficiary1_address: (selectedClient.address || prev.beneficiary1_address || '').toUpperCase(),

      compliance_type: prev.compliance_type || 'none',

      place_of_signing: (prev.place_of_signing || '').toUpperCase(),
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
          [`${benKey}_relationship_others`]: ['Spouse', 'Child', 'Sibling'].includes(val) ? val.toUpperCase() : (prev[`${benKey}_relationship_others`] || '').toUpperCase(),
        };
      }
    });
  };

  const selectedClientObj = clients.find(c => c.id === (formData.client_id || clientId));
  const activeBeneficiariesList: string[] = selectedClientObj?.beneficiary
    ? selectedClientObj.beneficiary.split(',').map((b: string) => b.trim()).filter(Boolean)
    : [];

  const hasIrrevocableBeneficiary =
    formData.beneficiary1_designation === 'Irrevocable' ||
    formData.beneficiary2_designation === 'Irrevocable' ||
    formData.change_designation === 'Irrevocable' ||
    formData.is_removing_irrevocable === true;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header Bar */}
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
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Beneficiary Change Request</h1>
            <p className="text-xs text-slate-500">Standard Form View</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => handleViewModeChange('form')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'form' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <FileEdit size={14} /> Form Entry
            </button>
            <button
              onClick={() => handleViewModeChange('literal')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'literal' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Eye size={14} /> PDF Preview
            </button>
          </div>
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
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Filled PDF
          </button>
        </div>
      </header>

      {/* Main Container */}
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
              {/* Request Status */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Request Status</h3>
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
              </section>

              {formData.client_id && (
                <>
                  {/* Section A */}
                  <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">A. General Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Policy / Plan Number(s) *</label>
                        <input
                          type="text"
                          placeholder="e.g. 0812345678"
                          value={formData.plan_numbers || ''}
                          onChange={(e) => handleChange('plan_numbers', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={formData.planholder_last_name || ''}
                          onChange={(e) => handleChange('planholder_last_name', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={formData.planholder_first_name || ''}
                          onChange={(e) => handleChange('planholder_first_name', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Middle Initial / Name</label>
                        <input
                          type="text"
                          placeholder="M.I."
                          value={formData.planholder_mi || ''}
                          onChange={(e) => handleChange('planholder_mi', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section B */}
                  <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                    <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">B. Beneficiary Change Details</h2>

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
                              ? 'border-amber-500 bg-amber-50/30 ring-1 ring-amber-500'
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

                    {/* B.1 Add Beneficiary */}
                    {(formData.change_type === 'add' || !formData.change_type) && (
                      <div className="space-y-6 pt-2">
                        {/* Beneficiary #1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            B.1 — Add Beneficiary #1
                          </h3>

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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
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
                                value={formData.beneficiary1_country_birth || 'PHILIPPINES'}
                                onChange={(e) => handleChange('beneficiary1_country_birth', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">6. Citizenship(s) / Nationality</label>
                              <input
                                type="text"
                                placeholder="e.g. Filipino"
                                value={formData.beneficiary1_citizenships || 'FILIPINO'}
                                onChange={(e) => handleChange('beneficiary1_citizenships', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
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
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs mt-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">11. Address</label>
                              <input
                                type="text"
                                placeholder="Street, Barangay, City, Province, Country"
                                value={formData.beneficiary1_address || ''}
                                onChange={(e) => handleChange('beneficiary1_address', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Beneficiary #2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            B.1 — Add Beneficiary #2 (Optional)
                          </h3>

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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">16. Citizenship(s) / Nationality</label>
                              <input
                                type="text"
                                placeholder="e.g. Filipino"
                                value={formData.beneficiary2_citizenships || ''}
                                onChange={(e) => handleChange('beneficiary2_citizenships', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
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
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs mt-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">21. Address</label>
                              <input
                                type="text"
                                placeholder="Street, Barangay, City, Province, Country"
                                value={formData.beneficiary2_address || ''}
                                onChange={(e) => handleChange('beneficiary2_address', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* B.2 Remove Beneficiary */}
                    {formData.change_type === 'remove' && (
                      <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">B.2 — Remove Beneficiary(-ies)</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">22. Beneficiary to Remove #1 *</label>
                            {activeBeneficiariesList.length > 0 ? (
                              <select
                                value={formData.remove_beneficiary1_name || ''}
                                onChange={(e) => handleChange('remove_beneficiary1_name', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white uppercase"
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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">23. Beneficiary to Remove #2 (Optional)</label>
                            {activeBeneficiariesList.length > 0 ? (
                              <select
                                value={formData.remove_beneficiary2_name || ''}
                                onChange={(e) => handleChange('remove_beneficiary2_name', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white uppercase"
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
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* B.3 Change Beneficiary Info */}
                    {formData.change_type === 'change' && (
                      <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-5">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">B.3 — Change of Beneficiary Information</h3>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            24. Original Beneficiary Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Current registered name in Sun Life records"
                            value={formData.change_original_name || ''}
                            onChange={(e) => handleChange('change_original_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase bg-white"
                          />
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs font-bold text-slate-800 mb-3">Select items to update and enter new information:</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                                />
                              )}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                                />
                              )}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs"
                                />
                              )}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                                />
                              )}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                                />
                              )}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                                />
                              )}
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 md:col-span-2">
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
                                  className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Section C */}
                  <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">C. Compliance with Regulatory Requirements</h2>
                      <p className="text-xs text-slate-500 mt-1">Foreign Account Tax Compliance Act (FATCA) & Common Reporting Standard (CRS) Declaration.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
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
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Country of Tax Residence *</label>
                            <input
                              type="text"
                              placeholder="e.g. United States, Canada"
                              value={formData.compliance_resident_country || ''}
                              onChange={(e) => handleChange('compliance_resident_country', e.target.value)}
                              className="w-full md:w-1/2 p-2 border border-slate-200 rounded-lg text-xs uppercase bg-white"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
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
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Country of Citizenship *</label>
                              <input
                                type="text"
                                placeholder="Citizenship Country"
                                value={formData.compliance_citizen_country || ''}
                                onChange={(e) => handleChange('compliance_citizen_country', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-xs uppercase bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Country of Legal Residence *</label>
                              <input
                                type="text"
                                placeholder="Residence Country"
                                value={formData.compliance_legally_reside_country || ''}
                                onChange={(e) => handleChange('compliance_legally_reside_country', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-xs uppercase bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
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

                  {/* Section D */}
                  <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                      D. SIGNATURES, CONSENTS & ACKNOWLEDGMENTS
                    </h2>

                    {/* Primary Signatures */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Signatures</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Place of Signing *</label>
                          <input
                            type="text"
                            placeholder="CITY / PROVINCE"
                            value={formData.place_of_signing || ''}
                            onChange={(e) => handleChange('place_of_signing', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Signing *</label>
                          <input
                            type="date"
                            value={formData.date_of_signing || ''}
                            onChange={(e) => handleChange('date_of_signing', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Planholder Printed Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={formData.planholder_printed_name || `${formData.planholder_first_name || ''} ${formData.planholder_last_name || ''}`.trim()}
                            onChange={(e) => handleChange('planholder_printed_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                          />
                        </div>
                        <SignatureUploadInput
                          label="Upload Planholder Signature"
                          value={formData.planholder_signature}
                          onChange={(base64) => handleChange('planholder_signature', base64)}
                          required
                        />

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Witness Printed Name *</label>
                          <input
                            type="text"
                            placeholder="Full Name of Primary Witness"
                            value={formData.witness_name || ''}
                            onChange={(e) => handleChange('witness_name', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                          />
                        </div>
                        <SignatureUploadInput
                          label="Upload Primary Witness Signature"
                          value={formData.witness_signature}
                          onChange={(base64) => handleChange('witness_signature', base64)}
                        />
                      </div>
                    </div>

                    {/* Irrevocable Beneficiary Consent Block */}
                    {hasIrrevocableBeneficiary && (
                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Irrevocable Beneficiary Consent & Witnesses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Irrevocable Beneficiary Printed Name *</label>
                            <input
                              type="text"
                              placeholder="Full Name of Irrevocable Beneficiary"
                              value={formData.irrevocable_ben1_name || ''}
                              onChange={(e) => handleChange('irrevocable_ben1_name', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                            />
                          </div>
                          <SignatureUploadInput
                            label="Upload Irrevocable Beneficiary Signature"
                            value={formData.irrevocable_ben1_signature}
                            onChange={(base64) => handleChange('irrevocable_ben1_signature', base64)}
                          />

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Irrevocable Witness Printed Name</label>
                            <input
                              type="text"
                              placeholder="Full Name of Witness"
                              value={formData.irrevocable_ben1_witness_name || ''}
                              onChange={(e) => handleChange('irrevocable_ben1_witness_name', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                            />
                          </div>
                          <SignatureUploadInput
                            label="Upload Witness Signature"
                            value={formData.irrevocable_ben1_witness_signature}
                            onChange={(base64) => handleChange('irrevocable_ben1_witness_signature', base64)}
                          />

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Second Witness Printed Name *</label>
                            <input
                              type="text"
                              placeholder="Full Name of Second Witness"
                              value={formData.witness2_name || ''}
                              onChange={(e) => handleChange('witness2_name', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                            />
                          </div>
                          <SignatureUploadInput
                            label="Upload Second Witness Signature"
                            value={formData.witness2_signature || formData.irrevocable_witness2_signature}
                            onChange={(base64) => {
                              handleChange('witness2_signature', base64);
                              handleChange('irrevocable_witness2_signature', base64);
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Electronic Notices */}
                    <div className="border-t border-slate-100 pt-4">
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
                </>
              )}
            </div>
          )}
        </div>
      </ClientServicingLayout>
    </div>
  );
}
