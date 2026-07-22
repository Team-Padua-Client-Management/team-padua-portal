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
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import ClientSelector from '@/app/components/shared/ClientSelector';

interface BcrToolbarProps {
  title: string;
  subtitle?: string;
  status?: string;
  clientId: string;
  selectedClientDetails: {
    client_name: string;
    birthdate: string | null;
    policy_number: string | null;
  } | null;
  onClientSelect: (clientId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResultsCount?: number;
  onJumpToSearchMatch?: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBack?: () => void;
  onSaveDraft: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  isSubmitting?: boolean;
  isGeneratingPdf?: boolean;
  autoSaveStatus?: 'saved' | 'saving' | 'idle';
}

export default function BcrToolbar({
  title,
  subtitle,
  status = 'Pending',
  clientId,
  selectedClientDetails,
  onClientSelect,
  zoom,
  onZoomChange,
  currentPage,
  totalPages,
  onPageChange,
  onBack,
  onSaveDraft,
  onExportPdf,
  onPrint,
  isSubmitting = false,
  isGeneratingPdf = false,
  autoSaveStatus = 'saved',
}: BcrToolbarProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(2.0, Math.round((zoom + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(0.5, Math.round((zoom - 0.15) * 100) / 100));
  };

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 text-white px-5 flex items-center justify-between shrink-0 z-40 select-none shadow-lg">
      {/* Left: Back + Document Title & Status */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors border border-slate-800"
            title="Back to BCR List"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div className="w-1.5 h-9 bg-[#F2AF00] rounded-full shadow-[0_0_12px_#F2AF00]" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-slate-100 tracking-tight">{title}</h1>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span>{subtitle || 'Sun Life Financial Plans, Inc.'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {autoSaveStatus === 'saving' ? (
                <>
                  <Loader2 size={10} className="animate-spin text-[#F2AF00]" />
                  <span className="text-amber-400">Autosaving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  <span className="text-slate-300">Autosaved</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Client Selector Dropdown + Zoom Controls + Page Navigator */}
      <div className="flex items-center gap-4">
        {/* Client Selector Dropdown for Auto-fill */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
          <UserCheck size={14} className="text-[#F2AF00] shrink-0" />
          <div className="w-52">
            <ClientSelector value={clientId} onChange={onClientSelect} />
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Page"
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
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono">
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

          <button
            onClick={() => onZoomChange(1.45)}
            className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 hover:text-[#F2AF00] hover:bg-slate-700 rounded transition-colors"
            title="Fit Width"
          >
            Fit Width
          </button>
        </div>
      </div>

      {/* Right Actions: Print, Save Draft, Export PDF */}
      <div className="flex items-center gap-2">
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
