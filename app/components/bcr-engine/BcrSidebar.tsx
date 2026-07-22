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
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Save,
  Loader2,
} from 'lucide-react';
import ClientSelector from '@/app/components/shared/ClientSelector';

interface BcrSidebarProps {
  sections: BcrSectionConfig[];
  fields: BcrFieldConfig[];
  values: FieldValueMap;
  activeFieldKey: string | null;
  clientId: string;
  selectedClientDetails: {
    client_name: string;
    birthdate: string | null;
    policy_number: string | null;
  } | null;
  onClientSelect: (clientId: string) => void;
  onFieldSelect: (field: BcrFieldConfig) => void;
  onChangeValue: (key: string, value: any) => void;
  onOpenSignatureModal: (field: BcrFieldConfig) => void;
  onSaveDraft: () => void;
  isSubmitting?: boolean;
}

export default function BcrSidebar({
  sections,
  fields,
  values,
  activeFieldKey,
  clientId,
  selectedClientDetails,
  onClientSelect,
  onFieldSelect,
  onChangeValue,
  onOpenSignatureModal,
  onSaveDraft,
  isSubmitting = false,
}: BcrSidebarProps) {
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

  // Simple section status (✓ Completed / ⚠ Missing)
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

  // Filter fields based on search query
  const filteredFields = fields.filter(
    (f) =>
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-xs z-30 select-none">
      {/* Top Sidebar Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <UserCheck size={14} className="text-[#F2AF00]" />
            Form Sections
          </h3>
          <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
            Simple Editor
          </span>
        </div>

        {/* Client Selector Card */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Selected Client
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
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-1 bg-amber-50/40 p-2 rounded-lg border border-amber-200/50">
              <div className="font-bold text-slate-900 truncate">{selectedClientDetails.client_name}</div>
              <div className="text-[10px] text-slate-600 flex justify-between">
                <span>Plan: {selectedClientDetails.policy_number || 'N/A'}</span>
                <span>DOB: {selectedClientDetails.birthdate || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Field Search Filter Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields (e.g. Beneficiary, Signature)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F2AF00]/40 focus:border-[#F2AF00] font-medium"
          />
        </div>
      </div>

      {/* Main Accordion Form Sections List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/40">
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
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full px-3 py-2.5 bg-slate-900 text-white flex items-center justify-between text-left hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded bg-[#F2AF00] text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {section.letter}
                  </div>
                  <span className="font-bold text-xs tracking-tight truncate">{section.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {status === 'valid' ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      ✓ Completed
                    </span>
                  ) : status === 'missing' ? (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                      ⚠ Missing
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                      Optional
                    </span>
                  )}
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {/* Section Fields Body */}
              {isOpen && (
                <div className="p-2.5 space-y-2 bg-white divide-y divide-slate-100">
                  {sectionFields.map((field) => {
                    const isActive = activeFieldKey === field.key;
                    const val = values[field.key];
                    const hasVal = val !== undefined && val !== null && String(val).trim() !== '';

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
                          {hasVal ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          ) : field.required ? (
                            <span className="text-[9px] text-amber-600 font-bold">Required</span>
                          ) : null}
                        </div>

                        {field.type === 'signature' ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onFieldSelect(field);
                              onOpenSignatureModal(field);
                            }}
                            className="mt-1 flex items-center justify-between bg-amber-50/50 border border-amber-200 p-1.5 rounded-md hover:bg-amber-100/60 transition-colors"
                          >
                            <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                              <PenTool size={11} className="text-amber-800" />
                              {values[field.key] ? 'Signature Attached' : 'Click to Sign'}
                            </span>
                            {values[field.key] && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Signed
                              </span>
                            )}
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            value={val || ''}
                            onChange={(e) => onChangeValue(field.key, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-[#F2AF00] font-medium"
                          >
                            <option value="">Select option...</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 cursor-pointer pt-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={!!val}
                              onChange={(e) => onChangeValue(field.key, e.target.checked)}
                              className="w-3.5 h-3.5 accent-slate-900 rounded"
                            />
                            <span className="text-[11px] text-slate-700 font-medium">
                              {val ? 'Checked' : 'Unchecked'}
                            </span>
                          </label>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={val || ''}
                            onChange={(e) => onChangeValue(field.key, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={field.placeholder || ''}
                            rows={2}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-[#F2AF00] font-medium resize-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'date' ? 'date' : 'text'}
                            value={val || ''}
                            onChange={(e) => onChangeValue(field.key, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={field.placeholder || ''}
                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none focus:border-[#F2AF00] font-medium"
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

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <button
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin text-[#F2AF00]" /> : <Save size={14} />}
          Save BCR Draft
        </button>
      </div>
    </aside>
  );
}
