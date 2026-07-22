'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, Sparkles, PenTool } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Png: string) => void;
  title?: string;
  initialSignature?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSave,
  title = 'Sign Form',
  initialSignature,
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // dark navy/black ink

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    } else {
      setHasDrawn(false);
    }
  }, [isOpen, initialSignature]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleQuickSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    // Draw stylized signature
    ctx.beginPath();
    ctx.moveTo(50, 90);
    ctx.bezierCurveTo(80, 20, 120, 140, 160, 60);
    ctx.bezierCurveTo(180, 120, 240, 40, 280, 100);
    ctx.stroke();

    ctx.font = 'italic 28px "Brush Script MT", cursive, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Authorized Signature', 100, 105);

    setHasDrawn(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F2AF00]/20 flex items-center justify-center text-[#F2AF00]">
              <PenTool size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-[11px] text-slate-400">Draw your signature in the box below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6 bg-slate-50 flex flex-col items-center gap-3">
          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={440}
              height={160}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                <PenTool size={24} className="mb-1 opacity-40" />
                <span className="text-xs">Sign here with mouse or touch</span>
              </div>
            )}
            <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 uppercase font-mono tracking-wider pointer-events-none">
              Signature Area
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-xs">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <RotateCcw size={14} />
              Clear
            </button>
            <button
              onClick={handleQuickSignature}
              className="flex items-center gap-1.5 px-3 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg font-medium transition-colors"
            >
              <Sparkles size={14} />
              Quick Demo Signature
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasDrawn}
            className="px-6 py-2 bg-slate-900 text-white rounded-full font-medium text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Check size={16} />
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
}
