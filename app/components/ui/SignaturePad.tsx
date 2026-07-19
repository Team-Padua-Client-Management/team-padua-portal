import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, X, RotateCcw, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  initialSignature?: string | null;
  title?: string;
}

export default function SignaturePad({ onSignatureChange, initialSignature, title = "Signature" }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [signatureImage, setSignatureImage] = useState<string | null>(initialSignature || null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSignatureImage(base64String);
        onSignatureChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-none p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="flex bg-muted/50 p-1 rounded-none border border-border">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${mode === 'draw' ? 'bg-[#F4C542] text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <PenTool size={14} className="inline mr-1" /> Draw
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${mode === 'upload' ? 'bg-[#F4C542] text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Upload size={14} className="inline mr-1" /> Upload
          </button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-border bg-muted/20 min-h-[150px] flex items-center justify-center">
        {mode === 'draw' && !signatureImage ? (
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: 'w-full h-[150px] cursor-crosshair' }}
            onEnd={handleDrawEnd}
          />
        ) : mode === 'upload' && !signatureImage ? (
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-[150px] text-muted-foreground hover:text-foreground transition-colors">
            <Upload size={24} />
            <span className="text-sm font-medium">Click to upload signature image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        ) : (
          <div className="relative w-full h-[150px] flex items-center justify-center bg-white">
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors border border-transparent hover:border-red-500 bg-card rounded-none"
        >
          <RotateCcw size={14} /> Clear Signature
        </button>
      </div>
    </div>
  );
}
