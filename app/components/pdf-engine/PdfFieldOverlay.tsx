'use client';

import React, { useEffect, useRef } from 'react';
import { PdfFieldConfig, FieldValueMap } from './types';
import { PenTool } from 'lucide-react';

interface PdfFieldOverlayProps {
  fields: PdfFieldConfig[];
  values: FieldValueMap;
  pageNumber: number;
  pageWidth: number; // e.g. 612
  pageHeight: number; // e.g. 792
  rotation?: number;
  activeFieldKey: string | null;
  readOnly?: boolean;
  onFieldClick: (field: PdfFieldConfig) => void;
  onChangeValue: (key: string, value: any) => void;
  onOpenSignatureModal: (field: PdfFieldConfig) => void;
}

export default function PdfFieldOverlay({
  fields,
  values,
  pageNumber,
  pageWidth,
  pageHeight,
  rotation = 0,
  activeFieldKey,
  readOnly = false,
  onFieldClick,
  onChangeValue,
  onOpenSignatureModal,
}: PdfFieldOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Filter fields belonging to this page
  const pageFields = fields.filter((f) => f.page === pageNumber);

  // Smooth scroll active field into view when selected
  useEffect(() => {
    if (!activeFieldKey || !overlayRef.current) return;
    const activeEl = overlayRef.current.querySelector(`[data-field-key="${activeFieldKey}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeFieldKey]);

  const isFieldVisible = (field: PdfFieldConfig) => {
    if (!field.dependsOn) return true;
    const depVal = values[field.dependsOn.key];
    if (field.dependsOn.value !== undefined) {
      return depVal === field.dependsOn.value;
    }
    if (field.dependsOn.isTruthy) {
      return !!depVal;
    }
    return true;
  };

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-auto z-20">
      {pageFields.map((field) => {
        if (!isFieldVisible(field)) return null;

        // Convert PDF coordinates (bottom-left origin) to CSS percentages (top-left origin)
        const leftPercent = (field.x / pageWidth) * 100;
        const topPercent = ((pageHeight - (field.y + field.height)) / pageHeight) * 100;
        const widthPercent = (field.width / pageWidth) * 100;
        const heightPercent = (field.height / pageHeight) * 100;

        const isActive = activeFieldKey === field.key;
        const isReadonly = readOnly || field.readonly;

        const handleSelect = (e: React.MouseEvent) => {
          e.stopPropagation();
          onFieldClick(field);
        };

        return (
          <div
            key={field.key + '_' + (field.radioValue ?? '')}
            data-field-key={field.key}
            onClick={handleSelect}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
            className={`absolute transition-all duration-150 flex items-center group cursor-text ${
              isActive
                ? 'ring-2 ring-[#F2AF00] bg-[#F2AF00]/25 border-2 border-[#F2AF00] shadow-[0_0_25px_rgba(242,175,0,0.65)] z-30'
                : 'hover:bg-[#F2AF00]/15 border border-transparent hover:border-[#F2AF00]/50 z-10'
            }`}
            title={`${field.label} (${field.key})`}
          >
            {field.type === 'signature' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldClick(field);
                  if (!isReadonly) onOpenSignatureModal(field);
                }}
                className={`w-full h-full border border-dashed rounded flex items-center justify-center p-0.5 transition-all overflow-hidden cursor-pointer ${
                  values[field.key]
                    ? 'border-emerald-600 bg-emerald-50/30'
                    : isActive
                    ? 'border-[#F2AF00] bg-[#F2AF00]/20 shadow-md'
                    : 'border-[#F2AF00]/80 bg-amber-50/40 hover:bg-amber-100/60'
                }`}
              >
                {values[field.key] ? (
                  <img
                    src={values[field.key]}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-[#F2AF00] px-2 py-0.5 rounded shadow-xs">
                    <PenTool size={11} className="text-slate-950" />
                    <span>Click to Sign</span>
                  </div>
                )}
              </div>
            ) : field.type === 'checkbox' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldClick(field);
                  if (!isReadonly) onChangeValue(field.key, !values[field.key]);
                }}
                className={`w-full h-full flex items-center justify-center font-bold text-xs cursor-pointer select-none rounded border ${
                  values[field.key]
                    ? 'border-slate-900 bg-slate-900/15 text-slate-900 shadow-xs'
                    : 'border-slate-400/80 bg-white/60 hover:bg-amber-100/70'
                }`}
              >
                {values[field.key] && (
                  <span className="font-extrabold text-slate-950 text-[11px] leading-none">✕</span>
                )}
              </div>
            ) : field.type === 'radio' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldClick(field);
                  if (!isReadonly) onChangeValue(field.key, field.radioValue);
                }}
                className={`w-full h-full flex items-center justify-center font-bold text-xs cursor-pointer select-none rounded border ${
                  values[field.key] === field.radioValue
                    ? 'border-slate-900 bg-slate-900/15 text-slate-900 shadow-xs'
                    : 'border-slate-400/80 bg-white/60 hover:bg-amber-100/70'
                }`}
              >
                {values[field.key] === field.radioValue && (
                  <span className="font-extrabold text-slate-950 text-[11px] leading-none">✕</span>
                )}
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                value={values[field.key] || ''}
                disabled={isReadonly}
                onChange={(e) => onChangeValue(field.key, e.target.value)}
                onFocus={() => onFieldClick(field)}
                placeholder={field.placeholder || ''}
                style={{
                  fontSize: `${field.fontSize || 8.5}pt`,
                  fontFamily: field.fontFamily || 'Helvetica, Arial, sans-serif',
                }}
                className="w-full h-full p-1 bg-transparent hover:bg-amber-50/50 focus:bg-white text-black outline-none border-0 resize-none font-medium leading-tight placeholder:text-slate-400"
              />
            ) : (
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={values[field.key] || ''}
                disabled={isReadonly}
                onChange={(e) => onChangeValue(field.key, e.target.value)}
                onFocus={() => onFieldClick(field)}
                placeholder={field.placeholder || ''}
                style={{
                  fontSize: `${field.fontSize || 8.5}pt`,
                  fontFamily: field.fontFamily || 'Helvetica, Arial, sans-serif',
                }}
                className={`w-full h-full px-1 py-0 bg-transparent hover:bg-amber-50/50 focus:bg-white text-black outline-none border-0 font-medium leading-none placeholder:text-slate-400 ${
                  isReadonly ? 'cursor-not-allowed text-slate-800 font-semibold' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
