'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { BcrFieldConfig, FieldValueMap } from './types';
import { ChevronLeft, ChevronRight, Eye, Loader2, AlertCircle } from 'lucide-react';

if (typeof window !== 'undefined') {
  const version = pdfjsLib.version || '4.0.379';
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
}

interface BcrPdfPreviewProps {
  pdfUrl: string;
  values: FieldValueMap;
  fields: BcrFieldConfig[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function BcrPdfPreview({
  pdfUrl,
  values,
  fields,
  currentPage,
  totalPages,
  onPageChange,
}: BcrPdfPreviewProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageMeta, setPageMeta] = useState<{ width: number; height: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRenderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    if (!pdfUrl) {
      setError('PDF template URL is missing.');
      setLoading(false);
      return;
    }

    const version = pdfjsLib.version || '4.0.379';
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
    });

    loadingTask.promise
      .then((doc) => {
        if (!isMounted) return;
        setPdfDoc(doc);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading BCR PDF template:', err);
        setError('Failed to load PDF template preview.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render Target Page Canvas
  useEffect(() => {
    if (!pdfDoc) return;
    let isCancelled = false;

    pdfDoc.getPage(currentPage).then((page) => {
      if (isCancelled) return;

      const vp = page.getViewport({ scale: 1 });
      setPageMeta({ width: vp.width, height: vp.height });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        activeRenderTaskRef.current = null;
      }

      // Crisp Retina resolution factor
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const renderScale = Math.max(2.0, dpr * 1.5);
      const viewport = page.getViewport({ scale: renderScale });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext: any = {
        canvasContext: ctx,
        viewport,
        enableWebGL: false,
      };

      const renderTask = page.render(renderContext);
      activeRenderTaskRef.current = renderTask;

      renderTask.promise
        .then(() => {
          if (activeRenderTaskRef.current === renderTask) {
            activeRenderTaskRef.current = null;
          }
        })
        .catch((err: any) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.error('BCR Preview Canvas Error:', err);
          }
        });
    });

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        activeRenderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage]);

  const pageFields = fields.filter((f) => f.page === currentPage);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-red-500 bg-white rounded-3xl border border-red-200 shadow-xl max-w-md mx-auto my-12">
        <AlertCircle size={36} className="mb-3 text-red-500" />
        <p className="font-semibold text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#EEF2F7] overflow-hidden select-none relative">
      {/* Top Preview Controls Bar */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-[#F2AF00]" />
          <h3 className="font-bold text-xs tracking-wide uppercase text-slate-100">Live PDF Preview</h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Read-only</span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-slate-200 font-bold px-2">
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
      </div>

      {/* Main Single Page Preview Workspace */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-6 scrollbar-thin scrollbar-thumb-slate-300 relative">
        {loading && (
          <div className="flex flex-col items-center gap-4 my-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#F2AF00]" />
            <span className="font-bold text-sm text-slate-600">Rendering Live PDF Preview Page...</span>
          </div>
        )}

        {pageMeta && (
          <div
            style={{
              width: `${pageMeta.width * 1.05}px`,
              height: `${pageMeta.height * 1.05}px`,
            }}
            className="relative bg-white rounded-[16px] border border-slate-200/90 shadow-[0_20px_80px_rgba(0,0,0,0.18)] transition-all duration-200 shrink-0 pointer-events-none"
          >
            {/* Background PDF Vector Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block w-full h-full rounded-[16px]"
            />

            {/* Live Visual Overlay Data Layer (Pure Display) */}
            <div className="absolute inset-0 z-20">
              {pageFields.map((field) => {
                const val = values[field.key];
                if (val === undefined || val === null || val === '') return null;

                const leftPercent = (field.x / pageMeta.width) * 100;
                const topPercent = ((pageMeta.height - (field.y + field.height)) / pageMeta.height) * 100;
                const widthPercent = (field.width / pageMeta.width) * 100;
                const heightPercent = (field.height / pageMeta.height) * 100;

                return (
                  <div
                    key={field.key}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                    className="absolute flex items-center overflow-hidden"
                  >
                    {field.type === 'signature' ? (
                      <img
                        src={val}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : field.type === 'checkbox' || field.type === 'radio' ? (
                      val ? (
                        <span className="font-black text-black text-[10px] leading-none px-0.5">✕</span>
                      ) : null
                    ) : (
                      <span
                        style={{
                          fontSize: `${field.fontSize || 8.5}pt`,
                          fontFamily: field.fontFamily || 'Helvetica, Arial, sans-serif',
                        }}
                        className="text-black font-semibold tracking-tight whitespace-pre-wrap leading-none"
                      >
                        {String(val)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
