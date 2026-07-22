'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import {
  BcrFormConfig,
  BcrFieldConfig,
  FieldValueMap,
} from './types';
import BcrToolbar from './BcrToolbar';
import SignatureModal from '../pdf-engine/SignatureModal';

const BcrPdfCanvas = dynamic(() => import('@/app/components/bcr-engine/BcrPdfCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 text-slate-400 font-medium text-sm">
      <Loader2 className="w-6 h-6 animate-spin text-[#F2AF00] mr-2" />
      Loading High-DPI Vector PDF Canvas...
    </div>
  ),
});

interface BcrPdfViewerProps {
  config: BcrFormConfig;
  initialValues: FieldValueMap;
  clientId: string;
  selectedClientDetails: {
    client_name: string;
    birthdate: string | null;
    policy_number: string | null;
  } | null;
  status?: string;
  onBack?: () => void;
  onClientSelect: (clientId: string) => void;
  onValuesChange?: (values: FieldValueMap) => void;
  onSaveDraft: (values: FieldValueMap) => void;
  onExportPdf: (values: FieldValueMap) => void;
  onPrint?: () => void;
  isSubmitting?: boolean;
  isGeneratingPdf?: boolean;
}

export default function BcrPdfViewer({
  config,
  initialValues,
  clientId,
  selectedClientDetails,
  status = 'Pending',
  onBack,
  onClientSelect,
  onValuesChange,
  onSaveDraft,
  onExportPdf,
  onPrint,
  isSubmitting = false,
  isGeneratingPdf = false,
}: BcrPdfViewerProps) {
  const [values, setValues] = useState<FieldValueMap>(initialValues);
  const [zoom, setZoom] = useState<number>(1.45); // 1.45 defaults to Fit Width
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signatureModalField, setSignatureModalField] = useState<BcrFieldConfig | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const handleValueChange = (key: string, val: any) => {
    const updated = { ...valuesRef.current, [key]: val };
    setValues(updated);
    if (onValuesChange) onValuesChange(updated);
    setAutoSaveStatus('saving');
  };

  // Autosave draft interval
  useEffect(() => {
    if (autoSaveStatus !== 'saving') return;
    const timer = setTimeout(() => {
      onSaveDraft(valuesRef.current);
      setAutoSaveStatus('saved');
    }, 2500);

    return () => clearTimeout(timer);
  }, [values, autoSaveStatus, onSaveDraft]);

  const handleFieldSelect = (field: BcrFieldConfig) => {
    setActiveFieldKey(field.key);
    setCurrentPage(field.page);

    const pageEl = document.getElementById(`bcr-page-${field.page}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Filter matched search fields
  const matchedFields = config.fields.filter(
    (f) =>
      searchQuery.trim() !== '' &&
      (f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleJumpToSearchMatch = () => {
    if (matchedFields.length > 0) {
      const target = matchedFields[0];
      handleFieldSelect(target);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans text-slate-900 select-none bg-[#EEF2F7]">
      {/* Top Minimal Acrobat Toolbar */}
      <BcrToolbar
        title={config.title}
        subtitle={config.subtitle}
        status={status}
        clientId={clientId}
        selectedClientDetails={selectedClientDetails}
        onClientSelect={onClientSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResultsCount={matchedFields.length}
        onJumpToSearchMatch={handleJumpToSearchMatch}
        zoom={zoom}
        onZoomChange={setZoom}
        currentPage={currentPage}
        totalPages={config.totalPages}
        onPageChange={(pg) => {
          setCurrentPage(pg);
          const pageEl = document.getElementById(`bcr-page-${pg}`);
          if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth' });
        }}
        onBack={onBack}
        onSaveDraft={() => onSaveDraft(values)}
        onExportPdf={() => onExportPdf(values)}
        onPrint={handlePrint}
        isSubmitting={isSubmitting}
        isGeneratingPdf={isGeneratingPdf}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Main Full-Width Vector PDF Editor Workspace */}
      <main className="flex-1 overflow-auto flex justify-center p-8 scrollbar-thin scrollbar-thumb-slate-300 relative bg-[#EEF2F7]">
        <BcrPdfCanvas
          pdfUrl={config.pdfTemplateUrl}
          values={values}
          fields={config.fields}
          zoom={zoom}
          activeFieldKey={activeFieldKey}
          highlightSearchQuery={searchQuery}
          readOnly={false}
          showOverlays={true}
          onFieldClick={handleFieldSelect}
          onChangeValue={handleValueChange}
          onOpenSignatureModal={(f: BcrFieldConfig) => setSignatureModalField(f)}
          onVisiblePageChange={(pg) => setCurrentPage(pg)}
        />

        {/* Bottom-Right Floating Quick Action Dock */}
        <div className="fixed bottom-6 right-8 z-40 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.3)] text-white">
          <button
            onClick={() => onSaveDraft(values)}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 border border-slate-700/80"
          >
            {isSubmitting ? <Loader2 size={13} className="animate-spin text-[#F2AF00]" /> : null}
            Save Draft
          </button>

          <button
            onClick={() => onExportPdf(values)}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-[#F2AF00] hover:bg-[#d99d00] text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(242,175,0,0.35)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 size={13} className="animate-spin text-slate-950" /> : null}
            Export PDF
          </button>
        </div>
      </main>

      {/* Embedded Signature Pad Modal */}
      {signatureModalField && (
        <SignatureModal
          isOpen={!!signatureModalField}
          title={`Sign: ${signatureModalField.label}`}
          initialSignature={values[signatureModalField.key]}
          onClose={() => setSignatureModalField(null)}
          onSave={(base64) => {
            handleValueChange(signatureModalField.key, base64);
          }}
        />
      )}
    </div>
  );
}
