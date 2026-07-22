'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { BcrFieldConfig, FieldValueMap } from './types';
import BcrFieldOverlay from './BcrFieldOverlay';
import { Loader2, AlertCircle } from 'lucide-react';

if (typeof window !== 'undefined') {
  const version = pdfjsLib.version || '4.0.379';
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
}

interface BcrPdfCanvasProps {
  pdfUrl: string;
  values: FieldValueMap;
  fields: BcrFieldConfig[];
  zoom: number; // e.g. 1.0 (100%), 1.25 (125%)
  activeFieldKey?: string | null;
  highlightSearchQuery?: string;
  readOnly?: boolean;
  showOverlays?: boolean;
  onFieldClick?: (field: BcrFieldConfig) => void;
  onChangeValue?: (key: string, value: any) => void;
  onOpenSignatureModal?: (field: BcrFieldConfig) => void;
  onPageRendered?: (pageNum: number, totalPages: number) => void;
  onVisiblePageChange?: (pageNum: number) => void;
}

interface RenderedPage {
  pageNum: number;
  width: number;
  height: number;
}

export default function BcrPdfCanvas({
  pdfUrl,
  values,
  fields,
  zoom,
  activeFieldKey,
  highlightSearchQuery = '',
  readOnly = false,
  showOverlays = true,
  onFieldClick,
  onChangeValue,
  onOpenSignatureModal,
  onPageRendered,
  onVisiblePageChange,
}: BcrPdfCanvasProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pages, setPages] = useState<RenderedPage[]>([]);

  // Load PDF Document with standard fonts and character maps
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    if (!pdfUrl) {
      setError('BCR PDF template URL is missing.');
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
        const pageCount = doc.numPages;

        const renderedPages: RenderedPage[] = [];
        const pagePromises = [];

        for (let i = 1; i <= pageCount; i++) {
          pagePromises.push(doc.getPage(i));
        }

        Promise.all(pagePromises)
          .then((loadedPages) => {
            if (!isMounted) return;
            loadedPages.forEach((pg, idx) => {
              const vp = pg.getViewport({ scale: 1 });
              renderedPages.push({
                pageNum: idx + 1,
                width: vp.width,
                height: vp.height,
              });
            });
            setPages(renderedPages);
            setLoading(false);
            if (onPageRendered) onPageRendered(1, pageCount);
          })
          .catch((err) => {
            if (!isMounted) return;
            console.error('Error parsing BCR PDF pages:', err);
            setError('Failed to parse BCR PDF pages.');
            setLoading(false);
          });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading BCR PDF document:', err);
        setError('Failed to render BCR PDF template. Please verify file path.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-red-500 bg-white rounded-3xl border border-red-200 shadow-xl max-w-md mx-auto my-12">
        <AlertCircle size={36} className="mb-3 text-red-500" />
        <p className="font-semibold text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 select-none relative min-h-full w-full">
      {loading && (
        <div className="flex flex-col items-center gap-6 my-12">
          <div className="w-[680px] h-[880px] bg-white rounded-[16px] shadow-[0_20px_80px_rgba(0,0,0,0.18)] border border-slate-200 p-12 flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="h-6 w-52 bg-slate-200 rounded-md" />
              <div className="h-6 w-24 bg-slate-200 rounded-md" />
            </div>
            <div className="space-y-4 pt-4">
              <div className="h-4 w-full bg-slate-100 rounded-md" />
              <div className="h-4 w-5/6 bg-slate-100 rounded-md" />
              <div className="h-4 w-4/6 bg-slate-100 rounded-md" />
            </div>
            <div className="flex items-center justify-center my-auto text-slate-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#F2AF00]" />
              <span className="font-semibold text-sm tracking-wide text-slate-700">
                Rendering Official Sun Life PDF Canvas...
              </span>
            </div>
          </div>
        </div>
      )}

      {pdfDoc &&
        pages.map((pg) => (
          <PageCanvasItem
            key={pg.pageNum}
            pdfDoc={pdfDoc}
            pageMeta={pg}
            zoom={zoom}
            values={values}
            fields={fields}
            activeFieldKey={activeFieldKey}
            highlightSearchQuery={highlightSearchQuery}
            readOnly={readOnly}
            showOverlays={showOverlays}
            onFieldClick={onFieldClick}
            onChangeValue={onChangeValue}
            onOpenSignatureModal={onOpenSignatureModal}
            onVisible={() => onVisiblePageChange && onVisiblePageChange(pg.pageNum)}
          />
        ))}
    </div>
  );
}

// Single Page Renderer Component with Page Isolation & Exact Scaling
function PageCanvasItem({
  pdfDoc,
  pageMeta,
  zoom,
  values,
  fields,
  activeFieldKey = null,
  highlightSearchQuery = '',
  readOnly,
  showOverlays,
  onFieldClick = () => {},
  onChangeValue = () => {},
  onOpenSignatureModal = () => {},
  onVisible,
}: {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageMeta: RenderedPage;
  zoom: number;
  values: FieldValueMap;
  fields: BcrFieldConfig[];
  activeFieldKey?: string | null;
  highlightSearchQuery?: string;
  readOnly: boolean;
  showOverlays: boolean;
  onFieldClick?: (field: BcrFieldConfig) => void;
  onChangeValue?: (key: string, value: any) => void;
  onOpenSignatureModal?: (field: BcrFieldConfig) => void;
  onVisible?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRenderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const scale = zoom;
  const scaledWidth = pageMeta.width * scale;
  const scaledHeight = pageMeta.height * scale;

  // IntersectionObserver for page navigation tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (onVisible) onVisible();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  // High Resolution Vector Render
  useEffect(() => {
    let isCancelled = false;

    pdfDoc.getPage(pageMeta.pageNum).then((page) => {
      if (isCancelled) return;

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

      // Crisp Retina scaling factor (devicePixelRatio with minimum 2.0 multiplier)
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const crispScale = Math.max(2.0, dpr * 1.5);
      const viewport = page.getViewport({ scale: scale * crispScale });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(scaledWidth)}px`;
      canvas.style.height = `${Math.floor(scaledHeight)}px`;

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
            console.error('BCR PDF Canvas Render Error:', err);
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
  }, [pdfDoc, pageMeta.pageNum, scale, scaledWidth, scaledHeight]);

  return (
    <div
      ref={containerRef}
      id={`bcr-page-${pageMeta.pageNum}`}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
      className="relative bg-white rounded-[16px] border border-slate-200/90 shadow-[0_20px_80px_rgba(0,0,0,0.18)] transition-all duration-200 mb-12 last:mb-6 group shrink-0 overflow-hidden"
    >
      {/* Background Vector Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block pointer-events-none rounded-[16px]"
      />

      {/* Page-Isolated Scaled Overlay Layer */}
      {showOverlays && (
        <BcrFieldOverlay
          fields={fields}
          values={values}
          pageNumber={pageMeta.pageNum}
          pageWidth={pageMeta.width}
          pageHeight={pageMeta.height}
          scale={scale}
          activeFieldKey={activeFieldKey}
          highlightSearchQuery={highlightSearchQuery}
          readOnly={readOnly}
          onFieldClick={onFieldClick}
          onChangeValue={onChangeValue}
          onOpenSignatureModal={onOpenSignatureModal}
        />
      )}

      {/* Floating Page Number Badge */}
      <div className="absolute top-4 right-4 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700/60 z-30">
        Page {pageMeta.pageNum} of {pdfDoc.numPages}
      </div>
    </div>
  );
}
