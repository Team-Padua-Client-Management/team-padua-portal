'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import {
  PdfFormConfig,
  PdfFieldConfig,
  FieldValueMap,
  ViewMode,
  ThemeMode,
} from './types';
import PdfToolbar from './PdfToolbar';
import PdfSidebar from './PdfSidebar';
import FieldInspector from './FieldInspector';
import CompareMode from './CompareMode';
import SignatureModal from './SignatureModal';

const PdfCanvas = dynamic(() => import('@/app/components/pdf-engine/PdfCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 text-slate-400 font-medium text-sm">
      <Loader2 className="w-6 h-6 animate-spin text-[#F2AF00] mr-2" />
      Loading High-DPI Vector PDF Canvas...
    </div>
  ),
});

interface PdfViewerEngineProps {
  config: PdfFormConfig;
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

export default function PdfViewerEngine({
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
}: PdfViewerEngineProps) {
  const [values, setValues] = useState<FieldValueMap>(initialValues);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [zoom, setZoom] = useState<number>(1.45); // 1.45 defaults to Fit Width
  const [rotation, setRotation] = useState<number>(0);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<PdfFieldConfig | null>(null);
  const [signatureModalField, setSignatureModalField] = useState<PdfFieldConfig | null>(null);

  const handleValueChange = (key: string, val: any) => {
    const updated = { ...values, [key]: val };
    setValues(updated);
    if (onValuesChange) onValuesChange(updated);
  };

  const handleFieldSelect = (field: PdfFieldConfig) => {
    setActiveFieldKey(field.key);
    setSelectedField(field);
    setCurrentPage(field.page);

    // Scroll smoothly to target page element on PDF Canvas
    const pageEl = document.getElementById(`pdf-page-${field.page}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    <div
      className={`flex flex-col h-screen w-full overflow-hidden font-sans text-slate-900 select-none ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-[#EEF2F7]'
      }`}
    >
      {/* Top Acrobat Toolbar Header */}
      <PdfToolbar
        title={config.title}
        subtitle={config.subtitle}
        status={status}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoom={zoom}
        onZoomChange={setZoom}
        rotation={rotation}
        onRotateChange={setRotation}
        currentPage={currentPage}
        totalPages={config.totalPages}
        onPageChange={(pg) => {
          setCurrentPage(pg);
          const pageEl = document.getElementById(`pdf-page-${pg}`);
          if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth' });
        }}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onBack={onBack}
        onSaveDraft={() => onSaveDraft(values)}
        onExportPdf={() => onExportPdf(values)}
        onPrint={handlePrint}
        isSubmitting={isSubmitting}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* Main Workspace Body Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (320px) */}
        {viewMode !== 'compare' && (
          <PdfSidebar
            sections={config.sections}
            fields={config.fields}
            values={values}
            activeFieldKey={activeFieldKey}
            clientId={clientId}
            selectedClientDetails={selectedClientDetails}
            theme={theme}
            onClientSelect={onClientSelect}
            onFieldSelect={handleFieldSelect}
            onChangeValue={handleValueChange}
            onOpenSignatureModal={(f) => setSignatureModalField(f)}
            onPageSelect={(pg) => {
              setCurrentPage(pg);
              const pageEl = document.getElementById(`pdf-page-${pg}`);
              if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* Center Workspace (Remaining Width, #EEF2F7 Background) */}
        {viewMode === 'compare' ? (
          <CompareMode config={config} values={values} zoom={zoom} />
        ) : (
          <main
            className={`flex-1 overflow-auto flex justify-center p-8 scrollbar-thin scrollbar-thumb-slate-300 relative ${
              theme === 'dark' ? 'bg-slate-900' : 'bg-[#EEF2F7]'
            }`}
          >
            <PdfCanvas
              pdfUrl={config.pdfTemplateUrl}
              values={values}
              fields={config.fields}
              zoom={zoom}
              rotation={rotation}
              activeFieldKey={activeFieldKey}
              readOnly={viewMode === 'preview'}
              showOverlays={true}
              theme={theme}
              onFieldClick={handleFieldSelect}
              onChangeValue={handleValueChange}
              onOpenSignatureModal={(f: PdfFieldConfig) => setSignatureModalField(f)}
              onVisiblePageChange={(pg) => setCurrentPage(pg)}
            />

            {/* Bottom-Right Floating Quick Action Dock */}
            <div className="fixed bottom-6 right-8 z-40 flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.4)] text-white">
              <button
                onClick={() => onSaveDraft(values)}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 border border-slate-800"
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin text-[#F2AF00]" /> : null}
                Save Draft
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-800"
              >
                {viewMode === 'preview' ? 'Edit Mode' : 'Preview PDF'}
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
        )}

        {/* Right Field Inspector Panel (320px) */}
        {selectedField && viewMode === 'edit' && (
          <FieldInspector
            selectedField={selectedField}
            value={values[selectedField.key]}
            onClose={() => setSelectedField(null)}
            onChangeValue={handleValueChange}
          />
        )}
      </div>

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
