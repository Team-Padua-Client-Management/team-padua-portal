'use client';

import React, { useState } from 'react';
import {
  FormSectionConfig,
  PdfFieldConfig,
  FieldValueMap,
  ValidationItem,
} from './types';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileText,
  PenTool,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import ClientSelector from '@/app/components/shared/ClientSelector';

interface PdfSidebarProps {
  sections: FormSectionConfig[];
  fields: PdfFieldConfig[];
  values: FieldValueMap;
  activeFieldKey: string | null;
  clientId: string;
  selectedClientDetails: {
    client_name: string;
    birthdate: string | null;
    policy_number: string | null;
  } | null;
  theme?: 'light' | 'dark';
  onClientSelect: (clientId: string) => void;
  onFieldSelect: (field: PdfFieldConfig) => void;
  onChangeValue: (key: string, value: any) => void;
  onOpenSignatureModal: (field: PdfFieldConfig) => void;
  onPageSelect?: (page: number) => void;
}

export default function PdfSidebar({
  sections,
  fields,
  values,
  activeFieldKey,
  clientId,
  selectedClientDetails,
  theme = 'light',
  onClientSelect,
  onFieldSelect,
  onChangeValue,
  onOpenSignatureModal,
  onPageSelect,
}: PdfSidebarProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'validation' | 'thumbnails'>('fields');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    section_a: true,
    section_b: true,
    section_c: true,
    section_d: true,
    section_e: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Section Level Validation Status (✓ / ⚠ / ✕)
  const getSectionStatus = (secKey: string) => {
    if (secKey === 'section_a') {
      return clientId ? 'valid' : 'warning';
    }
    if (secKey === 'section_b') {
      if (!values.request_type) return 'warning';
      if (values.request_type === 'specific_policy' && !values.policy_numbers) return 'warning';
      return 'valid';
    }
    if (secKey === 'section_c') {
      if (!values.reason_type) return 'warning';
      if (values.reason_type === 'prefer_another' && !values.reason_details) return 'warning';
      return 'valid';
    }
    if (secKey === 'section_d') {
      return values.new_advisor_last_name && values.new_advisor_first_name ? 'valid' : 'warning';
    }
    if (secKey === 'section_e') {
      return values.policy_owner_signature ? 'valid' : 'invalid';
    }
    if (secKey === 'section_g') {
      return 'valid';
    }
    return 'valid';
  };

  // Complete Validation Checklist Items
  const validationItems: ValidationItem[] = [
    {
      key: 'client',
      label: 'General Information (Policy Owner)',
      isValid: !!clientId,
      message: clientId ? 'Policy owner selected & auto-filled' : 'Select client record to auto-fill',
      sectionKey: 'section_a',
    },
    {
      key: 'request_type',
      label: 'Request Details (B.1 / B.2)',
      isValid: !!values.request_type && (values.request_type !== 'specific_policy' || !!values.policy_numbers),
      message: values.request_type ? 'Transfer scope specified' : 'Choose specific policy or all accounts',
      sectionKey: 'section_b',
    },
    {
      key: 'reason_type',
      label: 'Reason for Advisor Change',
      isValid: !!values.reason_type && (values.reason_type !== 'prefer_another' || !!values.reason_details),
      message: values.reason_type ? 'Reason selected' : 'Specify reason for changing advisor',
      sectionKey: 'section_c',
    },
    {
      key: 'new_advisor',
      label: 'New Advisor Information',
      isValid: !!(values.new_advisor_last_name && values.new_advisor_first_name),
      message: values.new_advisor_last_name ? 'Advisor specified' : 'Enter new advisor name',
      sectionKey: 'section_d',
    },
    {
      key: 'owner_signature',
      label: 'Policy Owner Signature',
      isValid: !!values.policy_owner_signature,
      message: values.policy_owner_signature ? 'Signature attached' : 'Click signature box on Page 2 to sign',
      sectionKey: 'section_e',
    },
    {
      key: 'office_use',
      label: 'Office Use Information',
      isValid: true,
      message: 'Optional staff processing metadata',
      sectionKey: 'section_g',
    },
  ];

  const validCount = validationItems.filter((v) => v.isValid).length;
  const isComplete = validCount === validationItems.length;

  return (
    <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-30 select-none">
      {/* Top Tab Bar Header */}
      <div className="bg-slate-950 px-2 pt-2 flex items-center gap-1 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('fields')}
          className={`flex-1 py-2 px-2.5 rounded-t-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'fields'
              ? 'bg-white text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText size={14} />
          Fields
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 py-2 px-2.5 rounded-t-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'validation'
              ? 'bg-white text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 size={14} className={isComplete ? 'text-emerald-500' : 'text-amber-400'} />
          Validation
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {validCount}/{validationItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('thumbnails')}
          className={`py-2 px-2.5 rounded-t-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'thumbnails'
              ? 'bg-white text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Page Thumbnails"
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60 p-3 space-y-3">
        {activeTab === 'fields' && (
          <>
            {/* Client Selector Card */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <UserCheck size={12} className="text-[#F2AF00]" />
                  Policy Owner
                </span>
                {clientId ? (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Linked
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                    Select Client
                  </span>
                )}
              </div>
              <ClientSelector value={clientId} onChange={onClientSelect} />

              {selectedClientDetails && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-1 bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/60">
                  <div className="font-bold text-slate-900 truncate">{selectedClientDetails.client_name}</div>
                  <div className="text-[10px] text-slate-600 flex justify-between">
                    <span>Policy: {selectedClientDetails.policy_number || 'N/A'}</span>
                    <span>DOB: {selectedClientDetails.birthdate || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion Sections */}
            <div className="space-y-2.5">
              {sections.map((section) => {
                const isOpen = !!openSections[section.key];
                const sectionFields = fields.filter((f) => section.fieldKeys.includes(f.key));
                const secStatus = getSectionStatus(section.key);

                return (
                  <div
                    key={section.key}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Accordion Header Trigger */}
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full px-3 py-2.5 bg-slate-950 text-white flex items-center justify-between text-left hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded bg-[#F2AF00] text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {section.letter}
                        </div>
                        <span className="font-bold text-xs tracking-tight truncate">{section.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {secStatus === 'valid' ? (
                          <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                        ) : secStatus === 'invalid' ? (
                          <span className="text-[10px] text-red-400 font-bold">✕</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold">⚠</span>
                        )}
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </button>

                    {/* Section Fields */}
                    {isOpen && (
                      <div className="p-2.5 space-y-2 bg-white divide-y divide-slate-100">
                        {sectionFields.map((field) => {
                          const isActive = activeFieldKey === field.key;
                          const hasVal = values[field.key] !== undefined && values[field.key] !== null && String(values[field.key]).trim() !== '';

                          return (
                            <div
                              key={field.key + '_' + (field.radioValue ?? '')}
                              onClick={() => onFieldSelect(field)}
                              className={`pt-2 first:pt-0 p-2 rounded-lg cursor-pointer transition-all ${
                                isActive ? 'bg-amber-50 border border-[#F2AF00] shadow-xs' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-semibold text-slate-800 truncate block">
                                  {field.label}
                                </label>
                                {hasVal && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                                <span>Pg {field.page} • ({field.x}, {field.y})</span>
                                {field.readonly && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded">Readonly</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Validation Tab Panel */}
        {activeTab === 'validation' && (
          <div className="space-y-3">
            <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Form Status</div>
              <div className="text-lg font-bold flex items-center gap-2 mt-0.5">
                {isComplete ? (
                  <>
                    <span className="text-emerald-400">Ready to Export</span>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </>
                ) : (
                  <>
                    <span className="text-amber-400">Action Required</span>
                    <AlertTriangle size={18} className="text-amber-400" />
                  </>
                )}
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-[#F2AF00] h-full transition-all duration-300"
                  style={{ width: `${(validCount / validationItems.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {validationItems.map((item) => (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl border transition-all ${
                    item.isValid
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                      : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span>{item.label}</span>
                    {item.isValid ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                        ⚠
                      </div>
                    )}
                  </div>
                  {item.message && (
                    <p className="text-[10px] text-slate-600 mt-1">{item.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Thumbnails Tab */}
        {activeTab === 'thumbnails' && (
          <div className="space-y-4">
            {[1, 2].map((pgNum) => (
              <div
                key={pgNum}
                onClick={() => onPageSelect && onPageSelect(pgNum)}
                className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-[#F2AF00] cursor-pointer transition-all group flex flex-col items-center gap-2"
              >
                <div className="w-full h-44 bg-slate-100 rounded border border-slate-200 flex flex-col items-center justify-center group-hover:shadow-md transition-shadow relative overflow-hidden">
                  <FileText size={36} className="text-slate-400 group-hover:text-[#F2AF00] transition-colors" />
                  <span className="text-xs font-bold text-slate-700 mt-2">Sun Life Form Page {pgNum}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">Page {pgNum}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
