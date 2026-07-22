'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PdfFormConfig, FieldValueMap } from './types';

const PdfCanvas = dynamic(() => import('@/app/components/pdf-engine/PdfCanvas'), { ssr: false });

interface CompareModeProps {
  config: PdfFormConfig;
  values: FieldValueMap;
  zoom: number;
}

export default function CompareMode({ config, values, zoom }: CompareModeProps) {
  return (
    <div className="flex-1 w-full h-full bg-slate-900 overflow-auto p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-6 items-start min-h-full">
        {/* Left Side: Original Template */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Original Sun Life Template (Blank)
          </div>
          <div className="w-full bg-slate-950/40 rounded-2xl p-4 border border-slate-800 flex justify-center shadow-2xl">
            <PdfCanvas
              pdfUrl={config.pdfTemplateUrl}
              values={{}}
              fields={[]}
              zoom={zoom * 0.85} // scale slightly to fit side-by-side
              readOnly={true}
              showOverlays={false}
            />
          </div>
        </div>

        {/* Right Side: Filled PDF Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-emerald-950 text-emerald-300 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 border border-emerald-800 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Filled PDF (Live Dynamic Overlay)
          </div>
          <div className="w-full bg-slate-950/40 rounded-2xl p-4 border border-slate-800 flex justify-center shadow-2xl">
            <PdfCanvas
              pdfUrl={config.pdfTemplateUrl}
              values={values}
              fields={config.fields}
              zoom={zoom * 0.85}
              readOnly={true}
              showOverlays={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
