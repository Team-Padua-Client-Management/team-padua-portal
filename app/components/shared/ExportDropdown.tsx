'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, File } from 'lucide-react';

interface ExportDropdownProps {
  onExport: (format: 'csv' | 'pdf' | 'word') => void;
}

export default function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4.5 py-2.5 bg-card border border-border text-text-secondary hover:text-text rounded-xl text-sm font-semibold hover:bg-surface-2 transition-all duration-200 select-none shadow-sm cursor-pointer"
      >
        <Download size={14} className="shrink-0" />
        <span>Export Data</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              onExport('csv');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-2 flex items-center gap-2.5 transition cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-500 shrink-0" />
            <span>Export CSV (.csv)</span>
          </button>
          
          <button
            onClick={() => {
              onExport('pdf');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-2 flex items-center gap-2.5 transition cursor-pointer"
          >
            <FileText size={14} className="text-amber-500 shrink-0" />
            <span>Export PDF (.pdf)</span>
          </button>

          <button
            onClick={() => {
              onExport('word');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-2 flex items-center gap-2.5 transition cursor-pointer"
          >
            <File size={14} className="text-blue-500 shrink-0" />
            <span>Export Word (.doc)</span>
          </button>
        </div>
      )}
    </div>
  );
}
