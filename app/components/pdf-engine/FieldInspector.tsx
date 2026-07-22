'use client';

import React from 'react';
import { X, Layers, Move, Type, ShieldCheck, Database } from 'lucide-react';
import { PdfFieldConfig } from './types';

interface FieldInspectorProps {
  selectedField: PdfFieldConfig | null;
  value: any;
  onClose: () => void;
  onChangeValue: (key: string, val: any) => void;
}

export default function FieldInspector({
  selectedField,
  value,
  onClose,
  onChangeValue,
}: FieldInspectorProps) {
  if (!selectedField) return null;

  const displayVal = value !== undefined && value !== null ? String(value) : '';

  return (
    <div className="w-[320px] bg-white border-l border-slate-200 shadow-xl flex flex-col h-full shrink-0 z-30 select-none animate-[slideInRight_0.2s_ease-out]">
      {/* Inspector Top Bar Header */}
      <div className="px-4 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F2AF00]/20 flex items-center justify-center text-[#F2AF00] font-mono text-xs font-bold">
            i
          </div>
          <div>
            <h4 className="font-bold text-xs tracking-wide uppercase text-slate-100">Field Inspector</h4>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">{selectedField.key}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Field Content Details */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-700">
        {/* Field Label & Description Card */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Label</label>
          <div className="font-bold text-slate-950 text-xs">{selectedField.label}</div>
          {selectedField.description && (
            <p className="text-[11px] text-slate-500 italic mt-1">{selectedField.description}</p>
          )}
        </div>

        {/* Live Value Input Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Type size={12} />
              Current Value
            </label>
            {selectedField.readonly && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                Readonly
              </span>
            )}
          </div>

          {selectedField.type === 'textarea' ? (
            <textarea
              value={displayVal}
              disabled={selectedField.readonly}
              onChange={(e) => onChangeValue(selectedField.key, e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-[#F2AF00]/50 focus:border-[#F2AF00] outline-none disabled:bg-slate-100 font-medium"
              rows={3}
            />
          ) : selectedField.type === 'checkbox' ? (
            <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={!!value}
                disabled={selectedField.readonly}
                onChange={(e) => onChangeValue(selectedField.key, e.target.checked)}
                className="w-4 h-4 accent-slate-950 rounded"
              />
              <span className="font-semibold text-xs">{value ? 'Checked (X)' : 'Unchecked'}</span>
            </label>
          ) : (
            <input
              type={selectedField.type === 'date' ? 'date' : 'text'}
              value={displayVal}
              disabled={selectedField.readonly}
              onChange={(e) => onChangeValue(selectedField.key, e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-[#F2AF00]/50 focus:border-[#F2AF00] outline-none disabled:bg-slate-100 font-semibold"
            />
          )}
        </div>

        {/* PDF Coordinates (Point System) */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Move size={12} />
            PDF Point Coordinates (pt)
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-sans">X (Left)</span>
              <span className="font-bold text-slate-900">{selectedField.x} pt</span>
            </div>
            <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-sans">Y (Bottom)</span>
              <span className="font-bold text-slate-900">{selectedField.y} pt</span>
            </div>
            <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-sans">Width</span>
              <span className="font-bold text-slate-900">{selectedField.width} pt</span>
            </div>
            <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-sans">Height</span>
              <span className="font-bold text-slate-900">{selectedField.height} pt</span>
            </div>
          </div>
        </div>

        {/* Typography & Page Info */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers size={12} />
            Page & Typography
          </div>
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 font-sans">Page Number:</span>
              <span className="font-bold text-slate-900 bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                Page {selectedField.page}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 font-sans">Font Family:</span>
              <span className="font-semibold text-slate-800">{selectedField.fontFamily || 'Helvetica'}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 font-sans">Font Size:</span>
              <span className="font-semibold text-slate-800">{selectedField.fontSize || 8.5} pt</span>
            </div>
          </div>
        </div>

        {/* Database & Validation Metadata */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Database size={12} />
            Database Mapping
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Table:</span>
              <span className="font-bold text-slate-800">advisor_change_requests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Column:</span>
              <span className="font-bold text-indigo-700">{selectedField.key}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
