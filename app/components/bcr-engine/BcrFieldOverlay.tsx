'use client';

import React, { useEffect, useRef } from 'react';
import { BcrFieldConfig, FieldValueMap } from './types';
import { pdfPointToCanvas } from './utils/coordinateUtils';
import { PenTool } from 'lucide-react';

interface BcrFieldOverlayProps {
  fields: BcrFieldConfig[];
  values: FieldValueMap;
  pageNumber: number;
  pageWidth?: number; // 612 pt
  pageHeight?: number; // 792 pt
  scale?: number; // e.g. 1.45
  activeFieldKey?: string | null;
  highlightSearchQuery?: string;
  readOnly?: boolean;
  onFieldClick?: (field: BcrFieldConfig) => void;
  onChangeValue?: (key: string, value: any) => void;
  onOpenSignatureModal?: (field: BcrFieldConfig) => void;
}

export default function BcrFieldOverlay({
  fields,
  values,
  pageNumber,
  pageWidth = 612,
  pageHeight = 792,
  scale = 1.0,
  activeFieldKey = null,
  highlightSearchQuery = '',
  readOnly = false,
  onFieldClick = () => {},
  onChangeValue = () => {},
  onOpenSignatureModal = () => {},
}: BcrFieldOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Filter fields strictly for this page to enforce total page isolation
  const pageFields = fields.filter((f) => f.page === pageNumber);

  // Smooth scroll active field into view when focused
  useEffect(() => {
    if (!activeFieldKey || !overlayRef.current) return;
    const activeEl = overlayRef.current.querySelector(`[data-field-key="${activeFieldKey}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeFieldKey]);

  const isFieldVisible = (field: BcrFieldConfig) => {
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
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto z-20 overflow-hidden"
    >
      {pageFields.map((field) => {
        if (!isFieldVisible(field)) return null;

        // Convert PDF Point coordinates (bottom-left) to exact Canvas CSS Pixels (top-left, scaled)
        const pos = pdfPointToCanvas(
          field.x,
          field.y,
          field.width,
          field.height,
          pageWidth,
          pageHeight,
          scale
        );

        const isActive = activeFieldKey === field.key;
        const isSearchMatched =
          highlightSearchQuery.trim() !== '' &&
          (field.label.toLowerCase().includes(highlightSearchQuery.toLowerCase()) ||
            field.key.toLowerCase().includes(highlightSearchQuery.toLowerCase()));

        const isReadonly = readOnly || field.readonly;
        const scaledFontSize = Math.max(7, (field.fontSize || 8.5) * scale);

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
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              width: `${pos.width}px`,
              height: `${pos.height}px`,
            }}
            className={`absolute transition-all duration-150 flex items-center group cursor-text ${
              isActive
                ? 'ring-2 ring-[#F2AF00] bg-[#F2AF00]/20 border-2 border-[#F2AF00] shadow-[0_0_20px_rgba(242,175,0,0.65)] z-30'
                : isSearchMatched
                ? 'ring-2 ring-emerald-500 bg-emerald-100/50 border-2 border-emerald-500 shadow-md z-20 animate-pulse'
                : 'hover:bg-[#F2AF00]/15 border border-transparent hover:border-[#F2AF00]/50 z-10'
            }`}
            title={`${field.label}`}
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
                    ? 'border-[#F2AF00] bg-[#F2AF00]/20 shadow-xs'
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
                    <span>Sign</span>
                  </div>
                )}
              </div>
            ) : field.type === 'select' ? (
              <select
                value={values[field.key] || ''}
                disabled={isReadonly}
                onChange={(e) => onChangeValue(field.key, e.target.value)}
                onFocus={() => onFieldClick(field)}
                style={{
                  fontSize: `${scaledFontSize}px`,
                  fontFamily: field.fontFamily || 'Helvetica, Arial, sans-serif',
                }}
                className="w-full h-full px-1 py-0 bg-transparent hover:bg-amber-50/50 focus:bg-white text-black outline-none border-0 font-semibold"
              >
                <option value="">-- Select --</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldClick(field);
                  if (!isReadonly) onChangeValue(field.key, !values[field.key]);
                }}
                className={`w-full h-full flex items-center justify-center font-bold cursor-pointer select-none rounded border ${
                  values[field.key]
                    ? 'border-slate-900 bg-slate-900/15 text-slate-900 shadow-xs'
                    : 'border-slate-400/80 bg-white/60 hover:bg-amber-100/70'
                }`}
              >
                {values[field.key] && (
                  <span className="font-extrabold text-slate-950 leading-none">✕</span>
                )}
              </div>
            ) : field.type === 'radio' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldClick(field);
                  if (!isReadonly) onChangeValue(field.key, field.radioValue);
                }}
                className={`w-full h-full flex items-center justify-center font-bold cursor-pointer select-none rounded border ${
                  values[field.key] === field.radioValue
                    ? 'border-slate-900 bg-slate-900/15 text-slate-900 shadow-xs'
                    : 'border-slate-400/80 bg-white/60 hover:bg-amber-100/70'
                }`}
              >
                {values[field.key] === field.radioValue && (
                  <span className="font-extrabold text-slate-950 leading-none">✕</span>
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
                  fontSize: `${scaledFontSize}px`,
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
                  fontSize: `${scaledFontSize}px`,
                  fontFamily: field.fontFamily || 'Helvetica, Arial, sans-serif',
                }}
                className={`w-full h-full px-1 py-0 bg-transparent hover:bg-amber-50/50 focus:bg-white text-black outline-none border-0 font-semibold leading-none placeholder:text-slate-400 ${
                  isReadonly ? 'cursor-not-allowed text-slate-800 font-bold' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
