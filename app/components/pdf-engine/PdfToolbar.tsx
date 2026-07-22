'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Save,
  Eye,
  Edit3,
  Columns,
  RotateCw,
  Sun,
  Moon,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { ViewMode } from './types';

interface PdfToolbarProps {
  title: string;
  subtitle?: string;
  status?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoom: number; // e.g. 1.0
  onZoomChange: (zoom: number) => void;
  rotation: number; // 0, 90, 180, 270
  onRotateChange: (rotation: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onBack?: () => void;
  onSaveDraft: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  isSubmitting?: boolean;
  isGeneratingPdf?: boolean;
}

export default function PdfToolbar({
  title,
  subtitle,
  status = 'Pending',
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  rotation,
  onRotateChange,
  currentPage,
  totalPages,
  onPageChange,
  theme,
  onThemeToggle,
  onBack,
  onSaveDraft,
  onExportPdf,
  onPrint,
  isSubmitting = false,
  isGeneratingPdf = false,
}: PdfToolbarProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(2.0, Math.round((zoom + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(0.5, Math.round((zoom - 0.15) * 100) / 100));
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    onRotateChange(nextRot);
  };

  const statusTone =
    status.toLowerCase() === 'approved'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : status.toLowerCase() === 'rejected'
      ? 'bg-red-500/20 text-red-300 border-red-500/30'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 text-white px-4 flex items-center justify-between shrink-0 z-40 select-none shadow-lg">
      {/* Left: Back + Document Title & Status */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors border border-slate-800"
            title="Back to List"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div className="w-1.5 h-9 bg-[#F2AF00] rounded-full shadow-[0_0_12px_#F2AF00]" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-slate-100 tracking-tight">{title}</h1>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${statusTone}`}>
              {status}
            </span>
          </div>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Center: Modes + Page Navigator + Zoom & Rotation */}
      <div className="flex items-center gap-3">
        {/* Mode Switcher */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => onViewModeChange('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'edit'
                ? 'bg-[#F2AF00] text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Edit3 size={13} />
            Edit
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'preview'
                ? 'bg-[#F2AF00] text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            onClick={() => onViewModeChange('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'compare'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Columns size={13} />
            Compare
          </button>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs font-mono">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-slate-200 font-semibold px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs font-mono">
          <button
            onClick={handleZoomOut}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <select
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="bg-transparent text-slate-200 outline-none cursor-pointer font-mono text-xs px-1"
          >
            <option value={0.5} className="bg-slate-900">50%</option>
            <option value={0.75} className="bg-slate-900">75%</option>
            <option value={1.0} className="bg-slate-900">100%</option>
            <option value={1.25} className="bg-slate-900">125%</option>
            <option value={1.5} className="bg-slate-900">150%</option>
            <option value={1.75} className="bg-slate-900">175%</option>
            <option value={2.0} className="bg-slate-900">200%</option>
          </select>

          <button
            onClick={handleZoomIn}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => onZoomChange(1.45)}
            className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 hover:text-[#F2AF00] hover:bg-slate-700 rounded transition-colors"
            title="Fit Width"
          >
            Fit Width
          </button>

          <button
            onClick={() => onZoomChange(1.0)}
            className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 hover:text-[#F2AF00] hover:bg-slate-700 rounded transition-colors"
            title="Fit Page"
          >
            Fit Page
          </button>

          <button
            onClick={handleRotate}
            className="p-1 text-slate-400 hover:text-[#F2AF00] transition-colors ml-1"
            title={`Rotate (Current: ${rotation}°)`}
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Right Actions: Print, Theme, Save Draft, Export PDF */}
      <div className="flex items-center gap-2">
        <button
          onClick={onThemeToggle}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors border border-slate-800"
          title={`Switch Theme (Current: ${theme})`}
        >
          {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
        </button>

        <button
          onClick={onPrint}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors border border-slate-800"
          title="Print Document"
        >
          <Printer size={16} />
        </button>

        <button
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={13} className="animate-spin text-[#F2AF00]" /> : <Save size={13} />}
          Save Draft
        </button>

        <button
          onClick={onExportPdf}
          disabled={isGeneratingPdf}
          className="px-5 py-2 bg-[#F2AF00] hover:bg-[#d99d00] text-slate-950 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(242,175,0,0.35)] active:scale-95 disabled:opacity-50"
        >
          {isGeneratingPdf ? <Loader2 size={13} className="animate-spin text-slate-950" /> : <Download size={13} />}
          Export PDF
        </button>
      </div>
    </header>
  );
}
