'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, RotateCcw, PenTool, ImageIcon } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  initialSignature?: string | null;
  title?: string;
}

export default function SignaturePad({ onSignatureChange, initialSignature, title = 'Signature' }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [signatureImage, setSignatureImage] = useState<string | null>(initialSignature || null);
  const [isDragging, setIsDragging] = useState(false);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setSignatureImage(null);
    onSignatureChange(null);
  };

  const handleDrawEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setSignatureImage(dataURL);
      onSignatureChange(dataURL);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSignatureImage(base64String);
      onSignatureChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) readFile(file);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="flex bg-slate-100 p-1 rounded-full">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${mode === 'draw' ? 'bg-amber-400 text-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <PenTool size={13} /> Draw
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${mode === 'upload' ? 'bg-amber-400 text-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Upload size={13} /> Upload
          </button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-2xl min-h-[150px] flex items-center justify-center overflow-hidden transition-colors duration-200">
        {mode === 'draw' && !signatureImage ? (
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: 'w-full h-[150px] cursor-crosshair' }}
            onEnd={handleDrawEnd}
          />
        ) : mode === 'upload' && !signatureImage ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-[150px] text-slate-400 hover:text-slate-600 transition-all duration-200 rounded-2xl ${isDragging ? 'bg-amber-50 text-amber-500' : ''
              }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <ImageIcon size={20} />
            </div>
            <span className="text-sm font-medium">Drag & drop or click to upload</span>
            <span className="text-[11px] text-slate-400">PNG or JPG signature image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        ) : (
          <div className="relative w-full h-[150px] flex items-center justify-center bg-white rounded-2xl">
            {signatureImage && (
              <img src={signatureImage} alt="Signature" className="max-h-full max-w-full object-contain pointer-events-none" />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors duration-200 border border-slate-200 hover:border-red-200 hover:bg-red-50 bg-white rounded-full"
        >
          <RotateCcw size={13} /> Clear Signature
        </button>
      </div>
    </div>
  );
}