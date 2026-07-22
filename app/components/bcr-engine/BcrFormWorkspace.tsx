'use client';

import React, { useState } from 'react';
import {
  BcrSectionConfig,
  BcrFieldConfig,
  FieldValueMap,
} from './types';
import {
  ChevronDown,
  ChevronRight,
  UserCheck,
  Search,
  PenTool,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import ClientSelector from '@/app/components/shared/ClientSelector';

interface BcrFormWorkspaceProps {
  sections: BcrSectionConfig[];
  fields: BcrFieldConfig[];
  values: FieldValueMap;
  clientId: string;
  selectedClientDetails: {
    client_name: string;
    birthdate: string | null;
    policy_number: string | null;
  } | null;
  onClientSelect: (clientId: string) => void;
  onChangeValue: (key: string, value: any) => void;
  onOpenSignatureModal: (field: BcrFieldConfig) => void;
  onSaveDraft: () => void;
  isSubmitting?: boolean;
  onFocusFieldPage?: (page: number) => void;
}

export default function BcrFormWorkspace({
  sections,
  fields,
  values,
  clientId,
  selectedClientDetails,
  onClientSelect,
  onChangeValue,
  onOpenSignatureModal,
  onSaveDraft,
  isSubmitting = false,
  onFocusFieldPage,
}: BcrFormWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    section_a: true,
    section_b1: true,
    section_b2: false,
    section_b3: false,
    section_b4: false,
    section_c: false,
    section_d: true,
    section_e: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate simple section validation status
  const getSectionStatus = (sec: BcrSectionConfig) => {
    const secFields = fields.filter((f) => sec.fieldKeys.includes(f.key));
    if (secFields.length === 0) return 'valid';

    const requiredFields = secFields.filter((f) => f.required);
    if (requiredFields.length > 0) {
      const allReqFilled = requiredFields.every((f) => {
        const val = values[f.key];
        return val !== undefined && val !== null && String(val).trim() !== '';
      });
      return allReqFilled ? 'valid' : 'missing';
    }

    const anyFilled = secFields.some((f) => {
      const val = values[f.key];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });

    return anyFilled ? 'valid' : 'optional';
  };

  const filteredFields = fields.filter(
    (f) =>
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/70 border-r border-slate-200 overflow-hidden select-none">
      {/* Top Search & Client Selector Bar */}
      <div className="p-5 bg-white border-b border-slate-200/80 space-y-4 shrink-0 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <FileText size={18} className="text-[#F2AF00]" />
              Form Editor Workspace
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Fill out the sections below. The PDF preview on the right updates live.
            </p>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
            Notion-Style Form
          </span>
        </div>

        {/* Client Selection Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck size={13} className="text-[#F2AF00]" />
              Selected Client Record
            </span>
            {clientId ? (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                Linked & Auto-filled
              </span>
            ) : (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
                Select Client to Auto-fill
              </span>
            )}
          </div>
          <ClientSelector value={clientId} onChange={onClientSelect} />

          {selectedClientDetails && (
            <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
              <div className="font-bold text-slate-900">{selectedClientDetails.client_name}</div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Plan #: {selectedClientDetails.policy_number || 'N/A'}</span>
                <span>Birthdate: {selectedClientDetails.birthdate || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Fields Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any form field (e.g. Beneficiary, Signature, Phone)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F2AF00]/40 focus:border-[#F2AF00] font-medium transition-all"
          />
        </div>
      </div>

      {/* Main Form Accordion Sections Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {sections.map((section) => {
          const isOpen = searchQuery ? true : !!openSections[section.key];
          const sectionFields = (searchQuery ? filteredFields : fields).filter((f) =>
            section.fieldKeys.includes(f.key)
          );

          if (searchQuery && sectionFields.length === 0) return null;

          const status = getSectionStatus(section);

          return (
            <div
              key={section.key}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
            >
              {/* Section Header Accordion */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between text-left hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#F2AF00] text-slate-950 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                    {section.letter}
                  </div>
                  <span className="font-bold text-sm tracking-tight truncate">{section.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {status === 'valid' ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Complete
                    </span>
                  ) : status === 'missing' ? (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <AlertTriangle size={11} /> Missing Info
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                      Optional
                    </span>
                  )}
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {/* Section Fields Card Body */}
              {isOpen && (
                <div className="p-5 space-y-4 bg-white divide-y divide-slate-100">
                  {sectionFields.map((field) => {
                    const val = values[field.key];

                    const handleFieldFocus = () => {
                      if (onFocusFieldPage) onFocusFieldPage(field.page);
                    };

                    return (
                      <div key={field.key} className="pt-3.5 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 text-[11px] font-extrabold">*</span>
                            )}
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Page {field.page}
                          </span>
                        </div>

                        {field.type === 'signature' ? (
                          <div
                            onClick={() => {
                              handleFieldFocus();
                              onOpenSignatureModal(field);
                            }}
                            className={`w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                              values[field.key]
                                ? 'border-emerald-500 bg-emerald-50/20'
                                : 'border-[#F2AF00]/70 bg-amber-50/40 hover:bg-amber-100/60'
                            }`}
                          >
                            {values[field.key] ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={values[field.key]}
                                  alt="Signature preview"
                                  className="h-10 max-w-[180px] object-contain"
                                />
                                <span className="text-xs font-bold text-emerald-700">Signature Attached ✓</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                                <PenTool size={15} className="text-amber-800" />
                                <span>Click here to sign in canvas pad</span>
                              </div>
                            )}
                            <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              {values[field.key] ? 'Change' : 'Sign'}
                            </span>
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            value={val || ''}
                            onFocus={handleFieldFocus}
                            onChange={(e) => onChangeValue(field.key, e.target.value)}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#F2AF00]/40 focus:border-[#F2AF00] font-semibold"
                          >
                            <option value="">-- Select option --</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={!!val}
                              onFocus={handleFieldFocus}
                              onChange={(e) => onChangeValue(field.key, e.target.checked)}
                              className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-800">
                              {val ? 'Checked (X)' : 'Unchecked'}
                            </span>
                          </label>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={val || ''}
                            onFocus={handleFieldFocus}
                            onChange={(e) => onChangeValue(field.key, e.target.value)}
                            placeholder={field.placeholder || ''}
                            rows={3}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#F2AF00]/40 focus:border-[#F2AF00] font-medium resize-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'date' ? 'date' : 'text'}
                            value={val || ''}
                            onFocus={handleFieldFocus}
                            onChange={(e) => onChangeValue(field.key, e.target.value)}
                            placeholder={field.placeholder || ''}
                            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#F2AF00]/40 focus:border-[#F2AF00] font-semibold"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Save Action Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <button
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin text-[#F2AF00]" /> : <Save size={15} />}
          Save BCR Draft Progress
        </button>
      </div>
    </div>
  );
}
